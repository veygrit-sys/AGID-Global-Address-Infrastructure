import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESSQL_POSTAL_OPERATIONS_INPUT_VERSION,
  ADDRESSQL_POSTAL_OPERATIONS_REPORT_VERSION,
  buildAddressQlPostalOperationsReport,
  parseAddressQlPostalOperationsInput,
  validateAddressQlPostalOperationsReport,
  type AddressQlPostalOperationsInput,
  type AddressQlPostalOperationsSource,
} from './addressQlPostalOperations';

const NOW = '2026-07-27T00:00:00Z';
const digest = (character: string) => `sha256:${character.repeat(64)}`;

function source(
  overrides: Partial<AddressQlPostalOperationsSource> = {},
): AddressQlPostalOperationsSource {
  return {
    sourceId: 'jp-synthetic-postal-source',
    countryCode: 'JP',
    capabilityLevel: 'L2',
    purpose: 'postal-existence',
    sourceVersion: '2026-07-01',
    releaseUrl: 'https://example.invalid/jp/releases',
    termsUrl: 'https://example.invalid/jp/terms',
    correctionUrl: 'https://example.invalid/jp/corrections',
    retrievedAt: '2026-07-01T00:00:00Z',
    lastCheckedAt: '2026-07-26T00:00:00Z',
    validUntil: '2026-10-01T00:00:00Z',
    datasetDigest: digest('a'),
    holdoutDigest: digest('b'),
    reportDigest: digest('c'),
    adapterId: 'jp-synthetic-approved',
    adapterMode: 'approved',
    attestationVerified: true,
    ...overrides,
  };
}

function input(
  overrides: Partial<AddressQlPostalOperationsInput> = {},
): AddressQlPostalOperationsInput {
  return {
    version: ADDRESSQL_POSTAL_OPERATIONS_INPUT_VERSION,
    monitorIntervalHours: 48,
    correctionSlaTargetHours: 72,
    currentCountryLevels: { JP: null },
    sources: [source()],
    corrections: [{
      correctionRef: digest('d'),
      countryCode: 'JP',
      sourceId: 'jp-synthetic-postal-source',
      receivedAt: '2026-07-25T00:00:00Z',
      publishedAt: '2026-07-26T00:00:00Z',
    }],
    ...overrides,
  };
}

test('fresh signed source and measured SLA become a promotion candidate', () => {
  const report = buildAddressQlPostalOperationsReport(input(), { now: NOW });

  assert.equal(report.sourceSummary.active, 1);
  assert.equal(report.sourceSummary.expired, 0);
  assert.equal(report.correctionSla.aggregate.state, 'met');
  assert.equal(report.correctionSla.aggregate.p95Hours, 24);
  assert.equal(report.countries[0].action, 'promotion_candidate');
  assert.equal(report.countries[0].recommendedLevel, 'L2');
  assert.deepEqual(validateAddressQlPostalOperationsReport(report), []);
  assert.equal(report.privacy.containsCorrectionContent, false);
  assert.doesNotMatch(JSON.stringify(report), new RegExp(digest('d')));
});

test('expired source automatically disables its adapter and requires demotion', () => {
  const report = buildAddressQlPostalOperationsReport(input({
    currentCountryLevels: { JP: 'L2' },
    sources: [source({ validUntil: '2026-07-26T23:59:59Z' })],
  }), { now: NOW });

  assert.equal(report.sources[0].state, 'expired');
  assert.equal(report.sources[0].adapterState, 'expired');
  assert.deepEqual(
    report.sourceSummary.automaticallyDisabledAdapterIds,
    ['jp-synthetic-approved'],
  );
  assert.equal(report.countries[0].action, 'demotion_required');
  assert.equal(report.countries[0].recommendedLevel, null);
});

test('version and correction-route changes require review before promotion', () => {
  const currentInput = input({
    sources: [source({
      sourceVersion: '2026-07-02',
      correctionUrl: 'https://example.invalid/jp/new-corrections',
    })],
  });
  const previous = buildAddressQlPostalOperationsReport(input(), {
    now: '2026-07-26T00:00:00Z',
  });
  const report = buildAddressQlPostalOperationsReport(currentInput, {
    now: NOW,
    previous: {
      version: ADDRESSQL_POSTAL_OPERATIONS_REPORT_VERSION,
      sources: previous.sources,
    },
  });

  assert.equal(report.sources[0].state, 'review_required');
  assert.equal(report.sources[0].versionChanged, true);
  assert.equal(report.sources[0].correctionRouteChanged, true);
  assert.equal(report.sources[0].promotionEligible, false);
  assert.equal(report.countries[0].action, 'review_required');
});

