import '@fontsource/anton/400.css';
import '@fontsource-variable/archivo/wdth.css';
import 'lenis/dist/lenis.css';
import './styles.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { spicePattern, grainTile, renderGallery, renderRecipes, MARQUEE_WORDS } from './art.js';

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const TAU = Math.PI * 2;

/* ---------- generated textures ---------- */
const root = document.documentElement.style;
root.setProperty('--pattern-orange', spicePattern('#D24F09', '#E8590C', 3));
root.setProperty('--pattern-pink', spicePattern('#F21F7C', '#FF2D87', 8));
root.setProperty('--grain', grainTile());

renderGallery($('[data-gallery]'));
renderRecipes($('[data-cards]'));

/* ---------- marquee content ---------- */
const star = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" fill="currentColor"/></svg>`;
$$('[data-marquee]').forEach((track, i) => {
  const words = i ? [...MARQUEE_WORDS].reverse() : MARQUEE_WORDS;
  const run = words.map((w) => `<span>${w}${star}</span>`).join('');
  track.innerHTML = run + run + run + run;
});

/* ---------- word splitting ---------- */
function splitWords(el) {
  // keep authored <br> line breaks, wrap every word in a mask
  const lines = el.innerHTML.split(/<br\s*\/?>/i).map((html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent.trim().replace(/\s+/g, ' ');
  });
  el.setAttribute('aria-label', lines.join(' '));
  const esc = (w) => w.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  el.innerHTML = lines
    .map((line) => line.split(' ').map((w) => `<span class="w" aria-hidden="true"><span>${esc(w)}</span></span>`).join(' '))
    .join('<br>');
  return $$('.w > span', el);
}
$$('[data-split]').forEach(splitWords);

/* ---------- fit text to its container width ---------- */
function fitText() {
  $$('[data-fit]').forEach((el) => {
    el.style.fontSize = '100px';
    el.style.width = 'max-content';
    const parent = el.parentElement;
    const cs = getComputedStyle(parent);
    const avail = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const w = el.getBoundingClientRect().width;
    el.style.width = '';
    // leave room for the 0.06em extrusion on the right
    const share = parseFloat(el.dataset.fit) || 0.985; // share of the width to fill
    el.style.fontSize = `${Math.floor((100 * avail * share) / (w + 6))}px`;
  });
}

/* ---------- nav ---------- */
function initNav() {
  const nav = $('[data-nav]');
  const btn = $('[data-menu]');
  const links = $('#nav-links');
  const setOpen = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    links.classList.toggle('is-open', open);
  };
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', (e) => e.target.closest('a') && setOpen(false));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false));

  ScrollTrigger.create({
    start: 'top -120',
    end: 'max',
    onUpdate(self) {
      const hide = self.direction === 1 && self.scroll() > 200;
      nav.classList.toggle('is-hidden', hide);
      if (hide) setOpen(false);
    },
  });
}

