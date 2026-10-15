"use client";

import React, { useState } from 'react';
import { DialogWrapper } from './DialogWrapper';
import { useModalStore } from '@/hooks/useModalStore';
import { downloadBookingSlip } from '@/lib/downloadBookingSlip';
import {
  Ticket,
  CheckCircle,
  MapPin,
  User,
  CalendarBlank,
  DownloadSimple,
  Copy,
  WhatsappLogo,
  ShieldCheck,
  Check,
} from '@phosphor-icons/react';

export function SessionPassModal() {
  const { isOpen, activeModal, modalData, closeModal } = useModalStore();
  const [copied, setCopied] = useState(false);

  const isModalOpen = isOpen && activeModal === 'session-pass';

  if (!isModalOpen) return null;

  const title = modalData?.title || 'Confirmed Booking';
  const academyName = modalData?.acadName || 'Verified Academy';
  const locality = modalData?.locality || 'Verified Academy Arena';
  const scheduledTime = modalData?.sessionTime || modalData?.schedule || 'Scheduled Session';
  const courtNumber = modalData?.courtNumber || modalData?.batchName || 'Main Arena';
  const coachName = modalData?.coachName || 'Assigned Head Coach';
  const passId = modalData?.bookingId || modalData?.passId || `REF-${Date.now().toString().slice(-6)}`;
  const cleanRef = passId.startsWith('#') ? passId : `#${passId}`;
  const studentName = modalData?.studentName || modalData?.childName || 'Student';
  const feeInfo = modalData?.feeInfo || (modalData?.type === 'trial' ? 'Free Trial' : 'Direct Academy Settlement');
  const contactPhone = modalData?.phone || '9897012345';

  const handleCopyRef = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(cleanRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadSlip = () => {
    downloadBookingSlip({
      bookingId: cleanRef,
      referenceNo: cleanRef,
      type: modalData?.type || 'trial',
      academyName,
      locality,
      coachName,
      contactPhone,
      studentName,
      schedule: scheduledTime,
      courtOrVenue: courtNumber,
      feeInfo,
    });
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi, I have a confirmed booking (Ref: ${cleanRef}) for ${studentName} at ${academyName}. Scheduled: ${scheduledTime}.`
    );
    window.open(`https://wa.me/91${contactPhone}?text=${text}`, '_blank');
  };

  return (
    <DialogWrapper
      id="session-pass-modal"
      isOpen={isModalOpen}
      onClose={closeModal}
      icon={<Ticket size={20} weight="fill" className="text-blue-600" />}
      title="Booking Details & Reference Slip"
      subtitle={`Reference: ${cleanRef}`}
      headerGradient="bg-gradient-to-r from-blue-50 to-indigo-50"
    >
      <div className="p-5 text-center space-y-4 text-xs">
        {/* Verified Admission Card */}
        <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-[#0a1128] text-white rounded-3xl p-5 shadow-xl text-left relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="text-[9px] font-bold text-blue-200 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck size={13} weight="fill" className="text-emerald-400" />
              CONFIRMED ADMISSION DETAILS
            </div>
            <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase">
              CONFIRMED
            </span>
          </div>

          <h3 className="font-extrabold text-base mt-2 text-white leading-tight">
            {title}
          </h3>
          <p className="text-xs text-blue-200 mb-3 font-medium">
            {academyName} • {locality}
          </p>

          <div className="border-t border-dashed border-white/20 my-2.5" />

          {/* Reference Number Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 mb-3 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-blue-200 uppercase tracking-wider block font-bold">
                Booking Reference No.
              </span>
              <span className="font-mono font-black text-white text-base tracking-wide">
                {cleanRef}
              </span>
            </div>
            <button
              onClick={handleCopyRef}
              className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
            >
              {copied ? <Check size={12} weight="bold" /> : <Copy size={12} weight="bold" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-[10px] mb-2">
            <div>
              <div className="text-white/70 font-medium">Student</div>
              <div className="font-bold text-white text-xs">{studentName}</div>
            </div>
            <div>
              <div className="text-white/70 font-medium">Scheduled Time</div>
              <div className="font-bold text-white text-xs">{scheduledTime}</div>
            </div>
            <div>
              <div className="text-white/70 font-medium">Court / Batch</div>
              <div className="font-bold text-white text-xs">{courtNumber}</div>
            </div>
            <div>
              <div className="text-white/70 font-medium">Coach</div>
              <div className="font-bold text-white text-xs">{coachName}</div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-white/15 flex justify-between items-center text-[10px] text-blue-200">
            <span>Tuition / Fee Terms:</span>
            <span className="font-black text-emerald-300">{feeInfo}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-[11px] text-slate-700 text-left space-y-1">
          <div className="font-bold text-blue-900 flex items-center gap-1.5">
            <CheckCircle size={14} weight="fill" className="text-blue-600" />
            Check-In Instructions for Parent:
          </div>
          <p className="text-slate-600 leading-snug">
            Quote Reference No. <strong>{cleanRef}</strong> at the academy reception desk. No physical QR code scanning required.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownloadSlip}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <DownloadSimple size={16} weight="bold" />
            <span>Download Slip (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <WhatsappLogo size={16} weight="fill" className="text-emerald-600" />
            <span>Chat Academy</span>
          </button>
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={closeModal}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl transition-all cursor-pointer text-xs"
        >
          Close
        </button>
      </div>
    </DialogWrapper>
  );
}
