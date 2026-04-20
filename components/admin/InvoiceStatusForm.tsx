'use client'

import { useTransition } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Notion select 속성의 유효 상태값
const STATUS_OPTIONS = ['대기', '승인', '거절'] as const

type Props = {
  pageId: string
  currentStatus: string
  updateStatusAction: (pageId: string, status: string) => Promise<void>
}

export function InvoiceStatusForm({ pageId, currentStatus, updateStatusAction }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string) {
    startTransition(() => {
      updateStatusAction(pageId, value)
    })
  }

  return (
    <div className='flex items-center gap-3'>
      <span className='text-muted-foreground text-sm'>상태 변경</span>
      <Select defaultValue={currentStatus} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className='w-32'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && <span className='text-muted-foreground text-xs'>저장 중...</span>}
    </div>
  )
}
