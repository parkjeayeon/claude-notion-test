import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import path from 'path'
import type { InvoiceData } from '@/lib/notion'

// 한글 폰트 등록 — public/fonts/ 에 위치
Font.register({
  family: 'AppleGothic',
  fonts: [
    { src: path.join(process.cwd(), 'public/fonts/AppleGothic.ttf'), fontWeight: 'normal' },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'AppleGothic',
    fontSize: 10,
    padding: 48,
    color: '#111',
  },
  title: {
    fontSize: 20,
    fontFamily: 'AppleGothic', fontWeight: 'bold',
    marginBottom: 4,
  },
  label: {
    fontSize: 8,
    color: '#888',
    marginBottom: 2,
  },
  section: {
    marginBottom: 20,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    marginVertical: 12,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  metaItem: {
    flex: 1,
  },
  metaValue: {
    fontSize: 10,
    fontFamily: 'AppleGothic', fontWeight: 'bold',
  },
  // table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  colNo: { width: 28, textAlign: 'center' },
  colDesc: { flex: 1 },
  colQty: { width: 40, textAlign: 'right' },
  colPrice: { width: 80, textAlign: 'right' },
  colAmount: { width: 80, textAlign: 'right' },
  colHeader: { fontSize: 8, color: '#888' },
  colBold: { fontFamily: 'AppleGothic', fontWeight: 'bold' },
  // summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: { color: '#555' },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  summaryTotalLabel: { fontSize: 11, fontFamily: 'AppleGothic', fontWeight: 'bold' },
  summaryTotalValue: { fontSize: 14, fontFamily: 'AppleGothic', fontWeight: 'bold' },
  note: {
    marginTop: 24,
    fontSize: 8,
    color: '#aaa',
  },
})

function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

function formatDate(iso: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const VAT_RATE = 0.1

type Props = { invoice: InvoiceData }

export function InvoicePDF({ invoice }: Props) {
  const subtotal = invoice.items.reduce((s, i) => s + i.amount, 0)
  const vat = Math.round(subtotal * VAT_RATE)
  const total = invoice.totalAmount > 0 ? invoice.totalAmount : subtotal + vat

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 헤더 */}
        <View style={styles.section}>
          <Text style={styles.label}>견적서 번호</Text>
          <Text style={styles.title}>{invoice.invoiceNumber}</Text>
        </View>

        <View style={styles.divider} />

        {/* 메타 정보 */}
        <View style={[styles.metaGrid, styles.section]}>
          <View style={styles.metaItem}>
            <Text style={styles.label}>클라이언트</Text>
            <Text style={styles.metaValue}>{invoice.clientName || '-'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.label}>발행일</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.issueDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.label}>유효기간</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.validUntil)}</Text>
          </View>
        </View>

        {/* 항목 테이블 */}
        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colNo, styles.colHeader]}>No.</Text>
            <Text style={[styles.colDesc, styles.colHeader]}>항목명</Text>
            <Text style={[styles.colQty, styles.colHeader]}>수량</Text>
            <Text style={[styles.colPrice, styles.colHeader]}>단가</Text>
            <Text style={[styles.colAmount, styles.colHeader]}>금액</Text>
          </View>
          {invoice.items.map((item, i) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colNo}>{i + 1}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity.toLocaleString()}</Text>
              <Text style={styles.colPrice}>{formatKRW(item.unitPrice)}</Text>
              <Text style={[styles.colAmount, styles.colBold]}>{formatKRW(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* 합계 */}
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ width: 240 }}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>소계 (공급가액)</Text>
              <Text>{formatKRW(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>부가세 (VAT 10%)</Text>
              <Text>{formatKRW(vat)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryTotal}>
              <Text style={styles.summaryTotalLabel}>합계 (부가세 포함)</Text>
              <Text style={styles.summaryTotalValue}>{formatKRW(total)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.note}>
          * 본 견적서의 금액은 부가가치세(VAT 10%)가 포함된 금액입니다.
        </Text>
      </Page>
    </Document>
  )
}
