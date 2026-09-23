import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from 'yaml';
import { getPostcodeInputConfig } from './postcodeControl';
import { getAddressElementPostalCodePolicy } from './addressElementInputPolicy';
import { validateAddressWithOpenSourceRules } from './addressValidation';
import { isPostalContextCountryCode, normalizePostalContextPostalCode } from './postalContextCountryPolicy';
import { getAddressQlGlobalCountryPreloadProfile } from './addressQlGlobalCountryPreload';
const read = (path: string) => readFileSync(new URL('../../'+path, import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const json = (path: string) => JSON.parse(read(path));
const root = 'data/postal_country_packs/kp/postal-context/';
const manifest = json(root+'repository-manifest.json');
const config = json(root+'m2-source-review.json');
const format = json('src/data/address_formats/asia/east_asia/KP.json');
const reportPath = 'reports/postal-context-m2/kp-source-review-2026-08-28.json';
const report = json(reportPath);
test('KP retains M0 with a reviewed country-specific real-data criterion and no production pack', () => {
  assert.equal(manifest.repository.country_code, 'KP');
  assert.equal(manifest.promotion.current_stage, 'M0_inventory');
  assert.equal(manifest.promotion.stages[0].id, 'M2_licensed_context_without_required_postcode');
  assert.match(manifest.promotion.stages[0].definition, /independently licensed real point\/area geometry/);
  assert.match(manifest.promotion.stages[0].definition, /CRS\/topology.*civic-address\/building-link.*privacy\/licence/);
  assert.match(manifest.promotion.stages[0].definition, /immutable data artifacts.*actual AGID loader\/API/);
  assert.equal(manifest.postal_system.default_geometry, 'none');
  assert.equal(manifest.promotion.hard_blockers.length, 8);
  for (const key of ['contains_raw_source_data', 'contains_real_addresses', 'contains_personal_data', 'contains_production_geometry']) assert.equal(manifest.release_scope[key], false);
  assert.equal(json('data/postal_country_packs/kp/manifest.json').officialStatus, 'draft');
});
test('KP JSON and YAML remove unproven fixed format without discarding optional manual input', () => {
  const yaml = parse(read('src/data/address_formats/asia/east_asia/KP.yaml'));
  assert.deepEqual(yaml.postalCode, format.postalCode);
  assert.deepEqual(yaml.addressRules.postalCode, format.addressRules.postalCode);
  assert.equal(format.postalCode.format, null); assert.equal(format.postalCode.regex, null);
  assert.equal(format.postalCode.api, null); assert.match(format.postalCode.source, /UPU.*Sep\. 2025/);
  for (const side of ['native', 'english']) {
    const field = format[side].fields.find((f: any) => f.key === 'postcode');
    assert.equal(field.required, false); assert.equal(field.placeholder, '');
    assert.deepEqual(yaml[side], format[side]);
  }
  assert.equal(getPostcodeInputConfig(format).kind, 'none');
  const policy = getAddressElementPostalCodePolicy(format);
  assert.equal(policy.required, false); assert.equal(policy.usage, 'optional');
  assert.equal(policy.regex, null); assert.equal(policy.characterSlots, undefined);
  for (const postcode of ['', '123-456', '01234']) {
    const result = validateAddressWithOpenSourceRules({ country_code: 'KP', postcode }, format, []);
    assert.equal(result.postalCodeValid, null);
  }
});
test('KP does not borrow KR assignments or enable a real-data Postal Context route', () => {
  assert.equal(isPostalContextCountryCode('KP'), false);
  for (const value of ['123-456', '01234', 'AGID:KP:example']) assert.equal(normalizePostalContextPostalCode('KP', value), null);
  assert.equal(isPostalContextCountryCode('KR'), true);
  assert.equal(normalizePostalContextPostalCode('KR', '01234'), '01234');
  // This legacy preload category means no configured syntax, not a new factual absence claim.
  const preload = getAddressQlGlobalCountryPreloadProfile('KP');
  assert.equal(preload?.validationReadiness, 'postal_equivalent_required');
  assert.match(preload?.sourcePolicy.postalEquivalentStrategy ?? '', /do not invent official postal codes/);
});
test('KP actual PDF and HTML receipts preserve mixed editions and document-grain evidence', () => {
  assert.equal(report.references.length, 4);
  assert.ok(report.references.every((r: any) => r.httpStatus === 200 && r.contentVerified && r.sourceDataRecords === 0));
  const pdf = report.references.find((r: any) => r.id === 'general');
  assert.equal(pdf.responseDigest, config.references[0].expected_digest);
  assert.equal(pdf.byteLength, 631050); assert.equal(pdf.physicalPages, 12);
  assert.deepEqual(pdf.visuallyReviewedPages, [1,2,4]);
  assert.equal(pdf.kpTableEdition, 'Sep. 2025'); assert.equal(pdf.otherRequiredCodeTableEdition, 'Aug. 2026');
  assert.equal(pdf.currentNationalFrameworkVerified, false); assert.equal(pdf.permanentAbsenceInferred, false);
  assert.equal(report.assignmentQuality.missingCodeRate, null);
  assert.equal(report.assignmentQuality.duplicateAssignmentRate, null);
  assert.equal(report.rightsReview.exact_kp_data_reuse_rights_verified, false);
  for (const key of ['sourceRowsPersisted', 'currentAssignmentRowsValidated', 'productionGeometryRecords', 'civicBuildingRelations', 'publishedDataArtifacts', 'paidOperations', 'authenticatedRequests', 'privateQueries']) assert.equal(report[key], 0);
  assert.equal(report.realAgidRuntimeVerified, false); assert.equal(report.countryM2Achieved, false);
});
test('KP ledger binds the report and a public-only retry, retaining M2 unverified', () => {
  const kp = json('docs/postal-context-m2-rollout.json').countries.find((c: any) => c.countryCode === 'KP');
  assert.equal(kp.status, 'blocked'); assert.equal(kp.declaredStage, 'M0_inventory');
  assert.equal(kp.attempts, 1); assert.equal(kp.evidence, null);
  assert.deepEqual(kp.m2Definition, manifest.promotion.stages[0]);
  assert.equal(kp.lastAttempt.reportDigest, 'sha256:'+createHash('sha256').update(read(reportPath)).digest('hex'));
  assert.equal(Date.parse(kp.blocker.retryAfter)-Date.parse(kp.blocker.observedAt), 7*86400000);
  assert.equal(kp.blocker.requiresExplicitApproval, false);
  assert.match(kp.blocker.retryPolicy, /after all pending.*does not authorize restricted access or publication/);
  assert.doesNotMatch(read(reportPath), /__RequestVerificationToken|recipient_name|owner_name|raw_html|"records"\s*:/);
});
