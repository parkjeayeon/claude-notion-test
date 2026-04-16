import type { Metadata } from 'next'
import Link from 'next/link'
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
    <Container className="py-12">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* 상단 액션 영역 */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">견적서 상세</p>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href={`/api/invoice/${id}/pdf`} target="_blank" rel="noopener noreferrer">
              <Download className="size-4" />
              <span className="hidden sm:inline">PDF 다운로드</span>
            </Link>
          </Button>
        </div>

        <InvoiceHeader invoice={invoice} />
        <InvoiceItemTable items={invoice.items} />
        <InvoiceSummary totalAmount={invoice.totalAmount} items={invoice.items} />
      </div>
    </Container>
  )
}
