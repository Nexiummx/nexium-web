import {
  buildFormatArgs,
  cleanYtDlpError,
  parseVideoUrl,
  sanitizeFilename,
  summarizeInfo,
} from "@/lib/downloader/ytdlp";

describe("parseVideoUrl", () => {
  it("accepts public http(s) URLs", () => {
    expect(parseVideoUrl("  https://www.youtube.com/watch?v=abc ")).toBe(
      "https://www.youtube.com/watch?v=abc"
    );
    expect(parseVideoUrl("http://vimeo.com/123")).toBe("http://vimeo.com/123");
  });

  it("rejects empty or malformed input", () => {
    expect(() => parseVideoUrl("")).toThrow("Pega la URL");
    expect(() => parseVideoUrl(undefined)).toThrow("Pega la URL");
    expect(() => parseVideoUrl("no es url")).toThrow("no es válida");
  });

  it("rejects non-http protocols (e.g. yt-dlp flags or local files)", () => {
    expect(() => parseVideoUrl("file:///etc/passwd")).toThrow("http(s)");
    expect(() => parseVideoUrl("--exec=rm")).toThrow();
  });

  it("rejects private and loopback hosts", () => {
    for (const u of [
      "http://localhost:3000/x",
      "http://127.0.0.1/x",
      "http://10.0.0.5/x",
      "http://192.168.1.1/x",
      "http://172.20.0.1/x",
      "http://169.254.169.254/latest/meta-data",
      "http://[::1]/x",
    ]) {
      expect(() => parseVideoUrl(u)).toThrow("red privada");
    }
  });
});

describe("buildFormatArgs", () => {
  it("extracts MP3 for audio", () => {
    const args = buildFormatArgs("audio");
    expect(args).toContain("-x");
    expect(args).toContain("mp3");
  });

  it("caps resolution and merges to mp4", () => {
    const args = buildFormatArgs("720");
    expect(args).toContain("res:720,vcodec:h264,ext:mp4:m4a");
    expect(args).toContain("--merge-output-format");
    expect(args).toContain("mp4");
  });

  it("does not cap resolution for best", () => {
    expect(buildFormatArgs("best").join(" ")).not.toMatch(/res:/);
  });
});

describe("summarizeInfo", () => {
  it("extracts metadata and unique video heights sorted desc", () => {
    const info = summarizeInfo({
      id: "abc",
      title: "Mi video",
      uploader: "Nexium",
      extractor_key: "Youtube",
      duration: 125,
      thumbnail: "https://img/x.jpg",
      webpage_url: "https://youtube.com/watch?v=abc",
      formats: [
        { height: 720, vcodec: "avc1" },
        { height: 1080, vcodec: "avc1" },
        { height: 720, vcodec: "vp9" },
        { height: null, vcodec: "none" },
        { height: 360, vcodec: "none" },
      ],
    });
    expect(info).toEqual({
      id: "abc",
      title: "Mi video",
      uploader: "Nexium",
      platform: "Youtube",
      durationSeconds: 125,
      thumbnail: "https://img/x.jpg",
      webpageUrl: "https://youtube.com/watch?v=abc",
      heights: [1080, 720],
    });
  });

  it("tolerates missing fields", () => {
    const info = summarizeInfo({});
    expect(info.title).toBe("video");
    expect(info.heights).toEqual([]);
    expect(info.durationSeconds).toBeNull();
  });
});

describe("sanitizeFilename", () => {
  it("strips accents and unsafe characters", () => {
    expect(sanitizeFilename('Canción "nueva" / 2026?.mp4')).toBe("Cancion nueva 2026.mp4");
  });

  it("falls back to 'video' when empty", () => {
    expect(sanitizeFilename("???")).toBe("video");
  });
});

describe("cleanYtDlpError", () => {
  it("returns the last ERROR line without prefix", () => {
    const stderr =
      "WARNING: algo\nERROR: [generic] Unsupported URL: https://x.com\n";
    expect(cleanYtDlpError(stderr)).toBe("[generic] Unsupported URL: https://x.com");
  });
});
