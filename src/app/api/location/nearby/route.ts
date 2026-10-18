import { NextRequest, NextResponse } from 'next/server';
import {
  CityNeighbourhood,
  getCachedLocation,
  setCachedLocation,
  searchGeocodedLocations,
  calculateDistance,
} from '@/lib/location';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const latStr = searchParams.get('lat');
    const lonStr = searchParams.get('lon');

    if (!query && (!latStr || !lonStr)) {
      return NextResponse.json({ places: [] });
    }

    const lat = latStr ? parseFloat(latStr) : null;
    const lon = lonStr ? parseFloat(lonStr) : null;
    const hasCoords = typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon) && lat !== 0;

    const cacheKey = `nearby:${query.toLowerCase()}:${hasCoords ? `${lat!.toFixed(2)},${lon!.toFixed(2)}` : 'nocoords'}`;
    const cached = getCachedLocation<CityNeighbourhood[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ places: cached, source: 'cache' });
    }

    const rawResults = await searchGeocodedLocations(query || 'nearby');
    const places: CityNeighbourhood[] = [];
    const seenNames = new Set<string>();

    for (const item of rawResults) {
      const name = (item.locality || item.name || '').trim();
      if (!name || name.toLowerCase().includes('india')) continue;

      // Filter by distance if coordinates provided
      if (hasCoords) {
        const dist = calculateDistance(lat!, lon!, item.lat, item.lon);
        // Exclude locations farther than 25 km from the target
        if (dist > 25) continue;
      }

      const normName = name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const lower = normName.toLowerCase();
      if (seenNames.has(lower)) continue;
      seenNames.add(lower);

      const slug = lower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      places.push({
        name: normName,
        slug,
        tag: 'Nearby Hub',
        cityName: item.city || query,
      });

      if (places.length >= 8) break;
    }

    setCachedLocation(cacheKey, places);

    return NextResponse.json({
      places,
      source: 'live',
    });
  } catch (err: any) {
    console.error('[LOCATION_NEARBY_ERROR] Failed to fetch nearby places:', err);
    return NextResponse.json({ places: [] });
  }
}
