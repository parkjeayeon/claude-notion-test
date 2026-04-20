'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_NAME, COOKIE_MAX_AGE, signToken } from '@/lib/auth'

export async function loginAction(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    return { error: '서버 설정 오류가 발생했습니다' }
  }

  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return { error: '아이디 또는 비밀번호가 올바르지 않습니다' }
  }

  const token = await signToken(secret)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })

  redirect('/admin/invoices')
}
