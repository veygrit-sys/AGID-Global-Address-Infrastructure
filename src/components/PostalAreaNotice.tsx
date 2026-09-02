import { Info, LoaderCircle, MapPinned, X } from 'lucide-react';
import React from 'react';
import { cn } from '../lib/utils';

export type PostalAreaNoticeModel = {
  status: 'loading' | 'visible' | 'unavailable';
  title: string;
  detail: string;
  items?: Array<{
    label: string;
    value: string;
    monospace?: boolean;
  }>;
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
        'absolute left-3 top-[68px] z-30 flex max-h-[46vh] max-w-[calc(100vw-24px)] items-start gap-3 overflow-auto rounded-2xl border bg-white/95 px-4 py-3 shadow-xl backdrop-blur md:top-[92px] md:max-h-[calc(100vh-116px)] md:max-w-[560px]',
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
        {model.items?.length ? (
          <dl className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
            {model.items.map(item => (
              <div key={`${item.label}:${item.value}`} className="min-w-0 rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-[9px] font-black uppercase tracking-wider text-slate-400">{item.label}</dt>
                <dd className={cn(
                  'mt-1 break-words text-[11px] font-semibold leading-relaxed text-slate-700',
                  item.monospace && 'font-mono text-[10px]',
                )}>{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
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
