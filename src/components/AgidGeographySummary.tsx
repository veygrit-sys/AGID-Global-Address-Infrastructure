import React from 'react';
import { LocalIslandPackLookup } from './LocalIslandPackLookup';
import { territorialTopologyRows } from '../lib/territorialTopologyDisplay';
import { IslandEvidenceLinks } from './IslandEvidenceLinks';
import { islandDisplayRows, isNamedJapaneseRemoteIsland } from '../lib/islandDisplay';
import type { AgidGeographicAssessment } from '../lib/geographicAssessment';

const geographyCopy = {
  en: {
    footprint: { 'manual-pin': 'Selected point', 'device-pin': 'Device location', cell: 'AGID cell' },
    accuracyUnknown: 'Accuracy unknown',
    accuracy: 'Accuracy radius',
    surface: { land: 'Mapped land', water: 'Mapped water', boundary: 'Near a land–water boundary', unknown: 'Surface undetermined' },
    candidates: 'Possible countries or regions',
    related: 'Countries or territories involved',
    unassessed: 'Detailed boundary data unavailable',
    confirm: 'Confirm the region locally',
  },
  ja: {
    footprint: { 'manual-pin': '選択地点', 'device-pin': '端末の現在地', cell: 'AGIDの区画' },
    accuracyUnknown: '測位精度は不明',
    accuracy: '測位誤差の半径',
    surface: { land: '地図上の陸地', water: '地図上の水域', boundary: '陸地と水域の境界付近', unknown: '地表の種別は未判定' },
    candidates: '国・地域の候補',
    related: '地位・国境に関係する国・地域',
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
  const { footprint, surface, regionCandidates, sources, status, island, territorialTopology } = assessment;
  const names = React.useMemo(() => new Intl.DisplayNames([displayLocale], { type: 'region' }), [displayLocale]);
  const formatRegions = (codes: string[]) => codes.map(code =>
    /^[A-Z]{2}$/.test(code) ? names.of(code) || code : code).join(' / ');
  const statusRegions = new Set(assessment.borderNotices?.flatMap(n => n.codes));
  const showCandidates = regionCandidates.length > 0 && (!statusRegions.size || regionCandidates.some(c => !statusRegions.has(c)));
  const islandRows = island ? islandDisplayRows(island, japanese, formatRegions, status === 'needs-confirmation' ? regionCandidates : []) : [];
  const topologyRows = territorialTopology ? territorialTopologyRows(territorialTopology, japanese, formatRegions, island) : [];
  const evidenceRows = [...topologyRows, ...islandRows];
  const credits = [...new Set([
    ...sources.map(item => item.attribution), territorialTopology?.administration?.attribution,
    territorialTopology?.physicalSource?.attribution,
  ].filter(Boolean))];
  return (
    <div aria-live="polite" aria-atomic="true" className="mt-1 border-t border-slate-200 pt-1 text-[11px] leading-4 text-slate-700">
      <p>
        {copy.footprint[footprint.kind]}
        {footprint.kind === 'device-pin' && (
          <> · {footprint.radiusMeters === null ? copy.accuracyUnknown : `${copy.accuracy} ${footprint.radiusMeters.toLocaleString(displayLocale)} m`}</>
        )}
        {status !== 'unassessed' && <> · {copy.surface[surface]}</>}
      </p>
      {!island && (!territorialTopology?.administration || territorialTopology.status !== 'inside') && showCandidates && (
        <dl className="flex flex-wrap gap-x-1.5">
          <dt>{copy.candidates}</dt>
          <dd className="font-semibold">{formatRegions(regionCandidates)}</dd>
        </dl>
      )}
      {assessment.borderNotices?.map(n => <p key={n.id}>
        {japanese ? n.ja : n.name} · {n.kind === 'no-assigned-country'
          ? (japanese ? '住所国の割り当てなし' : 'No assigned address country')
          : (japanese ? '領域の地位・国境を要確認' : 'Territorial status or boundary requires confirmation')}
        {n.codes.length > 0 && <> · {copy.related} {formatRegions(n.codes)}</>}
      </p>)}
      {assessment.adjacentRegions?.length > 0 && <p>
        {japanese ? '境界資料に現れる隣接国・地域' : 'Countries along the mapped boundary'} · {formatRegions(assessment.adjacentRegions)}
      </p>}
      {assessment.mapDisagreement && <p>{japanese ? '行政界の地図資料が一致していません。' : 'The administrative boundary maps differ.'}</p>}
      {evidenceRows.length > 0 && (
        <dl>
          {evidenceRows.map(([label, value]) => (
            <div key={label} className="flex flex-wrap gap-x-1.5">
              <dt>{label}</dt><dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <IslandEvidenceLinks urls={[...(assessment.borderNotices ?? []).map(n => n.url), ...(island?.evidenceUrls ?? []), ...(territorialTopology?.administration?.evidenceUrls ?? [])]} japanese={japanese} />
      {status === 'unassessed' && <p>{copy.unassessed}</p>}
      {status === 'needs-confirmation' && <p>{assessment.borderNotices?.length || island?.status === 'disputed' || island?.status === 'unresolved'
        ? (japanese ? '配送先は受取人の指定を確認してください。' : 'Confirm the postal destination with the recipient.') : copy.confirm}</p>}
      {manualPin && footprint.kind === 'manual-pin' && footprint.radiusMeters === 0 && (
        <LocalIslandPackLookup key={`${manualPin.lat},${manualPin.lon}`}
          lat={manualPin.lat} lon={manualPin.lon} japanese={japanese} formatRegions={formatRegions}
          expectedJapanStatus={island?.status === 'japan-position' ? 'japan-position'
            : island?.status === 'mapped' && isNamedJapaneseRemoteIsland(island) ? 'mapped' : undefined} />
      )}
      {credits.length > 0 && <p className="text-[10px] text-slate-500">{credits.join(' · ')}</p>}
    </div>
  );
}
