import type { MetadataRoute } from 'next';
import { APP_BASE_URL } from '@/lib/seo-config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = APP_BASE_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/activities',
          '/activities/',
          '/competitions',
          '/competitions/',
          '/tournaments',
          '/tournaments/',
          '/privacy',
          '/terms',
          '/images/',
        ],
        disallow: [
          '/admin/',
          '/coach/',
          '/parent/',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
