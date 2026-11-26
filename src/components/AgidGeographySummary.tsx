import React from 'react';
import { LocalIslandPackLookup } from './LocalIslandPackLookup';
import { islandDisplayRows } from '../lib/islandDisplay';
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

export function AgidGeographySummary({ assessment, locale, manualPin }: {
  assessment: AgidGeographicAssessment;
  locale: string;
  manualPin?: { lat: number; lon: number };
}) {
  const japanese = locale.startsWith('ja');
  const copy = geographyCopy[japanese ? 'ja' : 'en'];
  const displayLocale = Intl.DisplayNames.supportedLocalesOf([locale.replaceAll('_', '-')])[0] || 'en';
  const { footprint, surface, regionCandidates, sources, status, island } = assessment;
  const names = React.useMemo(() => new Intl.DisplayNames([displayLocale], { type: 'region' }), [displayLocale]);
  const formatRegions = (codes: string[]) => codes.map(code =>
    /^[A-Z]{2}$/.test(code) ? names.of(code) || code : code).join(' / ');
  const islandRows = island ? islandDisplayRows(island, japanese, formatRegions, status === 'needs-confirmation' ? regionCandidates : []) : [];
  const evidenceUrls = [...new Set(island?.evidenceUrls)].filter(url => url.startsWith('https://'));
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
      {!island && regionCandidates.length > 0 && (
        <dl className="flex flex-wrap gap-x-1.5">
          <dt>{copy.candidates}</dt>
          <dd className="font-semibold">{formatRegions(regionCandidates)}</dd>
        </dl>
      )}
      {islandRows.length > 0 && (
        <dl>
          {islandRows.map(([label, value]) => (
            <div key={label} className="flex flex-wrap gap-x-1.5">
              <dt>{label}</dt><dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {island && evidenceUrls.length > 0 && (
        <details className="mt-1">
          <summary className="cursor-pointer">{japanese ? '表示の根拠' : 'Sources for this display'}</summary>
          {evidenceUrls.map(url => (
            <a key={url} className="block break-all underline" href={url} target="_blank" rel="noreferrer">{url}</a>
          ))}
        </details>
      )}
      {status === 'unassessed' && <p>{copy.unassessed}</p>}
      {status === 'needs-confirmation' && <p>{island?.status === 'disputed' || island?.status === 'unresolved'
        ? (japanese ? '配送先は受取人の指定を確認してください。' : 'Confirm the postal destination with the recipient.') : copy.confirm}</p>}
      {manualPin && footprint.kind === 'manual-pin' && footprint.radiusMeters === 0 && (
        <LocalIslandPackLookup key={`${manualPin.lat},${manualPin.lon}`}
          lat={manualPin.lat} lon={manualPin.lon} japanese={japanese} formatRegions={formatRegions} japanPolicy={island?.status === 'japan-position'} />
      )}
      {credits.length > 0 && <p className="text-[10px] text-slate-500">{credits.join(' · ')}</p>}
    </div>
  );
}
