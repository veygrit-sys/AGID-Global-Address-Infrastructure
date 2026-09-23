import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, 'App.tsx'), 'utf8');
const layersMenuSource = readFileSync(join(here, 'components', 'MapLayersMenu.tsx'), 'utf8');
const mapEngineSource = readFileSync(join(here, 'lib', 'mapEngine.ts'), 'utf8');
const bandwidthSource = readFileSync(join(here, 'lib', 'grid', 'mapBandwidthMode.ts'), 'utf8');
const source = `${appSource}\n${layersMenuSource}\n${mapEngineSource}\n${bandwidthSource}`;

test('low bandwidth mode is persisted and exposed from the map layers menu', () => {
  assert.match(source, /MAP_BANDWIDTH_MODE_STORAGE_KEY/);
  assert.match(appSource, /const \[mapBandwidthMode, setMapBandwidthMode\] = useState<MapBandwidthMode>/);
  assert.match(appSource, /localStorage\.setItem\(MAP_BANDWIDTH_MODE_STORAGE_KEY, mapBandwidthMode\)/);
  assert.match(layersMenuSource, /role="switch"/);
  assert.match(layersMenuSource, /Low Bandwidth/);
  assert.match(appSource, /isLowBandwidthMapMode=\{isLowBandwidthMapMode\}/);
});

test('low bandwidth mode keeps initial map rendering vector, flat, and cache constrained', () => {
  assert.match(appSource, /style: resolveBandwidthSafeMapStyle\(mapStyle, mapBandwidthMode\)/);
  assert.match(appSource, /pitch: lowBandwidthMapModeRef\.current \? 0 : mapPitch/);
  assert.match(appSource, /projection: lowBandwidthMapModeRef\.current \? 'mercator' : projection/);
  assert.match(mapEngineSource, /maxParallelImageRequests: lowBandwidth \? 4 : 16/);
  assert.match(mapEngineSource, /refreshExpiredTiles: !lowBandwidth/);
  assert.match(mapEngineSource, /maxTileCacheSize: lowBandwidth \? 48 : 192/);
});

test('low bandwidth mode blocks satellite, terrain, raster, and overpass overlays', () => {
  assert.match(bandwidthSource, /'satellite'/);
  assert.match(bandwidthSource, /'terrain-dem'/);
  assert.match(bandwidthSource, /'overpass-poi'/);
  assert.match(appSource, /resolveBandwidthSafeMapStyle\(url, mapBandwidthMode\)/);
  assert.match(appSource, /shouldLoadMapOverlayInBandwidthMode\('terrain-dem', mapBandwidthMode\)/);
  assert.match(appSource, /shouldLoadMapOverlayInBandwidthMode\('bathymetry-raster', mapBandwidthMode\)/);
  assert.match(appSource, /shouldLoadMapOverlayInBandwidthMode\('arcgis-raster', mapBandwidthMode\)/);
  assert.match(appSource, /shouldLoadMapOverlayInBandwidthMode\('risk-overlays', mapBandwidthMode\)/);
  assert.match(appSource, /shouldLoadMapOverlayInBandwidthMode\('transport-hubs', mapBandwidthMode\)/);
});

test('low bandwidth mode disables heavy layer controls in the layer sheet', () => {
  assert.match(layersMenuSource, /const heavyMapControlDisabled = isLowBandwidthMapMode/);
  assert.match(layersMenuSource, /disabled=\{styleDisabled\}/);
  assert.match(layersMenuSource, /style\.id === 'satellite'/);
  assert.match(layersMenuSource, /disabled=\{heavyMapControlDisabled\}/);
  assert.match(layersMenuSource, /Vector only/);
});
