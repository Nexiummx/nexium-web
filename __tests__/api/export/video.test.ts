import { POST } from "@/app/api/export/video/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/video/captureFrames", () => ({
  captureFrames: jest
    .fn()
    .mockResolvedValue(
      Array.from({ length: 360 }, (_, i) => `/tmp/frame-${i}.png`)
    ),
}));

jest.mock("@/lib/video/encodeVideo", () => ({
  encodeVideo: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@vercel/blob", () => ({
  put: jest.fn().mockResolvedValue({
    url: "https://blob.vercel-storage.com/videos/flyer-123.mp4",
  }),
}));

jest.mock("fs/promises", () => ({
  mkdtemp: jest.fn().mockResolvedValue("/tmp/nexium-test"),
  readFile: jest.fn().mockResolvedValue(Buffer.from("fake-mp4-data")),
  rm: jest.fn().mockResolvedValue(undefined),
}));

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/export/video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/export/video", () => {
  it("returns 400 if html is missing", async () => {
    const res = await POST(makeRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain("html field is required");
  });

  it("returns 400 if duration is out of range", async () => {
    const res = await POST(
      makeRequest({ html: "<html></html>", durationSeconds: 999 })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain("Duration must be");
  });

  it("successfully exports video and returns URL", async () => {
    const res = await POST(
      makeRequest({
        html: "<html><body>test</body></html>",
        durationSeconds: 12,
        fps: 30,
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.videoUrl).toBe(
      "https://blob.vercel-storage.com/videos/flyer-123.mp4"
    );
    expect(json.framesCaptured).toBe(360);
  });

  it("resolves preset from HTML meta tag", async () => {
    const html = `<html><head><meta name="nexium:type" content="square"></head><body></body></html>`;
    const res = await POST(makeRequest({ html }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.config.type).toBe("square");
    expect(json.config.width).toBe(1080);
    expect(json.config.height).toBe(1080);
  });
});
