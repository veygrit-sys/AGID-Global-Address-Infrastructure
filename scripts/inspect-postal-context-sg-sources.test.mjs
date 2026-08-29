import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { config, sourceDigest } from './inspect-postal-context-sg-sources.mjs';

const report = JSON.parse(readFileSync(
  new URL('../reports/postal-context-m2/sg-source-review-2026-08-29.json', import.meta.url),
  'utf8',
));

test('Singapore review binds every reference to the exact reviewed source configuration', () => {
  assert.equal(report.countryCode, 'SG');
  assert.equal(report.criterionId, 'M2_experimental');
  assert.equal(report.references.length, config.references.length);
  assert.equal(new Set(report.references.map(reference => reference.id)).size, config.references.length);
  for (const reference of report.references) {
    const configured = config.references.find(candidate => candidate.id === reference.id);
    assert.ok(configured, `missing config for ${reference.id}`);
    assert.equal(reference.requestedUrl, configured.url);
    if (configured.kind === 'expected-http-failure') {
      assert.equal(reference.httpStatus, configured.expected_http_status);
      assert.equal(reference.contentVerified, false);
    } else {
      assert.equal(reference.responseDigest, configured.expected_digest);
      assert.equal(reference.byteLength, configured.reviewed_bytes);
      assert.equal(reference.contentVerified, true);
    }
  }
});

test('Singapore preview is explicitly bounded and never promoted to national M2 data', () => {
  assert.equal(report.dwellingPreview.grain, 'state-private-residential-property-point-preview');
  assert.equal(report.dwellingPreview.featureRows, 1420);
  assert.equal(report.dwellingPreview.postalCodes.validSixDigits, 1416);
  assert.equal(report.dwellingPreview.postalCodes.missing, 4);
  assert.equal(report.dwellingPreview.coordinates.sharedRows, 71);
  assert.equal(report.dwellingPreview.previewCompletenessVerified, false);
  assert.equal(report.dwellingPreview.nationalPostalCoverageVerified, false);
  assert.equal(report.currentAssignmentRowsValidated, 0);
  assert.equal(report.officialPostalGeometryRecords, 0);
  assert.equal(report.derivedPostalGeometryRecords, 0);
  assert.equal(report.publishedImmutableDataArtifacts, 0);
  assert.equal(report.realAgidRuntimeVerified, false);
  assert.equal(report.countryM2Achieved, false);
});

test('Singapore review records no authorized API, paid, contract, or raw-data operation', () => {
  assert.equal(report.datasetApiCalls, 0);
  assert.equal(report.oneMapApiCalls, 0);
  assert.equal(report.authenticatedRequests, 0);
  assert.equal(report.paidOperations, 0);
  assert.equal(report.explicitContractAcceptances, 0);
  assert.equal(report.newAccountsOrRepositories, 0);
  assert.equal(report.rawSourceBodiesInGit, 0);
  assert.match(report.blockerSummary, /not authorized or invoked/i);
});

test('sourceDigest is stable and uses the required sha256 prefix', () => {
  assert.equal(
    sourceDigest(Buffer.from('AGID Singapore M2')),
    'sha256:04fa866a9f6dbbbc5b6ee986e7f436f345ecbdc18822912754f9f3128fbbc5dc',
  );
});
