import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  evaluatePostalSourcePromotion,
  type PostalSourceEvidenceRecord,
} from './postalSourcePromotionGate';

const approvedRecord: PostalSourceEvidenceRecord = {
  countryCode: 'GT',
  sourceId: 'synthetic-official-postal-index',
  sourceKind: 'official',
  sourceUrl: 'https://example.gov.gt/postal-index',
  sourceVersion: '2026-06',
  retrievedAt: '2026-07-01T00:00:00.000Z',
  maxAgeDays: 90,
  contentDigest: `sha256:${'a'.repeat(64)}`,
  rights: {
    status: 'approved',
    termsUrl: 'https://example.gov.gt/open-data-terms',
    verifiedAt: '2026-07-01T00:00:00.000Z',
  },
  coverage: {
    level: 'lookup',
    scope: 'Synthetic national postal-to-administrative-key coverage',
    administrativeKeyLevels: ['ADM1', 'ADM2'],
  },
  correctionPath: 'https://example.gov.gt/data-corrections',
};

test('promotes complete, fresh, reusable evidence to source-versioned postal lookup', () => {
  const result = evaluatePostalSourcePromotion(approvedRecord, {
    now: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(result.level, 'evidence-backed-lookup');
  assert.equal(result.permitsPostalLookup, true);
  assert.equal(result.permitsDeliverabilityClaim, false);
  assert.deepEqual(result.reasons, []);
  assert.equal(result.ageDays, 25);
  assert.match(result.nextAction, /do not infer deliverability/);
});

test('keeps stale or format-only sources at candidate presentation', () => {
  const result = evaluatePostalSourcePromotion({
    ...approvedRecord,
    retrievedAt: '2025-01-01T00:00:00.000Z',
    coverage: {
      ...approvedRecord.coverage,
      level: 'format',
    },
  }, {
    now: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(result.level, 'candidate-only');
  assert.equal(result.permitsPostalLookup, false);
  assert.ok(result.reasons.includes('source-stale'));
  assert.ok(result.reasons.includes('coverage-insufficient'));
});

test('requires fixed versions, verified reuse terms, replay digests, and correction paths', () => {
  const result = evaluatePostalSourcePromotion({
    ...approvedRecord,
    sourceVersion: 'latest',
    contentDigest: 'missing',
    rights: {
      status: 'pending',
      termsUrl: '',
      verifiedAt: '',
    },
    coverage: {
      level: 'lookup',
      scope: '',
      administrativeKeyLevels: [],
    },
    correctionPath: 'email maintainer',
  }, {
    now: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(result.level, 'candidate-only');
  assert.equal(result.permitsPostalLookup, false);
  assert.deepEqual(result.reasons, [
    'source-version-missing',
    'content-digest-invalid',
    'reuse-approval-missing',
    'reuse-terms-url-invalid',
    'reuse-verification-time-invalid',
    'coverage-scope-missing',
    'administrative-key-scope-missing',
    'correction-path-invalid',
  ]);
});

test('rejects administrative-key lists that contain blank scope entries', () => {
  const result = evaluatePostalSourcePromotion({
    ...approvedRecord,
    coverage: {
      ...approvedRecord.coverage,
      administrativeKeyLevels: ['ADM1', '   '],
    },
  }, {
    now: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(result.level, 'candidate-only');
  assert.equal(result.permitsPostalLookup, false);
  assert.deepEqual(result.reasons, ['administrative-key-scope-missing']);
});

test('blocks prohibited reuse and materially future-dated snapshots', () => {
  const result = evaluatePostalSourcePromotion({
    ...approvedRecord,
    retrievedAt: '2026-08-01T00:00:00.000Z',
    rights: {
      ...approvedRecord.rights,
      status: 'prohibited',
    },
  }, {
    now: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(result.level, 'blocked');
  assert.equal(result.permitsPostalLookup, false);
  assert.ok(result.reasons.includes('retrieval-time-in-future'));
  assert.ok(result.reasons.includes('reuse-prohibited'));
});

test('blocks future-dated reuse verification evidence', () => {
  const result = evaluatePostalSourcePromotion({
    ...approvedRecord,
    rights: {
      ...approvedRecord.rights,
      verifiedAt: '2026-08-01T00:00:00.000Z',
    },
  }, {
    now: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(result.level, 'blocked');
  assert.equal(result.permitsPostalLookup, false);
  assert.deepEqual(result.reasons, ['reuse-verification-time-in-future']);
  assert.match(result.nextAction, /Exclude the source/);
});

test('accepts a reuse-approved OSS source without upgrading it to an official claim', () => {
  const result = evaluatePostalSourcePromotion({
    ...approvedRecord,
    countryCode: 'LS',
    sourceId: 'synthetic-oss-postal-index',
    sourceKind: 'open-source',
    sourceUrl: 'https://example.org/ls-postal-index',
    rights: {
      status: 'approved',
      termsUrl: 'https://example.org/license',
      verifiedAt: '2026-07-02T00:00:00.000Z',
    },
    correctionPath: 'https://example.org/issues',
  }, {
    now: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(result.level, 'evidence-backed-lookup');
  assert.equal(result.permitsPostalLookup, true);
  assert.equal(result.permitsDeliverabilityClaim, false);
});
