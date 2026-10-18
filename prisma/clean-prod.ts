import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { cleanAcademies } from './cleans/clean-academy';
import { cleanActivitiesAndCategories } from './cleans/clean-activities-categories';
import { cleanCarousel } from './cleans/clean-carousel';
import { seedAdmin } from './seeds/seed-admin';

const prisma = new PrismaClient();

/**
 * Clean Production Database Reset
 *
 * Purges all mock academies, activities, categories, and carousel slides,
 * while ensuring the platform administrator and platform config are verified.
 *
 * For targeted, individual cleanups, run:
 * - npm run clean:academy
 * - npm run clean:categories
 * - npm run clean:carousel
 * - npm run clean:all
 */
async function main() {
  console.log('🧹 Purging all data from KnowUrCoach database for clean production state...\n');

  // 1. Purge academies, batches, facilities, reviews, leads, bookings, attendances
  await cleanAcademies(prisma);
  console.log('');

  // 2. Purge taxonomy, activities & disciplines
  await cleanActivitiesAndCategories(prisma);
  console.log('');

  // 3. Purge carousel slides
  await cleanCarousel(prisma);
  console.log('');

  // 4. Ensure Platform Admin & Settings exist from .env
  await seedAdmin(prisma);
  console.log('');

  console.log('✨ Database clean complete!');
  console.log('✅ Clean production state: 0 mock academies | 0 mock categories | 0 mock slides');
  console.log('✅ Administrator account verified and ready.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during clean-prod:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
