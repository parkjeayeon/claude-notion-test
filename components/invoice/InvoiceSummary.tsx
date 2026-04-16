import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { InvoiceData } from '@/lib/notion'

type Props = {
  totalAmount: InvoiceData['totalAmount']
  items: InvoiceData['items']
}

// 금액을 한국 원화 형식으로 변환
function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

// VAT 세율 10%
const VAT_RATE = 0.1

// 라벨-값 행 헬퍼
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

export function InvoiceSummary({ totalAmount, items }: Props) {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const vat = Math.round(subtotal * VAT_RATE)
  const calculatedTotal = subtotal + vat
  // totalAmount가 명시된 경우 우선 적용, 없으면 소계+VAT 합산
  const displayTotal = totalAmount > 0 ? totalAmount : calculatedTotal

  return (
    <Card className="rounded-lg border border-border shadow-none ring-0">
      <CardContent className="px-6 py-5">
        {/* 2열 grid: 좌측 안내문 / 우측 합계 */}
        <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
          {/* 좌측: 안내 문구 — 빈 공간 채움 */}
          <div className="text-muted-foreground space-y-1.5 text-xs leading-relaxed">
            <p>본 견적서의 금액은 부가가치세(VAT 10%)가 포함된 금액입니다.</p>
            <p>유효기간 내 회신 부탁드립니다.</p>
          </div>

          {/* 우측: 소계 / VAT / 합계 */}
          <div className="w-full space-y-3 sm:ml-auto sm:max-w-xs">
            <Row label="소계 (공급가액)" value={formatKRW(subtotal)} />
            <Row label="부가세 (VAT 10%)" value={formatKRW(vat)} />
            <Separator />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">합계 (부가세 포함)</span>
              <span className="text-foreground text-xl font-bold tabular-nums">
                {formatKRW(displayTotal)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
