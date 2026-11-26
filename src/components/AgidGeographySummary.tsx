import React from 'react';
import { LocalIslandPackLookup } from './LocalIslandPackLookup';
import { territorialTopologyRows } from '../lib/territorialTopologyDisplay';
import { IslandEvidenceLinks } from './IslandEvidenceLinks';
import { islandDisplayRows, isNamedJapaneseRemoteIsland } from '../lib/islandDisplay';
import { assessAgidGeographyWithFrontiers, type AgidGeographicAssessment, type AgidGeographyInput } from '../lib/geographicAssessment';

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

export function AgidGeographySummary({ assessment: base, input, locale, manualPin }: {
  assessment: AgidGeographicAssessment;
  input?: AgidGeographyInput;
  locale: string;
  manualPin?: { lat: number; lon: number };
}) {
  const [detail, setDetail] = React.useState<{base: AgidGeographicAssessment; result?: AgidGeographicAssessment; failed?: boolean}>();
  React.useEffect(() => {
    let active = true;
    if (input) {
      assessAgidGeographyWithFrontiers(input, base).then(result => {
        if (active) setDetail({base, result});
      }).catch(() => { if (active) setDetail({base, failed: true}); });
    }
    return () => { active = false; };
  }, [input, base]);
  const assessment = detail?.base === base && detail.result ? detail.result : base;
  const japanese = locale.startsWith('ja');
  const copy = geographyCopy[japanese ? 'ja' : 'en'];
  const displayLocale = Intl.DisplayNames.supportedLocalesOf([locale.replaceAll('_', '-')])[0] || 'en';
  const { footprint, surface, regionCandidates, sources, status, island, territorialTopology } = assessment;
  const names = React.useMemo(() => new Intl.DisplayNames([displayLocale], { type: 'region' }), [displayLocale]);
  const formatRegions = (codes: string[]) => codes.map(code =>
    /^[A-Z]{2}$/.test(code) ? names.of(code) || code : code).join(' / ');
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
      {!island && (!territorialTopology?.administration || territorialTopology.status !== 'inside') && regionCandidates.length > 0 && (
        <dl className="flex flex-wrap gap-x-1.5">
          <dt>{copy.candidates}</dt>
          <dd className="font-semibold">{formatRegions(regionCandidates)}</dd>
        </dl>
      )}
      {detail?.base === base && detail.failed && <p>{japanese ? '詳細な国境線を読み込めませんでした。' : 'Detailed frontier data could not be loaded.'}</p>}
      {assessment.administrativeArea?.joint && <p>{japanese ? '共同管轄区域' : 'Joint administrative area'} · {formatRegions(assessment.administrativeArea.codes)}</p>}
      {assessment.frontiers?.map(f => <p key={f.id}>{f.name} · {f.classification}</p>)}
      {assessment.administrativeSourceDisagreement && <p>{japanese ? 'この地点では国境資料の判定が分かれます。' : 'Boundary sources differ at this location.'}</p>}
      {evidenceRows.length > 0 && (
        <dl>
          {evidenceRows.map(([label, value]) => (
            <div key={label} className="flex flex-wrap gap-x-1.5">
              <dt>{label}</dt><dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <IslandEvidenceLinks urls={[...(island?.evidenceUrls ?? []), ...(territorialTopology?.administration?.evidenceUrls ?? [])]} japanese={japanese} />
      {status === 'unassessed' && <p>{copy.unassessed}</p>}
      {status === 'needs-confirmation' && <p>{island?.status === 'disputed' || island?.status === 'unresolved'
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
