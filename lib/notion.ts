import { Client, isFullPage, APIResponseError, APIErrorCode } from '@notionhq/client'
import type { PageObjectResponse, PartialPageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

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

// --- Queries ---

export async function getInvoices(): Promise<InvoiceListItem[]> {
  if (!DATABASE_ID) {
    throw new Error('Notion env not configured: NOTION_DATABASE_ID is required')
  }

  // dataSources.query는 신규 Data Source 전용 — 기존 DB는 이전 버전 클라이언트로 쿼리
  const response = await notionLegacy.request<{
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

  return response.results
    .filter(isFullPage)
    .map((page) => {
      const { items: _items, ...listItem } = mapPageToInvoice(page, [])
      return listItem
    })
}

export async function getInvoiceByPageId(pageId: string): Promise<InvoiceData | null> {
  if (!DATABASE_ID || !ITEMS_DATABASE_ID) {
    throw new Error('Notion env not configured: NOTION_DATABASE_ID and NOTION_ITEMS_DATABASE_ID are required')
  }

  let page: Awaited<ReturnType<typeof notion.pages.retrieve>>
  try {
    page = await notion.pages.retrieve({ page_id: pageId })
  } catch (e) {
    if (APIResponseError.isAPIResponseError(e)) {
      if (e.code === APIErrorCode.ObjectNotFound) return null
      if (e.code === APIErrorCode.ValidationError) return null
    }
    throw e
  }

  if (!isFullPage(page)) return null

  const itemIds = extractRelationIds(page.properties[INVOICE_KEYS.items])

  const settled = await Promise.allSettled(
    itemIds.map((id) => notion.pages.retrieve({ page_id: id })),
  )

  const items: InvoiceItem[] = []
  for (const result of settled) {
    if (result.status === 'rejected') {
      console.warn('[notion] Failed to retrieve item page:', result.reason)
      continue
    }
    if (!isFullPage(result.value)) continue
    items.push(mapPageToItem(result.value))
  }

  return mapPageToInvoice(page, items)
}
