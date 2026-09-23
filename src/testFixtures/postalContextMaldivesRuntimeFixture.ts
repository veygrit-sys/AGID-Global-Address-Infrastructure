import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const MALDIVES_POSTAL_CONTEXT_TEST_POINT = { latitude: 4.2000, longitude: 73.5000 } as const;
export const MALDIVES_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function maldivesSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'mv-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'mv-') };
}

export function createMaldivesPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-mv-syn-99999'],
    ['country-jp', 'country-mv'],
    ['prefecture-synthetic', 'administrative-atoll-mv-synthetic'],
    ['locality-synthetic', 'island-mv-synthetic'],
    ['agid-synthetic-cover', 'agid-mv-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-mv-synthetic'],
    ['premise-synthetic', 'civic-address-mv-synthetic'],
    ['building-synthetic', 'building-mv-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'MV';
    if (node.id === 'postal-mv-syn-99999') { node.postalCode = '99999'; node.label = 'Synthetic Maldives five-digit assignment 99999'; }
    else if (node.id === 'country-mv') node.label = 'Maldives';
    else if (node.id === 'administrative-atoll-mv-synthetic') node.label = 'Synthetic Maldives Administrative Atoll';
    else if (node.id === 'island-mv-synthetic') node.label = 'Synthetic Maldives Island';
    else if (node.id === 'agid-mv-synthetic-cover') { node.agidCellId = 'MV0000000000'; node.label = 'Synthetic Maldives AGID cover'; }
    else if (node.id === 'civic-address-mv-synthetic') node.label = 'Synthetic Apartment 1, House 1, Street 1, explicit civic address MV-SYN-99999';
    else if (node.id === 'building-mv-synthetic') node.label = 'Synthetic explicitly linked Maldives building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'mv-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = maldivesSource(assertion.source);
  }

  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-mv-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-mv-synthetic', countryCode: 'MV', releaseId: 'mv-synthetic-2026.01.1', policyVersion: 'maldives-five-digit-island-atoll-v0.1' };
  pack.geometry.countryCode = 'MV';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'mv-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = maldivesSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[73.485, 4.190], [73.515, 4.190], [73.515, 4.210], [73.485, 4.210], [73.485, 4.190]]] };
      feature.source = { ...feature.source, sourceId: 'mv-synthetic-island-administrative-join-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 500 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [MALDIVES_POSTAL_CONTEXT_TEST_POINT.longitude, MALDIVES_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[73.49992, 4.19994], [73.50008, 4.19994], [73.50008, 4.20006], [73.49992, 4.20006], [73.49992, 4.19994]]] };
    }
    return feature;
  });
  return pack;
}
