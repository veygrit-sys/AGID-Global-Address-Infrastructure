import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextResearchCatalogError,
  loadPostalContextResearchCatalog,
  parsePostalContextResearchCatalog,
  postalContextResearchCountry,
} from './postalContextResearchCatalog';

test('loads the committed public research catalog and preserves M2/runtime separation', () => {
  const catalog = loadPostalContextResearchCatalog();
  const puertoRico = postalContextResearchCountry(catalog, 'pr');

  assert.equal(catalog.summary.totalCountries, 252);
  assert.equal(catalog.summary.runtimeArtifacts, 25);
  assert.equal(puertoRico?.status, 'blocked');
  assert.equal(puertoRico?.runtimeArtifact?.synthetic, false);
  assert.equal(puertoRico?.runtimeArtifact?.recordCounts.features, 132);
  assert.equal(puertoRico?.runtimeArtifact?.sampleIds.linkedContextIds[0], 'country-pr');
  assert.equal(catalog.sourcePolicy.rawSourceRowsPublished, false);
  assert.equal(catalog.sourcePolicy.postalGeometryMayInferAddressesOrBuildings, false);
  const usVirginIslands = postalContextResearchCountry(catalog, 'VI');
  assert.equal(usVirginIslands?.status, 'blocked');
  assert.equal(usVirginIslands?.runtimeArtifact?.recordCounts.features, 6);
  assert.equal(usVirginIslands?.runtimeArtifact?.sampleIds.postalContextId, 'postal-vi-census-zcta-00802');
  assert.deepEqual(usVirginIslands?.runtimeArtifact?.sampleIds.linkedContextIds, [
    'country-vi',
    'agid-vi-census-zcta-00802-internal-point',
  ]);
});

test('rejects traversal in runtime artifact paths', () => {
  const catalog = structuredClone(loadPostalContextResearchCatalog());
  const puertoRico = postalContextResearchCountry(catalog, 'PR');
  assert.ok(puertoRico?.runtimeArtifact);
  puertoRico.runtimeArtifact.descriptorPath = '../private/descriptor.json';

  assert.throws(
    () => parsePostalContextResearchCatalog(catalog),
    error => error instanceof PostalContextResearchCatalogError
      && error.code === 'research-runtime-descriptor-path-invalid',
  );
});
