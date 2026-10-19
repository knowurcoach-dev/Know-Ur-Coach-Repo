import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { APP_BASE_URL } from '@/lib/seo-config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_BASE_URL;
  const now = new Date();

  // Core static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/activities`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/competitions`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  try {
    // Dynamic Academy / Activity detail pages
    const centres = await prisma.coachingCentre.findMany({
      select: {
        id: true,
      },
    });

    const centreRoutes: MetadataRoute.Sitemap = centres.map((centre) => ({
      url: `${baseUrl}/activities/${centre.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Dynamic Competition / Tournament detail pages
    const competitions = await prisma.competition.findMany({
      select: {
        id: true,
      },
    });

    const competitionRoutes: MetadataRoute.Sitemap = competitions.map((comp) => ({
      url: `${baseUrl}/competitions/${comp.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...centreRoutes, ...competitionRoutes];
  } catch (error) {
    console.error('Failed to generate dynamic sitemap routes:', error);
    return staticRoutes;
  }
}
