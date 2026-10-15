import { buildPath, createUploadTicket, getConfig, StarmodaError } from "@/lib/starmoda/storage";

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

  it.each([
    ["../x", "a.jpg"],
    ["pmabc123", "../a.jpg"],
    ["pmabc123", "a/b.jpg"],
    ["pmabc123", "a.png"],
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