/* ---------- smooth scroll ---------- */
let lenis = null;
function initScroll() {
  if (reduced) return;
  lenis = new Lenis({
    lerp: 0.1,
    wheelMultiplier: 1,
    anchors: true,
    // Drive touch scrolling from the same frame loop as the WebGL jar. With native touch
    // scrolling the page moves on the compositor thread and the jar (placed from JS) trails
    // behind on fast swipes; syncing keeps the jar glued to its panel.
    // Release glide tuned against native iOS: a fast 2700px/s flick glides ~1.4k px.
    syncTouch: true,
    syncTouchLerp: 0.07,
    touchInertiaExponent: 1.9,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- reveals ---------- */
function revealWords(el, opts = {}) {
  const words = $$('.w > span', el);
  if (reduced) return;
  gsap.from(words, {
    yPercent: 115,
    rotate: 6,
    duration: 1.05,
    ease: 'expo.out',
    stagger: 0.07,
    scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
    ...opts,
  });
}

function initReveals() {
  $$('[data-split]')
    .filter((el) => !el.closest('.hero') && !el.closest('.story'))
    .forEach((el) => revealWords(el));

  if (reduced) return;
  $$('[data-fade]')
    .filter((el) => !el.closest('.hero'))
    .forEach((el) => {
      gsap.from(el, {
        y: 40,
        autoAlpha: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' },
      });
    });
}

/* ---------- hero intro ---------- */
function heroIntro(stage) {
  const words = $$('.hero [data-split] .w > span');
  const fades = $$('.hero [data-fade], .hero__badge, .hero__scroll');
  if (reduced) {
    if (stage) stage.intro = 1;
    return;
  }
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.nav > *', { y: -30, autoAlpha: 0, duration: 0.9, stagger: 0.08 }, 0)
    .from(words, { yPercent: 115, rotate: 8, duration: 1.3, stagger: 0.08 }, 0.1)
    .from(fades, { y: 30, autoAlpha: 0, duration: 1, stagger: 0.1 }, 0.6);
  if (stage) tl.to(stage, { intro: 1, duration: 1.8, ease: 'elastic.out(1, 0.75)' }, 0.25);
}

/* ---------- pinned story ---------- */
const story = { progress: 0 };
function initStory() {
  const section = $('.story');
  const a = $$('[data-story="a"] .w > span', section);
  const b = $$('[data-story="b"] .w > span', section);
  const aEls = $$('[data-story="a"]', section);
  const bEls = $$('[data-story="b"]', section);
  const notes = $$('.note', section);

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${window.innerHeight * 2.4}`,
      pin: true,
      scrub: reduced ? true : 0.3,
      onUpdate: (self) => (story.progress = self.progress),
      invalidateOnRefresh: true,
    },
  });

  if (reduced) {
    gsap.set(bEls, { autoAlpha: 0 });
    tl.to(aEls, { autoAlpha: 0, duration: 0.1 }, 0.45).to(bEls, { autoAlpha: 1, duration: 0.1 }, 0.5);
    tl.to(notes, { autoAlpha: 1, duration: 0.05, stagger: 0.2 }, 0.15);
  } else {
    gsap.set(b, { yPercent: 115 });
    // Entrance animates the line elements, never the words: the scrubbed timeline below owns
    // the words' yPercent, and two tweens on the same property can leave them hidden when
    // someone scrolls back up into the section.
    gsap.from(aEls, {
      yPercent: 35,
      autoAlpha: 0,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: { trigger: section, start: 'top 65%', toggleActions: 'play none none reverse' },
    });
    tl.fromTo(a, { yPercent: 0 }, { yPercent: -115, stagger: 0.03, duration: 0.12, ease: 'power2.in', immediateRender: false }, 0.4)
      .to(b, { yPercent: 0, rotate: 0, stagger: 0.03, duration: 0.14, ease: 'power3.out' }, 0.52);
    notes.forEach((n, i) => {
      tl.fromTo(n, { autoAlpha: 0, scale: 0.6, y: 20 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.06, ease: 'back.out(2)' }, 0.12 + i * 0.22);
      tl.to(n, { autoAlpha: 0, y: -20, duration: 0.05 }, 0.3 + i * 0.22);
    });
  }
  tl.fromTo('.story__bar', { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
}

/* ---------- pinned inside ---------- */
const inside = { progress: 0 };
function initInside() {
  const section = $('.inside');
  const tags = $$('.tag', section);
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${window.innerHeight * 2}`,
      pin: true,
      scrub: reduced ? true : 0.3,
      onUpdate: (self) => (inside.progress = self.progress),
      invalidateOnRefresh: true,
    },
  });
  if (reduced) {
    tl.from(tags, { autoAlpha: 0, duration: 0.02, stagger: 0.1 }, 0.05);
  } else {
    tl.from(tags, { autoAlpha: 0, scale: 0, y: 30, duration: 0.08, ease: 'back.out(2.5)', stagger: 0.09 }, 0.05);
  }
  const count = $('[data-count]');
  const c = { v: 0 };
  tl.to(c, { v: 12, duration: 0.8, onUpdate: () => (count.textContent = Math.round(c.v)) }, 0.05);
}

/* ---------- marquee ---------- */
function initMarquee() {
  if (reduced) return;
  const tweens = $$('[data-marquee]').map((track) => {
    const dir = Number(track.dataset.marquee);
    return gsap.fromTo(
      track,
      { xPercent: dir > 0 ? 0 : -25 },
      { xPercent: dir > 0 ? -25 : 0, duration: 18, ease: 'none', repeat: -1 }
    );
  });
  // scroll velocity briefly speeds the bands up, then they ease back
  let boost = 1;
  ScrollTrigger.create({
    trigger: '.marquee',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate(self) {
      boost = Math.max(boost, Math.min(5, 1 + Math.abs(self.getVelocity()) / 600));
    },
  });
  gsap.ticker.add(() => {
    boost += (1 - boost) * 0.06;
    tweens.forEach((t) => t.timeScale(boost));
  });
}

/* ---------- gallery parallax ---------- */
function initGallery() {
  if (reduced) return;
  $$('.shot').forEach((shot) => {
    const speed = Number(shot.dataset.speed) || 0;
    gsap.fromTo(
      shot,
      { y: () => speed * window.innerHeight * 0.12 },
      {
        y: () => -speed * window.innerHeight * 0.12,
        ease: 'none',
        scrollTrigger: { trigger: shot, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      }
    );
    gsap.fromTo(
      $('svg', shot),
      { rotate: -6 * Math.sign(speed), scale: 1.08 },
      { rotate: 6 * Math.sign(speed), scale: 1, ease: 'none', scrollTrigger: { trigger: shot, start: 'top bottom', end: 'bottom top', scrub: true } }
    );
  });
}

/* ---------- highlighter strokes ---------- */
function initHighlights() {
  if (reduced) return;
  // the marker "draws" left-to-right by unclipping the stroke
  document.documentElement.classList.add('js-motion');
  $$('.hl svg').forEach((svg) => {
    gsap.fromTo(
      svg,
      { clipPath: 'inset(-40% 100% -40% -12%)' },
      {
        clipPath: 'inset(-40% -12% -40% -12%)',
        ease: 'none',
        scrollTrigger: { trigger: svg.closest('.hl'), start: 'top 85%', end: 'top 50%', scrub: 0.3 },
      }
    );
  });
}

/* ---------- 3D card tilt ---------- */
function initCards() {
  if (reduced || !finePointer) return;
  $$('[data-tilt]').forEach((card) => {
    const inner = $('.card__inner', card);
    const rx = gsap.quickTo(inner, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(inner, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    const lift = gsap.quickTo(inner, 'z', { duration: 0.6, ease: 'power3.out' });
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 16);
      rx(-py * 14);
      lift(30);
      inner.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
      inner.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
      card.classList.add('is-tilting');
    });
    card.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
      lift(0);
      card.classList.remove('is-tilting');
    });
  });
  if (!reduced) {
    gsap.from('.card', {
      y: 80,
      rotate: (i) => [-4, 2, 5][i],
      autoAlpha: 0,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: { trigger: '.cards', start: 'top 85%', toggleActions: 'play none none reverse' },
    });
  }
}

