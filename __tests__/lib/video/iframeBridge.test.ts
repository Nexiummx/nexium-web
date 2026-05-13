import { buildVideoIframeDocument } from "@/lib/video/iframeBridge";

describe("buildVideoIframeDocument", () => {
  it("inyecta payload y bridge antes de </head>", () => {
    const html = "<html><head><title>x</title></head><body></body></html>";
    const out = buildVideoIframeDocument(html, {
      gsap: [{ id: "g_0", duration: 2 }],
      css: [],
    });
    expect(out).toContain("window.__NEXIUM_MOTION_APPLY__");
    expect(out).toContain('"g_0"');
    expect(out).toContain("duration");
    expect(out).toContain("</head>");
  });
});
