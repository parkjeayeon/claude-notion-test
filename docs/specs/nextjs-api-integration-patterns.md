# Next.js API 연동 패턴 비교 가이드

## 1. 개요: 세 가지 연동 방식

Next.js 프론트엔드에서 백엔드 API를 호출하는 세 가지 대표 패턴을 비교한다.

```
방식 A — 외부 API 직접 호출 (현재 패턴)
  브라우저 → axios → 외부 API 서버
  타입: 수동 정의

방식 B — Hono RPC (Next.js 내장 API)
  브라우저 → hc<AppType>() → Next.js API Route [[...route]] → Hono 앱
  타입: TypeScript typeof 자동 추론

방식 C — OpenAPI codegen (외부 API + 자동 생성)
  브라우저 → 생성된 훅/클라이언트 → 외부 API 서버
  타입: OpenAPI 스펙에서 자동 생성
```

---

## 2. 방식 B: Hono RPC 패턴

### 2-1. 구조

```
app/api/[[...route]]/route.ts  ← Hono 앱 마운트 (catch-all)
server/
  routes/posts.ts              ← API 라우트 정의
  index.ts                     ← Hono 앱 + AppType export
lib/api/client.ts              ← hc<AppType>() 타입 안전 클라이언트
```

### 2-2. 예제 코드

**server/routes/posts.ts** — 라우트 정의

```ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const posts = new Hono()
  .get('/', async (c) => {
    const posts = await db.post.findMany()
    return c.json({ posts })
  })
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        title: z.string().min(1),
        content: z.string(),
      })
    ),
    async (c) => {
      const body = c.req.valid('json')
      const post = await db.post.create({ data: body })
      return c.json({ post }, 201)
    }
  )
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const post = await db.post.findUnique({ where: { id } })
    if (!post) return c.json({ error: 'Not found' }, 404)
    return c.json({ post })
  })

export default posts
```

**server/index.ts** — Hono 앱 조합 + 타입 export

```ts
import { Hono } from 'hono'
import posts from './routes/posts'

const app = new Hono().basePath('/api').route('/posts', posts)

export type AppType = typeof app
export default app
```

**app/api/[[...route]]/route.ts** — Next.js 라우트 핸들러 마운트

```ts
import { handle } from 'hono/vercel'
import app from '@/server'

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
```

**lib/api/client.ts** — 타입 안전 클라이언트

```ts
import { hc } from 'hono/client'
import type { AppType } from '@/server'

// hc()는 타입 추론만 활용 — 실제 HTTP 요청은 fetch 기반
const client = hc<AppType>('/')

export default client
```

**사용 예시** — 컴포넌트에서 호출

```ts
import client from '@/lib/api/client'

// GET /api/posts — 자동완성 + 타입 안전
const res = await client.api.posts.$get()
const { posts } = await res.json() // posts 타입 자동 추론

// POST /api/posts — body도 타입 체크
const res = await client.api.posts.$post({
  json: { title: 'Hello', content: 'World' },
})
```

### 2-3. 핵심: 왜 Hono만 가능한가

Next.js API Route는 **Web Standard API** (`Request` → `Response`)를 사용한다. Hono는 이 표준을 네이티브로 지원하므로 `handle()` 어댑터 하나로 바로 연결된다.

| 프레임워크 | Next.js 내장 가능 | 이유 |
|-----------|:---:|------|
| **Hono** | **O** | Web Standard API(Request/Response) 기반, `hono/vercel` 어댑터 제공 |
| **Express** | **△** | req/res 객체 ≠ Web Standard. `next-connect`로 억지 연결 가능하지만 비공식 |
| **NestJS** | **X** | Express/Fastify 위의 무거운 프레임워크. DI 초기화 등 서버리스에 부적합 |
| **Django** | **X** | Python 런타임 → Node.js에서 실행 불가 |
| **Spring Boot** | **X** | JVM 런타임 → Node.js에서 실행 불가 |

> **핵심 포인트**: "Next.js 안에 API를 넣을 수 있는가"는 **런타임 호환성**(Web Standard) 문제다. Hono, Elysia 등 Web Standard 기반 프레임워크만 가능하다.

---

## 3. 방식 C: OpenAPI codegen (orval / hey-api)

### 3-1. 흐름

```
1. 백엔드: Swagger/OpenAPI 스펙 노출 (예: GET /api-json)
   → 백엔드는 이것만 하면 끝

2. 프론트: pnpm add -D orval → npx orval
   → 스펙을 읽어서 타입 + React Query 훅 자동 생성

3. 프론트에서 생성된 훅 import해서 사용
```

