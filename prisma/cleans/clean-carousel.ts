import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Independently purges Hero Carousel slides without touching other database tables.
 */
export async function cleanCarousel(client: PrismaClient = prisma) {
  console.log('🧹 [CLEAN-CAROUSEL] Purging all hero carousel slides...');

  const result = await client.heroSlide.deleteMany();

  console.log(`✅ [CLEAN-CAROUSEL] Deleted ${result.count} hero carousel slides.`);
  return result;
}

// Standalone execution support
if (require.main === module || process.argv[1]?.includes('clean-carousel')) {
  cleanCarousel()
    .catch((err) => {
      console.error('❌ [CLEAN-CAROUSEL] Clean failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
