import { buildPath, checkSetup, createUploadTicket, getConfig, keyKind, StarmodaError } from "@/lib/starmoda/storage";

const cfg = { url: "https://abc.supabase.co", key: "sb_secret_x" };

function res(status: number, body: unknown): Response {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return new Response(text, { status });
}

describe("buildPath", () => {
  it("arma <prenda>/<archivo>", () => {
    expect(buildPath("pmabc123", "blusa-marfil-negro-1-k3x9.jpg")).toBe(
      "pmabc123/blusa-marfil-negro-1-k3x9.jpg"
    );
  });

  it("acepta PNG", () => {
    expect(buildPath("pmabc123", "blusa-1-k3x9.png")).toBe("pmabc123/blusa-1-k3x9.png");
  });

  it.each([
    ["../x", "a.jpg"],
    ["pmabc123", "../a.jpg"],
    ["pmabc123", "a/b.jpg"],
    ["pmabc123", "a.gif"],
    ["pmabc123", "A.jpg"],
    ["pmabc123", 5],
  ])("rechaza %p / %p", (id, name) => {
    expect(() => buildPath(id, name)).toThrow(StarmodaError);
  });
});

describe("getConfig", () => {
  it("falla con 501 sin llave secreta", () => {
    expect(() => getConfig({ NEXT_PUBLIC_SUPABASE_URL: "https://a.supabase.co" } as unknown as NodeJS.ProcessEnv)).toThrow(
      expect.objectContaining({ status: 501 })
    );
  });
});

describe("createUploadTicket", () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("valida el código y firma la subida", async () => {
    fetchMock
      .mockResolvedValueOnce(res(200, '"Nexium"'))
      .mockResolvedValueOnce(res(200, { url: "/object/upload/sign/starmoda-fotos/p1234/a.jpg?token=T" }));

    const t = await createUploadTicket({ code: "sm-1", productId: "p1234", fileName: "a.jpg" }, cfg);

    expect(fetchMock.mock.calls[0][0]).toBe("https://abc.supabase.co/rest/v1/rpc/starmoda_quien");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ p_code: "sm-1" });
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://abc.supabase.co/storage/v1/object/upload/sign/starmoda-fotos/p1234/a.jpg"
    );
    expect(t).toEqual({
      path: "p1234/a.jpg",
      uploadUrl: "https://abc.supabase.co/storage/v1/object/upload/sign/starmoda-fotos/p1234/a.jpg?token=T",
      publicUrl: "https://abc.supabase.co/storage/v1/object/public/starmoda-fotos/p1234/a.jpg",
    });
  });

  it("rechaza un código inválido sin firmar nada", async () => {
    fetchMock.mockResolvedValueOnce(res(403, { message: "codigo_invalido" }));
    await expect(
      createUploadTicket({ code: "malo", productId: "p1234", fileName: "a.jpg" }, cfg)
    ).rejects.toMatchObject({ message: "codigo_invalido", status: 403 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rechaza un código vacío sin llamar a Supabase", async () => {
    await expect(
      createUploadTicket({ code: "", productId: "p1234", fileName: "a.jpg" }, cfg)
    ).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("checkSetup", () => {
  const env = { SUPABASE_URL: "https://abc.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_x" } as unknown as NodeJS.ProcessEnv;
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("reporta falta de configuración sin llamar a Supabase", async () => {
    expect(await checkSetup("sm-1", {} as unknown as NodeJS.ProcessEnv)).toEqual({
      config: false, code: null, bucket: null, error: "storage_no_configurado",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("todo bien", async () => {
    fetchMock.mockResolvedValueOnce(res(200, '"Nexium"')).mockResolvedValueOnce(res(200, { id: "starmoda-fotos", public: true }));
    expect(await checkSetup("sm-1", env)).toEqual({ config: true, code: true, bucket: true, keyKind: "secret", project: "abc" });
    expect(fetchMock.mock.calls[1][0]).toBe("https://abc.supabase.co/storage/v1/bucket/starmoda-fotos");
  });

  it("código malo y bucket inexistente", async () => {
    fetchMock
      .mockResolvedValueOnce(res(403, { message: "codigo_invalido" }))
      .mockResolvedValueOnce(res(400, { statusCode: "404", error: "Bucket not found" }));
    expect(await checkSetup("malo", env)).toMatchObject({ config: true, code: false, bucket: false });
  });

  it("llave secreta incorrecta", async () => {
    fetchMock.mockResolvedValueOnce(res(401, { message: "Invalid API key" })).mockResolvedValueOnce(res(401, {}));
    expect(await checkSetup("sm-1", env)).toMatchObject({
      config: true, code: null, bucket: null, error: "supabase_401", detail: "Invalid API key", keyKind: "secret",
    });
  });
});

describe("keyKind y limpieza de variables", () => {
  const jwt = (role: string) => ["x", Buffer.from(JSON.stringify({ role })).toString("base64url"), "y"].join(".");

  it("reconoce cada tipo de llave", () => {
    expect(keyKind("sb_secret_abc")).toBe("secret");
    expect(keyKind("sb_publishable_abc")).toBe("publishable");
    expect(keyKind(jwt("service_role"))).toBe("service_role");
    expect(keyKind(jwt("anon"))).toBe("anon");
    expect(keyKind("cualquier-cosa")).toBe("desconocida");
  });

  it("quita espacios, saltos de línea y comillas pegados en Vercel", () => {
    const cfg = getConfig({
      SUPABASE_URL: ' "https://abc.supabase.co/" \n',
      SUPABASE_SERVICE_ROLE_KEY: "'sb_secret_x'\n",
    } as unknown as NodeJS.ProcessEnv);
    expect(cfg).toEqual({ url: "https://abc.supabase.co", key: "sb_secret_x" });
  });
});
