import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { InvoiceData } from '@/lib/notion'

import { StatusBadge } from './StatusBadge'

type Props = {
  invoice: Pick<InvoiceData, 'invoiceNumber' | 'clientName' | 'issueDate' | 'validUntil' | 'status'>
}

// ISO 날짜 문자열을 한국어 형식으로 변환
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
    <Card className="rounded-lg border border-border shadow-none ring-0">
      <CardContent className="px-6 py-5">
        {/* 1행: 견적서 번호(좌) + 상태 배지(우) */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs">견적서 번호</p>
            <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
              {invoice.invoiceNumber}
            </p>
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        <Separator className="my-5" />

        {/* 2행: 클라이언트 / 발행일 / 유효기간 */}
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <dt className="text-muted-foreground text-xs">클라이언트</dt>
            <dd className="text-foreground text-sm font-medium">{invoice.clientName || '-'}</dd>
          </div>

          <div className="space-y-1">
            <dt className="text-muted-foreground text-xs">발행일</dt>
            <dd className="text-foreground text-sm font-medium">{formatDate(invoice.issueDate)}</dd>
          </div>

          <div className="space-y-1">
            <dt className="text-muted-foreground text-xs">유효기간</dt>
            <dd className="text-foreground text-sm font-medium">{formatDate(invoice.validUntil)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
