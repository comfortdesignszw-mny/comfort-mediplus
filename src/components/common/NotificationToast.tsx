import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const activeToast = useAppStore(s => s.activeToast);
  const hideToast = useAppStore(s => s.hideToast);

  if (!activeToast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-teal-500 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    error: <XCircle className="w-4 h-4 text-rose-500 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-50/95 text-emerald-950',
    info: 'border-teal-500/30 bg-teal-50/95 text-teal-950',
    warning: 'border-amber-500/30 bg-amber-50/95 text-amber-950',
    error: 'border-rose-500/30 bg-rose-50/95 text-rose-950',
  };

  const statusBars = {
    success: 'bg-emerald-600 text-white',
    info: 'bg-teal-700 text-white',
    warning: 'bg-amber-500 text-amber-950 font-black',
    error: 'bg-rose-600 text-white',
  };

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
      <div className={`pointer-events-auto rounded-2xl shadow-2xl border backdrop-blur-md overflow-hidden ${borders[activeToast.type]}`}>
        {/* All notifications status bar */}
        <div className={`px-3 py-0.5 text-[9px] font-black uppercase tracking-wider flex items-center justify-between ${statusBars[activeToast.type]}`}>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>STATUS BAR: {activeToast.type} NOTIFICATION</span>
          </div>
          <span className="font-mono text-[8px] opacity-80">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {icons[activeToast.type]}
            <p className="text-xs font-semibold leading-snug">{activeToast.message}</p>
          </div>
          <button
            onClick={hideToast}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-black/5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
