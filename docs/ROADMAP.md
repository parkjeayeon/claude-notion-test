# 노션 기반 견적서 관리 시스템 — 고도화 로드맵

> MVP 로드맵은 [ROADMAP_V1.md](./roadmaps/ROADMAP_V1.md) 참고 (Phase 1–4 전체 완료)

## 개요

| Phase | 설명 | 상태 |
|-------|------|------|
| Phase 5 | 어드민 인증 (로그인 페이지 + 미들웨어) | ⬜ 미착수 |
| Phase 6 | 어드민 레이아웃 및 견적서 관리 | ⬜ 미착수 |
| Phase 7 | 링크 복사 기능 | ⬜ 미착수 |

---

## Phase 5: 어드민 인증

> 왜 필요한가: `/admin` 경로는 견적서 관리 기능을 포함하므로, 인증된 관리자만 접근할 수 있어야 합니다. 외부 서비스 없이 환경변수 기반 커스텀 로그인으로 구현합니다.

**목표**
- `/admin/login` 커스텀 로그인 페이지 구현
- 미들웨어에서 `/admin/*` 경로 인증 쿠키 검증
- 인증 실패 시 `/admin/login`으로 리다이렉트

**인증 흐름**
```
1. /admin/* 접근
   ↓ middleware.ts — 인증 쿠키 확인
   ↓ 쿠키 없음 → /admin/login 리다이렉트

2. /admin/login — 아이디/비밀번호 입력
   ↓ Server Action — 환경변수와 대조
   ↓ 일치 → 서명된 쿠키 발급 → /admin/invoices 리다이렉트

3. /admin/* 재접근
   ↓ middleware.ts — 쿠키 검증 통과
   ↓ 어드민 페이지 정상 접근
```

**환경변수 추가**

| 변수명 | 설명 |
|--------|------|
| `ADMIN_USERNAME` | 관리자 아이디 |
| `ADMIN_PASSWORD` | 관리자 비밀번호 |
| `ADMIN_SECRET` | 쿠키 서명용 시크릿 키 |

**작업 목록**

| # | 작업 | 신규/재사용 | 파일 |
|---|------|-------------|------|
| 5-1 | 인증 유틸 함수 | 신규 | `lib/auth.ts` |
| 5-2 | 미들웨어 — `/admin/*` 쿠키 검증 | 신규 | `middleware.ts` |
| 5-3 | 로그인 페이지 | 신규 | `app/admin/login/page.tsx` |
| 5-4 | 로그인 Server Action | 신규 | `app/admin/login/actions.ts` |

**구현 방향**

- `lib/auth.ts`: 쿠키 서명/검증 유틸 (`HMAC-SHA256`, Node.js `crypto` 모듈 사용)
- `middleware.ts`: `/admin` 경로 매칭, `auth-token` 쿠키 검증 → 실패 시 `/admin/login` 리다이렉트
  - `/admin/login`은 미들웨어 검증에서 제외
- `app/admin/login/page.tsx`: 아이디/비밀번호 폼 (react-hook-form + zod)
- `app/admin/login/actions.ts`: Server Action으로 환경변수 대조, 성공 시 `cookies().set()` 후 리다이렉트

**완료 기준**
- [ ] `/admin/invoices` 직접 접근 시 `/admin/login`으로 리다이렉트된다
- [ ] 올바른 아이디/비밀번호 입력 시 `/admin/invoices`로 이동한다
- [ ] 잘못된 자격증명 입력 시 에러 메시지가 표시된다
- [ ] 로그아웃 시 쿠키가 삭제되고 `/admin/login`으로 이동한다

---

## Phase 6: 어드민 레이아웃 및 견적서 관리

> 왜 필요한가: 클라이언트 공개 페이지와 관리자 페이지를 분리하여, 관리자 전용 기능을 별도 레이아웃에서 제공합니다.

**목표**
- `/admin` 경로에 어드민 전용 레이아웃 구성
- 어드민 견적서 목록 페이지 구현
- 기존 공개 `/invoice` 페이지는 변경 없이 유지

**작업 목록**

| # | 작업 | 신규/재사용 | 파일 |
|---|------|-------------|------|
| 6-1 | 어드민 레이아웃 생성 | 신규 | `app/admin/layout.tsx` |
| 6-2 | 어드민 헤더 컴포넌트 | 신규 | `components/admin/AdminHeader.tsx` |
| 6-3 | 어드민 견적서 목록 페이지 | 신규 | `app/admin/invoices/page.tsx` |
| 6-4 | 견적서 테이블 공유 컴포넌트 추출 | 리팩터 | `components/invoice/InvoiceTable.tsx` |

**구현 방향**

