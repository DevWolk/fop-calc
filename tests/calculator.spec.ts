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

  test('should refresh rates when clicking refresh button', async ({ page }) => {
    // Wait for initial auto-load to complete
    await expect(page.locator('text=UAH:')).toBeVisible({ timeout: 15000 });

    const refreshButton = page.locator('button', { hasText: 'Refresh rates' });
    await refreshButton.click();

    // Button should be clickable and rates should be displayed after refresh
    await expect(page.locator('text=UAH:')).toBeVisible({ timeout: 15000 });
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
    // Find the top-up method select by looking near the label
    const topupLabel = page.locator('text=Revolut top-up method');
    const select = topupLabel.locator('..').locator('select');
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

  test('should show help tooltips on hover', async ({ page }) => {
    // Find the help icon near UAH provider (the small "?" icon)
    const helpIcon = page.locator('span:has-text("?")').first();
    await expect(helpIcon).toBeVisible();

    // Hover should show tooltip (the tooltip appears on mouseenter)
    await helpIcon.hover();

    // Wait a moment for tooltip to appear
    await page.waitForTimeout(300);

    // Tooltip should appear - checking for specific tooltip content about Monobank
    // (first help icon is for UAH provider which defaults to Monobank)
    await expect(page.locator('text=Monobank')).toHaveCount(2); // One in tooltip, one in select
  });

  test('should expand advanced section', async ({ page }) => {
    // Find and click the advanced section toggle
    const advancedToggle = page.locator('button:has-text("Show advanced"), button:has-text("Hide advanced")');
    await advancedToggle.click();

    // CORS proxy select should be visible in advanced section
    await expect(page.locator('text=CORS Proxy')).toBeVisible();
  });

  test('should change UAH provider', async ({ page }) => {
    // Find UAH provider select (first select in the API panel)
    const select = page.locator('select').first();

    // Change to NBU
    await select.selectOption('nbu');

    // Check NBU is selected
    await expect(select).toHaveValue('nbu');
  });

  test('should change PLN provider', async ({ page }) => {
    // Find PLN provider select (second select in main view)
    const select = page.locator('select').nth(1);

    // Change to Frankfurter
    await select.selectOption('frankfurter');

    // Check Frankfurter is selected
    await expect(select).toHaveValue('frankfurter');
  });

  test('should switch language', async ({ page }) => {
    // Find the Ukrainian language button
    const ukButton = page.locator('button:has-text("UA")');
    await ukButton.click();

    // Check UI changed to Ukrainian
    await expect(page.locator('text=Оновити курси')).toBeVisible();

    // Switch to Russian
    const ruButton = page.locator('button:has-text("RU")');
    await ruButton.click();

    // Check UI changed to Russian
    await expect(page.locator('text=Обновить курсы')).toBeVisible();

    // Switch back to English
    const enButton = page.locator('button:has-text("EN")');
    await enButton.click();

    // Check UI is back to English
    await expect(page.locator('text=Refresh rates')).toBeVisible();
  });
});
