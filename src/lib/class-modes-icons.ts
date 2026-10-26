"use client";

import {
  Buildings,
  Laptop,
  ArrowsClockwise,
  House,
  User,
  Trophy,
  Sparkle,
  Globe,
  VideoCamera,
} from '@phosphor-icons/react';

export const AVAILABLE_ICONS: Array<{ name: string; label: string; component: any }> = [
  { name: 'Buildings', label: 'Physical Building / Venue', component: Buildings },
  { name: 'Laptop', label: 'Laptop / Virtual Session', component: Laptop },
  { name: 'ArrowsClockwise', label: 'Hybrid / Blended', component: ArrowsClockwise },
  { name: 'House', label: 'Home Visit / Tutor', component: House },
  { name: 'User', label: '1-on-1 Personal Coaching', component: User },
  { name: 'Globe', label: 'Global / All India', component: Globe },
  { name: 'VideoCamera', label: 'Live Video Feed', component: VideoCamera },
  { name: 'Trophy', label: 'Championship / Pro', component: Trophy },
  { name: 'Sparkle', label: 'Specialized Program', component: Sparkle },
];

export function getClassModeIconComponent(iconName?: string): any {
  const match = AVAILABLE_ICONS.find((i) => i.name.toLowerCase() === (iconName || '').toLowerCase());
  if (match) return match.component;

  const lower = (iconName || '').toLowerCase();
  if (lower.includes('online') || lower.includes('laptop') || lower.includes('comp')) return Laptop;
  if (lower.includes('hybrid') || lower.includes('arrow')) return ArrowsClockwise;
  if (lower.includes('home') || lower.includes('house')) return House;
  if (lower.includes('user') || lower.includes('coach')) return User;
  return Buildings;
}
