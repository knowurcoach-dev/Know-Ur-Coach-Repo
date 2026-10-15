"use client";

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useModalStore } from '@/hooks/useModalStore';
import {
  MagnifyingGlass,
  Scales,
  Sparkle,
  Ticket,
  RocketLaunch,
  ArrowRight,
  CaretLeft,
  CaretRight,
  ShieldCheck,
  LockKey,
  WhatsappLogo,
  CheckCircle,
} from '@phosphor-icons/react';

interface Step {
  num: string;
  badge: string;
  title: string;
  desc: string;
  highlight: string;
  icon: React.ElementType;
  iconBg: string;
  accentGradient: string;
  borderHover: string;
  action: () => void;
  ctaText: string;
}

export function HowItWorksSection({ onSearchClick }: { onSearchClick?: () => void }) {
  const router = useRouter();
  const { openModal } = useModalStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps: Step[] = [
    {
      num: '01',
      badge: 'Discover',
      title: 'Search & Discover',
      desc: 'Find certified coaches & audited sports or arts centers nearby.',
      highlight: '38+ Activities',
      icon: MagnifyingGlass,
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20',
      accentGradient: 'from-blue-500 to-indigo-600',
      borderHover: 'hover:border-blue-400 hover:shadow-blue-500/10',
      action: () => {
        if (onSearchClick) onSearchClick();
        else router.push('/activities');
      },
      ctaText: 'Find Classes',
    },
    {
      num: '02',
      badge: 'Compare',
      title: 'Compare Academies',
      desc: 'Compare fees, safety audit grades, and parent reviews.',
      highlight: 'Fee & Safety Grades',
      icon: Scales,
      iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/20',
      accentGradient: 'from-purple-500 to-indigo-600',
      borderHover: 'hover:border-purple-400 hover:shadow-purple-500/10',
      action: () => openModal('compare-academies'),
      ctaText: 'Compare Now',
    },
    {
      num: '03',
      badge: 'Precision',
      title: 'Choose Best Fit',
      desc: 'Pick curriculum tailored to your child’s age, level & timing.',
      highlight: 'Batches U5–U16',
      icon: Sparkle,
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-500/20',
      accentGradient: 'from-amber-400 to-orange-500',
      borderHover: 'hover:border-amber-400 hover:shadow-amber-500/10',
      action: () => router.push('/activities'),
      ctaText: 'View Batches',
    },
    {
      num: '04',
      badge: 'Zero Risk',
      title: 'Book Free Trial',
      desc: 'Book a 100% free trial pass with zero fees and escrow safety.',
      highlight: 'Free Trial Pass',
      icon: Ticket,
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20',
      accentGradient: 'from-emerald-400 to-teal-600',
      borderHover: 'hover:border-emerald-400 hover:shadow-emerald-500/10',
      action: () => openModal('trial-booking', { acadId: 'acad-ace' }),
      ctaText: 'Free Trial Pass',
    },
    {
      num: '05',
      badge: 'Growth',
      title: 'Learn & Shine',
      desc: 'Track attendance, skill level progress & youth tournaments.',
      highlight: 'Badges & Progress',
      icon: RocketLaunch,
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/20',
      accentGradient: 'from-rose-400 to-pink-600',
      borderHover: 'hover:border-rose-400 hover:shadow-rose-500/10',
      action: () => router.push('/competitions'),
      ctaText: 'Tournaments',
    },
  ];

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) return;
    const progress = scrollLeft / maxScroll;
    const index = Math.round(progress * (steps.length - 1));
    setActiveStep(Math.max(0, Math.min(steps.length - 1, index)));
  };

  const scrollToStep = (index: number) => {
    if (!scrollRef.current) return;
    const cards = scrollRef.current.children;
    if (cards[index]) {
      (cards[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
      setActiveStep(index);
    }
  };

  const handlePrev = () => {
    const nextIdx = Math.max(0, activeStep - 1);
    scrollToStep(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = Math.min(steps.length - 1, activeStep + 1);
    scrollToStep(nextIdx);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5">
      {/* Light-Mode Container with Balanced Spacing */}
      <div className="relative bg-gradient-to-b from-slate-50/80 via-white to-slate-50/60 rounded-3xl p-5 sm:p-7 lg:p-8 border border-slate-200/90 shadow-[0_15px_40px_-15px_rgba(0,102,255,0.06)] overflow-hidden space-y-5 sm:space-y-6">
        {/* Soft Ambient Radial Accents */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03] pointer-events-none" />

        {/* Section Header with Mobile-Optimized Readable Typography */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-blue-50/90 border border-blue-200/80 text-[#0066ff] px-3.5 py-1.5 rounded-full text-xs sm:text-[11px] font-black uppercase tracking-wider shadow-2xs">
              <Sparkle size={14} weight="fill" className="text-[#0066ff]" />
              <span>Simple 5-Step Parent Journey</span>
            </div>

            <h2 className="text-[26px] sm:text-3xl lg:text-[28px] font-black text-slate-900 tracking-tight leading-snug">
              How <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066ff] via-indigo-600 to-blue-700">KnowUrCoach</span> Works
            </h2>

            <p className="text-sm sm:text-sm lg:text-xs text-slate-600 font-medium leading-relaxed">
              Transparent coaching fees, 100% free trial passes, and complete escrow booking security.
            </p>
          </div>

          {/* Controls on Small & Tablet Screens */}
          <div className="flex lg:hidden items-center justify-between pt-2.5 border-t border-slate-200/80 w-full md:w-auto md:border-t-0 md:pt-0 gap-3">
            <div className="flex items-center gap-1.5 text-xs sm:text-xs font-bold text-slate-600">
              <span>Step <strong className="text-slate-900 font-black">{activeStep + 1}</strong> of {steps.length}</span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">• Swipe to explore</span>
            </div>
            <div className="flex items-center gap-1.5 px-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeStep === 0}
                aria-label="Previous step"
                className="p-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              <div className="flex items-center gap-1.5 px-1">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => scrollToStep(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      activeStep === i
                        ? 'w-6 h-2 bg-[#0066ff]'
                        : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleNext}
                disabled={activeStep === steps.length - 1}
                aria-label="Next step"
                className="p-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* 5 Step Cards (Horizontal Carousel on Mobile, 5-Col Grid on Desktop) */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="relative z-10 flex lg:grid lg:grid-cols-5 gap-3.5 sm:gap-4 overflow-x-auto lg:overflow-visible hide-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-2.5 lg:pb-0"
        >
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isHoveredOrActive = activeStep === idx;
            return (
              <div
                key={s.num}
                onClick={s.action}
                onMouseEnter={() => setActiveStep(idx)}
                className={`w-[82vw] max-w-[310px] sm:w-[280px] lg:w-auto shrink-0 snap-center lg:shrink lg:snap-align-none bg-white rounded-2xl p-4.5 sm:p-4.5 lg:p-4 border-2 transition-all duration-200 flex flex-col justify-between cursor-pointer group select-none relative shadow-xs hover:shadow-lg hover:-translate-y-1 ${
                  isHoveredOrActive
                    ? 'border-slate-300 shadow-md'
                    : 'border-slate-200/80'
                } ${s.borderHover}`}
              >
                {/* Slim Step Accent Bar */}
                <div
                  className={`h-1 w-10 sm:w-8 rounded-full bg-gradient-to-r ${s.accentGradient} mb-3 group-hover:w-full transition-all duration-300`}
                />

                <div className="space-y-3 sm:space-y-2.5 flex-1">
                  {/* Step Badge & Icon */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-[10px] font-mono font-black px-2.5 py-1 sm:py-0.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      {s.num}
                    </span>
                    <div
                      className={`w-10 h-10 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105 ${s.iconBg}`}
                    >
                      <Icon size={20} weight="bold" />
                    </div>
                  </div>

                  {/* Micro Benefit Tag with Readable Mobile Font */}
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:py-0.5 rounded-md text-xs sm:text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-100 group-hover:border-slate-200 transition-colors">
                      <CheckCircle size={13} weight="fill" className="text-emerald-500 shrink-0" />
                      <span>{s.highlight}</span>
                    </span>
                  </div>

                  {/* Title & Clear Description */}
                  <div>
                    <h3 className="text-base sm:text-base lg:text-sm font-black text-slate-900 group-hover:text-[#0066ff] transition-colors leading-snug">
                      {s.title}
                    </h3>
                    <p className="text-sm sm:text-sm lg:text-xs text-slate-600 font-medium leading-relaxed mt-1.5 sm:mt-1">
                      {s.desc}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Link */}
                <div className="pt-3 sm:pt-2.5 mt-3 sm:mt-2.5 border-t border-slate-100 flex items-center justify-between text-sm sm:text-sm lg:text-xs font-black text-slate-800 group-hover:text-[#0066ff] transition-colors">
                  <span>{s.ctaText}</span>
                  <ArrowRight size={15} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Integrated Light-Themed Trust & Assurance Bar (Enhanced Mobile Readability) */}
        <div className="relative z-10 pt-4 sm:pt-5 border-t border-slate-200/80 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
          <div className="flex items-center gap-2.5 p-3 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <ShieldCheck size={20} weight="fill" />
            </div>
            <div>
              <div className="font-black text-slate-900 text-xs sm:text-[11px] lg:text-xs">100% Verified Mentors</div>
              <div className="text-[11px] sm:text-[10px] text-slate-500 font-medium">NIS &amp; Police audited</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-colors">
            <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-[#0066ff] flex items-center justify-center shrink-0 border border-blue-100">
              <Ticket size={20} weight="fill" />
            </div>
            <div>
              <div className="font-black text-slate-900 text-xs sm:text-[11px] lg:text-xs">Free Trial Passes</div>
              <div className="text-[11px] sm:text-[10px] text-slate-500 font-medium">Zero platform fees</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-purple-300 transition-colors">
            <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <LockKey size={20} weight="fill" />
            </div>
            <div>
              <div className="font-black text-slate-900 text-xs sm:text-[11px] lg:text-xs">Escrow Protection</div>
              <div className="text-[11px] sm:text-[10px] text-slate-500 font-medium">Tuition held safely</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <WhatsappLogo size={20} weight="fill" />
            </div>
            <div>
              <div className="font-black text-slate-900 text-xs sm:text-[11px] lg:text-xs">Instant WhatsApp Pass</div>
              <div className="text-[11px] sm:text-[10px] text-slate-500 font-medium">QR pass on phone</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
