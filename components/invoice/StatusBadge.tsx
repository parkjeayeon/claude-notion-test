import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Status = '대기' | '승인' | '거절' | string

type Props = { status: Status }

// status 값에 따른 배지 스타일 및 레이블 설정
const statusConfig: Record<string, { label: string; className: string }> = {
  대기: {
    label: '검토 대기',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40',
  },
  승인: {
    label: '승인 완료',
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40',
  },
  거절: {
    label: '거절됨',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40',
  },
}

export function StatusBadge({ status }: Props) {
  const config = statusConfig[status] ?? {
    label: status || '알 수 없음',
    className: 'bg-muted text-muted-foreground border-border',
  }

  return (
    <Badge
      variant="outline"
      className={cn('h-6 shrink-0 px-2.5 text-xs font-semibold tracking-wide', config.className)}
    >
      {config.label}
    </Badge>
  )
}
