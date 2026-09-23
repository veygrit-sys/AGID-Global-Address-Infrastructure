import { Info, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

type AlertConfig = {
  title: string;
  message: string;
  show: boolean;
};

type ConfirmConfig = {
  title: string;
  message: string;
  onConfirm: () => void;
  show: boolean;
};

export function CustomAlert({ config, onClose }: { config: AlertConfig | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {config?.show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-3xl shadow-2xl z-[301] p-8 text-center border border-slate-100"
          >
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Info className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{config.title}</h3>
            <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">{config.message}</p>
            <button
              onClick={onClose}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              Dismiss
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({ config, onClose }: { config: ConfirmConfig | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {config?.show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-3xl shadow-2xl z-[301] p-8 text-center border border-slate-100"
          >
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{config.title}</h3>
            <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">{config.message}</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={onClose}
                className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  config.onConfirm();
                  onClose();
                }}
                className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
