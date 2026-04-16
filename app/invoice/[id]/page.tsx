import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Container } from '@/components/layout/container'
import { Skeleton } from '@/components/ui/skeleton'
import { getMetadata } from '@/lib/metadata'
import { getInvoiceByPageId } from '@/lib/notion'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: _id } = await params
  return getMetadata('/', { title: '견적서' })
}

export default async function InvoicePage({ params }: Props) {
  const { id } = await params

  const invoice = await getInvoiceByPageId(id)
  if (!invoice) notFound()

  // TODO: F003 - 견적서 UI 컴포넌트로 렌더링 (InvoiceHeader, StatusBadge, InvoiceItemTable, InvoiceSummary)

  return (
    <Container className="py-12">
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    </Container>
  )
}
