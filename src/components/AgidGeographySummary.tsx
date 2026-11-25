import React from 'react';
import type { AgidGeographicAssessment } from '../lib/geographicAssessment';

const geographyCopy = {
  en: {
    footprint: { 'manual-pin': 'Selected point', 'device-pin': 'Device location', cell: 'AGID cell' },
    accuracyUnknown: 'Accuracy unknown',
    accuracy: 'Accuracy radius',
    surface: { land: 'Mapped land', water: 'Mapped water', boundary: 'Near a land–water boundary', unknown: 'Surface undetermined' },
    candidates: 'Possible countries or regions',
    unassessed: 'Detailed boundary data unavailable',
    confirm: 'Confirm the region locally',
  },
  ja: {
    footprint: { 'manual-pin': '選択地点', 'device-pin': '端末の現在地', cell: 'AGIDの区画' },
    accuracyUnknown: '測位精度は不明',
    accuracy: '測位誤差の半径',
    surface: { land: '地図上の陸地', water: '地図上の水域', boundary: '陸地と水域の境界付近', unknown: '地表の種別は未判定' },
    candidates: '国・地域の候補',
    unassessed: '詳細な境界データがありません',
    confirm: '現地の国・地域を確認してください',
  },
} as const;

export function AgidGeographySummary({ assessment, locale }: {
  assessment: AgidGeographicAssessment;
  locale: string;
}) {
  const copy = geographyCopy[locale.startsWith('ja') ? 'ja' : 'en'];
  const displayLocale = Intl.DisplayNames.supportedLocalesOf([locale.replaceAll('_', '-')])[0] || 'en';
  const { footprint, surface, regionCandidates, sources, status } = assessment;
  const names = React.useMemo(() => new Intl.DisplayNames([displayLocale], { type: 'region' }), [displayLocale]);
  const credits = [...new Set(sources.map(item => item.attribution).filter(Boolean))];
  return (
    <div aria-live="polite" aria-atomic="true" className="mt-1 border-t border-slate-200 pt-1 text-[11px] leading-4 text-slate-700">
      <p>
        {copy.footprint[footprint.kind]}
        {footprint.kind === 'device-pin' && (
          <> · {footprint.radiusMeters === null ? copy.accuracyUnknown : `${copy.accuracy} ${footprint.radiusMeters.toLocaleString(displayLocale)} m`}</>
        )}
        {status !== 'unassessed' && <> · {copy.surface[surface]}</>}
      </p>
      {regionCandidates.length > 0 && (
        <dl className="flex flex-wrap gap-x-1.5">
          <dt>{copy.candidates}</dt>
          <dd className="font-semibold">{regionCandidates.map(code => /^[A-Z]{2}$/.test(code) ? names.of(code) || code : code).join(' / ')}</dd>
        </dl>
      )}
      {status === 'unassessed' && <p>{copy.unassessed}</p>}
      {status === 'needs-confirmation' && <p>{copy.confirm}</p>}
      {credits.length > 0 && <p className="text-[10px] text-slate-500">{credits.join(' · ')}</p>}
    </div>
  );
}
