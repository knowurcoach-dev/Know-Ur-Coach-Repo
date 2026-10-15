import { NextRequest, NextResponse } from 'next/server';
import {
  LocationResult,
  getCachedLocation,
  setCachedLocation,
  searchGeocodedLocations,
  getConfiguredProvider,
  getLocationAttribution,
} from '@/lib/location';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const cacheKey = `search:${query.toLowerCase()}`;
    const attribution = getLocationAttribution();
    const { provider } = getConfiguredProvider();
    const cached = getCachedLocation<LocationResult[]>(cacheKey);

    if (cached) {
      return NextResponse.json({
        results: cached,
        source: 'cache',
        provider,
        attribution,
      });
    }

    const results = await searchGeocodedLocations(query);

    setCachedLocation(cacheKey, results);

    return NextResponse.json({
      results,
      source: 'live',
      provider,
      attribution,
    });
  } catch (err: any) {
    console.error('[Location Search API Error]', err);
    return NextResponse.json(
      { error: 'Failed to search location', results: [] },
      { status: 500 }
    );
  }
}

