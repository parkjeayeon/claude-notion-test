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

export function InvoiceSummary({ totalAmount, items }: Props) {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const vat = Math.round(subtotal * VAT_RATE)
  const calculatedTotal = subtotal + vat
  // totalAmount가 명시된 경우 우선 적용, 없으면 소계+VAT 합산
  const displayTotal = totalAmount > 0 ? totalAmount : calculatedTotal

  return (
    <Card>
      <CardContent className="pt-6">
        {/* 합계 내역 — 우측 정렬 레이아웃 */}
        <div className="ml-auto max-w-xs space-y-3">
          {/* 소계 행 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">소계 (공급가액)</span>
            <span className="tabular-nums">{formatKRW(subtotal)}</span>
          </div>

          {/* VAT 행 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">부가세 (VAT 10%)</span>
            <span className="tabular-nums">{formatKRW(vat)}</span>
          </div>

          <Separator />

          {/* 최종 합계 — 크고 굵게 강조 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">합계 (부가세 포함)</span>
            <span className="text-primary text-xl font-bold tabular-nums">
              {formatKRW(displayTotal)}
            </span>
          </div>
        </div>

        {/* 안내 문구 */}
        <p className="text-muted-foreground mt-6 border-t pt-4 text-xs">
          * 본 견적서의 금액은 부가가치세(VAT 10%)가 포함된 금액입니다.
        </p>
      </CardContent>
    </Card>
  )
}
