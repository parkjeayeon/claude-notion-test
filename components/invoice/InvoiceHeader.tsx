import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { InvoiceData } from '@/lib/notion'

import { StatusBadge } from './StatusBadge'

type Props = {
  invoice: Pick<InvoiceData, 'invoiceNumber' | 'clientName' | 'issueDate' | 'validUntil' | 'status'>
}

function formatDate(iso: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function InvoiceHeader({ invoice }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs">견적서 번호</p>
            <CardTitle className="mt-1 text-xl">{invoice.invoiceNumber}</CardTitle>
          </div>
          <StatusBadge status={invoice.status} />
        </div>
      </CardHeader>
      <CardContent>
        <Separator className="mb-4" />
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs">클라이언트</p>
            <p className="mt-1 font-medium">{invoice.clientName || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">발행일</p>
            <p className="mt-1 font-medium">{formatDate(invoice.issueDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">유효기간</p>
            <p className="mt-1 font-medium">{formatDate(invoice.validUntil)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
