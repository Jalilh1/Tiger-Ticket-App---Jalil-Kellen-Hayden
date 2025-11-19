import { test, expect } from '@playwright/test';
import { TEST_EMAIL, TEST_PASSWORD, ensureTestUser } from './utils/testUser.js';

test.beforeEach(async ({ request }) => {
    await ensureTestUser(request);
});

test('voice input toggles listening state', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // login
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();

    // Click mic button
    const mic = page.getByRole('button', { name: /start voice input/i });
    await mic.click();

    await expect(mic).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/listening/i)).toBeVisible();
});