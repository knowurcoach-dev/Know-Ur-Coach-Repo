import prisma from '@/lib/prisma';
import { HeroCarouselTheme, DEFAULT_HERO_CAROUSEL_THEME } from './hero-theme';

let isColumnEnsured = false;

/**
 * Ensure the heroCarouselTheme column exists on PlatformConfig table in PostgreSQL
 */
async function ensureColumnExists(): Promise<void> {
  if (isColumnEnsured) return;
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "heroCarouselTheme" TEXT;'
    );
    isColumnEnsured = true;
  } catch (err) {
    // Non-fatal if user permissions don't allow ALTER or column already exists
    console.warn('[DB] Notice while checking heroCarouselTheme column:', err);
  }
}

/**
 * Server-only: Read the current Hero Carousel Theme directly from the database (PlatformConfig)
 */
export async function readHeroCarouselTheme(): Promise<HeroCarouselTheme> {
  try {
    await ensureColumnExists();

    const result = (await prisma.$queryRawUnsafe(
      'SELECT "heroCarouselTheme" FROM "PlatformConfig" WHERE id = \'default\' LIMIT 1;'
    )) as Array<Record<string, unknown>> | null | undefined;

    if (result && Array.isArray(result) && result.length > 0) {
      const row = result[0] as Record<string, unknown>;
      const rawJson = row.heroCarouselTheme ?? row.herocarouseltheme;

      if (rawJson) {
        if (typeof rawJson === 'object') {
          return { ...DEFAULT_HERO_CAROUSEL_THEME, ...(rawJson as Partial<HeroCarouselTheme>) };
        }
        if (typeof rawJson === 'string') {
          const parsed = JSON.parse(rawJson);
          return { ...DEFAULT_HERO_CAROUSEL_THEME, ...parsed };
        }
      }
    }
  } catch (err) {
    console.warn('[DB] Failed to read heroCarouselTheme from PlatformConfig table, using defaults:', err);
  }
  return { ...DEFAULT_HERO_CAROUSEL_THEME };
}

/**
 * Server-only: Save the Hero Carousel Theme directly into the database (PlatformConfig table)
 */
export async function writeHeroCarouselTheme(theme: Partial<HeroCarouselTheme>): Promise<HeroCarouselTheme> {
  const current = await readHeroCarouselTheme();
  const merged: HeroCarouselTheme = {
    ...current,
    ...theme,
  };

  try {
    await ensureColumnExists();
    const jsonString = JSON.stringify(merged);

    // Update existing default config
    const updatedCount = (await prisma.$executeRawUnsafe(
      'UPDATE "PlatformConfig" SET "heroCarouselTheme" = $1, "updatedAt" = NOW() WHERE id = \'default\';',
      jsonString
    )) as number;

    // If default config record doesn't exist yet, insert it
    if (updatedCount === 0) {
      await prisma.$executeRawUnsafe(
        'INSERT INTO "PlatformConfig" (id, "heroCarouselTheme", "updatedAt") VALUES (\'default\', $1, NOW()) ON CONFLICT (id) DO UPDATE SET "heroCarouselTheme" = $1, "updatedAt" = NOW();',
        jsonString
      );
    }

    return merged;
  } catch (err) {
    console.error('[DB] Failed to write heroCarouselTheme to PlatformConfig in database:', err);
    throw err;
  }
}
