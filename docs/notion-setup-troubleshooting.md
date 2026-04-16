# Notion DB 셋업 트러블슈팅 히스토리

## 문제

`@notionhq/client` SDK로 DB 생성 후 속성을 추가하려 했으나, DB는 생성되고 속성은 적용되지 않는 현상 발생.

---

## 시도한 방법들과 실패 원인

### 시도 1: `notion.databases.create()` 에 properties 직접 전달

```ts
await notion.databases.create({
  parent: { ... },
  title: [...],
  properties: {
    클라이언트명: { rich_text: {} },
    // ...
  },
})
```

**결과**: DB 생성은 되지만 properties 미적용
**원인**: `@notionhq/client@5.17.0` 은 `Notion-Version: 2026-03-11` 을 자동으로 사용하는데, 이 버전에서 Notion이 "Data Sources" 개념을 도입하면서 `POST /v1/databases` 의 `properties` 필드가 deprecated 처리됨 → 요청은 성공(200)하지만 properties 무시

---

### 시도 2: `notion.databases.update()` 로 생성 후 속성 추가

```ts
await notion.databases.update({
  database_id: dbId,
  properties: {
    클라이언트명: { rich_text: {} },
    // ...
  },
})
```

**결과**: 에러 없이 실행되지만 속성 미적용
**원인**: 동일. SDK가 새 API 버전을 사용하므로 `PATCH /v1/databases/{id}` 의 `properties` 필드도 무시됨

---

### 시도 3: `notion.request()` 로 `PUT /databases/{id}/properties/{name}` 호출

```ts
await notion.request({
  path: `databases/${dbId}/properties/${name}`,
  method: 'PUT',
  body: { ... },
})
```

**결과**: `invalid_request_url` 오류
**원인**: `PUT /databases/{id}/properties/{property_id}` 는 새 Data Sources API의 엔드포인트인데, SDK의 `request()` 가 이 경로를 지원하지 않음

---

## 해결책: `fetch` + `Notion-Version: 2022-06-28` 명시

```ts
await fetch(`https://api.notion.com/v1/databases`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    'Notion-Version': '2022-06-28',  // 핵심
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    parent: { ... },
    title: [...],
    properties: { ... },  // create 시 properties가 정상 적용됨
  }),
})
```

**결과**: DB 생성 + 속성 한 번에 적용 ✅
**원인**: `2022-06-28` 버전에서는 `POST /v1/databases` 의 `properties` 필드가 정상 동작하므로 create 한 번으로 모든 속성 설정 가능

---

## 핵심 원인 요약

| | `@notionhq/client` SDK | `fetch + 2022-06-28` |
|---|---|---|
| Notion API 버전 | `2026-03-11` (자동) | `2022-06-28` (명시) |
| DB properties 동작 | deprecated → 무시 | 정상 동작 |

Notion API `2025-09-03` 이후 "Data Sources" 개념 도입으로 DB 속성 관리 방식이 바뀌었고, SDK는 항상 최신 버전을 사용하기 때문에 기존 `properties` 필드가 동작하지 않는다. SDK가 새 Data Sources API를 공식 지원하기 전까지는 `fetch`로 구버전을 명시하는 것이 안정적.

---

## API 한계: 컬럼 순서 제어 불가

Notion API로 DB 생성 시 `properties` 객체의 선언 순서가 무시되고, Notion이 자동으로 가나다 순으로 정렬합니다.

컬럼 순서를 바꾸려면 View 설정 API를 사용해야 하는데 구조가 복잡하고 공식 지원이 불안정합니다.

**해결**: 스크립트 실행 후 노션 UI에서 수동으로 컬럼 드래그하여 순서 변경

---

## API 한계: formula 컬럼 숫자 포맷 설정 불가

Notion API의 `formula` 속성 정의에는 `expression` 필드만 존재하며, 숫자 표시 포맷(`won`, `number` 등)을 설정하는 필드가 없습니다.

| 속성 타입 | format 설정 가능 여부 |
|---|---|
| `number` | ✅ `{ number: { format: 'won' } }` |
| `formula` | ❌ `{ formula: { expression: '...' } }` 만 가능 |

**현상**: `금액` formula 컬럼이 수량 × 단가 계산은 정상이지만 결과값이 일반 텍스트로 표시됨

**시도한 방법**:
- API property에 `number_format: 'won'` 추가 → 무시됨
- expression을 `(prop("수량") * prop("단가"))` 로 감싸기 → 무시됨

**원인**: Notion 수식 편집기에서 수식을 `()` 로 감싸야 Won 포맷 옵션이 활성화되는 내부 동작이 API 레이어에서는 지원되지 않음

**해결**: 스크립트 실행 후 노션 UI에서 수동 변경 필요
> Items DB → 금액 컬럼 → 수식 편집 → 수식을 `(수량 * 단가)` 로 감싸기 → 숫자 형식 → 원

---

## 환경변수 정리

| 변수명 | 용도 | 스크립트 후 제거 가능 |
|---|---|---|
| `NOTION_API_KEY` | API 인증 | ❌ (앱 런타임 필요) |
| `NOTION_PARENT_PAGE_ID` | 스크립트 전용 — DB 생성 위치 | ✅ |
| `NOTION_DATABASE_ID` | Invoices DB ID | ❌ (앱 런타임 필요) |
| `NOTION_ITEMS_DATABASE_ID` | Items DB ID | ❌ (앱 런타임 필요) |
