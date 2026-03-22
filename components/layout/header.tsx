import { Logo } from '@/components/common/logo'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { Container } from '@/components/layout/container'
import { MobileNav } from '@/components/layout/mobile-nav'

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Examples', href: '/examples' },
  { label: 'Docs', href: '#docs' },
]

export function Header() {
  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <Container className="flex h-14 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-1">
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <ThemeToggle />
          <MobileNav navItems={navItems} />
        </div>
      </Container>
    </header>
  )
}