**orval.config.ts** 예시:

```ts
import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: 'http://localhost:4000/api-json', // OpenAPI 스펙 URL
    output: {
      target: './src/api/generated.ts',
      client: 'react-query',
      mode: 'tags-split', // 태그별 파일 분리
    },
  },
})
```

**생성된 코드 사용 예시**:

```ts
// orval이 자동 생성한 훅
import { useGetPosts, useCreatePost } from '@/api/generated'

function PostList() {
  const { data, isLoading } = useGetPosts()
  const { mutate: createPost } = useCreatePost()

  // data.posts 타입이 OpenAPI 스펙에서 자동 추론됨
}
```

### 3-2. 어떤 백엔드든 가능 (OpenAPI만 노출하면)

방식 C의 가장 큰 장점은 **백엔드 언어/프레임워크에 무관**하다는 것이다. OpenAPI(Swagger) 스펙만 제공하면 된다.

| 백엔드 | OpenAPI 노출 방법 |
|--------|-----------------|
| **NestJS** | `@nestjs/swagger` 데코레이터 → 자동 생성 |
| **Express** | `swagger-jsdoc` + `swagger-ui-express` |
| **Django REST** | DRF 내장 스키마 생성 (`generateschema`) |
| **Spring Boot** | SpringDoc (`springdoc-openapi`) → 자동 생성 |
| **FastAPI** | 내장 자동 생성 (별도 설정 불필요) |
| **Go (Gin/Echo)** | `swaggo/swag`로 주석 기반 생성 |

### 3-3. orval vs @hey-api/openapi-ts 비교

| | **orval** | **@hey-api/openapi-ts** |
|---|---|---|
| npm 주간 다운로드 | ~969k | ~977k |
| GitHub 스타 | ~5,600 | ~4,400 |
| 설계 철학 | 간단한 기본값, 빠른 시작 | 플러그인 기반, 세밀한 제어 |
| React Query 훅 | **기본 생성** | 플러그인으로 추가 |
| Mock 생성 | **내장 (MSW 지원)** | 없음 |
| Zod 검증 | 없음 | **플러그인 제공** |
| HTTP 클라이언트 | Fetch, Axios | Fetch, Axios, Ky, Next.js 전용 |
| 학습 곡선 | **낮음** | 높음 |
| 추천 상황 | React Query 훅 바로 뽑기 | 세밀한 커스터마이징, Zod 검증 필요 |

**선택 기준 요약**:
- "React Query 훅 + Mock까지 빨리" → **orval**
- "Zod 검증 + 클라이언트 세밀 제어" → **@hey-api/openapi-ts**

### 3-4. FeathersJS의 client bundle

FeathersJS는 독특한 접근법을 사용한다:

```bash
npm run bundle:client
```

서버 코드의 타입 정보를 기반으로 **직접 클라이언트 SDK를 생성**한다. OpenAPI 중간 단계 없이 타입을 공유하는 점에서 Hono RPC와 유사하지만, Next.js 내장이 아닌 별도 서버로 실행한다는 차이가 있다.

```
Hono RPC:    서버 타입 → typeof → 클라이언트 추론 (같은 프로세스)
FeathersJS:  서버 타입 → bundle:client → SDK 파일 생성 (별도 서버)
OpenAPI:     서버 스펙 → codegen → 클라이언트 파일 생성 (별도 서버)
```

---

## 4. 방식 A vs B vs C 비교

| | **방식 A** (직접 호출) | **방식 B** (Hono RPC) | **방식 C** (OpenAPI codegen) |
|---|---|---|---|
| API 서버 | 별도 실행 | Next.js 내장 | 별도 실행 |
| 타입 안전 | 수동 정의 | 자동 (typeof 추론) | 자동 (OpenAPI 스펙) |
| CORS 설정 | 필요 | **불필요** (같은 origin) | 필요 |
| 배포 | 프론트 + 백 각각 | **하나로 통합** | 프론트 + 백 각각 |
| 적합 규모 | 모든 규모 | 소~중 (풀스택) | 중~대 (팀 분리) |
| 백엔드 자유도 | 어떤 언어든 | JS/TS만 | 어떤 언어든 |
| 초기 설정 비용 | 낮음 | 중간 | 높음 (codegen 설정) |
| 타입 동기화 | 수동 유지 | **항상 동기화** | 재생성 필요 (`npx orval`) |
| DB 접근 | 외부 서버 경유 | **직접 접근 가능** | 외부 서버 경유 |

---

## 5. 외부 백엔드 프레임워크 소개

### 5-1. NestJS (TypeScript) — 추천

