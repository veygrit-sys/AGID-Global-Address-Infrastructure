import { matchBundledIsland } from './islandPolicy';
import { islandDisplayName } from './islandDisplay';
import type { SearchResultFeature } from '../types/navigation';

/** Replace an external map's country line at a reviewed territorial exception. */
export function islandSearchLabel(lat: number, lon: number, locale: string): string | undefined {
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon)) return undefined;
  const island = matchBundledIsland(lat, lon);
  if (!island || island.status === 'mapped') return undefined;
  const japanese = locale.startsWith('ja');
  const name = islandDisplayName(island, japanese);
  const country = island.status === 'japan-position'
    ? (japanese ? '日本' : 'Japan')
    : (island.status === 'disputed'
      ? (japanese ? '領有権の主張が競合' : 'Competing territorial claims')
      : (japanese ? '所属を要確認' : 'Affiliation undetermined'));
  return [name, country, `${lat.toFixed(5)}, ${lon.toFixed(5)}`].filter(Boolean).join(' · ');
}

export function mapSearchDisplayResults(results: SearchResultFeature[], locale: string) {
  return results.map(result => {
    if (result.type === 'saved_qr' || result.source === 'local_qrs') return result;
    const label = islandSearchLabel(parseFloat(result.lat), parseFloat(result.lon), locale);
    return label ? { ...result, display_name: label } : result;
  });
}
