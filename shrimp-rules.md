# Development Guidelines

## Project Overview

- Notion 기반 견적서 조회 시스템 MVP
- 핵심 라우트: `/invoice/[id]` (Notion 페이지 ID로 견적서 조회)
- 스택: Next.js 16.2 + React 19 + TypeScript strict + Tailwind v4 + shadcn/ui + Zustand v5

## Project Architecture

```
app/                    # App Router (기본 RSC)
  invoice/              # 견적서 목록 + 상세 라우트
    page.tsx            # 견적서 목록
    loading.tsx         # 목록 로딩 스켈레톤
    [id]/               # 견적서 상세 (동적 라우트)
      page.tsx
      not-found.tsx
      loading.tsx
  api/invoice/[id]/pdf/ # PDF 생성 API
  layout.tsx            # 루트 레이아웃
  page.tsx              # 홈페이지
  globals.css           # Tailwind v4 + CSS 변수 테마
components/
  ui/                   # shadcn/ui 프리미티브 (직접 수정 가능)
  layout/               # Header, Footer, Container, MobileNav
  invoice/              # 견적서 전용 컴포넌트
lib/
  notion.ts             # Notion API 클라이언트 + 모든 데이터 로직 (캐싱, 재시도)
  logger.ts             # 구조화 로거 — console 직접 사용 금지, 이 모듈 사용
  config.ts             # APP_URL, APP_NAME 상수
  metadata.ts           # getMetadata() SEO 헬퍼
  utils.ts              # cn() — clsx + tailwind-merge
public/fonts/           # PDF 한글 폰트 (AppleGothic.ttf)
docs/specs/             # 기술 패턴 문서 (구현 전 반드시 참조)
e2e/                    # Playwright E2E 테스트
```

## Architecture Rules

- `app/` 내 모든 컴포넌트는 기본 RSC — 인터랙션 필요시에만 `'use client'` 선언
- Notion API 관련 모든 로직은 `lib/notion.ts`에만 작성 — 다른 파일에서 `@notionhq/client` 직접 호출 금지
- `components/ui/`는 직접 수정 가능
- 경로 alias `@/*`로 프로젝트 루트 참조

## Environment Variables

- 필수: `NOTION_API_KEY`, `NOTION_PARENT_PAGE_ID`, `NOTION_DATABASE_ID`, `NOTION_ITEMS_DATABASE_ID`
- 공개: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`
- 환경변수 참조 위치: `lib/config.ts` (공개), `lib/notion.ts` (서버 전용)

## Multi-File Coordination Rules

환경변수 추가/수정 시:
- `.env.example` 반드시 동시 업데이트

`lib/notion.ts` 수정 시:
- `app/invoice/[id]/page.tsx` 영향 확인

SEO 관련 수정 시:
- `lib/metadata.ts` + `lib/config.ts` 함께 수정

shadcn/ui 컴포넌트 추가 시:
- `pnpm dlx shadcn@latest add <name>` 명령어만 사용 (수동 파일 생성 금지)

## Next.js 16 Rules

- 동적 라우트 `params`는 반드시 `await` — `const { id } = await params`
- `generateMetadata`의 `params`도 동일하게 `await` 필요
- `next.config.ts`에 `experimental.typedEnv: true` — 환경변수 타입 자동 생성됨

## Tailwind CSS v4 Rules

- `tailwind.config.ts` 파일 존재하지 않음 — 생성 금지
- 테마/색상 수정: `app/globals.css`의 `@theme inline` 블록만 수정
- 색상 시스템: CSS 변수 기반 oklch
- 다크모드: `@custom-variant dark (&:is(.dark *))` 패턴 사용
- 조건부 클래스: 반드시 `cn()` 사용 (`lib/utils.ts`)

## shadcn/ui Rules

- 컴포넌트 추가: `pnpm dlx shadcn@latest add <name>`
- `radix-ui` 통합 패키지 사용 — `@radix-ui/*` 개별 패키지 직접 설치 금지
- variants 정의: class-variance-authority (CVA) 사용
- Text 컴포넌트 (`components/ui/text.tsx`): h1~h6, body1~body8 variants, `as` prop 지원
  - 상세: `docs/specs/app-text-pattern.md`

## State Management (Zustand v5)

- 패턴 참조: `docs/specs/zustand-usage-pattern.md` (기본/Immer/Persist+Immer 3가지 패턴)
- immer 함께 사용

## Form Validation (React Hook Form + Zod v4)

- zod v4는 v3과 API 차이 있음 — 구현 전 `docs/specs/` 또는 context7 MCP 참조 필수
- 타입 추출: `z.infer<typeof schema>`
- 폼 결과 알림: sonner 토스트 사용

## PDF Generation

- 라이브러리: `@react-pdf/renderer`
- API Route (`/api/invoice/[id]/pdf`) 경유로 구현 완료
- `next.config.ts`에 `serverExternalPackages: ['@react-pdf/renderer']` 필수
- 한글 폰트: `public/fonts/AppleGothic.ttf` — `Font.register()`로 등록
- PDF 컴포넌트: `components/invoice/InvoicePDF.tsx`

## Notion API Rules

- `lib/notion.ts` 외부에서 `@notionhq/client` 직접 import 금지
- SDK v5.17: `databases.query` 제거됨 — `notionLegacy` 클라이언트(`notionVersion: '2022-06-28'`) + `request()` 사용
- 429 재시도: `withRetry()` 헬퍼 이미 구현됨 — 새 API 호출 시 활용
- 캐싱: `unstable_cache` TTL 10분 — 조회 함수는 반드시 캐시 적용

## Logging Rules

- `console.log/warn/error` 직접 사용 금지
- 반드시 `lib/logger.ts`의 `logger.info/warn/error(context, message, meta?)` 사용
- context는 모듈명 문자열 (예: `'notion'`, `'pdf'`)

## SEO Pattern

- 메타데이터 생성: `lib/metadata.ts`의 `getMetadata(path, override?)`
- 동적 메타데이터: `generateMetadata()` 함수 사용
- OG 이미지, robots.ts, sitemap.ts 이미 설정 완료

## Task Planning Format

`analysisResult` 작성 시 반드시 마크다운 형식 사용:

```
**Phase N 최종 목표**: 한 줄 요약

**아키텍처 원칙**
- 원칙 1
- 원칙 2

**구현 제약사항**
- 제약 1
- 제약 2

**핵심 기술 스택**
- 스택 1
- 스택 2
```

- `**굵게**`로 섹션 헤더 구분
- `-` 불릿으로 항목 나열
- 섹션 간 빈 줄 추가
- 평문 한 줄 금지

## Prohibited Actions

- `tailwind.config.ts` 생성 금지
- `@radix-ui/*` 개별 패키지 직접 설치 금지
- `lib/notion.ts` 외부에서 `@notionhq/client` 직접 import 금지
- 동적 라우트 `params`를 `await` 없이 직접 구조 분해 금지
- `docs/specs/` 내 패턴 문서를 확인하지 않고 Zustand/Zod/API 패턴 임의 구현 금지
- `tailwind.config.ts` 없음을 이유로 Tailwind 설정 파일 새로 생성 금지
- 새 환경변수 추가 시 `.env.example` 업데이트 생략 금지
- `console.log/warn/error` 직접 사용 금지 — `lib/logger.ts` 사용
- Card 컴포넌트에 shadow/ring 추가 금지 — `shadow-none ring-0 border border-border` 플랫 디자인 유지
