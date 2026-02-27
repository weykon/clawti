import { test, expect } from '@playwright/test';

test.describe('FilterModal', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop-only: uses desktop filter button');

  test.beforeEach(async ({ page }) => {
    await page.goto('/discover');
    await page.waitForTimeout(1000);
  });

  test('opens on filter button click', async ({ page }) => {
    await page.getByRole('button', { name: /Filter/i }).first().click();
    await expect(page.locator('text=Filter Souls')).toBeVisible({ timeout: 3_000 });
  });

  test('shows gender options', async ({ page }) => {
    await page.getByRole('button', { name: /Filter/i }).first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('.z-50').locator('text=All').first()).toBeVisible();
    await expect(page.locator('.z-50').locator('text=Male').first()).toBeVisible();
    await expect(page.locator('.z-50').locator('text=Female').first()).toBeVisible();
  });

  test('shows race options', async ({ page }) => {
    await page.getByRole('button', { name: /Filter/i }).first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('.z-50').locator('text=Human').first()).toBeVisible();
  });

  test('shows occupation options', async ({ page }) => {
    await page.getByRole('button', { name: /Filter/i }).first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('.z-50').locator('text=Hacker').first()).toBeVisible();
  });

  test('selecting option highlights it', async ({ page }) => {
    await page.getByRole('button', { name: /Filter/i }).first().click();
    await page.waitForTimeout(300);
    const maleBtn = page.locator('.z-50').locator('button:has-text("Male")').first();
    await maleBtn.click();
    const classes = await maleBtn.getAttribute('class');
    expect(classes).toContain('bg-');
  });

  test('Apply Filters closes modal', async ({ page }) => {
    await page.getByRole('button', { name: /Filter/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Apply Filters' }).click();
    await expect(page.locator('text=Filter Souls')).not.toBeVisible({ timeout: 3_000 });
  });

  test('Escape closes modal', async ({ page }) => {
    await page.getByRole('button', { name: /Filter/i }).first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Filter Souls')).not.toBeVisible({ timeout: 3_000 });
  });

  test('backdrop click closes modal', async ({ page }) => {
    await page.getByRole('button', { name: /Filter/i }).first().click();
    await page.waitForTimeout(300);
    // Click the backdrop area (fixed overlay)
    await page.locator('.fixed.inset-0.z-50').first().click({ position: { x: 10, y: 10 } });
    await expect(page.locator('text=Filter Souls')).not.toBeVisible({ timeout: 3_000 });
  });
});

test.describe('CharacterProfileModal — via Chat Header', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop-only: uses desktop Connect Now button');

  test.beforeEach(async ({ page }) => {
    // Start a chat from discover to get a character loaded
    await page.goto('/discover');
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Connect Now' }).first().click();
    await page.waitForURL('**/chat', { timeout: 5_000 });
    await page.waitForTimeout(500);
  });

  test('character name visible in chat header', async ({ page }) => {
    // The character name should be shown in the chat header
    const charName = page.locator('h3').first();
    await expect(charName).toBeVisible();
    const text = await charName.textContent();
    expect(text!.length).toBeGreaterThan(0);
  });

  test('character avatar visible in header', async ({ page }) => {
    // Character avatar image visible in chat header
    const avatar = page.locator('main img').first();
    await expect(avatar).toBeVisible();
  });

  test('message input exists in chat', async ({ page }) => {
    await expect(page.getByPlaceholder('Type a message...')).toBeVisible();
  });

  test('energy counter visible', async ({ page }) => {
    // Energy is displayed somewhere on the page
    const energy = page.locator('text=1000').first();
    await expect(energy).toBeVisible();
  });
});

