import { CheckCircle2,Info,ShieldAlert } from 'lucide-react';
import React from 'react';
import { getAddressQualitySummary } from '../lib/addressQualitySummary';
import type { AddressValidationResult } from '../lib/addressValidation';
import { cn } from '../lib/utils';

type AddressQualitySummaryProps = {
  validation: AddressValidationResult;
};

const QUALITY_TONE: Record<AddressValidationResult['quality']['mode'], string> = {
  'postal-verified': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  'geo-verified': 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  'no-postal-code': 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  'partial-postal': 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  'manual-required': 'bg-orange-500/10 text-orange-300 border-orange-500/20',
};

export const AddressQualitySummary: React.FC<AddressQualitySummaryProps> = ({ validation }) => {
  const summary = getAddressQualitySummary(validation);
  const isStrong = validation.status === 'verified';

  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/20 px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-1.5 text-[8px] font-black uppercase tracking-wider text-slate-400">
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5', QUALITY_TONE[validation.quality.mode])}>
          {isStrong ? <CheckCircle2 className="h-2.5 w-2.5" /> : <ShieldAlert className="h-2.5 w-2.5" />}
          {summary.label}
        </span>
        <span className="rounded-full border border-white/5 bg-white/5 px-2 py-0.5">
          {summary.confidenceLabel}
        </span>
        {summary.postalLabel && (
          <span className="rounded-full border border-white/5 bg-white/5 px-2 py-0.5">
            {summary.postalLabel}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex gap-1.5 text-[9px] font-semibold leading-snug text-slate-300/90">
        <Info className="mt-0.5 h-2.5 w-2.5 shrink-0 text-slate-500" />
        <span>{summary.explanation}</span>
      </div>
      <div className="mt-1 text-[8px] font-bold leading-snug text-slate-500">
        {summary.modeDescription}
      </div>
      {summary.warning && (
        <div className="mt-1 text-[8px] font-bold leading-snug text-amber-300/90">
          {summary.warning}
        </div>
      )}
    </div>
  );
};