Module → Controller → Service 구조로, Express/Fastify 위에서 동작하는 풀 프레임워크다.

```ts
// posts.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { PostsService } from './posts.service'
import { CreatePostDto } from './dto/create-post.dto'

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  findAll() {
    return this.postsService.findAll()
  }

  @Post()
  @ApiOperation({ summary: 'Create a post' })
  create(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto)
  }
}
```

**장점**: TypeScript 네이티브, Swagger 데코레이터로 OpenAPI 자동 생성 → **방식 C(orval)와 궁합이 가장 좋다.**

---

### 5-1-A. Next.js + NestJS 실전 연동 가이드

NestJS를 백엔드로, Next.js를 프론트엔드로 조합할 때의 구체적인 구현 계획이다.

#### 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│  monorepo (pnpm workspace 또는 turborepo)                    │
│                                                             │
│  apps/                                                      │
│    web/          ← Next.js (프론트엔드)                      │
│    server/       ← NestJS  (백엔드 API)                      │
│                                                             │
│  packages/                                                  │
│    config/       ← 공유 ESLint, TS config                    │
└─────────────────────────────────────────────────────────────┘

개발 시:
  브라우저 (:3000) → Next.js dev server → axios/orval 훅 → NestJS (:4000)

프로덕션:
  브라우저 → Vercel(Next.js) → rewrites 프록시 → Railway/Fly.io(NestJS)
  또는
  브라우저 → Next.js → orval 생성 클라이언트 → NestJS (CORS 허용)
```

#### Step 1. NestJS 프로젝트 생성 + Swagger 설정

```bash
# NestJS CLI로 프로젝트 생성
pnpm add -g @nestjs/cli
nest new server --package-manager pnpm --strict

# Swagger 패키지 설치
cd server
pnpm add @nestjs/swagger
```

**main.ts** — Swagger(OpenAPI) 활성화:

```ts
import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // CORS 설정 — Next.js 개발 서버 허용
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })

  // 전역 유효성 검사 파이프
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  // Swagger 설정 → /api-docs (UI), /api-json (스펙)
  const config = new DocumentBuilder()
    .setTitle('My API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api-docs', app, document)

  await app.listen(4000)
}
bootstrap()
```

이제 `http://localhost:4000/api-json`에서 OpenAPI 스펙 JSON을 받을 수 있다.

#### Step 2. NestJS CRUD 모듈 작성 (예: Posts)

**dto/create-post.dto.ts**:

```ts
import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional } from 'class-validator'

export class CreatePostDto {
  @ApiProperty({ example: 'Hello World' })
  @IsString()
  @IsNotEmpty()
  title: string

  @ApiProperty({ example: 'Post content here...' })
  @IsString()
  @IsNotEmpty()
  content: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  thumbnail?: string
}
```

**dto/post-response.dto.ts**:

```ts
import { ApiProperty } from '@nestjs/swagger'

export class PostResponseDto {
  @ApiProperty()
  id: number

  @ApiProperty()
  title: string

  @ApiProperty()
  content: string

  @ApiProperty({ required: false })
  thumbnail?: string

  @ApiProperty()
  createdAt: Date
}
```

> **중요**: `@ApiProperty()`를 DTO에 붙여야 Swagger 스펙에 스키마가 포함된다. 이것이 orval이 타입을 생성하는 원천이다.

**posts.controller.ts**:

```ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { PostsService } from './posts.service'
import { CreatePostDto } from './dto/create-post.dto'
import { PostResponseDto } from './dto/post-response.dto'

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [PostResponseDto] })
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.postsService.findAll(page, limit)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiResponse({ status: 200, type: PostResponseDto })
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a post' })
  @ApiResponse({ status: 201, type: PostResponseDto })
  create(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({ status: 200, type: PostResponseDto })
  update(@Param('id') id: string, @Body() dto: CreatePostDto) {
    return this.postsService.update(+id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  remove(@Param('id') id: string) {
    return this.postsService.remove(+id)
  }
}
```

#### Step 3. Next.js에서 orval로 타입 안전 클라이언트 생성

```bash
# Next.js 프로젝트에서
pnpm add -D orval
pnpm add axios @tanstack/react-query
```

**orval.config.ts** (Next.js 프로젝트 루트):

```ts
import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: 'http://localhost:4000/api-json',
    output: {
      target: './src/api/generated/endpoints',
      schemas: './src/api/generated/models',
      client: 'react-query',
      mode: 'tags-split',
      httpClient: 'axios',
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },
})
```

**src/api/axios-instance.ts** — 공통 axios 인스턴스:

