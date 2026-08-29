import { Info, LoaderCircle, MapPinned, X } from 'lucide-react';
import React from 'react';
import { cn } from '../lib/utils';

export type PostalAreaNoticeModel = {
  status: 'loading' | 'visible' | 'unavailable';
  title: string;
  detail: string;
};

type PostalAreaNoticeProps = {
  model: PostalAreaNoticeModel | null;
  onDismiss: () => void;
};

export const PostalAreaNotice: React.FC<PostalAreaNoticeProps> = ({ model, onDismiss }) => {
  if (!model) return null;
  const Icon = model.status === 'loading'
    ? LoaderCircle
    : model.status === 'visible'
      ? MapPinned
      : Info;
  return (
    <section
      aria-live="polite"
      data-testid="postal-area-notice"
      className={cn(
        'absolute left-3 top-[68px] z-30 flex max-w-[calc(100vw-24px)] items-start gap-3 rounded-2xl border bg-white/95 px-4 py-3 shadow-xl backdrop-blur md:top-[92px] md:max-w-[440px]',
        model.status === 'visible' ? 'border-blue-200' : 'border-slate-200',
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'mt-0.5 h-5 w-5 shrink-0',
          model.status === 'loading' && 'animate-spin text-blue-600',
          model.status === 'visible' && 'text-blue-700',
          model.status === 'unavailable' && 'text-amber-600',
        )}
      />
      <div className="min-w-0 flex-1">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">{model.title}</h2>
        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">{model.detail}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Clear postal area"
        className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </section>
  );
};
