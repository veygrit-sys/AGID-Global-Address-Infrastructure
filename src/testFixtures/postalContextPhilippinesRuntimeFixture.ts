import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const PHILIPPINES_POSTAL_CONTEXT_TEST_POINT = { latitude: 14.5995, longitude: 120.9842 } as const;
export const PHILIPPINES_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function philippinesSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'ph-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'ph-') };
}

export function createPhilippinesPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-ph-syn-9999'],
    ['country-jp', 'country-ph'],
    ['prefecture-synthetic', 'province-ph-synthetic'],
    ['locality-synthetic', 'barangay-ph-synthetic'],
    ['agid-synthetic-cover', 'agid-ph-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-ph-synthetic'],
    ['premise-synthetic', 'civic-address-ph-synthetic'],
    ['building-synthetic', 'building-ph-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'PH';
    if (node.id === 'postal-ph-syn-9999') { node.postalCode = '9999'; node.label = 'Synthetic Philippines PHLPost routing assignment 9999'; }
    else if (node.id === 'country-ph') node.label = 'Philippines';
    else if (node.id === 'province-ph-synthetic') node.label = 'Synthetic Philippines Province';
    else if (node.id === 'barangay-ph-synthetic') node.label = 'Synthetic Philippines Barangay';
    else if (node.id === 'agid-ph-synthetic-cover') { node.agidCellId = 'PH0000000000'; node.label = 'Synthetic Philippines AGID cover'; }
    else if (node.id === 'civic-address-ph-synthetic') node.label = 'Synthetic Unit 1, Road 1, Barangay, explicit civic address PH-SYN-9999';
    else if (node.id === 'building-ph-synthetic') node.label = 'Synthetic explicitly linked Philippines building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'ph-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = philippinesSource(assertion.source);
  }

  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-ph-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-ph-synthetic', countryCode: 'PH', releaseId: 'ph-synthetic-2026.01.1', policyVersion: 'philippines-zip-routing-v0.1' };
  pack.geometry.countryCode = 'PH';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'ph-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = philippinesSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[120.972, 14.590], [120.996, 14.590], [120.996, 14.610], [120.972, 14.610], [120.972, 14.590]]] };
      feature.source = { ...feature.source, sourceId: 'ph-synthetic-derived-delivery-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 300 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [PHILIPPINES_POSTAL_CONTEXT_TEST_POINT.longitude, PHILIPPINES_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[120.98412, 14.59944], [120.98428, 14.59944], [120.98428, 14.59956], [120.98412, 14.59956], [120.98412, 14.59944]]] };
    }
    return feature;
  });
  return pack;
}
