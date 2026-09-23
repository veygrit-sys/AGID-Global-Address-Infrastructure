import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildGeoOpenSourceGapStrategyReport,
} from './geoOpenSourceGapStrategy';
import type { ExternalOssGeoPostalIntegrationPlan } from './externalOssGeoPostalIntegration';

function plan(overrides: Partial<ExternalOssGeoPostalIntegrationPlan>): ExternalOssGeoPostalIntegrationPlan {
  return {
    version: 'external-oss-geo-postal-integration-v1',
    countryCode: 'XX',
    countryName: 'Example',
    continent: 'special',
    relativePath: 'special/XX.json',
    policy: {
      id: 'no-postal-weak-geo',
      label: 'No Postal Code + Weak Geo OSS',
      validationMode: 'manual-review',
      autofillMode: 'manual-first',
      reason: 'test',
    },
    coverageStatus: 'no-normal-postcode',
    operationalClass: 'no-postal-code-weak-geo-oss',
    capabilities: {
      postalAutofill: 'disabled',
      postalValidation: 'none',
      geoVerification: 'manual-support',
      addressCandidateLookup: 'limited',
      manualFallback: true,
      canCacheBulk: false,
      canBundleRedistributable: false,
    },
    adapterPolicy: {
      queryMode: 'manual-first',
      liveApiDefault: 'disabled',
      countryPackLoading: 'lazy-by-country',
      externalRequestPrivacy: [],
      cacheStrategy: {
        postalApiTtlMs: 1,
        openReferenceTtlMs: 1,
        negativeResultTtlMs: 1,
        staleWhileRevalidateMs: 1,
      },
    },
    sources: [],
    sourceGroups: {
      postal: [],
      address: [],
      geocoding: [],
      'admin-boundary': [],
      gazetteer: [],
      'format-standard': [],
      'map-context': [],
      terrain: [],
      water: [],
      natural: [],
      hazard: [],
      imagery: [],
      facility: [],
      statistics: [],
      unknown: [],
    },
    unregisteredSourceIds: [],
    releaseGates: [],
    recommendations: [],
    coverage: {
      continent: 'special',
      relativePath: 'special/XX.json',
      countryCode: 'XX',
      countryName: 'Example',
      postalCodeRequired: false,
      hasPostalCodeMetadata: false,
      status: 'no-normal-postcode',
      bestTrustTier: 'weak',
      sourceIds: [],
      evidence: [],
      missingOfficialSource: false,
      usesGlobalOfficialFallback: false,
      countrySpecificOfficialEvidence: false,
      countrySpecificOfficialSourceMissing: false,
      recommendation: 'test',
    },
    ...overrides,
  } as ExternalOssGeoPostalIntegrationPlan;
}

test('marks no-postcode weak geo coverage as P0 critical', () => {
  const report = buildGeoOpenSourceGapStrategyReport([plan({})], new Date('2026-07-01T00:00:00Z'));

  assert.equal(report.gapCount, 1);
  assert.equal(report.entries[0].priority, 'P0-critical');
  assert.ok(report.entries[0].proposedOpenSourcePackages.includes('agid-open-xx-no-postcode-grid'));
});

test('tracks missing local core geo roles', () => {
  const report = buildGeoOpenSourceGapStrategyReport([
    plan({
      countryCode: 'YY',
      countryName: 'Partial',
      operationalClass: 'postal-code-available-weak-api',
      capabilities: {
        postalAutofill: 'candidate',
        postalValidation: 'format-only',
        geoVerification: 'cross-check',
        addressCandidateLookup: 'candidate',
        manualFallback: true,
        canCacheBulk: true,
        canBundleRedistributable: true,
      },
      sources: [{
        id: 'yy-boundaries',
        name: 'YY Boundaries',
        url: 'https://example.test',
        kind: 'admin-boundary',
        role: 'admin-boundary',
        coverage: 'country',
        usage: 'primary',
        priority: 1,
        loadMode: 'background-bulk',
        licenseLabel: 'CC BY 4.0',
        redistributable: true,
        requiresLicenseReview: false,
        notes: [],
      }],
    }),
  ], new Date('2026-07-01T00:00:00Z'));

  assert.equal(report.entries[0].priority, 'P1-high');
  assert.deepEqual(report.entries[0].presentLocalCoreRoles, ['admin-boundary']);
  assert.ok(report.entries[0].missingCoreRoles.includes('address'));
});