test('breached correction SLA requires a fail-closed country demotion', () => {
  const report = buildAddressQlPostalOperationsReport(input({
    currentCountryLevels: { JP: 'L2' },
    corrections: [{
      correctionRef: digest('e'),
      countryCode: 'JP',
      sourceId: 'jp-synthetic-postal-source',
      receivedAt: '2026-07-20T00:00:00Z',
      publishedAt: null,
    }],
  }), { now: NOW });

  assert.equal(report.correctionSla.aggregate.state, 'breached');
  assert.equal(report.correctionSla.aggregate.breachCount, 1);
  assert.equal(report.countries[0].action, 'demotion_required');
  assert.ok(report.countries[0].reasons.includes('correction-sla:breached'));
});

test('higher levels cannot bypass missing lower-level evidence', () => {
  const l3Source = source({
    sourceId: 'jp-synthetic-admin-source',
    adapterId: 'jp-synthetic-admin-approved',
    capabilityLevel: 'L3',
    purpose: 'admin-locality-consistency',
  });
  const report = buildAddressQlPostalOperationsReport(input({
    sources: [l3Source],
    corrections: [{
      correctionRef: digest('8'),
      countryCode: 'JP',
      sourceId: l3Source.sourceId,
      receivedAt: '2026-07-25T00:00:00Z',
      publishedAt: '2026-07-26T00:00:00Z',
    }],
  }), { now: NOW });

  assert.equal(report.countries[0].action, 'blocked');
  assert.equal(report.countries[0].recommendedLevel, null);
  assert.equal(report.countries[0].highestOperationalLevel, null);
  assert.equal(report.countries[0].highestPromotionEligibleLevel, null);
  assert.ok(
    report.countries[0].reasons.includes('evidence-hierarchy-incomplete'),
  );
});

test('country-wide SLA cannot promote a source without source-level evidence', () => {
  const l2Source = source();
  const l3Source = source({
    sourceId: 'jp-synthetic-admin-source',
    adapterId: 'jp-synthetic-admin-approved',
    capabilityLevel: 'L3',
    purpose: 'admin-locality-consistency',
  });
  const report = buildAddressQlPostalOperationsReport(input({
    currentCountryLevels: { JP: 'L2' },
    sources: [l2Source, l3Source],
    corrections: [{
      correctionRef: digest('7'),
      countryCode: 'JP',
      sourceId: l2Source.sourceId,
      receivedAt: '2026-07-25T00:00:00Z',
      publishedAt: '2026-07-26T00:00:00Z',
    }],
  }), { now: NOW });

  assert.equal(report.correctionSla.aggregate.state, 'met');
  assert.equal(report.countries[0].action, 'hold');
  assert.equal(report.countries[0].recommendedLevel, 'L2');
  assert.equal(report.countries[0].highestPromotionEligibleLevel, 'L2');
  assert.ok(report.countries[0].reasons.includes(
    `source:${l3Source.sourceId}:correction-sla:insufficient`,
  ));
});

test('input parser rejects correction content and unknown address fields', () => {
  assert.throws(
    () => parseAddressQlPostalOperationsInput({
      ...input(),
      sources: [{
        ...source(),
        rawAddress: 'not accepted',
      }],
    }),
    /unsupported fields/,
  );
  assert.throws(
    () => parseAddressQlPostalOperationsInput({
      ...input(),
      corrections: [{
        ...input().corrections[0],
        correctionText: 'not accepted',
      }],
    }),
    /unsupported fields/,
  );
});

test('invalid correction windows and report tampering are detected', () => {
  assert.throws(
    () => buildAddressQlPostalOperationsReport(input({
      corrections: [{
        correctionRef: digest('f'),
        countryCode: 'JP',
        sourceId: 'jp-synthetic-postal-source',
        receivedAt: '2026-07-26T00:00:00Z',
        publishedAt: '2026-07-25T00:00:00Z',
      }],
    }), { now: NOW }),
    /invalid time window/,
  );
  assert.throws(
    () => buildAddressQlPostalOperationsReport(input({
      corrections: [{
        correctionRef: digest('9'),
        countryCode: 'US',
        sourceId: 'jp-synthetic-postal-source',
        receivedAt: '2026-07-25T00:00:00Z',
        publishedAt: '2026-07-26T00:00:00Z',
      }],
    }), { now: NOW }),
    /does not match its source country/,
  );

  const report = buildAddressQlPostalOperationsReport(input(), { now: NOW });
  report.countries[0].action = 'hold';
  assert.ok(
    validateAddressQlPostalOperationsReport(report)
      .includes('report-digest-mismatch'),
  );
});
