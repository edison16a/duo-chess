// Renders the animated mode loops and power posters used by the UI.
//
//   NEXT_DIST_DIR=.next-media npx next dev -p 3110 &
//   node scripts/render-media.cjs [modes|powers|all] [only,these,ids]
//
// Each scene is stepped frame by frame through window.__renderAt in a
// headless Chromium with software WebGL, so output is identical on any
// machine. Mode loops become small WebM files plus a WebP poster; powers
// get a WebP poster at the peak of their effect.

const { chromium } = require("playwright");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const BASE = process.env.BASE_URL || "http://localhost:3110";
const [what = "all", only] = process.argv.slice(2);
const pick = only ? new Set(only.split(",")) : null;
const OUT = path.join(__dirname, "..", "public", "media");
const TMP = path.join(require("node:os").tmpdir(), "duochess-frames");

const MODES = ["classic", "superpowers", "atomic", "double", "triple", "lightning", "chess960", "koth", "three-check", "crazyhouse", "antichess", "fog", "duck", "custom"];
const POSTER_AT = { atomic: 2.5, superpowers: 2.2, koth: 2.3, "three-check": 4.6, custom: 1.5, lightning: 1.7, duck: 4.3, crazyhouse: 2.4, antichess: 3.4 };

/** Power ids straight from the catalog source, so new powers get art automatically. */
function powerIds() {
  const dir = path.join(__dirname, "..", "src", "features", "powers", "catalog");
  return fs.readdirSync(dir).flatMap((f) => [...fs.readFileSync(path.join(dir, f), "utf8").matchAll(/\bid: "([a-z-]+)"/g)].map((m) => m[1]));
}

async function render(page, scene, size, onFrame, frames, fps) {
  await page.setViewportSize(size);
  await page.goto(`${BASE}/render?scene=${scene}&capture=1`);
  await page.waitForFunction(() => window.__sceneReady, null, { timeout: 120000 });
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.__renderAt(t), i / fps);
    await onFrame(i);
  }
}

async function modeClip(page, id) {
  const fps = 20, seconds = 6, dir = path.join(TMP, id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const posterFrame = Math.round((POSTER_AT[id] ?? 2.0) * fps);
  await render(page, `mode:${id}`, { width: 640, height: 400 }, async (i) => {
    await page.screenshot({ path: path.join(dir, `${String(i).padStart(4, "0")}.png`) });
    if (i === posterFrame) fs.copyFileSync(path.join(dir, `${String(i).padStart(4, "0")}.png`), path.join(dir, "poster.png"));
  }, fps * seconds, fps);
  fs.mkdirSync(path.join(OUT, "modes"), { recursive: true });
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", path.join(dir, "%04d.png"), "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "36", "-pix_fmt", "yuv420p", "-an", path.join(OUT, "modes", `${id}.webm`)]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(dir, "poster.png"), "-quality", "82", path.join(OUT, "modes", `${id}.webp`)]);
  console.log("mode", id);
}

async function powerPoster(page, id) {
  const fps = 24;
  const file = path.join(TMP, `power-${id}.png`);
  await page.setViewportSize({ width: 480, height: 300 });
  await page.goto(`${BASE}/render?scene=power:${id}&capture=1`);
  await page.waitForFunction(() => window.__sceneReady, null, { timeout: 120000 });
  // Each scene says when it looks best; step there frame by frame so effects simulate properly.
  const at = (await page.evaluate(() => window.__posterAt)) ?? 0.85;
  for (let i = 0; i <= Math.round(at * fps); i++) await page.evaluate((t) => window.__renderAt(t), i / fps);
  await page.screenshot({ path: file });
  fs.mkdirSync(path.join(OUT, "powers"), { recursive: true });
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-quality", "80", path.join(OUT, "powers", `${id}.webp`)]);
  console.log("power", id);
}

(async () => {
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  if (what === "modes" || what === "all") for (const id of MODES) if (!pick || pick.has(id)) await modeClip(page, id);
  if (what === "powers" || what === "all") {
    for (const id of powerIds()) if (!pick || pick.has(id)) await powerPoster(page, id);
  }
  await browser.close();
})();
