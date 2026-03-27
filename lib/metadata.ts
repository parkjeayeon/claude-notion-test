import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'StarterKit'

type MetadataConfig = {
  title: string
  description: string
  image?: string
}

// Route metadata registry (can be split into JSON or DB later)
const registry: Record<string, MetadataConfig> = {
  '/': {
    title: 'Home',
    description: 'A modern Next.js starter kit',
  },
  '/examples': {
    title: 'Examples',
    description: 'Component showcase and usage examples',
  },
}

export function getMetadata(
  path: string,
  override?: Partial<Metadata>,
): Metadata {
  const match = registry[path]
  const title = override?.title || match?.title
  const description = (override?.description as string) || match?.description
  const canonicalUrl = `${APP_URL}${path}`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: title ?? undefined,
      description,
      url: canonicalUrl,
      siteName: APP_NAME,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title ?? undefined,
      description,
    },
    ...override,
  }
}
