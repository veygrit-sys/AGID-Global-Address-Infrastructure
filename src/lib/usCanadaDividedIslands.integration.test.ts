import assert from 'node:assert/strict';
import { test } from 'node:test';
import { packPointResult, type PackHit } from '../../scripts/national-island-supplement';
import { encodeAGID, encodeAGID16, getAGIDCellKey } from './agid';
import { resolveAgidLocal } from './agidLocalResolver';
import { assessAgidGeography } from './geographicAssessment';
import { territorialTopologyRows } from './territorialTopologyDisplay';

// Québec's gazetteer gives the Canadian point and identifies the US section.
// https://toponymie.gouv.qc.ca/ct/ToposWeb/Fiche.aspx?no_seq=141213
// The southern point falls inside both the USGS NHD island and the land excluded
// from the Census TIGER/Line Lake Memphremagog water polygon (Orleans County, VT).
const interiors = [
  { name: 'Province Island, Québec', lat: 45.00867, lon: -72.23235, country: 'CA' },
  { name: 'Province Island, Vermont', lat: 45.00431, lon: -72.231, country: 'US' },
  // Dry in both NRCan NHN 05NFC00 and USGS NHD Lake Metigoshe 2166435.
  { name: 'Lake Metigoshe island, North Dakota', lat: 48.998450, lon: -100.354330, country: 'US' },
] as const;

// IBC West Line monument 571 is on dry land, 19 m from the USGS shoreline.
// https://www.internationalboundarycommission.org/uploads/maps/11-west_line_qc-vt/west%20line%20qc-vt%20%28french%29.pdf
const monument = { lat: 45.004891944, lon: -72.231484167 };
// This point is on the same IBC segment extended into the lake, 119 m offshore.
const lakeBorder = { lat: 45.004833584, lon: -72.2345 };
const countries = ['CA', 'US'];
// NHN delineates the island here. USGS NHD maps water at the same point.
const metigosheSeam = { lat: 48.9993282, lon: -100.354 };
// Three NAIP acquisitions (2019, 2022, 2023) show shallows in the small northern lobe.
const metigosheShallows = { lat: 48.9994, lon: -100.35392 };

test('each side of a divided island issues one national AGID while identifying both countries on the island', () => {
  for (const { name, lat, lon, country } of interiors) {
    for (const issue of [encodeAGID, encodeAGID16]) {
      const issued = issue(lat, lon);
      assert.equal(issued.prefix, country, name);
      assert.equal(issued.regionCode, country, name);
      assert.equal(issued.isSea, false, name);
    }
    for (const a of [assessAgidGeography({ kind: 'pin', lat, lon }),
      assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: 3 }),
      assessAgidGeography({ kind: 'cell', id: encodeAGID16(lat, lon).id })]) {
      assert.equal(a.surface, 'land', name);
      assert.equal(a.status, 'mapped', name);
      assert.deepEqual(a.regionCandidates, [country], name);
      assert.equal(a.territorialTopology?.landform, 'island', name);
      assert.deepEqual(a.territorialTopology?.sharedIslandCountryCodes, countries, name);
      assert.equal(a.island?.status, 'mapped', name);
      assert.deepEqual(a.island.countryCodes, [country], name);
      assert.equal(a.island.claimantCodes, undefined, name);
      assert.equal(a.deliveryRegion, null, name);
    }
  }
});

test('Metigoshe qualifies the shared-island label in both languages using its hydrographic record', () => {
  const province = assessAgidGeography({ kind: 'pin', lat: 45.00867, lon: -72.23235 });
  assert.equal(province.territorialTopology?.sharedIslandBasis, undefined);
  const metigoshe = assessAgidGeography({ kind: 'pin', lat: 48.99845, lon: -100.35433 });
  const topology = metigoshe.territorialTopology;
  assert.equal(topology?.sharedIslandBasis, 'hydrographic-record');
  for (const [japanese, label] of [
    [true, '水系図に記録された島全体の国・地域'],
    [false, 'Countries or territories on the island recorded in hydrographic maps'],
  ] as const) {
    const rows = territorialTopologyRows(topology, japanese, codes => codes.join(', '), metigoshe.island);
    assert.deepEqual(rows.find(([key]) => key === label), [label, 'CA, US']);
  }
});

