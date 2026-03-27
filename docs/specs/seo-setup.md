# SEO 셋업 프로세스

이 프로젝트에서 SEO를 설정하는 단계별 프로세스.

---

## Step 1: 환경변수 설정

`.env` (또는 배포 환경)에 다음 값을 설정한다.

```env
NEXT_PUBLIC_APP_URL=https://example.com
NEXT_PUBLIC_APP_NAME=MyApp
```

이 값은 `robots.ts`, `sitemap.ts`, `lib/metadata.ts`, `layout.tsx`에서 공통으로 사용된다.

### www vs non-www — 어느 쪽이든 상관없지만 통일해야 한다

- Google은 `www.example.com`과 `example.com`을 **별개 사이트**로 취급한다
- `www` 사용 여부는 자유. 핵심은 **하나를 선택하고 모든 곳에서 일관되게** 사용하는 것
- `NEXT_PUBLIC_APP_URL`에 정한 도메인 = canonical URL = sitemap URL = Search Console 등록 도메인 = Rich Results Test URL → 전부 동일해야 한다
- 선택하지 않은 쪽은 301 리다이렉트를 설정한다 (Vercel: `vercel.json`, Netlify: `netlify.toml`의 redirects)

```jsonc
// vercel.json 예시 (www → non-www 리다이렉트)
{
  "redirects": [
    {
      "source": "/:path(.*)",
      "has": [{ "type": "host", "value": "www.example.com" }],
      "destination": "https://example.com/:path",
      "permanent": true
    }
  ]
}
```

---

## Step 2: Favicon 준비

### Google 검색결과 favicon 요구사항

- **크기**: 48×48px 배수 (48, 96, 144, 192...). 16×16이나 32×32만 있으면 Google 검색결과에 표시되지 않을 수 있음
- **형태**: 정사각형 (1:1 비율)
- **포맷**: PNG, ICO 권장 (SVG는 지원이 불안정)
- **접근성**: Googlebot과 Googlebot-Image가 크롤링 가능해야 함 (robots.txt에서 차단하지 않을 것)

### 필요한 파일

| 파일 | 크기 | 용도 | 위치 |
|------|------|------|------|
| `favicon.ico` | 48×48 | 브라우저 탭 + Google 검색결과 | `app/` |
| `icon.png` | 192×192 | Android, PWA 아이콘 | `app/` |
| `apple-icon.png` | 180×180 | iOS 홈 화면 추가 | `app/` |

Next.js는 `app/` 디렉토리에 이 파일들을 놓으면 자동으로 감지하고 `<link>` 태그를 생성한다. `metadata.icons`로 따로 설정할 필요 없다.

### 생성 방법

