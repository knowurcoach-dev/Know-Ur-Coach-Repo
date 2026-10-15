"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Brain,
  Palette,
  Sparkle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Users,
  Star,
} from '@phosphor-icons/react';

interface ActivityDiscipline {
  id: string;
  name: string;
  categorySlug: string;
  tagline: string;
  badge: string;
  image: string;
  ageGroup: string;
  highlights: string[];
  coachType: string;
  rating: string;
  enrolled: string;
  gradient: string;
  accentColor: string;
}

const DISCIPLINES: ActivityDiscipline[] = [
  {
    id: 'sports',
    name: 'Sports & Athletics',
    categorySlug: 'sports',
    tagline: 'Badminton, Tennis, Football & Olympic Swimming',
    badge: 'Athletic Excellence',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1000&auto=format&fit=crop',
    ageGroup: '4 - 16 Yrs',
    highlights: ['NIS Certified Coaches', 'Synthetic Courts & Olympic Pools', 'Free Trial Sessions'],
    coachType: 'National / NIS Certified Mentors',
    rating: '4.9★',
    enrolled: '650+ Active Kids',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    accentColor: '#10B981',
  },
  {
    id: 'dance',
    name: 'Dance & Movement',
    categorySlug: 'arts',
    tagline: 'Kathak, Contemporary, Ballet & Bollywood Rhythms',
    badge: 'Expression & Grace',
    image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=1000&auto=format&fit=crop',
    ageGroup: '3 - 15 Yrs',
    highlights: ['Air-Conditioned Wooden Studios', 'Certified Choreographers', 'Annual Stage Recitals'],
    coachType: 'Sangeet Natak & Certified Gurus',
    rating: '4.9★',
    enrolled: '380+ Active Kids',
    gradient: 'from-rose-500 via-pink-600 to-purple-700',
    accentColor: '#EC4899',
  },
  {
    id: 'music',
    name: 'Music & Instruments',
    categorySlug: 'arts',
    tagline: 'Piano, Acoustic Guitar, Drums & Vocal Hindustani',
    badge: 'Melody & Harmony',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop',
    ageGroup: '5 - 16 Yrs',
    highlights: ['1-on-1 Studio Sessions', 'Trinity & Gandharva Prep', 'Free Trial Pass'],
    coachType: 'Trinity College Certified Mentors',
    rating: '4.8★',
    enrolled: '420+ Active Kids',
    gradient: 'from-indigo-600 via-purple-600 to-pink-600',
    accentColor: '#6366F1',
  },
  {
    id: 'art',
    name: 'Art & Creativity',
    categorySlug: 'arts',
    tagline: 'Canvas Painting, Sketching, Clay Modeling & Origami',
    badge: 'Imagination Unleashed',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1000&auto=format&fit=crop',
    ageGroup: '3 - 14 Yrs',
    highlights: ['Non-Toxic Premium Supplies', 'Art Exhibitions & Galleried Art', 'Motor Skills Development'],
    coachType: 'Fine Arts MFA Mentors',
    rating: '4.9★',
    enrolled: '310+ Active Kids',
    gradient: 'from-amber-500 via-orange-600 to-rose-600',
    accentColor: '#F59E0B',
  },
  {
    id: 'stem',
    name: 'Coding & STEM',
    categorySlug: 'brain-booster',
    tagline: 'Robotics Labs, AI Coding, Vedic Maths & Grandmaster Chess',
    badge: 'Future Innovators',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1000&auto=format&fit=crop',
    ageGroup: '5 - 16 Yrs',
    highlights: ['Hands-on Hardware Kits', 'FIDE Chess Coaches', 'Olympiad & Hackathon Prep'],
    coachType: 'IIT & FIDE Rated Mentors',
    rating: '5.0★',
    enrolled: '540+ Active Kids',
    gradient: 'from-blue-600 via-cyan-600 to-teal-600',
    accentColor: '#0284C7',
  },
];

export function HeroActivityShowcase({ activeCity = 'India' }: { activeCity?: string }) {
  const [activeTab, setActiveTab] = useState<string>('sports');
  const current = DISCIPLINES.find((d) => d.id === activeTab) || DISCIPLINES[0];

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 sm:mt-12 text-left">
      {/* Category Pills Navigation */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 scrollbar-none px-2">
        {DISCIPLINES.map((item) => {
          const isSelected = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3.5 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border select-none ${
                isSelected
                  ? 'bg-white text-slate-900 border-white shadow-lg shadow-white/10 scale-105'
                  : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/20 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.accentColor }} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* Visual Showcase Card */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900/90 border border-white/15 shadow-2xl mt-3 transition-all duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Left Visual Image Showcase */}
          <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-96 w-full overflow-hidden group">
            {/* Background photo */}
            <img
              src={current.image}
              alt={current.name}
              className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-900" />

            {/* Floating Top Left Badge */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-white/20 text-xs font-black shadow-md flex items-center gap-1.5">
                <Sparkle size={13} weight="fill" className="text-amber-400" />
                {current.badge}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-slate-950 text-xs font-black shadow-md flex items-center gap-1">
                <CheckCircle size={13} weight="fill" />
                100% Free Trial
              </span>
            </div>

            {/* Floating Bottom Left Stats Pill */}
            <div className="absolute bottom-4 left-4 bg-slate-950/85 backdrop-blur-md border border-white/15 p-2.5 sm:p-3 rounded-2xl flex items-center gap-3 shadow-lg">
              <div className="flex -space-x-1.5">
                <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-white">AK</div>
                <div className="w-7 h-7 rounded-full bg-amber-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-white">PS</div>
                <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-white">RV</div>
              </div>
              <div className="text-xs">
                <div className="text-white font-extrabold">{current.enrolled}</div>
                <div className="text-emerald-400 text-[10px] font-bold">Enrolled in {activeCity}</div>
              </div>
            </div>
          </div>

          {/* Right Information & Action Panel */}
          <div className="lg:col-span-5 p-6 sm:p-8 space-y-4 text-white">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ages: {current.ageGroup}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5">
                  <Star size={13} weight="fill" /> {current.rating} Community Score
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {current.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                {current.tagline}
              </p>
            </div>

            {/* Highlights List */}
            <div className="space-y-2 pt-1 border-t border-white/10">
              {current.highlights.map((highlight, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
                  <ShieldCheck size={16} weight="fill" className="text-emerald-400 shrink-0" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>

            {/* Verified Mentor Note */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-amber-400">
                <Trophy size={18} weight="fill" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Faculty Standard</span>
                <span className="font-bold text-white text-xs">{current.coachType}</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <Link
                href={`/activities?category=${current.categorySlug}`}
                className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm py-3 px-5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Explore {current.name} in {activeCity}</span>
                <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
