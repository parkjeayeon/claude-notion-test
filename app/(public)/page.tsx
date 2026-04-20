import { ArrowRight, FileText, Link2, Download } from 'lucide-react'
import Link from 'next/link'

import { Container } from '@/components/layout/container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// 안내 카드 데이터
const HOW_TO_STEPS = [
  {
    step: '01',
    icon: Link2,
    title: '링크 수신',
    description: '발행자로부터 고유한 견적서 링크를 전달받으세요. 이메일, 메시지 등 어떤 방식으로도 수신할 수 있습니다.',
  },
  {
    step: '02',
    icon: FileText,
    title: '견적서 확인',
    description: '링크에 접속하면 항목별 금액, 합계, 발행자 정보 등 견적서 전체 내용을 확인할 수 있습니다.',
  },
  {
    step: '03',
    icon: Download,
    title: 'PDF 저장',
    description: '확인이 완료되면 PDF로 저장하거나 인쇄할 수 있습니다. 별도 로그인 없이 바로 사용 가능합니다.',
  },
]

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero 섹션 */}
      <section className="flex flex-col items-center justify-center py-24 md:py-32">
        <Container className="flex max-w-3xl flex-col items-center text-center">
          <Badge variant="secondary" className="mb-5">
            노션 기반 견적서 시스템
          </Badge>
          <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
            견적서 조회
          </h1>
          <p className="text-muted-foreground mt-5 max-w-md text-lg leading-relaxed">
            발행자로부터 전달받은 고유 링크로 견적서를 확인하고 PDF로 저장하세요.
          </p>
          {/* CTA 버튼 */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/invoice">
                견적서 목록 보기
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#how">
                사용 방법 알아보기 ↓
              </a>
            </Button>
          </div>
        </Container>
      </section>

      {/* 사용 방법 섹션 */}
      <section id="how" className="border-t border-border py-20">
        <Container className="max-w-3xl">
          {/* 섹션 헤더 */}
          <div className="mb-12 text-center">
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              사용 방법
            </h2>
            <p className="text-muted-foreground mt-3 text-base">
              3단계로 간편하게 견적서를 확인하세요.
            </p>
          </div>

          {/* 안내 카드 3열 그리드 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {HOW_TO_STEPS.map(({ step, icon: Icon, title, description }) => (
              <Card
                key={step}
                className="rounded-lg border border-border bg-card shadow-none ring-0"
              >
                <CardHeader className="pb-3">
                  {/* 스텝 번호 + 아이콘 */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                      {step}
                    </span>
                    <div className="bg-muted/40 flex size-8 items-center justify-center rounded-md">
                      <Icon className="text-muted-foreground size-4" />
                    </div>
                  </div>
                  <CardTitle className="text-foreground text-base font-semibold">
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* URL 패턴 안내 */}
          <div className="mt-8 flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-5 py-4">
            <FileText className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm">
              견적서 URL 형식:
            </span>
            <code className="text-foreground rounded bg-card px-2 py-0.5 text-sm font-mono">
              /invoice/[견적서 ID]
            </code>
          </div>
        </Container>
      </section>
    </div>
  )
}
