'use server'

import { updateInvoiceStatus } from '@/lib/notion'

export async function updateStatusAction(pageId: string, status: string): Promise<void> {
  await updateInvoiceStatus(pageId, status)
}
