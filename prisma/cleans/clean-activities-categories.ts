import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Independently purges Disciplines, Major Activities, and System Categories
 * without touching academies, carousel slides, or users.
 */
export async function cleanActivitiesAndCategories(client: PrismaClient = prisma) {
  console.log('🧹 [CLEAN-ACTIVITIES-CATEGORIES] Purging taxonomy, activities & disciplines...');

  // 1. Delete Disciplines first (FK to MajorActivity)
  const delDisciplines = await client.discipline.deleteMany();

  // 2. Delete MajorActivities
  const delMajorActivities = await client.majorActivity.deleteMany();

  // 3. Delete System Categories
  const delCategories = await client.category.deleteMany();

  console.log(`✅ [CLEAN-ACTIVITIES-CATEGORIES] Deleted:
  - ${delDisciplines.count} Disciplines
  - ${delMajorActivities.count} Major Activities
  - ${delCategories.count} System Categories`);

  return {
    disciplines: delDisciplines.count,
    majorActivities: delMajorActivities.count,
    categories: delCategories.count,
  };
}

// Standalone execution support
if (require.main === module || process.argv[1]?.includes('clean-activities-categories')) {
  cleanActivitiesAndCategories()
    .catch((err) => {
      console.error('❌ [CLEAN-ACTIVITIES-CATEGORIES] Clean failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
