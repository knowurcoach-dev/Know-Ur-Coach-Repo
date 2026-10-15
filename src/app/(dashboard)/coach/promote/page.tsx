"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePersona } from '@/context/PersonaContext';
import { getCoachDashboardData } from '@/lib/actions';
import { GeneralCoachPageSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  Megaphone,
  QrCode,
  WhatsappLogo,
  ShareNetwork,
  Copy,
  DownloadSimple,
  ArrowLeft,
  CheckCircle,
  Sparkle,
} from '@phosphor-icons/react';

export default function CoachPromotePage() {
  const { session, user } = useAuth();
  const { showToast } = usePersona();

  const [centreData, setCentreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userEmail = session?.user?.email || (user as any)?.email;

  useEffect(() => {
    async function loadData() {
      if (!userEmail) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await getCoachDashboardData(userEmail);
        if (res.success && res.centre) {
          setCentreData(res.centre);
        }
      } catch (err) {
        console.warn('Could not load coach data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userEmail]);

  if (loading) {
    return <GeneralCoachPageSkeleton title="Promote Center" />;
  }

  const academyName =
    centreData?.name || (session?.user?.name ? `${session.user.name}'s Academy` : 'Your Academy');
  const locality = centreData?.locality?.replace('-', ' ') || 'Local Academy';
  const publicUrl = centreData?.id
    ? `http://localhost:3000/activities/${centreData.id}`
    : 'http://localhost:3000/activities';

  const copyListingLink = () => {
    navigator.clipboard.writeText(publicUrl);
    showToast('📋 Copied listing link to clipboard!');
  };

  const whatsappMessage = encodeURIComponent(
    `🏆 Hello Parents! Book a Free Trial Class at ${academyName} (${locality}) on KnowUrCoach.\n\nClaim your instant verified QR pass here:\n${publicUrl}`
  );

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <Link
            href="/coach/dashboard"
            className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer shadow-2xs transition-colors shrink-0"
          >
            <ArrowLeft size={18} weight="bold" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              Promote Academy &amp; Parent Discovery
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              QR Entrance Posters, WhatsApp Invites &amp; Local Discovery Badges • {academyName}
            </p>
          </div>
        </div>

        {/* 2-Column Promo Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WhatsApp Invite Tool */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <WhatsappLogo size={26} weight="fill" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">WhatsApp Parent Invite Builder</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Share this pre-formatted invitation to your local society WhatsApp groups, school parent chats, and sports circles.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700 leading-relaxed font-mono">
                🏆 Book a Free Trial Class at <strong>{academyName}</strong> ({locality}) on KnowUrCoach. Instant pass confirmation!
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={`https://wa.me/?text=${whatsappMessage}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <WhatsappLogo size={16} weight="fill" />
                <span>Share to WhatsApp Groups</span>
              </a>
              <button
                onClick={copyListingLink}
                className="w-full py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy size={15} weight="bold" />
                <span>Copy Public Link</span>
              </button>
            </div>
          </div>

          {/* QR Code Entrance Poster */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <QrCode size={26} weight="bold" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Entrance QR Poster (Printable)</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Hang this official KnowUrCoach poster on your academy gate or court entrance for walk-in parents to scan and book free trial passes instantly.
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl flex items-center gap-4">
                <div className="w-20 h-20 bg-white p-2 rounded-xl flex items-center justify-center text-slate-900 shrink-0">
                  <QrCode size={64} weight="bold" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    SCAN TO ENROLL
                  </div>
                  <div className="font-extrabold text-white text-sm line-clamp-1">{academyName}</div>
                  <div className="text-[11px] text-slate-300">Free Trial Class Available</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => showToast('Generating high-resolution printable PDF poster for academy...')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <DownloadSimple size={16} weight="bold" />
              <span>Download Printable Poster (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
