import assert from 'node:assert/strict';
import { existsSync,readdirSync,readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath,pathToFileURL } from 'node:url';

import { hydrateAddressFormat } from './address_formats/addressFormatCommon';

const here = dirname(fileURLToPath(import.meta.url));
const addressFormatDir = join(here, 'address_formats');
const polarModulePath = join(here, 'polarOpenGeoSources.ts');

const POLAR_COMMON_NATURAL_SOURCE_IDS = [
  'nsidc-polar-data',
  'gebco-bathymetry',
  'gmrt-topography',
  'marine-regions',
  'protected-planet-wdpa',
  'gbif-occurrence',
  'obis-marine-biodiversity',
] as const;

const ANTARCTIC_NATURAL_SOURCE_IDS = [
  'scar-add',
  'scar-cga',
  'quantarctica',
  'rema-antarctica',
  'bedmap3-antarctica',
  'ibcso-southern-ocean',
  'measures-antarctic-grounding-line',
  'ats-antarctic-protected-areas',
] as const;

const ANTARCTIC_FACILITY_SOURCE_IDS = [
  'comnap-antarctic-facilities',
  'bas-antarctic-station-map',
] as const;

const ARCTIC_NATURAL_SOURCE_IDS = [
  'arcticdem',
  'ibcao-arctic-ocean',
  'glims-glacier-db',
  'npolar-data-centre',
] as const;

const GREENLAND_NATURAL_SOURCE_IDS = [
  'greenland-gimp',
] as const;

function findAddressFormatPath(countryCode: string, dir = addressFormatDir): string | null {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findAddressFormatPath(countryCode, fullPath);
      if (found) return found;
    } else if (entry.isFile() && entry.name === `${countryCode}.json`) {
      return fullPath;
    }
  }
  return null;
}

function loadOpenSourceIds(countryCode: string): { topLevel: string[]; rules: string[] } {
  const filePath = findAddressFormatPath(countryCode);
  assert.ok(filePath, `${countryCode}.json should exist under nested address formats`);
  const format = JSON.parse(readFileSync(filePath, 'utf8')) as {
    openSourceIds?: string[];
    addressRules?: { openSourceIds?: string[] };
  };
  const hydrated = hydrateAddressFormat(format);

  return {
    topLevel: hydrated.openSourceIds ?? [],
    rules: hydrated.addressRules?.openSourceIds ?? [],
  };
}

test('polar open geodata registry exists and registers natural geography sources', async () => {
  assert.ok(existsSync(polarModulePath), 'polarOpenGeoSources.ts should centralize polar source metadata');

  const moduleUrl = pathToFileURL(polarModulePath).href;
  const polarSources = await import(moduleUrl) as {
    POLAR_OPEN_GEO_SOURCES: Record<string, { url: string; kind: string }>;
    ANTARCTIC_FACILITY_OPEN_SOURCE_IDS: readonly string[];
    POLAR_NATURAL_OPEN_SOURCE_IDS: readonly string[];
    POLAR_REGION_CODES: readonly string[];
    getPolarOpenSourceIds: (countryCode: string) => string[];
  };

  const expectedSourceIds = [
    ...POLAR_COMMON_NATURAL_SOURCE_IDS,
    ...ANTARCTIC_NATURAL_SOURCE_IDS,
    ...ANTARCTIC_FACILITY_SOURCE_IDS,
    ...ARCTIC_NATURAL_SOURCE_IDS,
    ...GREENLAND_NATURAL_SOURCE_IDS,
  ];

  for (const sourceId of expectedSourceIds) {
    const source = polarSources.POLAR_OPEN_GEO_SOURCES[sourceId];
    assert.ok(source, `${sourceId} should be registered as a polar open geodata source`);
    assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
  }

  assert.ok(polarSources.POLAR_REGION_CODES.includes('AQ'), 'AQ should be covered by polar source metadata');
  assert.ok(polarSources.POLAR_REGION_CODES.includes('HM'), 'HM should be covered by polar source metadata');
  assert.ok(polarSources.POLAR_REGION_CODES.includes('GL'), 'GL should be covered by polar source metadata');
  assert.deepEqual(polarSources.ANTARCTIC_FACILITY_OPEN_SOURCE_IDS, ANTARCTIC_FACILITY_SOURCE_IDS);
  assert.ok(polarSources.getPolarOpenSourceIds('AQ').includes('rema-antarctica'));
  assert.ok(polarSources.getPolarOpenSourceIds('AQ').includes('comnap-antarctic-facilities'));
  assert.ok(polarSources.getPolarOpenSourceIds('HM').includes('australian-antarctic-program-himi'));
  assert.ok(polarSources.getPolarOpenSourceIds('HM').includes('scar-cga'));
  assert.ok(polarSources.getPolarOpenSourceIds('GL').includes('greenland-gimp'));
});

