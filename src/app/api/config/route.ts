import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 300;

export async function GET() {
  try {
    const config = await prisma.platformConfig.findUnique({
      where: { id: 'default' },
      select: {
        themeColor: true,
        bgColor: true,
        siteName: true,
        tagline: true,
      },
    });

    return NextResponse.json({
      success: true,
      themeColor: config?.themeColor || 'emerald',
      bgColor: config?.bgColor || 'slate',
      siteName: config?.siteName || 'KnowUrCoach',
      tagline: config?.tagline || 'Hyperlocal Sports & Academy Discovery across India',
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.warn("[DB_WARNING] Database unreachable for platform config, serving defaults:", (err as any)?.message);
    return NextResponse.json(
      {
        success: true,
        themeColor: 'emerald',
        bgColor: 'slate',
        siteName: 'KnowUrCoach',
        tagline: 'Hyperlocal Sports & Academy Discovery across India',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  }
}
