import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createKenyaPostalContextRuntimeTestPack } from './postalContextKenyaRuntimeFixture';

export const ZAMBIA_POSTAL_CONTEXT_TEST_POINT = { latitude: -15.401234, longitude: 28.301234 } as const;
export const ZAMBIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function zambiaSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^ke-/, 'zm-'), sourceVersion: source.sourceVersion?.replace(/^ke-/, 'zm-') };
}

export function createZambiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createKenyaPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-ke-syn-09999', 'postal-zm-syn-09998'],
    ['country-ke', 'country-zm'],
    ['county-ke-synthetic', 'province-zm-synthetic'],
    ['locality-ke-synthetic', 'district-zm-synthetic'],
    ['agid-ke-synthetic-cover', 'agid-zm-synthetic-cover'],
    ['nask-address-point-ke-synthetic', 'national-address-point-zm-synthetic'],
    ['nask-address-ke-synthetic', 'national-address-zm-synthetic'],
    ['nask-building-ke-synthetic', 'national-address-building-zm-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'ZM';
    if (node.id === 'postal-zm-syn-09998') {
      node.postalCode = '09998';
      node.label = 'Synthetic Zambia evidence-gated five-digit postal observation';
    } else if (node.id === 'country-zm') node.label = 'Zambia';
    else if (node.id === 'province-zm-synthetic') node.label = 'Synthetic Province';
    else if (node.id === 'district-zm-synthetic') node.label = 'Synthetic District';
    else if (node.id === 'agid-zm-synthetic-cover') {
      node.agidCellId = 'ZM0000000000';
      node.label = 'Synthetic Zambia AGID cover';
    } else if (node.id === 'national-address-zm-synthetic') node.label = 'Synthetic national address ZM-NATIONAL-ADDRESS-SYN-09998';
    else if (node.id === 'national-address-building-zm-synthetic') node.label = 'Synthetic explicitly rights-cleared national-address-linked Zambian building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^ke-/, 'zm-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = zambiaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-zm-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-zm-synthetic',
    countryCode: 'ZM',
    releaseId: 'zm-synthetic-2026.01.1',
    policyVersion: 'zambia-evidence-gated-five-digit-and-national-address-separation-v0.1',
  };

  pack.geometry.countryCode = 'ZM';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = feature.id.replace(/^ke-/, 'zm-');
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = zambiaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[28.29, -15.41], [28.31, -15.41], [28.31, -15.39], [28.29, -15.39], [28.29, -15.41]]] };
      feature.source = { ...feature.source, sourceId: 'zm-synthetic-derived-postal-review-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 500 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [ZAMBIA_POSTAL_CONTEXT_TEST_POINT.longitude, ZAMBIA_POSTAL_CONTEXT_TEST_POINT.latitude] };
      feature.source = { ...feature.source, sourceId: 'zm-synthetic-explicit-national-address-point' };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[28.30117, -15.40130], [28.30130, -15.40130], [28.30130, -15.40117], [28.30117, -15.40117], [28.30117, -15.40130]]] };
      feature.source = { ...feature.source, sourceId: 'zm-synthetic-explicit-national-address-building-link' };
    }
    return feature;
  });
  return pack;
}
