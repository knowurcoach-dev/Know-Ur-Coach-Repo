import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Handshake, CheckCircle, ArrowLeft } from '@phosphor-icons/react/dist/ssr';

export const metadata = {
  title: 'Terms of Service | KnowUrCoach',
  description: 'Terms of service and direct academy settlement policies on KnowUrCoach.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'Terms of Service | KnowUrCoach',
    description: 'Terms of service and direct academy settlement policies on KnowUrCoach.',
    url: '/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-6 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold uppercase tracking-wider">
              <ShieldCheck size={14} weight="fill" /> Official Platform Terms
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Terms of Service &amp; Direct Fee Policy
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Last updated: October 2026 • Effective nationwide across India
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900">1. Platform Nature &amp; Scope</h2>
              <p>
                KnowUrCoach is a discovery and verification platform designed to help parents discover verified sports academies, brain booster classes, arts studios, and certified mentors across Indian cities. We do not act as an educational intermediary, custodial entity, or banking gateway for batch tuition fees.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900">2. Direct Offline Academy Fee Settlement Policy</h2>
              <p>
                <strong>Zero Platform Fee for Parents:</strong> KnowUrCoach does not collect, charge, or broker parents&apos; batch tuition fees through online payment gateways. When parents book free trials or enroll in monthly batches, admission passes are generated free of platform commission. Tuition fees are payable directly by parents to the coaching academy or head coach offline at the facility on Day 1.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900">3. Free Trial Session Policies</h2>
              <p>
                All trial passes issued via KnowUrCoach are 100% free of charge. Academies enrolled in the verified network agree to offer prospective students their designated introductory evaluation session without mandatory upfront payment.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900">4. Physical KYC &amp; Verification Standards</h2>
              <p>
                Academies marked with Safety Badges undergo digital and physical verification checks, including government photo identity audits, sports federation/NIS credentials inspection, and venue safety evaluations. However, parents are strongly encouraged to inspect the grounds and meet the head coach in person before paying monthly tuition fees.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900">5. Partner Coach Subscriptions</h2>
              <p>
                Coaches and academy owners subscribing to platform growth tiers (Standard or Premier) agree to the platform listing standards and fee schedules billed through verified Razorpay merchant services.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
