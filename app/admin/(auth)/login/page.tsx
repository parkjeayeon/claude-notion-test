'use client'

import { useActionState } from 'react'
import { loginAction } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, null)

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle>관리자 로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='username'>아이디</Label>
              <Input id='username' name='username' autoComplete='username' required />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>비밀번호</Label>
              <Input
                id='password'
                name='password'
                type='password'
                autoComplete='current-password'
                required
              />
            </div>
            {state?.error && <p className='text-destructive text-sm'>{state.error}</p>}
            <Button type='submit' disabled={isPending} className='w-full'>
              {isPending ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
