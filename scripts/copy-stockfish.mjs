// Copies the single threaded Stockfish build out of node_modules into
// public/engine so the browser can load it as a Web Worker. We do this at
// build time instead of committing the wasm, which keeps the repo light and
// means a plain `git push` to Vercel is all a deploy needs.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const src = join("node_modules", "stockfish", "bin");
const dest = join("public", "engine");
const files = ["stockfish-19-lite-single.js", "stockfish-19-lite-single.wasm"];

mkdirSync(dest, { recursive: true });
for (const file of files) {
  const from = join(src, file);
  if (!existsSync(from)) {
    console.warn(`[copy-stockfish] missing ${from}, move ratings will fall back to the built in engine`);
    continue;
  }
  copyFileSync(from, join(dest, file));
}
console.log("[copy-stockfish] engine ready in public/engine");
