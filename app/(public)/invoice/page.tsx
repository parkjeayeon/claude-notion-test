import Link from 'next/link'
import type { Metadata } from 'next'

import { Container } from '@/components/layout/container'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/invoice/StatusBadge'
import { getMetadata } from '@/lib/metadata'
import { getInvoices } from '@/lib/notion'

export const metadata: Metadata = getMetadata('/', { title: '견적서 목록' })

function formatDate(iso: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatKRW(amount: number): string {
  if (amount === 0) return '-'
  return amount.toLocaleString('ko-KR') + '원'
}

export default async function InvoiceListPage() {
  const invoices = await getInvoices()

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">견적서 목록</p>
          <span className="text-muted-foreground text-xs">{invoices.length}건</span>
        </div>

        <Card className="rounded-lg border border-border shadow-none ring-0">
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <p className="text-muted-foreground px-6 py-10 text-center text-sm">
                견적서가 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b">
                      <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium">
                        견적서 번호
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                        클라이언트
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                        발행일
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-right text-xs font-medium">
                        금액
                      </th>
                      <th className="text-muted-foreground px-6 py-3 text-right text-xs font-medium">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b transition-colors last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/invoice/${invoice.id}`}
                            className="font-medium tabular-nums hover:underline"
                          >
                            {invoice.invoiceNumber || '-'}
                          </Link>
                        </td>
                        <td className="text-muted-foreground px-4 py-4">
                          {invoice.clientName || '-'}
                        </td>
                        <td className="text-muted-foreground px-4 py-4 tabular-nums">
                          {formatDate(invoice.issueDate)}
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums">
                          {formatKRW(invoice.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <StatusBadge status={invoice.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}
