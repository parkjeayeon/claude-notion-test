'use client'

import { useEffect } from 'react'

import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <h1 className="text-4xl font-bold">문제가 발생했습니다</h1>
      <p className="text-muted-foreground mt-2 text-lg">
        예상치 못한 오류가 발생했습니다.
      </p>
      <Button onClick={reset} className="mt-6">
        다시 시도
      </Button>
    </Container>
  )
}
