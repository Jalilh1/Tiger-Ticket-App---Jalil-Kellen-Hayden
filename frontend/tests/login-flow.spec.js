import { test, expect } from '@playwright/test';
import { TEST_EMAIL, TEST_PASSWORD, ensureTestUser } from './utils/testUser';

test.beforeEach(async ({ request }) => {
    await ensureTestUser(request); // creates (or ensures) playwright@test.com exists
});

test('user can login and see event list', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /login/i }))
        .toBeVisible({ timeout: 5000 });

    // Start waiting for network BEFORE clicking login
    const loginPromise = page.waitForResponse((res) =>
        res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );
    const mePromise = page.waitForResponse((res) =>
        res.url().includes('/api/auth/me')
    );

    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^login$/i }).click();

    // Inspect /login response
    const loginRes = await loginPromise;
    const loginStatus = loginRes.status();
    const loginText = await loginRes.text();
    console.log('LOGIN status:', loginStatus);
    console.log('LOGIN body:', loginText.slice(0, 500));

    expect(loginStatus).toBe(200); // <— if this fails, credentials or endpoint are wrong

    // Inspect /me response
    const meRes = await mePromise;
    const meStatus = meRes.status();
    const meText = await meRes.text();
    console.log('ME status:', meStatus);
    console.log('ME body:', meText.slice(0, 500));

    expect(meStatus).toBe(200); // <— if this fails, token handling is wrong

    // Now verify the app transitioned
    await expect(page.getByText(/tigerTix/i)).toBeVisible({ timeout: 5000 });

    const cards = await page.getByRole('article').all();
    expect(cards.length).toBeGreaterThan(0);
});