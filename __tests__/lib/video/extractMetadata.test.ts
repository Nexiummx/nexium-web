import {
  extractRawMetadata,
  resolveVideoConfig,
} from "@/lib/video/extractMetadata";

describe("extractRawMetadata", () => {
  it("extracts all nexium meta tags from HTML", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="nexium:type" content="reel">
          <meta name="nexium:duration" content="15">
          <meta name="nexium:fps" content="30">
          <meta name="nexium:filename" content="my-flyer">
        </head>
        <body></body>
      </html>
    `;

    const metadata = extractRawMetadata(html);
    expect(metadata).toEqual({
      type: "reel",
      duration: "15",
      fps: "30",
      filename: "my-flyer",
    });
  });

  it("returns empty object when no meta tags present", () => {
    const html = "<html><head></head><body></body></html>";
    expect(extractRawMetadata(html)).toEqual({});
  });

  it("ignores non-nexium meta tags", () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="ignored">
          <meta name="nexium:type" content="story">
        </head>
      </html>
    `;
    expect(extractRawMetadata(html)).toEqual({ type: "story" });
  });

  it("handles self-closing meta tags", () => {
    const html = '<meta name="nexium:type" content="square" />';
    expect(extractRawMetadata(html)).toEqual({ type: "square" });
  });
});

describe("resolveVideoConfig", () => {
  const baseHtml = "<html></html>";

  it("uses hard default (story) when nothing is specified", () => {
    const config = resolveVideoConfig({ html: baseHtml }, {});
    expect(config.type).toBe("story");
    expect(config.width).toBe(1080);
    expect(config.height).toBe(1920);
    expect(config.durationSeconds).toBe(12);
    expect(config.fps).toBe(60);
  });

  it("applies preset from HTML metadata", () => {
    const config = resolveVideoConfig({ html: baseHtml }, { type: "square" });
    expect(config.type).toBe("square");
    expect(config.width).toBe(1080);
    expect(config.height).toBe(1080);
    expect(config.durationSeconds).toBe(6);
  });

  it("overrides preset with HTML metadata values", () => {
    const config = resolveVideoConfig(
      { html: baseHtml },
      { type: "story", duration: "20", fps: "60" }
    );
    expect(config.type).toBe("story");
    expect(config.width).toBe(1080);
    expect(config.durationSeconds).toBe(20);
    expect(config.fps).toBe(60);
  });

  it("body request overrides HTML metadata", () => {
    const config = resolveVideoConfig(
      { html: baseHtml, durationSeconds: 25, type: "reel" },
      { type: "story", duration: "10" }
    );
    expect(config.type).toBe("reel");
    expect(config.durationSeconds).toBe(25);
  });

  it("ignores invalid type values", () => {
    const config = resolveVideoConfig(
      { html: baseHtml },
      { type: "invalid-type" }
    );
    expect(config.type).toBe("story");
  });

  it("generates auto filename when not specified", () => {
    const config = resolveVideoConfig({ html: baseHtml }, {});
    expect(config.filename).toMatch(/^flyer-\d+$/);
  });

  it("uses filename from HTML metadata", () => {
    const config = resolveVideoConfig(
      { html: baseHtml },
      { filename: "my-custom-name" }
    );
    expect(config.filename).toBe("my-custom-name");
  });
});
