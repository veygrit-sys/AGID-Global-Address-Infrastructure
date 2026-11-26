import assert from 'node:assert/strict';
import { test } from 'node:test';
import { packPointResult } from '../../scripts/national-island-supplement';
import { encodeAGID, encodeAGID16, getAGIDCellKey } from './agid';
import { runAgidCli } from './agidCli';
import { resolveAgidLocal } from './agidLocalResolver';
import { assessAgidGeography as assess } from './geographicAssessment';
import { matchReviewedShoreline } from './reviewedShorelines';
import { queryTerritorialExclavePolygons, territorialExclaveFeatures } from './territorialExclaves';

const territories = [
  ['muensterbildchen', 50.65647, 6.18364, 'DE', 'BE'],
  ['roetgener-wald', 50.63651, 6.22291, 'DE', 'BE'],
  ['rueckschlag', 50.59755, 6.24740, 'DE', 'BE'],
  ['muetzenich', 50.56351, 6.20781, 'DE', 'BE'],
  ['ruitzhof', 50.52588, 6.19564, 'DE', 'BE'],
  ['jungholz', 47.574, 10.447, 'AT', 'DE'],
  ['medjurecje', 43.555, 19.41585, 'BA', 'RS'],
] as const;

test('seven named continental territories resolve at a pin, a saved cell and through the public atlas', () => {
  for (const [id, lat, lon, country, host] of territories) {
    const issued = encodeAGID16(lat, lon);
    assert.equal(issued.regionCode, country, id);
    assert.ok(territorialExclaveFeatures.some(f => f.id === id), id);
    for (const x of [lon, lon + 360]) {
      assert.ok([...queryTerritorialExclavePolygons([x - 0.001, lat - 0.001, x + 0.001, lat + 0.001])]
        .some(p => p.feature.id === id), id);
    }
    for (const result of [assess({ kind: 'pin', lat, lon }), assess({ kind: 'cell', id: issued.id })]) {
      const area = result.territorialTopology?.administration;
      assert.equal(area?.id, id);
      assert.equal(area.kind, id === 'jungholz' ? 'point-connected' : 'enclave');
      assert.deepEqual(area.neighboringCodes, [host]);
      assert.equal(result.territorialTopology?.landform, 'mainland');
      assert.deepEqual(result.regionCandidates, [country]);
      assert.equal(result.status, 'mapped');
      assert.equal(result.deliveryRegion, null);
    }
  }
});

test('Vennbahn cross-sections separate the German enclave, former Belgian track and German mainland', () => {
  for (const [lat, enclave, track, mainland, id] of [
    [50.59755, 6.24740, 6.24873, 6.24930, 'rueckschlag'],
    [50.65450, 6.19080, 6.19124, 6.19170, 'muensterbildchen'],
    [50.52580, 6.20310, 6.20385, 6.20470, 'ruitzhof'],
  ] as const) {
    for (const [lon, country, name] of [[enclave, 'DE', id], [track, 'BE', undefined], [mainland, 'DE', undefined]] as const) {
      const r = assess({ kind: 'pin', lat, lon });
      assert.deepEqual(r.regionCandidates, [country], String(lon));
      assert.equal(r.territorialTopology?.administration?.id, name);
    }
  }
});

test('both near-track countries are retained only when a GPS radius or cell reaches them', () => {
  const near = { kind: 'pin', method: 'device', lat: 50.59755, lon: 6.24845 } as const;
  assert.deepEqual(assess({ ...near, accuracyMeters: 1 }).regionCandidates, ['DE']);
  for (const r of [assess({ ...near, accuracyMeters: 6 }),
    assess({ ...near, accuracyMeters: 1 }, { boundaryAllowanceMeters: 5 }),
    assess({ kind: 'cell', id: encodeAGID16(near.lat, near.lon).id })]) {
    assert.equal(r.status, 'needs-confirmation');
    assert.equal(r.surface, 'land');
    assert.deepEqual(r.regionCandidates, ['BE', 'DE']);
    assert.equal(r.administrativeSourceDisagreement, undefined);
    assert.equal(r.deliveryRegion, null);
  }
  assert.deepEqual(assess({ ...near, lon: 6.24873, accuracyMeters: 6 }).regionCandidates, ['BE']);
  const betweenSurveys = assess({ kind: 'pin', lat: near.lat, lon: 6.248475 });
  assert.equal(betweenSurveys.administrativeSourceDisagreement, true);
  assert.deepEqual(betweenSurveys.regionCandidates, ['BE', 'DE']);
});

test('Sorgschrofen has four territorial sectors around a single Austrian point of contact', () => {
  const lat = 47.5557974, lon = 10.4544275;
  for (const r of [assess({ kind: 'pin', lat, lon }), assess({ kind: 'cell', id: encodeAGID16(lat, lon).id })]) {
    assert.deepEqual(r.regionCandidates, ['AT', 'DE']);
    assert.equal(r.surface, 'land');
    assert.equal(r.status, 'needs-confirmation');
    assert.equal(r.deliveryRegion, null);
  }
  for (const encode of [encodeAGID, encodeAGID16]) assert.ok(!['AT', 'DE'].includes(encode(lat, lon).prefix));
  for (const [y, x, country, name] of [
    [47.5560474, 10.4544275, 'AT', 'jungholz'], [47.5555474, 10.4544275, 'AT', undefined],
    [47.5557974, 10.4547975, 'DE', undefined], [47.5556206, 10.4541659, 'DE', undefined],
  ] as const) {
    const r = assess({ kind: 'pin', lat: y, lon: x });
    assert.deepEqual(r.regionCandidates, [country]);
    assert.equal(r.territorialTopology?.administration?.id, name);
  }
});

