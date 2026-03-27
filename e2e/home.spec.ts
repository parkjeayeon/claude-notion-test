import { expect, test } from '@playwright/test'

test('homepage renders correctly', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/StarterKit/)
})
