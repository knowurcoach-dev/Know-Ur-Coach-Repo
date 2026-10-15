export interface PlatformReviewItem {
  id: string;
  name: string;
  location: string;
  childInfo: string;
  discipline: string;
  quote: string;
  rating: number;
  avatarBg: string;
  initials: string;
  order: number;
  isActive: boolean;
}

export const INITIAL_PLATFORM_REVIEWS: PlatformReviewItem[] = [
  {
    id: 'pr-pooja',
    name: 'Pooja Sharma',
    location: 'Kamla Nagar, Agra',
    childInfo: 'Mother of Aarav (8 Yrs)',
    discipline: 'Badminton & Tennis',
    quote:
      'Booking Aarav’s trial session took literally 2 minutes on WhatsApp. The verified coach badge gave us total confidence, and the academy had first-aid kits and clean synthetic courts.',
    rating: 5,
    avatarBg: 'bg-emerald-600',
    initials: 'PS',
    order: 1,
    isActive: true,
  },
  {
    id: 'pr-vikram',
    name: 'Vikramaditya Rao',
    location: 'Delhi NCR',
    childInfo: 'Father of Ananya (11 Yrs)',
    discipline: 'Vedic Maths & Robotics Lab',
    quote:
      'KnowUrCoach escrow protection meant our monthly fee was safe until we attended the first week. Ananya won 2nd prize in the district Olympiad after just 4 months of coaching!',
    rating: 5,
    avatarBg: 'bg-blue-600',
    initials: 'VR',
    order: 2,
    isActive: true,
  },
  {
    id: 'pr-meera',
    name: 'Meera Deshmukh',
    location: 'Bengaluru',
    childInfo: 'Mother of Kabir (6 Yrs)',
    discipline: 'Kathak & Classical Keyboard',
    quote:
      'Finding certified music mentors with police verification used to be scary. KnowUrCoach physical audit reports gave us peace of mind. Highly recommended to every parent!',
    rating: 5,
    avatarBg: 'bg-purple-600',
    initials: 'MD',
    order: 3,
    isActive: true,
  },
  {
    id: 'pr-sunil',
    name: 'Sunil Mathur',
    location: 'Sadar, Agra',
    childInfo: 'Father of Riya (9 Yrs)',
    discipline: 'Olympic Swimming Academy',
    quote:
      'The heated pool facilities and certified NIS lifeguards are world class. KnowUrCoach made trial booking and monthly fee payment completely transparent.',
    rating: 5,
    avatarBg: 'bg-amber-600',
    initials: 'SM',
    order: 4,
    isActive: true,
  },
];
