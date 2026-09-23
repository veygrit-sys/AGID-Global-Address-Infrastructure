import { AlertTriangle, BadgeCheck, Route, Truck } from 'lucide-react';
import React from 'react';

import { formatPublicConfidenceBand } from '../lib/publicDecisionDisplay';
import { cn } from '../lib/utils';
import type { CarNavigationDestination } from '../services/NavigationDestinationService';

type DeliveryStopCandidatePanelProps = {
  candidate: CarNavigationDestination | null;
  routingMode: string;
  appLanguage: string;
  lowBandwidth: boolean;
};

const METHOD_LABELS: Record<CarNavigationDestination['method'], { ja: string; en: string }> = {
  'parking-entrance': { ja: '駐車場入口', en: 'Parking entrance' },
  parking: { ja: '駐車場', en: 'Parking' },
  driveway: { ja: '車道接続', en: 'Driveway' },
  'service-road': { ja: 'サービス道路', en: 'Service road' },
  'nearest-road': { ja: '最寄り道路', en: 'Nearest road' },
  original: { ja: '元のAGID点', en: 'Original AGID point' },
};

function sourceLabel(source: string) {
  if (source.includes('parking_entrance')) return 'OSM parking entrance';
  if (source.includes('parking')) return 'OSM parking';
  if (source.includes('service-road')) return 'OSM service road';
  if (source.includes('road')) return 'OSM road';
  if (source.includes('agid')) return 'AGID';
  return source || 'open data';
}

export function DeliveryStopCandidatePanel({
  candidate,
  routingMode,
  appLanguage,
  lowBandwidth,
}: DeliveryStopCandidatePanelProps) {
  if (routingMode !== 'driving' || !candidate) return null;

  const isJapanese = appLanguage.toLowerCase().startsWith('ja');
  const method = METHOD_LABELS[candidate.method] || METHOD_LABELS.original;
  const confidence = formatPublicConfidenceBand(candidate.confidence, appLanguage);
  const warning = candidate.warnings[0];
  const source = sourceLabel(candidate.source || candidate.sources[0] || '');

  return (
    <aside
      aria-label={isJapanese ? '配送停車候補' : 'Delivery stop candidate'}
      className={cn(
        'pointer-events-auto absolute left-3 top-[154px] z-[62] max-w-[calc(100vw-1.5rem)] rounded-xl border border-blue-100 bg-white/95 p-3 text-slate-900 shadow-xl shadow-slate-950/10 backdrop-blur',
        'sm:left-auto sm:right-16 sm:top-24 sm:w-80',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Truck className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
            {isJapanese ? '車が止まれる点' : 'Vehicle stop point'}
          </p>
          <p className="truncate text-sm font-black">
            {isJapanese ? method.ja : method.en}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-black text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1">
              <Route className="h-3 w-3" aria-hidden="true" />
              {Math.round(candidate.distanceMeters)}m
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
              <BadgeCheck className="h-3 w-3" aria-hidden="true" />
              {isJapanese ? '信頼度' : 'Confidence'} {confidence}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-1">
              {source}
            </span>
            {lowBandwidth && (
              <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">
                AGID / {isJapanese ? '住所候補優先' : 'address candidates first'}
              </span>
            )}
          </div>
          {warning && (
            <p className="mt-2 flex gap-1.5 text-[10px] font-bold leading-4 text-amber-700">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{warning}</span>
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
