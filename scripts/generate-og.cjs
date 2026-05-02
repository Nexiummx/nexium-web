
const path = require("path");
const sharp = require("sharp");

const W = 1200;
const H = 630;
const BG = { r: 13, g: 13, b: 13 };

async function main() {
  const root = path.join(__dirname, "..");
  const svgPath = path.join(root, "public/brand/nexium-logo-horizontal-dark.svg");
  const outPath = path.join(root, "public/og-image.png");

  const logoBuf = await sharp(svgPath, { density: 300 })
    .resize({ width: 920, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  const meta = await sharp(logoBuf).metadata();
  const lw = meta.width ?? 920;
  const lh = meta.height ?? 340;

  await sharp({
    create: { width: W, height: H, channels: 3, background: BG },
  })
    .composite([
      {
        input: logoBuf,
        left: Math.max(0, Math.round((W - lw) / 2)),
        top: Math.max(0, Math.round((H - lh) / 2)),
      },
    ])
    .png()
    .toFile(outPath);

  console.log("OK:", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
