const { test, expect } = require('@playwright/test');

test('create and submit purchase order from approved requisition', async ({ page }) => {
  await page.goto('/requisitions/11111111-1111-1111-1111-111111111001');

  await expect(page.getByRole('heading', { name: 'Detail Purchase Requisition' })).toBeVisible();
  await page.getByRole('link', { name: 'Create PO' }).click();

  await expect(page.getByRole('heading', { name: 'Create Purchase Order' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Vendor Name' }).fill('PT Workshop Vendor');
  await page.getByRole('spinbutton', { name: 'Allocate quantity line 1' }).fill('1');
  await page.getByRole('spinbutton', { name: 'Allocate quantity line 2' }).fill('1');
  await page.getByRole('button', { name: 'Save As Draft' }).click();

  await expect(page.getByRole('heading', { name: 'Detail Purchase Order' })).toBeVisible();
  await expect(page.locator('input[disabled]').nth(1)).toHaveValue('PT Workshop Vendor');
  await expect(page.getByText('DRAFT')).toBeVisible();
  await expect(page.getByText('PR-2026-0001 (1)')).toHaveCount(2);

  await page.getByRole('button', { name: 'Submit PO' }).click();
  await expect(page.getByText('SUBMITTED')).toBeVisible();
});
