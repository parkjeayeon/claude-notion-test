import { expect, test } from '@playwright/test'

test('homepage renders correctly', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/견적서 조회/)
})
