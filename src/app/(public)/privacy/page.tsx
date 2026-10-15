import React from 'react';
import Link from 'next/link';
import { LockKey, ShieldCheck, ArrowLeft } from '@phosphor-icons/react/dist/ssr';

export const metadata = {
  title: 'Privacy Policy | KnowUrCoach',
  description: 'Child privacy protection and data handling policies on KnowUrCoach.',
};

export default function PrivacyPage() {
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-extrabold uppercase tracking-wider">
              <LockKey size={14} weight="fill" /> Data Privacy &amp; Child Safety
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Privacy Policy &amp; Minor Protection Standards
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Last updated: October 2026 • Compliant with Indian IT Rules &amp; DPDP Act
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900">1. Information We Collect</h2>
              <p>
                We collect parent contact details (name, mobile phone number, optional email) strictly for facilitating direct booking passes and notifications. For child participants, we collect only the student&apos;s first name, age group, and grade level to assign appropriate coaching batches.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900">2. Minor Data Protection</h2>
              <p>
                We do not collect government identity proofs, biometric data, or sensitive financial information of minor children. Digital admission passes and attendance records are strictly restricted to authenticated parents and the authorized coaching academy.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900">3. Financial &amp; Payment Data</h2>
              <p>
                Parents are never asked to enter debit/credit card numbers or UPI PINs for child bookings on KnowUrCoach. All batch tuition is settled offline between parents and academy administrators.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900">4. Third-Party Sharing</h2>
              <p>
                We do not sell, rent, or trade parent or minor contact records to commercial advertisers or data brokers. Lead information is shared solely with the specific academy where a parent requested a trial or batch enrollment.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
