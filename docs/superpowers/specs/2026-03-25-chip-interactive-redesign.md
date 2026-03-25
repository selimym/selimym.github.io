# Chip Interactive Redesign — Design Spec

**Date:** 2026-03-25
**Branch:** redesign/astro-portfolio
**Scope:** `src/components/Hero.astro`, `src/components/Nav.astro`

---

## Context

The portfolio homepage has a detailed SoC die floorplan SVG (SYM-1 chip) displayed on the right side of the hero section. It is currently rendered at 22% opacity — essentially invisible as a decorative element. Users have no reason to interact with it.

This PR makes the chip a meaningful interactive element that serves as a visual portfolio map: hovering over specific chip blocks reveals a slide-in panel with project info and a link. Active blocks get a shimmer animation to signal interactivity. A duplicate contact link in the mobile nav is also fixed.

---

## Changes

### 1. Fix duplicate contact link — `Nav.astro`

**Problem:** The mobile menu has two "Contact" entries — one `nav-link` and one with `text-accent text-sm font-medium` styling (line 40). Only the first is needed.

**Fix:** Remove line 40 exactly — the `<a href="#contact" class="text-accent text-sm font-medium" onclick="closeMobileNav()">Contact</a>` element.

---

### 2. Chip visibility — `Hero.astro`

**Current:** SVG has `opacity-[0.22]`, container is `hidden md:flex justify-center items-center`.

