# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 개발 명령어

```bash
pnpm dev              # 개발 서버 (localhost:3000)
pnpm build            # 프로덕션 빌드
pnpm start            # 프로덕션 서버 실행
pnpm lint             # ESLint 검사
pnpm format           # Prettier 포맷팅
pnpm format:check     # 포맷팅 검사 (수정 없음)
pnpm test             # Playwright E2E 테스트
pnpm test:ui          # Playwright UI 모드
pnpm exec playwright test e2e/home.spec.ts        # 단일 테스트 파일 실행
pnpm exec playwright test -g "테스트 이름"         # 이름으로 필터
pnpm exec playwright test --project=chromium       # 특정 브라우저만
```

## 기술 스택

- **Next.js 16.2** (App Router) + **React 19** + **TypeScript 5** (strict mode)
- **Tailwind CSS 4** — `tailwind.config.ts` 없음, `app/globals.css`의 `@theme inline`에서 직접 설정
- **shadcn/ui 4** (radix-vega 스타일) — `pnpm dlx shadcn@latest add <name>`으로 컴포넌트 추가
  - **radix-ui** 통합 패키지 사용 (개별 `@radix-ui/*` 아님)
  - **class-variance-authority** (CVA)로 variants 정의
  - **tw-animate-css** 애니메이션
- **@notionhq/client 5** — Notion API (레거시 클라이언트 `notionVersion: '2022-06-28'` 병행 사용)
- **@react-pdf/renderer** — 서버사이드 PDF 생성 (`serverExternalPackages`에 등록 필요)
- **zustand 5** + **immer** (상태 관리)
- **react-hook-form 7** + **zod 4** + **@hookform/resolvers 5** (폼 검증)
  - ⚠️ zod v4는 v3과 API 차이 있음 — 작성 전 `docs/specs/` 또는 context7 참조
- **next-themes** (다크/라이트 모드)
- **sonner** (토스트), **lucide-react** (아이콘), **date-fns** (날짜)
- **usehooks-ts** (범용 커스텀 훅 라이브러리)

## 환경변수

`.env.example` 참조:
- `NEXT_PUBLIC_APP_URL` — 사이트 URL (메타데이터, OG 이미지에 사용)
- `NEXT_PUBLIC_APP_NAME` — 사이트 이름 (메타데이터)
- `NOTION_API_KEY` — Notion Integration 시크릿 키
- `NOTION_PARENT_PAGE_ID` — Notion 부모 페이지 ID (DB 생성 위치)
- `NOTION_DATABASE_ID` — 견적서 DB ID
- `NOTION_ITEMS_DATABASE_ID` — 견적 항목 DB ID

## 아키텍처

