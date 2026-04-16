import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Status = '대기' | '승인' | '거절' | string

type Props = { status: Status }

// status 값에 따른 배지 스타일 및 dot 색상 — 디자인 토큰만 사용
const statusConfig: Record<string, { label: string; badgeCls: string; dotCls: string }> = {
  대기: {
    label: '검토 대기',
    badgeCls: 'bg-muted text-muted-foreground border-border',
    dotCls: 'bg-muted-foreground',
  },
  승인: {
    label: '승인 완료',
    badgeCls: 'bg-secondary text-secondary-foreground border-border',
    dotCls: 'bg-foreground',
  },
  거절: {
    label: '거절됨',
    badgeCls: 'bg-destructive/10 text-destructive border-destructive/30',
    dotCls: 'bg-destructive',
  },
}

export function StatusBadge({ status }: Props) {
  const config = statusConfig[status] ?? {
    label: status || '알 수 없음',
    badgeCls: 'bg-muted text-muted-foreground border-border',
    dotCls: 'bg-muted-foreground',
  }

  return (
    <Badge
      variant="outline"
      className={cn('h-6 shrink-0 gap-1.5 px-2.5 text-xs font-medium', config.badgeCls)}
    >
      <span className={cn('size-1.5 rounded-full', config.dotCls)} />
      {config.label}
    </Badge>
  )
}
