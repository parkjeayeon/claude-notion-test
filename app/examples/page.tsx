import { Container } from '@/components/layout/container'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getMetadata } from '@/lib/metadata'

import { FeedbackShowcase } from './feedback-showcase'
import { FormShowcase } from './form-showcase'
import { UiShowcase } from './ui-showcase'

export const metadata = getMetadata('/examples')

export default function ExamplesPage() {
  return (
    <Container className="py-10">
      <div className="space-y-2 pb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Component Examples
        </h1>
        <p className="text-muted-foreground">
          StarterKit에 포함된 UI 컴포넌트를 한눈에 확인할 수 있는 쇼케이스
          페이지입니다.
        </p>
      </div>

      <Tabs defaultValue="ui">
        <TabsList variant="line">
          <TabsTrigger value="ui">UI 기본</TabsTrigger>
          <TabsTrigger value="form">폼</TabsTrigger>
          <TabsTrigger value="feedback">피드백 / 데이터</TabsTrigger>
        </TabsList>
        <TabsContent value="ui" className="pt-6">
          <UiShowcase />
        </TabsContent>
        <TabsContent value="form" className="pt-6">
          <FormShowcase />
        </TabsContent>
        <TabsContent value="feedback" className="pt-6">
          <FeedbackShowcase />
        </TabsContent>
      </Tabs>
    </Container>
  )
}
