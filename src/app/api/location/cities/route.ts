import { NextResponse } from 'next/server';
import { TOP_INDIAN_CITIES, AGRA_LOCALITIES } from '@/lib/location';

export async function GET() {
  return NextResponse.json({
    cities: TOP_INDIAN_CITIES,
    agraLocalities: AGRA_LOCALITIES,
  });
}
