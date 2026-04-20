import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Container } from '@/components/layout/container'

export default function InvoiceDetailLoading() {
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* 액션바 */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>

        {/* InvoiceHeader 카드 */}
        <Card className="rounded-lg border border-border shadow-none ring-0">
          <CardContent className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-40" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="my-5 h-px w-full" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </CardContent>
        </Card>

        {/* InvoiceItemTable 카드 */}
        <Card className="rounded-lg border border-border shadow-none ring-0">
          <CardContent className="p-0">
            <Skeleton className="h-10 w-full rounded-none rounded-t-lg" />
            <Skeleton className="h-12 w-full rounded-none border-t" />
            <Skeleton className="h-12 w-full rounded-none border-t" />
            <Skeleton className="h-12 w-full rounded-none rounded-b-lg border-t" />
          </CardContent>
        </Card>

        {/* InvoiceSummary 카드 */}
        <Card className="rounded-lg border border-border shadow-none ring-0">
          <CardContent className="px-6 py-5">
            <div className="grid gap-6 sm:grid-cols-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}
