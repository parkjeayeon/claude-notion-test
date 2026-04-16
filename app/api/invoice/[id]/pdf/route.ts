import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'

import { getInvoiceByPageId } from '@/lib/notion'
import { InvoicePDF } from '@/components/invoice/InvoicePDF'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const invoice = await getInvoiceByPageId(id)

  if (!invoice) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const buffer = await renderToBuffer(
    createElement(InvoicePDF, { invoice }) as ReactElement<DocumentProps>,
  )
  const filename = `견적서_${invoice.invoiceNumber}.pdf`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
