import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { AcademyJsonLd } from '@/components/seo/JsonLd';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const centre = await prisma.coachingCentre.findUnique({
      where: { id },
      select: {
        name: true,
        tagline: true,
        locality: true,
        category: true,
        rating: true,
        monthlyTuitionFee: true,
      },
    });

    if (!centre) {
      return {
        title: 'Activity Centre | KnowUrCoach',
        description: 'Discover verified kids coaching and sports academies across India on KnowUrCoach.',
      };
    }

    const title = `${centre.name} - Kids Coaching in ${centre.locality}`;
    const description = `${centre.name} in ${centre.locality}: ${centre.tagline}. Verified rating: ${Number(centre.rating).toFixed(1)}/5. Monthly fee: ₹${centre.monthlyTuitionFee}. Book a free trial now on KnowUrCoach.`;

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
  let centre = null;
  try {
    centre = await prisma.coachingCentre.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        tagline: true,
        category: true,
        locality: true,
        address: true,
        phone: true,
        rating: true,
        reviewsCount: true,
        monthlyTuitionFee: true,
      },
    });
  } catch (error) {
    // Graceful fallback if database read fails
  }

  return (
    <>
      {centre && (
        <AcademyJsonLd
          id={centre.id}
          name={centre.name}
          tagline={centre.tagline}
          category={centre.category}
          locality={centre.locality}
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
