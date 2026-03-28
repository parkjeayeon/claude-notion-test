import type { MetadataRoute } from 'next'

import { APP_URL } from '@/lib/config'

const routes = ['', '/examples', '/blog/hello-world']

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${APP_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))
}
