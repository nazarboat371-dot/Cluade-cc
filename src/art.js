/* Generated artwork: spice pattern tiles, film grain, and illustrated food "shots". */

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/* ---------- tone-on-tone spice pattern ---------- */

const CHILI = (c) =>
  `<path d="M-30 -4C-12 -22 22 -20 44 6C22 -4 0 0 -26 10Z" fill="${c}"/><path d="M-28 4C-34 -2 -36 -10 -34 -18" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
const ANISE = (c) =>
  Array.from({ length: 8 }, (_, i) => `<ellipse cx="0" cy="-15" rx="6" ry="14" transform="rotate(${i * 45})" fill="${c}"/>`).join('') +
  `<circle r="5" fill="${c}"/>`;
const LEAF = (c, bg) =>
  `<path d="M-30 0Q0 -24 30 0Q0 24 -30 0Z" fill="${c}"/><path d="M-26 0H24" stroke="${bg}" stroke-width="2.5" opacity=".7"/>`;
const SEED = (c) => `<ellipse rx="6" ry="10" fill="${c}"/>`;

export function spicePattern(fg, bg, seed = 3) {
  const S = 260;
  const r = rng(seed);
  const items = [];
  const cells = 4;
  for (let gy = 0; gy < cells; gy++) {
    for (let gx = 0; gx < cells; gx++) {
      const x = (gx + 0.5) * (S / cells) + (r() - 0.5) * 22;
      const y = (gy + 0.5) * (S / cells) + (r() - 0.5) * 22;
      const kind = (gx + gy * 3 + Math.floor(r() * 2)) % 4;
      const rot = Math.round(r() * 360);
      const sc = (0.55 + r() * 0.35).toFixed(2);
      const shape = [CHILI(fg), ANISE(fg), LEAF(fg, bg), SEED(fg)][kind];
      items.push(`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${sc})">${shape}</g>`);
    }
  }
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${items.join('')}</svg>`);
}

/* ---------- film grain (canvas noise tile) ---------- */

export function grainTile() {
  const S = 160;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return `url(${c.toDataURL('image/png')})`;
}

/* ---------- food illustrations (top-down "shots") ---------- */

const defs = (id) => `
  <defs>
    <radialGradient id="sauce-${id}" cx="45%" cy="40%" r="65%">
      <stop offset="0" stop-color="#F0741E"/><stop offset=".55" stop-color="#C8410D"/><stop offset="1" stop-color="#8A2306"/>
    </radialGradient>
    <radialGradient id="bowl-${id}" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#FFF8EA"/><stop offset=".8" stop-color="#EBDCC0"/><stop offset="1" stop-color="#CDB894"/>
    </radialGradient>
    <radialGradient id="chunk-${id}" cx="35%" cy="30%" r="80%">
      <stop offset="0" stop-color="#F7B267"/><stop offset=".6" stop-color="#C9601C"/><stop offset="1" stop-color="#7A2B08"/>
    </radialGradient>
    <filter id="soft-${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>
  </defs>`;

function leaves(r, n, cx, cy, spread, color = '#3E8E2E') {
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * spread;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rot = Math.round(r() * 360);
    out += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot})"><path d="M-9 0Q0 -9 9 0Q0 9 -9 0Z" fill="${color}"/><path d="M-7 0H7" stroke="#2A6A1E" stroke-width="1.2"/></g>`;
  }
  return out;
}

function curryBowl(id, r, cx = 200, cy = 200, R = 150) {
  let chunks = '';
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * R * 0.55;
    const w = 26 + r() * 18;
    chunks += `<rect x="${(-w / 2).toFixed(1)}" y="${(-w * 0.4).toFixed(1)}" width="${w.toFixed(1)}" height="${(w * 0.8).toFixed(1)}" rx="10" fill="url(#chunk-${id})" transform="translate(${(cx + Math.cos(a) * d).toFixed(1)} ${(cy + Math.sin(a) * d).toFixed(1)}) rotate(${Math.round(r() * 180)})"/>`;
  }
  return `
    <ellipse cx="${cx + 14}" cy="${cy + 22}" rx="${R}" ry="${R * 0.96}" fill="#000" opacity=".28" filter="url(#soft-${id})"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#bowl-${id})"/>
    <circle cx="${cx}" cy="${cy}" r="${R * 0.8}" fill="url(#sauce-${id})"/>
    ${chunks}
    <path d="M${cx - 60} ${cy - 10}c20-30 60-30 70 0s40 30 60 0" stroke="#FFF1DE" stroke-width="9" fill="none" stroke-linecap="round" opacity=".85"/>
    ${leaves(r, 10, cx, cy, R * 0.6)}
    <circle cx="${cx - R * 0.45}" cy="${cy - R * 0.5}" r="${R * 0.12}" fill="#fff" opacity=".35"/>`;
}

