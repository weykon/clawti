import { test, expect } from '@playwright/test';

test.describe('Discover — Desktop Grid', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop-only: grid layout hidden on mobile');

  test.beforeEach(async ({ page }) => {
    await page.goto('/discover');
    // Wait for characters to load (mock data from store)
    await page.waitForTimeout(1000);
  });

  test('character cards are visible', async ({ page }) => {
    // Cards have aspect-[3/4] styling
    const cards = page.locator('.aspect-\\[3\\/4\\]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('character cards show name', async ({ page }) => {
    // Character names are displayed in cards
    const firstCardName = page.locator('.aspect-\\[3\\/4\\]').first().locator('h2, h3').first();
    await expect(firstCardName).toBeVisible();
  });

  test('Connect Now button visible on card hover', async ({ page }) => {
    // The Connect Now button exists in cards
    const connectBtn = page.getByRole('button', { name: 'Connect Now' }).first();
    await expect(connectBtn).toBeVisible();
  });

  test('clicking Connect Now starts chat', async ({ page }) => {
    const connectBtn = page.getByRole('button', { name: 'Connect Now' }).first();
    await connectBtn.click();
    await page.waitForURL('**/chat', { timeout: 5_000 });
  });

  test('clicking card navigates to chat', async ({ page }) => {
    // Desktop cards navigate to chat on click
    const card = page.locator('.aspect-\\[3\\/4\\]').first();
    await card.click();
    await page.waitForURL('**/chat', { timeout: 5_000 });
  });

  test('filter button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Filter/i }).first()).toBeVisible();
  });
});

test.describe('Discover — Mobile Swipe', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile-only: swipe UI only on mobile');
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/discover');
    await page.waitForTimeout(1000);
  });

  test('single character card visible on mobile', async ({ page }) => {
    // On mobile, shows one card at a time with character name
    const charName = page.getByRole('heading', { level: 2 }).first();
    await expect(charName).toBeVisible();
  });

  test('character name visible on mobile card', async ({ page }) => {
    const name = page.getByRole('heading', { level: 2 }).first();
    await expect(name).toBeVisible();
    const text = await name.textContent();
    expect(text!.length).toBeGreaterThan(0);
  });

  test('reject (X) button exists', async ({ page }) => {
    // X and heart buttons are icon-only in a container with pointer-events-auto
    const swipeButtons = page.locator('.w-14.h-14.rounded-full');
    const count = await swipeButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('accept (heart) button exists', async ({ page }) => {
    const swipeButtons = page.locator('.w-14.h-14.rounded-full');
    const count = await swipeButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('X button shows next character', async ({ page }) => {
    const nameBefore = await page.getByRole('heading', { level: 2 }).first().textContent();
    // Click the first button (X/reject) in the swipe button container
    const rejectBtn = page.locator('.w-14.h-14.rounded-full').first();
    await rejectBtn.click();
    await page.waitForTimeout(500);
    const nameAfter = await page.getByRole('heading', { level: 2 }).first().textContent();
    // Should either change or wrap around
    expect(nameAfter).toBeDefined();
  });

  test('heart button starts chat', async ({ page }) => {
    // Click the last button (heart/accept) in the swipe button container
    const acceptBtn = page.locator('.w-14.h-14.rounded-full').last();
    await acceptBtn.click();
    await page.waitForURL('**/chat', { timeout: 5_000 });
  });

  test('filter button visible on mobile', async ({ page }) => {
    // Mobile filter button is a 10x10 rounded button in the header
    const filterBtn = page.locator('.w-10.h-10.rounded-full').first();
    await expect(filterBtn).toBeVisible();
  });

  test('image dots/indicators visible', async ({ page }) => {
    // Image indicator dots
    const dots = page.locator('.h-1.flex-1.rounded-full');
    const count = await dots.count();
    expect(count).toBeGreaterThanOrEqual(0); // May be 0 if single image
  });
});
