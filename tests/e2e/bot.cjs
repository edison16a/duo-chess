// Plays against the bot on /bot. Needs only `npm run dev`, no broker.
//   BASE_URL=http://localhost:3100 node tests/e2e/bot.cjs
// Covers the Elo panel, a Classic game (Stockfish), a declined draw, a
// rematch the bot accepts, then a Double Move game after "New game".
const { launch, pickMode, BASE } = require("./helpers.cjs");

const out = process.env.OUT_DIR || "/tmp/claude-0";
const MAX_REPLY_MS = 4000;

/** Centers of every board cell, or of every element matching `selector` on the board. */
async function centers(page, selector) {
  return page.getByTestId("board").evaluate((board, sel) => [...board.querySelectorAll(sel)].map((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }), selector);
}

async function myColor(page) {
  const white = await page.getByTestId("board").evaluate((el) =>
    el.querySelector('[data-square="0"]').getBoundingClientRect().top > el.querySelector('[data-square="56"]').getBoundingClientRect().top);
  return white ? "w" : "b";
}

async function myTurn(page, me) {
  const cls = (await page.getByTestId(`clock-${me}`).getAttribute("class")) || "";
  return cls.includes("clockActive");
}

/** Clicks squares until one shows move hints, then plays a random hinted move. */
async function randomMove(page) {
  const cells = (await centers(page, "[data-square]")).sort(() => Math.random() - 0.5);
  for (const c of cells) {
    await page.mouse.click(c.x, c.y);
    const hints = await centers(page, '[class*="moveHint"], [class*="captureHint"]');
    if (!hints.length) continue;
    const h = hints[Math.floor(Math.random() * hints.length)];
    await page.mouse.click(h.x, h.y);
    await page.waitForTimeout(80);
    const promo = page.locator('[class*="promotion"] button');
    if (await promo.count()) await promo.first().click();
    const ducks = await centers(page, "[data-duck]");
    if (ducks.length) await page.mouse.click(ducks[0].x, ducks[0].y);
    return true;
  }
  return false;
}

/** Plays `turns` of our turns and checks the bot answers each one quickly. */
async function play(page, turns) {
  const me = await myColor(page);
  let played = 0, since = Date.now(), waiting = false;
  while (played < turns && !(await page.getByTestId("result").count())) {
    if (await myTurn(page, me)) {
      if (waiting) {
        const ms = Date.now() - since;
        if (ms > MAX_REPLY_MS) throw new Error(`bot took ${ms} ms`);
        waiting = false;
      }
      if (await randomMove(page)) { played++; since = Date.now(); waiting = true; }
    } else {
      if (waiting && Date.now() - since > MAX_REPLY_MS * 2) throw new Error("bot never answered");
      await page.waitForTimeout(60);
    }
  }
  return me;
}

(async () => {
  const { browser, make } = await launch();
  const page = await make();
  try {
    await page.goto(BASE);
    await page.getByTestId("play-bot").click();
    const panel = page.getByTestId("bot-panel");
    await panel.waitFor({ timeout: 30000 });
    await panel.getByRole("button", { name: /Master/ }).click();
    if ((await page.getByTestId("bot-name").innerText()) !== "Bot 2500") throw new Error("preset did not apply");
    await page.getByTestId("bot-elo").fill("1500");
    if ((await page.getByTestId("bot-name").innerText()) !== "Bot 1500") throw new Error("slider did not apply");
    await page.screenshot({ path: `${out}/bot-lobby.png` });

    await page.getByTestId("start").click();
    await page.getByTestId("board").waitFor();
    const me = await play(page, 5);
    console.log("classic as", me, "moves:", (await page.getByTestId("move-list").innerText()).replace(/\s+/g, " "));

    // Offer on our own turn so only the bot's answer can clear it.
    while (!(await myTurn(page, me))) await page.waitForTimeout(60);
    await page.getByRole("button", { name: "Draw" }).click();
    await page.getByRole("button", { name: "Offered" }).waitFor();
    await page.getByRole("button", { name: "Draw" }).waitFor({ timeout: 5000 });
    if (await page.getByTestId("result").count()) throw new Error("bot took a draw in a level position");

    await page.getByRole("button", { name: "Resign" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();
    await page.getByTestId("result").waitFor();
    await page.getByTestId("result").getByRole("button", { name: /Rematch/ }).click();
    await page.getByTestId("result").waitFor({ state: "detached", timeout: 5000 });
    if ((await myColor(page)) === me) throw new Error("rematch should swap colors");
    await play(page, 2);
    console.log("rematch ok");

    await page.getByRole("button", { name: "Resign" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();
    await page.getByTestId("bot-new-game").click();
    await pickMode(page, "double");
    await page.getByTestId("start").click();
    await page.getByTestId("board").waitFor();
    await play(page, 4);
    await page.screenshot({ path: `${out}/bot-double.png` });
    console.log("double moves:", (await page.getByTestId("move-list").innerText()).replace(/\s+/g, " "));
    console.log("PASS");
  } catch (e) {
    console.log("FAIL", e.message);
    await page.screenshot({ path: `${out}/bot-fail.png` });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
