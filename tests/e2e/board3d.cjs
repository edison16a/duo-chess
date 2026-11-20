// Switches to the 3D board, plays moves by clicking 3D squares and checks
// effects and orbiting do not break anything. Needs WebGL (swiftshader).
const { launch, hostAndJoin, move, sq } = require("./helpers.cjs");

async function click3d(page, square) {
  const p = await page.evaluate((s) => document.querySelector('[data-testid="board3d"] canvas').__scene.screenOf(s), square);
  await page.mouse.click(p.x, p.y);
}

(async () => {
  const { browser, make } = await launch();
  const host = await make();
  const guest = await make();
  const out = process.env.OUT_DIR || "/tmp/claude-0";
  try {
    await hostAndJoin(host, guest);
    if (process.env.MODE) await host.locator(`[data-mode="${process.env.MODE}"]`).click();
    await host.getByTestId("start").click();
    await host.getByTestId("board").waitFor();
    const hostWhite = await host.getByTestId("board").evaluate((el) => el.querySelector('[data-square="0"]').getBoundingClientRect().top > el.querySelector('[data-square="56"]').getBoundingClientRect().top);
    const [w, b] = hostWhite ? [host, guest] : [guest, host];
    await w.getByTestId("view-3d").click();
    await w.getByTestId("board3d").waitFor();
    await w.waitForTimeout(6000);
    const moves = (process.env.MOVES || "e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 f3g5 d7d5 e4d5 f6d5 g5f7").split(" ");
    for (let i = 0; i < moves.length; i++) {
      if (i % 2 === 0) {
        await click3d(w, sq(moves[i].slice(0, 2)));
        await w.waitForTimeout(150);
        await click3d(w, sq(moves[i].slice(2, 4)));
      } else {
        await move(b, sq(moves[i].slice(0, 2)), sq(moves[i].slice(2, 4)));
      }
      await w.waitForTimeout(1200);
    }
    await w.waitForTimeout(Number(process.env.SETTLE || 400));
    await w.screenshot({ path: `${out}/b3d-game.png` });
    // Orbit the camera by dragging empty space.
    const box = await w.getByTestId("board3d").boundingBox();
    await w.mouse.move(box.x + 30, box.y + 30);
    await w.mouse.down();
    await w.mouse.move(box.x + 260, box.y + 90, { steps: 12 });
    await w.mouse.up();
    await w.waitForTimeout(800);
    await w.screenshot({ path: `${out}/b3d-orbit.png` });
    console.log("moves:", (await w.getByTestId("move-list").innerText()).replace(/\n/g, " "));
    console.log("PASS");
  } catch (e) {
    console.log("FAIL", e.message);
    await host.screenshot({ path: `${out}/b3d-fail.png` });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
