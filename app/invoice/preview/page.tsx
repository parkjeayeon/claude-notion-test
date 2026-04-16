/**
 * 임시 UI 확인용 더미 페이지 — /invoice/preview
 * 실제 Notion 연결 없이 컴포넌트 렌더링 확인용. 배포 전 삭제 필요.
 */

import { InvoiceHeader } from '@/components/invoice/InvoiceHeader'
import { InvoiceItemTable } from '@/components/invoice/InvoiceItemTable'
import { InvoiceSummary } from '@/components/invoice/InvoiceSummary'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import type { InvoiceData } from '@/lib/notion'

const MOCK_INVOICE: InvoiceData = {
  id: 'preview',
  invoiceNumber: 'INV-2026-0001',
  clientName: '(주)테스트 클라이언트',
  issueDate: '2026-04-16',
  validUntil: '2026-05-16',
  status: '대기',
  totalAmount: 0,
  items: [
    { id: '1', description: 'UI/UX 디자인', quantity: 1, unitPrice: 1500000, amount: 1500000 },
    { id: '2', description: '프론트엔드 개발', quantity: 2, unitPrice: 2000000, amount: 4000000 },
    { id: '3', description: '백엔드 API 개발', quantity: 1, unitPrice: 1800000, amount: 1800000 },
  ],
}

export default function InvoicePreviewPage() {
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* 상단 액션 영역 */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">견적서 상세</p>
          <Button variant="outline" size="sm" disabled className="gap-2">
            <Download className="size-4" />
            PDF 다운로드
          </Button>
        </div>
        <InvoiceHeader invoice={MOCK_INVOICE} />
        <InvoiceItemTable items={MOCK_INVOICE.items} />
        <InvoiceSummary totalAmount={MOCK_INVOICE.totalAmount} items={MOCK_INVOICE.items} />
      </div>
    </Container>
  )
}
