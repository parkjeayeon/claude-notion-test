import Link from 'next/link'

import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground mt-2 text-lg">
        페이지를 찾을 수 없습니다.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">홈으로 돌아가기</Link>
      </Button>
    </Container>
  )
}
