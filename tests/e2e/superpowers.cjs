// Superpowers: a Take & give draft, then the side to move fires a power and makes moves.
const { launch, hostAndJoin, move, sq, pickMode } = require("./helpers.cjs");

(async () => {
  const { browser, make } = await launch();
  const host = await make();
  const guest = await make();
  const out = process.env.OUT_DIR || "/tmp/claude-0";
  try {
    await hostAndJoin(host, guest);
    await pickMode(host, "superpowers");
    await host.waitForTimeout(300);
    await host.screenshot({ path: `${out}/sp-lobby.png` });
    await host.getByTestId("start").click();
    await host.getByTestId("draft").waitFor();
    // Both draft at once and a click on a card takes it, so two picks each fill both hands.
    for (let i = 0; i < 2; i++) {
      for (const page of [host, guest]) {
        await page.getByTestId("draft-offer").locator("[data-power]").first().click();
        if (i === 0 && page === host) await page.screenshot({ path: `${out}/sp-draft.png` });
        await page.waitForTimeout(500);
      }
    }
    await host.getByTestId("board").waitFor({ timeout: 10000 });
    await guest.getByTestId("board").waitFor({ timeout: 10000 });
    // Work out who is White from the board orientation.
    const hostWhite = await host.getByTestId("board").evaluate((el) => el.querySelector('[data-square="0"]').getBoundingClientRect().top > el.querySelector('[data-square="56"]').getBoundingClientRect().top);
    const white = hostWhite ? host : guest;
    const black = hostWhite ? guest : host;
    // Fire every power White has until one succeeds.
    const cards = white.locator("aside [data-power]:not([disabled])");
    const count = await cards.count();
    console.log("white powers:", count);
    for (let i = 0; i < count; i++) {
      const card = white.locator("aside [data-power]:not([disabled])").first();
      const id = await card.getAttribute("data-power");
      await card.click();
      for (let step = 0; step < 2; step++) {
        const aim = white.locator("[data-aim]");
        const n = await aim.count();
        if (!n) break;
        const box = await aim.nth(Math.floor(n / 2)).boundingBox();
        await white.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await white.waitForTimeout(150);
      }
      await white.waitForTimeout(350);
      await white.screenshot({ path: `${out}/sp-power-${i}.png` });
      console.log("used", id);
      await white.waitForTimeout(900);
      break;
    }
    const moves = await white.getByTestId("move-list").innerText();
    console.log("moves:", moves.replace(/\n/g, " "));
    await white.screenshot({ path: `${out}/sp-after.png` });
    await black.screenshot({ path: `${out}/sp-black.png` });
    console.log("PASS");
  } catch (e) {
    console.log("FAIL", e.message);
    await host.screenshot({ path: `${out}/sp-fail-host.png` });
    await guest.screenshot({ path: `${out}/sp-fail-guest.png` });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
