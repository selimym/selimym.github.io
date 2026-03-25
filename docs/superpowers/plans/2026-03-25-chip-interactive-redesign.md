# Chip Interactive Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the SoC chip diagram interactive — visible, animated, and hoverable with a slide-in project panel — and fix a duplicate mobile nav link.

**Architecture:** All changes are confined to `src/components/Hero.astro` and `src/components/Nav.astro`. The chip SVG gains a shimmer `<linearGradient>` (SMIL) and invisible overlay `<rect>` elements as hover targets. A sibling panel div is toggled by vanilla JS event listeners attached to those rects. Playwright is added for E2E verification of the interaction.

**Tech Stack:** Astro 5, Tailwind CSS 3, inline SVG, vanilla JS, Playwright for tests.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/components/Nav.astro` | Modify line 40 | Remove duplicate mobile Contact link |
| `src/components/Hero.astro` | Modify (chip container, SVG, style, script) | All chip changes |
| `playwright.config.ts` | Create | Playwright E2E config |
| `tests/chip-interaction.spec.ts` | Create | E2E tests for hover panel + nav fix |
| `package.json` | Modify | Add `@playwright/test` dev dep + test script |

---

## Task 1: Fix duplicate mobile nav Contact link

**Files:**
- Modify: `src/components/Nav.astro:40`

- [ ] **Step 1: Remove the duplicate link**

In `src/components/Nav.astro`, delete **line 40 exactly**:
```html
    <a href="#contact" class="text-accent text-sm font-medium" onclick="closeMobileNav()">Contact</a>
```
The mobile `<nav>` should end with the regular Contact nav-link on line 39 only.

- [ ] **Step 2: Verify build passes**

```bash
npm run build && npm run check
```
Expected: clean build, no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Nav.astro
git commit -m "fix: remove duplicate Contact link from mobile nav"
```

---

## Task 2: Chip visibility — higher opacity + ambient halo

**Files:**
- Modify: `src/components/Hero.astro` (container div, SVG opacity attribute, `<style>` tag)

- [ ] **Step 1: Restructure the chip container div**

Find this in `Hero.astro` (line ~75):
```html
    <div class="hidden md:flex justify-center items-center">
```
Replace with:
```html
    <div class="hidden md:flex justify-center items-center relative" id="chip-wrapper">
      <div class="chip-halo" aria-hidden="true"></div>
```
Note: keeping `md:flex` (not switching to `md:block`) since the SVG is already centered via flex. The panel is `position:absolute` so it is out of flex flow — both `flex` and `block` work here.
The `<div class="chip-halo">` is inserted as the first child of the wrapper, before the `<svg>`.

Close the new wrapper at the existing closing `</div>` (currently at line ~339) — no extra close tag needed, we're just changing the opening div's class and adding one child.

- [ ] **Step 2: Lower the SVG opacity**

