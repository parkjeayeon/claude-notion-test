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
    <Card className="overflow-hidden">
      {/* 상단 브랜드 배너 영역 */}
      <div className="bg-primary px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* 로고/브랜드 영역 */}
          <div>
            <p className="text-primary-foreground/60 text-xs font-medium tracking-widest uppercase">
              견적서
            </p>
            <p className="text-primary-foreground mt-0.5 text-lg font-bold tracking-tight">
              ESTIMATE
            </p>
          </div>
          {/* 상태 배지 */}
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      <CardContent className="pt-6">
        {/* 견적서 번호 강조 영역 */}
        <div className="mb-6">
          <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
            견적서 번호
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
            {invoice.invoiceNumber}
          </p>
        </div>

        <Separator className="mb-6" />

        {/* 메타 정보 그리드 — 모바일: 1열, sm 이상: 3열 */}
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="space-y-1">
            <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              클라이언트
            </dt>
            <dd className="text-foreground text-sm font-semibold">
              {invoice.clientName || '-'}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              발행일
            </dt>
            <dd className="text-foreground text-sm font-semibold">
              {formatDate(invoice.issueDate)}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              유효기간
            </dt>
            <dd className="text-foreground text-sm font-semibold">
              {formatDate(invoice.validUntil)}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
