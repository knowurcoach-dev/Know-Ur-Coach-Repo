import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedAdmin } from './seeds/seed-admin';
import { seedActivitiesAndCategories } from './seeds/seed-activities-categories';
import { seedCarousel } from './seeds/seed-carousel';
import { seedAcademies } from './seeds/seed-academy';

const prisma = new PrismaClient();

/**
 * Master Seed Coordinator
 *
 * Runs all modular seeds sequentially in safe dependency order:
 * 1. Admin & Platform Config (seed-admin.ts)
 * 2. Major Activities & Categories (seed-activities-categories.ts)
 * 3. Hero Carousel Slides (seed-carousel.ts)
 * 4. Sample Verified Coaching Academies (seed-academy.ts)
 *
 * Individual seeds can also be run independently at any time:
 * - npm run seed:admin
 * - npm run seed:categories
 * - npm run seed:carousel
 * - npm run seed:academy
 */
async function main() {
  console.log('🌱 Starting KnowUrCoach comprehensive database bootstrap...\n');

  try {
    // 1. Admin, PlatformConfig, PaymentSettings
    await seedAdmin(prisma);
    console.log('');

    // 2. Activities & Categories
    await seedActivitiesAndCategories(prisma);
    console.log('');

    // 3. Carousel Slides
    await seedCarousel(prisma);
    console.log('');

    // 4. Academies & Coaching Centres
    await seedAcademies(prisma);
    console.log('');

    console.log('✨ All seed modules executed successfully!');
    console.log('🛡️ Platform ready for use.');
  } catch (error) {
    console.error('❌ Master seed execution failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error in seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
