import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inspectHongKongSources, hongKongLookupUrl } from './inspect-postal-context-hk-sources';

const refOk = async (ref: { id: string }) => ({ id: ref.id, contentVerified: true, responseDigest: 'sha256:' + 'a'.repeat(64), status: 'synthetic-test-double-not-real-evidence',
  expectedMime: 'text/html', requestedUrl: 'https://data.gov.hk/synthetic', finalUrl: 'https://data.gov.hk/synthetic', redirects: [], httpStatus: 200, contentType: 'text/html', lastModified: null,
  byteLength: 1, sourceDocumentDigest: 'sha256:' + 'a'.repeat(64), edition: 'synthetic-test-double', sourceDataRecords: 0, missingMarkers: [] });
const record = () => ({ RequestAddress: { AddressLine: ['SYNTHETIC TEST'] }, SuggestedAddress: [{ Address: { PremisesAddress: {
  GeoAddress: '0000100002T20200101', EngPremisesAddress: { BuildingName: 'SYNTHETIC BUILDING', Region: 'HK', EngStreet: { StreetName: 'SYNTHETIC ROAD', BuildingNoFrom: '001A' } },
  ChiPremisesAddress: { BuildingName: '合成試験', Region: '香港' }, GeospatialInformation: { Latitude: '22.3', Longitude: '114.2' }
} }, ValidationInformation: { Score: 70 } }] });
const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { 'Content-Type': 'application/json' } });

test('HK live preflight only builds two reviewed public-building queries with explicit limits, tolerance and 2D scope', () => {
  const url = new URL(hongKongLookupUrl('central government offices'));
  assert.equal(url.origin, 'https://www.als.gov.hk'); assert.equal(url.pathname, '/lookup');
  for (const [k, v] of Object.entries({ n: '10', t: '20', b: '1', '3d': '0' })) assert.equal(url.searchParams.get(k), v);
  assert.throws(() => hongKongLookupUrl('unreviewed private address'), /hk-query-outside/);
});
test('HK preflight does not call address APIs when a required reference, policy, dictionary or terms check fails', async () => {
  let calls = 0;
  const r = await inspectHongKongSources(async () => { calls++; throw new Error('no records allowed'); },
    async (ref: { id: string }) => ({ ...await refOk(ref), contentVerified: false }));
  assert.equal(calls, 0); assert.equal(r.queries.length, 0); assert.equal(r.realCandidateAdapterVerified, false); assert.equal(r.countryM2Achieved, false);
});
test('HK preflight preserves only aggregate hashes and cell checks, never raw candidates or confidence', async () => {
  const calls: string[] = [];
  const r = await inspectHongKongSources(async (input, options) => {
    const url = String(input); calls.push(url); assert.equal(options?.redirect, 'manual'); assert.equal(options?.credentials, 'omit');
    const headers = new Headers(options?.headers); assert.equal(headers.get('Accept'), 'application/json'); assert.equal(headers.get('Authorization'), null);
    assert.equal(new URL(url).searchParams.get('3d'), '0');
    const result: any = record(); if (url.includes('/galookup')) result.SuggestedAddress[0].ValidationInformation = null;
    return json(result);
  }, refOk);
  assert.equal(calls.length, 4); assert.equal(r.queries.length, 2); assert.equal(r.realCoordinateCellChecks, 2); assert.equal(r.realCandidateAdapterVerified, true);
  assert.equal(r.repeat?.byteIdentical, true); assert.equal(r.geoAddressLookup?.sameSemanticDigestAsFirstQuery, true);
  assert.equal(r.geoAddressLookup?.allReturnedIdentifiersMatch, true); assert.equal(r.countryM2Achieved, false); assert.equal(r.realPublishedPackLoaderApiVerified, false);
  const output = JSON.stringify(r); for (const secret of ['SYNTHETIC BUILDING', 'SYNTHETIC ROAD', '001A', '合成試験', 'SuggestedAddress', 'recordPointer', 'agidCellId']) assert.ok(!output.includes(secret));
  assert.equal(r.safety.dataRowsPersisted, 0); assert.equal(r.safety.publishedDataArtifacts, 0); assert.equal(r.rights.publicationApproved, false);
});
test('HK off-host redirects, incorrect MIME and oversized responses never count as verified source candidates', async () => {
  for (const response of [() => new Response('', { status: 302, headers: { Location: 'https://example.invalid/private' } }),
    () => new Response('{}', { status: 200, headers: { 'Content-Type': 'text/html' } }),
    () => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json', 'Content-Length': '2097153' } })]) {
    const r = await inspectHongKongSources(async () => response(), refOk);
    assert.equal(r.realCandidateAdapterVerified, false); assert.ok(r.queries.every(q => q.status === 'probe-error')); assert.equal(r.realCoordinateCellChecks, 0);
  }
});
test('HK changed repeated records or a mismatched GeoAddress response prevents the all-checks flag', async () => {
  let count = 0;
  const r = await inspectHongKongSources(async input => {
    count++; const result = record();
    if (count === 3) result.SuggestedAddress[0].Address.PremisesAddress.EngPremisesAddress.BuildingName = 'CHANGED SYNTHETIC BUILDING';
    if (String(input).includes('/galookup')) result.SuggestedAddress[0].Address.PremisesAddress.GeoAddress = '0000100003T20200101';
    return json(result);
  }, refOk);
  assert.equal(r.repeat?.semanticIdentical, false); assert.equal(r.geoAddressLookup?.allReturnedIdentifiersMatch, false); assert.equal(r.realCandidateAdapterVerified, false);
});
test('HK reference failures are sanitized without leaking exception bodies or authentication strings', async () => {
  const r = await inspectHongKongSources(async () => json({}), async () => { throw new Error('PRIVATE_ROW_AND_TOKEN'); });
  assert.equal(r.references.length, 6); assert.ok(!JSON.stringify(r).includes('PRIVATE_ROW_AND_TOKEN')); assert.equal(r.queries.length, 0);
});