- `app/admin/layout.tsx`: `AdminHeader` 포함, `Container`로 콘텐츠 영역 래핑
- `components/invoice/InvoiceTable.tsx`: 기존 `app/invoice/page.tsx` 테이블 로직을 추출하여 공유 컴포넌트화
  - Props: `invoices: InvoiceListItem[]`, `showActions?: boolean`
  - `showActions=true`일 때 어드민 전용 액션 열 표시
- `components/admin/AdminHeader.tsx`: 로그아웃 버튼 포함 (Phase 5 쿠키 삭제 연동)
- `app/admin/invoices/page.tsx`: 기존 `getInvoices()` 함수 재사용 (`lib/notion.ts`)

**완료 기준**
- [ ] `/admin/invoices` 접근 시 어드민 레이아웃으로 견적서 목록이 표시된다
- [ ] 어드민 헤더에 로그아웃 버튼이 있다
- [ ] 공개 페이지 `/invoice`는 기존과 동일하게 동작한다

---

## Phase 7: 링크 복사 기능

> 왜 필요한가: 관리자가 클라이언트에게 견적서 링크를 빠르게 공유할 수 있어야 합니다. 클립보드 복사 후 토스트 피드백으로 UX를 완성합니다.

**목표**
- 어드민 견적서 목록 각 행에 "링크 복사" 버튼 추가
- 클릭 시 클라이언트용 URL (`/invoice/[id]`) 클립보드 복사
- sonner 토스트로 복사 완료 피드백 제공

**작업 목록**

| # | 작업 | 신규/재사용 | 파일 |
|---|------|-------------|------|
| 7-1 | 링크 복사 버튼 컴포넌트 | 신규 | `components/admin/CopyLinkButton.tsx` |
| 7-2 | 어드민 테이블 액션 열에 버튼 삽입 | 수정 | `components/invoice/InvoiceTable.tsx` |

**구현 방향**

- `CopyLinkButton.tsx`: `'use client'` 컴포넌트
  - Props: `invoiceId: string`
  - `navigator.clipboard.writeText(window.location.origin + '/invoice/' + invoiceId)` 사용
  - 성공 시 `toast.success('링크가 복사되었습니다')` (sonner, 루트 레이아웃에 이미 설치됨)
  - lucide-react `Copy` → `Check` 아이콘 전환으로 시각적 피드백 (1.5초 후 원복)

**완료 기준**
- [ ] 어드민 목록 각 행에 링크 복사 버튼이 표시된다
- [ ] 버튼 클릭 시 `https://[도메인]/invoice/[id]` 형식의 전체 URL이 클립보드에 복사된다
- [ ] 복사 성공 시 토스트 알림이 표시된다
- [ ] 버튼 아이콘이 Copy → Check로 전환되었다가 1.5초 후 원복된다

---

## 예상 파일 구조

```
app/
├── admin/
│   ├── layout.tsx              ← 어드민 전용 레이아웃 (신규)
│   ├── login/
│   │   ├── page.tsx            ← 로그인 페이지 (신규)
│   │   └── actions.ts          ← 로그인 Server Action (신규)
│   └── invoices/
│       └── page.tsx            ← 어드민 견적서 목록 (신규)
├── invoice/
│   ├── [id]/                   ← 클라이언트 공개 상세 (기존 유지)
│   └── page.tsx                ← 클라이언트 공개 목록 (기존 유지)
middleware.ts                   ← /admin/* 인증 검증 (신규)
lib/
└── auth.ts                     ← 쿠키 서명/검증 유틸 (신규)
components/
├── admin/
│   ├── AdminHeader.tsx         ← 어드민 헤더/로그아웃 (신규)
│   └── CopyLinkButton.tsx      ← 링크 복사 버튼 (신규)
└── invoice/
    ├── InvoiceTable.tsx        ← 공유 테이블 컴포넌트 (추출)
    └── ... (기존)
```

## 기술 결정 사항

| 결정 | 선택 | 이유 |
|------|------|------|
| 인증 방식 | 환경변수 + 서명 쿠키 | 외부 서비스 없음, 단일 관리자에 충분 |
| 쿠키 서명 | HMAC-SHA256 (Node.js crypto) | 추가 의존성 없음 |
| 어드민 라우팅 | `app/admin/` nested layout | 기존 파일 이동 없이 최소 변경 |
| 테이블 공유 | InvoiceTable 컴포넌트 추출 | 중복 제거, 공개/어드민 일관된 UI |
| 클립보드 URL | `window.location.origin + /invoice/[id]` | 외부 공유용이므로 전체 절대 URL 필요 |
| 토스트 라이브러리 | sonner (기존 설치) | 추가 의존성 없음 |

---

**문서 버전**: v2.1 (어드민 인증 추가)
**작성일**: 2026-04-20
**참고 문서**: [PRD.md](./PRD.md) · [ROADMAP_V1.md](./roadmaps/ROADMAP_V1.md)
