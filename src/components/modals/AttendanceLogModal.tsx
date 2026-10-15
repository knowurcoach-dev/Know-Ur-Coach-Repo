"use client";

import React from 'react';
import { DialogWrapper } from './DialogWrapper';
import { useModalStore } from '@/hooks/useModalStore';
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  User,
  WhatsappLogo,
  ShieldCheck,
  Buildings,
  XCircle,
} from '@phosphor-icons/react';

export function AttendanceLogModal() {
  const { isOpen, activeModal, modalData, closeModal } = useModalStore();

  const isModalOpen = isOpen && activeModal === 'attendance-log';

  if (!isModalOpen) return null;

  const studentName = modalData?.studentName || modalData?.childName || 'Student';
  const acadName = modalData?.acadName || modalData?.title || 'Academy';
  const batchName = modalData?.batchName || modalData?.courtOrVenue || 'Regular Batch';
  const schedule = modalData?.schedule || modalData?.sessionTime || 'Weekly Scheduled Timings';
  const coachName = modalData?.coachName && modalData.coachName !== 'Rajesh Mehra (NIS Certified)'
    ? modalData.coachName
    : 'Assigned Head Coach';
  const phone = modalData?.phone || '9897012345';

  const attended = typeof modalData?.attended === 'number' ? modalData.attended : 0;
  const total = typeof modalData?.total === 'number' && modalData.total > 0 ? modalData.total : 12;
  const percentage = Math.round((attended / total) * 100);

  // Map real recorded attendances from database
  const rawAttendances: any[] = Array.isArray(modalData?.attendances) ? modalData.attendances : [];
  const sessions = rawAttendances.map((att: any, idx: number) => {
    const sessionDate = att.date ? new Date(att.date) : new Date();
    const formattedDate = sessionDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = sessionDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return {
      classNo: rawAttendances.length - idx,
      date: formattedDate,
      time: formattedTime,
      status: att.isPresent ? 'PRESENT' : 'ABSENT',
      note: att.isPresent ? 'Roll call verified on court' : 'Absence recorded by coach',
    };
  });

  const handleMessageAcademy = () => {
    const text = encodeURIComponent(
      `Hi Coach, I am contacting you regarding ${studentName}'s attendance in batch "${batchName}" at ${acadName}.`
    );
    window.open(`https://wa.me/91${phone}?text=${text}`, '_blank');
  };

  return (
    <DialogWrapper
      id="attendance-log-modal"
      isOpen={isModalOpen}
      onClose={closeModal}
      icon={<CalendarCheck size={20} weight="fill" className="text-purple-600" />}
      title="Student Attendance Log"
      subtitle={`${studentName} • ${acadName}`}
      headerGradient="bg-gradient-to-r from-purple-50 to-indigo-50"
    >
      <div className="p-5 space-y-4 text-xs">
        {/* Attendance Summary KPI Card */}
        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
                Official Academy Roll Call
              </span>
              <h3 className="text-base font-extrabold text-white mt-0.5">{batchName}</h3>
              <p className="text-[11px] text-purple-200">{schedule}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-emerald-400">{percentage}%</div>
              <div className="text-[10px] text-purple-200">Attendance Rate</div>
            </div>
          </div>

          <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-purple-200 pt-1 border-t border-white/10">
            <span>
              Attended: <strong className="text-white">{attended}</strong> of{' '}
              <strong className="text-white">{total}</strong> Classes
            </span>
            <span className="flex items-center gap-1 text-emerald-300">
              <ShieldCheck size={14} weight="fill" /> Verified by Head Coach
            </span>
          </div>
        </div>

        {/* Coach Details Tag */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
              <User size={14} weight="bold" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-[11px]">Head Coach: {coachName}</div>
              <div className="text-[10px] text-slate-500">Conducts on-court daily roll call</div>
            </div>
          </div>
          <button
            onClick={handleMessageAcademy}
            className="flex items-center gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold text-[10px] cursor-pointer transition-colors"
          >
            <WhatsappLogo size={13} weight="fill" />
            <span>Chat Coach</span>
          </button>
        </div>

        {/* Detailed Session List */}
        <div>
          <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
            Recorded Session History
          </div>

          {sessions.length > 0 ? (
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {sessions.map((s) => (
                <div
                  key={s.classNo}
                  className="bg-white border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between text-[11px] hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-black text-[10px] flex items-center justify-center shrink-0">
                      #{s.classNo}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {s.date} • {s.time}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{s.note}</div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {s.status === 'PRESENT' ? (
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle size={11} weight="fill" /> Present
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock size={11} weight="bold" /> Leave Notified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                <CalendarCheck size={20} weight="fill" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-xs">No Roll Call Sessions Recorded Yet</h4>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                Classes run on {schedule}. Daily attendance will appear here automatically when Coach {coachName} marks roll call at academy reception.
              </p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="pt-2 border-t border-slate-100 flex gap-2">
          <button
            onClick={closeModal}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </DialogWrapper>
  );
}
