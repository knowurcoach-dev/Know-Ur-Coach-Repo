import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { KycStatus, SubscriptionPlan } from '@prisma/client';
import { readHeroCarouselTheme } from '@/lib/hero-theme-server';
import { formatBatchItem } from '@/lib/batch-helpers';
import { DEFAULT_HERO_CAROUSEL_THEME } from '@/lib/hero-theme';
import { registerDynamicTaxonomy, resolveCategoryCoverImage } from '@/lib/categories';
import { cleanStatusNotes } from '@/lib/coach-docs';
import { DEFAULT_CLASS_MODES } from '@/lib/class-modes';

function toPlainObject<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Cached Discovery Data:
 * Cached persistently in the Next.js Data Cache (.next/cache) on disk/memory
 * with background revalidation every 300 seconds (5 minutes) and instant
 * on-demand cache tag invalidation via revalidateTag('discovery').
 */
export const fetchDiscoveryData = async () => {
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

  const [centres, competitions, majorActivities, heroSlides, heroCarouselTheme, classModes] =
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
      (prisma as any).classMode?.findMany
        ? (prisma as any).classMode
            .findMany({
              where: { isActive: true },
              orderBy: { order: 'asc' },
            })
            .catch(() => DEFAULT_CLASS_MODES)
        : prisma
            .$queryRawUnsafe<any[]>(
              'SELECT * FROM "ClassMode" WHERE "isActive" = true ORDER BY "order" ASC'
            )
            .then((rows) =>
              rows && rows.length > 0
                ? rows.map((r) => ({
                    id: r.id,
                    slug: r.slug,
                    label: r.label,
                    description: r.description || null,
                    badgeColor: r.badgeColor || 'blue',
                    icon: r.icon || 'Buildings',
                    isActive: Boolean(r.isActive),
                    order: Number(r.order) || 0,
                  }))
                : DEFAULT_CLASS_MODES
            )
            .catch(() => DEFAULT_CLASS_MODES),
    ]);

  let modesById: Record<string, string> = {};
  try {
    const rawModes = await prisma.$queryRawUnsafe<Array<{ id: string; classMode?: string }>>(
      'SELECT "id", "classMode" FROM "CoachingCentre"'
    );
    for (const rm of rawModes) {
      if (rm.id && rm.classMode) {
        modesById[rm.id] = rm.classMode;
      }
    }
  } catch {}

  const mappedActivities = (majorActivities || []).map((act: any) => ({
    id: act.id,
    name: act.name,
    slug: act.slug,
    description: act.description,
    imageUrl: act.imageUrl && act.imageUrl.startsWith('data:image/') && act.imageUrl.length > 2000
      ? resolveCategoryCoverImage(act.slug, '')
      : act.imageUrl,
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
      imageUrl: d.imageUrl && d.imageUrl.startsWith('data:image/') && d.imageUrl.length > 2000
        ? resolveCategoryCoverImage(d.slug, '')
        : d.imageUrl,
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
    // Sanitize statusNotes for public discovery: strip private KYC IDs & large base64 documents
    statusNotes: cleanStatusNotes(c.statusNotes),
    classMode: modesById[c.id] || c.classMode || 'offline',
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
    classModes: (classModes && classModes.length > 0) ? classModes : DEFAULT_CLASS_MODES,
  });
};

// Global in-memory cache (0.1ms access time, eliminates DB hits on repeated queries)
let memoryDiscoveryCache: { data: any; timestamp: number } | null = null;
const academyMemoryCache = new Map<string, { data: any; timestamp: number }>();
const MEMORY_TTL_MS = 60 * 1000; // 60 seconds ultra-fast RAM cache

export function invalidateServerCache() {
  memoryDiscoveryCache = null;
  academyMemoryCache.clear();
}

const _getCachedDiscoveryData = unstable_cache(
  fetchDiscoveryData,
  ['discovery-data-cache'],
  {
    revalidate: 300, // 5 minutes
    tags: ['discovery', 'academies', 'competitions', 'class-modes'],
  }
);

export async function getCachedDiscoveryData() {
  try {
    const now = Date.now();
    if (memoryDiscoveryCache && (now - memoryDiscoveryCache.timestamp < MEMORY_TTL_MS)) {
      return memoryDiscoveryCache.data;
    }

    let data;
    if (process.env.NODE_ENV === 'development') {
      data = await fetchDiscoveryData();
    } else {
      data = await _getCachedDiscoveryData();
    }

    memoryDiscoveryCache = { data, timestamp: now };
    return data;
  } catch (err) {
    console.warn('[DB_FETCH_WARNING] Database query failed in getCachedDiscoveryData:', (err as any)?.message);
    if (memoryDiscoveryCache?.data) {
      return memoryDiscoveryCache.data;
    }
    return toPlainObject({
      centres: [],
      competitions: [],
      activities: [],
      categories: [],
      config: null,
      heroSlides: [],
      heroCarouselTheme: DEFAULT_HERO_CAROUSEL_THEME,
      classModes: DEFAULT_CLASS_MODES,
    });
  }
}

/**
 * Module-level Cached Academy By ID:
 * Defined at top level so Next.js unstable_cache correctly caches across requests.
 */
const _getCachedAcademyById = unstable_cache(
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
      if (centre) {
        try {
          const raw = await prisma.$queryRawUnsafe<Array<{ classMode?: string }>>(
            'SELECT "classMode" FROM "CoachingCentre" WHERE "id" = $1 LIMIT 1',
            centre.id
          );
          if (raw?.[0]?.classMode) {
            (centre as any).classMode = raw[0].classMode;
          }
        } catch {}
        return toPlainObject(centre);
      }
      return null;
    } catch (err) {
      console.warn(`[DB_OFFLINE] Database unreachable during cached academy lookup (${targetId}):`, (err as any)?.message);
      return null;
    }
  },
  ['academy-profile-cache'],
  {
    revalidate: 300,
    tags: ['academies'],
  }
);

export async function getCachedAcademyById(id: string) {
  const cleanId = id?.trim();
  if (!cleanId) return null;

  const now = Date.now();
  const cached = academyMemoryCache.get(cleanId);
  if (cached && (now - cached.timestamp < MEMORY_TTL_MS)) {
    return cached.data;
  }

  // Fast path: Check if this academy is already in the loaded discovery dataset in RAM
  if (memoryDiscoveryCache?.data?.centres) {
    const fromDiscovery = memoryDiscoveryCache.data.centres.find(
      (c: any) => c.id === cleanId || c.id?.toLowerCase() === cleanId.toLowerCase()
    );
    if (fromDiscovery && fromDiscovery.batches && fromDiscovery.facilities) {
      academyMemoryCache.set(cleanId, { data: fromDiscovery, timestamp: now });
      return fromDiscovery;
    }
  }

  const data = await _getCachedAcademyById(cleanId);
  if (data) {
    academyMemoryCache.set(cleanId, { data, timestamp: now });
  }
  return data;
}
