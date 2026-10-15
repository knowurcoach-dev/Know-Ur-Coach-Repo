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

    // Graceful fallback response
    const fallbackResult: LocationResult = {
      id: 'fallback-loc',
      displayName: 'Agra, Uttar Pradesh',
      name: 'Kamla Nagar',
      locality: 'Kamla Nagar',
      city: 'Agra',
      state: 'Uttar Pradesh',
      lat: 27.1767,
      lon: 78.0081,
    };

    return NextResponse.json({
      result: fallbackResult,
      source: 'fallback',
      provider,
      attribution,
    });
  } catch (err: any) {
    console.error('[Reverse Geocoding Error]', err);
    const attribution = getLocationAttribution();
    const { provider } = getConfiguredProvider();
    return NextResponse.json({
      result: {
        id: 'fallback-loc',
        displayName: 'Agra, Uttar Pradesh',
        name: 'Kamla Nagar',
        locality: 'Kamla Nagar',
        city: 'Agra',
        state: 'Uttar Pradesh',
        lat: 27.1767,
        lon: 78.0081,
      },
      source: 'fallback',
      provider,
      attribution,
    });
  }
}

