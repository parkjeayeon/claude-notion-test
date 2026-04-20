import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

import { InvoiceHeader } from '@/components/invoice/InvoiceHeader'
import { InvoiceItemTable } from '@/components/invoice/InvoiceItemTable'
import { InvoiceSummary } from '@/components/invoice/InvoiceSummary'
import { InvoiceStatusForm } from '@/components/admin/InvoiceStatusForm'
import { Button } from '@/components/ui/button'
import { getInvoiceByPageId } from '@/lib/notion'

import { updateStatusAction } from './actions'

export const metadata: Metadata = { title: '견적서 상세' }

type Props = {
  params: Promise<{ id: string }>
}

export default async function AdminInvoiceDetailPage({ params }: Props) {
  const { id } = await params
  const invoice = await getInvoiceByPageId(id)

  if (!invoice) {
    notFound()
  }

  return (
    <div className='space-y-4'>
      {/* 상단 헤더 영역: 뒤로가기 + 상태 변경 */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Button asChild variant='ghost' size='sm'>
          <Link href='/admin/invoices'>← 목록으로</Link>
        </Button>
        <InvoiceStatusForm
          pageId={invoice.id}
          currentStatus={invoice.status}
          updateStatusAction={updateStatusAction}
        />
      </div>

      {/* 견적서 상세 컴포넌트 재사용 */}
      <InvoiceHeader invoice={invoice} />
      <InvoiceItemTable items={invoice.items} />
      <InvoiceSummary totalAmount={invoice.totalAmount} items={invoice.items} />
    </div>
  )
}
