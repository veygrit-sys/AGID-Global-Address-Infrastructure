import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const MALAYSIA_POSTAL_CONTEXT_TEST_POINT = { latitude: 3.0000, longitude: 101.0000 } as const;
export const MALAYSIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function malaysiaSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'my-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'my-') };
}

export function createMalaysiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-my-syn-99999'],
    ['country-jp', 'country-my'],
    ['prefecture-synthetic', 'state-my-synthetic'],
    ['locality-synthetic', 'locality-my-synthetic'],
    ['agid-synthetic-cover', 'agid-my-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-my-synthetic'],
    ['premise-synthetic', 'civic-address-my-synthetic'],
    ['building-synthetic', 'building-my-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'MY';
    if (node.id === 'postal-my-syn-99999') { node.postalCode = '99999'; node.label = 'Synthetic Malaysia five-digit assignment 99999'; }
    else if (node.id === 'country-my') node.label = 'Malaysia';
    else if (node.id === 'state-my-synthetic') node.label = 'Synthetic Malaysia State';
    else if (node.id === 'locality-my-synthetic') node.label = 'Synthetic Malaysia Locality';
    else if (node.id === 'agid-my-synthetic-cover') { node.agidCellId = 'MY0000000000'; node.label = 'Synthetic Malaysia AGID cover'; }
    else if (node.id === 'civic-address-my-synthetic') node.label = 'Synthetic Room 1, Building 1, House 1, Lane 1, Street 1, explicit civic address MY-SYN-99999';
    else if (node.id === 'building-my-synthetic') node.label = 'Synthetic explicitly linked Malaysia building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'my-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = malaysiaSource(assertion.source);
  }

  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-my-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-my-synthetic', countryCode: 'MY', releaseId: 'my-synthetic-2026.01.1', policyVersion: 'malaysia-five-digit-delivery-network-v0.1' };
  pack.geometry.countryCode = 'MY';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'my-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = malaysiaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[100.985, 2.990], [101.015, 2.990], [101.015, 3.010], [100.985, 3.010], [100.985, 2.990]]] };
      feature.source = { ...feature.source, sourceId: 'my-synthetic-administrative-join-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 500 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [MALAYSIA_POSTAL_CONTEXT_TEST_POINT.longitude, MALAYSIA_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[100.99992, 2.99994], [101.00008, 2.99994], [101.00008, 3.00006], [100.99992, 3.00006], [100.99992, 2.99994]]] };
    }
    return feature;
  });
  return pack;
}