1. 512×512 이상의 원본 아이콘 PNG를 준비한다
2. [realfavicongenerator.net](https://realfavicongenerator.net/)에서 각 크기별 파일을 생성한다
3. `app/` 디렉토리에 배치한다

또는 `app/icon.tsx`로 동적 생성할 수도 있다:

```tsx
// app/icon.tsx
import { ImageResponse } from 'next/og'

export const size = { width: 48, height: 48 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 32,
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: 8,
        }}
      >
        S
      </div>
    ),
    { ...size },
  )
}
```

여러 크기를 동시에 생성하려면 `generateImageMetadata`를 사용한다:

```tsx
// app/icon.tsx
import { ImageResponse } from 'next/og'

export function generateImageMetadata() {
  return [
    { contentType: 'image/png', size: { width: 48, height: 48 }, id: 'small' },
    { contentType: 'image/png', size: { width: 192, height: 192 }, id: 'large' },
  ]
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const iconId = await id
  return new ImageResponse(/* ... */)
}
```

### Favicon 캐싱 문제 (nova-air-web 사례)

**문제**: favicon을 교체해도 Google 검색결과에 반영되지 않음

**원인**: Google은 자체 캐시에 favicon을 저장한다. 서버의 `Cache-Control` 헤더(`max-age=0, must-revalidate` 등)는 브라우저 캐시에만 영향을 주고, Google 크롤러 캐시에는 효과가 없다.

**해결 프로세스**:

1. 새 favicon 파일을 배포한다
2. **48×48 이상 크기가 있는지 확인한다** — Google은 이 크기를 요구하며, 16×16/32×32만 있으면 무시할 수 있음
3. Google Search Console → URL 검사 → 사이트 홈 URL 입력 → "색인 생성 요청" 클릭
4. **1~3주 대기** — Google이 재크롤링할 때까지 기다린다
5. 빠른 갱신 트릭: 기존에 없던 새 크기(예: 512×512)를 추가하면 Google이 전체 favicon 캐시를 새로 가져가는 경우가 있음

---

## Step 3: 메타데이터 설정

### 현재 구조

- `app/layout.tsx`: 사이트 전체 기본 메타데이터 (title 템플릿, description, og, twitter)
- `lib/metadata.ts`: 페이지별 메타데이터를 관리하는 `getMetadata()` 헬퍼

### 새 페이지 추가 시 프로세스

1. `lib/metadata.ts`의 `registry`에 경로와 메타데이터를 등록한다:

```ts
const registry: Record<string, MetadataConfig> = {
  '/': { title: 'Home', description: '...' },
  '/about': { title: 'About', description: '...' },  // 추가
}
```

2. 해당 페이지의 `page.tsx`에서 `getMetadata()`를 호출한다:

```tsx
// app/about/page.tsx
import { getMetadata } from '@/lib/metadata'

export const metadata = getMetadata('/about')
```

### 동적 메타데이터 (블로그 등)

서버에서 데이터를 가져와야 하는 경우 `generateMetadata()`를 사용한다:

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.ogImage],
    },
  }
}
```

### 필수 메타 태그 체크리스트

| 태그 | 현재 상태 | 설정 위치 |
|------|----------|----------|
| `<title>` | O | `layout.tsx` (템플릿) + 페이지별 |
| `<meta name="description">` | O | `layout.tsx` + `getMetadata()` |
| `<link rel="canonical">` | O | `getMetadata()` (alternates.canonical) |
| `og:title`, `og:description`, `og:url` | O | `getMetadata()` |
| `og:image` | O | `app/opengraph-image.tsx` |
| `twitter:card` | O | `layout.tsx` |
| `<meta name="robots">` | - | 필요 시 페이지별 추가 |

---

## Step 4: robots.ts & sitemap.ts 관리

### robots.ts (현재 설정)

```ts
// app/robots.ts
rules: { userAgent: '*', allow: '/', disallow: '/api/' }
sitemap: `${APP_URL}/sitemap.xml`
```

- `/api/` 경로 차단 — API 엔드포인트가 검색결과에 노출되지 않도록
- 새로운 차단 경로가 필요하면 `disallow` 배열로 변경한다

### sitemap.ts (현재 설정)

```ts
// app/sitemap.ts
const routes = ['', '/examples', '/blog/hello-world']
```

**새 페이지 추가 시**: `routes` 배열에 경로를 추가한다.

**동적 라우트** (블로그 등): DB/CMS에서 slug 목록을 가져와 동적으로 생성한다:

```ts
export default async function sitemap(): MetadataRoute.Sitemap {
  const posts = await getAllPosts()
  const postEntries = posts.map((post) => ({
    url: `${APP_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [
    { url: APP_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    ...postEntries,
  ]
}
```

### 주의사항

- sitemap URL의 도메인이 `NEXT_PUBLIC_APP_URL`과 반드시 일치해야 한다
- `www` 붙은 URL과 안 붙은 URL이 섞이면 Google이 중복 페이지로 판단할 수 있다
- `lastModified`에 `new Date()`를 쓰면 빌드 시점 기준. 실제 수정일이 있으면 그 값을 사용한다

---

## Step 5: OG 이미지

### 기본 OG 이미지 (현재 설정)

`app/opengraph-image.tsx`가 사이트 전체의 기본 OG 이미지를 생성한다 (1200×630, PNG).

### 페이지별 OG 이미지 추가

해당 라우트 디렉토리에 `opengraph-image.tsx`를 추가하면 그 페이지에서만 적용된다:

```
app/
  opengraph-image.tsx          ← 사이트 기본
  blog/
    [slug]/
      opengraph-image.tsx      ← 블로그 포스트별
```

```tsx
// app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)

  return new ImageResponse(
    (
      <div style={{ /* ... */ }}>
        <h1>{post.title}</h1>
      </div>
    ),
    { ...size },
  )
}
```

### 검증

- [opengraph.xyz](https://opengraph.xyz) 또는 [metatags.io](https://metatags.io)에서 URL을 입력하여 미리보기 확인
- Facebook: [Sharing Debugger](https://developers.facebook.com/tools/debug/)
- Twitter/X: [Card Validator](https://cards-dev.twitter.com/validator)

---

## Step 6: 구조화된 데이터 (JSON-LD)

Google이 검색결과에 리치 스니펫(별점, FAQ, 빵부스러기 등)을 표시하려면 JSON-LD가 필요하다.

### 사이트 전체 스키마

`app/layout.tsx`에 Organization + WebSite 스키마를 추가한다:

```tsx
// app/layout.tsx의 <body> 안에 추가
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: APP_NAME,
          url: APP_URL,
          logo: `${APP_URL}/icon.png`,
        },
        {
          '@type': 'WebSite',
          name: APP_NAME,
          url: APP_URL,
        },
      ],
    }),
  }}
/>
```

### 페이지별 스키마 (예: 블로그)

```tsx
// app/blog/[slug]/page.tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      datePublished: post.createdAt,
      dateModified: post.updatedAt,
      author: { '@type': 'Person', name: post.author },
    }),
  }}
/>
```

### 검증

- [Google Rich Results Test](https://search.google.com/test/rich-results)에서 URL 또는 코드 스니펫을 검증한다

---

## Step 7: Google Search Console 등록

### 1. 소유권 인증

Next.js의 `metadata.verification`을 사용한다. `app/layout.tsx`의 metadata에 추가:

```ts
export const metadata: Metadata = {
  // ... 기존 설정
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}
```

```env
# .env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-token
```

이렇게 하면 `<meta name="google-site-verification" content="...">` 태그가 자동 생성된다.

### 2. 인증 후 할 일

1. **사이트맵 제출**: Search Console → 사이트맵 → `https://example.com/sitemap.xml` 입력 → 제출
2. **색인 현황 확인**: 페이지 → 색인이 생성되지 않은 페이지 확인
3. **Core Web Vitals 모니터링**: 경험 → Core Web Vitals 보고서 확인

### 3. 주기적 모니터링 항목

| 항목 | 확인 주기 | 위치 |
|------|----------|------|
| 색인 생성 현황 | 주 1회 | 페이지 > 색인 |
| 크롤링 오류 | 주 1회 | 설정 > 크롤링 통계 |
| Core Web Vitals | 월 1회 | 경험 > Core Web Vitals |
| 모바일 사용 편의성 | 배포 후 | 경험 > 모바일 사용 편의성 |
| 구조화된 데이터 오류 | 변경 후 | 개선사항 > 리치 결과 |

---

## Step 8: Lighthouse SEO 점검

### 실행 방법

**Chrome DevTools:**
1. F12 → Lighthouse 탭 → Categories에서 "SEO" 체크 → Analyze

**CLI:**
```bash
npx lighthouse https://example.com --only-categories=seo --output=html --output-path=./lighthouse-seo.html
```

### SEO 감사 항목 (8개)

| # | 항목 | 통과 조건 |
|---|------|----------|
| 1 | 색인 차단 없음 | `noindex` 메타 태그/헤더 없음 |
| 2 | HTTP 상태 코드 | 2xx 반환 |
| 3 | robots.txt 유효 | 문법 오류 없음 |
| 4 | `rel=canonical` | 유효한 절대 URL, 자기 참조 |
| 5 | `meta description` | 존재하고 비어있지 않음 |
| 6 | `<title>` | 존재하고 비어있지 않음 |
| 7 | `hreflang` | 다국어 시 올바른 형식 |
| 8 | 링크 설명 텍스트 | `<a>` 태그에 의미 있는 텍스트 ("여기" 같은 텍스트 지양) |

> Lighthouse 점수는 Google 랭킹에 **직접 영향을 주지 않는다**. 다만 실제 사용자의 Core Web Vitals (CrUX 데이터)는 랭킹 신호로 사용된다.

### Core Web Vitals 기준값

| 지표 | 좋음 | 개선 필요 | 나쁨 |
|------|------|----------|------|
| LCP (Largest Contentful Paint) | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| INP (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |

### Next.js에서 Core Web Vitals 개선 팁

- **LCP**: `<Image>` 컴포넌트에 `priority` 사용, 폰트에 `display: swap` (Next.js 기본 적용)
- **INP**: 무거운 이벤트 핸들러를 `useTransition`으로 감싸기, 서버 컴포넌트 활용
- **CLS**: 이미지/영상에 `width`/`height` 명시, 동적 콘텐츠에 skeleton placeholder 사용
