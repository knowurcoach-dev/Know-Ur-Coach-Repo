import React from 'react';
import type { Metadata } from 'next';
import { getCachedAcademyById } from '@/lib/cached-queries';
import { AcademyJsonLd } from '@/components/seo/JsonLd';

import { extractCleanLocalityName } from '@/lib/categories';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const centre = await getCachedAcademyById(id);

    if (!centre) {
      return {
        title: 'Activity Centre | KnowUrCoach',
        description: 'Discover verified kids coaching and sports academies across India on KnowUrCoach.',
      };
    }

    const cleanLoc = extractCleanLocalityName(centre.locality, null, 'Agra');
    const city = (centre as any).city || 'Agra';
    const cleanTag = centre.tagline ? centre.tagline.replace(/kamla nagarkamla nagar/gi, 'Kamla Nagar') : '';
    const title = `${centre.name} - Kids Coaching in ${cleanLoc}, ${city}`;
    const feeDesc = Number(centre.monthlyTuitionFee) > 0 ? `Monthly fee: ₹${centre.monthlyTuitionFee}.` : 'Tuition: Fee on Inquiry.';
    const description = `${centre.name} in ${cleanLoc}, ${city}: ${cleanTag}. Verified rating: ${Number(centre.rating).toFixed(1)}/5. ${feeDesc} Book a free trial now on KnowUrCoach.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/activities/${id}`,
      },
      keywords: [
        centre.name,
        `${centre.name} ${centre.locality}`,
        `${centre.locality} kids coaching`,
        'find your coach',
        'find your coach india',
        'knowurcoach',
        `${centre.category} coaching for kids`,
        'free trial coaching class',
      ],
      openGraph: {
        title: `${title} | KnowUrCoach`,
        description,
        url: `/activities/${id}`,
      },
    };
  } catch (error) {
    return {
      title: 'Kids Coaching Centre | KnowUrCoach',
      description: 'Discover verified kids coaching and sports academies across India on KnowUrCoach.',
    };
  }
}

export default async function ActivityDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let centre: any = null;
  try {
    centre = await getCachedAcademyById(id);
  } catch (error) {
    // Graceful fallback if cached read fails
  }

  return (
    <>
      {centre && (
        <AcademyJsonLd
          id={centre.id}
          name={centre.name}
          tagline={centre.tagline}
          category={centre.category}
          locality={extractCleanLocalityName(centre.locality, centre.address, 'Agra')}
          address={centre.address}
          phone={centre.phone}
          rating={Number(centre.rating)}
          reviewsCount={centre.reviewsCount}
          monthlyTuitionFee={Number(centre.monthlyTuitionFee)}
        />
      )}
      {children}
    </>
  );
}
