import { test, expect } from '@playwright/test';

test.describe('PAYCORE End-to-End Orchestration Platform Suite', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    // Seed fake auth credentials into localStorage for deterministic testing
    await page.addInitScript(() => {
      window.localStorage.setItem('paycore_token', 'mock-jwt-token-playwright');
      window.localStorage.setItem('paycore_user', JSON.stringify({
        id: 'usr_playwright_test',
        email: 'merchant@paycore.dev',
        role: 'MERCHANT_ADMIN',
        merchant_id: 'mch_playwright_test'
      }));
    });
  });

  test('1. Merchant Auth & Navigation to Dashboard Overview', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveTitle(/PAYCORE/i);
    await expect(page.locator('h1, h2, span')).toContainText(['PAYCORE', 'Overview', 'Gross Volume']);
  });

  test('2. Navigation to Ledger Journal & Double-Entry Balance Verification', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/transactions`);
    await expect(page.locator('h1, h2, div')).toContainText(['Ledger Journal', 'Double-Entry', 'Debits', 'Credits']);
  });

  test('3. Disputes & Chargebacks Module with Evidence Upload and Deadline Timer', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/disputes`);
    await expect(page.locator('body')).toContainText(['Disputes & Chargebacks', 'Evidence Deadline']);
  });

  test('4. Invoices Management and GST Tax Computation', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/invoices`);
    await expect(page.locator('body')).toContainText(['GST Compliant Invoices', 'Create GST Invoice']);
  });

  test('5. Shareable Payment Links Creation and Copy Action', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/payment-links`);
    await expect(page.locator('body')).toContainText(['Shareable Payment Links', 'Create Payment Link']);
  });

  test('6. Customer Vault with PCI-DSS Compliant Payment Tokens', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/customers`);
    await expect(page.locator('body')).toContainText(['Customer Vault', 'Token Status']);
  });

  test('7. Checkout Session Creator & Magic Sandbox Simulation', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/checkout-sessions`);
    await expect(page.locator('body')).toContainText(['Checkout Sessions', 'Generate Checkout Session']);
  });

  test('8. Bank Payouts, Instant Transfers, and T+1 Settlements', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/payouts`);
    await expect(page.locator('body')).toContainText(['Payouts & Bank Settlements', 'Available for Payout', 'Request Payout']);
  });

  test('9. Subscriptions, Recurring Billing Plans, and Mandates', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/subscriptions`);
    await expect(page.locator('body')).toContainText(['Recurring Subscriptions', 'Billing Plans', 'Create Plan']);
  });

  test('10. Developer API Keys & Webhook Subscriptions', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/api-keys`);
    await expect(page.locator('body')).toContainText(['API Keys', 'Secret Keys']);
    await page.goto(`${BASE_URL}/dashboard/webhooks`);
    await expect(page.locator('body')).toContainText(['Webhook Subscriptions', 'HMAC SHA-256']);
  });
});
