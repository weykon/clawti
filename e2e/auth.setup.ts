import { test as setup, expect } from '@playwright/test';

const TEST_EMAIL = 'test@clawti.com';
const TEST_PASSWORD = 'Test1234!';
const AUTH_FILE = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Login via API call
  const response = await page.request.post('/api/auth/login', {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  expect(response.ok()).toBe(true);

  const body = await response.json();
  expect(body.token).toBeTruthy();

  // Navigate to discover and set token in localStorage
  await page.goto('/discover');
  await page.evaluate((token) => {
    localStorage.setItem('vc_token', token);
  }, body.token);

  // Reload to pick up the token
  await page.reload();
  await page.waitForTimeout(2000);

  // Verify the login overlay (z-[100]) is NOT visible — we see the discover content
  await expect(page.locator('text=Discover').first()).toBeVisible({ timeout: 10_000 });

  // Save storage state (captures localStorage with vc_token)
  await page.context().storageState({ path: AUTH_FILE });
});