test('Međurečje resolves its interior and its host and preserves two candidates where the editions diverge', () => {
  const lat = 43.555;
  for (const [lon, countries, mismatch] of [
    [19.41585, ['BA'], false], [19.434, ['RS'], false],
    [19.404, ['BA', 'RS'], true], [19.430, ['BA', 'RS'], true],
  ] as const) {
    const r = assess({ kind: 'pin', lat, lon });
    assert.deepEqual(r.regionCandidates, countries);
    assert.equal(Boolean(r.administrativeSourceDisagreement), mismatch);
    assert.equal(r.status, mismatch ? 'needs-confirmation' : 'mapped');
    assert.equal(r.island, undefined);
    assert.equal(r.deliveryRegion, null);
    if (mismatch) assert.ok(!countries.some(code => code === encodeAGID16(lat, lon).prefix));
    if (lon === 19.434) assert.equal(r.territorialTopology?.administration, undefined);
  }
  const frameEdge = assess({ kind: 'pin', lat, lon: 19.436 });
  assert.deepEqual(frameEdge.regionCandidates, ['RS']);
  assert.equal(frameEdge.status, 'mapped');
});

test('the reservoir on the German side is water even inside a reviewed administrative partition', () => {
  // Representative point of the ATKIS standing water StandingWater_DENWAT01D000GBIN.
  const lat = 50.6605446, lon = 6.2141788;
  for (const r of [assess({ kind: 'pin', lat, lon }), assess({ kind: 'pin', method: 'device', lat, lon, accuracyMeters: 8 }),
    assess({ kind: 'cell', id: encodeAGID16(lat, lon).id })]) {
    assert.equal(r.surface, 'water');
    assert.deepEqual(r.regionCandidates, []);
    assert.equal(r.territorialTopology?.administration, undefined);
    assert.ok(r.sources.some(source => source.source === 'nrw-atkis-physical-waters'));
    assert.equal(r.deliveryRegion, null);
  }
  assert.equal(matchReviewedShoreline(lat, lon)?.waterKind, 'inland');
  assert.equal(encodeAGID16(lat, lon).waterMatch?.source, 'nrw-atkis-physical-waters');
  const bank = assess({ kind: 'pin', lat: 50.658937, lon: 6.2085037, method: 'device', accuracyMeters: 45 });
  assert.equal(bank.surface, 'unknown');
  assert.equal(bank.status, 'needs-confirmation');
  assert.deepEqual(bank.regionCandidates, ['DE']);
});

test('stored identifiers retain their cell and use current evidence or the explicit postal choice', async () => {
  for (const [lat, lon, ids, expected] of [
    [43.555, 19.41585, ['RS0GXC6RHZEM', 'RS0GXC6RHZEM11DC'], ['BA']],
    [43.555, 19.404, ['RS0GXC6RC3BC', 'RS0GXC6RC3BC132H'], []],
    [47.5557974, 10.4544275, ['AT0GYDKJXCJT', 'AT0GYDKJXCJT1NG4'], []],
  ] as const) {
    for (const id of ids) {
      assert.equal(getAGIDCellKey(id), getAGIDCellKey(encodeAGID16(lat, lon)));
      const requested: string[] = [];
      const r = await resolveAgidLocal({ query: id, addressFormatResolver: async c => { requested.push(c); return null; } });
      assert.equal(r.agidId, id);
      assert.deepEqual(requested, expected);
    }
  }
  const requested: string[] = [];
  await resolveAgidLocal({ query: 'RS0GXC6RC3BC132H', countryCode: 'BA', addressFormatResolver: async c => { requested.push(c); return null; } });
  assert.deepEqual(requested, ['BA']);
});

test('a conflicting offshore pack feature cannot turn surveyed continental parcels into islands', () => {
  const old = { islandId: 'fixture:older-outline', kind: 'ocean-island', codes: ['RS'],
    source: 'fixture', version: '1', relation: 'inside' } as const;
  const raw = { ...old, codes: [...old.codes] };
  const parcel = packPointResult(43.555, 19.41585, raw, false, true);
  assert.equal(parcel.island, null);
  assert.equal(parcel.territorialTopology?.administration?.id, 'medjurecje');
  assert.equal(parcel.deliveryRegion, null);
  const lake = packPointResult(50.6605446, 6.2141788, raw, true, true);
  assert.equal(lake.island, null);
  assert.equal(lake.territorialTopology, null);
});

test('the CLI distinguishes editorial disagreement from a geometric border or shared sovereignty', async () => {
  const args = ['geography', '--lat', '43.555', '--lon', '19.404'];
  const text = await runAgidCli(args);
  assert.equal(text.exitCode, 0, text.stderr);
  assert.match(text.stdout, /Boundary sources differ at this location/);
  const json = JSON.parse((await runAgidCli([...args, '--json'])).stdout);
  assert.equal(json.administrativeSourceDisagreement, true);
  assert.deepEqual(json.regionCandidates, ['BA', 'RS']);
  assert.equal(json.deliveryRegion, null);
});
