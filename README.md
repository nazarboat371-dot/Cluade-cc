# Saffron Riot — Tikka Masala landing page

A one-page 3D product site built with Vite, Three.js, GSAP ScrollTrigger and Lenis.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm run preview  # serve the build
```

## How it's put together

- `index.html` holds the semantic page: nav, hero, pinned story, split, marquee, gallery, why, pinned ingredients, recipes, newsletter and footer.
- `src/jar/stage.js` runs one fixed, transparent WebGL canvas. The jar is placed each frame from DOM "slots" (`[data-jar]`), so CSS owns the layout and the jar follows it. Between "travel" slots the jar glides across the screen. Otherwise it rides with whichever slot is nearest the centre, and the switch happens while both are off-screen.
- `src/jar/textures.js` paints the label, lid emblem, sauce and contact shadow on `<canvas>`. Gold areas also get a metalness map so the lettering catches the studio highlights. There are no image files.
- `src/art.js` generates the tone-on-tone spice pattern (SVG), the film grain (canvas) and the illustrated food shots and recipe art (SVG).
- `src/main.js` wires up Lenis, the ScrollTrigger pins and scrubs, the word reveals, the marquee, parallax, the highlighter strokes, the card tilt and the newsletter form.

With `prefers-reduced-motion`, smooth scrolling, idle spinning, the tumble, the marquee and the reveals are switched off. Content stays fully readable, and the pinned sections switch with simple fades.
