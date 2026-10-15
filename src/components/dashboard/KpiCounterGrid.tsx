"use client";

import React from 'react';

export interface KpiMetric {
  label: string;
  value: string;
  valueColor: string;
  sublabel?: string;
}

interface KpiCounterGridProps {
  metrics?: KpiMetric[];
}

export function KpiCounterGrid({ metrics }: KpiCounterGridProps) {
  const defaultMetrics: KpiMetric[] = [
    {
      label: 'Students',
      value: '14',
      valueColor: 'text-yellow-400',
    },
    {
      label: 'New Leads',
      value: '12',
      valueColor: 'text-white',
    },
    {
      label: 'Revenue',
      value: '₹34.2K',
      valueColor: 'text-emerald-300',
    },
    {
      label: '38 Reviews',
      value: '4.9★',
      valueColor: 'text-amber-300',
    },
  ];

  const items = metrics || defaultMetrics;

  return (
    <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-white/15 text-center">
      {items.map((m, idx) => (
        <div key={idx} className="bg-white/10 rounded-xl p-1.5 backdrop-blur-xs">
          <div className={`text-sm font-extrabold ${m.valueColor}`}>
            {m.value}
          </div>
          <div className="text-[8px] text-emerald-100 font-semibold tracking-tight">
            {m.label}
          </div>
        </div>
      ))}
    </div>
  );
}
