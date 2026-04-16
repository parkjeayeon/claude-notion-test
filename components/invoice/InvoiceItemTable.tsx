import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { InvoiceItem } from '@/lib/notion'

type Props = {
  items: InvoiceItem[]
}

function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

export function InvoiceItemTable({ items }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>견적 항목</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left font-medium">항목명</th>
              <th className="px-6 py-3 text-right font-medium">수량</th>
              <th className="px-6 py-3 text-right font-medium">단가</th>
              <th className="px-6 py-3 text-right font-medium">금액</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-6 py-8 text-center">
                  항목이 없습니다.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-6 py-4">{item.description}</td>
                  <td className="px-6 py-4 text-right">{item.quantity.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">{formatKRW(item.unitPrice)}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatKRW(item.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
