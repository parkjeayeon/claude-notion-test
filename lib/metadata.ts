import type { Metadata } from 'next'

import { APP_NAME, APP_URL } from './config'

type MetadataConfig = {
  title: string
  description: string
  image?: string
}

// Route metadata registry (can be split into JSON or DB later)
const registry: Record<string, MetadataConfig> = {
  '/': {
    title: '홈',
    description: '노션 기반 견적서 조회 및 PDF 다운로드 서비스',
  },
}

export function getMetadata(
  path: string,
  override?: Partial<Metadata>,
): Metadata {
  const {
    openGraph: ogOverride,
    twitter: twOverride,
    ...restOverride
  } = override || {}
  const match = registry[path]
  const title = restOverride.title || match?.title
  const description =
    (restOverride.description as string) || match?.description
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
      ...(ogOverride as object),
    },
    twitter: {
      card: 'summary_large_image',
      title: title ?? undefined,
      description,
      ...(twOverride as object),
    },
    ...restOverride,
  }
}
