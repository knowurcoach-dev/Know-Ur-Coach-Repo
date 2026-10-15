export interface HeroSlideData {
  id?: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  imageUrl: string;
  ctaText?: string | null;
  ctaLink?: string | null;
  secondaryCtaText?: string | null;
  secondaryCtaLink?: string | null;
  accentGradient?: string | null;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_HERO_SLIDES: HeroSlideData[] = [
  {
    id: 'slide-sports',
    title: "Where Passion Meets Potential: Kids Sports & Athletics",
    subtitle: "Discover verified sports academies, Olympic pools, and badminton arenas with 100% free trial sessions and certified NIS mentors.",
    badge: "India's Verified Kids Coaching Network",
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1400&auto=format&fit=crop",
    ctaText: "Explore Sports Academies",
    ctaLink: "/activities?activity=sports",
    secondaryCtaText: "Book Free Trial",
    secondaryCtaLink: "/activities",
    accentGradient: "from-blue-600 via-indigo-600 to-emerald-600",
    order: 1,
    isActive: true,
  },
  {
    id: 'slide-stem',
    title: "Future Innovators: STEM Robotics & Cognitive Labs",
    subtitle: "Lego robotics, Arduino, Python coding, and Vedic arithmetic labs designed to ignite young creative problem solvers.",
    badge: "Top STEM & Coding Institutes",
    imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1400&auto=format&fit=crop",
    ctaText: "Explore STEM Labs",
    ctaLink: "/activities?activity=brain-booster",
    secondaryCtaText: "View Free Classes",
    secondaryCtaLink: "/activities?category=robotics",
    accentGradient: "from-purple-600 via-pink-600 to-amber-500",
    order: 2,
    isActive: true,
  },
  {
    id: 'slide-arts',
    title: "Unleash Artistic Expression: Dance, Music & Fine Arts",
    subtitle: "Kathak, Western hip-hop, classical sangeet, and fine arts masterclasses guided by certified gurus & artists.",
    badge: "Performing Arts & Studios",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1400&auto=format&fit=crop",
    ctaText: "Explore Arts Studios",
    ctaLink: "/activities?activity=arts",
    secondaryCtaText: "Free Trial Pass",
    secondaryCtaLink: "/activities?category=dance",
    accentGradient: "from-rose-500 via-orange-500 to-amber-500",
    order: 3,
    isActive: true,
  },
  {
    id: 'slide-racquet',
    title: "Championship Training: Tennis, Swimming & Martial Arts",
    subtitle: "Olympic size pools, BWF wooden courts, clay tennis courts, and black-belt certified martial arts dojos.",
    badge: "Physical Safety & NIS Certified",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1400&auto=format&fit=crop",
    ctaText: "Find Premier Centers",
    ctaLink: "/activities?activity=sports",
    secondaryCtaText: "Compare Centers",
    secondaryCtaLink: "/activities",
    accentGradient: "from-emerald-600 via-teal-600 to-cyan-600",
    order: 4,
    isActive: true,
  },
];
