export const TEST_EMAIL = 'playwright@test.com';
export const TEST_PASSWORD = 'Password123!';
export const TEST_NAME = 'Playwright Student';

const AUTH_BASE = process.env.PLAYWRIGHT_AUTH_URL || 'http://localhost:5004';

export async function ensureTestUser(request) {
    const res = await request.post(`${AUTH_BASE}/api/auth/register`, {
        data: { email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME }
    });
    // 201 created, 400/409 already exists — all fine
    if (![201, 400, 409].includes(res.status())) {
        throw new Error(`Failed to ensure test user: ${res.status()} ${await res.text()}`);
    }
}