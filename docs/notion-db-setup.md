# 노션 데이터베이스 설정 가이드

이 프로젝트는 **노션을 DB로 사용하는 견적서 웹 뷰어 + PDF 다운로더** MVP 입니다. 관리자는 노션에서 견적서를 작성하고, 클라이언트는 고유 URL(`/invoice/[notionPageId]`)로 접속해 견적서를 조회·다운로드합니다.

`getInvoiceByPageId()` 구현 전에 노션에 DB 2개(견적서 / 항목)를 정확한 속성명·타입으로 생성해야 합니다.

---

## ⚠️ 선행 보안 처리

`.env.example`에 실제 Notion 토큰이 커밋되어 있는지 확인하세요. `ntn_` 으로 시작하는 실제 토큰이라면:

1. [Notion My Integrations](https://www.notion.so/my-integrations) → 해당 토큰 **revoke + regenerate**
2. `.env.example`은 placeholder(`ntn_xxxxxxxxxxxxxxxxxxxx`)로 변경
3. 실제 값은 `.env.local` 에만 저장 (git 추적 안됨)

---

## DB 스키마

`lib/notion.ts` 의 TypeScript 타입과 1:1로 매핑됩니다. **속성명을 한 번 정하면 절대 바꾸지 마세요** — `getInvoiceByPageId()` 내부에서 속성명을 그대로 key로 사용하기 때문에 이름 변경 시 코드가 깨집니다.

### 견적서 DB (Invoices) — `NOTION_DATABASE_ID` 로 지정

| 노션 속성명 | 속성 타입 | TS 필드 | 비고 |
|---|---|---|---|
| 견적서 번호 | Title | `invoiceNumber` | DB에서 제목 역할. "INV-2026-0001" 형식 권장 |
| 클라이언트명 | Text (Rich text) | `clientName` | |
| 발행일 | Date | `issueDate` | ISO 문자열로 매핑 |
| 유효기간 | Date | `validUntil` | ISO 문자열로 매핑 |
| 상태 | Select | `status` | 옵션: **대기 / 승인 / 거절** |
| 총 금액 | Number 또는 Rollup | `totalAmount` | Rollup(Sum) 권장 — 항목 금액 자동 합산 |
| 항목 | Relation → Items DB | `items[]` | dual_property로 생성해야 역방향 속성 자동 생성 |

### 항목 DB (Items) — `NOTION_ITEMS_DATABASE_ID` 로 지정

| 노션 속성명 | 속성 타입 | TS 필드 | 비고 |
|---|---|---|---|
| 항목명 | Title | `description` | 품목 설명 |
| 수량 | Number | `quantity` | |
| 단가 | Number | `unitPrice` | 포맷: Won 권장 |
| 금액 | Formula | `amount` | 수식: `prop("수량") * prop("단가")` |
| 견적서 | Relation (자동 역방향) | — | 위 `항목` Relation 생성 시 자동 생성됨 |

---

## 두 가지 생성 방식

수동 선행 단계(아래 3가지)는 두 방식 모두 필요합니다.

**[수동 필수 — 1회만]**
1. [Notion My Integrations](https://www.notion.so/my-integrations) → "New integration" 생성, 토큰 복사
2. 노션에서 빈 페이지 1개 생성 (워크스페이스 루트) — DB들의 부모 페이지
3. 그 페이지에서 `⋯ → Connections → Add connections` → 생성한 Integration 연결

이후는 **방식 A(UI)** 또는 **방식 B(스크립트)** 중 택일.

---

### 방식 A: 노션 UI에서 수동 생성

1. 노션에서 "항목 (Items)" DB 생성 (`/database` 명령어 사용)
   - Title → "항목명"
   - `+ Add a property`: 수량(Number), 단가(Number), 금액(Formula: `prop("수량") * prop("단가")`)
2. "견적서 (Invoices)" DB 생성
   - Title → "견적서 번호"
   - `+ Add a property`: 클라이언트명(Text), 발행일(Date), 유효기간(Date), 상태(Select: 대기/승인/거절), 총 금액(Number/Rollup)
   - `+ Add a property`: 항목(Relation) → "항목 (Items)" 선택 → "Show on 항목 (Items)" 켜기 → 역방향 이름 "견적서"
3. **두 DB 모두** `⋯ → Connections` → Integration 추가 (Relation 순회 시 권한 오류 방지)
4. 견적서 DB URL에서 32자리 DB ID 복사 → `.env.local`의 `NOTION_DATABASE_ID`에 입력

---

### 방식 B: 스크립트로 자동 생성 (권장)

`scripts/setup-notion.ts` 실행 한 번으로 DB 2개 + 모든 속성이 생성됩니다.

**생성 순서 주의**: Items DB를 먼저 만들고, 그 ID를 참조해 Invoices DB의 Relation을 설정해야 합니다.

```bash
# 1. 선행 패키지 확인 (tsx가 없을 경우)
pnpm add -D tsx

# 2. .env.local에 아래 두 값만 있으면 실행 가능
#    NOTION_API_KEY=ntn_...
#    NOTION_PARENT_PAGE_ID=<부모 페이지 32자리 ID>

# 3. 스크립트 실행
pnpm dlx tsx --env-file=.env.local scripts/setup-notion.ts

# 4. 출력된 ID를 .env.local에 추가
#    NOTION_DATABASE_ID=...
#    NOTION_ITEMS_DATABASE_ID=...
```

> **주의**: 스크립트를 두 번 실행하면 같은 이름의 DB가 중복 생성됩니다. 실수한 경우 노션 UI에서 중복 DB를 삭제하세요.

> **API 버전 주의**: Notion API `2025-09-03` 이후 "Data Sources" 개념이 도입되어 Relation의 `database_id` 가 `data_source_id` 로 바뀔 수 있습니다. 설치된 `@notionhq/client@5.17.0` 에서는 `database_id` 가 동작합니다. SDK 업그레이드 후 Relation 생성 실패 시 `data_source_id` 로 교체하세요.

---

## 환경변수 최종 형태 (`.env.local`)

```env
NOTION_API_KEY=ntn_xxxxxxxxxxxxxxxxxxxx
NOTION_PARENT_PAGE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   # 스크립트 실행 후 제거 가능
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx      # 견적서(Invoices) DB ID
NOTION_ITEMS_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx # 항목(Items) DB ID
```

> `lib/notion.ts:7` 은 현재 `DATABASE_ID` 하나만 export 중입니다. Phase 2에서 `ITEMS_DATABASE_ID` 도 함께 export 하도록 확장이 필요합니다.

---

## 속성값 추출 패턴 (Phase 2 `getInvoiceByPageId` 구현 시 참조)

`pages.retrieve()` 응답의 `properties` 객체는 속성명을 그대로 key로 사용합니다.

```ts
const props = page.properties

// Title
props['견적서 번호'].title[0]?.plain_text ?? ''

// Rich text
props['클라이언트명'].rich_text[0]?.plain_text ?? ''

// Number
props['총 금액'].number ?? 0

// Date (ISO 문자열)
props['발행일'].date?.start ?? ''

// Select
props['상태'].select?.name ?? '대기'

// Formula (Number 결과)
props['금액'].formula.number ?? 0

// Relation — ID 배열 반환
props['항목'].relation.map((r) => r.id)
```

**Items 일괄 조회 전략** (N+1 쿼리 방지):

```ts
// pages.retrieve N번 대신 databases.query 1번으로
await notion.databases.query({
  database_id: ITEMS_DATABASE_ID,
  filter: {
    property: '견적서',
    relation: { contains: pageId },
  },
})
```

---

## 검증 체크리스트

- [ ] 견적서 DB에 테스트 레코드 1건 생성 (상태: 대기, 금액 있음)
- [ ] 항목 DB에 테스트 항목 2건 생성 + 위 레코드와 Relation 연결
- [ ] 금액 Formula 컬럼이 `수량 × 단가`로 자동 계산됨
- [ ] 총 금액 Rollup이 항목 금액의 합과 일치함
- [ ] (Phase 2 구현 후) `getInvoiceByPageId(testPageId)` 가 `null` 없이 데이터 반환
- [ ] (Phase 3 구현 후) `/invoice/<testPageId>` 접속 시 견적서 표시됨
- [ ] (Phase 3 구현 후) `/invoice/nonexistent-id` 접속 시 404 페이지 표시됨
