// Board interaction checks: right click arrows and marks, premoves, and
// browsing earlier moves. Needs `npm run dev` plus `npm run broker`.
//   node tests/e2e/board.cjs
// Screenshots land in OUT (default /tmp/claude-0/e2e-board).
const fs = require("fs");
const { launch, hostAndJoin, move, sq } = require("./helpers.cjs");

const OUT = process.env.OUT || "/tmp/claude-0/e2e-board";
fs.mkdirSync(OUT, { recursive: true });

async function center(page, name) {
  const b = await page.getByTestId("board").locator(`[data-square="${sq(name)}"]`).boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
async function rightDrag(page, from, to, modifier) {
  const a = await center(page, from), b = await center(page, to);
  if (modifier) await page.keyboard.down(modifier);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down({ button: "right" });
  await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 4 });
  await page.mouse.move(b.x, b.y, { steps: 4 });
  await page.mouse.up({ button: "right" });
  if (modifier) await page.keyboard.up(modifier);
}
async function drag(page, from, to) {
  const a = await center(page, from), b = await center(page, to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 8 });
  await page.mouse.up();
}
/** Map of square name to piece kind, read from where the piece images sit. */
async function pieces(page) {
  await page.waitForTimeout(350);
  return page.getByTestId("board").evaluate((board) => {
    const cells = [...board.querySelectorAll("[data-square]")].map((c) => ({ s: Number(c.dataset.square), r: c.getBoundingClientRect() }));
    const out = {};
    for (const img of board.querySelectorAll("img")) {
      const r = img.parentElement.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const cell = cells.find((c) => x > c.r.left && x < c.r.right && y > c.r.top && y < c.r.bottom);
      if (cell) out["abcdefgh"[cell.s % 8] + (Math.floor(cell.s / 8) + 1)] = img.alt;
    }
    return out;
  });
}
const count = (page, sel) => page.getByTestId("board").locator(sel).count();
const moves = async (page) => (await page.getByTestId("move-list").innerText()).replace(/\s+/g, " ").trim();
function expect(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("ok:", msg);
}