```ts
import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const instance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
})

// orval mutator 형식
export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const promise = instance(config).then(({ data }) => data)
  return promise
}
```

**코드 생성 실행**:

```bash
# NestJS 서버가 실행 중인 상태에서
npx orval

# 결과: src/api/generated/ 디렉토리에 파일 생성
# ├── endpoints/
# │   └── posts.ts        ← useGetPosts, useCreatePost 등 React Query 훅
# └── models/
#     ├── createPostDto.ts
#     └── postResponseDto.ts
```

**package.json**에 스크립트 추가:

```json
{
  "scripts": {
    "api:generate": "orval",
    "api:generate:watch": "orval --watch"
  }
}
```

#### Step 4. Next.js 컴포넌트에서 사용

```tsx
'use client'

import { useGetPosts, useCreatePost } from '@/api/generated/endpoints/posts'

export function PostList() {
  // GET /posts — 타입 자동 추론
  const { data, isLoading, error } = useGetPosts({ page: 1, limit: 10 })

  // POST /posts — mutation
  const { mutate: createPost, isPending } = useCreatePost()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data?.map((post) => (
        // post.id, post.title 등 자동완성 지원
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}

      <button
        disabled={isPending}
        onClick={() =>
          createPost({ data: { title: 'New Post', content: 'Hello!' } })
        }
      >
        Create Post
      </button>
    </div>
  )
}
```

#### Step 5. 개발 환경 구성

**환경변수** (`.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**개발 서버 동시 실행** (monorepo 기준):

```json
// package.json (루트)
{
  "scripts": {
    "dev": "concurrently \"pnpm --filter server dev\" \"pnpm --filter web dev\"",
    "api:generate": "pnpm --filter web api:generate"
  }
}
```

**개발 플로우**:

```
1. NestJS 서버 시작        → pnpm --filter server dev  (localhost:4000)
2. Next.js 개발 서버 시작   → pnpm --filter web dev     (localhost:3000)
3. API 변경 시 재생성       → pnpm api:generate
4. 브라우저에서 확인        → localhost:3000
```

#### Step 6. 프로덕션 배포 전략

**옵션 A: rewrites 프록시 (CORS 불필요)**

```ts
// next.config.ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL}/:path*`,
      },
    ]
  },
}
export default nextConfig
```

이 경우 `NEXT_PUBLIC_API_URL`을 `/api`로 바꾸면 브라우저 → Next.js → NestJS로 프록시된다. CORS 설정이 불필요해진다.

**옵션 B: 직접 호출 (CORS 설정)**

```ts
// NestJS main.ts
app.enableCors({
  origin: ['https://my-frontend.vercel.app'],
  credentials: true,
})
```

`NEXT_PUBLIC_API_URL`을 NestJS 배포 URL로 설정한다.

| | 옵션 A (rewrites 프록시) | 옵션 B (직접 호출) |
|---|---|---|
| CORS | 불필요 | 설정 필요 |
| 레이턴시 | +1 홉 (Next.js 경유) | 직접 연결 |
| API 키 숨김 | 가능 | 불가 (브라우저 노출) |
| 추천 | 일반적 상황 | CDN 캐싱, WebSocket 등 |

#### 전체 플로우 요약

```
[NestJS 백엔드]
  DTO + @ApiProperty → Swagger 자동 생성 → /api-json 노출
                                              ↓
                                         npx orval
                                              ↓
[Next.js 프론트엔드]
  src/api/generated/  ← 타입 + React Query 훅 자동 생성
  컴포넌트에서 import → useGetPosts() 호출 → 타입 안전 + 자동완성
```

**NestJS DTO를 수정하면**:
1. Swagger 스펙이 자동 업데이트됨
2. `npx orval` 실행 → 클라이언트 코드 재생성
3. 타입이 안 맞는 곳은 TypeScript 컴파일 에러로 즉시 확인

이것이 **방식 C (OpenAPI codegen)**의 핵심 가치다 — 백엔드 스키마 변경이 프론트엔드 타입 에러로 바로 잡힌다.

### 5-2. Express (Node.js) — 경량

```ts
import express from 'express'

const router = express.Router()

router.get('/posts', async (req, res) => {
  const posts = await db.post.findMany()
  res.json({ posts })
})

router.post('/posts', async (req, res) => {
  const post = await db.post.create({ data: req.body })
  res.status(201).json({ post })
})

