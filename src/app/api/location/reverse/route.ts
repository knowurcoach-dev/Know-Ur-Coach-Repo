import { NextRequest, NextResponse } from 'next/server';
import {
  LocationResult,
  getCachedLocation,
  setCachedLocation,
  reverseGeocodeLocation,
  getConfiguredProvider,
  getLocationAttribution,
} from '@/lib/location';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lonStr = searchParams.get('lon');

    if (!latStr || !lonStr) {
      return NextResponse.json(
        { error: 'Latitude and longitude parameters are required' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const attribution = getLocationAttribution();
    const { provider } = getConfiguredProvider();

    // Cache key rounded to ~100 meters
    const cacheKey = `reverse:${lat.toFixed(3)},${lon.toFixed(3)}`;
    const cached = getCachedLocation<LocationResult>(cacheKey);
    if (cached) {
      return NextResponse.json({
        result: cached,
        source: 'cache',
        provider,
        attribution,
      });
    }

    const result = await reverseGeocodeLocation(lat, lon);

    if (result) {
      setCachedLocation(cacheKey, result);
      return NextResponse.json({
        result,
        source: 'live',
        provider,
        attribution,
      });
    }

    return NextResponse.json(
      { error: 'Could not resolve location for given coordinates' },
      { status: 404 }
    );
  } catch (err: any) {
    console.error('[LOCATION_ERROR] Reverse geocoding failed:', err);
    return NextResponse.json(
      { error: 'Failed to reverse geocode location' },
      { status: 500 }
    );
  }
}

