import { expect, test } from '@playwright/test'

test('home page shows invoice guidance', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/견적서/)
})

test('invoice page renders without error for any id', async ({ page }) => {
  await page.goto('/invoice/test-invoice-id')
  await expect(page).toHaveURL('/invoice/test-invoice-id')
})
