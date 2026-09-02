import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const ledger = JSON.parse(readFileSync('docs/postal-context-m2-rollout.json', 'utf8'));
const country = ledger.countries.find(item => item.countryCode === 'VC');

test('VC ledger preserves its country-specific M2 definition and honest blocker', () => {
  assert.ok(country);
  assert.equal(country.status, 'blocked');
  assert.equal(country.attempts, 1);
  assert.equal(country.declaredStage, 'M1_metadata');
  assert.match(country.m2Definition.definition, /complete finite national denominator.*area\/non-area.*real VC API\/app/iu);
  assert.equal(country.lastAttempt.officialReferenceCodes, 58);
  assert.equal(country.lastAttempt.completeCurrentTypedVersionedAssignmentRecords, 0);
  assert.equal(country.lastAttempt.eligiblePostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(country.lastAttempt.m2QualifiedRecords, 0);
  assert.equal(country.lastAttempt.realAppPostalAreaVisualized, false);
  assert.equal(country.blocker.retryAfter, '2026-12-02T12:27:31.870Z');
  assert.match(country.blocker.reason, /58 VCNNNN.*Census Divisions.*zero surfaces.*not represented as real-app/iu);
});

test('VC evidence links resolve to artifact-commit paths with matching hashes and sizes', () => {
  const evidence = country.blocker.evidence;
  assert.equal(evidence.evidenceCommit, '3715ce70050fe4b050dcd48ca1d998d36784561e');
  assert.equal(evidence.sourceBodyCount, 5);
  assert.equal(evidence.sourceBodyBytes, 815998);
  assert.equal(evidence.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(evidence.censusDivisionGeometryUsedAsPostalGeometry, false);
  assert.equal(evidence.visualInspectionCompleted, false);
  assert.equal(evidence.realVcAgidAppAreaVisualizationVerified, false);
  for (const artifact of evidence.artifacts) {
    const marker = `/blob/${evidence.evidenceCommit}/`;
    assert.ok(artifact.url.includes(marker));
    const path = artifact.url.split(marker)[1];
    assert.equal(existsSync(path), true, path);
    const bytes = readFileSync(path);
    assert.equal(bytes.length, artifact.bytes, path);
    assert.equal(`sha256:${createHash('sha256').update(bytes).digest('hex')}`, artifact.digest, path);
  }
});

test('VC source report fixes the reference count, rights boundary and zero postal geometry', () => {
  const source = JSON.parse(readFileSync(country.lastAttempt.report, 'utf8'));
  assert.equal(source.postalSystem.currentSystemConfirmed, true);
  assert.equal(source.postalSystem.format, 'VCNNNN');
  assert.equal(source.postalSystem.distinctCodesOnOfficialReference, 58);
  assert.equal(source.postalSystem.completeCurrentTypedVersionedAssignmentsValidated, 0);
  assert.equal(source.exactSourceSet.bodyCount, 5);
  assert.equal(source.exactSourceSet.totalBytes, 815998);
  assert.equal(source.exactSourceSet.rawBodiesCommitted, 0);
  assert.equal(source.geometryAssessment.eligiblePostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(source.geometryAssessment.censusDivisionGeometryIsPostalGeometry, false);
  assert.equal(source.sources.find(item => item.sourceId === 'svg-statistical-office-open-licence').extendsToSvgPostOrUpu, false);
});

test('VC address format and repository rules preserve code and ID semantics', () => {
  const format = JSON.parse(readFileSync(country.addressFormat, 'utf8'));
  const manifest = JSON.parse(readFileSync(country.manifest, 'utf8'));
  assert.equal(format.postalCode.format, 'VCNNNN');
  assert.equal(format.postalCode.regex, '^VC\\d{4}$');
  assert.match(format.native.addressFormat, /\{\{city\}\}\n\{\{postcode\}\}/u);
  assert.equal(format.addressRules.postalCode.usage, 'required-separate-line-below-locality');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.promotion.data_completion_verified, false);
  assert.match(manifest.postal_system.id_rule, /postal_object_id.*administrative_context_id.*geometry_id.*civic_address_id.*building_id.*agid_crosswalk_id/u);
});

test('VC deterministic proof fails closed and rollout advances to VE', () => {
  const engineering = JSON.parse(readFileSync(country.lastAttempt.engineeringReport, 'utf8'));
  const catalog = JSON.parse(readFileSync('data/postal-context/research-catalog.json', 'utf8'));
  assert.equal(engineering.application.started, false);
  assert.equal(engineering.deterministicFallback.passed, true);
  assert.equal(engineering.deterministicFallback.eligiblePostalAreaCount, 0);
  assert.equal(engineering.deterministicFallback.polygonDrawn, false);
  assert.equal(engineering.deterministicFallback.censusProxyUsed, false);
  assert.equal(engineering.visualInspection.completed, false);
  assert.equal(catalog.ordering.nextCountry, 'VE');
  assert.deepEqual(catalog.summary.statusCounts, { blocked: 139, m2_verified: 20, pending: 93 });
});
