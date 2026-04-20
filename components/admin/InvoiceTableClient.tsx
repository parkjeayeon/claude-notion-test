'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Link2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/invoice/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { InvoiceListItem } from '@/lib/notion'

const PAGE_SIZE = 10

const STATUS_OPTIONS = [
  { value: 'all', label: '전체 상태' },
  { value: '대기', label: '대기' },
  { value: '승인', label: '승인' },
  { value: '거절', label: '거절' },
]

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

type Props = {
  invoices: InvoiceListItem[]
}

export function InvoiceTableClient({ invoices }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const q = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? 'all'
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const filtered = useMemo(() => {
    return invoices
      .filter((inv) => {
        if (!q) return true
        const lower = q.toLowerCase()
        return (
          inv.invoiceNumber.toLowerCase().includes(lower) ||
          inv.clientName.toLowerCase().includes(lower)
        )
      })
      .filter((inv) => {
        if (!status || status === 'all') return true
        return inv.status === status
      })
  }, [invoices, q, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  async function copyLink(id: string) {
    try {
      const url = `${window.location.origin}/invoice/${id}`
      await navigator.clipboard.writeText(url)
      toast.success('링크가 복사되었습니다')
    } catch {
      toast.error('복사에 실패했습니다')
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <Input
          placeholder='견적서 번호 또는 클라이언트명 검색'
          value={q}
          onChange={(e) => updateParams({ q: e.target.value, page: '1' })}
          className='sm:max-w-xs'
        />
        <Select
          value={status}
          onValueChange={(val) => updateParams({ status: val === 'all' ? '' : val, page: '1' })}
        >
          <SelectTrigger className='w-full sm:w-36'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className='text-muted-foreground text-xs sm:ml-auto'>{filtered.length}건</span>
      </div>

      <Card className='rounded-lg border shadow-none ring-0'>
        <CardContent className='p-0'>
          {paginated.length === 0 ? (
            <p className='text-muted-foreground px-6 py-10 text-center text-sm'>
              {q || status !== 'all' ? '검색 결과가 없습니다.' : '견적서가 없습니다.'}
            </p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[580px] text-sm'>
                <thead>
                  <tr className='bg-muted/40 border-b'>
                    <th className='text-muted-foreground px-6 py-3 text-left text-xs font-medium'>
                      견적서 번호
                    </th>
                    <th className='text-muted-foreground px-4 py-3 text-left text-xs font-medium'>
                      클라이언트
                    </th>
                    <th className='text-muted-foreground px-4 py-3 text-left text-xs font-medium'>
                      발행일
                    </th>
                    <th className='text-muted-foreground px-4 py-3 text-right text-xs font-medium'>
                      금액
                    </th>
                    <th className='text-muted-foreground px-4 py-3 text-right text-xs font-medium'>
                      상태
                    </th>
                    <th className='text-muted-foreground px-6 py-3 text-right text-xs font-medium'>
                      링크
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className='border-b transition-colors last:border-0 hover:bg-muted/30'
                    >
                      <td className='px-6 py-4'>
                        <Link
                          href={`/admin/invoices/${invoice.id}`}
                          className='font-medium tabular-nums hover:underline'
                        >
                          {invoice.invoiceNumber || '-'}
                        </Link>
                      </td>
                      <td className='text-muted-foreground px-4 py-4'>
                        {invoice.clientName || '-'}
                      </td>
                      <td className='text-muted-foreground px-4 py-4 tabular-nums'>
                        {formatDate(invoice.issueDate)}
                      </td>
                      <td className='px-4 py-4 text-right tabular-nums'>
                        {formatKRW(invoice.totalAmount)}
                      </td>
                      <td className='px-4 py-4 text-right'>
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className='px-6 py-4 text-right'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-7'
                          onClick={() => copyLink(invoice.id)}
                          title='링크 복사'
                        >
                          <Link2 className='size-3.5' />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className='flex items-center justify-end gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={currentPage <= 1}
            onClick={() => updateParams({ page: String(currentPage - 1) })}
          >
            <ChevronLeft className='size-4' />
          </Button>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {currentPage} / {totalPages}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={currentPage >= totalPages}
            onClick={() => updateParams({ page: String(currentPage + 1) })}
          >
            <ChevronRight className='size-4' />
          </Button>
        </div>
      )}
    </div>
  )
}
