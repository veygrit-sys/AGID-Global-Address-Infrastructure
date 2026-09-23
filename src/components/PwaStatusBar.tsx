import React from 'react';

import { usePwaLifecycle } from '../hooks/usePwaLifecycle';
import { cn } from '../lib/utils';

type PwaStatusBarProps = {
  language?: string;
};

const TONE_CLASS = {
  info: 'border-blue-200 bg-blue-50 text-blue-950 shadow-blue-200/50',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950 shadow-emerald-200/50',
  warning: 'border-amber-200 bg-amber-50 text-amber-950 shadow-amber-200/50',
  danger: 'border-rose-200 bg-rose-50 text-rose-950 shadow-rose-200/50',
} as const;

const ACTION_CLASS = {
  info: 'bg-blue-600 text-white hover:bg-blue-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  warning: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
} as const;

export const PwaStatusBar: React.FC<PwaStatusBarProps> = ({ language }) => {
  const {
    snapshot,
    copy,
    visible,
    installApp,
    dismissInstallPrompt,
    updateApp,
  } = usePwaLifecycle(language);

  if (!visible) return null;

  const primaryAction = snapshot.updateAvailable
    ? updateApp
    : snapshot.installState === 'ready'
      ? installApp
      : undefined;
  const secondaryAction = snapshot.installState === 'ready' ? dismissInstallPrompt : undefined;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex justify-center px-3">
      <div
        className={cn(
          'pointer-events-auto flex max-w-[min(560px,calc(100vw-24px))] items-center gap-3 rounded-2xl border px-3 py-2 shadow-lg backdrop-blur',
          TONE_CLASS[copy.tone],
        )}
        role="status"
        aria-live={snapshot.updateAvailable ? 'assertive' : 'polite'}
      >
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-black uppercase tracking-[0.14em]">
            {copy.title}
          </div>
          <div className="mt-0.5 text-[11px] font-bold leading-4 opacity-80">
            {copy.body}
          </div>
        </div>
        {primaryAction && copy.primaryAction && (
          <button
            type="button"
            onClick={primaryAction}
            className={cn(
              'shrink-0 rounded-xl px-3 py-2 text-[11px] font-black transition-colors',
              ACTION_CLASS[copy.tone],
            )}
          >
            {copy.primaryAction}
          </button>
        )}
        {secondaryAction && copy.secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction}
            className="shrink-0 rounded-xl bg-white/70 px-3 py-2 text-[11px] font-black text-slate-600 transition-colors hover:bg-white"
          >
            {copy.secondaryAction}
          </button>
        )}
      </div>
    </div>
  );
};
