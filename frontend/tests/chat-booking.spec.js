import { test, expect } from '@playwright/test';
import { TEST_EMAIL, TEST_PASSWORD, ensureTestUser } from './utils/testUser.js';

test.beforeEach(async ({ request }) => {
    await ensureTestUser(request);
});

test('LLM booking requires confirmation', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // login first
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();

    // Type a booking request
    await page.getByRole('textbox', { name: /message/i })
        .fill('Book 2 tickets for the campus concert');

    await page.getByRole('button', { name: /send/i }).click();

    // Playwright waits for assistant message
    await expect(page.getByText(/do you want to confirm/i)).toBeVisible();
});