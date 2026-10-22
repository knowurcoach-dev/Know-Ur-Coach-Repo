"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Clock,
  PencilSimple,
  Sparkle,
  Check,
} from '@phosphor-icons/react';

export const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type DayOfWeek = typeof ALL_DAYS[number];

export const DAY_PRESETS: { label: string; days: DayOfWeek[] }[] = [
  { label: 'Mon, Wed, Fri', days: ['Mon', 'Wed', 'Fri'] },
  { label: 'Tue, Thu, Sat', days: ['Tue', 'Thu', 'Sat'] },
  { label: 'Mon - Fri', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  { label: 'Sat, Sun', days: ['Sat', 'Sun'] },
  { label: 'Daily', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
];

export const DURATION_PRESETS = [
  { label: '45 mins', mins: 45 },
  { label: '1 hour', mins: 60 },
  { label: '1h 15m', mins: 75 },
  { label: '1.5 hrs', mins: 90 },
  { label: '2 hours', mins: 120 },
];

export function parseTimeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 960; // 4:00 PM default
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 960;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

export function minutesToTimeString(minutes: number): string {
  const total = (minutes + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mStr = m.toString().padStart(2, '0');
  return `${h12}:${mStr} ${period}`;
}

export const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  // 6:00 AM (360 mins) to 10:00 PM (1320 mins), 15-minute increments
  for (let m = 360; m <= 1320; m += 15) {
    slots.push(minutesToTimeString(m));
  }
  return slots;
})();

export function formatDaysString(days: DayOfWeek[]): string {
  if (!days || days.length === 0) return 'Mon, Wed, Fri';
  if (days.length === 7) return 'Daily';
  const sorted = [...days].sort((a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b));
  if (sorted.length === 5 && sorted.join(',') === 'Mon,Tue,Wed,Thu,Fri') return 'Mon - Fri';
  if (sorted.length === 2 && sorted.join(',') === 'Sat,Sun') return 'Sat, Sun';
  return sorted.join(', ');
}

export function parseScheduleString(raw: string): {
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  isCustom: boolean;
} {
  if (!raw || !raw.trim()) {
    return {
      days: ['Mon', 'Wed', 'Fri'],
      startTime: '4:00 PM',
      endTime: '5:15 PM',
      isCustom: false,
    };
  }

  // Strip category & coach tags
  const clean = raw
    .replace(/•\s*\[Category:\s*[^\]]+\]/gi, '')
    .replace(/•\s*\[Coach:\s*[^\]]+\]/gi, '')
    .replace(/\[Category:\s*[^\]]+\]/gi, '')
    .replace(/\[Coach:\s*[^\]]+\]/gi, '')
    .trim();

  const parts = clean.split('•').map((s) => s.trim());
  if (parts.length >= 2) {
    const daysPart = parts[0];
    const timePart = parts[1];

    const timeMatch = timePart.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*(?:-|–|to)\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (timeMatch) {
      const startNorm = minutesToTimeString(parseTimeStringToMinutes(timeMatch[1]));
      const endNorm = minutesToTimeString(parseTimeStringToMinutes(timeMatch[2]));

      const daysFound: DayOfWeek[] = [];
      const lower = daysPart.toLowerCase();

      if (lower.includes('daily') || lower.includes('all days') || lower.includes('mon - sun') || lower.includes('all week')) {
        daysFound.push(...ALL_DAYS);
      } else if (lower.includes('mon - fri') || lower.includes('weekdays')) {
        daysFound.push('Mon', 'Tue', 'Wed', 'Thu', 'Fri');
      } else if (lower.includes('weekend') || lower.includes('sat, sun') || lower.includes('sat & sun')) {
        daysFound.push('Sat', 'Sun');
      } else {
        ALL_DAYS.forEach((d) => {
          if (lower.includes(d.toLowerCase())) {
            daysFound.push(d);
          }
        });
      }

      if (daysFound.length > 0) {
        return {
          days: daysFound,
          startTime: startNorm,
          endTime: endNorm,
          isCustom: false,
        };
      }
    }
  }

  return {
    days: ['Mon', 'Wed', 'Fri'],
    startTime: '4:00 PM',
    endTime: '5:15 PM',
    isCustom: true,
  };
}

interface BatchSchedulePickerProps {
  value: string;
  onChange: (schedule: string) => void;
  label?: string;
  theme?: 'blue' | 'emerald';
  compact?: boolean;
}

