import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { inspectAfPostalArea, probeAfPostalArea, inspectAfSources } from './inspect-postal-context-af-sources.mjs';
import { probeOfficialReference, sourceDigest } from './lib/postal-context-source-probe.mjs';

const profile = JSON.parse(readFileSync(new URL('../data/postal_country_packs/af/postal-context/m2-source-review.json', import.meta.url), 'utf8'));
const syntheticArea = () => ({ type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]]] }, properties: { postal_cod: profile.area_probe.query_postal_code, private_identity: 'SYNTHETIC-DO-NOT-PUBLISH', home_number: 'SYNTHETIC-HOUSE', geojson: 'SYNTHETIC-RAW-BODY' } });

test('AF preflight accepts only matching six-digit area responses, including numeric source storage', () => {
  for (const code of ['100208', 100208]) {
    const area = syntheticArea(); area.properties.postal_cod = code;
    const result = inspectAfPostalArea(area, '100208');
    assert.equal(result.basicChecksPassed, true);
    assert.equal(result.matchesRequestedCode, true);
    assert.equal(result.positions, 4);
    assert.equal(result.completeTopologyVerified, false);
    assert.equal(result.sourceCrsVerified, false);
    assert.equal(result.sourceEdition, null);
    assert.equal(result.validFrom, null);
  }
});

test('AF preflight rejects missing, legacy, mismatched and invalid component codes', () => {
  for (const code of [null, false, '1002', '100209', '000208', '100008', '100200', '990101']) {
    const area = syntheticArea(); area.properties.postal_cod = code;
    assert.equal(inspectAfPostalArea(area, '100208').basicChecksPassed, false, String(code));
  }
  assert.equal(inspectAfPostalArea(syntheticArea(), '1002').basicChecksPassed, false);
});

test('AF area checks reject points, collections, empty and malformed polygons', () => {
  for (const geometry of [null, { type: 'Point', coordinates: [0, 0] }, { type: 'MultiPolygon', coordinates: [] }, { type: 'Polygon', coordinates: [[]] }, { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [0, 0]]] }]) {
    const area = syntheticArea(); area.geometry = geometry;
    assert.equal(inspectAfPostalArea(area, '100208').basicChecksPassed, false);
  }
  assert.equal(inspectAfPostalArea({ type: 'FeatureCollection', features: [syntheticArea()] }, '100208').basicChecksPassed, false);
});

test('AF basic geometry checks reject unclosed, degenerate and out-of-range rings', () => {
  for (const ring of [
    [[0, 0], [1, 0], [1, 1], [2, 2]],
    [[0, 0], [0, 0], [0, 0], [0, 0]],
    [[0, 0], [181, 0], [1, 1], [0, 0]],
    [[0, 0], [1, 91], [1, 1], [0, 0]],
    [[0, 0], [1, NaN], [1, 1], [0, 0]],
  ]) {
    const area = syntheticArea(); area.geometry.coordinates = [[ring]];
    assert.equal(inspectAfPostalArea(area, '100208').basicChecksPassed, false);
  }
});

test('AF area observation redacts all properties and coordinates and never claims M2', async () => {
  const result = await probeAfPostalArea(profile.area_probe, async () => new Response(JSON.stringify(syntheticArea()), { headers: { 'content-type': 'application/json' } }));
  assert.equal(result.status, 'live-area-observed-not-m2');
  assert.equal(result.observedAreaRecords, 1);
  assert.equal(result.sourceResponsesPersisted, 0);
  assert.equal(result.rightsCleared, false);
  assert.equal(result.countryM2Achieved, false);
  assert.equal(result.realAgidRuntimeVerified, false);
  assert.match(result.responseDigest, /^sha256:[a-f0-9]{64}$/);
  for (const forbidden of ['SYNTHETIC-DO-NOT-PUBLISH', 'SYNTHETIC-HOUSE', 'SYNTHETIC-RAW-BODY', 'coordinates', 'properties']) assert.ok(!JSON.stringify(result).includes(forbidden), forbidden);
});

test('AF preflight refuses private search, bulk, authentication and persistence settings', async () => {
  for (const change of [{ url: 'https://postalcode.afghanpost.gov.af/client_search/example' }, { url: 'https://postalcode.afghanpost.gov.af/client_postal_code' }, { allow_search_queries: true }, { allow_authentication: true }, { persist_source_response: true }, { max_queries_per_run: 2 }, { max_response_bytes: 10 * 1024 * 1024 }]) {
    await assert.rejects(() => probeAfPostalArea({ ...profile.area_probe, ...change }, () => { throw new Error('should-not-fetch'); }), /unsafe-area-probe/);
  }
});

test('AF area response failures and wrong content never become observed records', async () => {
  const responses = [new Response('restricted', { status: 403 }), new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } }), new Response('{', { headers: { 'content-type': 'application/json' } })];
  for (const response of responses) {
    const result = await probeAfPostalArea(profile.area_probe, async () => response);
    assert.equal(result.observedAreaRecords, 0);
    assert.equal(result.countryM2Achieved, false);
  }
});

test('pinned PDF edition cannot survive a changed source digest', async () => {
  const bytes = '%PDF-synthetic-reference';
  const ref = { id: 'synthetic', url: 'https://www.upu.int/reference.pdf', mime: 'application/pdf', markers: [], edition: 'synthetic-edition', expectedDigest: sourceDigest(bytes) };
  const fetcher = async () => new Response(bytes, { headers: { 'content-type': 'application/pdf' } });
  assert.equal((await probeOfficialReference(ref, new Set(['www.upu.int']), fetcher)).contentVerified, true);
  const changed = await probeOfficialReference({ ...ref, expectedDigest: sourceDigest('changed') }, new Set(['www.upu.int']), fetcher);
  assert.equal(changed.contentVerified, false);
  assert.equal(changed.sourceDocumentDigest, null);
  assert.equal(changed.edition, 'unconfirmed-content');
});

test('AF source review performs only fixed references and one area request, never publishes data', async () => {
  const requested = [];
  const result = await inspectAfSources(async url => {
    requested.push(url);
    if (url === profile.area_probe.url) return new Response(JSON.stringify(syntheticArea()), { headers: { 'content-type': 'application/json' } });
    return new Response('reference unavailable', { status: 503 });
  });
  assert.deepEqual(requested, [...profile.reference_probes.map(ref => ref.url), profile.area_probe.url]);
  assert.equal(result.areaObservation.observedAreaRecords, 1);
  assert.ok(result.references.every(ref => !ref.contentVerified));
  assert.equal(result.sourceDataSnapshotsPersisted, 0);
  assert.equal(result.publishedDataArtifacts, 0);
  assert.equal(result.countryM2Achieved, false);
});
