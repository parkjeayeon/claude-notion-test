import { expect, test } from '@playwright/test'

// Notion에 실제 존재하는 견적서 페이지 ID
const VALID_ID = '3440a392-0ab4-80bf-91f2-e3d8e42af8b3'
const INVALID_ID = '00000000-0000-0000-0000-000000000000'

test('견적서 목록 페이지 렌더링', async ({ page }) => {
  await page.goto('/invoice')
  await expect(page).toHaveTitle(/견적서 목록/)
  // 테이블 또는 "견적서가 없습니다" 메시지가 표시됨
  const hasTable = await page.locator('table').count()
  const hasEmpty = await page.getByText('견적서가 없습니다').count()
  expect(hasTable + hasEmpty).toBeGreaterThan(0)
})

test('견적서 상세 페이지 — title에 견적서 번호 포함', async ({ page }) => {
  await page.goto(`/invoice/${VALID_ID}`)
  const title = await page.title()
  // title 형식: "IVN-XXXX-XXX - 클라이언트명 | ..."
  expect(title).toMatch(/IVN-/)
})

test('견적서 상세 페이지 — 핵심 UI 요소 렌더링', async ({ page }) => {
  await page.goto(`/invoice/${VALID_ID}`)
  // 견적서 번호 라벨
  await expect(page.getByText('견적서 번호')).toBeVisible()
  // 항목 테이블 헤더
  await expect(page.getByRole('columnheader', { name: '항목명' })).toBeVisible()
  // 합계 영역
  await expect(page.getByText('합계 (부가세 포함)')).toBeVisible()
})

test('PDF 다운로드 버튼 — 올바른 링크', async ({ page }) => {
  await page.goto(`/invoice/${VALID_ID}`)
  const pdfLink = page.getByRole('link', { name: /PDF|다운로드/ })
  await expect(pdfLink).toBeVisible()
  const href = await pdfLink.getAttribute('href')
  expect(href).toBe(`/api/invoice/${VALID_ID}/pdf`)
})

test('존재하지 않는 견적서 — not-found 페이지', async ({ page }) => {
  await page.goto(`/invoice/${INVALID_ID}`)
  await expect(page.getByRole('heading', { name: '견적서를 찾을 수 없습니다' })).toBeVisible()
  await expect(page.getByRole('link', { name: '목록으로 돌아가기' })).toBeVisible()
})