function naan(id, r, cx, cy, s = 1) {
  let spots = '';
  for (let i = 0; i < 18; i++) {
    spots += `<ellipse cx="${(cx + (r() - 0.5) * 120 * s).toFixed(1)}" cy="${(cy + (r() - 0.5) * 66 * s).toFixed(1)}" rx="${(4 + r() * 9) * s}" ry="${(3 + r() * 6) * s}" fill="#6B3410" opacity="${(0.35 + r() * 0.4).toFixed(2)}"/>`;
  }
  return `
    <path d="M${cx - 95 * s} ${cy}c0-50 60-70 110-62s85 30 80 62-60 60-110 55-80-20-80-55z" fill="#000" opacity=".25" filter="url(#soft-${id})" transform="translate(10 14)"/>
    <path d="M${cx - 95 * s} ${cy}c0-50 60-70 110-62s85 30 80 62-60 60-110 55-80-20-80-55z" fill="#E9B46A"/>
    <path d="M${cx - 70 * s} ${cy - 6}c10-30 50-40 90-34" stroke="#FCE0A8" stroke-width="${10 * s}" fill="none" stroke-linecap="round" opacity=".7"/>
    ${spots}
    ${leaves(r, 6, cx, cy, 50 * s, '#4C9A34')}`;
}

function riceBowl(id, r, cx, cy, R) {
  let grains = '';
  for (let i = 0; i < 170; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * R * 0.74;
    grains += `<ellipse cx="${(cx + Math.cos(a) * d).toFixed(1)}" cy="${(cy + Math.sin(a) * d).toFixed(1)}" rx="5.5" ry="2.2" transform="rotate(${Math.round(r() * 180)} ${(cx + Math.cos(a) * d).toFixed(1)} ${(cy + Math.sin(a) * d).toFixed(1)})" fill="${r() < 0.2 ? '#FFC21A' : '#FFFDF6'}"/>`;
  }
  let threads = '';
  for (let i = 0; i < 12; i++) {
    const x = cx + (r() - 0.5) * R;
    const y = cy + (r() - 0.5) * R;
    threads += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}q6 -8 14 -4" stroke="#E8590C" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }
  return `
    <circle cx="${cx + 12}" cy="${cy + 18}" r="${R}" fill="#000" opacity=".28" filter="url(#soft-${id})"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="#1E0B05"/>
    <circle cx="${cx}" cy="${cy}" r="${R * 0.86}" fill="#F3E6CC"/>
    ${grains}${threads}
    <circle cx="${cx - R * 0.42}" cy="${cy - R * 0.5}" r="${R * 0.1}" fill="#fff" opacity=".4"/>`;
}

function skewers(id, r) {
  let out = '';
  for (let k = 0; k < 3; k++) {
    const y = 120 + k * 90;
    out += `<rect x="40" y="${y - 3}" width="330" height="6" rx="3" fill="#B0814F" transform="rotate(-12 200 ${y})"/>`;
    let pieces = '';
    for (let i = 0; i < 5; i++) {
      const x = 90 + i * 52;
      const kind = (i + k) % 3;
      const fill = kind === 0 ? `url(#chunk-${id})` : kind === 1 ? '#E63B2E' : '#F5E7C6';
      pieces += `<rect x="${x - 21}" y="${y - 20}" width="42" height="40" rx="${kind === 2 ? 6 : 12}" fill="${fill}"/>`;
      if (kind === 0) pieces += `<path d="M${x - 12} ${y - 10}l20 18M${x - 2} ${y - 16}l16 14" stroke="#4A1A04" stroke-width="3" opacity=".6"/>`;
    }
    out += `<g transform="rotate(-12 200 ${y})">${pieces}</g>`;
  }
  return `
    <rect x="30" y="40" width="340" height="330" rx="40" fill="#000" opacity=".25" filter="url(#soft-${id})" transform="translate(10 16)"/>
    <rect x="30" y="40" width="340" height="330" rx="40" fill="#2B140B"/>
    <rect x="44" y="54" width="312" height="302" rx="30" fill="none" stroke="#3E1F12" stroke-width="3"/>
    ${out}${leaves(r, 8, 200, 210, 140)}
    <path d="M300 320c18-6 30-4 40 6" stroke="#FFC21A" stroke-width="14" stroke-linecap="round" fill="none"/>`;
}