test('the surveyed border across Province Island retains dry land and leaves the address country open', async () => {
  const issued = encodeAGID16(monument.lat, monument.lon);
  for (const a of [assessAgidGeography({ kind: 'pin', ...monument }),
    assessAgidGeography({ kind: 'cell', id: issued.id })]) {
    assert.equal(a.surface, 'land');
    assert.equal(a.status, 'needs-confirmation');
    assert.deepEqual(a.regionCandidates, countries);
    assert.deepEqual(a.territorialTopology?.sharedIslandCountryCodes, countries);
    assert.equal(a.island?.status, 'unresolved');
    assert.deepEqual(a.island.countryCodes, []);
    assert.equal(a.island.claimantCodes, undefined);
    assert.equal(a.deliveryRegion, null);
  }
  assert.equal(issued.isSea, false);
  assert.ok(!countries.includes(issued.prefix));
  const requests: string[] = [];
  const addressFormatResolver = async (country: string) => { requests.push(country); return null; };
  await resolveAgidLocal({ coordinates: monument, addressFormatResolver });
  await resolveAgidLocal({ query: issued.id, addressFormatResolver });
  assert.deepEqual(requests, []);
});

test('a device fix chooses one country only when its measured footprint stays on that side', () => {
  // US, 11 m from the IBC line and 29 m from the physical shore.
  const pin = { kind: 'pin', method: 'device', lat: 45.004796456, lon: -72.23125 } as const;
  const precise = assessAgidGeography({ ...pin, accuracyMeters: 3 });
  assert.equal(precise.status, 'mapped');
  assert.deepEqual(precise.regionCandidates, ['US']);
  const crossing = assessAgidGeography({ ...pin, accuracyMeters: 18 });
  assert.equal(crossing.status, 'needs-confirmation');
  assert.equal(crossing.surface, 'land');
  assert.deepEqual(crossing.regionCandidates, countries);
  assert.deepEqual(crossing.territorialTopology?.sharedIslandCountryCodes, countries);
  assert.deepEqual(crossing.island?.countryCodes, []);
  const unreported = assessAgidGeography(pin);
  assert.equal(unreported.footprint.radiusMeters, null);
  assert.equal(unreported.status, 'needs-confirmation');
  assert.deepEqual(unreported.island?.countryCodes, []);
});

test('an offshore GPS disk touching only the Vermont tip keeps Canada out of the point candidates', () => {
  // The USGS southern tip is at 45.003835, about 8 m north of this point.
  const pin = { kind: 'pin', method: 'device', lat: 45.00376, lon: -72.2311 } as const;
  assert.equal(assessAgidGeography({ ...pin, accuracyMeters: 1 }).surface, 'water');
  const crossing = assessAgidGeography({ ...pin, accuracyMeters: 22 });
  assert.equal(crossing.status, 'needs-confirmation');
  assert.equal(crossing.surface, 'unknown');
  assert.deepEqual(crossing.regionCandidates, ['US']);
  assert.equal(crossing.territorialTopology?.sharedIslandCountryCodes, undefined);
});

