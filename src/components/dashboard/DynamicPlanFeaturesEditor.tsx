"use client";

import React, { useState } from 'react';
import { PlanFeature } from '@/lib/plan-features';
import {
  Plus,
  Trash,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  ListPlus,
  X,
  Sparkle,
} from '@phosphor-icons/react';

export interface DynamicPlanFeaturesEditorProps {
  label: string;
  features: PlanFeature[];
  onChange: (features: PlanFeature[]) => void;
  accentColor?: 'emerald' | 'blue' | 'purple';
  placeholder?: string;
}

export function DynamicPlanFeaturesEditor({
  label,
  features,
  onChange,
  accentColor = 'blue',
  placeholder = 'Enter plan benefit or feature...',
}: DynamicPlanFeaturesEditorProps) {
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Accent styling tokens
  const accentClasses = {
    emerald: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      addBtn: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300',
      focusRing: 'focus:ring-emerald-500 focus:border-emerald-500',
      includedText: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    },
    blue: {
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      addBtn: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-300',
      focusRing: 'focus:ring-blue-500 focus:border-blue-500',
      includedText: 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200',
    },
    purple: {
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      addBtn: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-300',
      focusRing: 'focus:ring-purple-500 focus:border-purple-500',
      includedText: 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200',
    },
  }[accentColor];

  const handleUpdateText = (index: number, text: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], text };
    onChange(updated);
  };

  const handleToggleIncluded = (index: number) => {
    const updated = [...features];
    updated[index] = {
      ...updated[index],
      included: updated[index].included === false ? true : false,
    };
    onChange(updated);
  };

  const handleToggleHighlight = (index: number) => {
    const updated = [...features];
    updated[index] = {
      ...updated[index],
      highlight: !updated[index].highlight,
    };
    onChange(updated);
  };

  const handleAddPoint = (insertIndex?: number) => {
    const newPoint: PlanFeature = { text: '', included: true };
    if (insertIndex !== undefined && insertIndex >= 0) {
      const updated = [...features];
      updated.splice(insertIndex + 1, 0, newPoint);
      onChange(updated);
    } else {
      onChange([...features, newPoint]);
    }
  };

  const handleRemovePoint = (index: number) => {
    const updated = features.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...features];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === features.length - 1) return;
    const updated = [...features];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onChange(updated);
  };

  const handleApplyBulkPaste = () => {
    if (!bulkText.trim()) {
      setShowBulkPaste(false);
      return;
    }
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const newFeatures: PlanFeature[] = lines.map((line) => {
      const isExcluded =
        line.startsWith('-') ||
        line.startsWith('✕') ||
        line.startsWith('❌') ||
        line.toLowerCase().startsWith('no:');
      const text = line
        .replace(/^[-+✕✓*•❌✅]\s*/, '')
        .replace(/^(no|excluded):\s*/i, '')
        .trim();
      return {
        text,
        included: !isExcluded,
        highlight: text.startsWith('#1') || text.includes('Golden'),
      };
    });

    onChange([...features, ...newFeatures]);
    setBulkText('');
    setShowBulkPaste(false);
  };

  const includedCount = features.filter((f) => f.included !== false).length;
  const excludedCount = features.filter((f) => f.included === false).length;

  return (
    <div className="space-y-2.5 pt-1">
      {/* Header with counter and bulk paste toggle */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
          <span>{label}</span>
          <span
            className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border ${accentClasses.badge}`}
          >
            {features.length} {features.length === 1 ? 'Point' : 'Points'}
            {excludedCount > 0 ? ` (${includedCount} ✓, ${excludedCount} ✗)` : ''}
          </span>
        </label>

        <button
          type="button"
          onClick={() => setShowBulkPaste(!showBulkPaste)}
          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline decoration-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ListPlus size={13} weight="bold" />
          <span>{showBulkPaste ? 'Cancel Bulk Paste' : 'Bulk Paste Lines'}</span>
        </button>
      </div>

      {/* Bulk Paste Area */}
      {showBulkPaste && (
        <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-2 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-600">
              Paste features below (1 per line, prefix with - for excluded):
            </span>
            <button
              type="button"
              onClick={() => setShowBulkPaste(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={12} weight="bold" />
            </button>
          </div>
          <textarea
            rows={4}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"Instant WhatsApp inquiry alerts\nFull student roster\n- Top of Area search ranking"}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowBulkPaste(false)}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 rounded-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyBulkPaste}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-md cursor-pointer shadow-xs"
            >
              Append Points
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Points List */}
      <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5">
        {features.length === 0 ? (
          <div className="p-4 bg-white border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold">No feature points added yet.</p>
            <p className="text-[10px] text-slate-400">
              Click &quot;+ Add Feature Point&quot; below to add your first point.
            </p>
          </div>
        ) : (
          features.map((feature, idx) => {
            const isIncluded = feature.included !== false;

            return (
              <div
                key={idx}
                className={`group flex items-center gap-1.5 p-1.5 bg-white border rounded-xl transition-all shadow-2xs hover:border-slate-300 ${
                  !isIncluded
                    ? 'border-slate-200 bg-slate-50/60'
                    : feature.highlight
                    ? 'border-purple-200 bg-purple-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Index Number */}
                <span className="text-[10px] font-mono font-bold text-slate-400 w-5 text-center shrink-0">
                  {idx + 1}.
                </span>

                {/* Included / Excluded Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleIncluded(idx)}
                  title={isIncluded ? 'Included (click to mark as excluded)' : 'Excluded (click to mark as included)'}
                  className={`p-1 rounded-lg border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    isIncluded
                      ? accentClasses.includedText
                      : 'text-slate-400 bg-slate-100 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  {isIncluded ? (
                    <CheckCircle size={14} weight="fill" />
                  ) : (
                    <XCircle size={14} weight="bold" />
                  )}
                  <span className="text-[9px] font-bold hidden sm:inline">
                    {isIncluded ? 'Yes' : 'No'}
                  </span>
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={feature.text}
                  onChange={(e) => handleUpdateText(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPoint(idx);
                    }
                  }}
                  placeholder={placeholder}
                  className={`flex-1 min-w-0 px-2 py-1 bg-transparent border-0 text-xs font-semibold focus:outline-none focus:ring-0 ${
                    isIncluded
                      ? feature.highlight
                        ? 'text-purple-950 font-bold'
                        : 'text-slate-800'
                      : 'text-slate-400 line-through'
                  }`}
                />

                {/* Highlight Toggle (Optional for special bold points) */}
                <button
                  type="button"
                  onClick={() => handleToggleHighlight(idx)}
                  title={feature.highlight ? 'Highlighted point' : 'Normal point (click to highlight)'}
                  className={`p-1 rounded-md text-xs transition-colors cursor-pointer shrink-0 ${
                    feature.highlight
                      ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                      : 'text-slate-300 hover:text-slate-500'
                  }`}
                >
                  <Sparkle size={13} weight={feature.highlight ? 'fill' : 'bold'} />
                </button>

                {/* Reorder Up */}
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveUp(idx)}
                  title="Move up"
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer disabled:cursor-default transition-colors shrink-0"
                >
                  <ArrowUp size={12} weight="bold" />
                </button>

                {/* Reorder Down */}
                <button
                  type="button"
                  disabled={idx === features.length - 1}
                  onClick={() => handleMoveDown(idx)}
                  title="Move down"
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer disabled:cursor-default transition-colors shrink-0"
                >
                  <ArrowDown size={12} weight="bold" />
                </button>

                {/* Delete Point */}
                <button
                  type="button"
                  onClick={() => handleRemovePoint(idx)}
                  title="Remove point"
                  className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-colors shrink-0"
                >
                  <Trash size={13} weight="bold" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Point Action */}
      <button
        type="button"
        onClick={() => handleAddPoint()}
        className={`w-full py-2 px-3 border border-dashed rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${accentClasses.addBtn}`}
      >
        <Plus size={14} weight="bold" />
        <span>Add Feature Point</span>
      </button>
    </div>
  );
}
