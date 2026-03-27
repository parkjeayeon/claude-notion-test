import { expect, test } from '@playwright/test'

test('navigates to examples page', async ({ page }) => {
  await page.goto('/')
  await page.click('a[href="/examples"]')
  await expect(page).toHaveURL('/examples')
  await expect(page).toHaveTitle(/Examples/)
})
