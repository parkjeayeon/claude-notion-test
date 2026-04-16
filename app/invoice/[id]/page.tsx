import type { Metadata } from 'next'
import { Download } from 'lucide-react'
import { notFound } from 'next/navigation'

import { InvoiceHeader } from '@/components/invoice/InvoiceHeader'
import { InvoiceItemTable } from '@/components/invoice/InvoiceItemTable'
import { InvoiceSummary } from '@/components/invoice/InvoiceSummary'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
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
        {/* 상단 액션 영역 — 제목 + PDF 다운로드 버튼 */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm">견적서 상세</p>
          </div>
          {/* TODO: PDF 다운로드 기능 구현 필요 (Phase 3) */}
          <Button
            variant="outline"
            size="sm"
            disabled
            className="gap-2"
            aria-label="PDF 다운로드 (준비 중)"
          >
            <Download className="size-4" />
            PDF 다운로드
          </Button>
        </div>

        {/* 견적서 헤더 (번호, 클라이언트, 날짜, 상태) */}
        <InvoiceHeader invoice={invoice} />

        {/* 견적 항목 테이블 */}
        <InvoiceItemTable items={invoice.items} />

        {/* 합계 요약 (소계, VAT, 총액) */}
        <InvoiceSummary totalAmount={invoice.totalAmount} items={invoice.items} />
      </div>
    </Container>
  )
}
