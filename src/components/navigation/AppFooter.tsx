"use client";

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  PhoneCall,
  MapPin,
  Trophy,
  Sparkle,
  CheckCircle,
  WhatsappLogo,
  EnvelopeSimple,
} from '@phosphor-icons/react';
import { usePersona } from '@/context/PersonaContext';

import { BrandLogo } from '@/components/brand/BrandLogo';

export function AppFooter() {
  const { activeCity } = usePersona();

  return (
    <footer className="hidden md:block bg-slate-50 text-slate-800 border-t border-slate-200/90 pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-200 text-xs">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo size="md" variant="light" />
            <p className="text-slate-600 leading-relaxed pr-6 text-xs">
              India&apos;s premier verified kids coaching, brain boosters, fine arts and sports academy discovery network. Empowering parents nationwide with free trial bookings, verified court attendance, 100% money-back escrow security, and rigorous physical safety compliance.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-bold shadow-xs">
                <ShieldCheck size={14} weight="fill" className="text-emerald-600" /> Physical KYC Verified
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-bold shadow-xs">
                <CheckCircle size={14} weight="fill" className="text-blue-600" /> 100% Escrow Protection
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-slate-900 font-extrabold text-sm tracking-wide uppercase">Discover Activities</h4>
            <ul className="space-y-2 text-slate-600 text-xs">
              <li><Link href="/activities?category=brain-booster" className="hover:text-emerald-600 transition-colors">Abacus &amp; Vedic Maths</Link></li>
              <li><Link href="/activities?category=brain-booster" className="hover:text-emerald-600 transition-colors">STEM &amp; Robotics Labs</Link></li>
              <li><Link href="/activities?category=sports" className="hover:text-emerald-600 transition-colors">Tennis &amp; Badminton Courts</Link></li>
              <li><Link href="/activities?category=sports" className="hover:text-emerald-600 transition-colors">Olympic Swimming Pools</Link></li>
              <li><Link href="/activities?category=arts" className="hover:text-emerald-600 transition-colors">Kathak &amp; Dance Studios</Link></li>
              <li><Link href="/activities?category=arts" className="hover:text-emerald-600 transition-colors">Fine Arts &amp; Painting</Link></li>
              <li><Link href="/activities?category=sports" className="hover:text-emerald-600 transition-colors">Taekwondo &amp; Karate Dojos</Link></li>
            </ul>
          </div>

          {/* City / Popular Localities */}
          <div className="space-y-3">
            <h4 className="text-slate-900 font-extrabold text-sm tracking-wide uppercase">{activeCity ? `${activeCity} & Major Hubs` : 'Popular Localities'}</h4>
            <ul className="space-y-2 text-slate-600 text-xs">
              <li><span className="hover:text-emerald-600 cursor-pointer transition-colors">Central Coaching Hubs</span></li>
              <li><span className="hover:text-emerald-600 cursor-pointer transition-colors">Sports Complexes &amp; Arenas</span></li>
              <li><span className="hover:text-emerald-600 cursor-pointer transition-colors">Dayalbagh &amp; Northern Zone</span></li>
              <li><span className="hover:text-emerald-600 cursor-pointer transition-colors">Civil Lines &amp; Cantt Hub</span></li>
              <li><span className="hover:text-emerald-600 cursor-pointer transition-colors">Residential Enclaves &amp; Sectors</span></li>
              <li><span className="hover:text-emerald-600 cursor-pointer transition-colors">East &amp; West Express Clusters</span></li>
            </ul>
          </div>

          {/* Portals & Support */}
          <div className="space-y-3">
            <h4 className="text-slate-900 font-extrabold text-sm tracking-wide uppercase">Portals &amp; Help</h4>
            <ul className="space-y-2 text-slate-600 text-xs">
              <li><Link href="/parent/bookings" className="hover:text-emerald-600 transition-colors">Parent Passes &amp; Booking Roster</Link></li>
              <li><Link href="/coach/dashboard" className="hover:text-emerald-600 transition-colors">Coach Operations &amp; Live Roster</Link></li>
              <li><Link href="/competitions" className="hover:text-emerald-600 transition-colors">Youth Sports Tournaments</Link></li>
              <li><Link href="/register-coach" className="hover:text-emerald-600 transition-colors">List Your Academy</Link></li>
            </ul>

            <div className="pt-2 text-slate-700">
              <a
                href="https://wa.me/919762577714?text=Hi%20KnowUrCoach%20Team%2C%20I%20have%20an%20inquiry"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <WhatsappLogo size={16} weight="fill" /> WhatsApp Helpline
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center text-slate-500 text-xs gap-3">
          <p>
            © {new Date().getFullYear()} KnowUrCoach. Physical safety certified. Map &amp; location data powered by{' '}
            <a
              href="https://locationiq.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 hover:text-emerald-600 underline underline-offset-2 transition-colors cursor-pointer font-medium"
            >
              LocationIQ
            </a>
            {' '}/ ©{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 hover:text-emerald-600 underline underline-offset-2 transition-colors cursor-pointer font-medium"
            >
              OSM contributors
            </a>
            .
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <Link href="/terms" className="hover:text-slate-800 transition-colors font-medium">Terms of Service</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-slate-800 transition-colors font-medium">Privacy Policy</Link>
            <span>•</span>
            <Link href="/competitions" className="hover:text-slate-800 transition-colors font-medium">Sports Tournaments</Link>
            <span>•</span>
            <a href="https://wa.me/919762577714" target="_blank" rel="noreferrer" className="hover:text-slate-800 transition-colors font-medium">District Helpline</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
