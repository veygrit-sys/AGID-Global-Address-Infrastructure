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
    blocked: 145,
    m2_verified: 21,
    pending: 86,
  });
  assert.equal(catalog.summary.manifests, 188);
  assert.equal(catalog.summary.explicitM2Definitions, 178);
  assert.equal(catalog.summary.runtimeArtifacts, 25);
  assert.equal(catalog.summary.geometryFeatures, 49_310);
  assert.equal(catalog.summary.geometryPositions, 4_146_067);
  assert.deepEqual(catalog.summary.sourceTypeCounts, { derived: 48_948, official: 362 });
  assert.equal(catalog.ordering.nextCountry, 'BJ');
});

test('catalog separates rollout status from real derived runtime availability and exposes linked IDs', () => {
  const catalog = buildPostalContextResearchCatalog();
  const ascension = catalog.countries.find(country => country.countryCode === 'AC');
  assert.ok(ascension);
  assert.equal(ascension.status, 'm2_verified');
  assert.equal(ascension.runtimeArtifact?.recordCounts.features, 2);
  assert.equal(ascension.runtimeArtifact?.recordCounts.positions, 1261);
  assert.deepEqual(ascension.runtimeArtifact?.sourceTypeCounts, { derived: 2 });
  assert.equal(ascension.runtimeArtifact?.sampleIds.postalContextId, 'postal-ac-ascn-1zz');
  assert.equal(ascension.runtimeArtifact?.sampleIds.geometryFeatureId, 'geoboundaries-ac-2021-ascn-1zz-surface-1');
  assert.deepEqual(ascension.runtimeArtifact?.sampleIds.linkedContextIds, ['country-ac']);
  assert.ok(ascension.evidence.every(item => item.integrity === 'verified'));

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

  const uruguay = catalog.countries.find(country => country.countryCode === 'UY');
  assert.ok(uruguay);
  assert.equal(uruguay.status, 'blocked');
  assert.equal(uruguay.runtimeArtifact?.promotionEligible, false);
  assert.equal(uruguay.runtimeArtifact?.recordCounts.features, 121);
  assert.equal(uruguay.runtimeArtifact?.sampleIds.postalContextId, 'postal-uy-correo-2023-11000');
  assert.equal(uruguay.runtimeArtifact?.sampleIds.geometryFeatureId, 'correo-uy-postal-2023-11000');
  assert.deepEqual(uruguay.runtimeArtifact?.sampleIds.linkedContextIds, [
    'country-uy',
    'agid-uy-correo-2023-11000-reference',
  ]);

  const singapore = catalog.countries.find(country => country.countryCode === 'SG');
  assert.equal(
    singapore?.evidence.some(item => item.integrity === 'digest_mismatch'),
    true,
    'existing stale evidence pins must remain visible rather than silently trusted',
  );

  const usVirginIslands = catalog.countries.find(country => country.countryCode === 'VI');
  assert.ok(usVirginIslands);
  assert.equal(usVirginIslands.status, 'blocked');
  assert.equal(usVirginIslands.runtimeArtifact?.promotionEligible, false);
  assert.equal(usVirginIslands.runtimeArtifact?.recordCounts.features, 6);
  assert.deepEqual(usVirginIslands.runtimeArtifact?.sourceTypeCounts, { derived: 6 });
  assert.equal(usVirginIslands.runtimeArtifact?.sampleIds.postalContextId, 'postal-vi-census-zcta-00802');
  assert.equal(usVirginIslands.runtimeArtifact?.sampleIds.geometryFeatureId, 'census-vi-zcta-2020-00802');
  assert.deepEqual(usVirginIslands.runtimeArtifact?.sampleIds.linkedContextIds, [
    'country-vi',
    'agid-vi-census-zcta-00802-internal-point',
  ]);
});
