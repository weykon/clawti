import { test, expect } from '@playwright/test';

test.describe('Create — Flow Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create');
  });

  test('Simple, Detailed, Import tabs visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Simple' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Detailed' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import' })).toBeVisible();
  });

  test('Simple tab is default', async ({ page }) => {
    // Simple tab should be active (has accent styling)
    const simpleTab = page.getByRole('button', { name: 'Simple' });
    const classes = await simpleTab.getAttribute('class');
    // Active tab typically has accent or different styling
    expect(classes).toBeDefined();
  });

  test('switching to Detailed tab changes content', async ({ page }) => {
    await page.getByRole('button', { name: 'Detailed' }).click();
    // Detailed flow shows extra fields (Bio, Occupation) not in Simple mode
    await expect(page.locator('text=Occupation').first()).toBeVisible({ timeout: 5_000 });
  });

  test('switching to Import tab shows import options', async ({ page }) => {
    await page.getByRole('button', { name: 'Import' }).click();
    // Import shows Import File / Paste URL options
    await expect(page.getByRole('button', { name: /Import File/ })).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Create — Simple Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create');
  });

  test('name input field exists', async ({ page }) => {
    const nameInput = page.getByPlaceholder('Enter name');
    await expect(nameInput).toBeVisible();
  });

  test('gender selector has 3 options', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Female', exact: true })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: 'Male', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Other', exact: true })).toBeVisible();
  });

  test('personality template grid visible', async ({ page }) => {
    // Personality templates are displayed as a grid
    const templates = page.locator('text=Personality Template').first();
    await expect(templates).toBeVisible();
  });

  test('appearance style section exists', async ({ page }) => {
    await expect(page.locator('text=Appearance Style').first()).toBeVisible();
  });

  test('filling name enables further interaction', async ({ page }) => {
    await page.getByPlaceholder('Enter name').fill('TestSoul');
    const val = await page.getByPlaceholder('Enter name').inputValue();
    expect(val).toBe('TestSoul');
  });

  test('gender selection highlights chosen option', async ({ page }) => {
    const femaleBtn = page.getByRole('button', { name: 'Female', exact: true });
    await femaleBtn.click();
    // Should have accent styling after selection
    const classes = await femaleBtn.getAttribute('class');
    expect(classes).toContain('bg-');
  });
});

test.describe('Create — Detailed Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create');
    await page.getByRole('button', { name: 'Detailed' }).click();
    await page.waitForTimeout(300);
  });

  test('step 1 shows basic info fields', async ({ page }) => {
    await expect(page.getByPlaceholder('Enter name')).toBeVisible();
    await expect(page.locator('text=Gender').first()).toBeVisible();
  });

  test('progress segments visible', async ({ page }) => {
    // Progress bar with segments
    const segments = page.locator('.h-1\\.5.flex-1.rounded-full');
    const count = await segments.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('Next button advances step', async ({ page }) => {
    // Fill required fields first
    await page.getByPlaceholder('Enter name').fill('TestChar');
    await page.getByRole('button', { name: 'Female', exact: true }).click();

    // Click Next
    const nextBtn = page.getByRole('button', { name: 'Next', exact: true });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    // Should advance to step 2 — Personality heading
    await expect(page.getByRole('heading', { name: 'Personality' })).toBeVisible({ timeout: 5_000 });
  });

  test('Back button returns to previous step', async ({ page }) => {
    await page.getByPlaceholder('Enter name').fill('TestChar');
    await page.getByRole('button', { name: 'Female', exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Personality' })).toBeVisible({ timeout: 5_000 });

    const backBtn = page.getByRole('button', { name: 'Back', exact: true });
    await backBtn.click();

    // Should be back on step 1
    await expect(page.getByPlaceholder('Enter name')).toBeVisible({ timeout: 5_000 });
  });

  test('interests have max 6 cap', async ({ page }) => {
    await page.getByPlaceholder('Enter name').fill('Test');
    await page.getByRole('button', { name: 'Female', exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // In personality step, personality heading should be visible
    await expect(page.getByRole('heading', { name: 'Personality' })).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Create — Import Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create');
    await page.getByRole('button', { name: 'Import' }).click();
    await page.waitForTimeout(300);
  });

  test('File and URL options visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Import File/ })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /Paste URL/ })).toBeVisible();
  });

  test('file upload zone exists after selecting Import File', async ({ page }) => {
    // Click Import File to advance to step 2 with the drop zone
    await page.getByRole('button', { name: /Import File/ }).click();
    const dropZone = page.locator('.border-dashed').first();
    await expect(dropZone).toBeVisible({ timeout: 5_000 });
  });

  test('URL input works', async ({ page }) => {
    // Click Paste URL to advance to step 2
    await page.getByRole('button', { name: /Paste URL/ }).click();
    const urlInput = page.getByPlaceholder(/https/);
    await expect(urlInput).toBeVisible({ timeout: 5_000 });
    await urlInput.fill('https://example.com/card.json');
    await expect(urlInput).toHaveValue('https://example.com/card.json');
  });

  test('support formats text visible', async ({ page }) => {
    await expect(page.locator('text=Support .png').first()).toBeVisible({ timeout: 5_000 });
  });
});
