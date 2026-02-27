import { test, expect } from '@playwright/test';

test.describe('Navigation — Desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop-only: sidebar hidden on mobile');

  test.beforeEach(async ({ page }) => {
    await page.goto('/discover');
  });

  test('sidebar visible on desktop', async ({ page }) => {
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
  });

  test('4 nav items present in sidebar', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Discover' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chats' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible();
  });

  test('clawti logo visible in sidebar', async ({ page }) => {
    await expect(page.locator('h1:has-text("clawti")')).toBeVisible();
  });

  test('energy display in sidebar', async ({ page }) => {
    await expect(page.locator('text=Energy')).toBeVisible();
  });

  test('clicking Chats navigates to /chat', async ({ page }) => {
    await page.getByRole('button', { name: 'Chats' }).click();
    await page.waitForURL('**/chat');
    expect(page.url()).toContain('/chat');
  });

  test('clicking Create navigates to /create', async ({ page }) => {
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForURL('**/create');
    expect(page.url()).toContain('/create');
  });

  test('clicking Profile navigates to /profile', async ({ page }) => {
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.waitForURL('**/profile');
    expect(page.url()).toContain('/profile');
  });

  test('clicking Discover navigates to /discover', async ({ page }) => {
    // Go somewhere else first
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.waitForURL('**/profile');

    await page.getByRole('button', { name: 'Discover' }).click();
    await page.waitForURL('**/discover');
    expect(page.url()).toContain('/discover');
  });

  test('root / redirects to /discover', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/discover');
    expect(page.url()).toContain('/discover');
  });
});

test.describe('Navigation — Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('mobile bottom nav visible', async ({ page }) => {
    await page.goto('/discover');
    // MobileNav is fixed at bottom, visible on mobile
    const mobileNav = page.locator('.md\\:hidden.fixed.bottom-4').first();
    await expect(mobileNav).toBeVisible();
  });

  test('mobile nav has 4 items', async ({ page }) => {
    await page.goto('/discover');
    // Look for the 4 nav button labels
    const navContainer = page.locator('.md\\:hidden.fixed.bottom-4').first();
    const buttons = navContainer.locator('button');
    await expect(buttons).toHaveCount(4);
  });

  test('mobile nav click navigates', async ({ page }) => {
    await page.goto('/discover');
    // Click on the Profile nav item (4th button)
    const navContainer = page.locator('.md\\:hidden.fixed.bottom-4').first();
    await navContainer.locator('button').nth(3).click();
    await page.waitForURL('**/profile');
  });
});
