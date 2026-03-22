import { cn } from '@/lib/utils'

export function Container({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('mx-auto max-w-5xl px-6', className)} {...props}>
      {children}
    </div>
  )
}
