// Ensures the test user exists, logs in, and saves storage state for all tests.
const { chromium, request } = require('@playwright/test');

module.exports = async () => {
    const AUTH = process.env.PLAYWRIGHT_AUTH_URL || 'http://localhost:5004';
    const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

    const email = 'playwright@test.com';
    const password = 'Password123!';
    const name = 'Playwright Student';

    const api = await request.newContext();

    // 1) Ensure user exists (201 created or 400/409 already exists are fine)
    const reg = await api.post(`${AUTH}/api/auth/register`, { data: { email, password, name } });
    if (![201, 400, 409].includes(reg.status())) {
        throw new Error(`Register failed: ${reg.status()} ${await reg.text()}`);
    }

    // 2) Login to get token
    const login = await api.post(`${AUTH}/api/auth/login`, { data: { email, password } });
    if (login.status() !== 200) {
        throw new Error(`Login failed: ${login.status()} ${await login.text()}`);
    }
    const { token } = await login.json();

    // 3) Preload token into localStorage and save storageState
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.reload();
    await ctx.storageState({ path: 'storage/auth.json' });
    await browser.close();
    await api.dispose();
};