**New:**
- Raise SVG opacity: replace `opacity-[0.22]` with `style="opacity:0.55"` (inline style — `opacity-55` is not in Tailwind v3's default scale)
- Replace the container `<div class="hidden md:flex justify-center items-center">` with a new wrapper structure (see Section 4 for the full DOM layout)
- Add a warm amber radial gradient halo as a sibling `<div>` (not a pseudo-element, to avoid Astro scoped-style complications):
  ```html
  <div class="chip-halo"></div>
  ```
  Styled in Hero.astro's `<style>` tag:
  ```css
  .chip-halo {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 70% 60% at 50% 50%, #F59E0B18 0%, transparent 70%);
    pointer-events: none;
  }
  ```

The SVG internal structure (P-cores, E-cores, CU grid, mesh lines, labels etc.) is **not touched**. Only additions are made inside `<defs>` and at the end of the SVG (overlay rects).

---

### 3. Active block shimmer animation — `Hero.astro`

**Approach:** SVG-native animated `<linearGradient>` using SMIL `<animateTransform>`. This avoids coordinate mapping and works purely within the SVG.

Add to `<defs>`:
```svg
<linearGradient id="shimmer-grad" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse">
  <stop offset="0%"   stop-color="#F59E0B" stop-opacity="0"/>
  <stop offset="50%"  stop-color="#F59E0B" stop-opacity="0.18"/>
  <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
  <animateTransform
    attributeName="gradientTransform"
    type="translate"
    from="-520 0"
    to="520 0"
    dur="3.8s"
    repeatCount="indefinite"/>
</linearGradient>
```

Add transparent overlay `<rect>` elements at the **end** of the SVG (so they sit on top of all existing content), one per active block:
```svg
<rect class="chip-overlay" data-project="neural"  role="button" x="348" y="68"  width="104" height="115" fill="url(#shimmer-grad)" tabindex="0" aria-label="Neural Network Pruning — research paper"/>
<rect class="chip-overlay" data-project="io"       role="button" x="68"  y="278" width="118" height="134" fill="url(#shimmer-grad)" tabindex="0" aria-label="Text-to-SQL — GitHub project"/>
<rect class="chip-overlay" data-project="fabric"   role="button" x="191" y="278" width="95"  height="134" fill="url(#shimmer-grad)" tabindex="0" aria-label="URL Shortener — GitHub project"/>
<rect class="chip-overlay" data-project="enclave"  role="button" x="291" y="278" width="161" height="134" fill="url(#shimmer-grad)" tabindex="0" aria-label="Data Privacy Dystopia — game"/>
```

CSS in Hero.astro `<style>` tag:
```css
.chip-overlay {
  cursor: pointer;
  outline: none;
}
.chip-overlay:hover,
.chip-overlay:focus-visible {
  fill: #F59E0B22;
}
```

On hover/focus, the shimmer gradient persists but the CSS `fill` override replaces it — use JS to toggle a class:
```js
// JS adds .chip-overlay--hover class which sets fill via inline style
// so the gradient stops animating and a static bright fill shows
```
Simpler: use `fill` directly via JS `style.fill` attribute on the overlay rect. On `mouseenter`/`focus`: set `rect.style.fill = '#F59E0B22'`. On `mouseleave`/`blur`: set `rect.style.fill = 'url(#shimmer-grad)'`.

---

### 4. Hover side panel — `Hero.astro`

#### DOM structure

Replace the chip container div with:
```html
<div class="hidden md:block relative" id="chip-wrapper">
  <!-- Ambient halo -->
  <div class="chip-halo"></div>

  <!-- Info panel — appears to the LEFT of the SVG inside this column -->
  <div id="chip-panel" class="chip-panel" aria-hidden="true" role="region" aria-label="Project info">
    <div class="chip-panel-tag" id="cp-tag"></div>
    <div class="chip-panel-title" id="cp-title"></div>
    <div class="chip-panel-desc" id="cp-desc"></div>
    <a id="cp-link" class="chip-panel-cue" href="#" target="_blank" rel="noopener noreferrer">click to view →</a>
  </div>

  <!-- The chip SVG (existing, unchanged internally except defs + overlay rects) -->
  <svg ...existing svg...>
    <!-- all existing content unchanged -->
    <!-- new additions at end: shimmer gradient in defs + overlay rects -->
  </svg>
</div>
```

#### Panel positioning

The panel is positioned inside `#chip-wrapper` (which is `position: relative`). It sits to the **left** of the SVG and slides in from that side.

```css
.chip-panel {
  position: absolute;
  right: calc(100% - 16px); /* overlaps wrapper left edge slightly */
  top: 50%;
  transform: translateY(-50%) translateX(12px);
  width: 200px;
  background: #18181B;
  border: 1px solid #27272A;
  border-left: 2px solid #F59E0B;
  border-radius: 6px;
  padding: 16px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease;
  z-index: 10;
}
.chip-panel.chip-panel--visible {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
  pointer-events: auto;
}
.chip-panel-tag   { font-size: 9px; letter-spacing: 0.12em; color: #F59E0B; font-family: monospace; margin-bottom: 8px; }
.chip-panel-title { font-size: 14px; font-weight: 600; color: #FAFAFA; margin-bottom: 6px; }
.chip-panel-desc  { font-size: 11px; color: #71717A; line-height: 1.5; margin-bottom: 10px; }
.chip-panel-cue   { font-size: 10px; color: #F59E0B; letter-spacing: 0.05em; text-decoration: none; display: block; }
.chip-panel-cue:hover { text-decoration: underline; }
```

`#cp-link` is an `<a>` element for native keyboard and screen reader support. When a block has no URL, `#cp-link` is hidden (`display: none`).

#### Slide direction

Panel starts at `translateX(+12px)` (displaced right, invisible) and slides to `translateX(0)` (in position to the left of the SVG). This means it animates in from the right side of its destination, arriving at its resting spot beside the SVG.

#### Hover boundary for hide

The `mouseleave` listener is on `#chip-wrapper` (the outer wrapper div containing both SVG and panel), not on the `<svg>` alone. This prevents the panel from hiding when the mouse moves from the SVG onto the panel itself.

#### Project data

```js
const PROJECTS = {
  neural: {
    tag: 'NEURAL ENGINE · RESEARCH',
    title: 'Neural Network Pruning',
    desc: 'IEEE paper on structured pruning for efficient inference.',
    url: 'https://ieeexplore.ieee.org/document/11106423',
  },
  io: {
    tag: 'I/O · PROJECT',
    title: 'Text-to-SQL',
    desc: 'Natural language to SQL query engine.',
    url: 'https://github.com/selimym/text2sql',
  },
  fabric: {
    tag: 'FABRIC · PROJECT',
    title: 'URL Shortener',
    desc: 'Custom URL shortening service.',
    url: 'https://github.com/selimym/url_shortener',
  },
  enclave: {
    tag: 'SECURE ENCLAVE · GAME',
    title: 'Data Privacy Dystopia',
    desc: 'A game about data surveillance and privacy.',
    url: 'https://selimym.github.io/data_privacy_distopia',
  },
};
```

#### JavaScript interaction logic

```js
const panel     = document.getElementById('chip-panel');
const wrapper   = document.getElementById('chip-wrapper');
const overlays  = document.querySelectorAll('.chip-overlay');

function showPanel(project) {
  const p = PROJECTS[project];
  document.getElementById('cp-tag').textContent   = p.tag;
  document.getElementById('cp-title').textContent = p.title;
  document.getElementById('cp-desc').textContent  = p.desc;
  const link = document.getElementById('cp-link');
  if (p.url) {
    link.href = p.url;
    link.style.display = 'block';
  } else {
    link.style.display = 'none';
  }
  panel.classList.add('chip-panel--visible');
  panel.setAttribute('aria-hidden', 'false');
}

function hidePanel() {
  panel.classList.remove('chip-panel--visible');
  panel.setAttribute('aria-hidden', 'true');
}

overlays.forEach(rect => {
  const proj = rect.dataset.project;

  // Mouse
  rect.addEventListener('mouseenter', () => {
    rect.style.fill = '#F59E0B22';
    showPanel(proj);
  });
  rect.addEventListener('mouseleave', () => {
    rect.style.fill = 'url(#shimmer-grad)';
  });

  // Keyboard
  rect.addEventListener('focus', () => {
    rect.style.fill = '#F59E0B22';
    showPanel(proj);
  });
  rect.addEventListener('blur', () => {
    rect.style.fill = 'url(#shimmer-grad)';
    hidePanel(); // hide panel when keyboard focus leaves the rect
  });

  // Click / Enter / Space → navigate to URL
  rect.addEventListener('click', () => {
    const url = PROJECTS[proj]?.url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  });
  rect.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const url = PROJECTS[proj]?.url;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    }
  });
});

// Hide when mouse leaves the entire wrapper (SVG + panel)
wrapper.addEventListener('mouseleave', hidePanel);
```

#### Notes

- **Shared shimmer sweep is intentional:** A single `#shimmer-grad` gradient sweeps across the full SVG viewport, so rects at different horizontal positions see the sweep at slightly different times. This staggered effect is by design — it gives the chip a sense of depth.
- **Panel overflow at narrow `md` breakpoints:** At exactly 768px viewport width, the 200px panel positioned to the left of the chip column may be clipped. Mitigate with `overflow: visible` on the hero grid or by capping the panel's left boundary with `max(0px, calc(...))`. Implementer should verify at 768px.
- **Dual navigation paths:** Clicking a rect calls `window.open`; clicking `#cp-link` also opens the URL. Both paths are intentional — mouse users can click anywhere on the block, keyboard users tab to either the rect or the link.

---

## Out of Scope (this PR)

- Mobile chip visibility (separate PR)
- Adding more block mappings (CPU, GPU, etc.)
- Any changes to Projects.astro, Skills.astro, or other components

---

## Verification

1. `npm run dev` — chip is visibly brighter (~55% opacity) with warm amber radial glow
2. Active blocks (Neural Engine, I/O, Fabric, Secure Enclave) show a slow shimmer sweep at rest
3. Hovering an active block → fill brightens, panel slides in from right with correct content
4. Moving mouse from SVG onto panel → panel stays visible (no flicker)
5. Moving mouse away from wrapper entirely → panel fades out, shimmer resumes
6. Tab to an overlay rect → panel appears; Enter/Space → opens URL in new tab
7. Clicking an active block → opens correct URL in new tab
8. Hovering CPU, GPU, Mem Ctrl, ISP, Media, Display → no panel, no animation
9. Mobile view (< 768px): chip remains hidden, no JS errors in console
10. Mobile nav: open hamburger menu, exactly one "Contact" link present
11. `npm run build` — clean build, no type errors
