import type Anthropic from "@anthropic-ai/sdk";
import { gtinOk, parseImage, readTag } from "@/lib/starmoda/etiqueta";
import { StarmodaError } from "@/lib/starmoda/storage";

type Reply = { text?: string; stop_reason?: string };
function msg(r: Reply) {
  return { stop_reason: r.stop_reason || "end_turn", content: r.text === undefined ? [] : [{ type: "text", text: r.text }] };
}
function fakeClient(...replies: Reply[]) {
  const create = jest.fn();
  replies.forEach((r) => create.mockResolvedValueOnce(msg(r)));
  return { client: { beta: { messages: { create } } } as unknown as Anthropic, create };
}
const balam = { barcode: "7506655493547", style: "BL7571", color: "MEDIUM MEDIO", size: "7 (28)", brand: "Balam Denim" };
const img = { mediaType: "image/jpeg" as const, data: "QUJD" };

describe("gtinOk", () => {
  it.each([
    ["7506655493547", true],
    ["7506655493548", false],
    ["036000291452", true],
    ["96385074", true],
    ["12345", false],
  ])("%s → %p", (c, ok) => expect(gtinOk(c)).toBe(ok));
});

describe("parseImage", () => {
  it("separa tipo y datos", () => {
    expect(parseImage("data:image/jpeg;base64,QUJD")).toEqual({ mediaType: "image/jpeg", data: "QUJD" });
  });
  it.each([5, "hola", "data:image/gif;base64,QUJD", "data:text/plain;base64,QUJD"])("rechaza %p", (v) => {
    expect(() => parseImage(v)).toThrow(StarmodaError);
  });
});

describe("readTag", () => {
  it("lectura buena con Haiku: no llama a Opus", async () => {
    const { client, create } = fakeClient({ text: JSON.stringify({ ...balam, barcode: "7506655 493547", color: "MEDIUM  MEDIO" }) });
    expect(await readTag(img, client)).toEqual({ ...balam, model: "claude-haiku-5-5" });
    expect(create).toHaveBeenCalledTimes(1);
    const req = create.mock.calls[0][0];
    expect(req.model).toBe("claude-haiku-5-5");
    expect(req.fallbacks).toBeUndefined();
    expect(req.output_config.format.type).toBe("json_schema");
    expect(req.messages[0].content[0]).toEqual({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: "QUJD" } });
  });

  it("código con dígito incorrecto en Haiku → reintenta con Opus", async () => {
    const { client, create } = fakeClient(
      { text: JSON.stringify({ ...balam, barcode: "7506655493548" }) },
      { text: JSON.stringify(balam) }
    );
    expect(await readTag(img, client)).toEqual({ ...balam, model: "claude-opus-5-5" });
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0].model).toBe("claude-opus-5-5");
    expect(create.mock.calls[1][0].fallbacks).toBe("default");
  });

  it("Haiku sin estilo y Opus falla → se queda con lo de Haiku", async () => {
    const { client } = fakeClient({ text: JSON.stringify({ ...balam, style: "" }) }, { text: "no sé" });
    expect(await readTag(img, client)).toMatchObject({ barcode: "7506655493547", style: "", model: "claude-haiku-5-5" });
  });

  it("Haiku rechaza → Opus lee", async () => {
    const { client } = fakeClient({ stop_reason: "refusal" }, { text: JSON.stringify(balam) });
    expect(await readTag(img, client)).toMatchObject({ style: "BL7571", model: "claude-opus-5-5" });
  });

  it("ninguno lee → error claro", async () => {
    const { client } = fakeClient({ text: "no sé" }, { text: "tampoco" });
    await expect(readTag(img, client)).rejects.toMatchObject({ message: "lectura_ilegible" });
  });
});
