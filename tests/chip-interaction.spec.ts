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
    await page.mouse.move(100, 100);
    await expect(page.locator('#chip-panel')).toHaveAttribute('aria-hidden', 'true');
  });

  test('hovering CPU shows chip design article panel', async ({ page }) => {
    await page.locator('.chip-overlay[data-project="cpu"]').hover();
    await expect(page.locator('#cp-title')).toHaveText('Designing Circuits with EDA');
    await expect(page.locator('#cp-link')).toHaveAttribute(
      'href',
      'https://www.asianometry.com/p/designing-billions-of-circuits-with'
    );
  });
});