test('polar and subpolar address JSON files expose mountain sea and nature sources', () => {
  const requiredByCode: Record<string, readonly string[]> = {
    AQ: [...POLAR_COMMON_NATURAL_SOURCE_IDS, ...ANTARCTIC_NATURAL_SOURCE_IDS, ...ANTARCTIC_FACILITY_SOURCE_IDS],
    TF: [...POLAR_COMMON_NATURAL_SOURCE_IDS, ...ANTARCTIC_NATURAL_SOURCE_IDS],
    BV: [...POLAR_COMMON_NATURAL_SOURCE_IDS, ...ANTARCTIC_NATURAL_SOURCE_IDS],
    GS: [...POLAR_COMMON_NATURAL_SOURCE_IDS, ...ANTARCTIC_NATURAL_SOURCE_IDS],
    HM: ['australian-antarctic-program-himi', ...POLAR_COMMON_NATURAL_SOURCE_IDS, ...ANTARCTIC_NATURAL_SOURCE_IDS],
    GL: [...POLAR_COMMON_NATURAL_SOURCE_IDS, ...ARCTIC_NATURAL_SOURCE_IDS, ...GREENLAND_NATURAL_SOURCE_IDS],
    SJ: [...POLAR_COMMON_NATURAL_SOURCE_IDS, ...ARCTIC_NATURAL_SOURCE_IDS],
    SJ_SVA: [...POLAR_COMMON_NATURAL_SOURCE_IDS, ...ARCTIC_NATURAL_SOURCE_IDS],
    SJ_JAN: [...POLAR_COMMON_NATURAL_SOURCE_IDS, ...ARCTIC_NATURAL_SOURCE_IDS],
  };

  for (const [countryCode, sourceIds] of Object.entries(requiredByCode)) {
    const openSourceIds = loadOpenSourceIds(countryCode);

    for (const sourceId of sourceIds) {
      assert.ok(openSourceIds.topLevel.includes(sourceId), `${countryCode} should expose ${sourceId}`);
      assert.ok(openSourceIds.rules.includes(sourceId), `${countryCode} addressRules should expose ${sourceId}`);
    }
  }
});

test('antarctic research station JSON exposes source-attributed base candidates', () => {
  const stationDataPath = join(here, 'antarcticResearchStations.json');
  assert.ok(existsSync(stationDataPath), 'antarcticResearchStations.json should exist');

  const data = JSON.parse(readFileSync(stationDataPath, 'utf8')) as {
    datasetId: string;
    sourceIds: string[];
    facilities: Array<{
      id: string;
      name: string;
      type: string;
      seasonality: string;
      status: string;
      insideAntarcticTreatyArea: boolean;
      coordinates: { lat: number; lon: number };
      sourceIds: string[];
    }>;
  };

  assert.equal(data.datasetId, 'antarctic-research-facilities');
  assert.ok(data.sourceIds.includes('comnap-antarctic-facilities'));
  assert.ok(data.sourceIds.includes('scar-cga'));
  assert.ok(data.sourceIds.includes('bas-antarctic-station-map'));
  assert.ok(data.facilities.length >= 80, 'station dataset should include broad Antarctic facility coverage');

  const ids = new Set<string>();
  for (const facility of data.facilities) {
    assert.ok(!ids.has(facility.id), `${facility.id} should be unique`);
    ids.add(facility.id);
    assert.ok(facility.sourceIds.includes('comnap-antarctic-facilities'));
    assert.ok(Number.isFinite(facility.coordinates.lat));
    assert.ok(Number.isFinite(facility.coordinates.lon));
    assert.ok(facility.coordinates.lat >= -90 && facility.coordinates.lat <= -50);
    assert.ok(facility.coordinates.lon >= -180 && facility.coordinates.lon <= 180);
    assert.ok(['open', 'temporarily-closed'].includes(facility.status));
    assert.ok(['seasonal', 'year-round'].includes(facility.seasonality));
  }

  for (const name of ['McMurdo', 'Amundsen-Scott South Pole', 'Rothera', 'Syowa', 'Casey']) {
    assert.ok(
      data.facilities.some(facility => facility.name.includes(name)),
      `${name} should be available as an Antarctic station/base candidate`,
    );
  }

  assert.ok(
    data.facilities.filter(facility => facility.insideAntarcticTreatyArea).length >= 80,
    'most records should be inside the Antarctic Treaty Area',
  );
});
