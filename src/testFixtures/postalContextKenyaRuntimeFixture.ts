import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createCaboVerdePostalContextRuntimeTestPack } from './postalContextCaboVerdeRuntimeFixture';

export const KENYA_POSTAL_CONTEXT_TEST_POINT = { latitude: -1.001234, longitude: 37.001234 } as const;
export const KENYA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function kenyaSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^cv-/, 'ke-'), sourceVersion: source.sourceVersion?.replace(/^cv-/, 'ke-') };
}

export function createKenyaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createCaboVerdePostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-cv-syn-0999', 'postal-ke-syn-09999'],
    ['country-cv', 'country-ke'],
    ['island-cv-synthetic', 'county-ke-synthetic'],
    ['municipality-cv-synthetic', 'locality-ke-synthetic'],
    ['agid-cv-synthetic-cover', 'agid-ke-synthetic-cover'],
    ['cip-address-point-cv-synthetic', 'nask-address-point-ke-synthetic'],
    ['cip-address-cv-synthetic', 'nask-address-ke-synthetic'],
    ['cip-building-cv-synthetic', 'nask-building-ke-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'KE';
    if (node.id === 'postal-ke-syn-09999') {
      node.postalCode = '09999';
      node.label = 'Synthetic Kenya typed five-digit delivery-post-office code';
    } else if (node.id === 'country-ke') node.label = 'Kenya';
    else if (node.id === 'county-ke-synthetic') node.label = 'Synthetic County';
    else if (node.id === 'locality-ke-synthetic') node.label = 'Synthetic Locality';
    else if (node.id === 'agid-ke-synthetic-cover') {
      node.agidCellId = 'KE0000000000';
      node.label = 'Synthetic Kenya AGID cover';
    } else if (node.id === 'nask-address-ke-synthetic') node.label = 'Synthetic NASK address KE-NASK-SYN-09999';
    else if (node.id === 'nask-building-ke-synthetic') node.label = 'Synthetic explicitly rights-cleared NASK-address-linked Kenyan building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^cv-/, 'ke-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = kenyaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-ke-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-ke-synthetic',
    countryCode: 'KE',
    releaseId: 'ke-synthetic-2026.01.1',
    policyVersion: 'kenya-five-digit-delivery-office-and-nask-separation-v0.1',
  };

  pack.geometry.countryCode = 'KE';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = feature.id.replace(/^cv-/, 'ke-');
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = kenyaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[36.99, -1.01], [37.01, -1.01], [37.01, -0.99], [36.99, -0.99], [36.99, -1.01]]] };
      feature.source = { ...feature.source, sourceId: 'ke-synthetic-derived-postal-review-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 500 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [KENYA_POSTAL_CONTEXT_TEST_POINT.longitude, KENYA_POSTAL_CONTEXT_TEST_POINT.latitude] };
      feature.source = { ...feature.source, sourceId: 'ke-synthetic-explicit-nask-address-point' };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[37.00117, -1.00130], [37.00130, -1.00130], [37.00130, -1.00117], [37.00117, -1.00117], [37.00117, -1.00130]]] };
      feature.source = { ...feature.source, sourceId: 'ke-synthetic-explicit-nask-address-building-link' };
    }
    return feature;
  });
  return pack;
}