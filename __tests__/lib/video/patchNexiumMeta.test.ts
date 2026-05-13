import { setNexiumMetaContent } from "@/lib/video/patchNexiumMeta";

describe("setNexiumMetaContent", () => {
  it("reemplaza un meta existente", () => {
    const html = `<head><meta name="nexium:duration" content="12" /></head>`;
    const out = setNexiumMetaContent(html, "duration", "28");
    expect(out).toContain('content="28"');
    expect(out).not.toContain('content="12"');
  });

  it("inserta antes de </head> si no existe", () => {
    const html = "<head><title>x</title></head><body></body>";
    const out = setNexiumMetaContent(html, "fps", "60");
    expect(out).toContain('name="nexium:fps"');
    expect(out).toContain('content="60"');
  });
});
