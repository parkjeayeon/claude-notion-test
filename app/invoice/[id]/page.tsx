import type { Metadata } from 'next'

import { Container } from '@/components/layout/container'
import { Skeleton } from '@/components/ui/skeleton'
import { getMetadata } from '@/lib/metadata'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: _id } = await params
  return getMetadata('/', { title: '견적서' })
}

export default async function InvoicePage({ params }: Props) {
  const { id: _id } = await params

  // TODO: F002 - getInvoiceByPageId(id) 로 데이터 조회
  // TODO: F011 - 견적서가 없으면 notFound() 호출

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
