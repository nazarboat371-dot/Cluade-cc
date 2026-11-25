import * as THREE from 'three';

/* All jar artwork is painted at runtime on <canvas>. No image files. */

const GOLD_STOPS = ['#FFE7A3', '#E9B23C', '#B9801C', '#F6D27A', '#C8922A'];

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function goldGradient(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  GOLD_STOPS.forEach((c, i) => g.addColorStop(i / (GOLD_STOPS.length - 1), c));
  return g;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function toTexture(c, renderer, { srgb = true, repeat = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

/* ---------- little motifs shared by label & lid ---------- */

function drawChili(ctx, x, y, s, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-10, -2);
  ctx.bezierCurveTo(4, -10, 26, -8, 40, 6);
  ctx.bezierCurveTo(26, 0, 8, 2, -8, 6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-10, 2);
  ctx.quadraticCurveTo(-16, -4, -18, -10);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawStar(ctx, x, y, rOuter, rInner, points, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? rInner : rOuter;
    const a = rot + (i * Math.PI) / points - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}

function drawAnise(ctx, x, y, s, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.55, s * 0.18, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLeaf(ctx, x, y, s, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(-s, 0);
  ctx.quadraticCurveTo(0, -s * 0.7, s, 0);
  ctx.quadraticCurveTo(0, s * 0.7, -s, 0);
  ctx.fill();
  ctx.restore();
}

function textAlongArc(ctx, text, cx, cy, radius, startAngle, spacing) {
  ctx.save();
  ctx.translate(cx, cy);
  let a = startAngle;
  for (const ch of text) {
    const w = ctx.measureText(ch).width;
    const step = (w + spacing) / radius;
    ctx.save();
    ctx.rotate(a + step / 2);
    ctx.fillText(ch, 0, -radius);
    ctx.restore();
    a += step;
  }
  ctx.restore();
}

function spacedText(ctx, text, x, y, spacing) {
  // canvas letterSpacing is not everywhere yet; do it by hand, centred on x.
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let cx = x - total / 2;
  const align = ctx.textAlign;
  ctx.textAlign = 'left';
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, cx, y);
    cx += widths[i] + spacing;
  });
  ctx.textAlign = align;
}

/* ---------- LABEL ---------- */
/* The cylinder wraps u: 0..1 with u = 0.5 facing the camera. */

function paintLabel(ctx, W, H, mode) {
  const color = mode === 'color';
  const gold = color ? goldGradient(ctx, 0, 0, 0, H) : '#fff';
  const bg = color ? '#120705' : '#000';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // faint tone-on-tone spice pattern in the black
  if (color) {
    const r = rng(7);
    ctx.fillStyle = 'rgba(255,190,90,0.05)';
    ctx.strokeStyle = 'rgba(255,190,90,0.05)';
    for (let i = 0; i < 70; i++) {
      const x = r() * W;
      const y = r() * H;
      const k = r();
      if (k < 0.33) drawChili(ctx, x, y, 0.9, r() * 6.28);
      else if (k < 0.66) drawAnise(ctx, x, y, 16, r());
      else drawLeaf(ctx, x, y, 18, r() * 6.28);
    }
  }

  ctx.fillStyle = gold;
  ctx.strokeStyle = gold;

  // double rules top & bottom
  ctx.fillRect(0, 26, W, 6);
  ctx.fillRect(0, 42, W, 2);
  ctx.fillRect(0, H - 32, W, 6);
  ctx.fillRect(0, H - 44, W, 2);

  // dotted rows
  for (let x = 8; x < W; x += 22) {
    ctx.beginPath();
    ctx.arc(x, 62, 3, 0, Math.PI * 2);
    ctx.arc(x, H - 62, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  const panel = (u) => u * W;
  const draw = (offsetU) => {
    const cx = panel(0.5 + offsetU);

    // ----- main panel -----
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '600 26px Archivo, sans-serif';
    spacedText(ctx, 'SMALL BATCH  ·  EST. 2019', cx, 104, 6);

    ctx.font = '150px Anton, Impact, sans-serif';
    spacedText(ctx, 'SAFFRON', cx, 250, 6);
    ctx.font = '96px Anton, Impact, sans-serif';
    spacedText(ctx, 'RIOT', cx, 350, 14);

    // flourish
    ctx.fillRect(cx - 230, 312, 110, 4);
    ctx.fillRect(cx + 120, 312, 110, 4);
    drawStar(ctx, cx - 256, 314, 13, 5, 4);
    ctx.fill();
    drawStar(ctx, cx + 256, 314, 13, 5, 4);
    ctx.fill();

    // pill: TIKKA MASALA
    const pw = 300;
    const ph = 44;
    const py = 372;
    ctx.beginPath();
    ctx.roundRect(cx - pw / 2, py, pw, ph, ph / 2);
    ctx.fill();
    ctx.fillStyle = bg;
    ctx.font = '31px Anton, Impact, sans-serif';
    spacedText(ctx, 'TIKKA MASALA', cx, py + 35, 5);
    ctx.fillStyle = gold;

    // ----- side panel left (ingredients) -----
    const lx = panel(0.5 + offsetU - 0.24);
    ctx.font = '40px Anton, Impact, sans-serif';
    spacedText(ctx, 'SIMMER SAUCE', lx, 136, 4);
    ctx.font = '500 21px Archivo, sans-serif';
    const lines = [
      'VINE TOMATOES · CULTURED',
      'CREAM · ONION · GINGER ·',
      'GARLIC · KASHMIRI CHILI ·',
      'GARAM MASALA · FENUGREEK',
      '· SMOKED PAPRIKA · SAFFRON',
    ];
    lines.forEach((l, i) => spacedText(ctx, l, lx, 190 + i * 32, 2));
    ctx.font = '800 22px Archivo, sans-serif';
    spacedText(ctx, 'NET WT 16 OZ (450 g)', lx, 390, 3);

    // ----- side panel right (heat meter + seal) -----
    const rx = panel(0.5 + offsetU + 0.24);
    ctx.save();
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(rx, 214, 96, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rx, 214, 84, 0, Math.PI * 2);
    ctx.stroke();
    drawStar(ctx, rx, 214, 46, 20, 12);
    ctx.fill();
    ctx.fillStyle = bg;
    ctx.font = '40px Anton, Impact, sans-serif';
    ctx.fillText('SR', rx, 229);
    ctx.fillStyle = gold;
    ctx.font = '700 18px Archivo, sans-serif';
    textAlongArc(ctx, 'HAND-TOASTED · SLOW-SIMMERED · ', rx, 214, 70, -Math.PI * 0.96, 3);
    ctx.restore();

    ctx.font = '800 22px Archivo, sans-serif';
    spacedText(ctx, 'HEAT', rx - 70, 366, 3);
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = i < 2 ? 1 : 0.3;
      drawChili(ctx, rx - 10 + i * 46, 360, 0.95, -0.35);
      ctx.globalAlpha = 1;
    }
    ctx.font = '500 20px Archivo, sans-serif';
    spacedText(ctx, 'MEDIUM · SERVES 4', rx, 414, 3);
  };

  // The visible arc spans ~84% of the circumference. Paint once, centred.
  draw(0);

  // decorative vertical rules between panels
  [0.355, 0.645].forEach((u) => {
    for (let y = 90; y < H - 90; y += 18) {
      ctx.beginPath();
      ctx.arc(u * W, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function makeLabelTextures(renderer) {
  const W = 2048;
  const H = 512;
  const [c1, x1] = canvas(W, H);
  paintLabel(x1, W, H, 'color');
  const [c2, x2] = canvas(W, H);
  paintLabel(x2, W, H, 'metal');
  return {
    map: toTexture(c1, renderer),
    metalnessMap: toTexture(c2, renderer, { srgb: false }),
  };
}

/* ---------- LID EMBLEM ---------- */

function paintLid(ctx, S, mode) {
  const color = mode === 'color';
  const gold = color ? goldGradient(ctx, 0, 0, S, S) : '#fff';
  const bg = color ? '#0d0605' : '#000';
  const c = S / 2;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);

  // fine concentric machining rings (only on the colour map)
  if (color) {
    for (let r = 20; r < c; r += 5) {
      ctx.strokeStyle = `rgba(255,255,255,${0.015 + (r % 15 === 0 ? 0.02 : 0)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.fillStyle = gold;
  ctx.strokeStyle = gold;

  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(c, c, S * 0.43, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(c, c, S * 0.405, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(c, c, S * 0.27, 0, Math.PI * 2);
  ctx.stroke();

  // ring text
  ctx.font = `${Math.round(S * 0.058)}px Anton, Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  textAlongArc(ctx, 'SAFFRON RIOT ✦ TIKKA MASALA ✦ BOLD FLAVOR ✦ ', c, c, S * 0.34, -Math.PI / 2 - 0.05, 4);

  // sunburst
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-5, -S * 0.16);
    ctx.lineTo(0, -S * 0.25);
    ctx.lineTo(5, -S * 0.16);
    ctx.fill();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(c, c, S * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = bg;
  ctx.font = `${Math.round(S * 0.15)}px Anton, Impact, sans-serif`;
  ctx.fillText('SR', c, c + S * 0.008);
}

export function makeLidTextures(renderer) {
  const S = 1024;
  const [c1, x1] = canvas(S, S);
  paintLid(x1, S, 'color');
  const [c2, x2] = canvas(S, S);
  paintLid(x2, S, 'metal');
  return {
    map: toTexture(c1, renderer),
    metalnessMap: toTexture(c2, renderer, { srgb: false }),
  };
}

/* ---------- SAUCE ---------- */

export function makeSauceTexture(renderer) {
  const W = 1024;
  const H = 512;
  const [c, ctx] = canvas(W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#3f0702');
  g.addColorStop(0.5, '#6a1004');
  g.addColorStop(1, '#4a0903');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const r = rng(42);
  // oily swirls
  for (let i = 0; i < 60; i++) {
    ctx.strokeStyle = `rgba(${190 + r() * 50}, ${50 + r() * 50}, 8, ${0.08 + r() * 0.12})`;
    ctx.lineWidth = 4 + r() * 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const x = r() * W;
    const y = r() * H;
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + r() * 120 - 60, y + r() * 80 - 40, x + r() * 200 - 100, y + r() * 80 - 40, x + r() * 240 - 120, y + r() * 60 - 30);
    ctx.stroke();
  }
  // cream marbling
  for (let i = 0; i < 14; i++) {
    ctx.strokeStyle = `rgba(255, 150, 110, ${0.05 + r() * 0.06})`;
    ctx.lineWidth = 6 + r() * 10;
    ctx.beginPath();
    const y = r() * H;
    ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += 64) ctx.lineTo(x, y + Math.sin(x * 0.01 + i) * 20);
    ctx.stroke();
  }
  // spice flecks & herbs
  for (let i = 0; i < 900; i++) {
    const k = r();
    ctx.fillStyle = k < 0.55 ? 'rgba(40,8,2,0.55)' : k < 0.85 ? 'rgba(255,170,40,0.5)' : 'rgba(70,120,30,0.7)';
    ctx.beginPath();
    ctx.arc(r() * W, r() * H, 0.8 + r() * 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(c, renderer, { repeat: true });
}

/* ---------- SOFT CONTACT SHADOW ---------- */

export function makeShadowTexture(renderer) {
  const S = 256;
  const [c, ctx] = canvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.85)');
  g.addColorStop(0.35, 'rgba(0,0,0,0.45)');
  g.addColorStop(0.7, 'rgba(0,0,0,0.12)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return toTexture(c, renderer);
}
