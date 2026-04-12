import { FileText } from 'lucide-react'

import { Container } from '@/components/layout/container'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center py-24 md:py-32">
      <Container className="flex max-w-lg flex-col items-center text-center">
        <Badge variant="secondary" className="mb-4">
          노션 기반 견적서 시스템
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          견적서 조회
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          견적서 링크를 공유받으셨나요?
        </p>
        <Card className="mt-8 w-full text-left">
          <CardHeader>
            <FileText className="text-muted-foreground mb-1 size-5" />
            <CardTitle className="text-base">견적서 접근 방법</CardTitle>
            <CardDescription>
              발행자로부터 전달받은 고유 링크로 접속해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <code className="bg-muted rounded px-2 py-1 text-sm">
              /invoice/[견적서 ID]
            </code>
          </CardContent>
        </Card>
      </Container>
    </section>
  )
}
