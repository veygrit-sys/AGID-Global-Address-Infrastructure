import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleDashed,
  ShieldAlert,
} from 'lucide-react';
import React from 'react';

import {
  getAddressQualityPublicCopy,
  type AddressQualityDecision,
  type AddressQualityDecisionState,
} from '../lib/addressQualityDecision';
import { cn } from '../lib/utils';

type AddressQualityDecisionBarProps = {
  decision: AddressQualityDecision;
  compact?: boolean;
  language?: string;
};

const STATES: Array<{
  state: AddressQualityDecisionState;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}> = [
  {
    state: 'address-ok',
    icon: CheckCircle2,
    activeClass: 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-emerald-400/20',
  },
  {
    state: 'needs-review',
    icon: CircleDashed,
    activeClass: 'bg-amber-300 text-slate-950 border-amber-200 shadow-amber-300/20',
  },
  {
    state: 'rejected',
    icon: AlertTriangle,
    activeClass: 'bg-orange-400 text-slate-950 border-orange-300 shadow-orange-400/20',
  },
  {
    state: 'restricted',
    icon: Ban,
    activeClass: 'bg-red-500 text-white border-red-400 shadow-red-500/20',
  },
];

const inactiveClass = 'bg-white/[0.045] text-slate-500 border-white/5';

export const AddressQualityDecisionBar: React.FC<AddressQualityDecisionBarProps> = ({
  decision,
  compact = false,
  language,
}) => {
  const activeState = STATES.find(state => state.state === decision.state) || STATES[0];
  const ActiveIcon = activeState.icon;
  const resolvedLanguage = language || (typeof document !== 'undefined' ? document.documentElement.lang : 'en');
  const activeCopy = getAddressQualityPublicCopy(decision, resolvedLanguage);

  return (
    <div
      className="rounded-lg border border-white/10 bg-slate-950/20 p-2"
      aria-label={`Address quality decision: ${activeCopy.label}`}
    >
      <div className="grid grid-cols-4 gap-1" role="list" aria-label="Address quality states">
        {STATES.map(state => {
          const Icon = state.icon;
          const isActive = state.state === decision.state;
          const stateCopy = getAddressQualityPublicCopy({
            state: state.state,
            description: '',
            action: '',
          }, resolvedLanguage);
          return (
            <div
              key={state.state}
              role="listitem"
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                'flex min-h-[34px] items-center justify-center gap-1 rounded-md border px-1.5 text-[7.5px] font-black uppercase tracking-[0.06em] transition-colors',
                isActive ? `${state.activeClass} shadow-lg` : inactiveClass,
              )}
              title={stateCopy.label}
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span className="truncate">{compact ? stateCopy.shortLabel : stateCopy.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-start gap-2">
        <span
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
            decision.state === 'address-ok' && 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
            decision.state === 'needs-review' && 'border-orange-300/30 bg-orange-300/10 text-orange-200',
            decision.state === 'rejected' && 'border-orange-300/30 bg-orange-300/10 text-orange-200',
            decision.state === 'restricted' && 'border-red-400/30 bg-red-500/10 text-red-200',
          )}
          aria-hidden="true"
        >
          {decision.state === 'restricted' ? (
            <ShieldAlert className="h-3.5 w-3.5" />
          ) : (
            <ActiveIcon className="h-3.5 w-3.5" />
          )}
        </span>
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-200">
            {activeCopy.label}
          </div>
          <div className="mt-0.5 text-[8.5px] font-semibold leading-snug text-slate-400">
            {activeCopy.description}
          </div>
          {decision.severity >= 2 && (
            <div className="mt-1 text-[8px] font-bold leading-snug text-amber-200">
              {activeCopy.action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
