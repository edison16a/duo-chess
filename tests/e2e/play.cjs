// Plays a scripted game between two browsers in any mode.
//   MODE=atomic MOVES="g1f3 d7d5 f3e5 d8d6 e5f7" node tests/e2e/play.cjs
// Moves alternate White, Black. With RESULT=1 the game must end afterwards.
const { launch, hostAndJoin, move, sq } = require("./helpers.cjs");

const mode = process.env.MODE || "classic";
const moves = (process.env.MOVES || "f2f3 e7e5 g2g4 d8h4").split(" ");
const out = process.env.OUT || `/tmp/claude-0/e2e-${mode}.png`;

(async () => {
  const { browser, make } = await launch();
  const host = await make();
  const guest = await make();
  try {
    const code = await hostAndJoin(host, guest);
    if (mode !== "classic") await host.locator(`[data-mode="${mode}"]`).click();
    await host.waitForTimeout(300);
    await host.getByTestId("start").click();
    await host.getByTestId("board").waitFor();
    await guest.getByTestId("board").waitFor();
    const hostWhite = await host.getByTestId("board").evaluate((el) => el.querySelector('[data-square="0"]').getBoundingClientRect().top > el.querySelector('[data-square="56"]').getBoundingClientRect().top);
    const pages = hostWhite ? { w: host, b: guest } : { w: guest, b: host };
    for (let i = 0; i < moves.length; i++) {
      const page = i % 2 === 0 ? pages.w : pages.b;
      await move(page, sq(moves[i].slice(0, 2)), sq(moves[i].slice(2, 4)));
      await page.waitForTimeout(i === moves.length - 1 ? Number(process.env.LAST_WAIT || 250) : 900);
    }
    await pages.w.screenshot({ path: out });
    const list = await host.getByTestId("move-list").innerText();
    console.log(`room ${code} moves: ${list.replace(/\n/g, " ")}`);
    if (process.env.RESULT === "1") {
      await host.getByTestId("result").waitFor({ timeout: 10000 });
      console.log("result:", (await host.getByTestId("result").innerText()).replace(/\n+/g, " | "));
    }
    console.log("PASS");
  } catch (e) {
    console.log("FAIL", e.message);
    await host.screenshot({ path: "/tmp/claude-0/e2e-fail-host.png" });
    await guest.screenshot({ path: "/tmp/claude-0/e2e-fail-guest.png" });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
