import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hongKongDigest, parseHongKongGeoAddress, parseHongKongAlsCandidates, linkHongKongCandidateCell } from './postalContextHongKongCandidate';

// Entirely synthetic names, identifiers and coordinates. Not an ALS extract.
const row = () => ({ Address: { PremisesAddress: { GeoAddress: '0000100002T20200101',
  EngPremisesAddress: { BuildingName: 'SYNTHETIC TEST BUILDING', Region: 'HK', EngDistrict: { DcDistrict: 'SYNTHETIC DISTRICT' }, EngStreet: { StreetName: 'SYNTHETIC ROAD', BuildingNoFrom: '001A', BuildingNoTo: '003B' } },
  ChiPremisesAddress: { BuildingName: '合成試験建物', Region: '香港', ChiStreet: { StreetName: '合成試験道', BuildingNoFrom: '001A', BuildingNoTo: '003B' } },
  GeospatialInformation: { Latitude: '22.3', Longitude: '114.2', Easting: '800001', Northing: '800002' } } }, ValidationInformation: { Score: 70 } });
const payload = (rows: unknown[] = [row()]) => ({ RequestAddress: { AddressLine: ['SYNTHETIC PUBLIC TEST'] }, SuggestedAddress: rows });
const prepare = (raw: unknown = payload()) => { const bytes = Buffer.from(JSON.stringify(raw)); return { bytes, receipt: {
  url: 'https://www.als.gov.hk/lookup?q=synthetic&n=10&3d=0', observedAt: '2026-08-28T00:00:00.000Z',
  responseDigest: hongKongDigest(bytes), termsUrl: 'https://data.gov.hk/en/terms-and-conditions' as const, termsDigest: 'sha256:' + 'a'.repeat(64) } }; };
const parse = (raw: unknown = payload()) => { const p = prepare(raw); return parseHongKongAlsCandidates(p.bytes, p.receipt); };

