// The host picks the 3D board in the lobby, then both players move by
// clicking 3D squares while effects and orbiting run. Needs WebGL (swiftshader).
const { launch, hostAndJoin, sq, pickMode, setOption, click3d } = require("./helpers.cjs");

(async () => {
  const { browser, make } = await launch();
  const host = await make();
  const guest = await make();
  const out = process.env.OUT_DIR || "/tmp/claude-0";
  try {
    await hostAndJoin(host, guest);
    if (process.env.MODE) await pickMode(host, process.env.MODE);
    await setOption(host, "host-color", "White");
    await setOption(host, "board-view", "3D");
    await host.waitForTimeout(300);
    await host.getByTestId("start").click();
    const [w, b] = [host, guest];
    await w.getByTestId("board3d").waitFor();
    await b.getByTestId("board3d").waitFor();
    await w.waitForTimeout(6000);
    const moves = (process.env.MOVES || "e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 f3g5 d7d5 e4d5 f6d5 g5f7").split(" ");
    for (let i = 0; i < moves.length; i++) {
      const page = i % 2 === 0 ? w : b;
      await click3d(page, sq(moves[i].slice(0, 2)));
      await page.waitForTimeout(150);
      await click3d(page, sq(moves[i].slice(2, 4)));
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
    await b.screenshot({ path: `${out}/b3d-black.png` });
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
