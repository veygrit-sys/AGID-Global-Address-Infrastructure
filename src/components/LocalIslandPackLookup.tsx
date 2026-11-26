import React from 'react';
import type { AgidIslandAssessment } from '../lib/islandPolicy';
import { islandDisplayRows } from '../lib/islandDisplay';
import { IslandEvidenceLinks } from './IslandEvidenceLinks';

type LocalResult = {
  island: AgidIslandAssessment | null;
  physicalIslandId?: number | string;
  physicalSource?: string;
  physicalVersion?: string;
};

const endpoint = '/api/local/island-pack';
const localRequest: RequestInit = { mode: 'same-origin', credentials: 'omit', redirect: 'error', cache: 'no-store', referrerPolicy: 'no-referrer' };

export function isLoopbackMap(protocol: string, hostname: string) {
  return (protocol === 'http:' || protocol === 'https:') && ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
}

export function LocalIslandPackLookup({ lat, lon, japanese, formatRegions, expectedJapanStatus }: {
  lat: number; lon: number; japanese: boolean; expectedJapanStatus?: 'mapped' | 'japan-position';
  formatRegions: (codes: string[]) => string;
}) {
  const [enabled, setEnabled] = React.useState(false);
  const [result, setResult] = React.useState<LocalResult | null>(null);
  const [state, setState] = React.useState<'idle' | 'loading' | 'error'>('idle');
  const pending = React.useRef<AbortController | null>(null);
  React.useEffect(() => {
    if (!isLoopbackMap(window.location.protocol, window.location.hostname)) return;
    const controller = new AbortController();
    void fetch(endpoint, { ...localRequest, signal: controller.signal })
      .then(async response => {
        if (response.ok && (await response.json())?.enabled === true && !controller.signal.aborted) setEnabled(true);
      }).catch(() => {});
    return () => { controller.abort(); pending.current?.abort(); };
  }, []);

  async function lookup() {
    if (!enabled || pending.current || !isLoopbackMap(window.location.protocol, window.location.hostname)) return;
    const controller = new AbortController();
    pending.current = controller;
    setState('loading');
    try {
      const response = await fetch(endpoint, {
        ...localRequest, method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ kind: 'pin', lat, lon }),
      });
      if (!response.ok) throw new Error('Detailed layer unavailable');
      const data = await response.json() as LocalResult;
      if (!data || (data.island !== null && (!Array.isArray(data.island?.countryCodes)
        || !['mapped','japan-position','disputed','unresolved'].includes(data.island.status)))) throw new Error('Invalid island response');
      if (expectedJapanStatus && data.island && (data.island.status !== expectedJapanStatus
        || data.island.countryCodes.length !== 1 || data.island.countryCodes[0] !== 'JP'
        || data.island.sovereignCodes?.some(code => code !== 'JP'))) throw new Error('Incompatible island geography');
      if (!controller.signal.aborted) { setResult(data); setState('idle'); }
    } catch {
      if (!controller.signal.aborted) setState('error');
    } finally {
      if (pending.current === controller) pending.current = null;
    }
  }

  if (!enabled) return null;
  return (
    <div className="mt-1 border-t border-slate-200 pt-1">
      {result ? (
        <div aria-live="polite">
          <p className="font-semibold">{japanese ? 'ローカル高精細版の照合結果' : 'Local detailed island lookup'}</p>
          {result.island ? (
            <dl>
              {islandDisplayRows(result.island, japanese, formatRegions).map(([label, value]) => (
                <div key={label} className="flex flex-wrap gap-x-1.5"><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          ) : <p>{japanese ? 'この地点では島の所属を確認できません。' : 'Island affiliation could not be established here.'}</p>}
          {result.physicalSource ? (
            <p>{japanese ? '島の形状資料' : 'Physical island layer'} · {[result.physicalSource, result.physicalVersion, result.physicalIslandId].filter(v => v !== undefined && v !== null).join(' · ')}</p>
          ) : <p>{japanese ? '高精細版の島形状に一致する地物はありません。' : 'No physical island feature matched in the detailed layer.'}</p>}
          {result.island && <p>{[result.island.source, result.island.version].filter(Boolean).join(' · ')}</p>}
          <IslandEvidenceLinks urls={result.island?.evidenceUrls} japanese={japanese} />
        </div>
      ) : (
        <>
          <button type="button" disabled={state === 'loading'} onClick={() => void lookup()} className="underline disabled:opacity-60">
            {japanese ? 'このピンをローカル高精細版で照合' : 'Check this pin in the local detailed island layer'}
          </button>
          {state === 'error' && <p role="status">{japanese ? 'ローカルデータの照合に失敗しました。' : 'The local lookup failed.'}</p>}
        </>
      )}
    </div>
  );
}
