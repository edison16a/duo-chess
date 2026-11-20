// Captures the README screenshots from real two player sessions.
// Run against `npm run dev` with the local broker; writes to docs/screenshots.
const { launch, hostAndJoin, move, sq, BASE } = require("./helpers.cjs");

const OUT = "docs/screenshots";
process.env.DSF = process.env.DSF || "2";

async function room(make, mode, before) {
  const host = await make();
  const guest = await make();
  await hostAndJoin(host, guest);
  if (mode !== "classic") await host.locator(`[data-mode="${mode}"]`).click();
  if (before) await before(host);
  await host.waitForTimeout(300);
  return { host, guest };
}

async function seats(host, guest) {
  await host.getByTestId("board").waitFor();
  await guest.getByTestId("board").waitFor();
  const hostWhite = await host.getByTestId("board").evaluate((el) => el.querySelector('[data-square="0"]').getBoundingClientRect().top > el.querySelector('[data-square="56"]').getBoundingClientRect().top);
  return hostWhite ? { w: host, b: guest } : { w: guest, b: host };
}

async function play(p, list, wait = 900) {
  for (let i = 0; i < list.length; i++) {
    const page = i % 2 === 0 ? p.w : p.b;
    await move(page, sq(list[i].slice(0, 2)), sq(list[i].slice(2, 4)));
    await page.waitForTimeout(wait);
  }
}

(async () => {
  const { browser, make } = await launch();
  try {
    // Hero: a classic game with ratings and the eval bar.
    let r = await room(make, "classic", async (h) => { await h.getByLabel("Eval bar").click(); });
    await r.host.screenshot({ path: `${OUT}/lobby.png` });
    await r.host.getByTestId("start").click();
    let p = await seats(r.host, r.guest);
    await play(p, ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6", "f3g5", "d7d5", "e4d5", "f6d5", "g5f7"], 1400);
    await p.w.waitForTimeout(700);
    await p.w.screenshot({ path: `${OUT}/hero.png` });

    // Superpowers draft and a power going off.
    r = await room(make, "superpowers");
    await r.host.getByTestId("start").click();
    await r.host.getByTestId("draft").waitFor();
    for (let i = 0; i < 4; i++) {
      for (const page of [r.host, r.guest]) {
        if (!(await page.getByTestId("draft-confirm").count())) continue;
        const cards = page.getByTestId("draft").locator("[data-power]");
        await cards.nth(0).click();
        await cards.nth(1).click();
        if (i === 2) await page.screenshot({ path: `${OUT}/draft.png` });
        await page.getByTestId("draft-confirm").click();
        await page.waitForTimeout(500);
        break;
      }
    }
    p = await seats(r.host, r.guest);
    await play(p, ["e2e4", "e7e5"]);
    const card = p.w.locator("aside [data-power]:not([disabled])").first();
    await card.click();
    for (let step = 0; step < 2; step++) {
      const aim = p.w.locator("[data-aim]");
      const n = await aim.count();
      if (!n) break;
      if (step === 0) await p.w.screenshot({ path: `${OUT}/aiming.png` });
      const box = await aim.nth(Math.floor(n / 3)).boundingBox();
      await p.w.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await p.w.waitForTimeout(150);
    }
    await p.w.waitForTimeout(250);
    await p.w.screenshot({ path: `${OUT}/power.png` });

    // Atomic explosion mid flight.
    r = await room(make, "atomic");
    await r.host.getByTestId("start").click();
    p = await seats(r.host, r.guest);
    await play(p, ["e2e4", "d7d5", "g1f3", "c8g4"]);
    await play(p, ["e4d5"], 280);
    await p.w.screenshot({ path: `${OUT}/atomic.png` });

    // Library and editor.
    const solo = await make();
    await solo.goto(`${BASE}/library`);
    await solo.getByText("Powers (50)", { exact: true }).click();
    await solo.waitForTimeout(500);
    await solo.screenshot({ path: `${OUT}/powers.png` });
    await solo.getByText("Pieces", { exact: true }).click();
    await solo.mouse.wheel(0, 1150);
    await solo.waitForTimeout(500);
    await solo.screenshot({ path: `${OUT}/pieces.png` });
    await solo.goto(`${BASE}/editor`);
    await solo.waitForTimeout(500);
    await solo.screenshot({ path: `${OUT}/editor.png` });
    await solo.goto(BASE);
    await solo.waitForTimeout(500);
    await solo.screenshot({ path: `${OUT}/home.png` });
    console.log("PASS");
  } catch (e) {
    console.log("FAIL", e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