On the `<svg>` element (line ~76), change the class from:
```html
class="w-[420px] h-[386px] text-accent opacity-[0.22]"
```
to:
```html
class="w-[420px] h-[386px] text-accent" style="opacity:0.55"
```
(`opacity-55` does not exist in Tailwind v3's default scale; use inline style.)

- [ ] **Step 3: Add halo CSS to the `<style>` tag in Hero.astro**

In the existing `<style>` block (or add one if none), add:
```css
.chip-halo {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 50%, #F59E0B18 0%, transparent 70%);
  pointer-events: none;
  border-radius: 8px;
}
```

- [ ] **Step 4: Verify build and visual check**

```bash
npm run build && npm run check
```
Then `npm run dev` and verify the chip is noticeably brighter with a warm amber glow around it.

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: increase chip visibility with ambient halo"
```

---

## Task 3: Shimmer animation on active blocks

**Files:**
- Modify: `src/components/Hero.astro` (SVG `<defs>`, end of SVG, `<style>`)

- [ ] **Step 1: Add the shimmer gradient to SVG `<defs>`**

Inside the existing `<defs>` block (which currently contains only the `.lbl` style), add the gradient **after** the `<style>` element:
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
Note: A single gradient sweeps the full SVG viewport (viewBox 0 0 520 480). Each active block sees the sweep pass at a slightly different time — this staggered timing is intentional and gives the chip life.

- [ ] **Step 2: Add invisible overlay rects at the END of the SVG**

Immediately before the closing `</svg>` tag, add four overlay rects (placed last so they sit on top of all existing content):
```svg
<!-- ── INTERACTIVE OVERLAY RECTS ── -->
<rect class="chip-overlay" data-project="neural"  role="button" tabindex="0"
  x="348" y="68"  width="104" height="115"
  fill="url(#shimmer-grad)"
  aria-label="Neural Network Pruning — research paper"/>
<rect class="chip-overlay" data-project="io"      role="button" tabindex="0"
  x="68"  y="278" width="118" height="134"
  fill="url(#shimmer-grad)"
  aria-label="Text-to-SQL — GitHub project"/>
<rect class="chip-overlay" data-project="fabric"  role="button" tabindex="0"
  x="191" y="278" width="95"  height="134"
  fill="url(#shimmer-grad)"
  aria-label="URL Shortener — GitHub project"/>
<rect class="chip-overlay" data-project="enclave" role="button" tabindex="0"
  x="291" y="278" width="161" height="134"
  fill="url(#shimmer-grad)"
  aria-label="Data Privacy Dystopia — game"/>
```

- [ ] **Step 3: Add overlay rect CSS**

In Hero.astro's `<style>` block, add:
```css
.chip-overlay {
  cursor: pointer;
  outline: none;
}
```
The default `fill="url(#shimmer-grad)"` is set as an SVG attribute. JS will override it via `element.style.fill` on hover (inline styles take precedence over attribute values), so no CSS fill rule is needed.

- [ ] **Step 4: Build check**

```bash
npm run build && npm run check
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: add shimmer animation on interactive chip blocks"
```

---

## Task 4: Side panel DOM + CSS

**Files:**
- Modify: `src/components/Hero.astro` (chip wrapper inner HTML, `<style>`)

- [ ] **Step 1: Add the panel HTML inside `#chip-wrapper`, before the SVG**

After `<div class="chip-halo" aria-hidden="true"></div>` and before the `<svg>`, insert:
```html
      <!-- Chip hover info panel -->
      <div id="chip-panel" class="chip-panel" aria-hidden="true" role="region" aria-label="Project info">
        <div class="chip-panel-tag" id="cp-tag"></div>
        <div class="chip-panel-title" id="cp-title"></div>
        <div class="chip-panel-desc" id="cp-desc"></div>
        <a id="cp-link" class="chip-panel-cue" href="#" target="_blank" rel="noopener noreferrer">click to view →</a>
      </div>
```

- [ ] **Step 2: Add panel CSS**

In Hero.astro's `<style>` block, add:
```css
.chip-panel {
  position: absolute;
  right: calc(100% - 16px);
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
.chip-panel-tag {
  font-size: 9px;
  letter-spacing: 0.12em;
  color: #F59E0B;
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 8px;
  text-transform: uppercase;
}
.chip-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #FAFAFA;
  margin-bottom: 6px;
}
.chip-panel-desc {
  font-size: 11px;
  color: #71717A;
  line-height: 1.5;
  margin-bottom: 10px;
}
.chip-panel-cue {
  font-size: 10px;
  color: #F59E0B;
  letter-spacing: 0.05em;
  text-decoration: none;
  display: block;
}
.chip-panel-cue:hover { text-decoration: underline; }
```

- [ ] **Step 3: Build check**

```bash
npm run build && npm run check
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: add chip hover info panel DOM and styles"
```

---

## Task 5: JS interaction logic

**Files:**
- Modify: `src/components/Hero.astro` (`<script>` tag)

- [ ] **Step 1: Add the interaction script**

In Hero.astro, add a `<script>` block (or append to the existing one if there is one — check first; if none exists, add at the bottom of the component before the final `</section>`):

```typescript
<script>
  const PROJECTS: Record<string, { tag: string; title: string; desc: string; url: string }> = {
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

  const panel    = document.getElementById('chip-panel')!;
  const wrapper  = document.getElementById('chip-wrapper')!;
  const overlays = document.querySelectorAll<SVGRectElement>('.chip-overlay');

  function showPanel(projectKey: string) {
    const p = PROJECTS[projectKey];
    if (!p) return;
    (document.getElementById('cp-tag')   as HTMLElement).textContent = p.tag;
    (document.getElementById('cp-title') as HTMLElement).textContent = p.title;
    (document.getElementById('cp-desc')  as HTMLElement).textContent = p.desc;
    const link = document.getElementById('cp-link') as HTMLAnchorElement;
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
    const proj = (rect as HTMLElement).dataset.project ?? '';

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
      hidePanel();
    });

    // Click / Enter / Space → open URL
    const openUrl = () => {
      const url = PROJECTS[proj]?.url;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    };
    rect.addEventListener('click', openUrl);
    rect.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openUrl();
      }
    });
  });

  // Hide when mouse leaves the entire wrapper (SVG + panel combined)
  wrapper.addEventListener('mouseleave', hidePanel);
</script>
```

- [ ] **Step 2: Build and type-check**

```bash
npm run build && npm run check
```
Expected: clean, no TypeScript errors.

- [ ] **Step 3: Manual smoke test**

Run `npm run dev`. Open browser:
- Hover Neural Engine (top-right block) → panel slides in with "Neural Network Pruning"
- Hover I/O (bottom-left block) → panel shows "Text-to-SQL"
- Hover Fabric (bottom-middle block) → panel shows "URL Shortener"
- Hover Secure Enclave (bottom-right block) → panel shows "Data Privacy Dystopia"
- Hover CPU / GPU (no project) → no panel, no shimmer override
- Move mouse off chip entirely → panel fades out
- Click an active block → new tab opens to correct URL

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: wire chip hover interaction with project panel and keyboard nav"
```

---

## Task 6: Add Playwright E2E tests

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/chip-interaction.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Playwright**

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:4321',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
```

- [ ] **Step 3: Add test script to `package.json`**

In the `"scripts"` section, add:
```json
"test": "playwright test"
```

- [ ] **Step 4: Write the failing tests first**

Create `tests/chip-interaction.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Mobile nav', () => {
  test('has exactly one Contact link in mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.click('#mobile-menu-toggle');
    const contactLinks = page.locator('#mobile-nav a[href="#contact"]');
    await expect(contactLinks).toHaveCount(1);
  });
});

test.describe('Chip hover panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
  });

  test('panel is hidden by default', async ({ page }) => {
    const panel = page.locator('#chip-panel');
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
    await expect(panel).not.toHaveClass(/chip-panel--visible/);
  });

  test('hovering Neural Engine shows correct panel content', async ({ page }) => {
    const rect = page.locator('.chip-overlay[data-project="neural"]');
    await rect.hover();
    const panel = page.locator('#chip-panel');
    await expect(panel).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#cp-title')).toHaveText('Neural Network Pruning');
    await expect(page.locator('#cp-tag')).toContainText('NEURAL ENGINE');
    await expect(page.locator('#cp-link')).toHaveAttribute(
      'href',
      'https://ieeexplore.ieee.org/document/11106423'
    );
  });

  test('hovering I/O shows Text-to-SQL panel', async ({ page }) => {
    await page.locator('.chip-overlay[data-project="io"]').hover();
    await expect(page.locator('#cp-title')).toHaveText('Text-to-SQL');
    await expect(page.locator('#cp-link')).toHaveAttribute(
      'href',
      'https://github.com/selimym/text2sql'
    );
  });

  test('hovering Fabric shows URL Shortener panel', async ({ page }) => {
    await page.locator('.chip-overlay[data-project="fabric"]').hover();
    await expect(page.locator('#cp-title')).toHaveText('URL Shortener');
    await expect(page.locator('#cp-link')).toHaveAttribute(
      'href',
      'https://github.com/selimym/url_shortener'
    );
  });

  test('hovering Secure Enclave shows game panel', async ({ page }) => {
    await page.locator('.chip-overlay[data-project="enclave"]').hover();
    await expect(page.locator('#cp-title')).toHaveText('Data Privacy Dystopia');
    await expect(page.locator('#cp-link')).toHaveAttribute(
      'href',
      'https://selimym.github.io/data_privacy_distopia'
    );
  });

  test('panel hides when mouse leaves chip wrapper', async ({ page }) => {
    await page.locator('.chip-overlay[data-project="neural"]').hover();
    await expect(page.locator('#chip-panel')).toHaveAttribute('aria-hidden', 'false');
    // Move mouse to a clearly different part of the page
    await page.mouse.move(100, 100);
    await expect(page.locator('#chip-panel')).toHaveAttribute('aria-hidden', 'true');
  });

  test('inactive blocks (CPU) do not show panel', async ({ page }) => {
    // CPU block is not an overlay rect, so hovering SVG background outside overlays
    // should leave panel hidden. We verify by confirming no chip-overlay exists for CPU.
    const cpuOverlay = page.locator('.chip-overlay[data-project="cpu"]');
    await expect(cpuOverlay).toHaveCount(0);
  });
});
```

- [ ] **Step 5: Run tests and confirm all pass**

```bash
npm test
```
Expected output: all 7 tests green (Tasks 1–5 must be complete first). If any fail, the test output will point to the specific assertion — use it to locate the gap in the implementation.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts tests/chip-interaction.spec.ts package.json package-lock.json
git commit -m "test: add Playwright E2E tests for chip interaction and mobile nav"
```

---

## Task 7: Final CI check, push, and open PR

- [ ] **Step 1: Run full CI suite locally**

```bash
npm run check && npm run lint && npm run build && npm test
```
Expected: all pass.

- [ ] **Step 2: Push the branch**

```bash
git push -u origin redesign/astro-portfolio
```

- [ ] **Step 3: Open PR**

```bash
gh pr create \
  --title "feat: interactive chip diagram + fix mobile nav duplicate" \
  --body "$(cat <<'EOF'
## Summary

- **Fix:** Removes duplicate Contact link from mobile nav menu
- **Chip visibility:** Raises opacity from 22% to 55%, adds warm amber radial halo
- **Shimmer animation:** Active blocks (Neural Engine, I/O, Fabric, Secure Enclave) get a slow shimmer sweep via SVG linearGradient + SMIL, signalling interactivity
- **Hover panel:** Side panel slides in when hovering an active block, showing project title, description, and a "click to view →" link; panel hides on mouse-leave
- **Keyboard accessible:** Overlay rects have `role="button"`, `tabindex="0"`, `aria-label`; focus/blur and Enter/Space supported
- **Tests:** Playwright E2E tests cover all four active blocks, panel hide behavior, and the mobile nav fix

## Block → Project mapping

| Block | Project |
|---|---|
| Neural Engine | IEEE paper on neural network pruning |
| I/O | Text-to-SQL (GitHub) |
| Fabric/Interconnect | URL Shortener (GitHub) |
| Secure Enclave | Data Privacy Dystopia (game) |

## Test plan

- [ ] `npm run check` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm test` — all Playwright tests green
- [ ] Manual: hover each active block → correct panel content
- [ ] Manual: mobile view (375px) → chip hidden, one Contact link in menu

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Verify PR is open and CI is green**

```bash
gh pr view --web
```
