import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { InvoiceHeader } from '@/components/invoice/InvoiceHeader'
import { InvoiceItemTable } from '@/components/invoice/InvoiceItemTable'
import { InvoiceSummary } from '@/components/invoice/InvoiceSummary'
import { Container } from '@/components/layout/container'
import { getMetadata } from '@/lib/metadata'
import { getInvoiceByPageId } from '@/lib/notion'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const invoice = await getInvoiceByPageId(id)
  if (!invoice) return getMetadata('/', { title: '견적서를 찾을 수 없습니다' })
  return getMetadata('/', {
    title: `${invoice.invoiceNumber} - ${invoice.clientName}`,
  })
}

export default async function InvoicePage({ params }: Props) {
  const { id } = await params

  const invoice = await getInvoiceByPageId(id)
  if (!invoice) notFound()

  return (
    <Container className="max-w-3xl py-12">
      <div className="space-y-6">
        <InvoiceHeader invoice={invoice} />
        <InvoiceItemTable items={invoice.items} />
        <InvoiceSummary totalAmount={invoice.totalAmount} items={invoice.items} />
        {/* TODO: PDF 다운로드 버튼 (Phase 3 PDF 태스크에서 구현) */}
      </div>
    </Container>
  )
}
