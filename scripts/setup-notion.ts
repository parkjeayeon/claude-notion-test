/**
 * Notion DB 초기 셋업 스크립트 (일회성)
 *
 * 실행 전 필요한 환경변수 (.env.local):
 *   NOTION_API_KEY        — Integration 토큰
 *   NOTION_PARENT_PAGE_ID — DB를 생성할 부모 페이지 ID
 *
 * 실행:
 *   pnpm setup:notion
 *
 * 주의: 중복 실행 시 같은 이름의 DB가 중복 생성됩니다.
 *
 * [수동 후처리 필요]
 * Items DB의 `금액` formula 컬럼은 API로 숫자 표시 포맷(Won 등)을 설정할 수 없습니다.
 * - number_format 필드는 API에서 무시됨
 * - Notion 수식 편집기에서 수식을 () 로 감싸야 Won 포맷 옵션이 활성화되는 내부 동작이
 *   API 레이어에서는 지원되지 않음
 *
 * 스크립트 실행 후 노션 UI에서 수동으로 변경하세요:
 *   Items DB → 금액 컬럼 → 수식 편집 → 수식을 (수량 * 단가) 로 감싸기 → 숫자 형식 → 원
 */

const API_KEY = process.env.NOTION_API_KEY!
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID!

if (!API_KEY || !PARENT_PAGE_ID) {
  console.error('NOTION_API_KEY 와 NOTION_PARENT_PAGE_ID 가 .env.local 에 설정되어 있어야 합니다.')
  process.exit(1)
}

async function notionPost(path: string, body: unknown) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(JSON.stringify(await res.json()))
  return res.json() as Promise<{ id: string }>
}

async function main() {
  console.log('1/2 Items DB 생성 중...')
  const itemsDb = await notionPost('databases', {
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
    title: [{ type: 'text', text: { content: 'Items' } }],
    properties: {
      항목명: { title: {} },
      수량: { number: { format: 'number' } },
      단가: { number: { format: 'won' } },
      금액: { formula: { expression: '(prop("수량") * prop("단가"))' } },
    },
  })
  console.log(`   Items DB ID: ${itemsDb.id}`)

  console.log('2/2 Invoices DB 생성 중...')
  const invoicesDb = await notionPost('databases', {
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
    title: [{ type: 'text', text: { content: 'Invoices' } }],
    properties: {
      '견적서 번호': { title: {} },
      클라이언트명: { rich_text: {} },
      발행일: { date: {} },
      유효기간: { date: {} },
      상태: {
        select: {
          options: [
            { name: '대기', color: 'yellow' },
            { name: '승인', color: 'green' },
            { name: '거절', color: 'red' },
          ],
        },
      },
      '총 금액': { number: { format: 'won' } },
      항목: {
        relation: {
          database_id: itemsDb.id,
          type: 'dual_property',
          dual_property: {},
        },
      },
    },
  })
  console.log(`   Invoices DB ID: ${invoicesDb.id}`)

  console.log('\n✅ 완료. 아래 값을 .env.local 에 추가하세요:\n')
  console.log(`NOTION_DATABASE_ID=${invoicesDb.id.replace(/-/g, '')}`)
  console.log(`NOTION_ITEMS_DATABASE_ID=${itemsDb.id.replace(/-/g, '')}`)
}

main().catch((e) => {
  console.error('오류:', e.message ?? e)
  process.exit(1)
})
