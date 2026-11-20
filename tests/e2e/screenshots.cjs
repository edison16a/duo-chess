// Captures the README screenshots from real two player sessions.
// Run against `npm run dev` with the local broker; writes to docs/screenshots.
const { launch, hostAndJoin, move, sq, BASE, pickMode } = require("./helpers.cjs");

const OUT = "docs/screenshots";
process.env.DSF = process.env.DSF || "2";

async function room(make, mode, before) {
  const host = await make();
  const guest = await make();
  await hostAndJoin(host, guest);
  if (mode !== "classic") await pickMode(host, mode);
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

/** Clicks a square on the 3D board through the scene's own projection. */
async function click3d(page, square) {
  const pt = await page.evaluate((s) => document.querySelector('[data-testid="board3d"] canvas').__scene.screenOf(s), square);
  await page.mouse.click(pt.x, pt.y);
}

(async () => {
  const { browser, make } = await launch();
  try {
    // Landing page with the live battlefield behind it.
    // The live battle is heavy in software WebGL, so this one shot is taken at 1x with more time.
    const solo = await make({ reducedMotion: "no-preference", deviceScaleFactor: 1 });
    await solo.goto(BASE);
    await solo.waitForTimeout(16000);
    await solo.screenshot({ path: `${OUT}/home.png`, timeout: 120000 });
    // Leave the live battle so it stops eating CPU while the games run.
    await solo.goto("about:blank");

    // Lobby with the animated mode carousel, then a classic game on the 3D board.
    let r = await room(make, "classic");
    await r.host.waitForTimeout(3000);
    await r.host.screenshot({ path: `${OUT}/lobby.png` });
    await r.host.getByTestId("start").click();
    let p = await seats(r.host, r.guest);
    await p.w.getByTestId("view-3d").click();
    await p.w.getByTestId("board3d").waitFor();
    await p.w.waitForTimeout(6000);
    const moves = ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6", "f3g5", "d7d5", "e4d5", "f6d5", "g5f7"];
    for (let i = 0; i < moves.length; i++) {
      if (i % 2 === 0) {
        await click3d(p.w, sq(moves[i].slice(0, 2)));
        await p.w.waitForTimeout(150);
        await click3d(p.w, sq(moves[i].slice(2, 4)));
      } else {
        await move(p.b, sq(moves[i].slice(0, 2)), sq(moves[i].slice(2, 4)));
      }
      await p.w.waitForTimeout(1500);
    }
    await p.w.waitForTimeout(400);
    await p.w.screenshot({ path: `${OUT}/board3d.png` });
    // The same game from Black's flat board, with an arrow drawn.
    const box = await p.b.getByTestId("board").boundingBox();
    const cell = box.width / 8;
    await p.b.mouse.move(box.x + cell * 3.5, box.y + cell * 7.5);
    await p.b.mouse.down({ button: "right" });
    await p.b.mouse.move(box.x + cell * 3.5, box.y + cell * 5.5, { steps: 6 });
    await p.b.mouse.up({ button: "right" });
    await p.b.screenshot({ path: `${OUT}/board2d.png` });

    // Superpowers draft and the three second hover preview.
    r = await room(make, "superpowers");
    await r.host.getByTestId("start").click();
    await r.host.getByTestId("draft").waitFor();
    for (const page of [r.host, r.guest]) {
      if (!(await page.getByTestId("draft-confirm").count())) continue;
      const cards = page.getByTestId("draft").locator("[data-power]");
      await cards.nth(0).click();
      // Park the pointer so the clicked card does not open its 3D preview.
      await page.mouse.move(5, 5);
      await page.screenshot({ path: `${OUT}/draft.png` });
      const third = await cards.nth(2).boundingBox();
      await page.mouse.move(third.x + 20, third.y + 20);
      await page.mouse.move(third.x + third.width / 2, third.y + third.height / 2, { steps: 5 });
      await page.waitForTimeout(1300);
      await page.getByTestId("power-preview").waitFor({ timeout: 90000 });
      await page.waitForTimeout(12000);
      await page.screenshot({ path: `${OUT}/preview.png`, timeout: 120000 });
      await page.mouse.move(5, 5);
      break;
    }

    // Atomic explosion on the flat board, played by the 3D effects layer.
    r = await room(make, "atomic");
    await r.host.getByTestId("start").click();
    p = await seats(r.host, r.guest);
    await play(p, ["e2e4", "d7d5", "g1f3", "c8g4"]);
    await play(p, ["e4d5"], 320);
    await p.w.screenshot({ path: `${OUT}/atomic.png` });

    // Library, bot setup and editor.
    await solo.goto(`${BASE}/library`);
    await solo.getByText("Powers (50)", { exact: true }).click();
    await solo.waitForTimeout(1500);
    await solo.screenshot({ path: `${OUT}/powers.png` });
    await solo.goto(`${BASE}/bot`);
    await solo.waitForTimeout(3000);
    await solo.screenshot({ path: `${OUT}/bot.png` });
    await solo.goto(`${BASE}/editor`);
    await solo.waitForTimeout(800);
    await solo.screenshot({ path: `${OUT}/editor.png` });
    console.log("PASS");
  } catch (e) {
    console.log("FAIL", e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
