/**
 * Procedural textures drawn on a canvas once and cached. Glows, sparks and
 * smoke all come from here, so effects need no image downloads.
 */

import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();

function canvasTexture(key: string, size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void): THREE.Texture {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  draw(canvas.getContext("2d")!, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, texture);
  return texture;
}

/** Soft round glow, bright center fading to nothing. */
export function glowTexture(): THREE.Texture {
  return canvasTexture("glow", 128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.75)");
    g.addColorStop(0.6, "rgba(255,255,255,0.18)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

/** Four point star used for sparkles and magic glints. */
export function sparkTexture(): THREE.Texture {
  return canvasTexture("spark", 128, (ctx, s) => {
    const c = s / 2;
    const g = ctx.createRadialGradient(c, c, 0, c, c, c * 0.35);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.globalCompositeOperation = "lighter";
    for (const [w, h] of [[s, 6], [6, s]]) {
      const lg = ctx.createLinearGradient(c - w / 2, c - h / 2, c + w / 2, c + h / 2);
      lg.addColorStop(0, "rgba(255,255,255,0)");
      lg.addColorStop(0.5, "rgba(255,255,255,0.95)");
      lg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(c - w / 2, c - h / 2, w, h);
    }
  });
}

/** Lumpy smoke puff made from overlapping blurred blobs. */
export function smokeTexture(): THREE.Texture {
  return canvasTexture("smoke", 256, (ctx, s) => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 26; i++) {
      const x = s / 2 + (rand() - 0.5) * s * 0.45;
      const y = s / 2 + (rand() - 0.5) * s * 0.45;
      const r = s * (0.12 + rand() * 0.18);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,0.22)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    }
  });
}

/** Thin bright ring, used for shockwaves and portal rims. */
export function ringTexture(): THREE.Texture {
  return canvasTexture("ring", 256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, s * 0.3, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.75, "rgba(255,255,255,0.9)");
    g.addColorStop(0.85, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

/** A circle of runes for arcane powers. */
export function runeTexture(): THREE.Texture {
  return canvasTexture("rune", 512, (ctx, s) => {
    const c = s / 2;
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineCap = "round";
    ctx.lineWidth = 6;
    for (const r of [0.46, 0.38]) {
      ctx.beginPath();
      ctx.arc(c, c, s * r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.lineWidth = 4;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ctx.save();
      ctx.translate(c + Math.cos(a) * s * 0.42, c + Math.sin(a) * s * 0.42);
      ctx.rotate(a + Math.PI / 2);
      ctx.beginPath();
      const k = i % 4;
      if (k === 0) { ctx.moveTo(-10, -12); ctx.lineTo(0, 12); ctx.lineTo(10, -12); }
      else if (k === 1) { ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.moveTo(0, -12); ctx.lineTo(0, 12); }
      else if (k === 2) { ctx.arc(0, 0, 9, 0, Math.PI * 1.5); }
      else { ctx.moveTo(-10, 12); ctx.lineTo(0, -12); ctx.lineTo(10, 12); ctx.lineTo(-10, 12); }
      ctx.stroke();
      ctx.restore();
    }
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = c + Math.cos(a) * s * 0.3, y = c + Math.sin(a) * s * 0.3;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  });
}

/** Wood grain for the board frame. */
export function woodTexture(): THREE.Texture {
  const t = canvasTexture("wood", 512, (ctx, s) => {
    ctx.fillStyle = "#4a2e1c";
    ctx.fillRect(0, 0, s, s);
    let seed = 3;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 140; i++) {
      ctx.strokeStyle = `rgba(${rand() > 0.5 ? "255,220,180" : "20,10,4"},${0.04 + rand() * 0.06})`;
      ctx.lineWidth = 1 + rand() * 3;
      const y = rand() * s;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= s; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 6);
      ctx.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Text drawn into a texture, for floating rating badges. */
export function badgeTexture(glyph: string, color: string): THREE.Texture {
  return canvasTexture(`badge:${glyph}:${color}`, 128, (ctx, s) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s * 0.44, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${glyph.length > 2 ? 40 : 52}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, s / 2, s / 2 + 3);
  });
}