export function BatchSchedulePicker({
  value,
  onChange,
  label = 'Schedule & Class Timings',
  theme = 'blue',
  compact = false,
}: BatchSchedulePickerProps) {
  const initial = useMemo(() => parseScheduleString(value), [value]);

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(initial.days);
  const [startTime, setStartTime] = useState<string>(initial.startTime);
  const [endTime, setEndTime] = useState<string>(initial.endTime);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(initial.isCustom);
  const [customText, setCustomText] = useState<string>(value || '');

  // Keep internal state in sync if value changes externally
  useEffect(() => {
    const parsed = parseScheduleString(value);
    if (!parsed.isCustom) {
      setSelectedDays(parsed.days);
      setStartTime(parsed.startTime);
      setEndTime(parsed.endTime);
      setIsCustomMode(false);
    } else if (value && value.trim()) {
      setCustomText(value);
      setIsCustomMode(true);
    }
  }, [value]);

  const updateSchedule = (days: DayOfWeek[], start: string, end: string) => {
    const daysStr = formatDaysString(days);
    const compiled = `${daysStr} • ${start} - ${end}`;
    onChange(compiled);
  };

  const handleToggleDay = (day: DayOfWeek) => {
    let next: DayOfWeek[];
    if (selectedDays.includes(day)) {
      if (selectedDays.length <= 1) return; // Keep at least one day
      next = selectedDays.filter((d) => d !== day);
    } else {
      next = [...selectedDays, day].sort((a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b));
    }
    setSelectedDays(next);
    setIsCustomMode(false);
    updateSchedule(next, startTime, endTime);
  };

  const handleApplyPreset = (days: DayOfWeek[]) => {
    setSelectedDays(days);
    setIsCustomMode(false);
    updateSchedule(days, startTime, endTime);
  };

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    // If end time is earlier or same as start time, advance end time automatically by 1 hour
    const startMins = parseTimeStringToMinutes(newStart);
    const endMins = parseTimeStringToMinutes(endTime);
    let nextEnd = endTime;
    if (endMins <= startMins) {
      nextEnd = minutesToTimeString(startMins + 75); // 1h 15m default sports slot
      setEndTime(nextEnd);
    }
    setIsCustomMode(false);
    updateSchedule(selectedDays, newStart, nextEnd);
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    setIsCustomMode(false);
    updateSchedule(selectedDays, startTime, newEnd);
  };

  const handleApplyDuration = (mins: number) => {
    const startMins = parseTimeStringToMinutes(startTime);
    const newEnd = minutesToTimeString(startMins + mins);
    setEndTime(newEnd);
    setIsCustomMode(false);
    updateSchedule(selectedDays, startTime, newEnd);
  };

  const handleCustomTextChange = (text: string) => {
    setCustomText(text);
    onChange(text);
  };

  const isEmerald = theme === 'emerald';
  const activeDayClass = isEmerald
    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-extrabold'
    : 'bg-[#0066ff] text-white border-[#0066ff] shadow-2xs font-extrabold';
  const activePresetClass = isEmerald
    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold'
    : 'bg-blue-50 text-blue-800 border-blue-300 font-extrabold';

  const currentDaysString = formatDaysString(selectedDays);
  const activePreset = DAY_PRESETS.find(
    (p) => p.days.length === selectedDays.length && p.days.every((d) => selectedDays.includes(d))
  );

  return (
    <div className="space-y-2.5">
      {/* Header with Title and Mode Toggle */}
      <div className="flex items-center justify-between gap-2">
        <label className="block text-[11px] font-bold text-slate-700">
          {label} <span className="text-rose-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => {
            if (!isCustomMode) {
              setCustomText(`${currentDaysString} • ${startTime} - ${endTime}`);
              setIsCustomMode(true);
            } else {
              setIsCustomMode(false);
              updateSchedule(selectedDays, startTime, endTime);
            }
          }}
          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <PencilSimple size={11} weight="bold" />
          <span>{isCustomMode ? 'Use Interactive Picker' : 'Type Custom Text'}</span>
        </button>
      </div>

      {isCustomMode ? (
        <div className="space-y-1.5">
          <input
            type="text"
            value={customText}
            onChange={(e) => handleCustomTextChange(e.target.value)}
            placeholder="e.g. Mon, Wed, Fri • 4:00 PM - 5:15 PM"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-2xs"
          />
          <p className="text-[10px] text-slate-400">
            Recommended format: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">Days • Start Time - End Time</code>
          </p>
        </div>
      ) : (
        <div className={`space-y-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs ${compact ? 'text-xs' : ''}`}>
          {/* Day Patterns / Quick Presets */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Day Pattern</span>
              <span className="text-[10px] font-bold text-slate-500 normal-case">
                Selected: <strong className="text-slate-800">{currentDaysString}</strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {DAY_PRESETS.map((p) => {
                const isSelected = activePreset?.label === p.label;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p.days)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? activePresetClass
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Individual Day Chips Toggle */}
            <div className="grid grid-cols-7 gap-1 pt-1">
              {ALL_DAYS.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    title={`Toggle ${day}`}
                    className={`py-1.5 px-1 text-center rounded-lg text-xs border transition-all cursor-pointer ${
                      isSelected
                        ? activeDayClass
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slot Row: Start Time & End Time */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1">
                <Clock size={12} weight="bold" /> Class Hours &amp; Duration
              </span>
              <span className="text-emerald-700 font-bold normal-case flex items-center gap-1">
                <Sparkle size={11} weight="fill" />
                {startTime} to {endTime}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Start Time Select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Start Time
                </label>
                <select
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer shadow-2xs"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={`start-${slot}`} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              {/* End Time Select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  End Time
                </label>
                <select
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer shadow-2xs"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={`end-${slot}`} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Duration Shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-bold text-slate-400">Quick Duration:</span>
              {DURATION_PRESETS.map((dur) => (
                <button
                  key={dur.label}
                  type="button"
                  onClick={() => handleApplyDuration(dur.mins)}
                  className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition-colors cursor-pointer border border-slate-200"
                >
                  +{dur.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Formatted Output Badge */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
            <span className="text-[11px] text-slate-500 font-medium">Batch Schedule:</span>
            <span className="font-extrabold text-slate-900 font-mono text-[11px] flex items-center gap-1.5 truncate">
              <CalendarCheck size={14} weight="bold" className={isEmerald ? 'text-emerald-600' : 'text-blue-600'} />
              <span>{currentDaysString} • {startTime} - {endTime}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