test('surveyed lake water near each island supplies neither island nor address country', async () => {
  for (const coordinates of [lakeBorder, { lat: 48.999050, lon: -100.355 }, { lat: 48.999600, lon: -100.355 }]) {
    const { lat, lon } = coordinates;
    const issued = encodeAGID16(lat, lon);
    assert.equal(issued.isSea, true);
    for (const a of [assessAgidGeography({ kind: 'pin', lat, lon }),
      assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: 15 }),
      assessAgidGeography({ kind: 'cell', id: issued.id })]) {
      assert.equal(a.surface, 'water');
      assert.equal(a.status, 'mapped');
      assert.equal(a.island, undefined);
      assert.equal(a.territorialTopology, undefined);
      assert.deepEqual(a.regionCandidates, []);
      assert.equal(a.deliveryRegion, null);
    }
    const requests: string[] = [];
    await resolveAgidLocal({ coordinates, addressFormatResolver: async c => { requests.push(c); return null; } });
    assert.deepEqual(requests, []);
  }
});

test('the conflicting Metigoshe shorelines leave the pin without a country or island label', async () => {
  for (const coordinates of [metigosheSeam, metigosheShallows]) {
    const { lat, lon } = coordinates;
    const a = assessAgidGeography({ kind: 'pin', lat, lon });
    assert.equal(a.status, 'needs-confirmation');
    assert.equal(a.surface, 'unknown');
    assert.deepEqual(a.regionCandidates, []);
    assert.equal(a.island, undefined);
    assert.equal(a.territorialTopology?.sharedIslandCountryCodes, undefined);
    assert.equal(a.deliveryRegion, null);
    const issued = encodeAGID16(lat, lon);
    assert.ok(!countries.includes(issued.prefix));
    const requests: string[] = [];
    await resolveAgidLocal({ coordinates, addressFormatResolver: async c => { requests.push(c); return null; } });
    assert.deepEqual(requests, []);
  }
});

test('existing Canada-prefixed Province Island IDs still decode to the surveyed US cell', async () => {
  const current = encodeAGID16(45.00431, -72.231);
  // Issued at this point by both encoders before the divided-island survey.
  for (const id of ['CA0HJTZVY6HH', 'CA0HJTZVY6HH1VV6']) {
    assert.equal(getAGIDCellKey(id), getAGIDCellKey(current));
    const requests: string[] = [];
    const resolved = await resolveAgidLocal({ query: id, addressFormatResolver: async c => { requests.push(c); return null; } });
    assert.equal(resolved.agidId, id);
    assert.equal(resolved.agid?.prefix, 'CA');
    assert.deepEqual(requests, ['US']);
  }
});

test('the optional pack preserves the surveyed point and shared island even when coarse evidence disagrees', () => {
  for (const { name, lat, lon, country } of interiors) {
    // Inject a coarser pack hit on the opposite side as well as a water-only result.
    const hit: PackHit = { islandId: 'fixture:coarse-lake-island', kind: 'lake-island',
      codes: [country === 'US' ? 'CA' : 'US'], source: 'fixture', version: '1', relation: 'inside' };
    for (const raw of [null, hit]) {
      const pack = packPointResult(lat, lon, raw, !raw, true);
      assert.deepEqual(pack.island?.countryCodes, [country], name);
      assert.deepEqual(pack.territorialTopology?.sharedIslandCountryCodes, countries, name);
      assert.equal(pack.physicalIslandId, undefined, name);
      assert.equal(pack.deliveryRegion, null, name);
    }
  }
  const metigoshe = packPointResult(48.99845, -100.35433, null, false, true);
  assert.equal(metigoshe.territorialTopology?.sharedIslandBasis, 'hydrographic-record');
  const border = packPointResult(monument.lat, monument.lon, null, true, true);
  assert.equal(border.island?.status, 'unresolved');
  assert.deepEqual(border.territorialTopology?.sharedIslandCountryCodes, countries);
  const water = packPointResult(lakeBorder.lat, lakeBorder.lon, null, true, true);
  assert.equal(water.island, null);
  assert.equal(water.territorialTopology, null);
  const seam = packPointResult(metigosheSeam.lat, metigosheSeam.lon, null, true, true);
  assert.equal(seam.island, null);
  assert.equal(seam.territorialTopology?.sharedIslandCountryCodes, undefined);
});
