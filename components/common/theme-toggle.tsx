'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="size-4 scale-100 transition-transform dark:scale-0" aria-hidden />
      <Moon className="absolute size-4 scale-0 transition-transform dark:scale-100" aria-hidden />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
