import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { KycStatus, SubscriptionPlan } from '@prisma/client';
import { readHeroCarouselTheme } from '@/lib/hero-theme-server';
import { formatBatchItem } from '@/lib/batch-helpers';
import { DEFAULT_HERO_CAROUSEL_THEME } from '@/lib/hero-theme';
import { registerDynamicTaxonomy } from '@/lib/categories';

function toPlainObject<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Cached Discovery Data:
 * Cached persistently in the Next.js Data Cache (.next/cache) on disk/memory
 * with background revalidation every 300 seconds (5 minutes) and instant
 * on-demand cache tag invalidation via revalidateTag('discovery').
 */
const fetchDiscoveryData = async () => {
  const now = new Date();
  const config = await prisma.platformConfig.findUnique({
    where: { id: 'default' },
  });

  const allowFreeListing = config?.allowFreeTierPublicListing ?? true;

  const validSubscriptionOrTrialFilter = [
    // Paid tiers: active if unexpired or if set to lifetime (planExpiresAt: null)
    {
      planTier: { in: [SubscriptionPlan.STANDARD, SubscriptionPlan.PREMIUM] },
      OR: [
        { planExpiresAt: null },
        { planExpiresAt: { gt: now } },
      ],
    },
    // Free tier: only eligible if platform allows free listing AND trial is actively unexpired
    ...(allowFreeListing
      ? [
          {
            planTier: SubscriptionPlan.FREE,
            planExpiresAt: { gt: now },
          },
        ]
      : []),
  ];

  const [centres, competitions, majorActivities, heroSlides, heroCarouselTheme] =
    await Promise.all([
      prisma.coachingCentre.findMany({
        where: {
          isSuspended: false,
          isActive: true,
          kycStatus: KycStatus.APPROVED,
          OR: validSubscriptionOrTrialFilter,
        },
        include: {
          facilities: true,
          batches: true,
          owner: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
        orderBy: [
          { isTopInArea: 'desc' },
          { isVerifiedBatch: 'desc' },
          { planTier: 'desc' },
          { rating: 'desc' },
        ],
      }),
      prisma.competition.findMany({
        orderBy: { registrationFee: 'asc' },
      }),
      prisma.majorActivity.findMany({
        where: { isActive: true },
        include: {
          disciplines: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      }),
      prisma.heroSlide.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      readHeroCarouselTheme(),
    ]);

  const mappedActivities = (majorActivities || []).map((act: any) => ({
    id: act.id,
    name: act.name,
    slug: act.slug,
    description: act.description,
    imageUrl: act.imageUrl,
    icon: act.icon,
    accentColor: act.accentColor,
    order: act.order,
    isActive: act.isActive,
    categories: (act.disciplines || []).map((d: any) => ({
      id: d.id,
      activityId: d.activityId,
      name: d.name,
      slug: d.slug,
      shortDesc: d.shortDesc,
      imageUrl: d.imageUrl,
      icon: d.icon,
      badge: d.badge,
      order: d.order,
      isActive: d.isActive,
    })),
  }));

  registerDynamicTaxonomy(mappedActivities);

  const allCategories = mappedActivities.flatMap((act) => act.categories);

  const mappedCentres = (centres || []).map((c: any) => ({
    ...c,
    batches: (c.batches || []).map((b: any) => formatBatchItem(b, c.category)),
  }));

  return toPlainObject({
    centres: mappedCentres,
    competitions: competitions || [],
    activities: mappedActivities,
    categories: allCategories,
    config,
    heroSlides: heroSlides || [],
    heroCarouselTheme: heroCarouselTheme || DEFAULT_HERO_CAROUSEL_THEME,
  });
};

const _getCachedDiscoveryData = unstable_cache(
  fetchDiscoveryData,
  ['discovery-data-cache'],
  {
    revalidate: 300, // 5 minutes
    tags: ['discovery', 'academies', 'competitions'],
  }
);

export async function getCachedDiscoveryData() {
  try {
    if (process.env.NODE_ENV === 'development') {
      return await fetchDiscoveryData();
    }
    return await _getCachedDiscoveryData();
  } catch (err) {
    console.warn('[DB_FETCH_WARNING] Database query failed in getCachedDiscoveryData:', (err as any)?.message);
    return toPlainObject({
      centres: [],
      competitions: [],
      activities: [],
      categories: [],
      config: null,
      heroSlides: [],
      heroCarouselTheme: DEFAULT_HERO_CAROUSEL_THEME,
    });
  }
}

/**
 * Cached Academy By ID:
 * Cached per academy with background revalidation and tag invalidation via
 * revalidateTag('academies') and revalidateTag(`academy-${id}`).
 */
export async function getCachedAcademyById(id: string) {
  const cleanId = id?.trim();
  if (!cleanId) return null;

  const fetcher = unstable_cache(
    async (targetId: string) => {
      try {
        const centre = await prisma.coachingCentre.findFirst({
          where: {
            OR: [
              { id: targetId },
              { id: { equals: targetId, mode: 'insensitive' } },
            ],
          },
          include: {
            batches: true,
            facilities: true,
            reviews: {
              orderBy: { createdAt: 'desc' },
            },
            owner: {
              select: {
                id: true,
                phone: true,
              },
            },
          },
        });
        return centre ? toPlainObject(centre) : null;
      } catch (err) {
        console.warn(`[DB_OFFLINE] Database unreachable during cached academy lookup (${targetId}):`, (err as any)?.message);
        return null;
      }
    },
    [`academy-profile-${cleanId}`],
    {
      revalidate: 300,
      tags: ['academies', `academy-${cleanId}`],
    }
  );

  return fetcher(cleanId);
}
