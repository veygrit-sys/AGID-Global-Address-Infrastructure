import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const ALGERIA_POSTAL_CONTEXT_TEST_POINT = { latitude: 28.000123, longitude: 2.000123 } as const;
export const ALGERIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function algeriaSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'dz-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'dz-') };
}

export function createAlgeriaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-dz-syn-09999'],
    ['country-jp', 'country-dz'],
    ['prefecture-synthetic', 'wilaya-dz-synthetic'],
    ['locality-synthetic', 'commune-dz-synthetic'],
    ['agid-synthetic-cover', 'agid-dz-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-dz-synthetic'],
    ['premise-synthetic', 'civic-address-dz-synthetic'],
    ['building-synthetic', 'building-dz-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'DZ';
    if (node.id === 'postal-dz-syn-09999') {
      node.postalCode = '09999';
      node.label = 'Synthetic Algeria typed postal object';
    } else if (node.id === 'country-dz') node.label = 'Algeria';
    else if (node.id === 'wilaya-dz-synthetic') node.label = 'ولاية اختبارية';
    else if (node.id === 'commune-dz-synthetic') node.label = 'بلدية اختبارية';
    else if (node.id === 'agid-dz-synthetic-cover') {
      node.agidCellId = 'DZ0000000000';
      node.label = 'Synthetic Algeria AGID cover';
    } else if (node.id === 'civic-address-dz-synthetic') node.label = '١ شارع اختباري';
    else if (node.id === 'building-dz-synthetic') node.label = 'Synthetic explicitly address-linked Algerian building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'dz-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = algeriaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-dz-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-dz-synthetic',
    countryCode: 'DZ',
    releaseId: 'dz-synthetic-2026.01.1',
    policyVersion: 'algeria-five-digit-area-or-non-area-v0.1',
  };

  pack.geometry.countryCode = 'DZ';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'dz-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = algeriaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[1.99, 27.99], [2.02, 27.99], [2.02, 28.02], [1.99, 28.02], [1.99, 27.99]]] };
      feature.source = { ...feature.source, sourceId: 'dz-synthetic-derived-postal-review-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 500 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [ALGERIA_POSTAL_CONTEXT_TEST_POINT.longitude, ALGERIA_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[2.00005, 28.00005], [2.00020, 28.00005], [2.00020, 28.00020], [2.00005, 28.00020], [2.00005, 28.00005]]] };
    }
    return feature;
  });
  return pack;
}
