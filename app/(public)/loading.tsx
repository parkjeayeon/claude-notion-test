import { Container } from '@/components/layout/container'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <Container className="py-24">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="mt-8 h-64 w-full max-w-2xl" />
      </div>
    </Container>
  )
}
