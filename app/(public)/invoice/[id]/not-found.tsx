import Link from 'next/link'
import { FileX } from 'lucide-react'

import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

export default function InvoiceNotFound() {
  return (
    <Container className="py-24">
      <div className="mx-auto max-w-3xl flex flex-col items-center text-center">
        <FileX className="text-muted-foreground mb-6 size-12" strokeWidth={1.5} />
        <h1 className="text-2xl font-semibold tracking-tight">견적서를 찾을 수 없습니다</h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          요청하신 견적서가 존재하지 않거나 삭제되었습니다.
          <br />
          URL을 다시 확인하거나 견적서 발행자에게 문의해 주세요.
        </p>
        <Button asChild variant="outline" className="mt-8">
          <Link href="/invoice">목록으로 돌아가기</Link>
        </Button>
      </div>
    </Container>
  )
}
