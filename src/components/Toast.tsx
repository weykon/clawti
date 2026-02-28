'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useUIStore, type ToastType } from '../store/useUIStore';

const ICONS: Record<ToastType, React.ReactNode> = {
  error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
  success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
};

const BG: Record<ToastType, string> = {
  error: 'bg-red-950/90 border-red-500/30',
  success: 'bg-emerald-950/90 border-emerald-500/30',
  info: 'bg-slate-900/90 border-slate-500/30',
};

export function ToastContainer() {
  const toasts = useUIStore(s => s.toasts);
  const dismissToast = useUIStore(s => s.dismissToast);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl w-full ${BG[toast.type]}`}
          >
            {ICONS[toast.type]}
            <span className="text-sm font-medium text-white flex-1">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
