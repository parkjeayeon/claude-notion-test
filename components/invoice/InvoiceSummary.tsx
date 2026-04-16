import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { InvoiceData } from '@/lib/notion'

type Props = {
  totalAmount: InvoiceData['totalAmount']
  items: InvoiceData['items']
}

function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

export function InvoiceSummary({ totalAmount, items }: Props) {
  const calculatedTotal = items.reduce((sum, item) => sum + item.amount, 0)
  const displayTotal = totalAmount > 0 ? totalAmount : calculatedTotal

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">소계</span>
            <span>{formatKRW(calculatedTotal)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>합계</span>
            <span>{formatKRW(displayTotal)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
