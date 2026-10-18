import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { cleanAcademies } from './clean-academy';
import { cleanActivitiesAndCategories } from './clean-activities-categories';
import { cleanCarousel } from './clean-carousel';

const prisma = new PrismaClient();

/**
 * Master Clean Coordinator
 * Purges all academies, activities, categories, and carousel slides in safe order.
 */
export async function cleanAll(client: PrismaClient = prisma) {
  console.log('🧹 [CLEAN-ALL] Starting comprehensive database purge...\n');

  // 1. Clean Academies
  await cleanAcademies(client);
  console.log('');

  // 2. Clean Activities & Categories
  await cleanActivitiesAndCategories(client);
  console.log('');

  // 3. Clean Carousel Slides
  await cleanCarousel(client);
  console.log('');

  console.log('✅ [CLEAN-ALL] Comprehensive database purge completed.');
}

// Standalone execution support
if (require.main === module || process.argv[1]?.includes('clean-all')) {
  cleanAll()
    .catch((err) => {
      console.error('❌ [CLEAN-ALL] Clean failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
