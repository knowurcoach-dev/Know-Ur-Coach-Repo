import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  readLocationConfig,
  writeLocationConfig,
  getCityAcademyCounts,
} from '@/lib/location-server';
import { DEFAULT_LOCATION_CONFIG } from '@/lib/location-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await readLocationConfig();
    const cityNames = config.cities.map((c) => c.city);
    const academyCounts = await getCityAcademyCounts(cityNames);

    return NextResponse.json({
      success: true,
      config,
      academyCounts,
    });
  } catch (err: any) {
    console.error('API /api/location/config GET error:', err);
    return NextResponse.json({
      success: false,
      config: DEFAULT_LOCATION_CONFIG,
      academyCounts: {},
      error: err?.message || 'Failed to fetch location config',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin role required.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const updated = await writeLocationConfig(body);
    const cityNames = updated.cities.map((c) => c.city);
    const academyCounts = await getCityAcademyCounts(cityNames);

    return NextResponse.json({
      success: true,
      message: 'Location configuration saved successfully',
      config: updated,
      academyCounts,
    });
  } catch (err: any) {
    console.error('API /api/location/config POST error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to save location config' },
      { status: 500 }
    );
  }
}