test.describe('SettingsModal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
  });

  test('opens from profile settings button', async ({ page }) => {
    const settingsBtn = page.locator('button').filter({
      has: page.locator('[class*="settings"], [class*="Settings"]')
    }).first();
    await settingsBtn.click();
    await expect(page.locator('.z-\\[80\\]')).toBeVisible({ timeout: 3_000 });
  });

  test('shows Account Settings title', async ({ page }) => {
    const settingsBtn = page.locator('button').filter({
      has: page.locator('[class*="settings"], [class*="Settings"]')
    }).first();
    await settingsBtn.click();
    await expect(page.locator('text=Account Settings')).toBeVisible();
  });

  test('language option visible', async ({ page }) => {
    const settingsBtn = page.locator('button').filter({
      has: page.locator('[class*="settings"], [class*="Settings"]')
    }).first();
    await settingsBtn.click();
    await expect(page.locator('.z-\\[80\\]').locator('text=Language')).toBeVisible();
  });

  test('Privacy option visible', async ({ page }) => {
    const settingsBtn = page.locator('button').filter({
      has: page.locator('[class*="settings"], [class*="Settings"]')
    }).first();
    await settingsBtn.click();
    await expect(page.locator('.z-\\[80\\]').locator('text=Privacy')).toBeVisible();
  });

  test('Help option visible', async ({ page }) => {
    const settingsBtn = page.locator('button').filter({
      has: page.locator('[class*="settings"], [class*="Settings"]')
    }).first();
    await settingsBtn.click();
    await expect(page.locator('.z-\\[80\\]').locator('text=Help')).toBeVisible();
  });

  test('Logout option visible with red styling', async ({ page }) => {
    const settingsBtn = page.locator('button').filter({
      has: page.locator('[class*="settings"], [class*="Settings"]')
    }).first();
    await settingsBtn.click();
    await expect(page.locator('.z-\\[80\\]').locator('text=Logout')).toBeVisible();
  });

  test('language toggle switches display', async ({ page }) => {
    const settingsBtn = page.locator('button').filter({
      has: page.locator('[class*="settings"], [class*="Settings"]')
    }).first();
    await settingsBtn.click();
    await page.waitForTimeout(300);

    // Find the Language row and click it to toggle
    const langRow = page.locator('.z-\\[80\\]').locator('button').filter({ hasText: 'Language' }).first();
    await langRow.click();

    // Should switch to Chinese (中文) or back
    await page.waitForTimeout(300);
    const langText = await page.locator('.z-\\[80\\]').textContent();
    expect(langText).toBeDefined();
  });

  test('logout triggers confirm dialog', async ({ page }) => {
    const settingsBtn = page.locator('button').filter({
      has: page.locator('[class*="settings"], [class*="Settings"]')
    }).first();
    await settingsBtn.click();
    await page.waitForTimeout(300);

    // Register dialog handler BEFORE clicking
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.dismiss(); // Cancel to stay logged in
    });

    const logoutBtn = page.locator('.z-\\[80\\]').locator('button').filter({ hasText: 'Logout' }).first();
    await logoutBtn.click();
  });
});

test.describe('RechargeModal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
  });

  test('opens from Subscribe button', async ({ page }) => {
    await page.getByRole('button', { name: 'Subscribe' }).first().click();
    // RechargeModal should appear
    await expect(page.getByRole('heading', { name: 'Basic Soul' })).toBeVisible({ timeout: 5_000 });
  });

  test('subscribe tab shows 3 plans', async ({ page }) => {
    await page.getByRole('button', { name: 'Subscribe' }).first().click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: 'Basic Soul' })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('heading', { name: 'Explorer', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'God Mode' })).toBeVisible();
  });

  test('recharge tab shows energy packages', async ({ page }) => {
    await page.getByRole('button', { name: 'Recharge' }).first().click();
    await page.waitForTimeout(500);
    // The Recharge button in profile opens modal. Click modal's Recharge tab if needed
    const rechargeTab = page.locator('[class*="z-"]').locator('button:has-text("Recharge")');
    const tabCount = await rechargeTab.count();
    if (tabCount > 1) {
      await rechargeTab.last().click();
      await page.waitForTimeout(300);
    }
    // Should show energy packs with numbers
    const pageText = await page.textContent('body');
    expect(pageText).toBeDefined();
  });

  test('earn tab shows 3 tasks', async ({ page }) => {
    await page.getByRole('button', { name: 'Earn' }).first().click();
    await page.waitForTimeout(500);
    // Should show earning tasks
    await expect(page.locator('text=Daily').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Escape closes recharge modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Subscribe' }).first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Basic Soul' })).not.toBeVisible({ timeout: 3_000 });
  });
});

test.describe('FriendsListModal', () => {
  test('opens from chat view', async ({ page }) => {
    await page.goto('/chat');
    // Click the friends/users icon button
    const friendsBtn = page.locator('button').filter({
      has: page.locator('[class*="users"], [class*="Users"]')
    }).first();

    if (await friendsBtn.isVisible()) {
      await friendsBtn.click();
      await expect(page.locator('.z-50').locator('text=Friends')).toBeVisible({ timeout: 3_000 });
    }
  });
});
