import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  buildPostalSourceCandidateLedger,
  buildPostalSourceFrameworkLedger,
  POSTAL_SOURCE_CANDIDATE_LEDGER_VERSION,
} from './postalSourceCandidateLedger';

const candidateInput = {
  countryCode: 'GT',
  discoveredAt: '2026-07-24T00:00:00.000Z',
  reviewBy: '2026-10-22T00:00:00.000Z',
};

test('records the Guatemala legal framework without treating it as a postal data candidate', () => {
  const candidateEntries = buildPostalSourceCandidateLedger(candidateInput);
  const frameworkEntries = buildPostalSourceFrameworkLedger(candidateInput);

  assert.equal(POSTAL_SOURCE_CANDIDATE_LEDGER_VERSION, 'postal-source-candidate-ledger-v0.2');
  assert.deepEqual(candidateEntries, []);
  assert.equal(frameworkEntries.length, 1);
  const entry = frameworkEntries[0]!;
  assert.equal(entry.frameworkId, 'postal-source-framework:gt:correos-guatemala-postal-legal-framework');
  assert.equal(entry.sourceRole, 'legal-framework-only');
  assert.equal(entry.sourceId, 'correos-guatemala-postal-legal-framework');
  assert.equal(entry.sourceUrl, 'https://correos.gob.gt/ART10/inciso_1/Normativa.pdf');
  assert.equal(entry.validationReadiness, 'metadata-only');
  assert.equal(entry.nextGate, 'find-current-postal-reference-dataset');
  assert.equal(entry.rawPrivateMaterialStored, false);
  assert.match(entry.catalogMetadataDigest, /^[a-f0-9]{64}$/);
  assert.match(entry.nonClaim, /not evidence of a current postal-reference dataset/i);
  assert.match(entry.nonClaim, /delivery availability/i);
});

test('does not create candidate rows for reference-eligible catalog sources', () => {
  assert.deepEqual(buildPostalSourceCandidateLedger({
    ...candidateInput,
    countryCode: 'DE',
  }), []);
  assert.deepEqual(buildPostalSourceFrameworkLedger({
    ...candidateInput,
    countryCode: 'DE',
  }), []);
});

test('keeps the Guatemala country package candidate ledger synchronized with the catalog', () => {
  const artifactPath = join(
    process.cwd(),
    'data',
    'open_geo_repositories',
    'agid-open-gt-geocoder-fixtures',
    'sources.json',
  );
  const qualityGatesPath = join(
    process.cwd(),
    'data',
    'open_geo_repositories',
    'agid-open-gt-geocoder-fixtures',
    'quality-gates.json',
  );
  const artifact = JSON.parse(readFileSync(artifactPath, 'utf8')) as {
    upstreamDataBundled: boolean;
    redistributionStatus: string;
    sourceCandidates: unknown;
    sourceFrameworkReferences: unknown;
  };
  const qualityGates = JSON.parse(readFileSync(qualityGatesPath, 'utf8')) as {
    gates: Array<{ id: string; required: boolean }>;
  };
  const expectedCandidateEntries = buildPostalSourceCandidateLedger({
    countryCode: 'GT',
    discoveredAt: '2026-07-24T23:37:37.562Z',
    reviewBy: '2026-10-22T23:37:37.562Z',
  });
  const expectedFrameworkEntries = buildPostalSourceFrameworkLedger({
    countryCode: 'GT',
    discoveredAt: '2026-07-24T23:37:37.562Z',
    reviewBy: '2026-10-22T23:37:37.562Z',
  });

  assert.equal(artifact.upstreamDataBundled, false);
  assert.equal(artifact.redistributionStatus, 'review-required-before-import');
  assert.deepEqual(artifact.sourceCandidates, expectedCandidateEntries);
  assert.deepEqual(artifact.sourceFrameworkReferences, expectedFrameworkEntries);
  const requiredGateIds = new Set(
    qualityGates.gates.filter(gate => gate.required).map(gate => gate.id),
  );
  assert.ok(requiredGateIds.has('official-framework-not-postal-reference-dataset'));
  assert.ok(requiredGateIds.has('current-postal-reference-dataset-required'));
  assert.ok(requiredGateIds.has('source-version-terms-coverage-correction-required'));
});

test('rejects malformed or non-forward candidate review times', () => {
  assert.throws(() => buildPostalSourceCandidateLedger({
    ...candidateInput,
    countryCode: 'G',
  }), /ISO alpha-2/);
  assert.throws(() => buildPostalSourceCandidateLedger({
    ...candidateInput,
    discoveredAt: 'not-a-timestamp',
  }), /discoveredAt/);
  assert.throws(() => buildPostalSourceCandidateLedger({
    ...candidateInput,
    reviewBy: candidateInput.discoveredAt,
  }), /later than discoveredAt/);
  assert.throws(() => buildPostalSourceFrameworkLedger({
    ...candidateInput,
    countryCode: 'G',
  }), /ISO alpha-2/);
});
