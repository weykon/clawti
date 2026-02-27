import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

const TEST_EMAIL = 'test@clawti.com';
const TEST_PASSWORD = 'Test1234!';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to /discover — the (app) layout shows LoginScreen overlay when !isLoggedIn
    // (Using /login directly would render a standalone page that never dismisses)
    await page.goto('/discover');
    await expect(page.locator('text=clawti').first()).toBeVisible();
  });

  test('renders email and password fields', async ({ page }) => {
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('submit button disabled when fields empty', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Log In' });
    await expect(btn).toBeDisabled();
  });

  test('submit button disabled with only email', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('a@b.com');
    const btn = page.getByRole('button', { name: 'Log In' });
    await expect(btn).toBeDisabled();
  });

  test('submit button enabled when both fields filled', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('a@b.com');
    await page.getByPlaceholder('Password').fill('pass123');
    const btn = page.getByRole('button', { name: 'Log In' });
    await expect(btn).toBeEnabled();
  });

  test('password field is masked', async ({ page }) => {
    const pw = page.getByPlaceholder('Password');
    await expect(pw).toHaveAttribute('type', 'password');
  });

  test('successful login sets token and dismisses overlay', async ({ page }) => {
    await page.getByPlaceholder('Email').fill(TEST_EMAIL);
    await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Log In' }).click();

    // Wait for login API to complete and store token in localStorage
    await page.waitForFunction(
      () => localStorage.getItem('vc_token') !== null,
      { timeout: 15_000 }
    );

    // After isLoggedIn=true, the LoginScreen overlay unmounts
    await expect(page.getByRole('button', { name: 'Log In' })).not.toBeVisible({ timeout: 5_000 });
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('wrong@test.com');
    await page.getByPlaceholder('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Log In' }).click();

    // Error message should appear
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 10_000 });
  });

  test('Enter key submits form', async ({ page }) => {
    await page.getByPlaceholder('Email').fill(TEST_EMAIL);
    await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
    await page.getByPlaceholder('Password').press('Enter');

    // Wait for login API to complete and store token
    await page.waitForFunction(
      () => localStorage.getItem('vc_token') !== null,
      { timeout: 15_000 }
    );

    // Overlay should unmount after isLoggedIn=true
    await expect(page.getByRole('button', { name: 'Log In' })).not.toBeVisible({ timeout: 5_000 });
  });

  test('shows loading state during auth', async ({ page }) => {
    await page.getByPlaceholder('Email').fill(TEST_EMAIL);
    await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Log In' }).click();

    // Button should briefly show loading text
    await expect(page.getByRole('button', { name: 'Loading...' })).toBeVisible();
  });

  test('toggle to register mode shows username field', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByPlaceholder('Username')).toBeVisible();
  });

  test('toggle back to login hides username field', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByPlaceholder('Username')).toBeVisible();

    await page.getByRole('button', { name: /Already have an account/i }).click();
    await expect(page.getByPlaceholder('Username')).not.toBeVisible();
  });

  test('register mode shows 3 input fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('button text changes to Register in register mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
  });

  test('duplicate email shows error on register', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.getByPlaceholder('Username').fill('testdup');
    await page.getByPlaceholder('Email').fill(TEST_EMAIL);
    await page.getByPlaceholder('Password').fill('Dup12345!');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 10_000 });
  });
});
