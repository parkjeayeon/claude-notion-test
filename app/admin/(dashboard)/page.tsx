import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getInvoices } from '@/lib/notion'

export const metadata: Metadata = { title: '대시보드' }

export default async function AdminDashboardPage() {
  const invoices = await getInvoices()

  const statusCounts = invoices.reduce<Record<string, number>>((acc, inv) => {
    const key = inv.status || '알 수 없음'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

  return (
    <div className='space-y-6'>
      <h1 className='text-lg font-semibold'>대시보드</h1>

      <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
        <Card className='shadow-none'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-muted-foreground text-xs font-medium'>전체 견적서</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold tabular-nums'>{invoices.length}</p>
          </CardContent>
        </Card>

        <Card className='shadow-none'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-muted-foreground text-xs font-medium'>대기</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold tabular-nums'>{statusCounts['대기'] ?? 0}</p>
          </CardContent>
        </Card>

        <Card className='shadow-none'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-muted-foreground text-xs font-medium'>승인</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold tabular-nums'>{statusCounts['승인'] ?? 0}</p>
          </CardContent>
        </Card>

        <Card className='shadow-none'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-muted-foreground text-xs font-medium'>총 금액</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xl font-bold tabular-nums'>
              {totalAmount === 0 ? '-' : totalAmount.toLocaleString('ko-KR') + '원'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className='shadow-none'>
        <CardHeader className='flex flex-row items-center justify-between pb-3'>
          <CardTitle className='text-sm font-semibold'>최근 견적서</CardTitle>
          <Link href='/admin/invoices' className='text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs'>
            <FileText className='size-3' />
            전체 보기
          </Link>
        </CardHeader>
        <CardContent className='p-0'>
          {invoices.length === 0 ? (
            <p className='text-muted-foreground px-6 py-8 text-center text-sm'>견적서가 없습니다.</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[400px] text-sm'>
                <thead>
                  <tr className='bg-muted/40 border-b'>
                    <th className='text-muted-foreground px-6 py-3 text-left text-xs font-medium'>견적서 번호</th>
                    <th className='text-muted-foreground px-4 py-3 text-left text-xs font-medium'>클라이언트</th>
                    <th className='text-muted-foreground px-6 py-3 text-right text-xs font-medium'>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 5).map((invoice) => (
                    <tr key={invoice.id} className='border-b last:border-0'>
                      <td className='px-6 py-3'>
                        <Link href={`/admin/invoices/${invoice.id}`} className='font-medium tabular-nums hover:underline'>
                          {invoice.invoiceNumber || '-'}
                        </Link>
                      </td>
                      <td className='text-muted-foreground px-4 py-3'>{invoice.clientName || '-'}</td>
                      <td className='px-6 py-3 text-right'>
                        <span className='text-muted-foreground text-xs'>{invoice.status || '-'}</span>
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
  )
}
