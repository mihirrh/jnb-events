/**
 * Generates the PLACEHOLDER imagery used by the starter content.
 *
 * Every image is an abstract illustration (not a real photo) and carries a small
 * "PLACEHOLDER" label so nothing can be mistaken for real work. Replace them from
 * Pages CMS (Media) with genuine photography, then delete this script if you like.
 *
 * Run:  npm run images:generate
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'media');

// Deterministic PRNG so re-running produces identical files (clean git diffs).
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PAL = {
  ivory: { bg1: '#F6EFE4', bg2: '#E3D3BC', floor: '#CDB89A', dark: '#3A2F25', gold: '#B8954A', accent: '#E8C9C0', leaf: '#8A9A7B', glow: '#FFF3D6' },
  blush: { bg1: '#F7E6E1', bg2: '#E6C3BB', floor: '#C9A59C', dark: '#4A3330', gold: '#B8954A', accent: '#F3D5CE', leaf: '#9AA58A', glow: '#FFF0E6' },
  sage: { bg1: '#E9EBDD', bg2: '#C9D0B5', floor: '#A9B393', dark: '#2F372A', gold: '#B8954A', accent: '#F1E4D3', leaf: '#6F8061', glow: '#FFF6DC' },
  night: { bg1: '#1B1620', bg2: '#0C0A10', floor: '#17121C', dark: '#05040A', gold: '#D6B36A', accent: '#7C5CD8', leaf: '#3F5A55', glow: '#FFDFA0' },
  noir: { bg1: '#241B16', bg2: '#0E0A08', floor: '#1A1310', dark: '#050302', gold: '#D6B36A', accent: '#C9694F', leaf: '#4A5B45', glow: '#FFD79A' },
};

const f = (n) => Number(n.toFixed(1));

function bokeh(r, w, h, n, color, y0 = 0, y1 = 0.7) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const rad = 6 + r() * Math.min(w, h) * 0.035;
    o += `<circle cx="${f(r() * w)}" cy="${f(h * (y0 + r() * (y1 - y0)))}" r="${f(rad)}" fill="${color}" opacity="${f(0.12 + r() * 0.35)}"/>`;
  }
  return `<g filter="url(#b2)">${o}</g>`;
}

function flowers(r, cx, cy, rx, ry, n, colors) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d;
    const rad = 10 + r() * 22;
    const c = colors[Math.floor(r() * colors.length)];
    o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${c}" opacity="${f(0.75 + r() * 0.25)}"/>`;
    if (r() > 0.6) o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad * 0.45)}" fill="#fff" opacity="0.35"/>`;
  }
  return o;
}

function leaves(r, cx, cy, spread, n, color) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * spread;
    const len = 60 + r() * 140;
    const x2 = cx + Math.cos(a) * len;
    const y2 = cy + Math.sin(a) * len;
    const mx = (cx + x2) / 2 + (r() - 0.5) * 30;
    const my = (cy + y2) / 2 + (r() - 0.5) * 30;
    o += `<path d="M${f(cx)} ${f(cy)} Q${f(mx)} ${f(my)} ${f(x2)} ${f(y2)} Q${f(mx + 14)} ${f(my + 6)} ${f(cx)} ${f(cy)}Z" fill="${color}" opacity="${f(0.55 + r() * 0.4)}"/>`;
  }
  return o;
}

// ---------- scenes: each returns SVG fragments drawn inside a w×h canvas ----------

function mandap(r, w, h, p, wide = 1) {
  const cx = w / 2;
  const aw = w * 0.34 * wide;
  const top = h * 0.14;
  const base = h * 0.78;
  let o = `<rect width="${w}" height="${h}" fill="url(#bg)"/>`;
  o += bokeh(r, w, h, 26, p.glow, 0.05, 0.6);
  // floor + stage
  o += `<rect y="${base}" width="${w}" height="${h - base}" fill="${p.floor}"/>`;
  o += `<rect x="${f(cx - aw * 1.25)}" y="${f(base - h * 0.035)}" width="${f(aw * 2.5)}" height="${f(h * 0.05)}" fill="${p.bg2}"/>`;
  o += `<rect x="${f(cx - aw * 1.1)}" y="${f(base - h * 0.07)}" width="${f(aw * 2.2)}" height="${f(h * 0.04)}" fill="${p.bg1}" opacity="0.9"/>`;
  // pillars
  for (const s of [-1, 1]) {
    const x = cx + s * aw;
    o += `<rect x="${f(x - 14)}" y="${f(top + h * 0.1)}" width="28" height="${f(base - top - h * 0.1 - h * 0.035)}" fill="${p.dark}" opacity="0.88"/>`;
    o += `<rect x="${f(x - 20)}" y="${f(base - h * 0.075)}" width="40" height="${f(h * 0.04)}" fill="${p.gold}"/>`;
    o += flowers(r, x, base - h * 0.1, 46, 58, 22, [p.accent, p.bg1, p.gold]);
    o += leaves(r, x, base - h * 0.08, 2.4, 9, p.leaf);
  }
  // arch
  o += `<path d="M${f(cx - aw)} ${f(top + h * 0.22)} A${f(aw)} ${f(h * 0.22)} 0 0 1 ${f(cx + aw)} ${f(top + h * 0.22)}" fill="none" stroke="${p.gold}" stroke-width="${f(Math.max(5, w * 0.005))}"/>`;
  o += `<path d="M${f(cx - aw + 22)} ${f(top + h * 0.22)} A${f(aw - 22)} ${f(h * 0.2)} 0 0 1 ${f(cx + aw - 22)} ${f(top + h * 0.22)}" fill="none" stroke="${p.dark}" stroke-width="2" opacity="0.4"/>`;
  // garland along arch
  for (let i = 0; i <= 54; i++) {
    const t = Math.PI * (i / 54);
    const x = cx - Math.cos(t) * aw;
    const y = top + h * 0.22 - Math.sin(t) * h * 0.22;
    const rad = 7 + r() * 11;
    o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${[p.accent, p.gold, p.bg1][Math.floor(r() * 3)]}" opacity="0.92"/>`;
  }
  // drapes + hanging lights
  for (let i = 0; i < 22; i++) {
    const x = cx - aw * 0.9 + (i / 21) * aw * 1.8;
    const yTop = top + h * 0.22 - Math.sqrt(Math.max(0, 1 - ((x - cx) / aw) ** 2)) * h * 0.22;
    const len = h * (0.12 + r() * 0.2);
    o += `<line x1="${f(x)}" y1="${f(yTop)}" x2="${f(x)}" y2="${f(yTop + len)}" stroke="${p.glow}" stroke-width="1.4" opacity="0.7"/>`;
    o += `<circle cx="${f(x)}" cy="${f(yTop + len)}" r="${f(4 + r() * 3)}" fill="${p.glow}"/>`;
  }
  // centre seat
  o += `<rect x="${f(cx - 46)}" y="${f(base - h * 0.17)}" width="92" height="${f(h * 0.1)}" rx="10" fill="${p.dark}" opacity="0.85"/>`;
  o += `<rect x="${f(cx - 58)}" y="${f(base - h * 0.2)}" width="116" height="${f(h * 0.07)}" rx="12" fill="${p.gold}" opacity="0.9"/>`;
  return o;
}

function reception(r, w, h, p) {
  let o = `<rect width="${w}" height="${h}" fill="url(#bg)"/>`;
  o += bokeh(r, w, h, 40, p.glow, 0.03, 0.55);
  // string lights
  for (let k = 0; k < 3; k++) {
    const y0 = h * (0.08 + k * 0.05);
    let d = `M0 ${f(y0)}`;
    for (let x = 0; x <= w; x += w / 8) d += ` Q${f(x + w / 16)} ${f(y0 + h * 0.07)} ${f(x + w / 8)} ${f(y0)}`;
    o += `<path d="${d}" fill="none" stroke="${p.dark}" stroke-width="1.5" opacity="0.4"/>`;
    for (let i = 0; i < 24; i++) o += `<circle cx="${f((i / 23) * w)}" cy="${f(y0 + Math.sin((i / 23) * Math.PI * 8) * -h * 0.01 + h * 0.03)}" r="5" fill="${p.glow}"/>`;
  }
  const rows = [
    { y: h * 0.58, s: 0.55, xs: [0.18, 0.5, 0.82] },
    { y: h * 0.78, s: 1, xs: [0.3, 0.72] },
  ];
  for (const row of rows) {
    for (const xr of row.xs) {
      const cx = w * xr;
      const rw = w * 0.2 * row.s * 1.6;
      const rh = rw * 0.28;
      o += `<ellipse cx="${f(cx)}" cy="${f(row.y + rh * 1.5)}" rx="${f(rw * 0.95)}" ry="${f(rh * 0.5)}" fill="${p.dark}" opacity="0.22" filter="url(#b2)"/>`;
      o += `<path d="M${f(cx - rw)} ${f(row.y)} L${f(cx - rw * 0.85)} ${f(row.y + rh * 1.6)} L${f(cx + rw * 0.85)} ${f(row.y + rh * 1.6)} L${f(cx + rw)} ${f(row.y)}Z" fill="${p.bg1}"/>`;
      o += `<ellipse cx="${f(cx)}" cy="${f(row.y)}" rx="${f(rw)}" ry="${f(rh)}" fill="${p.bg1}" stroke="${p.gold}" stroke-width="1.5"/>`;
      // centrepiece
      const vh = h * 0.2 * row.s;
      o += `<rect x="${f(cx - 4)}" y="${f(row.y - vh)}" width="8" height="${f(vh)}" fill="${p.gold}"/>`;
      o += `<ellipse cx="${f(cx)}" cy="${f(row.y - vh)}" rx="${f(26 * row.s + 6)}" ry="${f(8 * row.s + 3)}" fill="${p.gold}"/>`;
      o += leaves(r, cx, row.y - vh, 2.8, 14, p.leaf);
      o += flowers(r, cx, row.y - vh - 18 * row.s, 52 * row.s + 10, 36 * row.s + 8, 26, [p.accent, p.bg1, '#fff', p.gold]);
      for (const dx of [-0.6, 0.6]) {
        o += `<rect x="${f(cx + dx * rw - 6)}" y="${f(row.y - 20 * row.s - 10)}" width="12" height="${f(20 * row.s + 10)}" fill="${p.bg2}"/>`;
        o += `<ellipse cx="${f(cx + dx * rw)}" cy="${f(row.y - 24 * row.s - 18)}" rx="4" ry="9" fill="${p.glow}" filter="url(#b1)"/>`;
      }
    }
  }
  return o;
}

function civil(r, w, h, p) {
  const cx = w / 2;
  let o = `<rect width="${w}" height="${h}" fill="url(#bg)"/>`;
  o += bokeh(r, w, h, 18, p.glow, 0.05, 0.5);
  const horizon = h * 0.52;
  o += `<rect y="${f(horizon)}" width="${w}" height="${f(h - horizon)}" fill="${p.floor}"/>`;
  // aisle
  o += `<polygon points="${f(cx - w * 0.04)},${f(horizon)} ${f(cx + w * 0.04)},${f(horizon)} ${f(cx + w * 0.3)},${h} ${f(cx - w * 0.3)},${h}" fill="${p.bg1}"/>`;
  o += `<polygon points="${f(cx - w * 0.04)},${f(horizon)} ${f(cx - w * 0.038)},${f(horizon)} ${f(cx - w * 0.29)},${h} ${f(cx - w * 0.3)},${h}" fill="${p.gold}" opacity="0.8"/>`;
  // backdrop arch
  const aw = w * 0.2;
  o += `<path d="M${f(cx - aw)} ${f(horizon)} L${f(cx - aw)} ${f(horizon - h * 0.2)} A${f(aw)} ${f(aw * 0.95)} 0 0 1 ${f(cx + aw)} ${f(horizon - h * 0.2)} L${f(cx + aw)} ${f(horizon)}" fill="none" stroke="${p.gold}" stroke-width="${f(Math.max(5, w * 0.006))}"/>`;
  o += `<path d="M${f(cx - aw + 18)} ${f(horizon)} L${f(cx - aw + 18)} ${f(horizon - h * 0.2)} A${f(aw - 18)} ${f((aw - 18) * 0.95)} 0 0 1 ${f(cx + aw - 18)} ${f(horizon - h * 0.2)} L${f(cx + aw - 18)} ${f(horizon)}" fill="${p.glow}" opacity="0.25"/>`;
  for (const s of [-1, 1]) {
    o += flowers(r, cx + s * aw, horizon - h * 0.04, 50, 80, 34, [p.accent, p.bg1, '#fff']);
    o += leaves(r, cx + s * aw, horizon - h * 0.02, 2.6, 10, p.leaf);
  }
  o += flowers(r, cx, horizon - h * 0.2 - aw * 0.95, aw * 0.6, 26, 36, [p.accent, p.bg1, p.gold]);
  // chairs in perspective
  for (let row = 0; row < 7; row++) {
    const t = row / 6;
    const y = horizon + h * 0.05 + t * t * (h * 0.4);
    const sz = 8 + t * 40;
    const gap = sz * 1.6;
    for (let side of [-1, 1]) {
      for (let c = 0; c < 4; c++) {
        const x = cx + side * (w * 0.06 + t * w * 0.14 + c * gap + 6);
        o += `<rect x="${f(x - sz / 2)}" y="${f(y - sz * 1.1)}" width="${f(sz)}" height="${f(sz * 1.1)}" rx="2" fill="${p.bg1}" stroke="${p.gold}" stroke-width="${f(0.5 + t)}" opacity="0.95"/>`;
      }
    }
  }
  return o;
}

function lighting(r, w, h, p) {
  let o = `<rect width="${w}" height="${h}" fill="url(#bg)"/>`;
  const n = 16;
  for (let i = 0; i < n; i++) {
    const x = (i / n) * w;
    const sw = w / n;
    o += `<path d="M${f(x)} 0 Q${f(x + sw * 0.5)} ${f(h * 0.45)} ${f(x + sw * 0.15)} ${h} L${f(x + sw)} ${h} Q${f(x + sw * 0.6)} ${f(h * 0.5)} ${f(x + sw * 0.9)} 0Z" fill="${i % 2 ? p.bg2 : p.bg1}" opacity="${f(0.55 + r() * 0.3)}"/>`;
  }
  for (let i = 0; i < 6; i++) {
    const x = w * (0.1 + i * 0.16);
    o += `<ellipse cx="${f(x)}" cy="${f(h * 0.95)}" rx="${f(w * 0.07)}" ry="${f(h * 0.55)}" fill="${[p.glow, p.accent][i % 2]}" opacity="0.55" filter="url(#b3)"/>`;
    o += `<rect x="${f(x - 10)}" y="${f(h * 0.9)}" width="20" height="${f(h * 0.1)}" fill="${p.dark}"/>`;
  }
  o += `<rect y="${f(h * 0.93)}" width="${w}" height="${f(h * 0.07)}" fill="${p.floor}"/>`;
  o += bokeh(r, w, h, 14, p.glow, 0.1, 0.5);
  return o;
}

function dj(r, w, h, p) {
  const cx = w / 2;
  let o = `<rect width="${w}" height="${h}" fill="url(#bg)"/>`;
  const cols = ['#7C5CD8', '#D6B36A', '#C9694F', '#3B82D4', '#E8C9C0'];
  for (let i = 0; i < 9; i++) {
    const x = w * (0.08 + (i / 8) * 0.84);
    const c = cols[i % cols.length];
    const tx = cx + (r() - 0.5) * w * 0.5;
    o += `<polygon points="${f(x - 6)},0 ${f(x + 6)},0 ${f(tx + w * 0.07)},${f(h * 0.8)} ${f(tx - w * 0.07)},${f(h * 0.8)}" fill="${c}" opacity="${f(0.1 + r() * 0.16)}" filter="url(#b1)"/>`;
    o += `<circle cx="${f(x)}" cy="10" r="9" fill="${c}"/>`;
  }
  o += bokeh(r, w, h, 24, p.glow, 0.2, 0.75);
  o += `<rect y="${f(h * 0.8)}" width="${w}" height="${f(h * 0.2)}" fill="${p.floor}"/>`;
  const bw = w * 0.44;
  o += `<rect x="${f(cx - bw / 2)}" y="${f(h * 0.6)}" width="${f(bw)}" height="${f(h * 0.22)}" fill="${p.dark}" stroke="${p.gold}" stroke-width="2"/>`;
  o += `<rect x="${f(cx - bw / 2 + 14)}" y="${f(h * 0.53)}" width="${f(bw - 28)}" height="${f(h * 0.075)}" fill="${p.bg1}" opacity="0.9"/>`;
  for (const s of [-1, 1]) {
    o += `<circle cx="${f(cx + s * bw * 0.28)}" cy="${f(h * 0.57)}" r="${f(bw * 0.09)}" fill="#111" stroke="${p.gold}" stroke-width="2"/>`;
    o += `<circle cx="${f(cx + s * bw * 0.28)}" cy="${f(h * 0.57)}" r="${f(bw * 0.03)}" fill="${p.gold}"/>`;
  }
  for (const s of [-1, 1]) {
    o += `<rect x="${f(cx + s * w * 0.36 - 44)}" y="${f(h * 0.42)}" width="88" height="${f(h * 0.4)}" fill="${p.dark}" stroke="${p.bg1}" stroke-opacity="0.2"/>`;
    o += `<circle cx="${f(cx + s * w * 0.36)}" cy="${f(h * 0.6)}" r="30" fill="none" stroke="${p.bg1}" stroke-opacity="0.35" stroke-width="3"/>`;
  }
  return o;
}

function dancefloor(r, w, h, p) {
  const cx = w / 2;
  let o = `<rect width="${w}" height="${h}" fill="url(#bg)"/>`;
  const hz = h * 0.35;
  const cols = 10;
  const rows = 8;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const t0 = j / rows, t1 = (j + 1) / rows;
      const y0 = hz + (h - hz) * t0 ** 1.6, y1 = hz + (h - hz) * t1 ** 1.6;
      const sp0 = w * (0.25 + 1.1 * t0 ** 1.6) / cols, sp1 = w * (0.25 + 1.1 * t1 ** 1.6) / cols;
      const xa0 = cx + (i - cols / 2) * sp0, xb0 = xa0 + sp0;
      const xa1 = cx + (i - cols / 2) * sp1, xb1 = xa1 + sp1;
      const lit = (i + j) % 2 === 0;
      const c = lit ? (r() > 0.55 ? p.accent : p.gold) : p.dark;
      o += `<polygon points="${f(xa0)},${f(y0)} ${f(xb0)},${f(y0)} ${f(xb1)},${f(y1)} ${f(xa1)},${f(y1)}" fill="${c}" opacity="${lit ? f(0.5 + r() * 0.4) : 0.85}" stroke="${p.glow}" stroke-opacity="0.12"/>`;
    }
  }
  o += `<ellipse cx="${f(cx)}" cy="${f(hz + 40)}" rx="${f(w * 0.42)}" ry="${f(h * 0.2)}" fill="${p.glow}" opacity="0.25" filter="url(#b3)"/>`;
  const cl = [p.accent, p.gold, '#3B82D4', '#C9694F'];
  for (let i = 0; i < 7; i++) {
    const x = w * (0.1 + i * 0.13);
    o += `<polygon points="${f(x - 4)},0 ${f(x + 4)},0 ${f(cx + (r() - 0.5) * w * 0.6 + 60)},${f(h * 0.7)} ${f(cx + (r() - 0.5) * w * 0.6 - 60)},${f(h * 0.7)}" fill="${cl[i % 4]}" opacity="0.14" filter="url(#b1)"/>`;
  }
  o += bokeh(r, w, h, 18, p.glow, 0.05, 0.4);
  return o;
}

function sparklers(r, w, h, p) {
  let o = `<rect width="${w}" height="${h}" fill="url(#bg)"/>`;
  o += bokeh(r, w, h, 12, p.gold, 0.1, 0.8);
  for (let k = 0; k < 9; k++) {
    const cx = w * (0.12 + r() * 0.76);
    const cy = h * (0.35 + r() * 0.35);
    const n = 70 + Math.floor(r() * 50);
    let g = '';
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const len = 30 + r() * 140;
      const x2 = cx + Math.cos(a) * len;
      const y2 = cy + Math.sin(a) * len + len * 0.2;
      g += `<line x1="${f(cx)}" y1="${f(cy)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${r() > 0.5 ? p.glow : p.gold}" stroke-width="${f(0.8 + r() * 1.6)}" stroke-linecap="round" opacity="${f(0.35 + r() * 0.65)}"/>`;
    }
    o += `<g filter="url(#b05)">${g}</g>`;
    o += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(12 + r() * 10)}" fill="${p.glow}" opacity="0.8" filter="url(#b1)"/>`;
    o += `<line x1="${f(cx)}" y1="${f(cy)}" x2="${f(cx - 20 + r() * 40)}" y2="${f(h)}" stroke="${p.floor}" stroke-width="3"/>`;
  }
  return o;
}

function smoke(r, w, h, p) {
  let o = `<rect width="${w}" height="${h}" fill="url(#bg)"/>`;
  const cols = [p.accent, '#3B82D4', p.gold];
  for (let i = 0; i < 3; i++) o += `<ellipse cx="${f(w * (0.2 + i * 0.3))}" cy="${f(h * 0.3)}" rx="${f(w * 0.28)}" ry="${f(h * 0.25)}" fill="${cols[i]}" opacity="0.22" filter="url(#b3)"/>`;
  let g = '';
  for (let i = 0; i < 26; i++) g += `<ellipse cx="${f(r() * w)}" cy="${f(h * (0.55 + r() * 0.4))}" rx="${f(w * (0.1 + r() * 0.22))}" ry="${f(h * (0.04 + r() * 0.1))}" fill="#fff" opacity="${f(0.05 + r() * 0.14)}"/>`;
  o += `<g filter="url(#b3)">${g}</g>`;
  o += bokeh(r, w, h, 14, p.glow, 0.05, 0.5);
  return o;
}

const SCENES = { mandap, reception, civil, lighting, dj, dancefloor, sparklers, smoke };

async function render({ out, scene, pal, w, h, seed, wide }) {
  const p = PAL[pal];
  const r = rng(seed);
  const body = SCENES[scene](r, w, h, p, wide);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.bg1}"/><stop offset="1" stop-color="${p.bg2}"/></linearGradient>
<radialGradient id="vg" cx="50%" cy="50%" r="75%"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.38"/></radialGradient>
<filter id="b05"><feGaussianBlur stdDeviation="0.6"/></filter>
<filter id="b1" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="b2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(w / 40)}"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="${seed}"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.09 0"/></filter>
</defs>
${body}
<rect width="${w}" height="${h}" fill="url(#vg)"/>
<rect width="${w}" height="${h}" filter="url(#grain)"/>
<g font-family="Helvetica, Arial, sans-serif" font-size="${f(Math.max(13, w / 90))}" letter-spacing="2">
<rect x="${f(w * 0.025)}" y="${f(h - Math.max(13, w / 90) * 3)}" width="${f(Math.max(13, w / 90) * 17.5)}" height="${f(Math.max(13, w / 90) * 1.9)}" fill="#000" opacity="0.45"/>
<text x="${f(w * 0.025 + Math.max(13, w / 90) * 0.8)}" y="${f(h - Math.max(13, w / 90) * 1.7)}" fill="#fff">PLACEHOLDER IMAGE</text></g>
</svg>`;
  const file = join(OUT, out);
  mkdirSync(dirname(file), { recursive: true });
  await sharp(Buffer.from(svg)).jpeg({ quality: 80, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(file);
  console.log('wrote', out);
}

const L = { w: 2000, h: 1333 };
const P = { w: 1333, h: 2000 };
const S = { w: 1600, h: 1600 };

const jobs = [
  { out: 'hero/placeholder-hero.jpg', scene: 'mandap', pal: 'ivory', w: 2400, h: 1500, seed: 11, wide: 1.1 },
  { out: 'about/placeholder-about-portrait.jpg', scene: 'mandap', pal: 'blush', ...P, seed: 21, wide: 1.2 },
  { out: 'about/placeholder-about-detail.jpg', scene: 'reception', pal: 'ivory', ...L, seed: 22 },
  { out: 'home/placeholder-cta.jpg', scene: 'lighting', pal: 'night', w: 2200, h: 1300, seed: 31 },

  { out: 'services/placeholder-mandaps.jpg', scene: 'mandap', pal: 'ivory', ...L, seed: 41 },
  { out: 'services/placeholder-decor.jpg', scene: 'lighting', pal: 'blush', ...L, seed: 42 },
  { out: 'services/placeholder-civil.jpg', scene: 'civil', pal: 'ivory', ...L, seed: 43 },
  { out: 'services/placeholder-reception.jpg', scene: 'reception', pal: 'sage', ...L, seed: 44 },
  { out: 'services/placeholder-dj.jpg', scene: 'dj', pal: 'night', ...L, seed: 45 },
  { out: 'services/placeholder-effects.jpg', scene: 'sparklers', pal: 'noir', ...L, seed: 46 },
  { out: 'services/placeholder-dancefloor.jpg', scene: 'dancefloor', pal: 'night', ...L, seed: 47 },
  { out: 'services/placeholder-packages.jpg', scene: 'mandap', pal: 'sage', ...L, seed: 48, wide: 0.9 },

  // Project 1 - Ivory & gold mandap
  { out: 'gallery/placeholder-ivory-mandap-1.jpg', scene: 'mandap', pal: 'ivory', ...L, seed: 101 },
  { out: 'gallery/placeholder-ivory-mandap-2.jpg', scene: 'mandap', pal: 'ivory', ...P, seed: 102, wide: 1.25 },
  { out: 'gallery/placeholder-ivory-mandap-3.jpg', scene: 'mandap', pal: 'ivory', ...S, seed: 103, wide: 0.95 },
  // Project 2 - Reception tables
  { out: 'gallery/placeholder-reception-1.jpg', scene: 'reception', pal: 'sage', ...L, seed: 111 },
  { out: 'gallery/placeholder-reception-2.jpg', scene: 'reception', pal: 'blush', ...P, seed: 112 },
  { out: 'gallery/placeholder-reception-3.jpg', scene: 'reception', pal: 'ivory', ...S, seed: 113 },
  // Project 3 - Civil ceremony
  { out: 'gallery/placeholder-civil-1.jpg', scene: 'civil', pal: 'blush', ...L, seed: 121 },
  { out: 'gallery/placeholder-civil-2.jpg', scene: 'civil', pal: 'ivory', ...P, seed: 122 },
  { out: 'gallery/placeholder-civil-3.jpg', scene: 'lighting', pal: 'ivory', ...S, seed: 123 },
  // Project 4 - Dancefloor night
  { out: 'gallery/placeholder-night-1.jpg', scene: 'dancefloor', pal: 'night', ...L, seed: 131 },
  { out: 'gallery/placeholder-night-2.jpg', scene: 'dj', pal: 'night', ...P, seed: 132 },
  { out: 'gallery/placeholder-night-3.jpg', scene: 'smoke', pal: 'night', ...S, seed: 133 },
  // Project 5 - Blush stage
  { out: 'gallery/placeholder-blush-stage-1.jpg', scene: 'mandap', pal: 'blush', ...L, seed: 141, wide: 1.15 },
  { out: 'gallery/placeholder-blush-stage-2.jpg', scene: 'mandap', pal: 'blush', ...S, seed: 142, wide: 0.9 },
  { out: 'gallery/placeholder-blush-stage-3.jpg', scene: 'lighting', pal: 'blush', ...P, seed: 143 },
  // Project 6 - Sparkler exit
  { out: 'gallery/placeholder-sparklers-1.jpg', scene: 'sparklers', pal: 'noir', ...L, seed: 151 },
  { out: 'gallery/placeholder-sparklers-2.jpg', scene: 'sparklers', pal: 'night', ...P, seed: 152 },
  { out: 'gallery/placeholder-sparklers-3.jpg', scene: 'smoke', pal: 'noir', ...L, seed: 153 },
];

for (const j of jobs) await render(j);
