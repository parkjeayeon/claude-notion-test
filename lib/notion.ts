import { unstable_cache } from 'next/cache'
import { Client, isFullPage, APIResponseError, APIErrorCode } from '@notionhq/client'
import type { PageObjectResponse, PartialPageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

import { logger } from '@/lib/logger'

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

// databases.query가 2025-09-03에서 제거됨 — 이전 버전으로 목록 조회용 클라이언트 분리
const notionLegacy = new Client({
  auth: process.env.NOTION_API_KEY,
  notionVersion: '2022-06-28',
})

export const DATABASE_ID = process.env.NOTION_DATABASE_ID ?? ''
export const ITEMS_DATABASE_ID = process.env.NOTION_ITEMS_DATABASE_ID ?? ''

// Notion property keys — setup-notion.ts에서 생성한 속성명과 1:1 매핑
const INVOICE_KEYS = {
  number: '견적서 번호',
  client: '클라이언트명',
  issueDate: '발행일',
  validUntil: '유효기간',
  status: '상태',
  total: '총 금액',
  items: '항목',
} as const

const ITEM_KEYS = {
  name: '항목명',
  qty: '수량',
  price: '단가',
  amount: '금액',
} as const

export type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export type InvoiceData = {
  id: string
  invoiceNumber: string
  clientName: string
  issueDate: string
  validUntil: string
  items: InvoiceItem[]
  totalAmount: number
  status: string
}

// items 미포함 — 목록 조회용
export type InvoiceListItem = Omit<InvoiceData, 'items'>

// --- Property extractors ---

type AnyProperty = PageObjectResponse['properties'][string]

function extractText(prop: AnyProperty | undefined): string {
  if (!prop) return ''
  if (prop.type === 'title') return prop.title.map((t) => t.plain_text).join('')
  if (prop.type === 'rich_text') return prop.rich_text.map((t) => t.plain_text).join('')
  return ''
}

function extractNumber(prop: AnyProperty | undefined): number {
  if (!prop) return 0
  if (prop.type === 'number') return prop.number ?? 0
  if (prop.type === 'formula' && prop.formula.type === 'number') return prop.formula.number ?? 0
  return 0
}

function extractDate(prop: AnyProperty | undefined): string {
  if (!prop) return ''
  if (prop.type === 'date') return prop.date?.start ?? ''
  return ''
}

function extractSelect(prop: AnyProperty | undefined): string {
  if (!prop) return ''
  if (prop.type === 'select') return prop.select?.name ?? ''
  return ''
}

function extractRelationIds(prop: AnyProperty | undefined): string[] {
  if (!prop) return []
  if (prop.type === 'relation') return prop.relation.map((r) => r.id)
  return []
}

// --- Mappers ---

function mapPageToItem(page: PageObjectResponse): InvoiceItem {
  const p = page.properties
  return {
    id: page.id,
    description: extractText(p[ITEM_KEYS.name]),
    quantity: extractNumber(p[ITEM_KEYS.qty]),
    unitPrice: extractNumber(p[ITEM_KEYS.price]),
    amount: extractNumber(p[ITEM_KEYS.amount]),
  }
}

function mapPageToInvoice(page: PageObjectResponse, items: InvoiceItem[]): InvoiceData {
  const p = page.properties
  return {
    id: page.id,
    invoiceNumber: extractText(p[INVOICE_KEYS.number]),
    clientName: extractText(p[INVOICE_KEYS.client]),
    issueDate: extractDate(p[INVOICE_KEYS.issueDate]),
    validUntil: extractDate(p[INVOICE_KEYS.validUntil]),
    status: extractSelect(p[INVOICE_KEYS.status]),
    totalAmount: extractNumber(p[INVOICE_KEYS.total]),
    items,
  }
}

// --- Rate limit retry ---

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (e) {
      if (
        APIResponseError.isAPIResponseError(e) &&
        e.status === 429 &&
        attempt < maxRetries
      ) {
        const delay = 1000 * 2 ** attempt
        logger.warn('notion', `rate limited, retry ${attempt + 1}/${maxRetries}`, { data: { delay } })
        await sleep(delay)
        continue
      }
      throw e
    }
  }
  throw new Error('withRetry: unreachable')
}

const CACHE_TTL = 60 * 10 // 10분

// --- Queries ---

async function _getInvoices(): Promise<InvoiceListItem[]> {
  if (!DATABASE_ID) {
    throw new Error('Notion env not configured: NOTION_DATABASE_ID is required')
  }

  const start = Date.now()
  // dataSources.query는 신규 Data Source 전용 — 기존 DB는 이전 버전 클라이언트로 쿼리
  const response = await withRetry(() =>
    notionLegacy.request<{
      results: Array<PageObjectResponse | PartialPageObjectResponse>
      has_more: boolean
      next_cursor: string | null
    }>({
      path: `databases/${DATABASE_ID}/query`,
      method: 'post',
      body: {
        sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      },
    })
  )
  logger.info('notion', 'getInvoices', { durationMs: Date.now() - start })

  return response.results
    .filter(isFullPage)
    .map((page) => {
      const { items: _items, ...listItem } = mapPageToInvoice(page, [])
      return listItem
    })
}

async function _getInvoiceByPageId(pageId: string): Promise<InvoiceData | null> {
  if (!DATABASE_ID || !ITEMS_DATABASE_ID) {
    throw new Error('Notion env not configured: NOTION_DATABASE_ID and NOTION_ITEMS_DATABASE_ID are required')
  }

  const start = Date.now()
  let page: Awaited<ReturnType<typeof notion.pages.retrieve>>
  try {
    page = await withRetry(() => notion.pages.retrieve({ page_id: pageId }))
  } catch (e) {
    if (APIResponseError.isAPIResponseError(e)) {
      if (e.code === APIErrorCode.ObjectNotFound) return null
      if (e.code === APIErrorCode.ValidationError) return null
    }
    logger.error('notion', `getInvoiceByPageId failed`, {
      error: {
        message: e instanceof Error ? e.message : String(e),
        code: APIResponseError.isAPIResponseError(e) ? e.code : undefined,
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
    throw e
  }

  if (!isFullPage(page)) return null

  const itemIds = extractRelationIds(page.properties[INVOICE_KEYS.items])

  const settled = await Promise.allSettled(
    itemIds.map((id) => withRetry(() => notion.pages.retrieve({ page_id: id }))),
  )

  const items: InvoiceItem[] = []
  for (const result of settled) {
    if (result.status === 'rejected') {
      logger.warn('notion', 'failed to retrieve item page', {
        error: { message: result.reason instanceof Error ? result.reason.message : String(result.reason) },
      })
      continue
    }
    if (!isFullPage(result.value)) continue
    items.push(mapPageToItem(result.value))
  }

  logger.info('notion', `getInvoiceByPageId`, { durationMs: Date.now() - start, data: { pageId, itemCount: items.length } })
  return mapPageToInvoice(page, items)
}

export const getInvoices = unstable_cache(_getInvoices, ['invoices'], { revalidate: CACHE_TTL })

export const getInvoiceByPageId = unstable_cache(
  _getInvoiceByPageId,
  ['invoice-by-id'],
  { revalidate: CACHE_TTL },
)
