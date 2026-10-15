"use client";

import React from 'react';
import { useModalStore } from '@/hooks/useModalStore';
import { usePersona } from '@/context/PersonaContext';
import { downloadBookingSlip } from '@/lib/downloadBookingSlip';
import {
  Ticket,
  Calendar,
  NavigationArrow,
  ChatCircle,
  FilePdf,
  DownloadSimple,
  ShieldCheck,
  CheckCircle,
  WhatsappLogo,
  CalendarCheck,
  User,
} from '@phosphor-icons/react';

export interface BookingPassData {
  id: string;
  type: 'trial' | 'batch' | 'tournament';
  title: string;
  subtitle: string;
  studentName: string;
  schedule: string;
  courtOrVenue: string;
  passId: string;
  feeInfo: string;
  phone?: string;
  coachName?: string;
  attendances?: any[];
  attendanceProgress?: {
    attended: number;
    total: number;
    percentage: number;
  };
  tournamentDetails?: {
    category: string;
    dates: string;
    reportingTime: string;
  };
}

interface BookingPassCardProps {
  pass: BookingPassData;
  onViewPass?: () => void;
  onReschedule?: () => void;
}

export function BookingPassCard({ pass, onViewPass, onReschedule }: BookingPassCardProps) {
  const { openModal } = useModalStore();
  const { showToast } = usePersona();

  const cleanRef = pass.passId.startsWith('#') ? pass.passId : `#${pass.passId}`;
  const contactPhone = pass.phone || '9897012345';

  const handleDownload = () => {
    downloadBookingSlip({
      bookingId: cleanRef,
      referenceNo: cleanRef,
      type: pass.type,
      academyName: pass.title,
      locality: pass.subtitle,
      studentName: pass.studentName,
      schedule: pass.schedule,
      courtOrVenue: pass.courtOrVenue,
      feeInfo: pass.feeInfo,
      contactPhone,
    });
  };

  const handleMessageAcademy = () => {
    const text = encodeURIComponent(
      `Hi, I am contacting you regarding ${pass.type === 'trial' ? 'Free Trial' : 'Enrolled Batch'} for ${pass.studentName} (Ref: ${cleanRef}) at ${pass.title}.`
    );
    window.open(`https://wa.me/91${contactPhone}?text=${text}`, '_blank');
  };

  if (pass.type === 'trial') {
    return (
      <div className="booking-card bg-white rounded-3xl p-4 border border-blue-200 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Free Trial Booking
            </span>
            <h3 className="font-extrabold text-gray-900 text-sm mt-1.5 leading-snug">
              {pass.title}
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              {pass.subtitle}
            </p>
          </div>
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-xl border border-emerald-100">
            {pass.feeInfo}
          </span>
        </div>

        {/* Prominent Child Profile Tag */}
        <div className="flex items-center gap-2.5 bg-blue-50/90 border border-blue-200/80 rounded-2xl p-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
            {pass.studentName?.[0]?.toUpperCase() || 'C'}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-blue-700 font-extrabold uppercase tracking-wider block">
              Trial Student
            </span>
            <span className="font-extrabold text-slate-900 text-xs truncate block">
              {pass.studentName}
            </span>
          </div>
        </div>

        <div className="bg-blue-50/60 rounded-2xl p-3 border border-blue-100 text-[10px] space-y-1">
          <div className="flex justify-between text-gray-700">
            <span>Student: <strong className="text-gray-900">{pass.studentName}</strong></span>
            <span>Ref No: <strong className="font-mono text-blue-900">{cleanRef}</strong></span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Scheduled: <strong>{pass.schedule}</strong></span>
            <span className="text-emerald-700 font-bold">{pass.courtOrVenue}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => {
              if (onViewPass) {
                onViewPass();
              } else {
                openModal('session-pass', {
                  title: `${pass.title} (${pass.studentName})`,
                  acadName: pass.title,
                  locality: pass.subtitle,
                  sessionTime: pass.schedule,
                  courtNumber: pass.courtOrVenue,
                  coachName: pass.coachName || 'Assigned Head Coach',
                  bookingId: cleanRef,
                  studentName: pass.studentName,
                  type: 'trial',
                  feeInfo: pass.feeInfo,
                  phone: contactPhone,
                });
              }
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Ticket size={15} weight="bold" /> Booking Details
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs hover:bg-gray-50 flex items-center justify-center gap-1 transition-all cursor-pointer"
            title="Download Booking Slip"
          >
            <DownloadSimple size={14} weight="bold" /> Download Slip
          </button>

          <button
            type="button"
            onClick={handleMessageAcademy}
            className="w-10 h-10 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center justify-center text-base hover:bg-emerald-100 transition-all cursor-pointer flex-shrink-0"
            title="Message on WhatsApp"
          >
            <WhatsappLogo size={16} weight="fill" className="text-emerald-600" />
          </button>

          <button
            type="button"
            onClick={() => showToast('Opening Google Maps navigation to training center...')}
            className="w-10 h-10 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl flex items-center justify-center text-base hover:bg-gray-100 transition-all cursor-pointer flex-shrink-0"
            title="Directions"
          >
            <NavigationArrow size={16} weight="bold" className="text-blue-600" />
          </button>
        </div>
      </div>
    );
  }

  if (pass.type === 'batch') {
    const progress = pass.attendanceProgress || { attended: 0, total: 12, percentage: 0 };
    return (
      <div className="booking-card bg-white rounded-3xl p-4 border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                Monthly Enrolled Admission
              </span>
              <span className="bg-blue-50 text-blue-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                Direct Academy Settlement
              </span>
            </div>
            <h3 className="font-extrabold text-gray-900 text-sm mt-1.5 leading-snug">
              {pass.title}
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              {pass.subtitle}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-1 rounded-xl border border-purple-100 block">
              {pass.feeInfo}
            </span>
            <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">{cleanRef}</span>
          </div>
        </div>

        {/* Prominent Enrolled Child Profile Tag */}
        <div className="flex items-center gap-2.5 bg-purple-50/90 border border-purple-200/80 rounded-2xl p-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
            {pass.studentName?.[0]?.toUpperCase() || 'C'}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-purple-700 font-extrabold uppercase tracking-wider block">
              Enrolled Student
            </span>
            <span className="font-extrabold text-slate-900 text-xs truncate block">
              {pass.studentName}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200/80 space-y-2 text-xs">
          <div className="flex justify-between items-center text-[10px] pb-1 border-b border-gray-200/60">
            <span className="text-gray-600 font-semibold">Student: <strong className="text-gray-900">{pass.studentName}</strong></span>
            <span className="font-mono text-purple-900 font-bold">{cleanRef}</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-gray-500 font-semibold">Attendance Progress (Oct 2026)</span>
            <span className="font-extrabold text-gray-800">
              {progress.attended} / {progress.total} Classes ({progress.percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1">
            <span>Schedule: <strong>{pass.schedule}</strong></span>
            <span>Batch: <strong>{pass.courtOrVenue}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => {
              openModal('attendance-log', {
                studentName: pass.studentName,
                acadName: pass.title,
                batchName: pass.courtOrVenue,
                schedule: pass.schedule,
                coachName: pass.coachName || 'Assigned Head Coach',
                attended: progress.attended,
                total: progress.total,
                attendances: pass.attendances || [],
                phone: contactPhone,
              });
            }}
            className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-gray-50 cursor-pointer"
          >
            <CalendarCheck size={15} weight="bold" className="text-purple-600" /> Attendance Log
          </button>
          
          <button
            type="button"
            onClick={handleMessageAcademy}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <WhatsappLogo size={15} weight="fill" /> Message Academy
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
            title="Download Booking Slip"
          >
            <DownloadSimple size={15} weight="bold" />
          </button>
        </div>
      </div>
    );
  }

  // Tournament Entry
  const tourney = pass.tournamentDetails || {
    category: 'Under-11 Singles',
    dates: 'Oct 18 - 20, 2026',
    reportingTime: '8:30 AM Sharp',
  };

  return (
    <div className="booking-card bg-white rounded-3xl p-4 border border-orange-200 shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <span className="bg-orange-100 text-orange-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
            Tournament Entry
          </span>
          <h3 className="font-extrabold text-gray-900 text-sm mt-1.5 leading-snug">
            {pass.title}
          </h3>
          <p className="text-[11px] text-gray-500 font-medium">
            {pass.subtitle}
          </p>
        </div>
        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-1 rounded-xl flex items-center gap-0.5">
          <CheckCircle size={12} weight="fill" /> Verified
        </span>
      </div>

      <div className="bg-orange-50/50 rounded-2xl p-3 border border-orange-100 text-[10px] space-y-1">
        <div className="flex justify-between text-gray-700">
          <span>Participant: <strong className="text-gray-900">{pass.studentName}</strong></span>
          <span>Category: <strong>{tourney.category}</strong></span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Dates: <strong>{tourney.dates}</strong></span>
          <span>Reporting: <strong>{tourney.reportingTime}</strong></span>
        </div>
        <div className="flex justify-between text-gray-700 pt-1 border-t border-orange-200/60 font-mono">
          <span>Reference No: <strong>{cleanRef}</strong></span>
          <span className="text-emerald-700 font-bold">{pass.feeInfo}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => showToast('Opening Agra Youth Badminton Official Rulebook (PDF)...')}
          className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 hover:bg-gray-50 cursor-pointer"
        >
          <FilePdf size={14} weight="bold" className="text-red-500" /> Rulebook
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer"
        >
          <DownloadSimple size={14} weight="bold" /> Download Slip
        </button>
      </div>
    </div>
  );
}
