# html-to-png — Conversor de slides HTML a PNG (uso interno Nexium)

Herramienta local para convertir archivos HTML con slides a imágenes PNG individuales.
Pixel-perfect: respeta CSS, SVG inline, radial-gradient, y fuentes de Google Fonts.

---

## Requisitos

- Node.js 18+
- Dependencias instaladas (`npm install`)
- Token de acceso en `.env.local`

---

## Configuración (una sola vez)

Agrega esta línea a tu archivo `.env.local` (en la raíz del proyecto):

```
NEXIUM_TOOL_TOKEN=pon_aqui_tu_token_secreto
```

El token puede ser cualquier cadena. Ejemplo: `nexium-slides-2026`

---

## Uso

```bash
# Forma básica
npm run html-to-png -- ./mi-archivo.html

# Con directorio de salida personalizado
npm run html-to-png -- ./mi-archivo.html ./mi-carpeta-de-salida

# Directo con node
node scripts/html-to-png.cjs ./mi-archivo.html
```

Los PNGs se guardan en `output/slides/` por defecto:

```
output/slides/
  slide-01.png
  slide-02.png
  slide-03.png
  ...
```

---

## Estructura esperada del HTML

El script detecta automáticamente todos los elementos con clase `.post` y captura
cada uno como un PNG individual. El HTML de ejemplo de Nexium usa:

```html
<div class="post s4">
  <!-- contenido del slide -->
</div>
```

Puedes usar cualquier HTML siempre que los slides sean elementos `.post`.

---

## Notas

- Las fuentes de Google Fonts requieren conexión a internet al momento del render.
- Los PNGs en `output/slides/` están en `.gitignore` y NO se suben al repositorio.
- El script corre solo en tu máquina local, nunca en Vercel ni en producción.
- El token protege contra ejecución accidental sin credenciales.

---

## Resolución de problemas

| Problema | Solución |
|---|---|
| `ERROR: Falta el token de acceso` | Agrega `NEXIUM_TOOL_TOKEN=...` en `.env.local` |
| `No se encontraron elementos .post` | Verifica que el HTML tenga elementos con clase `post` |
| Fuentes no cargando (texto genérico) | Verifica conexión a internet durante el render |
| Slides cortados o mal dimensionados | Verifica que cada `.post` tenga `width` y `height` fijos en el CSS |
