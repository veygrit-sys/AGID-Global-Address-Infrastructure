import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const cv = ledger.countries.find(country => country.countryCode === 'CV');
const manifest = readJson('data/postal_country_packs/cv/postal-context/repository-manifest.json');
const sourceReview = readJson('data/postal_country_packs/cv/postal-context/m2-source-review.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/cv-source-review-2026-09-03.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/cv-checks-2026-09-03.json', root));

test('CV remains blocked at M1 with a country-specific M2 definition', () => {
  assert.equal(cv.status, 'blocked');
  assert.equal(cv.attempts, 1);
  assert.equal(cv.evidence, null);
  assert.equal(cv.m2Definition.id, 'M2_current_correios_assignment_and_postal_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === cv.m2Definition.id), cv.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.data_completion_verified, false);
  assert.equal(sourceReview.countryM2Achieved, false);
  assert.equal(cv.blocker.kind, 'assignment-denominator-and-postal-geometry-unavailable');
});

test('official receipts establish current four-digit semantics without a complete denominator', () => {
  const evidence = cv.blocker.evidence;
  assert.equal(evidence.currentPostalSystemConfirmed, true);
  assert.equal(evidence.currentPostalCodeFormat, '9999');
  assert.deepEqual(evidence.operatorReferenceExamples, ['7600 Plateau', '7601 Fazenda', '7602 Achada Santo Antonio']);
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 8);
  assert.equal(evidence.exactOfficialReferenceBytes, 1429576);
  assert.equal(evidence.currentCompleteAssignmentDenominatorAvailable, false);
  assert.equal(evidence.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.equal(evidence.operatorExamplesPromotedAsCompleteAssignments, 0);
  assert.match(evidence.jurisdictionIdentity, /ISO CV.*Cabo Verde\/Cape Verde/);
});

test('postcode, contact identifier and private CIP remain separate', () => {
  const evidence = cv.blocker.evidence;
  assert.equal(evidence.contactPageExtendedOccurrences, 35);
  assert.equal(evidence.contactPageUniqueExtendedValues, 32);
  assert.match(evidence.operatorContactIdentifierClass, /NNNN-NNN.*separate/);
  assert.equal(evidence.identifiersMergedOrDigitsInferred, false);
  assert.equal(evidence.cipRowsAccessed, 0);
  assert.equal(evidence.providerContactRegistrationAuthenticationContractTermsOrPaymentAttempted, false);
});

test('CV quality gate rejects geometry proxies and model-created postal truth', () => {
  const evidence = cv.blocker.evidence;
  assert.equal(evidence.qualityGateImplemented, true);
  assert.equal(evidence.pointRouteOfficeAdminBufferHullVoronoiRasterOrAgidProxiesPromoted, 0);
  assert.equal(evidence.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(evidence.derivedPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(evidence.virtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(evidence.productionEligibleRecords, 0);
  assert.equal(evidence.huggingFaceOrModelProductionIngested, false);
  assert.equal(evidence.openStreetMapPromotedToPostalAssignmentOrArea, false);
});

test('CV reports are digest-pinned and the queue advances to DJ', () => {
  assert.equal(digest(sourceReport), cv.lastAttempt.reportDigest);
  assert.equal(digest(checks), cv.lastAttempt.engineeringReportDigest);
  assert.equal(cv.blocker.evidence.sourceReviewDigest, cv.lastAttempt.reportDigest);
  assert.equal(cv.blocker.evidence.engineeringChecksDigest, cv.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(country => country.countryCode === 'DJ');
  assert.equal(next.status, 'pending');
  assert.equal(next.attempts, 0);
});

test('published artifacts and actual-app limitations are represented without M2 promotion', () => {
  const evidence = cv.blocker.evidence;
  for (const item of evidence.artifacts) {
    const path = new URL(item.url).pathname.split('/' + evidence.evidenceCommit + '/')[1];
    const bytes = execFileSync('git', ['show', evidence.evidenceCommit + ':' + path]);
    assert.equal(bytes.length, item.bytes);
    assert.equal(digest(bytes), item.digest);
  }
  assert.equal(evidence.appStarted, true);
  assert.equal(evidence.appHttpStatus, 200);
  assert.equal(evidence.realCvAgidPostalApiStatus, 503);
  assert.equal(evidence.realCvAgidAppAreaVisualizationVerified, false);
  assert.match(evidence.selectedCandidateEvidence, /Universidade de Cabo Verde.*Palmarejo Grande.*Photon/);
  assert.match(evidence.detailedAddressContext, /En3-St-05.*Praia/);
  assert.equal(evidence.nonPostalAgidIdExample, 'CV014TVAYWAK');
  assert.equal(evidence.nonPostalAgidIdPromotedToPostalId, false);
  assert.equal(evidence.postalApiMocked, false);
  assert.equal(evidence.renderedMapCanvasCount, 2);
  assert.equal(evidence.postalAreaNoticeCount, 0);
  assert.equal(evidence.manualVisualInspection, false);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0);
  assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.match(cv.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
