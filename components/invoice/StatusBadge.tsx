import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Status = '대기' | '승인' | '거절' | string

type Props = {
  status: Status
}

const statusConfig: Record<string, { label: string; className: string }> = {
  대기: {
    label: '대기',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  승인: {
    label: '승인',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  거절: {
    label: '거절',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
}

export function StatusBadge({ status }: Props) {
  const config = statusConfig[status] ?? {
    label: status || '알 수 없음',
    className: 'bg-muted text-muted-foreground',
  }

  return (
    <Badge variant="outline" className={cn('shrink-0', config.className)}>
      {config.label}
    </Badge>
  )
}
