import { matchBundledIsland } from './islandPolicy';
import { islandDisplayName, isNamedJapaneseRemoteIsland } from './islandDisplay';
import { assessAgidGeography } from './geographicAssessment';
import { selectedGeographyInput } from './agidSelection';
import type { AgidIslandAssessment } from './islandPolicy';
import type { AGIDResult } from './agid';
import type { SearchResultFeature } from '../types/navigation';

function islandAffiliationLabel(island: AgidIslandAssessment | undefined, locale: string) {
  if (!island) return undefined;
  const officialRemote = isNamedJapaneseRemoteIsland(island);
  if (island.status === 'mapped' && !officialRemote) return undefined;
  const japanese = locale.startsWith('ja');
  const name = islandDisplayName(island, japanese);
  if (officialRemote && island.status === 'unresolved') {
    return [name, japanese ? '中心点の島は日本' : 'Island at the center mapped to Japan'].join(' · ');
  }
  const country = island.status === 'japan-position' || (island.status === 'mapped' && officialRemote)
    ? (japanese ? '日本' : 'Japan')
    : (island.status === 'disputed'
      ? (japanese ? '領有権の主張が競合' : 'Competing territorial claims')
      : (japanese ? '所属を要確認' : 'Affiliation undetermined'));
  return [name, country].filter(Boolean).join(' · ');
}

/** A saved map label uses the selected cell or device footprint, just like the map panel. */
export function selectedMapReferences(result: AGIDResult, locale: string) {
  const { island, status, territorialTopology } = assessAgidGeography(selectedGeographyInput(result));
  const japanese = locale.startsWith('ja');
  let label = islandAffiliationLabel(island, locale);
  if (label && status === 'needs-confirmation' && (island?.status === 'japan-position' || isNamedJapaneseRemoteIsland(island))) {
    label += japanese ? ' · 位置を要確認' : ' · Confirm the location';
  }
  let regionLabel = label ?? result.regionName;
  const area = territorialTopology?.administration;
  if (!label && area) {
    if (territorialTopology.status === 'inside') {
      const names = new Intl.DisplayNames([locale.replaceAll('_', '-')], { type: 'region' });
      regionLabel = [japanese ? area.nameJa : area.name, names.of(area.code) || area.code].join(' · ');
    } else {
      regionLabel = japanese ? '位置を要確認' : 'Confirm the location';
    }
  }
  return { islandReference: label, regionLabel };
}

export function selectedIslandReference(result: AGIDResult, locale: string) {
  return selectedMapReferences(result, locale).islandReference;
}

/** Replace an external map's country line at a reviewed territorial exception. */
export function islandSearchLabel(lat: number, lon: number, locale: string): string | undefined {
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon)) return undefined;
  const label = islandAffiliationLabel(matchBundledIsland(lat, lon), locale);
  return label && `${label} · ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

export function mapSearchDisplayResults(results: SearchResultFeature[], locale: string) {
  return results.map(result => {
    if (result.type === 'saved_qr' || result.source === 'local_qrs') return result;
    const label = islandSearchLabel(parseFloat(result.lat), parseFloat(result.lon), locale);
    return label ? { ...result, display_name: label } : result;
  });
}
