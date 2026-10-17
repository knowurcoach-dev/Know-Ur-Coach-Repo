import { NextRequest, NextResponse } from 'next/server';
import { getDrivingRoute, getLocationAttribution, getConfiguredProvider } from '@/lib/location';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const originLat = parseFloat(searchParams.get('originLat') || '');
    const originLon = parseFloat(searchParams.get('originLon') || '');
    const destLat = parseFloat(searchParams.get('destLat') || '');
    const destLon = parseFloat(searchParams.get('destLon') || '');
    const mode = (searchParams.get('mode') || 'driving') as 'driving' | 'walking' | 'cycling';

    if (isNaN(originLat) || isNaN(originLon) || isNaN(destLat) || isNaN(destLon)) {
      return NextResponse.json(
        { error: 'Invalid origin or destination coordinates' },
        { status: 400 }
      );
    }

    const route = await getDrivingRoute(
      { lat: originLat, lon: originLon },
      { lat: destLat, lon: destLon },
      mode
    );

    const { provider } = getConfiguredProvider();
    const attribution = getLocationAttribution();

    return NextResponse.json({
      success: true,
      provider,
      attribution,
      route,
    });
  } catch (err: any) {
    console.error('[LOCATION_ERROR] Failed to calculate directions:', err);
    return NextResponse.json(
      { error: 'Failed to calculate directions', details: err?.message },
      { status: 500 }
    );
  }
}
