import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildApprovedCountryGeographicMetadataEvaluationIndex } from './countryGeographicMetadataEvaluationCatalog';
import {
  COUNTRY_GEOGRAPHIC_METADATA_SOURCE_REVIEW_LEDGER_VERSION,
  listCountryGeographicMetadataSourceReviews,
} from './countryGeographicMetadataSourceReviewLedger';
import { projectCountryGeographicMetadataReadiness } from './countryGeographicMetadataEvaluationIndex';

test('keeps Honduras official-source findings blocked until reuse and current-key gates are evidenced', () => {
  assert.equal(COUNTRY_GEOGRAPHIC_METADATA_SOURCE_REVIEW_LEDGER_VERSION, 'country-geographic-metadata-source-review-ledger-v1');
  const reviews = listCountryGeographicMetadataSourceReviews('hn');

  assert.equal(reviews.length, 2);
  assert.ok(reviews.every(review => review.reviewStatus === 'blocked'));
  assert.ok(reviews.every(review => review.rawPrivateMaterialStored === false));
  assert.ok(reviews.some(review => (
    review.nextGate === 'obtain-explicit-reuse-terms-and-current-official-administrative-key-release'
  )));
  assert.ok(reviews.some(review => review.nextGate === 'exclude-sensitive-or-precise-location-source'));

  const approvedIndex = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-07-25T00:00:00Z' });
  assert.deepEqual(projectCountryGeographicMetadataReadiness(approvedIndex, 'HN'), []);
});

test('returns review metadata only and validates country filter input', () => {
  const reviews = listCountryGeographicMetadataSourceReviews();
  for (const review of reviews) {
    assert.match(review.sourceUrl, /^https:\/\//);
    assert.match(review.authorityEvidenceUrl, /^https:\/\//);
    assert.ok(!Object.keys(review).some(field => /address|recipient|postcode|latitude|longitude|credential|secret/i.test(field)));
  }
  assert.throws(
    () => listCountryGeographicMetadataSourceReviews('Honduras'),
    /ISO 3166-1 alpha-2/,
  );
});

test('routes Nicaragua postal hierarchy evidence away from the administrative-key index', () => {
  const reviews = listCountryGeographicMetadataSourceReviews('NI');
  assert.equal(reviews.length, 1);
  assert.equal(reviews[0]?.sourceId, 'correos-ni-postal-code-system');
  assert.equal(reviews[0]?.observedScope, 'postal-reference-with-neighborhood-level');
  assert.equal(reviews[0]?.nextGate, 'route-to-postal-source-evidence-registry');
  assert.equal(reviews[0]?.rawPrivateMaterialStored, false);

  const approvedIndex = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-07-25T00:00:00Z' });
  assert.deepEqual(projectCountryGeographicMetadataReadiness(approvedIndex, 'NI'), []);
});

test('does not mistake El Salvador postal service information for reusable administrative metadata', () => {
  const reviews = listCountryGeographicMetadataSourceReviews('SV');
  assert.equal(reviews.length, 1);
  assert.equal(reviews[0]?.sourceId, 'correos-sv-service-rights');
  assert.equal(reviews[0]?.observedScope, 'postal-institutional-service-information');
  assert.equal(reviews[0]?.nextGate, 'obtain-current-official-postal-code-or-administrative-key-publication');
  assert.equal(reviews[0]?.reuseTermsStatus, 'not-recorded');

  const approvedIndex = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-07-25T00:00:00Z' });
  assert.deepEqual(projectCountryGeographicMetadataReadiness(approvedIndex, 'SV'), []);
});

test('blocks Lesotho boundary layers until the source publishes reuse, version, and correction evidence', () => {
  const reviews = listCountryGeographicMetadataSourceReviews('LS');
  assert.equal(reviews.length, 1);
  assert.equal(reviews[0]?.sourceId, 'drws-ls-boundaries-map-service');
  assert.equal(reviews[0]?.observedScope, 'administrative-boundaries-without-reuse-or-version');
  assert.equal(reviews[0]?.nextGate, 'obtain-explicit-reuse-terms-version-and-source-correction-path');
  assert.equal(reviews[0]?.correctionPathStatus, 'not-accepted');
  assert.equal(reviews[0]?.rawPrivateMaterialStored, false);

  const approvedIndex = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-07-25T00:00:00Z' });
  assert.deepEqual(projectCountryGeographicMetadataReadiness(approvedIndex, 'LS'), []);
});

test('keeps Eswatini regional hierarchy information out of validation until reusable evidence exists', () => {
  const reviews = listCountryGeographicMetadataSourceReviews('SZ');
  assert.equal(reviews.length, 1);
  assert.equal(reviews[0]?.sourceId, 'gov-sz-regional-administration');
  assert.equal(reviews[0]?.observedScope, 'administrative-hierarchy-without-reuse-or-version');
  assert.equal(reviews[0]?.nextGate, 'obtain-explicit-reuse-terms-version-and-source-correction-path');
  assert.equal(reviews[0]?.rawPrivateMaterialStored, false);

  const approvedIndex = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-07-25T00:00:00Z' });
  assert.deepEqual(projectCountryGeographicMetadataReadiness(approvedIndex, 'SZ'), []);
});
