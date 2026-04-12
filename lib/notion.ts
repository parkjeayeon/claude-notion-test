import { Client } from '@notionhq/client'

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

export const DATABASE_ID = process.env.NOTION_DATABASE_ID ?? ''

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

// TODO: F001, F002 - Notion 페이지 ID로 견적서 데이터 조회
export async function getInvoiceByPageId(
  _pageId: string,
): Promise<InvoiceData | null> {
  throw new Error('Not implemented')
}
