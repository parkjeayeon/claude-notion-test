import { Container } from '@/components/layout/container'
import { Skeleton } from '@/components/ui/skeleton'

export default function InvoiceLoading() {
  return (
    <Container className="py-12">
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    </Container>
  )
}