test('HK retains bilingual source fields, suffixes and number endpoints as candidates without postcode or building inference', () => {
  const result = parse(), c = result.candidates[0];
  assert.equal(c.countryCode, 'HK'); assert.equal(c.address.en?.street?.numberFrom, '001A'); assert.equal(c.address.zhHant?.buildingName, '合成試験建物');
  assert.equal(c.address.en?.street?.numberTo, '003B'); assert.equal(c.address.en?.street?.numberSemantics, 'source-endpoints-not-enumerated');
  assert.deepEqual(c.postal, { status: 'not_used', code: null, geometryType: 'none' }); assert.equal(c.status, 'candidate');
  assert.ok(Object.values(c.assertions).every(v => v === false)); assert.equal(result.summary.rangeRows, 1);
  assert.equal(c.ranking.score, 70); assert.equal(c.ranking.confidence, null); assert.equal(c.source.validFrom, null); assert.equal(c.source.sourceEdition, null);
  assert.match(c.fieldEvidence.sourcePointer, /SuggestedAddress\/0\/Address\/PremisesAddress$/);
});
test('HK GeoAddress validates syntax and calendar dates, never treating creation date as validity', () => {
  const g = parseHongKongGeoAddress('0000100002P20200229'); assert.equal(g.recordCreatedOn, '2020-02-29'); assert.equal(g.kind, 'podium'); assert.equal(g.creationDateIsValidity, false);
  for (const x of ['000', '0000', '000000', 'HKG', '852', '999077', 999077, '0000100002X20200101', '0000100002T20210229', '0000100002T20201301']) assert.throws(() => parseHongKongGeoAddress(x), /hk-invalid-geoaddress/);
});
test('HK repeated GeoAddress is a location grouping, not a unique address key or automatic deduplication', () => {
  const a = row(), b = row(); b.Address.PremisesAddress.EngPremisesAddress.EngStreet.StreetName = 'ANOTHER SYNTHETIC ROAD';
  const result = parse(payload([a, b, a])); assert.equal(result.summary.observedRows, 3); assert.equal(result.summary.distinctGeoAddresses, 1);
  assert.equal(result.summary.repeatedGeoAddressRows, 2); assert.equal(result.summary.excessDuplicateRows, 1); assert.equal(result.summary.recordsDeduplicated, 0);
  assert.equal(result.candidates[1].source.recordPointer, '/SuggestedAddress/1');
});
test('HK missing language or location stays missing; no translation or digit-derived coordinates', () => {
  const r: any = row(); delete r.Address.PremisesAddress.ChiPremisesAddress; delete r.Address.PremisesAddress.GeospatialInformation;
  const result = parse(payload([r])); assert.equal(result.summary.missingChineseRows, 1); assert.equal(result.summary.missingPointRows, 1);
  assert.equal(result.candidates[0].address.zhHant, null); assert.equal(linkHongKongCandidateCell(result.candidates[0]), null);
});
test('HK forbids floor/unit, unexpected postal fields, unknown shapes and missing address languages', () => {
  for (const mutate of [(r: any) => r.Address.PremisesAddress.EngPremisesAddress.Eng3dAddress = { EngUnit: { UnitNo: '1' } },
    (r: any) => r.Address.PremisesAddress.PostalCode = '999077', (r: any) => r.Address.OwnerName = 'DO NOT RETAIN',
    (r: any) => { delete r.Address.PremisesAddress.EngPremisesAddress; delete r.Address.PremisesAddress.ChiPremisesAddress; }]) {
    const r = row(); mutate(r); assert.throws(() => parse(payload([r])), /hk-/);
  }
});
test('HK rejects malformed and swapped coordinate values, incomplete pairs and out-of-scope points', () => {
  for (const values of [{ Latitude: '114.2', Longitude: '22.3' }, { Latitude: '22.3x' }, { Latitude: '' }, { Longitude: '0x72' },
    { Latitude: 22.3 }, { Latitude: '91' }, { Latitude: '35.6', Longitude: '139.7' }, { Northing: null }]) {
    const r = row(); Object.assign(r.Address.PremisesAddress.GeospatialInformation, values); assert.throws(() => parse(payload([r])), /hk-/);
  }
});
test('HK rejects receipt tampering, unapproved URLs, malformed UTF-8 and row overflow', () => {
  const p = prepare();
  for (const bad of [{ responseDigest: 'sha256:' + 'b'.repeat(64) }, { termsDigest: '' }, { observedAt: 'yesterday' },
    { url: 'https://example.invalid/lookup?q=x' }, { url: 'https://www.als.gov.hk/other' }, { termsUrl: 'https://example.invalid/terms' }])
    assert.throws(() => parseHongKongAlsCandidates(p.bytes, { ...p.receipt, ...bad } as any), /hk-invalid-receipt/);
  assert.throws(() => parse(payload(Array.from({ length: 11 }, row))), /hk-row-limit/);
  const invalid = Buffer.from([0xff]); assert.throws(() => parseHongKongAlsCandidates(invalid, { ...p.receipt, responseDigest: hongKongDigest(invalid) }), /hk-invalid-json/);
  assert.throws(() => parseHongKongAlsCandidates(p.bytes, p.receipt, 201), /hk-response-limit/);
});
test('HK empty results and null GeoAddress-query scores are not failures or confidence values', () => {
  assert.equal(parse(payload([])).summary.observedRows, 0); const r: any = row(); r.ValidationInformation = null;
  assert.equal(parse(payload([r])).candidates[0].ranking.score, null);
  r.ValidationInformation = { Score: '70' }; assert.throws(() => parse(payload([r])), /hk-invalid-rank-score/);
});
test('HK AGID coordinate-cell roundtrip preserves source HK identity without a footprint assertion', () => {
  const c = parse().candidates[0], linked = linkHongKongCandidateCell(c); assert.ok(linked); assert.match(linked.agidCellId, /^[A-Z0-9]{12}$/);
  assert.equal(linked.sourceCountryCode, 'HK'); assert.equal(linked.countryIdentityOverridden, false); assert.equal(linked.buildingIdentity, false); assert.equal(linked.postalAssignment, false);
});
test('HK mismatched range endpoints, unsafe strings and missing identity fail closed', () => {
  for (const mutate of [(r: any) => delete r.Address.PremisesAddress.EngPremisesAddress.EngStreet.BuildingNoFrom,
    (r: any) => r.Address.PremisesAddress.EngPremisesAddress.BuildingName = '<script>unsafe</script>',
    (r: any) => delete r.Address.PremisesAddress.GeoAddress]) { const r = row(); mutate(r); assert.throws(() => parse(payload([r])), /hk-/); }
});

test('HK does not copy unreviewed receipt fields into candidate provenance', () => {
  const p = prepare(); const receipt = { ...p.receipt, Authorization: 'DO_NOT_COPY_TOKEN' };
  const output = parseHongKongAlsCandidates(p.bytes, receipt);
  assert.ok(!JSON.stringify(output).includes('DO_NOT_COPY_TOKEN'));
  assert.ok(!Object.hasOwn(output.candidates[0].source, 'Authorization'));
});
