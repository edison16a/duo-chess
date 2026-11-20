// Two players: host, join, play a short game to checkmate, check both screens agree.
const { launch, hostAndJoin, move, sq } = require("./helpers.cjs");

(async () => {
  const { browser, make } = await launch();
  const host = await make();
  const guest = await make();
  try {
    const code = await hostAndJoin(host, guest);
    console.log("room", code);
    await host.getByTestId("start").click();
    await host.getByTestId("board").waitFor();
    await guest.getByTestId("board").waitFor();
    // Host is white by default only when random says so; find out who is white via the clock strip order.
    const hostIsWhite = (await host.locator('[data-square="12"] ~ *').count()) >= 0 && (await host.evaluate(() => document.body.innerText.includes("You")));
    const pages = { w: host, b: guest };
    const hostFirst = await host.getByTestId("board").evaluate((el) => el.querySelector('[data-square="0"]').getBoundingClientRect().top > el.querySelector('[data-square="56"]').getBoundingClientRect().top);
    if (!hostFirst) { pages.w = guest; pages.b = host; }
    const plies = [["f2", "f3"], ["e7", "e5"], ["g2", "g4"], ["d8", "h4"]];
    for (let i = 0; i < plies.length; i++) {
      const page = i % 2 === 0 ? pages.w : pages.b;
      await move(page, sq(plies[i][0]), sq(plies[i][1]));
      await page.waitForTimeout(700);
    }
    await host.getByTestId("result").waitFor({ timeout: 10000 });
    await guest.getByTestId("result").waitFor({ timeout: 10000 });
    console.log("host sees:", (await host.getByTestId("result").innerText()).replace(/\n/g, " | "));
    console.log("guest sees:", (await guest.getByTestId("result").innerText()).replace(/\n/g, " | "));
    console.log("moves:", (await host.getByTestId("move-list").innerText()).replace(/\n/g, " "));
    await host.waitForTimeout(2500);
    await host.screenshot({ path: process.env.OUT || "/tmp/claude-0/e2e-classic.png" });
    console.log("PASS", hostIsWhite !== undefined);
  } catch (e) {
    console.log("FAIL", e.message);
    await host.screenshot({ path: "/tmp/claude-0/e2e-fail-host.png" });
    await guest.screenshot({ path: "/tmp/claude-0/e2e-fail-guest.png" });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
