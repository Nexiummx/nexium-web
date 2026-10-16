import type Anthropic from "@anthropic-ai/sdk";
import { parseImage, readTag } from "@/lib/starmoda/etiqueta";
import { StarmodaError } from "@/lib/starmoda/storage";

function fakeClient(reply: { text?: string; stop_reason?: string }) {
  const create = jest.fn().mockResolvedValue({
    stop_reason: reply.stop_reason || "end_turn",
    content: reply.text === undefined ? [] : [{ type: "text", text: reply.text }],
  });
  return { client: { beta: { messages: { create } } } as unknown as Anthropic, create };
}

describe("parseImage", () => {
  it("separa tipo y datos", () => {
    expect(parseImage("data:image/jpeg;base64,QUJD")).toEqual({ mediaType: "image/jpeg", data: "QUJD" });
  });
  it.each([5, "hola", "data:image/gif;base64,QUJD", "data:text/plain;base64,QUJD"])("rechaza %p", (v) => {
    expect(() => parseImage(v)).toThrow(StarmodaError);
  });
});

describe("readTag", () => {
  const img = { mediaType: "image/jpeg" as const, data: "QUJD" };

  it("lee la etiqueta de Balam y limpia el código", async () => {
    const { client, create } = fakeClient({
      text: JSON.stringify({ barcode: "7506655 493547", style: "BL7571", color: "MEDIUM  MEDIO", size: "7 (28)", brand: "Balam Denim" }),
    });
    expect(await readTag(img, client)).toEqual({
      barcode: "7506655493547", style: "BL7571", color: "MEDIUM MEDIO", size: "7 (28)", brand: "Balam Denim",
    });
    const req = create.mock.calls[0][0];
    expect(req.model).toBe("claude-opus-5-5");
    expect(req.fallbacks).toBe("default");
    expect(req.output_config.format.type).toBe("json_schema");
    expect(req.messages[0].content[0]).toEqual({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: "QUJD" } });
  });

  it("rechazo del modelo → error claro", async () => {
    const { client } = fakeClient({ stop_reason: "refusal" });
    await expect(readTag(img, client)).rejects.toMatchObject({ message: "lectura_rechazada" });
  });

  it("respuesta que no es JSON → error claro", async () => {
    const { client } = fakeClient({ text: "no sé" });
    await expect(readTag(img, client)).rejects.toMatchObject({ message: "lectura_ilegible" });
  });
});
