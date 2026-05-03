import { encodeVideo } from "@/lib/video/encodeVideo";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { createCanvas } from "canvas";

describe("encodeVideo", () => {
  let tmpDir: string;
  let framesDir: string;
  let outputPath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "nexium-encode-"));
    framesDir = path.join(tmpDir, "frames");
    outputPath = path.join(tmpDir, "output.mp4");
    await fs.mkdir(framesDir, { recursive: true });

    // Generar 10 frames PNG dummy de 100×100 con colores que cambian
    for (let i = 0; i < 10; i++) {
      const canvas = createCanvas(100, 100);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = `rgb(${i * 25}, 100, 200)`;
      ctx.fillRect(0, 0, 100, 100);
      const buf = canvas.toBuffer("image/png");
      await fs.writeFile(
        path.join(framesDir, `frame-${String(i).padStart(5, "0")}.png`),
        buf
      );
    }
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("encodes frames into a valid MP4", async () => {
    await encodeVideo({
      framesDir,
      outputPath,
      fps: 10,
      width: 100,
      height: 100,
    });

    const stats = await fs.stat(outputPath);
    expect(stats.size).toBeGreaterThan(0);

    // Verificar que el archivo empieza con la signature de MP4 ("ftyp" en bytes 4-8)
    const fd = await fs.open(outputPath, "r");
    const buf = Buffer.alloc(8);
    await fd.read(buf, 0, 8, 0);
    await fd.close();
    expect(buf.slice(4, 8).toString()).toBe("ftyp");
  }, 30000);
});
