import { test, expect } from '@playwright/test';

test.describe('Public pages smoke', () => {
  test('Verify page renders and form is usable', async ({ page }) => {
    await page.goto('/verify');

    await expect(page.getByRole('heading', { name: /verify product/i })).toBeVisible();
    const input = page.getByPlaceholder('Enter Batch ID');
    await expect(input).toBeVisible();

    await input.fill('999');
    await page.getByRole('button', { name: /verify/i }).click();

    // Even se la chain non risponde, la pagina deve rimanere interattiva
    await expect(input).toBeVisible();
  });

  test('Licensee page shows wallet prompt when disconnected', async ({ page }) => {
    await page.goto('/licensee');
    await expect(page.getByText(/connect wallet/i)).toBeVisible();
  });
});

