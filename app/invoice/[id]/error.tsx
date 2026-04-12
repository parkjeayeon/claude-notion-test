'use client'

import { useEffect } from 'react'

import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

export default function InvoiceError({
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
    <Container className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-4xl font-bold">견적서를 불러올 수 없습니다</h1>
      <p className="text-muted-foreground mt-2">잠시 후 다시 시도해주세요.</p>
      <Button onClick={reset} className="mt-6">
        다시 시도
      </Button>
    </Container>
  )
}