/* ---------- newsletter ---------- */
function initForm() {
  const form = $('[data-form]');
  const input = $('input', form);
  const msg = $('[data-form-msg]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    input.setAttribute('aria-invalid', String(!ok));
    if (!ok) {
      msg.textContent = 'Hmm, that email looks a little under-seasoned. Try again?';
      input.focus();
      return;
    }
    msg.textContent = 'You’re in! Check your inbox for code RIOT10.';
    form.reset();
    if (!reduced) gsap.fromTo('.news__badge', { rotate: 12, scale: 1 }, { rotate: 372, scale: 1.15, duration: 1.2, ease: 'expo.out', yoyo: true });
  });
}

/* ---------- 3D jar ---------- */
async function initJar() {
  const canvas = $('#jar-stage');
  try {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) throw new Error('no webgl');
  } catch {
    canvas.remove();
    return null;
  }
  await Promise.all([document.fonts.load('150px Anton'), document.fonts.load('800 22px "Archivo Variable"'), document.fonts.load('600 22px "Archivo Variable"')]);
  const { JarStage } = await import('./jar/stage.js');
  const stage = new JarStage(canvas, { reduced });

  const still = (x, y, z) => () => ({ x, y, z });
  const idle = reduced ? 0 : 1;
  stage.setAnchors([
    {
      el: $('[data-jar="hero"]'),
      travel: true,
      bob: idle,
      fill: 0.95,
      rot: (t) => ({ x: 0.2, y: -0.35 + Math.sin(t * 0.55) * 0.42 * idle, z: -0.07 + Math.sin(t * 0.8) * 0.03 * idle }),
    },
    {
      el: $('[data-jar="story"]'),
      travel: true,
      bob: 0.3 * idle,
      fill: 0.95,
      rot: () => {
        if (reduced) return { x: 0.2, y: -0.35, z: -0.07 };
        const p = story.progress;
        const e = gsap.parseEase('power2.inOut')(p);
        // a full tumble + spin, ending with the lid square to the camera
        return {
          x: 0.2 + e * (TAU + Math.PI / 2 - 0.2),
          y: -0.35 + e * (TAU + 0.35),
          z: -0.07 + Math.sin(p * Math.PI) * 0.6 + e * 0.07,
        };
      },
      parallax: 0.6,
    },
    {
      el: $('[data-jar="split"]'),
      travel: false,
      bob: idle,
      fill: 0.8,
      rot: reduced ? still(0.18, -0.3, 0.06) : (t) => ({ x: TAU + 0.18, y: TAU - 0.3 + Math.sin(t * 0.5) * 0.3, z: 0.06 }),
    },
    {
      el: $('[data-jar="inside"]'),
      travel: false,
      bob: 0.4 * idle,
      fill: 0.95,
      rot: (t) => {
        const p = inside.progress;
        return reduced
          ? { x: 0.15, y: 0, z: 0 }
          : { x: 0.16 + Math.sin(p * Math.PI) * 0.12, y: -0.6 + gsap.parseEase('power1.inOut')(p) * TAU * 2, z: Math.sin(p * TAU) * 0.06 };
      },
      parallax: 0.5,
    },
    {
      el: $('[data-jar="news"]'),
      travel: false,
      bob: idle,
      fill: 0.78,
      rot: (t) => ({ x: 0.14, y: 0.45 + Math.sin(t * 0.6) * 0.35 * idle, z: 0.12 }),
    },
  ]);

  gsap.ticker.add((_, dt) => stage.update(Math.min(dt, 50) / 1000));
  return stage;
}

/* ---------- boot ---------- */
async function boot() {
  initNav();
  initScroll();
  await document.fonts.ready;
  fitText();
  initStory();
  initInside();
  initReveals();
  initMarquee();
  initGallery();
  initHighlights();
  initCards();
  initForm();

  const stage = await initJar().catch((e) => {
    console.warn('Jar stage unavailable:', e);
    return null;
  });
  heroIntro(stage);
  ScrollTrigger.refresh();

  let w = window.innerWidth;
  window.addEventListener('resize', () => {
    // ignore mobile URL-bar height jitter
    if (window.innerWidth === w) return;
    w = window.innerWidth;
    fitText();
    ScrollTrigger.refresh();
  });
}

boot();
