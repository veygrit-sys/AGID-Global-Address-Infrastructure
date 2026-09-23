import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';

import { createConfiguredPostalContextPackStore } from './postalContextPackStore';

const descriptorPath = resolve(
  'data/postal_country_packs/py/postal-context/m2/descriptor.json',
);
const descriptorDigest =
  'sha256:d12690e3f4a6cf79cab02e756bc7b6b49203561110b8a68c14002ed10d151c99';

test('configured country registry loads the real PY pack instead of reporting unsupported', () => {
  const store = createConfiguredPostalContextPackStore({
    AGID_POSTAL_CONTEXT_ALLOW_EXPERIMENTAL: '1',
    AGID_POSTAL_CONTEXT_PY_DESCRIPTOR_PATH: descriptorPath,
    AGID_POSTAL_CONTEXT_PY_DESCRIPTOR_DIGEST: descriptorDigest,
  });

  const status = store.countryStatus('PY');
  assert.equal(status.state, 'ready');
  assert.deepEqual(status.errors, []);
  assert.equal(status.runtime?.counts.geometries, 2_887);

  const lookup = store.getRuntime('PY')?.lookupPostalCode(
    '001518',
    '2026-09-02T05:02:03.144Z',
    '2026-09-02T05:02:03.144Z',
    true,
  );
  assert.equal(lookup?.status, 'unique');
  assert.equal(lookup?.postalFeatures[0]?.id, 'postal-py-001518');
  assert.equal(lookup?.geometries[0]?.id, 'dinacopa-py-derived-001518');
  assert.equal(lookup?.geometries[0]?.geometry.type, 'MultiPolygon');
});
