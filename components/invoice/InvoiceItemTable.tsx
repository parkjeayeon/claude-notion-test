import { Card, CardContent } from '@/components/ui/card'
import type { InvoiceItem } from '@/lib/notion'

type Props = { items: InvoiceItem[] }

// 금액을 한국 원화 형식으로 변환
function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

export function InvoiceItemTable({ items }: Props) {
  return (
    <Card className="rounded-lg border border-border shadow-none ring-0">
      {/* 모바일 가로 스크롤 대응 */}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="bg-muted/40 border-b">
                <th className="text-muted-foreground w-12 px-6 py-3 text-center text-xs font-medium">
                  No.
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  항목명
                </th>
                <th className="text-muted-foreground px-4 py-3 text-right text-xs font-medium">
                  수량
                </th>
                <th className="text-muted-foreground px-4 py-3 text-right text-xs font-medium">
                  단가
                </th>
                <th className="text-muted-foreground px-6 py-3 text-right text-xs font-medium">
                  금액
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-muted-foreground px-6 py-10 text-center text-sm"
                  >
                    견적 항목이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="text-muted-foreground px-6 py-4 text-center tabular-nums">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 font-medium">{item.description}</td>
                    <td className="text-muted-foreground px-4 py-4 text-right tabular-nums">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="text-muted-foreground px-4 py-4 text-right tabular-nums">
                      {formatKRW(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold tabular-nums">
                      {formatKRW(item.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
