import { ImageUp,QrCode,ScanLine,X } from 'lucide-react';
import { AnimatePresence,motion } from 'motion/react';
import React from 'react';

interface QrReaderActionScreenProps {
  show: boolean;
  onClose: () => void;
  onStartCamera: () => void;
  onPickImage: () => void;
}

export const QrReaderActionScreen: React.FC<QrReaderActionScreenProps> = ({
  show,
  onClose,
  onStartCamera,
  onPickImage,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[490] flex items-stretch justify-center bg-slate-950/70 p-0 pointer-events-auto md:items-center md:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 backdrop-blur-sm"
          />
          <motion.section
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-2xl md:h-auto md:rounded-3xl"
            aria-label="QR reader actions"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight text-slate-900">QR Reader</h2>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Select Input</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close QR reader actions"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-center gap-2 px-4 py-4">
              <button
                type="button"
                onClick={onStartCamera}
                className="flex w-full items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-left text-blue-700 transition-all hover:border-blue-200 hover:bg-blue-100 active:scale-[0.99]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <ScanLine className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-black text-slate-900">Camera Scan</span>
                  <span className="block text-[9px] font-black uppercase tracking-widest text-blue-500">Open Camera</span>
                </span>
              </button>

              <button
                type="button"
                onClick={onPickImage}
                className="flex w-full items-center gap-3 rounded-xl border border-purple-100 bg-purple-50 px-3 py-3 text-left text-purple-700 transition-all hover:border-purple-200 hover:bg-purple-100 active:scale-[0.99]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <ImageUp className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-black text-slate-900">Import QR Image</span>
                  <span className="block text-[9px] font-black uppercase tracking-widest text-purple-500">Choose File</span>
                </span>
              </button>
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
};
