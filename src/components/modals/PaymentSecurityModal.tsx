"use client";

import React from 'react';
import { useModalStore } from '@/hooks/useModalStore';
import { DialogWrapper } from './DialogWrapper';
import { ShieldCheck, Handshake, Receipt, CurrencyInr, CheckCircle } from '@phosphor-icons/react';

export function PaymentSecurityModal() {
  const { isOpen, activeModal, closeModal } = useModalStore();

  const isModalOpen = isOpen && activeModal === 'payment-security';

  return (
    <DialogWrapper
      isOpen={isModalOpen}
      onClose={closeModal}
      desktopWidth="md:max-w-lg"
      title="Direct Settlement & Zero Platform Fee"
      subtitle="100% Transparent Fee Policy for Parents"
      icon={<ShieldCheck size={20} weight="fill" className="text-white" />}
      headerGradient="bg-gradient-to-r from-emerald-900 to-teal-950 text-white"
    >
      <div className="p-5 sm:p-6 space-y-4 text-xs">
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl flex-shrink-0">
            <Handshake size={22} weight="fill" />
          </div>
          <div>
            <h4 className="font-extrabold text-emerald-950 text-sm">Direct Academy Settlement</h4>
            <p className="text-[11px] text-emerald-800">Pay tuition fees directly to the coach or academy offline at the venue</p>
          </div>
        </div>

        <p className="text-slate-600 text-xs leading-relaxed">
          KnowUrCoach is 100% free for parents. We never require you to enter credit cards, UPI, or pay fees through an online gateway for batch bookings or trial sessions. All batch tuition is settled directly between you and the coach or academy at the venue.
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
          <div className="flex items-center gap-2.5 text-slate-800 font-bold text-xs">
            <CurrencyInr size={18} className="text-emerald-600 flex-shrink-0" />
            <span>Zero Booking Markup — 100% of your fee goes directly to coaching</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-800 font-bold text-xs">
            <ShieldCheck size={18} className="text-blue-600 flex-shrink-0" />
            <span>Inspect facilities &amp; meet the coach in person before paying on Day 1</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-800 font-bold text-xs">
            <Receipt size={18} className="text-purple-600 flex-shrink-0" />
            <span>Instant digital admission pass and booking confirmation slip</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-800 font-bold text-xs">
            <CheckCircle size={18} className="text-teal-600 flex-shrink-0" />
            <span>Zero payment gateway transaction charges or hidden fees</span>
          </div>
        </div>

        <button
          onClick={closeModal}
          className="w-full bg-[#0a1128] hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-xl shadow-md transition-all text-xs cursor-pointer active:scale-95"
        >
          Got It, Explore Verified Academies
        </button>
      </div>
    </DialogWrapper>
  );
}
