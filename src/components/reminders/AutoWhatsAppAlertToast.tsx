import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { MessageSquare, ExternalLink, X, Check, BellRing, Smartphone, ShieldCheck } from 'lucide-react';

export const AutoWhatsAppAlertToast: React.FC = () => {
  const lastAlert = useAppStore(s => s.lastAutoFiredWhatsApp);
  const dismiss = useAppStore(s => s.dismissLastAutoFiredWhatsApp);
  const [secondsRemaining, setSecondsRemaining] = useState(12);

  const alertId = lastAlert?.id;

  useEffect(() => {
    if (!alertId) return;
    setSecondsRemaining(12);

    const dismissTimer = setTimeout(() => {
      dismiss();
    }, 12000);

    const countdownInterval = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearTimeout(dismissTimer);
      clearInterval(countdownInterval);
    };
  }, [alertId, dismiss]);

  if (!lastAlert) return null;

  const handleOpenWhatsApp = () => {
    if (typeof window !== 'undefined') {
      window.open(lastAlert.deepLinkUrl, '_blank', 'noopener,noreferrer');
    }
    dismiss();
  };

  const typeConfig: Record<string, { label: string; bg: string; icon: string }> = {
    medication: { label: 'Medication Administration', bg: 'bg-teal-500', icon: '💊' },
    exercise: { label: 'Physical Activity & Mobility', bg: 'bg-emerald-500', icon: '🏃' },
    appointment: { label: 'Hospital Appointment', bg: 'bg-blue-500', icon: '🏥' },
    task: { label: 'Care Plan Task', bg: 'bg-amber-500', icon: '📋' },
  };

  const config = typeConfig[lastAlert.type] || { label: 'Clinical Reminder', bg: 'bg-teal-600', icon: '🔔' };

  return (
    <aside
      aria-label="Automated WhatsApp reminder notification"
      className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] animate-in slide-in-from-bottom-5 fade-in duration-300"
    >
      <div className="bg-[#0a2540] text-white rounded-3xl shadow-2xl border-2 border-emerald-400/40 relative overflow-hidden backdrop-blur-md">
        {/* Visual Notification Status Bar */}
        <div className="bg-emerald-600 text-slate-950 px-4 py-1 text-[10px] font-black uppercase tracking-wider flex items-center justify-between border-b border-emerald-400/30">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping inline-block" />
            <span>STATUS BAR: AUTO WHATSAPP DM DISPATCHED</span>
          </div>
          <span className="font-mono text-[9px] text-emerald-950">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Animated Glow Accent */}
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="p-4 sm:p-5">
          {/* Top Header */}
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/30">
                <MessageSquare className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Auto-Fired WhatsApp DM
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({secondsRemaining}s)
                </span>
              </div>
              <h4 className="text-sm font-black text-white truncate">
                {config.icon} {lastAlert.reminderTitle}
              </h4>
            </div>
          </div>

          <button
            onClick={dismiss}
            className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Details */}
        <div className="mt-3 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-200 relative z-10 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-emerald-300 font-medium">
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Target DM: {lastAlert.phone}</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-[10px] font-bold">
              Automated Trigger
            </span>
          </div>

          <p className="text-[11px] text-slate-300 line-clamp-2 italic bg-black/20 p-2 rounded-xl border border-white/5 font-mono">
            "{lastAlert.message.split('\n').filter(Boolean).slice(0, 3).join(' • ')}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-3.5 flex items-center gap-2 relative z-10">
          <button
            onClick={handleOpenWhatsApp}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
          >
            <MessageSquare className="w-4 h-4 text-slate-950" />
            <span>Open WhatsApp Direct Chat</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          <button
            onClick={dismiss}
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
          >
            Dismiss
          </button>
        </div>

        </div>

        {/* Countdown Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-1000 ease-linear"
            style={{ width: `${(secondsRemaining / 12) * 100}%` }}
          />
        </div>
      </div>
    </aside>
  );
};
