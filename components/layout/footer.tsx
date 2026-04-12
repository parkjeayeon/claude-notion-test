import { Container } from '@/components/layout/container'

export function Footer() {
  return (
    <footer className="border-t py-6">
      <Container className="text-muted-foreground flex items-center justify-center text-sm">
        <p>&copy; {new Date().getFullYear()} 견적서 조회. All rights reserved.</p>
      </Container>
    </footer>
  )
}
