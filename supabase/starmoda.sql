-- ============================================================
-- Star Moda · Captura de catálogo — Supabase
-- Córrelo completo en SQL Editor › New query › Run.
-- Se puede volver a correr sin perder datos.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- Catálogo: un documento con todas las prendas y el vocabulario.
create table if not exists public.starmoda_catalogo (
  id          text primary key,
  payload     jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

-- Historial: cada guardado deja una copia. Si algo se pisa o se borra,
-- de aquí se recupera.
create table if not exists public.starmoda_historial (
  id        bigint generated always as identity primary key,
  doc       text not null,
  payload   jsonb not null,
  saved_at  timestamptz not null default now(),
  saved_by  text
);
create index if not exists starmoda_historial_doc_idx
  on public.starmoda_historial (doc, saved_at desc);

-- Códigos de acceso. Se guarda el hash, nunca el código.
create table if not exists public.starmoda_acceso (
  code_hash  text primary key,
  nombre     text not null,
  activo     boolean not null default true,
  creado     timestamptz not null default now()
);

-- RLS encendido y SIN políticas: con la llave pública (anon) nadie
-- puede leer ni escribir estas tablas directamente. Solo se entra por
-- las dos funciones de abajo, que validan el código.
alter table public.starmoda_catalogo  enable row level security;
alter table public.starmoda_historial enable row level security;
alter table public.starmoda_acceso    enable row level security;
revoke all on public.starmoda_catalogo, public.starmoda_historial, public.starmoda_acceso from anon, authenticated;

-- Valida el código y regresa a quién pertenece.
create or replace function public.starmoda_quien(p_code text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_nombre text;
begin
  select nombre into v_nombre
    from starmoda_acceso
   where code_hash = encode(digest(coalesce(p_code, ''), 'sha256'), 'hex')
     and activo;
  if v_nombre is null then
    perform pg_sleep(0.5);  -- frena intentos al azar
    raise exception 'codigo_invalido' using errcode = '28000';
  end if;
  return v_nombre;
end $$;

-- Leer el catálogo.
create or replace function public.starmoda_get(p_code text, p_doc text default 'principal')
returns table (payload jsonb, updated_at timestamptz, updated_by text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform starmoda_quien(p_code);
  return query
    select c.payload, c.updated_at, c.updated_by
      from starmoda_catalogo c
     where c.id = p_doc;
end $$;

-- Guardar el catálogo (la app ya juntó los cambios prenda por prenda).
create or replace function public.starmoda_save(p_code text, p_payload jsonb, p_doc text default 'principal')
returns timestamptz
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_quien text;
  v_when  timestamptz := now();
begin
  v_quien := starmoda_quien(p_code);
  if coalesce(jsonb_typeof(p_payload -> 'products'), '') <> 'array' then
    raise exception 'payload_invalido';
  end if;
  insert into starmoda_catalogo (id, payload, updated_at, updated_by)
       values (p_doc, p_payload, v_when, v_quien)
  on conflict (id) do update
       set payload = excluded.payload,
           updated_at = excluded.updated_at,
           updated_by = excluded.updated_by;
  insert into starmoda_historial (doc, payload, saved_at, saved_by)
       values (p_doc, p_payload, v_when, v_quien);
  return v_when;
end $$;

revoke all on function public.starmoda_quien(text) from public, anon, authenticated;
revoke all on function public.starmoda_get(text, text) from public;
revoke all on function public.starmoda_save(text, jsonb, text) from public;
grant execute on function public.starmoda_get(text, text) to anon, authenticated;
grant execute on function public.starmoda_save(text, jsonb, text) to anon, authenticated;

-- El servidor de Nexium (Vercel) valida el código antes de firmar una
-- subida de fotos. Usa la llave secreta, que nunca llega al navegador.
grant execute on function public.starmoda_quien(text) to service_role;

-- Fotos: bucket público de solo lectura (Shopify las descarga al importar
-- el CSV). Sin políticas: con la llave pública nadie puede subir, listar ni
-- borrar; solo se sube con la URL firmada que da /api/starmoda/upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('starmoda-fotos', 'starmoda-fotos', true, 2097152, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- Star Moda · Celular como escáner (enlace por QR)
-- La computadora abre una sesión con su código de acceso y muestra un QR
-- con un token aleatorio. El celular solo conoce ese token: con él puede
-- MANDAR códigos de barras, pero no leer el catálogo. La computadora lee
-- la cola con su código de acceso. La sesión vence en 12 horas.
-- ============================================================
create table if not exists public.starmoda_scan_sesion (
  token       text primary key,
  creado      timestamptz not null default now(),
  expira      timestamptz not null,
  creado_por  text
);
create table if not exists public.starmoda_scan (
  id      bigint generated always as identity primary key,
  token   text not null references public.starmoda_scan_sesion(token) on delete cascade,
  tipo    text not null default 'codigo',
  codigo  text not null default '',
  creado  timestamptz not null default now()
);
create index if not exists starmoda_scan_token_idx on public.starmoda_scan (token, id);
alter table public.starmoda_scan_sesion enable row level security;
alter table public.starmoda_scan        enable row level security;
revoke all on public.starmoda_scan_sesion, public.starmoda_scan from anon, authenticated;

-- Computadora: abre una sesión nueva (y borra las vencidas).
create or replace function public.starmoda_scan_abrir(p_code text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_quien text; v_token text; v_expira timestamptz := now() + interval '12 hours';
begin
  v_quien := starmoda_quien(p_code);
  delete from starmoda_scan_sesion where expira < now() - interval '1 day';
  v_token := encode(extensions.gen_random_bytes(12), 'hex');
  insert into starmoda_scan_sesion (token, expira, creado_por) values (v_token, v_expira, v_quien);
  return json_build_object('token', v_token, 'expira', v_expira);
end $$;

-- Celular: manda un código, una foto ya subida al bucket (su ruta
-- cel<token>/…jpg) o un "hola" al abrir el enlace.
create or replace function public.starmoda_scan_enviar(p_token text, p_codigo text, p_tipo text default 'codigo')
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_id bigint;
begin
  if not exists (select 1 from starmoda_scan_sesion where token = p_token and expira > now()) then
    perform pg_sleep(0.3);
    raise exception 'sesion_vencida' using errcode = '28000';
  end if;
  if p_tipo not in ('codigo', 'foto', 'hola') then raise exception 'tipo_invalido'; end if;
  if p_tipo = 'codigo' and coalesce(p_codigo, '') !~ '^[A-Za-z0-9.\-]{4,30}$' then
    raise exception 'codigo_invalido_formato';
  end if;
  if p_tipo = 'foto' and coalesce(p_codigo, '') !~ ('^cel' || p_token || '/[a-z0-9-]{1,120}\.jpg$') then
    raise exception 'foto_invalida';
  end if;
  if (select count(*) from starmoda_scan where token = p_token and creado > now() - interval '10 seconds') > 60 then
    raise exception 'demasiados_codigos';
  end if;
  insert into starmoda_scan (token, tipo, codigo)
       values (p_token, p_tipo, case when p_tipo = 'hola' then '' else p_codigo end)
    returning id into v_id;
  return v_id;
end $$;

-- Servidor (Vercel, con la llave secreta): ¿el enlace del celular sigue
-- vigente? Así firma la subida de una foto sin pedir el código de acceso.
create or replace function public.starmoda_scan_valida(p_token text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (select 1 from starmoda_scan_sesion where token = p_token and expira > now());
$$;

-- Computadora: lee lo que mandó el celular desde el último id visto.
create or replace function public.starmoda_scan_leer(p_code text, p_token text, p_desde bigint default 0)
returns table (id bigint, tipo text, codigo text, creado timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform starmoda_quien(p_code);
  return query
    select s.id, s.tipo, s.codigo, s.creado
      from starmoda_scan s
     where s.token = p_token and s.id > coalesce(p_desde, 0)
     order by s.id
     limit 200;
end $$;

revoke all on function public.starmoda_scan_abrir(text) from public;
revoke all on function public.starmoda_scan_enviar(text, text, text) from public;
revoke all on function public.starmoda_scan_leer(text, text, bigint) from public;
grant execute on function public.starmoda_scan_abrir(text) to anon, authenticated;
grant execute on function public.starmoda_scan_enviar(text, text, text) to anon, authenticated;
grant execute on function public.starmoda_scan_leer(text, text, bigint) to anon, authenticated;
revoke all on function public.starmoda_scan_valida(text) from public, anon, authenticated;
grant execute on function public.starmoda_scan_valida(text) to service_role;

-- ============================================================
-- CÓDIGOS: cambia los textos entre comillas por códigos largos y
-- difíciles de adivinar (ej. "sm-7Kq2-vX9p-Lm4t"). Uno por persona,
-- así el historial dice quién guardó.
-- ============================================================
insert into public.starmoda_acceso (code_hash, nombre)
values
  (encode(extensions.digest('CAMBIA-ESTE-CODIGO-CAPTURA', 'sha256'), 'hex'), 'Captura Star Moda'),
  (encode(extensions.digest('CAMBIA-ESTE-CODIGO-NEXIUM',  'sha256'), 'hex'), 'Nexium')
on conflict (code_hash) do nothing;

-- Útiles:
-- Quitar acceso a alguien:
--   update public.starmoda_acceso set activo = false where nombre = 'Captura Star Moda';
-- Ver los últimos guardados:
--   select id, saved_at, saved_by, jsonb_array_length(payload->'products') as prendas
--     from public.starmoda_historial order by saved_at desc limit 20;
-- Recuperar una versión del historial (cambia el id):
--   update public.starmoda_catalogo c set payload = h.payload, updated_at = now()
--     from public.starmoda_historial h where h.id = 123 and c.id = h.doc;
