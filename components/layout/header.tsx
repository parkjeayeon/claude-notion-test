import Link from 'next/link'

import { Logo } from '@/components/common/logo'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { Container } from '@/components/layout/container'
import { MobileNav } from '@/components/layout/mobile-nav'

export type NavItem = { label: string; href: string }

const navItems: NavItem[] = []

function NavLink({ item }: { item: NavItem }) {
  const className =
    'text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors'

  if (item.href.startsWith('/')) {
    return (
      <Link href={item.href} className={className}>
        {item.label}
      </Link>
    )
  }

  return (
    <a href={item.href} className={className}>
      {item.label}
    </a>
  )
}

export function Header() {
  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <Container className="flex h-14 max-w-3xl items-center justify-between">
        <Logo />
        <div className="flex items-center gap-1">
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
          <ThemeToggle />
          <MobileNav navItems={navItems} />
        </div>
      </Container>
    </header>
  )
}
