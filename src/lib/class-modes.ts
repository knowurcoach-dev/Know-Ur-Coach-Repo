export interface ClassModeItem {
  id?: string;
  slug: string;
  label: string;
  description?: string | null;
  badgeColor: string; // 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'teal' | 'indigo' | 'slate'
  icon: string; // 'Buildings' | 'Laptop' | 'ArrowsClockwise' | 'House' | 'User' | 'Trophy' | 'Sparkle' | 'Globe' | 'VideoCamera'
  isActive: boolean;
  order: number;
  academyCount?: number;
}

export const DEFAULT_CLASS_MODES: ClassModeItem[] = [
  {
    slug: 'offline',
    label: 'Offline',
    description: 'Physical In-Person Classes at Center',
    badgeColor: 'emerald',
    icon: 'Buildings',
    isActive: true,
    order: 1,
  },
  {
    slug: 'online',
    label: 'Online',
    description: 'Live Interactive Virtual Sessions',
    badgeColor: 'blue',
    icon: 'Laptop',
    isActive: true,
    order: 2,
  },
  {
    slug: 'hybrid',
    label: 'Hybrid',
    description: 'Flexible Blend of In-Person & Online',
    badgeColor: 'purple',
    icon: 'ArrowsClockwise',
    isActive: true,
    order: 3,
  },
];

export const BADGE_COLOR_PALETTES: Record<
  string,
  {
    name: string;
    bg: string;
    text: string;
    border: string;
    chipActive: string;
    dot: string;
  }
> = {
  emerald: {
    name: 'Emerald (Green)',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200/80',
    chipActive: 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  blue: {
    name: 'Blue (Indigo)',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200/80',
    chipActive: 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20',
    dot: 'bg-blue-500',
  },
  purple: {
    name: 'Purple (Violet)',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200/80',
    chipActive: 'bg-purple-600 text-white border-purple-600 shadow-purple-500/20',
    dot: 'bg-purple-500',
  },
  amber: {
    name: 'Amber (Orange)',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200/80',
    chipActive: 'bg-amber-500 text-white border-amber-500 shadow-amber-500/20',
    dot: 'bg-amber-500',
  },
  rose: {
    name: 'Rose (Pink)',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200/80',
    chipActive: 'bg-rose-600 text-white border-rose-600 shadow-rose-500/20',
    dot: 'bg-rose-500',
  },
  teal: {
    name: 'Teal (Cyan)',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200/80',
    chipActive: 'bg-teal-600 text-white border-teal-600 shadow-teal-500/20',
    dot: 'bg-teal-500',
  },
  indigo: {
    name: 'Indigo (Deep Blue)',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200/80',
    chipActive: 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20',
    dot: 'bg-indigo-500',
  },
  slate: {
    name: 'Slate (Neutral)',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-200',
    chipActive: 'bg-slate-800 text-white border-slate-800 shadow-slate-500/20',
    dot: 'bg-slate-500',
  },
};

export function getClassModeBadgeStyles(badgeColor?: string, slug?: string) {
  let colorKey = (badgeColor || '').toLowerCase();
  if (!BADGE_COLOR_PALETTES[colorKey]) {
    // Infer color from slug if badgeColor is unset
    if (slug === 'online') colorKey = 'blue';
    else if (slug === 'hybrid') colorKey = 'purple';
    else if (slug === 'offline') colorKey = 'emerald';
    else colorKey = 'slate';
  }

  return BADGE_COLOR_PALETTES[colorKey] || BADGE_COLOR_PALETTES.slate;
}

export function resolveClassModeInfo(
  modeSlug?: string,
  customModes?: ClassModeItem[]
): {
  slug: string;
  label: string;
  description: string;
  badgeColor: string;
  icon: string;
  iconName: string;
  styles: (typeof BADGE_COLOR_PALETTES)['slate'];
} {
  const cleanSlug = (modeSlug || 'offline').trim().toLowerCase();
  const pool = customModes && customModes.length > 0 ? customModes : DEFAULT_CLASS_MODES;
  const found = pool.find((m) => m.slug === cleanSlug);

  if (found) {
    return {
      slug: found.slug,
      label: found.label,
      description: found.description || '',
      badgeColor: found.badgeColor,
      icon: found.icon,
      iconName: found.icon,
      styles: getClassModeBadgeStyles(found.badgeColor, found.slug),
    };
  }

  // Fallback defaults
  if (cleanSlug === 'online') {
    return {
      slug: 'online',
      label: 'Online',
      description: 'Live Interactive Virtual Sessions',
      badgeColor: 'blue',
      icon: 'Laptop',
      iconName: 'Laptop',
      styles: BADGE_COLOR_PALETTES.blue,
    };
  }
  if (cleanSlug === 'hybrid') {
    return {
      slug: 'hybrid',
      label: 'Hybrid',
      description: 'Flexible Blend of In-Person & Online',
      badgeColor: 'purple',
      icon: 'ArrowsClockwise',
      iconName: 'ArrowsClockwise',
      styles: BADGE_COLOR_PALETTES.purple,
    };
  }

  return {
    slug: 'offline',
    label: 'Offline',
    description: 'Physical In-Person Classes at Center',
    badgeColor: 'emerald',
    icon: 'Buildings',
    iconName: 'Buildings',
    styles: BADGE_COLOR_PALETTES.emerald,
  };
}
