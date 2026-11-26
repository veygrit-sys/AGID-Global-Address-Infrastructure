import { convertFilter } from '@maplibre/maplibre-gl-style-spec';
import type { FilterSpecification, LayerSpecification, Map as MapLibreMap, Marker } from 'maplibre-gl';
import data from '../data/japaneseIslandView.json';
import ordinaryIslands from '../data/japaneseRemoteIslands.json';

// Each label anchor is inside a reviewed land polygon. The rectangles below are
// only cartographic decluttering windows and never produce a country assignment.
export const islandMapLabels = [
  { subgroup: 'etorofu', ja: '択捉島', en: 'Etorofu', at: [147.834879, 44.968093] },
  { subgroup: 'kunashiri', ja: '国後島', en: 'Kunashiri', at: [145.917271, 44.137232] },
  { subgroup: 'shikotan', ja: '色丹島', en: 'Shikotan', at: [146.745690, 43.792019] },
  { subgroup: 'habomai', ja: '歯舞群島', en: 'Habomai Islands', at: [146.128556, 43.501759] },
  { subgroup: 'takeshima', ja: '竹島', en: 'Takeshima', at: [131.864725, 37.242029] },
  { subgroup: 'senkaku', ja: '尖閣諸島', en: 'Senkaku Islands', at: [123.474965, 25.742862] },
  { subgroup: 'okinotorishima', ja: '沖ノ鳥島', en: 'Okinotorishima', at: [136.069763, 20.425255] },
  { subgroup: 'minamitorishima', ja: '南鳥島', en: 'Minamitorishima', at: [153.980548, 24.289194] },
  { subgroup: 'nishinoshima', ja: '西之島', en: 'Nishinoshima', at: [140.880136, 27.245431] },
] as const;

const expanded = ({ bbox: [w, s, e, n] }: { bbox: number[] }) => [w - 0.025, s - 0.025, e + 0.025, n + 0.025];
const viewpointWindows = data.groups.map(expanded);
const windows = [...viewpointWindows, ...ordinaryIslands.groups.map(expanded)];
const ordinaryNames = new Set(ordinaryIslands.groups.map(group => group.name));
function featureWindows(boxes: number[][]): GeoJSON.MultiPolygon {
  return { type: 'MultiPolygon', coordinates: boxes.map(([w,s,e,n]) => [[[w,s],[e,s],[e,n],[w,n],[w,s]]]) };
}
const placeWindows = featureWindows(windows);
const politicalBoundaryWindows = featureWindows(viewpointWindows);

export function viewportShowsJapanIslands(west: number, south: number, east: number, north: number) {
  if (east < west) east += 360;
  return windows.some(([w, s, e, n]) => {
    const shift = 360 * Math.round((west + east - w - e) / 720);
    return s <= north && n >= south && w + shift <= east && e + shift >= west;
  });
}

/** OpenMapTiles place and administrative layers used by Bright, Liberty, Dark and Positron. */
export function japaneseIslandStyleFilter(layer: LayerSpecification): FilterSpecification | undefined {
  if (!('source-layer' in layer)) return;
  let mask: FilterSpecification;
  if (layer['source-layer'] === 'boundary' && layer.type === 'line') {
    // Also remove tile-clipped lines that cross the window with both endpoints outside.
    mask = ['>', ['distance', politicalBoundaryWindows], 0];
  } else if (layer['source-layer'] === 'place' && layer.type === 'symbol') {
    mask = ['!', ['all', ['within', placeWindows], ['in', ['get', 'class'],
      ['literal', ['continent','country','state','province','region','county','island','islet','archipelago']]]]];
  } else return;
  return layer.filter ? ['all', convertFilter(layer.filter), mask] : mask;
}

export function installJapaneseIslandMapStyle(map: MapLibreMap, MarkerType: typeof Marker) {
  const original = new Map<string, FilterSpecification | undefined>();
  let active = false;
  const markers = new Map<string, Marker>();
  let credit: HTMLAnchorElement | undefined;
  function update() {
    if (!map.isStyleLoaded() && !active) return;
    const bounds = map.getBounds();
    const visible = viewportShowsJapanIslands(bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth());
    if (visible !== active) {
      active = visible;
      if (visible) {
        for (const layer of map.getStyle().layers) {
          const mask = japaneseIslandStyleFilter(layer);
          if (!mask) continue;
          original.set(layer.id, 'filter' in layer ? layer.filter : undefined);
          map.setFilter(layer.id, mask);
        }
      } else {
        for (const [id, filter] of original) if (map.getLayer(id)) map.setFilter(id, filter ?? null);
        original.clear();
      }
    }
    for (const { subgroup, ja, en, at } of islandMapLabels) {
      const show = visible && map.getZoom() >= 7 && bounds.contains([at[0], at[1]]);
      const marker = markers.get(subgroup);
      if (show && !marker) {
        const label = document.createElement('span');
        label.textContent = `${ja} / ${en} · JP`;
        label.className = 'pointer-events-none rounded bg-white/95 px-1 text-[11px] font-semibold text-slate-900 shadow';
        label.title = ordinaryNames.has(subgroup)
          ? ordinaryIslands.manifest.attribution
          : '日本政府の領土見解に基づく表示 / Japan’s territorial position';
        markers.set(subgroup, new MarkerType({ element: label, anchor: 'bottom' }).setLngLat([at[0], at[1]]).addTo(map));
      } else if (!show && marker) {
        marker.remove();
        markers.delete(subgroup);
      }
    }
    if (markers.size && !credit) {
      credit = document.createElement('a');
      credit.href = data.manifest.sourceUrl;
      credit.textContent = data.manifest.attribution;
      credit.target = '_blank';
      credit.rel = 'noreferrer';
      credit.className = 'absolute bottom-6 right-1 z-10 rounded bg-white/95 px-1 text-[9px] text-slate-700 underline';
      map.getContainer().append(credit);
    } else if (!markers.size && credit) {
      credit.remove();
      credit = undefined;
    }
  }
  function onStyleLoad() {
    active = false;
    original.clear();
    update();
  }
  function cleanup() {
    for (const marker of markers.values()) marker.remove();
    markers.clear();
    credit?.remove();
    map.off('style.load', onStyleLoad);
    map.off('idle', update);
    map.off('moveend', update);
  }
  map.on('style.load', onStyleLoad);
  map.on('idle', update);
  map.on('moveend', update);
  map.once('remove', cleanup);
}
