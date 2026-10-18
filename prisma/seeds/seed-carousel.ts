import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_HERO_SLIDES } from '../../src/lib/hero-slides';

const prisma = new PrismaClient();

/**
 * Independently seeds or updates Hero Carousel slides without touching other database tables.
 */
export async function seedCarousel(client: PrismaClient = prisma) {
  console.log('🎠 [SEED-CAROUSEL] Starting hero carousel slides seeding...');

  let createdCount = 0;
  let updatedCount = 0;

  for (const s of DEFAULT_HERO_SLIDES) {
    const existing = await client.heroSlide.findFirst({
      where: {
        OR: [
          ...(s.id ? [{ id: s.id }] : []),
          { title: s.title },
        ],
      },
    });

    const slideData = {
      title: s.title,
      subtitle: s.subtitle,
      badge: s.badge,
      imageUrl: s.imageUrl,
      ctaText: s.ctaText ?? 'Explore Activities',
      ctaLink: s.ctaLink ?? '/activities',
      secondaryCtaText: s.secondaryCtaText ?? 'Book Free Trial',
      secondaryCtaLink: s.secondaryCtaLink ?? '/activities',
      accentGradient: s.accentGradient ?? 'from-blue-600 via-indigo-600 to-emerald-600',
      order: s.order,
      isActive: s.isActive ?? true,
      showBadge: s.showBadge ?? true,
      showTitle: s.showTitle ?? true,
      showSubtitle: s.showSubtitle ?? true,
      showPrimaryCta: s.showPrimaryCta ?? true,
      showSecondaryCta: s.showSecondaryCta ?? true,
    };

    if (existing) {
      await client.heroSlide.update({
        where: { id: existing.id },
        data: slideData,
      });
      updatedCount++;
    } else {
      await client.heroSlide.create({
        data: {
          ...(s.id ? { id: s.id } : {}),
          ...slideData,
        },
      });
      createdCount++;
    }
  }

  const total = await client.heroSlide.count();
  console.log(`✅ [SEED-CAROUSEL] Finished: ${createdCount} created, ${updatedCount} refreshed. Total active slides in DB: ${total}`);
  return { createdCount, updatedCount, total };
}

// Standalone execution support
if (require.main === module || process.argv[1]?.includes('seed-carousel')) {
  seedCarousel()
    .catch((err) => {
      console.error('❌ [SEED-CAROUSEL] Seeding failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
