import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { KycStatus, SubscriptionPlan } from '@prisma/client';
import { APP_BASE_URL } from '@/lib/seo-config';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Refresh dynamic sitemap hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_BASE_URL;
  const now = new Date();

  // Core static and discovery hub pages
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
      url: `${baseUrl}/activities/explore`,
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
    // Top-level pillar category pages
    {
      url: `${baseUrl}/activities?category=sports`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/activities?category=brain-booster`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/activities?category=arts`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/activities?category=martial-arts`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
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
    // 1. Dynamic Categories & Disciplines from Database
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
    });

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${baseUrl}/activities?activity=${encodeURIComponent(cat.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // 2. Dynamic Academy / Activity detail pages (strictly KYC verified and active)
    const centres = await prisma.coachingCentre.findMany({
      where: {
        isSuspended: false,
        isActive: true,
        kycStatus: KycStatus.APPROVED,
        OR: [
          {
            planTier: { in: [SubscriptionPlan.STANDARD, SubscriptionPlan.PREMIUM] },
            OR: [
              { planExpiresAt: null },
              { planExpiresAt: { gt: now } },
            ],
          },
          {
            planTier: SubscriptionPlan.FREE,
            planExpiresAt: { gt: now },
          },
        ],
      },
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

    // 3. Dynamic Competition / Tournament detail pages
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

    return [
      ...staticRoutes,
      ...categoryRoutes,
      ...centreRoutes,
      ...competitionRoutes,
    ];
  } catch (error) {
    console.error('Failed to generate dynamic sitemap routes:', error);
    return staticRoutes;
  }
}
