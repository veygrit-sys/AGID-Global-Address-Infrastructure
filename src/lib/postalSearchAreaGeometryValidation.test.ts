import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PostalContextLookupResponse } from '../services/PostalContextService';
import {
  createPostalAreaFeatureCollection,
  hasInvalidPostalAreaGeometry,
  isRenderablePostalAreaGeometry,
  postalAreaUnavailableDetail,
} from './postalSearchArea';

const digest = `sha256:${'a'.repeat(64)}` as `sha256:${string}`;
const lookup = {
  status: 'unique', countryCode: 'FI', normalizedPostalCode: '00100',
  validAt: '2026-08-30T05:10:43.249Z', knownAt: '2026-08-30T05:10:43.249Z',
  release: { countryCode: 'FI', repositoryId: 'fi', releaseId: 'r', manifestDigest: digest, policyVersion: 'v1', releasedAt: '2026-08-29T00:00:00.000Z', validTime: { from: '2026-08-29T00:00:00.000Z', to: null } },
  postalFeatures: [], contexts: [], assertionIds: [], alternatives: [], errors: [], warnings: [],
  geometries: [{
    node: { id: 'postal', kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'polygon', postalCode: '00100' },
    geometry: { type: 'Polygon', coordinates: [[[24.9, 60.1], [25, 60.1], [25, 60.2], [24.9, 60.15]]] },
    source: { sourceId: 'fi', sourceType: 'derived', assignmentAuthority: 'official_postal_operator', geometryAuthority: 'derived_geometry', sourceVersion: 'v1', sourceDate: '2026-08-29', licenseId: 'cc-by-4.0', digest },
    quality: { status: 'derived', confidence: 0.95 },
    validTime: { from: '2026-08-29T00:00:00.000Z', to: null },
  }],
} as PostalContextLookupResponse;

test('invalid open-ring API geometry is rejected with an explicit reason', () => {
  assert.equal(isRenderablePostalAreaGeometry(lookup.geometries[0].geometry), false);
  assert.equal(hasInvalidPostalAreaGeometry(lookup), true);
  assert.equal(createPostalAreaFeatureCollection(lookup).features.length, 0);
  assert.match(postalAreaUnavailableDetail(lookup), /geometryが無効.*表示を拒否/u);
});

test('closed finite polygon is renderable while an out-of-range position is not', () => {
  assert.equal(isRenderablePostalAreaGeometry({ type: 'Polygon', coordinates: [[[24.9, 60.1], [25, 60.1], [25, 60.2], [24.9, 60.1]]] }), true);
  assert.equal(isRenderablePostalAreaGeometry({ type: 'Polygon', coordinates: [[[24.9, 60.1], [250, 60.1], [25, 60.2], [24.9, 60.1]]] }), false);
});