```
app/                    # App Router 페이지 (기본 RSC)
  layout.tsx            # 루트 레이아웃 (폰트, 프로바이더, Toaster)
  providers.tsx         # 클라이언트 프로바이더 (ThemeProvider, TooltipProvider)
  globals.css           # Tailwind 4 + CSS 변수 테마 (oklch)
  error.tsx             # 에러 경계
  loading.tsx           # 로딩 상태
  not-found.tsx         # 404 페이지
  opengraph-image.tsx   # OG 이미지 동적 생성
  robots.ts             # robots.txt 생성
  sitemap.ts            # sitemap.xml 생성
  invoice/              # 견적서 기능 라우트
    page.tsx            # 견적서 목록
    loading.tsx         # 목록 로딩 스켈레톤
    [id]/
      page.tsx          # 견적서 상세 (generateMetadata 포함)
      not-found.tsx     # 견적서 전용 404
      loading.tsx       # 상세 로딩 스켈레톤
  api/
    invoice/[id]/pdf/
      route.ts          # PDF 생성 API (GET)
components/
  ui/                   # shadcn/ui 프리미티브 (직접 수정 가능)
  layout/               # Header, Footer, Container, MobileNav
  common/               # Logo, ThemeToggle
  invoice/              # 견적서 전용 컴포넌트
    InvoiceHeader.tsx   # 번호·메타 카드
    InvoiceItemTable.tsx # 항목 테이블
    InvoiceSummary.tsx  # 소계·VAT·합계
    InvoicePDF.tsx      # @react-pdf/renderer PDF 문서
    StatusBadge.tsx     # 상태 배지
lib/
  utils.ts              # cn() — clsx + tailwind-merge
  metadata.ts           # getMetadata() — 경로 기반 SEO 메타데이터 헬퍼
  config.ts             # APP_URL, APP_NAME 상수 (환경변수 래퍼)
  notion.ts             # Notion API 클라이언트 + 조회 함수 (캐싱, 재시도)
  logger.ts             # 구조화 로거 (dev: pretty / prod: JSON)
hooks/                  # 커스텀 훅 (useMediaQuery 등)
public/
  fonts/                # PDF 한글 폰트 (AppleGothic.ttf)
e2e/                    # Playwright E2E 테스트
docs/specs/             # 기술 패턴 문서
  zustand-usage-pattern.md        # 3가지 Zustand 패턴 (기본/Immer/Persist+Immer)
  axios-react-query-pattern.md    # API 통합 패턴 (참고용, 미설치)
  nextjs-api-integration-patterns.md  # API 연동 방식 비교
  app-text-pattern.md             # Text 컴포넌트 사용법
  seo-setup.md                    # SEO 8단계 설정 가이드
docs/
  notion-db-setup.md              # Notion DB 생성 가이드
  notion-setup-troubleshooting.md # Notion 연동 트러블슈팅
```

## 주요 패턴

### RSC / 클라이언트 경계
- `app/` 내 컴포넌트는 기본 Server Component
- 상호작용이 필요하면 `'use client'` 선언 (폼, 토글, 모바일 네비 등)
- `providers.tsx`가 클라이언트 경계 — ThemeProvider, TooltipProvider 래핑

### Next.js 16 주의사항
- **동적 라우트 params가 Promise**: `const { slug } = await params` 형태로 사용
- `next.config.ts`에서 `experimental.typedEnv` 활성화됨
- 코드 작성 전 `node_modules/next/dist/docs/`의 관련 가이드를 확인할 것

### 클래스 병합
- 조건부 클래스는 반드시 `cn()` 사용: `cn('base', condition && 'extra')`
- shadcn/ui 컴포넌트는 CVA(class-variance-authority)로 variants 정의

### Text 컴포넌트
- `components/ui/text.tsx`: CVA 기반 다형성 텍스트 컴포넌트
- Variants: `h1`–`h6`, `body1`–`body8` / Colors: `default`, `muted`, `destructive`, `accent`
- `as` prop으로 렌더링 요소 변경: `<Text as="h2" variant="h2">`
- 상세 사용법: `docs/specs/app-text-pattern.md`

### SEO 메타데이터
- `lib/metadata.ts`의 `getMetadata(path, override?)`로 일관된 메타데이터 생성
- `lib/config.ts`에서 `APP_URL`, `APP_NAME` 상수 참조
- OG 이미지(`opengraph-image.tsx`), `robots.ts`, `sitemap.ts` 설정 완료
- 상세 설정: `docs/specs/seo-setup.md`

### 테마
- CSS 변수 (oklch 색상 공간) 기반, `.dark` 클래스로 다크모드 전환
- Tailwind CSS 4: `@theme inline` 블록에서 CSS 변수를 Tailwind 색상으로 매핑
- `@custom-variant dark (&:is(.dark *))` 사용

### 폼
- react-hook-form + zod 스키마 + `@hookform/resolvers`
- `z.infer<typeof schema>`로 타입 추출
- sonner 토스트로 제출 결과 알림

### 경로 alias
- `@/*`로 프로젝트 루트 참조 (예: `@/components/ui/button`)

## 코드 스타일

- Prettier: 세미콜론 없음, 작은따옴표, 2칸 들여쓰기, trailing comma
- `prettier-plugin-tailwindcss`로 클래스 자동 정렬
- ESLint 9 flat config (`eslint.config.mjs`): `core-web-vitals` + `typescript`
- 컴포넌트는 named export 사용
