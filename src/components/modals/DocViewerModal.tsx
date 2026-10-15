"use client";

import React, { useState, useEffect } from 'react';
import { CoachDocument } from '@/lib/coach-docs';
import {
  X,
  ShieldCheck,
  SealCheck,
  CheckCircle,
  WarningCircle,
  FilePdf,
  FileArrowUp,
  Image as ImageIcon,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsOut,
  DownloadSimple,
  ArrowLeft,
  ArrowRight,
  Printer,
  Check,
  Info,
  Calendar,
  MapPin,
  User,
  Buildings,
} from '@phosphor-icons/react';

interface DocViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  coach: any;
  documents: CoachDocument[];
  initialDocIndex?: number;
  onVerifyDoc?: (docId: string) => void;
  onFlagDoc?: (docId: string, reason: string) => void;
  onQuickApprove?: (coach: any) => void;
  onReferBack?: (coach: any, remarks?: string) => void;
}

export function DocViewerModal({
  isOpen,
  onClose,
  coach,
  documents,
  initialDocIndex = 0,
  onVerifyDoc,
  onFlagDoc,
  onQuickApprove,
  onReferBack,
}: DocViewerModalProps) {
  const [activeIdx, setActiveIdx] = useState(initialDocIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [docStatuses, setDocStatuses] = useState<Record<string, 'VERIFIED' | 'PENDING' | 'REJECTED'>>({});
  const [flagFeedback, setFlagFeedback] = useState<string>('');
  const [showFlagInput, setShowFlagInput] = useState<boolean>(false);

  useEffect(() => {
    setActiveIdx(initialDocIndex);
    setZoomLevel(1);
    setActivePhotoIdx(0);
    setShowFlagInput(false);
  }, [initialDocIndex, isOpen]);

  useEffect(() => {
    if (documents) {
      setDocStatuses((prev) => {
        const next = { ...prev };
        documents.forEach((d) => {
          // If we haven't set a local status yet, or if the server confirms it as VERIFIED, take it
          if (!next[d.id] || d.status === 'VERIFIED') {
            next[d.id] = d.status;
          }
        });
        return next;
      });
    }
  }, [documents]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !documents || documents.length === 0) return null;

  const currentDoc = documents[activeIdx] || documents[0];
  const currentStatus = docStatuses[currentDoc.id] || currentDoc.status;

  const handleMarkVerified = (docId: string) => {
    setDocStatuses((prev) => ({ ...prev, [docId]: 'VERIFIED' }));
    if (onVerifyDoc) onVerifyDoc(docId);
  };

  const handleMarkFlagged = (docId: string, reason: string) => {
    setDocStatuses((prev) => ({ ...prev, [docId]: 'REJECTED' }));
    if (onFlagDoc) onFlagDoc(docId, reason);
    setShowFlagInput(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentDoc.fileUrl || '#';
    link.download = currentDoc.fileName;
    if (currentDoc.fileUrl) {
      link.click();
    } else {
      alert(`Simulating secure download of ${currentDoc.fileName}`);
    }
  };

  const coachName = coach?.headCoachName || coach?.name || 'Head Coach';
  const acadName = coach?.name || 'Sports Academy';
  const locality = coach?.locality || 'Agra';
  const category = (coach?.category || 'Sports').toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 backdrop-blur-md bg-black/70 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-5xl h-[92vh] max-h-[900px] bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-700 text-slate-100 animate-fade-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR: Coach & Document Info */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <ShieldCheck size={22} weight="fill" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight">
                  In-App Document Review Desk
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Compliance Audit
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                <span className="font-bold text-slate-200">{acadName}</span>
                <span>•</span>
                <span>{coachName}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-slate-400">
                  <MapPin size={12} className="text-red-400" /> {locality}
                </span>
              </p>
            </div>
          </div>

          {/* Action buttons & Close */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-700/60 rounded-xl p-1 border border-slate-600/50">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <MagnifyingGlassMinus size={15} weight="bold" />
              </button>
              <span className="text-[11px] font-mono px-2 text-slate-300 font-bold min-w-[42px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
                title="Zoom In"
              >
                <MagnifyingGlassPlus size={15} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-600 rounded-lg transition-colors cursor-pointer ml-0.5"
                title="Reset Zoom"
              >
                <ArrowsOut size={14} weight="bold" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 border border-slate-600 cursor-pointer"
              title="Download Document"
            >
              <DownloadSimple size={15} weight="bold" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-700/70 hover:bg-slate-600 text-slate-400 hover:text-white flex items-center justify-center border border-slate-600 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* DOCUMENT SWITCHER TABS */}
        <div className="px-5 py-2.5 bg-slate-850 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {documents.map((doc, idx) => {
            const isActive = idx === activeIdx;
            const status = docStatuses[doc.id] || doc.status;

            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => {
                  setActiveIdx(idx);
                  setZoomLevel(1);
                  setShowFlagInput(false);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/70 hover:bg-slate-750 hover:text-white'
                }`}
              >
                {doc.type === 'GOVT_ID' && <FilePdf size={15} weight="bold" />}
                {doc.type === 'NIS_CERT' && <SealCheck size={15} weight="bold" />}
                {doc.type === 'VENUE_PHOTOS' && <ImageIcon size={15} weight="bold" />}
                <span>{doc.title}</span>

                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ml-1 ${
                    status === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : status === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {status === 'VERIFIED' ? '✓ Verified' : status === 'REJECTED' ? 'Flagged' : 'Pending'}
                </span>
              </button>
            );
          })}
        </div>

        {/* MAIN VIEWER VIEWPORT */}
        <div className="flex-1 bg-[#0b1329] overflow-auto p-4 sm:p-6 flex items-center justify-center relative select-none">
          <div
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            className="transition-transform duration-150 ease-out max-w-full"
          >
            {/* VIEW 1: GOVT ID CARD (AADHAAR / VOTER ID) */}
            {currentDoc.previewType === 'id_card' && (
              <div className="w-[480px] max-w-[90vw] bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden border-2 border-slate-300 relative font-sans">
                {/* Official Govt ID Header */}
                <div className="bg-gradient-to-r from-orange-500 via-white to-emerald-600 h-2 w-full" />
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-serif text-sm font-black border border-amber-400/30">
                      🏛️
                    </div>
                    <div>
                      <div className="text-[10px] font-extrabold tracking-widest text-slate-700 uppercase">
                        Government of India
                      </div>
                      <div className="text-xs font-black text-slate-900 tracking-tight">
                        Unique Identification Authority • Aadhaar
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                      Govt Verified
                    </span>
                  </div>
                </div>

                {/* ID Card Body */}
                <div className="p-6 grid grid-cols-3 gap-5 items-center">
                  {/* Photo avatar */}
                  <div className="col-span-1 flex flex-col items-center gap-2">
                    <div className="w-28 h-32 rounded-2xl bg-gradient-to-b from-blue-100 to-indigo-100 border-2 border-slate-300 flex flex-col items-center justify-center text-slate-700 shadow-inner overflow-hidden relative">
                      <User size={52} weight="duotone" className="text-slate-500" />
                      <div className="absolute bottom-0 inset-x-0 bg-slate-800/80 text-white text-[9px] font-extrabold text-center py-0.5 uppercase tracking-wider">
                        Official Photo
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Issue: UIDAI-UP
                    </span>
                  </div>

                  {/* Identification Details */}
                  <div className="col-span-2 space-y-2 text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Coach Name / नाम
                      </div>
                      <div className="text-sm font-black text-slate-900">{coachName}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Designation
                        </div>
                        <div className="font-extrabold text-slate-800">Head Coach</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Locality / City
                        </div>
                        <div className="font-extrabold text-slate-800">{locality}, Agra</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Academy Affiliation
                      </div>
                      <div className="font-bold text-slate-800">{acadName}</div>
                    </div>

                    <div className="pt-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Aadhaar / National ID No.
                      </div>
                      <div className="text-base font-black font-mono tracking-wider text-blue-900 bg-blue-50/80 px-2.5 py-1 rounded-xl border border-blue-200 inline-block">
                        {currentDoc.docNumber || 'XXXX-XXXX-4912'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ID Card Footer Watermark */}
                <div className="px-6 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                  <span className="flex items-center gap-1 text-slate-600">
                    <SealCheck size={13} weight="fill" className="text-emerald-600" />
                    Digitally Signed &amp; Attached by Coach Portal
                  </span>
                  <span className="font-mono text-[9px] text-slate-400">UIDAI-DIGILOCKER-HASH-OK</span>
                </div>
              </div>
            )}

            {/* VIEW 2: NIS COACHING CERTIFICATE DIPLOMA */}
            {currentDoc.previewType === 'certificate' && (
              <div className="w-[620px] max-w-[92vw] bg-[#fffdfa] text-slate-900 rounded-3xl shadow-2xl p-7 sm:p-9 border-4 border-[#d4af37] relative font-serif">
                {/* Certificate Background Seal Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                  <SealCheck size={360} weight="fill" />
                </div>

                {/* Ornamental Corners */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#d4af37]" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#d4af37]" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#d4af37]" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#d4af37]" />

                {/* Header */}
                <div className="text-center space-y-1">
                  <div className="text-xs font-sans font-black tracking-widest text-[#996515] uppercase">
                    Sports Authority of India • Ministry of Youth Affairs &amp; Sports
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                    Netaji Subhas National Institute of Sports
                  </h2>
                  <div className="text-xs font-sans font-bold text-slate-500 uppercase tracking-widest">
                    Moti Bagh, Patiala, Punjab • NIS Diploma In Sports Coaching
                  </div>
                </div>

                <div className="w-24 h-0.5 bg-[#d4af37] mx-auto my-4" />

                {/* Recipient Details */}
                <div className="text-center space-y-3 font-sans">
                  <p className="text-xs text-slate-600 italic font-serif">This is to officially certify that</p>
                  <div className="text-xl sm:text-2xl font-black text-blue-950 font-serif tracking-wide underline decoration-[#d4af37] decoration-2 underline-offset-4">
                    {coachName}
                  </div>
                  <p className="text-xs text-slate-700 max-w-md mx-auto leading-relaxed">
                    has successfully completed the prescribed academic &amp; practical coursework and is hereby awarded the
                    <strong className="text-slate-900 font-black"> Post-Graduate Diploma in Coaching</strong> in the specialization of
                  </p>
                  <div className="inline-block bg-[#f8f5ee] text-[#855812] border border-[#d4af37]/50 font-black px-4 py-1.5 rounded-full text-sm uppercase tracking-wider">
                    {category} • Grade A Certification
                  </div>
                </div>

                {/* Credentials & Seals */}
                <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 items-end text-center font-sans">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Registration No.</div>
                    <div className="font-mono text-xs font-black text-slate-800">
                      NIS/PAT/2022/{Math.abs((coach.id || '42').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 100) % 900 + 100)}
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full border-2 border-red-600 text-red-600 flex flex-col items-center justify-center font-bold text-[9px] uppercase shadow-xs rotate-[-8deg]">
                      <span>SAI</span>
                      <span className="font-black text-[7px]">VERIFIED</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Official Stamp</span>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Director / Dean</div>
                    <div className="font-serif italic text-xs font-black text-slate-800">Dr. S. K. Vardhan</div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: VENUE & SAFETY FACILITY PHOTOS */}
            {currentDoc.previewType === 'gallery' && currentDoc.photos && currentDoc.photos.length > 0 && (
              <div className="w-[680px] max-w-[92vw] bg-slate-850 rounded-3xl shadow-2xl p-5 border border-slate-700 space-y-4">
                {/* Photo Viewer Banner */}
                <div className="flex items-center justify-between text-xs">
                  <div className="font-extrabold text-white flex items-center gap-2">
                    <ImageIcon size={16} className="text-blue-400" />
                    <span>{currentDoc.photos[activePhotoIdx]?.title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                    Photo {activePhotoIdx + 1} of {currentDoc.photos.length}
                  </span>
                </div>

                {/* Main Selected Photo */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-inner group">
                  <img
                    src={currentDoc.photos[activePhotoIdx]?.url}
                    alt={currentDoc.photos[activePhotoIdx]?.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-xs">
                    <div className="font-bold">{currentDoc.photos[activePhotoIdx]?.title}</div>
                    <div className="text-[11px] text-slate-300 font-medium">
                      {currentDoc.photos[activePhotoIdx]?.caption}
                    </div>
                  </div>

                  {/* Prev/Next overlay controls */}
                  {currentDoc.photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActivePhotoIdx((curr) =>
                            curr === 0 ? currentDoc.photos!.length - 1 : curr - 1
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <ArrowLeft size={16} weight="bold" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActivePhotoIdx((curr) =>
                            curr === currentDoc.photos!.length - 1 ? 0 : curr + 1
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <ArrowRight size={16} weight="bold" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails strip */}
                <div className="grid grid-cols-4 gap-2.5 pt-1">
                  {currentDoc.photos.map((photo, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setActivePhotoIdx(pIdx)}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        pIdx === activePhotoIdx
                          ? 'border-blue-500 shadow-md scale-102'
                          : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 4: ACTUAL USER-UPLOADED IMAGE OR DOCUMENT */}
            {(currentDoc.previewType === 'image' || currentDoc.previewType === 'pdf' || (currentDoc.fileUrl && !['gallery'].includes(currentDoc.previewType))) && currentDoc.fileUrl && (
              <div className="w-[700px] max-w-[90vw] max-h-[65vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex items-center justify-center p-2">
                {currentDoc.fileUrl.startsWith('data:application/pdf') || currentDoc.fileUrl.endsWith('.pdf') ? (
                  <iframe
                    src={currentDoc.fileUrl}
                    title={currentDoc.title}
                    className="w-full h-[60vh] rounded-xl bg-white"
                  />
                ) : (
                  <img
                    src={currentDoc.fileUrl}
                    alt={currentDoc.title}
                    className="max-w-full max-h-[60vh] object-contain rounded-xl"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM AUDIT & VERIFICATION CONTROLS */}
        <div className="px-5 py-3.5 bg-slate-850 border-t border-slate-750 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">Current Document Audit:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkVerified(currentDoc.id)}
                className={`text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentStatus === 'VERIFIED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60'
                }`}
              >
                <Check size={14} weight="bold" />
                <span>Mark Document Verified</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFlagInput(!showFlagInput)}
                className={`text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentStatus === 'REJECTED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/60'
                }`}
              >
                <WarningCircle size={14} weight="bold" />
                <span>Flag for Re-upload</span>
              </button>
            </div>
          </div>

          {/* Quick Platform Admin Final Actions */}
          <div className="flex items-center gap-2">
            {onReferBack && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReferBack(coach, flagFeedback || 'Please re-upload clear verification documents as flagged in compliance review.');
                }}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                Refer Back Coach
              </button>
            )}

            {onQuickApprove && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onQuickApprove(coach);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-4 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <SealCheck size={15} weight="fill" />
                <span>Approve Application</span>
              </button>
            )}
          </div>
        </div>

        {/* Flag Feedback Drawer / Dropdown */}
        {showFlagInput && (
          <div className="px-5 py-3 bg-rose-950/90 border-t border-rose-800/80 flex flex-wrap items-center gap-3 animate-fade-in shrink-0">
            <span className="text-xs font-bold text-rose-200">Flag Reason:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Document scan is blurry or unreadable',
                'Name on ID does not match registered coach profile',
                'NIS Diploma specialization mismatch',
                'Venue photo does not show first-aid kit or CCTV setup',
              ].map((reason, rIdx) => (
                <button
                  key={rIdx}
                  type="button"
                  onClick={() => handleMarkFlagged(currentDoc.id, reason)}
                  className="text-[11px] bg-rose-900/80 hover:bg-rose-800 text-rose-100 px-2.5 py-1 rounded-lg border border-rose-700 transition-colors cursor-pointer text-left"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
