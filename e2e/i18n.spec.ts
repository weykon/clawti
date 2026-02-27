import { test, expect } from '@playwright/test';

test.describe('Internationalization', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop-only: uses desktop sidebar navigation');
  test('default language shows English text', async ({ page }) => {
    await page.goto('/discover');
    await page.waitForTimeout(500);
    // "Discover" should be visible in English nav
    await expect(page.getByRole('button', { name: 'Discover' })).toBeVisible();
  });

  test('toggle to Chinese via settings', async ({ page }) => {
    await page.goto('/profile');
    // Open settings
    const settingsBtn = page.locator('button').filter({
      has: page.locator('[class*="settings"], [class*="Settings"]')
    }).first();
    await settingsBtn.click();
    await page.waitForTimeout(300);

    // Click Language row to toggle to Chinese
    const langRow = page.locator('.z-\\[80\\]').locator('button').filter({ hasText: 'Language' }).first();
    await langRow.click();
    await page.waitForTimeout(500);

    // Close settings modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Check if Chinese text appeared on the current page
    const pageText = await page.textContent('body');
    // Should contain Chinese characters somewhere
    const hasChinese = /[\u4e00-\u9fa5]/.test(pageText || '');
    expect(hasChinese).toBe(true);
  });

  test('toggle back to English restores text', async ({ page }) => {
    await page.goto('/profile');
    const settingsBtn = page.locator('button').filter({
      has: page.locator('[class*="settings"], [class*="Settings"]')
    }).first();
    await settingsBtn.click();
    await page.waitForTimeout(300);

    // Toggle twice (zh → en)
    const langRow = page.locator('.z-\\[80\\]').locator('button').filter({ hasText: /Language|语言/ }).first();
    await langRow.click();
    await page.waitForTimeout(200);
    await langRow.click();
    await page.waitForTimeout(200);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Should be back to English
    await expect(page.getByRole('button', { name: 'Discover' })).toBeVisible();
  });

  test('nav items change language', async ({ page }) => {
    // Switch to Chinese first
    await page.goto('/profile');
    const settingsBtn = page.locator('button').filter({
      has: page.locator('[class*="settings"], [class*="Settings"]')
    }).first();
    await settingsBtn.click();
    await page.waitForTimeout(300);

    const langRow = page.locator('.z-\\[80\\]').locator('button').filter({ hasText: 'Language' }).first();
    await langRow.click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Navigate via sidebar click (NOT page.goto) to preserve zustand state
    await page.getByRole('button', { name: /发现|Discover/ }).click();
    await page.waitForTimeout(500);

    // Check if page has Chinese text
    const pageText = await page.textContent('body');
    const hasChinese = /[\u4e00-\u9fa5]/.test(pageText || '');
    expect(hasChinese).toBe(true);
  });

  test('create page labels change with language', async ({ page }) => {
    // Switch to Chinese
    await page.goto('/profile');
    const settingsBtn = page.locator('button').filter({
      has: page.locator('[class*="settings"], [class*="Settings"]')
    }).first();
    await settingsBtn.click();
    await page.waitForTimeout(300);

    const langRow = page.locator('.z-\\[80\\]').locator('button').filter({ hasText: 'Language' }).first();
    await langRow.click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Navigate via sidebar click to preserve zustand state
    await page.getByRole('button', { name: /^创建$|^Create$/ }).click();
    await page.waitForTimeout(500);

    // Should show Chinese create labels
    const pageText = await page.textContent('body');
    const hasChinese = /[\u4e00-\u9fa5]/.test(pageText || '');
    expect(hasChinese).toBe(true);
  });
});
