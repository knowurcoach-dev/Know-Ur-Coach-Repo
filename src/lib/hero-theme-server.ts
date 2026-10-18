import prisma from '@/lib/prisma';
import { HeroCarouselTheme, DEFAULT_HERO_CAROUSEL_THEME } from './hero-theme';

/**
 * Server-only: Read the current Hero Carousel Theme directly from the database (PlatformConfig).
 * Uses standard Prisma queries without runtime DDL (ALTER TABLE) table-locking.
 */
export async function readHeroCarouselTheme(): Promise<HeroCarouselTheme> {
  try {
    const config = await prisma.platformConfig.findUnique({
      where: { id: 'default' },
      select: { heroCarouselTheme: true },
    });

    if (config?.heroCarouselTheme) {
      if (typeof config.heroCarouselTheme === 'string') {
        const parsed = JSON.parse(config.heroCarouselTheme);
        return { ...DEFAULT_HERO_CAROUSEL_THEME, ...parsed };
      }
    }
  } catch (err) {
    console.warn('[DB] Failed to read heroCarouselTheme from PlatformConfig table, using defaults:', err);
  }
  return { ...DEFAULT_HERO_CAROUSEL_THEME };
}

/**
 * Server-only: Save the Hero Carousel Theme directly into the database (PlatformConfig table).
 */
export async function writeHeroCarouselTheme(theme: Partial<HeroCarouselTheme>): Promise<HeroCarouselTheme> {
  const current = await readHeroCarouselTheme();
  const merged: HeroCarouselTheme = {
    ...current,
    ...theme,
  };

  try {
    const jsonString = JSON.stringify(merged);

    await prisma.platformConfig.upsert({
      where: { id: 'default' },
      update: { heroCarouselTheme: jsonString },
      create: {
        id: 'default',
        heroCarouselTheme: jsonString,
      },
    });

    return merged;
  } catch (err) {
    console.error('[DB] Failed to write heroCarouselTheme to PlatformConfig in database:', err);
    throw err;
  }
}

