import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry, getPreferredPostalSourceIdsForCountry } from './officialPostalSourceCatalog';
import { isPostalContextCountryCode } from './postalContextCountryPolicy';
import { hongKongDigest, parseHongKongAlsCandidates } from './postalContextHongKongCandidate';
const read = (p: string) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const manifest = JSON.parse(read('data/postal_country_packs/hk/postal-context/repository-manifest.json'));
const profile = JSON.parse(read('data/postal_country_packs/hk/postal-context/source-profile.json'));
const contract = JSON.parse(read('data/postal_country_packs/hk/postal-context/m2-source-review.json'));
const reportPath = 'reports/postal-context-m2/hk-als-review-2026-08-28.json';
const report = JSON.parse(read(reportPath));

test('HK individually defines scoped real address-context M2 without inventing postal codes or lowering evidence gates', () => {
  assert.equal(manifest.repository.country_code, 'HK'); assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.postal_system.status, 'not_used'); assert.equal(manifest.postal_system.postal_code, null); assert.equal(manifest.postal_system.official_postal_geometry, 'none');
  const m2 = manifest.promotion.stages.find((s: { id: string }) => s.id === 'M2_scoped_address_context');
  assert.match(m2.definition, /rights-cleared current real HK.*published digest-pinned.*AGID loader\/API/);
  for (const flag of ['contains_raw_source_data', 'contains_real_addresses', 'contains_personal_data', 'contains_production_geometry']) assert.equal(manifest.release_scope[flag], false);
  for (const gate of ['approved-immutable-artifacts-and-remote-hash-verification', 'namespace-aware-real-agid-loader-and-api-verification']) assert.ok(manifest.promotion.m2_required_evidence.includes(gate));
  assert.ok(manifest.exception_classes.includes('one_location_multiple_addresses')); assert.ok(manifest.exception_classes.includes('creation_date_not_valid_from'));
});
test('HK policy, CSDI and ALS source identities do not grant automatic address or postcode validation', () => {
  const sources = getOfficialPostalSourcesForCountry('HK'), preferred = getPreferredPostalSourceIdsForCountry('HK');
  for (const id of ['hk-csdi', 'hk-als', 'hongkong-post-no-postcode']) {
    const s = sources.find(s => s.id === id); assert.ok(s); assert.equal(s.validationReadiness, 'metadata-only'); assert.ok(!preferred.includes(id));
    for (const input of [{ sourceIds: [id] }, { url: s.url }, { source: s.label }, { source: 'UPU', url: s.url }]) assert.equal(classifyPostalSourceTrust({ countryCode: 'HK', ...input }).strength, 'weak', id);
  }
  for (const url of ['https://www.als.gov.hk/lookup?q=public-building', 'https://www.als.gov.hk/galookup?ga=0000100002T20200101', 'https://www.als.gov.hk/', 'https://data.gov.hk/en-data/dataset/hk-ogcio-st_div_02-als']) assert.equal(classifyPostalSourceTrust({ countryCode: 'HK', url }).strength, 'weak', url);
  assert.equal(classifyPostalSourceTrust({ countryCode: 'HK', source: 'Hongkong Post' }).strength, 'weak');
});
test('HK keeps its country and no-postcode format; candidate work does not silently enable generic runtime routes', () => {
  const json = JSON.parse(read('src/data/address_formats/asia/east_asia/HK.json'));
  assert.equal(json.countryCode, 'HK'); assert.equal(json.postalCode.regex, null); assert.equal(json.postalCode.api, null);
  assert.equal(isPostalContextCountryCode('HK'), false); assert.equal(isPostalContextCountryCode('JP'), true);
  assert.ok(profile.sources.every((s: { bundled_here: boolean }) => s.bundled_here === false));
});
test('HK report proves bounded source observations and separate cell checks, not a retained data pack or country M2', () => {
  assert.equal(report.references.length, 6); assert.ok(report.references.every((r: { contentVerified: boolean }) => r.contentVerified));
  assert.equal(report.queries.length, 2); assert.equal(report.realCoordinateCellChecks, 2); assert.equal(report.realCandidateAdapterVerified, true);
  for (const q of report.queries) { assert.equal(q.profile.observedRows, 1); assert.equal(q.profile.bilingualBuildingNameRows, 1); assert.equal(q.profile.numberEndpointRows, 1); assert.equal(q.profile.missingPointRows, 0); assert.equal(q.rawRowsPersisted, 0); assert.equal(q.sourceCountryIdentityPreserved, true); }
  assert.equal(report.repeat.byteIdentical, true); assert.equal(report.geoAddressLookup.allReturnedIdentifiersMatch, true); assert.equal(report.geoAddressLookup.profile.scoredRows, 0);
  assert.equal(report.safety.publishedDataArtifacts, 0); assert.equal(report.safety.sourceSnapshotsRetained, 0); assert.equal(report.realPublishedPackLoaderApiVerified, false); assert.equal(report.countryM2Achieved, false);
  assert.equal(report.completeNationalCoverageVerified, false); assert.equal(report.sourceEdition, null);
});
test('HK positive conditional reuse and manual reproduction limits remain distinct from publication authority', () => {
  assert.equal(report.rights.conditionalCommercialAndNoncommercialReuse, true); assert.equal(report.rights.publicationApproved, false);
  assert.equal(report.rights.attributionRequired, true); assert.equal(report.rights.indemnityConditionPresent, true); assert.equal(report.rights.dictionaryReproductionSeparatelyRestricted, true);
  assert.equal(report.references.find((r: { id: string }) => r.id === 'hk-als-dictionary').responseDigest, contract.dictionary_digest);
  assert.deepEqual(contract.dictionary_vs_html_default, { parameter: 't', html: 20, dictionary_v3_1: 35, resolution: 'Set t=20 explicitly; do not infer which unversioned default currently applies.' });
});
test('HK ledger is publication-blocked with a hashed receipt; the reminder is not permission', () => {
  const ledger = JSON.parse(read('docs/postal-context-m2-rollout.json')), hk = ledger.countries.find((c: { countryCode: string }) => c.countryCode === 'HK');
  assert.equal(hk.region, 'asia'); assert.equal(hk.declaredStage, 'M1_metadata'); assert.equal(hk.status, 'blocked'); assert.equal(hk.evidence, null); assert.equal(hk.attempts, 1);
  assert.equal(hk.blocker.requiresExplicitApproval, true); assert.equal(Date.parse(hk.blocker.retryAfter) - Date.parse(hk.blocker.observedAt), 7 * 86400000);
  assert.equal(hk.lastAttempt.reportDigest, hongKongDigest(read(reportPath))); assert.deepEqual(hk.m2Definition, manifest.promotion.stages.find((s: { id: string }) => s.id.startsWith('M2_')));
});
test('HK future record creation dates fail rather than becoming valid-from assertions', () => {
  const bytes = Buffer.from(JSON.stringify({ RequestAddress: { AddressLine: ['SYNTHETIC'] }, SuggestedAddress: [{ Address: { PremisesAddress: { GeoAddress: '0000100002T20990101', EngPremisesAddress: { BuildingName: 'SYNTHETIC' } } }, ValidationInformation: null }] }));
  assert.throws(() => parseHongKongAlsCandidates(bytes, { url: 'https://www.als.gov.hk/lookup?q=synthetic', observedAt: '2026-08-28T00:00:00.000Z', responseDigest: hongKongDigest(bytes), termsUrl: 'https://data.gov.hk/en/terms-and-conditions', termsDigest: 'sha256:' + 'a'.repeat(64) }), /hk-future-record-creation/);
});
