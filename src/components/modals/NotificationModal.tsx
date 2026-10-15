"use client";

import React from 'react';
import { usePersona } from '@/context/PersonaContext';
import { useAuth } from '@/hooks/useAuth';
import { DialogWrapper } from './DialogWrapper';
import {
  Bell,
  TennisBall,
  Gift,
  Trophy,
  ShieldCheck,
  CheckCircle,
  Clock,
  SealCheck,
  CreditCard,
  User,
  EnvelopeSimple,
  Check,
} from '@phosphor-icons/react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const {
    notifications,
    unreadCount,
    markAllNotificationsRead,
    showToast,
  } = usePersona();
  const { isAuthenticated, isCoach, isParent } = useAuth();

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    showToast('All notifications marked as read');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'kyc':
        return <ShieldCheck size={16} weight="fill" className="text-blue-600 shrink-0" />;
      case 'subscription':
        return <CreditCard size={16} weight="fill" className="text-purple-600 shrink-0" />;
      case 'lead':
        return <User size={16} weight="fill" className="text-emerald-600 shrink-0" />;
      case 'booking':
        return <TennisBall size={16} weight="fill" className="text-amber-600 shrink-0" />;
      case 'competition':
        return <Trophy size={16} weight="fill" className="text-orange-600 shrink-0" />;
      default:
        return <Bell size={16} weight="fill" className="text-blue-600 shrink-0" />;
    }
  };

  const formatRelativeTime = (dateStr?: string | Date) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <DialogWrapper
      id="notification-modal"
      isOpen={isOpen}
      onClose={onClose}
      icon={<Bell size={20} weight="fill" />}
      title="Notifications & Updates"
      subtitle={
        unreadCount > 0
          ? `${unreadCount} new update${unreadCount > 1 ? 's' : ''}`
          : 'Activity & Compliance Updates'
      }
      headerGradient="bg-gradient-to-r from-blue-50 to-indigo-50"
    >
      <div id="notifications-list" className="p-4 space-y-2.5 text-xs max-h-[60vh] overflow-y-auto">
        {/* Render real user notifications if authenticated and available */}
        {isAuthenticated && notifications && notifications.length > 0 ? (
          notifications.map((n) => {
            const isUnread = !n.isRead;
            return (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                  isUnread
                    ? 'bg-blue-50/80 border-blue-200 shadow-2xs'
                    : 'bg-white border-slate-200 opacity-90'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 leading-snug">
                    {getNotificationIcon(n.type)}
                    <span>{n.title}</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                  {n.message}
                </p>
              </div>
            );
          })
        ) : isAuthenticated ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CheckCircle size={24} weight="bold" />
            </div>
            <div className="text-xs font-bold text-slate-800">You're All Caught Up!</div>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              No new alerts right now. Important updates regarding KYC status, verification, and bookings will appear here.
            </p>
          </div>
        ) : (
          /* Guest platform view */
          <div className="py-6 px-4 text-center space-y-3 bg-slate-50/70 rounded-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <Bell size={24} weight="fill" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-slate-900">Sign In for Personalized Alerts</h4>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                Log in to track your Free Trial reference bookings, upcoming batch schedules, tournament registration confirmations, and KYC verification updates.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                window.location.href = '/login';
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              Sign In to Your Account
            </button>
          </div>
        )}
      </div>

      {isAuthenticated && notifications && notifications.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2">
          <button
            onClick={handleMarkAllRead}
            className="w-full bg-[#0a1128] text-white font-extrabold py-2.5 rounded-xl text-xs hover:bg-blue-900 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check size={14} weight="bold" />
            <span>Mark All as Read</span>
          </button>
        </div>
      )}
    </DialogWrapper>
  );
}
