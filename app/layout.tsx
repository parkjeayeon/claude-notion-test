import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'

import { Toaster } from '@/components/ui/sonner'
import { APP_NAME, APP_URL } from '@/lib/config'
import { cn } from '@/lib/utils'

import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})


export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: 'A modern Next.js starter kit with everything you need',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: APP_NAME,
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={cn(
        'h-full antialiased',
        inter.variable,
        geistMono.variable,
        'font-sans',
      )}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