export default router
```

**장점**: 미니멀, 빠른 프로토타이핑. **단점**: 구조를 직접 잡아야 하고, Swagger 설정이 수동이다.

### 5-3. Django REST Framework (Python) — 간략

```python
# views.py
from rest_framework import viewsets
from .models import Post
from .serializers import PostSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
```

**장점**: ModelSerializer로 CRUD 자동 생성, Admin 패널 내장. 데이터 분석/ML 프로젝트에서 Python 생태계를 그대로 활용할 때 적합하다.

### 5-4. Spring Boot (Java/Kotlin) — 간략

```java
@RestController
@RequestMapping("/posts")
public class PostController {
    @GetMapping
    public List<Post> findAll() {
        return postService.findAll();
    }

    @PostMapping
    public ResponseEntity<Post> create(@RequestBody CreatePostDto dto) {
        return ResponseEntity.status(201).body(postService.create(dto));
    }
}
```

**장점**: 대규모 엔터프라이즈에서 검증된 안정성. SpringDoc으로 OpenAPI 자동 생성.

---

## 6. 선택 가이드

| 시나리오 | 추천 방식 | 이유 |
|---------|----------|------|
| 풀스택 혼자 / 소규모 | **방식 B** (Hono RPC) | 배포 하나, CORS 없음, 타입 자동 |
| 프론트/백 팀 분리 (TS) | **방식 C** (NestJS + orval) | 독립 배포 + 타입 안전 유지 |
| 이미 백엔드가 있음 | **방식 A 유지** 또는 **C로 업그레이드** | OpenAPI 추가만으로 타입 안전 확보 |
| Python/Java 백엔드 | **방식 C** (OpenAPI codegen) | 언어 무관, 스펙만 있으면 됨 |
| 빠른 프로토타이핑 | **방식 B** (Hono RPC) | 설정 최소, 즉시 개발 |
| MSA / 여러 백엔드 조합 | **방식 C** + BFF 프록시 | 여러 스펙을 하나로 통합 |

---

## 7. BFF 프록시 패턴 (하이브리드)

방식 A의 단점(CORS, API 키 노출)을 해결하면서 외부 서버를 유지하는 하이브리드 방식이다.

```
브라우저 → Next.js API Route → 외부 API 서버
         (같은 origin, CORS 불필요)   (API 키는 서버에서만)
```

### 방법 1: next.config.ts rewrites (가장 간단)

```ts
// next.config.ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/external/:path*',
        destination: 'http://backend:4000/:path*',
      },
    ]
  },
}

export default nextConfig
```

브라우저에서 `/api/external/posts`를 호출하면 Next.js가 `http://backend:4000/posts`로 프록시한다. 별도 코드 없이 설정만으로 동작한다.

### 방법 2: catch-all Route Handler (세밀한 제어)

```ts
// app/api/proxy/[...slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params
  const path = slug.join('/')
  const url = new URL(request.url)

  const res = await fetch(`${BACKEND_URL}/${path}${url.search}`, {
    headers: {
      Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
```

**사용 시나리오**:
- 외부 API 키를 서버 측에 숨기고 싶을 때
- CORS 설정 없이 외부 API를 호출하고 싶을 때
- 응답을 가공하거나 캐싱 로직을 추가하고 싶을 때

---

## 8. 혼동하기 쉬운 개념 정리

| 개념 | 무엇인가 | 프론트엔드와의 관계 |
|------|---------|:---:|
| **Hono RPC** | Next.js 내장 API + typeof 기반 타입 추론 클라이언트 | 직접 사용 |
| **tRPC** | Next.js + 백엔드 타입 공유 (Hono RPC와 유사 개념) | 직접 사용 |
| **NestJS gRPC** | 마이크로서비스 간 통신 (서버 ↔ 서버) | **무관** |
| **GraphQL** | 쿼리 언어 기반 API (REST와 다른 패러다임) | 별도 학습 필요 |
| **OpenAPI** | REST API 명세 포맷 (Swagger) | codegen 입력용 |
| **Protobuf** | gRPC의 직렬화 포맷 (서버 간 통신) | **무관** |

### Hono RPC vs tRPC

둘 다 "서버 타입을 프론트에서 추론"하는 같은 목표를 가지지만 접근이 다르다:

| | Hono RPC | tRPC |
|---|---|---|
| 기반 | HTTP 프레임워크 (Hono) | RPC 프로토콜 전용 |
| API 형태 | 표준 REST 엔드포인트 | procedure (query/mutation) |
| 외부 호출 | curl, Postman으로 테스트 가능 | 전용 클라이언트 필요 |
| 생태계 | Hono 미들웨어 활용 | tRPC 전용 플러그인 |
| 러닝 커브 | REST를 알면 바로 사용 | 별도 개념 학습 필요 |
