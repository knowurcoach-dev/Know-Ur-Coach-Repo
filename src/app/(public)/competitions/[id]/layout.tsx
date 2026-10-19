import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { CompetitionJsonLd } from '@/components/seo/JsonLd';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const comp = await prisma.competition.findUnique({
      where: { id },
      select: {
        title: true,
        sport: true,
        category: true,
        venue: true,
        locality: true,
        dates: true,
        registrationFee: true,
        prizePool: true,
      },
    });

    if (!comp) {
      return {
        title: 'Tournament Not Found | KnowUrCoach',
        description: 'Youth sports tournaments and competitions across India.',
      };
    }

    const title = `${comp.title} - ${comp.sport} Tournament`;
    const description = `Register for ${comp.title} at ${comp.venue}, ${comp.locality}. Dates: ${comp.dates}. Entry fee: ₹${comp.registrationFee}. Prize pool: ${comp.prizePool}. Join on KnowUrCoach.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/competitions/${id}`,
      },
      keywords: [
        comp.title,
        `${comp.sport} tournament`,
        `${comp.locality} sports championship`,
        'youth sports tournament',
        'find your coach',
        'find your coach india',
        'knowurcoach competitions',
        'sports tournament registration india',
      ],
      openGraph: {
        title: `${title} | KnowUrCoach`,
        description,
        url: `/competitions/${id}`,
      },
    };
  } catch (error) {
    return {
      title: 'Sports Competition | KnowUrCoach',
      description: 'Youth sports tournaments and competitions across India.',
    };
  }
}

export default async function CompetitionDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let comp = null;
  try {
    comp = await prisma.competition.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        sport: true,
        category: true,
        venue: true,
        dates: true,
        registrationFee: true,
      },
    });
  } catch (error) {
    // Graceful fallback
  }

  return (
    <>
      {comp && (
        <CompetitionJsonLd
          id={comp.id}
          title={comp.title}
          description={`${comp.title} - ${comp.sport} tournament`}
          category={comp.category}
          location={comp.venue}
          entryFee={Number(comp.registrationFee)}
        />
      )}
      {children}
    </>
  );
}
