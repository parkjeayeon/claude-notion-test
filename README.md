# 견적서 조회 시스템

Notion을 데이터베이스로 활용하여 견적서를 관리하고, 클라이언트가 웹에서 조회 및 PDF 다운로드할 수 있는 시스템.

## 기술 스택

- **Next.js 16.2** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui 4**
- **@notionhq/client** — Notion API 연동
- **@react-pdf/renderer** — 서버사이드 PDF 생성
- **Playwright** — E2E 테스트

## 주요 기능

| 기능 | 경로 |
|------|------|
| 홈 (사용 안내) | `/` |
| 견적서 목록 | `/invoice` |
| 견적서 상세 | `/invoice/[id]` |
| PDF 다운로드 | `/api/invoice/[id]/pdf` |

## 시작하기

### 1. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local`을 열고 값을 채웁니다.

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=견적서 조회

# Notion API
NOTION_API_KEY=ntn_xxxxxxxxxxxxxxxxxxxx
NOTION_PARENT_PAGE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_ITEMS_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> Notion Integration 생성 및 DB 연결 방법은 [docs/notion-db-setup.md](docs/notion-db-setup.md) 참조.
> 트러블슈팅은 [docs/notion-setup-troubleshooting.md](docs/notion-setup-troubleshooting.md) 참조.

### 2. 의존성 설치 및 실행

```bash
pnpm install
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

## 개발 명령어

```bash
pnpm dev          # 개발 서버 (localhost:3000)
pnpm build        # 프로덕션 빌드
pnpm lint         # ESLint 검사
pnpm test         # Playwright E2E 테스트 전체 실행
```

## 프로젝트 구조

```
app/
  page.tsx                   # 홈 (사용 안내)
  invoice/
    page.tsx                 # 견적서 목록
    loading.tsx              # 목록 로딩 스켈레톤
    [id]/
      page.tsx               # 견적서 상세
      not-found.tsx          # 404 페이지
      loading.tsx            # 상세 로딩 스켈레톤
  api/
    invoice/[id]/pdf/
      route.ts               # PDF 생성 API
components/
  invoice/
    InvoiceHeader.tsx        # 견적서 번호·메타 카드
    InvoiceItemTable.tsx     # 항목 테이블
    InvoiceSummary.tsx       # 소계·VAT·합계
    InvoicePDF.tsx           # @react-pdf/renderer PDF 문서
    StatusBadge.tsx          # 상태 배지
lib/
  notion.ts                  # Notion API 조회 함수 (캐싱 10분, 429 재시도)
  logger.ts                  # 구조화 로거 (dev: pretty / prod: JSON)
  metadata.ts                # SEO 메타데이터 헬퍼
public/
  fonts/
    AppleGothic.ttf          # PDF 한글 폰트
e2e/
  invoice.spec.ts            # 견적서 E2E 테스트 (5개)
  home.spec.ts               # 홈 페이지 테스트
  navigation.spec.ts         # 네비게이션 테스트
```

## Notion 데이터베이스 구조

### 견적서 DB

| 속성명 | 타입 | 설명 |
|--------|------|------|
| 견적서 번호 | Title | 예: IVN-2026-001 |
| 클라이언트명 | Rich Text | |
| 발행일 | Date | |
| 유효기간 | Date | |
| 상태 | Select | 대기 / 승인 / 거절 |
| 총 금액 | Number | 부가세 포함 금액 |
| 항목 | Relation | 견적 항목 DB 연결 |

### 견적 항목 DB

| 속성명 | 타입 |
|--------|------|
| 항목명 | Title |
| 수량 | Number |
| 단가 | Number |
| 금액 | Formula (수량 × 단가) |

## 주요 설계 결정

- **Notion SDK v5.17 호환**: `databases.query` API 제거로 레거시 클라이언트(`notionVersion: '2022-06-28'`) + `request()` 저수준 호출로 우회
- **캐싱**: `unstable_cache` TTL 10분 — 동일 견적서 반복 조회 시 Notion API 미호출
- **Rate Limit**: 429 응답 시 지수 백오프(1s → 2s → 4s, 최대 3회 재시도)
- **PDF 한글**: macOS AppleGothic.ttf를 `public/fonts/`에 포함, `Font.register()`로 등록
- **플랫 디자인**: 모든 카드 `shadow-none ring-0 border border-border` — 견적서 문서 인쇄 친화적
