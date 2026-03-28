'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </div>
  )
}

const contactSchema = z.object({
  name: z.string().min(2, '2글자 이상 입력해주세요'),
  email: z.string().email('올바른 이메일을 입력해주세요'),
  message: z.string().min(10, '10글자 이상 입력해주세요'),
})

type ContactForm = z.infer<typeof contactSchema>

function FormDemo() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactForm>({
    // TODO: remove cast when @hookform/resolvers fully supports zod v4
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(contactSchema as any),
  })

  const onSubmit = (data: ContactForm) => {
    toast.success('폼이 제출되었습니다', {
      description: `${data.name} (${data.email})`,
    })
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          placeholder="홍길동"
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-destructive text-sm">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          placeholder="hello@example.com"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-destructive text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">메시지</Label>
        <Textarea
          id="message"
          placeholder="메시지를 입력해주세요..."
          aria-invalid={!!errors.message}
          {...register('message')}
        />
        {errors.message && (
          <p className="text-destructive text-sm">{errors.message.message}</p>
        )}
      </div>

      <Button type="submit">제출</Button>
    </form>
  )
}

export function FormShowcase() {
  return (
    <div className="space-y-10">
      {/* Input + Label */}
      <Section title="Input + Label">
        <div className="max-w-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="demo-input">Label</Label>
            <Input id="demo-input" placeholder="Placeholder text..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-disabled">Disabled</Label>
            <Input id="demo-disabled" placeholder="Disabled" disabled />
          </div>
        </div>
      </Section>

      {/* Textarea */}
      <Section title="Textarea">
        <div className="max-w-sm space-y-2">
          <Label htmlFor="demo-textarea">Description</Label>
          <Textarea id="demo-textarea" placeholder="Write something here..." />
        </div>
      </Section>

      {/* Select */}
      <Section title="Select">
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="cherry">Cherry</SelectItem>
            <SelectItem value="grape">Grape</SelectItem>
          </SelectContent>
        </Select>
      </Section>

      {/* Checkbox */}
      <Section title="Checkbox">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms and conditions</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="newsletter" defaultChecked />
            <Label htmlFor="newsletter">Subscribe to newsletter</Label>
          </div>
        </div>
      </Section>

      {/* Switch */}
      <Section title="Switch">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Switch id="notifications" />
            <Label htmlFor="notifications">Enable notifications</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="dark-mode" size="sm" />
            <Label htmlFor="dark-mode">Small switch</Label>
          </div>
        </div>
      </Section>

      {/* Form Demo with Zod */}
      <Section title="Form (Zod + React Hook Form)">
        <FormDemo />
      </Section>
    </div>
  )
}