function chutneys(id, r) {
  const bowl = (cx, cy, R, fill, top) => `
    <circle cx="${cx + 8}" cy="${cy + 12}" r="${R}" fill="#000" opacity=".28" filter="url(#soft-${id})"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#bowl-${id})"/>
    <circle cx="${cx}" cy="${cy}" r="${R * 0.76}" fill="${fill}"/>
    ${top}`;
  return (
    bowl(130, 140, 85, '#4FA34A', leaves(r, 4, 130, 140, 30, '#2E7A24')) +
    bowl(285, 175, 70, '#D62F1F', `<circle cx="275" cy="168" r="6" fill="#FFC21A"/><circle cx="295" cy="185" r="4" fill="#FFC21A"/>`) +
    bowl(175, 300, 78, '#F4A21A', `<path d="M150 290c15-14 40-14 50 4" stroke="#FFE6A0" stroke-width="7" fill="none" stroke-linecap="round"/>`) +
    `<g transform="translate(318 318) rotate(30)">${leaves(r, 1, 0, 0, 0, '#3E8E2E')}</g>`
  );
}

function spices(id, r) {
  const star = (cx, cy, s, rot) =>
    `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})">${Array.from({ length: 8 }, (_, i) => `<ellipse cx="0" cy="-16" rx="6.5" ry="15" fill="#7A3A12" stroke="#4A1F06" stroke-width="2" transform="rotate(${i * 45})"/>`).join('')}<circle r="6" fill="#4A1F06"/></g>`;
  const chili = (cx, cy, s, rot, fill = '#D7261E') =>
    `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})"><path d="M-40 -4C-16 -26 30 -24 58 8C30 -4 0 2 -36 12Z" fill="${fill}"/><path d="M-12 -12c10-4 24-4 34 2" stroke="#fff" stroke-width="4" opacity=".35" fill="none" stroke-linecap="round"/><path d="M-38 4C-46 -4 -46 -14 -42 -22" stroke="#3E8E2E" stroke-width="7" stroke-linecap="round" fill="none"/></g>`;
  const cinnamon = (cx, cy, rot) =>
    `<g transform="translate(${cx} ${cy}) rotate(${rot})"><rect x="-80" y="-12" width="160" height="24" rx="10" fill="#9A4E1E"/><path d="M-78 -2H78" stroke="#6A2F0C" stroke-width="3"/><ellipse cx="80" cy="0" rx="8" ry="12" fill="#6A2F0C"/></g>`;
  let pods = '';
  for (let i = 0; i < 9; i++) {
    const px = (200 + (r() - 0.5) * 230).toFixed(1);
    const py = (220 + (r() - 0.5) * 230).toFixed(1);
    pods += `<ellipse cx="${px}" cy="${py}" rx="12" ry="7" fill="#8DB054" stroke="#5E7E2E" stroke-width="2" transform="rotate(${Math.round(r() * 180)} ${px} ${py})"/>`;
  }
  let dust = '';
  for (let i = 0; i < 160; i++) {
    dust += `<circle cx="${(260 + (r() - 0.5) * 110).toFixed(1)}" cy="${(110 + (r() - 0.5) * 80).toFixed(1)}" r="${(1 + r() * 2.5).toFixed(1)}" fill="${r() < 0.5 ? '#FFC21A' : '#E8590C'}"/>`;
  }
  return `${cinnamon(150, 300, -24)}${cinnamon(190, 330, -18)}${pods}${dust}${star(120, 130, 1.4, 10)}${star(300, 260, 1.1, 30)}${chili(230, 190, 1.3, -20)}${chili(110, 230, 1.0, 40, '#B5121B')}`;
}