(async () => {
  const { browser, make } = await launch();
  const host = await make();
  const guest = await make();
  try {
    await hostAndJoin(host, guest);
    await host.getByTestId("start").click();
    await host.getByTestId("board").waitFor();
    await guest.getByTestId("board").waitFor();
    const hostWhite = await host.getByTestId("board").evaluate((el) => el.querySelector('[data-square="0"]').getBoundingClientRect().top > el.querySelector('[data-square="56"]').getBoundingClientRect().top);
    const w = hostWhite ? host : guest, b = hostWhite ? guest : host;

    // Arrows and marks.
    await rightDrag(w, "e2", "e4");
    await rightDrag(w, "g1", "f3");
    await rightDrag(w, "d2", "d4", "Shift");
    await rightDrag(w, "c1", "g5", "Control");
    await w.mouse.click((await center(w, "e5")).x, (await center(w, "e5")).y, { button: "right" });
    await w.mouse.click((await center(w, "d5")).x, (await center(w, "d5")).y, { button: "right" });
    expect((await count(w, "[data-arrow]")) === 4, "four arrows drawn");
    expect((await count(w, "[data-mark]")) === 2, "two squares marked");
    await w.screenshot({ path: `${OUT}/arrows-white.png` });
    await w.getByTestId("board").screenshot({ path: `${OUT}/arrows-board.png` });
    await rightDrag(w, "e2", "e4");
    expect((await count(w, "[data-arrow]")) === 3, "same arrow again removes it");
    await w.mouse.click((await center(w, "e5")).x, (await center(w, "e5")).y, { button: "right" });
    expect((await count(w, "[data-mark]")) === 1, "right click again removes the mark");
    await w.mouse.click((await center(w, "a5")).x, (await center(w, "a5")).y);
    expect((await count(w, "[data-arrow]")) + (await count(w, "[data-mark]")) === 0, "left click clears everything");

    // Black's flipped board draws arrows in its own orientation.
    await rightDrag(b, "g8", "f6");
    await rightDrag(b, "e7", "e5");
    await b.getByTestId("board").screenshot({ path: `${OUT}/arrows-black.png` });
    expect((await count(w, "[data-arrow]")) === 0, "annotations stay local");

    // Premove that auto plays.
    await move(w, sq("e2"), sq("e4"));
    await w.waitForTimeout(700);
    await move(w, sq("g1"), sq("f3"));
    expect((await count(w, "[data-premove]")) === 2, "premove squares shown");
    await w.getByTestId("board").screenshot({ path: `${OUT}/premove.png` });
    expect(!(await moves(w)).includes("Nf3"), "premove not sent yet");
    await move(b, sq("e7"), sq("e5"));
    await w.waitForFunction(() => document.querySelector('[data-testid="move-list"]').innerText.includes("f3"), null, { timeout: 5000 });
    expect((await pieces(w)).f3 === "knight", "premove played automatically");

    // Black replies for real, then premoves while White thinks.
    await b.waitForTimeout(500);
    await move(b, sq("b8"), sq("c6"));
    await b.waitForTimeout(700);
    await drag(b, "d7", "d6");
    expect((await count(b, "[data-premove]")) === 2, "drag premove queued");
    await b.getByTestId("board").screenshot({ path: `${OUT}/premove-black.png` });
    await b.mouse.click((await center(b, "h5")).x, (await center(b, "h5")).y, { button: "right" });
    expect((await count(b, "[data-premove]")) === 0, "right click cancels premove");
    await drag(b, "f8", "c5");
    await b.mouse.click((await center(b, "a5")).x, (await center(b, "a5")).y);
    expect((await count(b, "[data-premove]")) === 0, "clicking an empty square cancels premove");

    // Premoves chain, and each one is shown on the board right away.
    await move(b, sq("a7"), sq("a6"));
    await move(b, sq("a6"), sq("a5"));
    let chain = await pieces(b);
    expect(chain.a5 === "pawn" && !chain.a7 && !chain.a6, "chained premoves move the pawn on your board");
    expect((await count(b, "[data-premove]")) === 3, "every queued square is tinted");
    await b.mouse.click((await center(b, "h5")).x, (await center(b, "h5")).y, { button: "right" });
    chain = await pieces(b);
    expect(chain.a7 === "pawn" && !chain.a5, "cancelling puts the pawn back");

    // A premove that becomes illegal is dropped.
    await move(b, sq("d8"), sq("h4"));
    expect((await count(b, "[data-premove]")) === 2, "queen premove queued");
    await move(w, sq("f3"), sq("g5"));
    await b.waitForFunction(() => document.querySelector('[data-testid="move-list"]').innerText.includes("g5"), null, { timeout: 5000 });
    await b.waitForTimeout(1000);
    const list = await moves(b);
    expect(!list.includes("h4") && (await pieces(b)).d8 === "queen", `illegal premove dropped (${list})`);
    expect((await count(b, "[data-premove]")) === 0, "premove highlight cleared");

    // History browsing. Moves so far: e4 e5 Nf3 Nc6 Ng5, Black to move.
    await w.locator('[data-ply="1"]').click();
    expect(await w.getByTestId("back-to-live").isVisible(), "back to live pill shown");
    let p = await pieces(w);
    expect(p.g1 === "knight" && p.e5 === "pawn" && p.e4 === "pawn" && !p.f3, "board shows position after 1...e5");
    await w.screenshot({ path: `${OUT}/history.png` });
    await w.keyboard.press("ArrowLeft");
    p = await pieces(w);
    expect(p.e4 === "pawn" && p.e7 === "pawn", "left arrow steps back");
    await w.keyboard.press("Home");
    p = await pieces(w);
    expect(p.e2 === "pawn" && p.e7 === "pawn", "home shows the start");
    await w.keyboard.press("ArrowRight");
    await w.keyboard.press("ArrowRight");
    p = await pieces(w);
    expect(p.e5 === "pawn" && p.g1 === "knight", "right arrow steps forward");

    // The side to move cannot play from a past position.
    await b.locator('[data-ply="2"]').click();
    await move(b, sq("d7"), sq("d5"));
    await b.waitForTimeout(800);
    expect(!(await moves(w)).includes("d5"), "past board is read only");
    await b.keyboard.press("End");
    expect((await b.getByTestId("back-to-live").count()) === 0, "end returns to live");

    // A new move while browsing keeps the view and makes the pill obvious.
    await move(b, sq("d7"), sq("d5"));
    await w.waitForTimeout(900);
    expect((await pieces(w)).g1 === "knight", "view stays put when a move arrives");
    const cls = await w.getByTestId("back-to-live").getAttribute("class");
    expect(/liveBehind/.test(cls), "pill highlights new moves");
    await w.screenshot({ path: `${OUT}/history-behind.png` });
    await w.keyboard.press("End");
    expect((await w.getByTestId("back-to-live").count()) === 0, "end returns to live for white");
    expect((await pieces(w)).d5 === "pawn", "live board is current");
    await move(w, sq("e4"), sq("d5"));
    await w.waitForTimeout(700);
    expect((await moves(w)).includes("xd5"), "moves still work when live");
    await w.screenshot({ path: `${OUT}/final.png` });
    console.log("PASS");
  } catch (e) {
    console.log("FAIL", e.message);
    await host.screenshot({ path: `${OUT}/fail-host.png` });
    await guest.screenshot({ path: `${OUT}/fail-guest.png` });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
