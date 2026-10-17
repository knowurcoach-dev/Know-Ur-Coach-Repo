import { NextRequest, NextResponse } from 'next/server';
import { getLocationIQStaticMapUrl } from '@/lib/location';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lon = parseFloat(searchParams.get('lon') || '');
    const zoom = parseInt(searchParams.get('zoom') || '15', 10);
    const width = parseInt(searchParams.get('width') || '600', 10);
    const height = parseInt(searchParams.get('height') || '300', 10);
    const markerColor = searchParams.get('markerColor') || 'red';

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: 'Valid lat and lon are required' }, { status: 400 });
    }

    const mapUrl = getLocationIQStaticMapUrl({
      lat,
      lon,
      zoom,
      width,
      height,
      markerColor,
    });

    if (!mapUrl) {
      return NextResponse.json({ error: 'Static map provider not available' }, { status: 503 });
    }

    // Proxy the static map image to prevent exposing API keys directly in client img src
    const upstreamRes = await fetch(mapUrl);
    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch static map from upstream' },
        { status: upstreamRes.status }
      );
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    const buffer = await upstreamRes.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (err: any) {
    console.error('[LOCATION_ERROR] Failed to fetch static map:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
