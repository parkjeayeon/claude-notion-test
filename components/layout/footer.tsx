import { Container } from '@/components/layout/container'

export function Footer() {
  return (
    <footer className="border-t py-6">
      <Container className="text-muted-foreground flex flex-col items-center justify-between gap-2 text-sm sm:flex-row">
        <p>
          &copy; {new Date().getFullYear()} StarterKit. All rights reserved.
        </p>
        <div className="flex gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
      </Container>
    </footer>
  )
}
