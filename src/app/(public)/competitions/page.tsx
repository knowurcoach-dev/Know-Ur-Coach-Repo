import type { Metadata } from 'next';
import { CompetitionsView } from '@/components/views/CompetitionsView';

export const metadata: Metadata = {
  title: 'Youth Sports Tournaments & Competitions Across India | KnowUrCoach',
  description:
    'Discover and register for upcoming youth sports tournaments, cricket leagues, badminton championships, chess meets, and martial arts competitions across India.',
  alternates: {
    canonical: '/competitions',
  },
  keywords: [
    'tournaments in india',
    'youth sports tournaments',
    'sports competitions for kids',
    'cricket tournament registration',
    'badminton championship india',
    'chess tournament for kids',
    'youth sports india',
    'knowurcoach competitions',
    'find sports events near me',
    'inter school tournament',
    'sports leagues for kids',
    'sports championship registration',
  ],
  openGraph: {
    title: 'Youth Sports Tournaments & Competitions Across India | KnowUrCoach',
    description:
      'Discover and register for upcoming youth sports tournaments, cricket leagues, badminton championships, and chess meets across India.',
    url: '/competitions',
  },
};

export default function CompetitionsPage() {
  return <CompetitionsView />;
}
