import { Suspense } from 'react'
import type { Metadata } from 'next'

import { InvoiceTableClient } from '@/components/admin/InvoiceTableClient'
import { getInvoices } from '@/lib/notion'

export const metadata: Metadata = { title: '견적서 관리' }

export default async function AdminInvoiceListPage() {
  const invoices = await getInvoices()

  return (
    <div className='space-y-4'>
      <h1 className='text-lg font-semibold'>견적서 목록</h1>
      <Suspense fallback={<div className='text-muted-foreground text-sm'>로딩 중...</div>}>
        <InvoiceTableClient invoices={invoices} />
      </Suspense>
    </div>
  )
}
