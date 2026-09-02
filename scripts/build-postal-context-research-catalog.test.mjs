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
    blocked: 136,
    m2_verified: 20,
    pending: 96,
  });
  assert.equal(catalog.summary.manifests, 181);
  assert.equal(catalog.summary.explicitM2Definitions, 168);
  assert.equal(catalog.summary.runtimeArtifacts, 21);
  assert.equal(catalog.summary.geometryFeatures, 49_180);
  assert.equal(catalog.summary.geometryPositions, 3_881_235);
  assert.deepEqual(catalog.summary.sourceTypeCounts, { derived: 48_939, official: 241 });
  assert.equal(catalog.ordering.nextCountry, 'US');
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

  const singapore = catalog.countries.find(country => country.countryCode === 'SG');
  assert.equal(
    singapore?.evidence.some(item => item.integrity === 'digest_mismatch'),
    true,
    'existing stale evidence pins must remain visible rather than silently trusted',
  );
});
