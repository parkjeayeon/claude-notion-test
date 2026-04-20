import Link from 'next/link'
import { LayoutDashboard, FileText } from 'lucide-react'

import { ThemeToggle } from '@/components/common/theme-toggle'
import { Button } from '@/components/ui/button'

import { logoutAction } from './actions'

const navItems = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/invoices', label: '견적서 목록', icon: FileText },
]

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-screen'>
      <aside className='bg-background flex w-56 shrink-0 flex-col border-r'>
        <div className='flex h-14 items-center border-b px-4'>
          <span className='text-sm font-semibold'>관리자</span>
        </div>
        <nav className='flex-1 space-y-1 p-3'>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className='text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors'
            >
              <Icon className='size-4 shrink-0' />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className='flex min-w-0 flex-1 flex-col'>
        <header className='flex h-14 shrink-0 items-center justify-end border-b px-6 gap-2'>
          <ThemeToggle />
          <form action={logoutAction}>
            <Button type='submit' variant='ghost' size='sm'>
              로그아웃
            </Button>
          </form>
        </header>
        <main className='flex-1 p-6'>{children}</main>
      </div>
    </div>
  )
}
