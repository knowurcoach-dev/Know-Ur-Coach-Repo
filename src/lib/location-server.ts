import prisma from '@/lib/prisma';
import {
  LocationConfig,
  DEFAULT_LOCATION_CONFIG,
  mergeLocationConfig,
} from './location-config';

/**
 * Server-only: Read location configuration directly from PlatformConfig in PostgreSQL.
 * Uses fallback to DEFAULT_LOCATION_CONFIG if table or column is uninitialized.
 */
export async function readLocationConfig(): Promise<LocationConfig> {
  try {
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT "locationConfig" FROM "PlatformConfig" WHERE "id" = 'default' LIMIT 1;`
    );

    if (rows && rows.length > 0 && rows[0]?.locationConfig) {
      const raw = rows[0].locationConfig;
      if (typeof raw === 'string') {
        const parsed = JSON.parse(raw);
        return mergeLocationConfig(parsed);
      } else if (typeof raw === 'object') {
        return mergeLocationConfig(raw);
      }
    }
  } catch (err) {
    console.warn('[DB] Failed to read locationConfig from PlatformConfig, using defaults:', err);
  }
  return { ...DEFAULT_LOCATION_CONFIG };
}

/**
 * Server-only: Save location configuration into PlatformConfig.
 */
export async function writeLocationConfig(config: Partial<LocationConfig>): Promise<LocationConfig> {
  const current = await readLocationConfig();
  const merged = mergeLocationConfig({ ...current, ...config });
  const jsonStr = JSON.stringify(merged);

  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PlatformConfig" ("id", "locationConfig", "updatedAt")
       VALUES ('default', $1, NOW())
       ON CONFLICT ("id") DO UPDATE SET "locationConfig" = EXCLUDED."locationConfig", "updatedAt" = NOW();`,
      jsonStr
    );
    return merged;
  } catch (err) {
    console.error('[DB] Failed to write locationConfig to PlatformConfig:', err);
    throw err;
  }
}

/**
 * Server-only: Calculate academy counts per configured city from the database
 * to power the dynamic "Most Academies Count" sorting mode.
 */
export async function getCityAcademyCounts(cities: string[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  cities.forEach((c) => (counts[c] = 0));

  try {
    const centres = await prisma.coachingCentre.findMany({
      where: {
        isSuspended: false,
        isActive: true,
      },
      select: {
        address: true,
        locality: true,
      },
    });

    for (const centre of centres) {
      const text = `${centre.locality || ''} ${centre.address || ''}`.toLowerCase();
      for (const city of cities) {
        const cityLower = city.toLowerCase();
        // Check for exact city or key tokens (e.g. "delhi" for "Delhi NCR")
        if (cityLower === 'delhi ncr') {
          if (text.includes('delhi') || text.includes('ncr') || text.includes('noida') || text.includes('gurugram') || text.includes('gurgaon')) {
            counts[city] = (counts[city] || 0) + 1;
            break;
          }
        } else if (text.includes(cityLower)) {
          counts[city] = (counts[city] || 0) + 1;
          break;
        }
      }
    }
  } catch (err) {
    console.warn('[DB] Failed to calculate city academy counts:', err);
  }

  return counts;
}
