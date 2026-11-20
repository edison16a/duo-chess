// Shared helpers for the end to end scripts. They drive two real browser
// contexts (host and guest) against `npm run dev` plus `npm run broker`.
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3100";

async function launch() {
  // SwiftShader gives headless Chromium WebGL for the 3D board.
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const make = async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: Number(process.env.DSF || 1) });
    const page = await context.newPage();
    page.on("pageerror", (e) => console.log("[pageerror]", e.message, (e.stack || "").split("\n").slice(0, 8).join(" // ")));
    page.on("console", (m) => m.type() === "error" && console.log("[console]", m.text().slice(0, 300) + " ::: " + m.text().slice(-1200).replace(/\s+/g, " ")));
    return page;
  };
  return { browser, make };
}

/** Host a room on one page and join it from another. Returns the room code. */
async function hostAndJoin(host, guest) {
  await host.goto(BASE);
  await host.getByTestId("host").click();
  await host.getByTestId("room-code").waitFor({ timeout: 20000 });
  const code = (await host.getByTestId("room-code").textContent()).trim();
  await guest.goto(`${BASE}/room/${code}`);
  await host.getByTestId("players").getByText("Waiting for opponent").waitFor({ state: "detached", timeout: 20000 });
  return code;
}

/** Click from one square to another using the board's data-square cells. */
async function move(page, fromSq, toSq) {
  const board = page.getByTestId("board");
  const box = await board.boundingBox();
  const cell = async (sq) => {
    const el = board.locator(`[data-square="${sq}"]`);
    const b = await el.boundingBox();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  const a = await cell(fromSq);
  const b = await cell(toSq);
  await page.mouse.click(a.x, a.y);
  await page.mouse.click(b.x, b.y);
  return box;
}

const sq = (name) => (Number(name[1]) - 1) * 8 + "abcdefgh".indexOf(name[0]);

module.exports = { launch, hostAndJoin, move, sq, BASE };
