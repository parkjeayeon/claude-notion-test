# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 개발 명령어

```bash
npm run dev           # 개발 서버 (localhost:3000)
npm run build         # 프로덕션 빌드
npm run lint          # ESLint 검사
npm run format        # Prettier 포맷팅
npm run format:check  # 포맷팅 검사 (수정 없음)
npm run test          # Playwright E2E 테스트
npm run test:ui       # Playwright UI 모드
```

## 기술 스택

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5** (strict mode)
- **Tailwind CSS 4** (`@tailwindcss/postcss` 플러그인 사용)
- **shadcn/ui** (radix-vega 스타일, Radix UI 기반) — `npx shadcn@latest add <name>`으로 컴포넌트 추가
- **react-hook-form** + **zod** (폼 검증)
- **next-themes** (다크/라이트 모드)
- **sonner** (토스트 알림)
- **lucide-react** (아이콘)

## 아키텍처

```
app/                    # App Router 페이지 (기본 RSC)
  layout.tsx            # 루트 레이아웃 (폰트, 프로바이더, Toaster)
  providers.tsx         # 클라이언트 프로바이더 (ThemeProvider, TooltipProvider)
  examples/             # 컴포넌트 쇼케이스 페이지
  (demo)/               # 데모 라우트 그룹 (blog/[slug] 등)
  robots.ts             # robots.txt 생성
  sitemap.ts            # sitemap.xml 생성
  manifest.ts           # PWA manifest 생성
  opengraph-image.tsx   # 기본 OG 이미지 생성
components/
  ui/                   # shadcn/ui 프리미티브 (직접 수정 가능)
  layout/               # Header, Footer, Container, MobileNav
  common/               # Logo, ThemeToggle
lib/utils.ts            # cn() 유틸리티 (clsx + tailwind-merge)
lib/metadata.ts         # getMetadata() — 중앙 집중식 SEO 메타데이터 헬퍼
hooks/                  # 커스텀 훅 (useMediaQuery 등)
e2e/                    # Playwright E2E 테스트
```

## 주요 패턴

- **RSC 기본**: `app/` 내 컴포넌트는 Server Component. 상호작용이 필요하면 `'use client'` 선언
- **경로 alias**: `@/*`로 프로젝트 루트 참조 (예: `@/components/ui/button`)
- **클래스 병합**: 조건부 클래스는 `cn()` 사용 — `cn('base', condition && 'extra')`
- **테마**: CSS 변수 (oklch 색상 공간) 기반, `.dark` 클래스로 다크모드

## 코드 스타일

- Prettier: 세미콜론 없음, 작은따옴표, 2칸 들여쓰기, trailing comma
- `prettier-plugin-tailwindcss`로 클래스 자동 정렬
- 컴포넌트는 named export 사용
