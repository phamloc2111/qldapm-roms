import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useRoms } from '../../context/RomsContext';

export default function ToastBanner() {
  const { toast, dismissToast } = useRoms();

  if (!toast) return null;

  const styles =
    toast.type === 'error'
      ? 'bg-rose-600 text-white shadow-rose-600/25'
      : toast.type === 'info'
      ? 'bg-slate-800 text-white shadow-slate-900/25'
      : 'bg-emerald-600 text-white shadow-emerald-600/25';

  const Icon =
    toast.type === 'error'
      ? AlertCircle
      : toast.type === 'info'
      ? Info
      : CheckCircle2;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex justify-center sm:justify-end pointer-events-none animate-fade-in">
      <div
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg max-w-md w-full sm:w-auto ${styles}`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium leading-snug flex-1">{toast.message}</span>
        <button
          onClick={dismissToast}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

