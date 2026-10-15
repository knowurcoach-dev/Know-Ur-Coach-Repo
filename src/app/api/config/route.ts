import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const config = await prisma.platformConfig.findUnique({
      where: { id: 'default' },
    });

    return NextResponse.json({
      success: true,
      themeColor: config?.themeColor || 'emerald',
      bgColor: config?.bgColor || 'slate',
      siteName: config?.siteName || 'KnowUrCoach',
      tagline: config?.tagline || 'Hyperlocal Sports & Academy Discovery across India',
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.warn("API /api/config fallback:", err);
    return NextResponse.json({
      success: false,
      themeColor: 'emerald',
      bgColor: 'slate',
      siteName: 'KnowUrCoach',
      tagline: 'Hyperlocal Sports & Academy Discovery across India',
    });
  }
}
