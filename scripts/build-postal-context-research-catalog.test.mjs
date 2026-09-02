import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  buildPostalContextResearchCatalog,
} from './build-postal-context-research-catalog.mjs';

test('committed Postal Context research catalog is deterministic and covers the canonical ledger', () => {
  const catalog = buildPostalContextResearchCatalog();
  const expected = `${JSON.stringify(catalog, null, 2)}\n`;
  const committed = readFileSync('data/postal-context/research-catalog.json', 'utf8');

  assert.equal(committed, expected);
  assert.equal(catalog.summary.totalCountries, 252);
  assert.deepEqual(catalog.summary.statusCounts, {
    blocked: 137,
    m2_verified: 20,
    pending: 95,
  });
  assert.equal(catalog.summary.manifests, 181);
  assert.equal(catalog.summary.explicitM2Definitions, 169);
  assert.equal(catalog.summary.runtimeArtifacts, 22);
  assert.equal(catalog.summary.geometryFeatures, 49_181);
  assert.equal(catalog.summary.geometryPositions, 3_881_359);
  assert.deepEqual(catalog.summary.sourceTypeCounts, { derived: 48_940, official: 241 });
  assert.equal(catalog.ordering.nextCountry, 'UY');
});

test('catalog separates rollout status from real derived runtime availability and exposes linked IDs', () => {
  const catalog = buildPostalContextResearchCatalog();
  const puertoRico = catalog.countries.find(country => country.countryCode === 'PR');
  assert.ok(puertoRico);
  assert.equal(puertoRico.status, 'blocked');
  assert.equal(puertoRico.runtimeArtifact?.recordCounts.features, 132);
  assert.deepEqual(puertoRico.runtimeArtifact?.sourceTypeCounts, { derived: 132 });
  assert.equal(puertoRico.runtimeArtifact?.sampleIds.postalContextId, 'postal-pr-census-zcta-00601');
  assert.equal(puertoRico.runtimeArtifact?.sampleIds.geometryFeatureId, 'census-pr-zcta-2020-00601');
  assert.equal(puertoRico.runtimeArtifact?.sampleIds.assertionId, 'census-pr-zcta-2020-00601-part-of-pr');
  assert.deepEqual(puertoRico.runtimeArtifact?.sampleIds.linkedContextIds, ['country-pr']);
  assert.match(puertoRico.blocker?.kind ?? '', /assignment-denominator/u);
  assert.ok(puertoRico.evidence.every(item => item.integrity === 'verified'));

  const unitedStates = catalog.countries.find(country => country.countryCode === 'US');
  assert.ok(unitedStates);
  assert.equal(unitedStates.status, 'blocked');
  assert.equal(unitedStates.runtimeArtifact?.promotionEligible, false);
  assert.equal(unitedStates.runtimeArtifact?.recordCounts.features, 1);
  assert.equal(unitedStates.runtimeArtifact?.sampleIds.postalContextId, 'postal-us-census-zcta-10001');
  assert.equal(unitedStates.runtimeArtifact?.sampleIds.geometryFeatureId, 'census-us-zcta-2020-10001');
  assert.deepEqual(unitedStates.runtimeArtifact?.sampleIds.assertionIds, [
    'census-us-zcta-2020-10001-part-of-us',
    'census-us-zcta-2020-10001-centroid-agid-crosswalk',
  ]);
  assert.deepEqual(unitedStates.runtimeArtifact?.sampleIds.linkedContextIds, [
    'country-us',
    'agid-us-census-zcta-10001-centroid',
  ]);
  assert.ok(unitedStates.evidence.every(item => item.integrity === 'verified'));

  const singapore = catalog.countries.find(country => country.countryCode === 'SG');
  assert.equal(
    singapore?.evidence.some(item => item.integrity === 'digest_mismatch'),
    true,
    'existing stale evidence pins must remain visible rather than silently trusted',
  );
});