const SHOTS = [
  { id: 'curry', title: 'Classic chicken tikka', bg: '#E8590C', art: (r) => curryBowl('curry', r) },
  { id: 'naan', title: 'Garlic naan swipe', bg: '#FF2D87', art: (r) => naan('naan', r, 190, 170, 1.15) + naan('naan', r, 220, 270, 1) },
  { id: 'rice', title: 'Saffron rice bed', bg: '#1E0B05', art: (r) => riceBowl('rice', r, 200, 200, 150) },
  { id: 'skewer', title: 'Grill-night skewers', bg: '#FFF4DE', art: (r) => skewers('skewer', r) },
  { id: 'chutney', title: 'Chutney trio', bg: '#E8590C', art: (r) => chutneys('chutney', r) },
  { id: 'spice', title: 'Whole-spice mise', bg: '#FF2D87', art: (r) => spices('spice', r) },
];

function shotSvg(shot, seed) {
  const r = rng(seed);
  return `<svg viewBox="0 0 400 400" role="img" aria-label="${shot.title}" xmlns="http://www.w3.org/2000/svg">${defs(shot.id)}${shot.art(r)}</svg>`;
}

export function renderGallery(root) {
  root.innerHTML = SHOTS.map(
    (s, i) => `
    <figure class="shot shot--${i + 1}" data-speed="${[0.6, -0.4, 0.9, -0.7, 0.4, -0.5][i]}" style="--bg:${s.bg}">
      <div class="shot__frame">${shotSvg(s, 11 + i * 7)}</div>
      <figcaption><span class="shot__num">0${i + 1}</span>${s.title}</figcaption>
    </figure>`
  ).join('');
}

/* ---------- recipe cards ---------- */

const RECIPES = [
  {
    title: '20-Minute Chicken Tikka',
    time: '20 min',
    serves: 'Serves 4',
    heat: 2,
    bg: '#FF2D87',
    steps: 'Sear 600g chicken thigh, pour in the jar, simmer 12 min. Finish with butter & cilantro.',
    art: (r) => curryBowl('rc1', r, 200, 200, 160),
  },
  {
    title: 'Paneer Riot Skillet',
    time: '25 min',
    serves: 'Serves 3',
    heat: 2,
    bg: '#FFC21A',
    steps: 'Char cubed paneer & peppers in a hot skillet. Add the sauce, a splash of cream, and peas.',
    art: (r) => skewers('rc2', r),
  },
  {
    title: 'Sheet-Pan Chickpea Masala',
    time: '35 min',
    serves: 'Serves 4',
    heat: 1,
    bg: '#E8590C',
    steps: 'Roast chickpeas, cauliflower & onion. Toss in half a jar, roast 10 more. Serve on saffron rice.',
    art: (r) => riceBowl('rc3', r, 200, 200, 160),
  },
];

const chiliIcon = (on) =>
  `<svg viewBox="0 0 24 24" class="${on ? 'on' : ''}" aria-hidden="true"><path d="M3 11c5-6 13-6 18 2-6-3-11-2-16 3z" fill="currentColor"/><path d="M4 12c-1-2-1-4 0-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;

export function renderRecipes(root) {
  root.innerHTML = RECIPES.map(
    (c, i) => `
    <article class="card" style="--bg:${c.bg}" data-tilt>
      <div class="card__inner">
        <div class="card__art">${`<svg viewBox="0 0 400 400" aria-hidden="true">${defs('rc' + (i + 1))}${c.art(rng(99 + i))}</svg>`}</div>
        <div class="card__body">
          <ul class="card__meta">
            <li>${c.time}</li><li>${c.serves}</li>
            <li class="card__heat" aria-label="Heat ${c.heat} of 3">${[0, 1, 2].map((k) => chiliIcon(k < c.heat)).join('')}</li>
          </ul>
          <h3>${c.title}</h3>
          <p>${c.steps}</p>
          <a class="card__link" href="#order">Get the recipe <span aria-hidden="true">→</span></a>
        </div>
        <span class="card__glare" aria-hidden="true"></span>
      </div>
    </article>`
  ).join('');
}

export const MARQUEE_WORDS = [
  'Small batch',
  'Slow simmered',
  'No preservatives',
  'Real cream',
  'Hand-toasted spices',
  'Glass jar',
  '20-min dinners',
];
