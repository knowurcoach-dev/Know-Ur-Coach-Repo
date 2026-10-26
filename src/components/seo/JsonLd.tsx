import React from 'react';

export function GlobalJsonLd() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://knowurcoach.in').replace(/\/$/, '');

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'KnowUrCoach',
    alternateName: [
      'Know Ur Coach',
      'KnowYourCoach',
      'Know-Ur-Coach',
      'Find Your Coach',
      'KnowUrCoach India',
    ],
    url: baseUrl,
    description:
      "India's premier discovery and verified booking platform for kids coaching, sports academies, STEM, arts and extracurricular classes across India.",
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/activities?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'KnowUrCoach',
    alternateName: 'Know Ur Coach',
    url: baseUrl,
    logo: `${baseUrl}/images/brand/logo-full.png`,
    image: `${baseUrl}/images/brand/logo-full.png`,
    description:
      'KnowUrCoach connects parents across India with top-rated, safety-audited kids coaching centres, sports academies, and skill development tutors.',
    telephone: '+919762577714',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+919762577714',
      contactType: 'customer support',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
    sameAs: [
      'https://www.facebook.com/knowurcoach',
      'https://www.instagram.com/knowurcoach',
      'https://twitter.com/knowurcoach',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  );
}

export function AcademyJsonLd({
  id,
  name,
  tagline,
  category,
  locality,
  address,
  phone,
  rating = 5.0,
  reviewsCount = 1,
  monthlyTuitionFee,
  imageUrl,
}: {
  id: string;
  name: string;
  tagline: string;
  category: string;
  locality: string;
  address: string;
  phone?: string;
  rating?: number;
  reviewsCount?: number;
  monthlyTuitionFee?: number;
  imageUrl?: string;
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://knowurcoach.in').replace(/\/$/, '');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name,
    description: tagline,
    url: `${baseUrl}/activities/${id}`,
    image: imageUrl || `${baseUrl}/images/brand/logo-full.png`,
    telephone: phone || '+919762577714',
    address: {
      '@type': 'PostalAddress',
      streetAddress: address || locality,
      addressLocality: locality,
      addressCountry: 'IN',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Number(rating) || 5.0,
      reviewCount: Math.max(1, Number(reviewsCount) || 1),
      bestRating: '5',
      worstRating: '1',
    },
    ...(Number(monthlyTuitionFee) > 0
      ? {
          priceRange: `₹${monthlyTuitionFee}/month`,
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function CompetitionJsonLd({
  id,
  title,
  description,
  category,
  location,
  startDate,
  endDate,
  entryFee,
  bannerUrl,
}: {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startDate?: string | Date;
  endDate?: string | Date;
  entryFee?: number;
  bannerUrl?: string;
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://knowurcoach.in').replace(/\/$/, '');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: title,
    description: description,
    url: `${baseUrl}/competitions/${id}`,
    image: bannerUrl || `${baseUrl}/images/brand/logo-full.png`,
    startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
    endDate: endDate ? new Date(endDate).toISOString() : undefined,
    location: {
      '@type': 'Place',
      name: location || 'Sports Complex',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
      },
    },
    offers: {
      '@type': 'Offer',
      price: entryFee || 0,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/competitions/${id}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
