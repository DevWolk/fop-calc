import { test, expect } from '@playwright/test';

test.describe('FOP Currency Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load calculator UI', async ({ page }) => {
    // Check header is visible (language-independent)
    await expect(page.locator('text=FOP $ → ₴ → $ → Revolut → zł')).toBeVisible();

    // Check main input is visible (English is default)
    await expect(page.locator('text=FOP amount (USD)')).toBeVisible();
  });

  test('should have rate refresh button', async ({ page }) => {
    const refreshButton = page.locator('button', { hasText: 'Refresh rates' });
    await expect(refreshButton).toBeVisible();
  });

  test('should show spinner during rate loading', async ({ page }) => {
    const refreshButton = page.locator('button', { hasText: 'Refresh rates' });
    await refreshButton.click();

    // Spinner should appear (or loading text)
    await expect(page.locator('text=Loading')).toBeVisible();
  });

  test('should toggle between forward and reverse modes', async ({ page }) => {
    // Default is forward mode
    await expect(page.locator('text=How much will I get?')).toBeVisible();

    // Click reverse mode
    await page.locator('button', { hasText: 'How much do I need?' }).click();

    // Should show target input
    await expect(page.locator('text=Target amount (PLN)')).toBeVisible();
  });

  test('should calculate forward conversion', async ({ page }) => {
    // Enter amount
    const input = page.locator('input[type="number"]').first();
    await input.fill('1000');

    // Check pipeline breakdown is shown
    await expect(page.locator('text=pipeline breakdown')).toBeVisible();

    // Check result card is shown
    await expect(page.locator('text=total on account')).toBeVisible();
  });

  test('should show fee breakdown', async ({ page }) => {
    // Check fees section exists
    await expect(page.locator('text=fee losses')).toBeVisible();

    // Check specific fee items
    await expect(page.locator('text=PrivatBank spread')).toBeVisible();
  });

  test('should change top-up method', async ({ page }) => {
    const select = page.locator('select').nth(3); // Top-up method select (after UAH, PLN, CORS)
    await select.selectOption('p2p');

    // Check P2P is selected
    await expect(select).toHaveValue('p2p');
  });

  test('should toggle weekend mode', async ({ page }) => {
    // Click weekend button
    await page.locator('button', { hasText: 'Weekend' }).click();

    // Check weekend is active (button style changes)
    const weekendButton = page.locator('button', { hasText: 'Weekend' });
    await expect(weekendButton).toHaveCSS('background-color', 'rgba(239, 68, 68, 0.3)');
  });

  test('should reset to initial values', async ({ page }) => {
    // Change a value first
    const input = page.locator('input[type="number"]').first();
    await input.fill('5000');

    // Click reset
    await page.locator('button', { hasText: 'Reset' }).click();

    // Check value is reset to 1000
    await expect(input).toHaveValue('1000');
  });

  test('should handle reverse calculation', async ({ page }) => {
    // Switch to reverse mode
    await page.locator('button', { hasText: 'How much do I need?' }).click();

    // Enter target PLN
    const targetInput = page.locator('input[type="number"]').first();
    await targetInput.fill('4000');

    // Check reverse calculation is shown
    await expect(page.locator('text=reverse calculation')).toBeVisible();
    await expect(page.locator('text=needed from fop')).toBeVisible();
  });
});
