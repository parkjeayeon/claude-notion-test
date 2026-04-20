import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Container } from '@/components/layout/container'

export default function InvoiceListLoading() {
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* 액션바 */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-8" />
        </div>

        {/* 테이블 카드 */}
        <Card className="rounded-lg border border-border shadow-none ring-0">
          <CardContent className="p-0">
            <Skeleton className="h-10 w-full rounded-none rounded-t-lg" />
            <Skeleton className="h-12 w-full rounded-none border-t" />
            <Skeleton className="h-12 w-full rounded-none border-t" />
            <Skeleton className="h-12 w-full rounded-none rounded-b-lg border-t" />
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}
