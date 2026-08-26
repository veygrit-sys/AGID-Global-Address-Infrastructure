import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const IRAQ_POSTAL_CONTEXT_TEST_POINT = { latitude: 32.5000, longitude: 44.0000 } as const;
export const IRAQ_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function iraqSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'iq-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'iq-') };
}

export function createIraqPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-iq-syn-99999'],
    ['country-jp', 'country-iq'],
    ['prefecture-synthetic', 'governorate-iq-synthetic'],
    ['locality-synthetic', 'locality-iq-synthetic'],
    ['agid-synthetic-cover', 'agid-iq-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-iq-synthetic'],
    ['premise-synthetic', 'civic-address-iq-synthetic'],
    ['building-synthetic', 'building-iq-synthetic'],
  ]);
  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id; node.countryCode = 'IQ';
    if (node.id === 'postal-iq-syn-99999') { node.postalCode = '99999'; node.label = 'Synthetic Iraq five-digit postal object 99999'; }
    else if (node.id === 'country-iq') node.label = 'Iraq';
    else if (node.id === 'governorate-iq-synthetic') node.label = 'Synthetic Iraq governorate context';
    else if (node.id === 'locality-iq-synthetic') node.label = 'Synthetic Iraq locality context';
    else if (node.id === 'agid-iq-synthetic-cover') { node.agidCellId = 'IQ0000000000'; node.label = 'Synthetic Iraq AGID cover'; }
    else if (node.id === 'civic-address-iq-synthetic') node.label = 'Synthetic rights-cleared Iraq civic address IQ-SYN-99999';
    else if (node.id === 'building-iq-synthetic') node.label = 'Synthetic explicitly address-linked Iraq building';
  }
  for (const assertion of pack.graph.assertions) {
    assertion.id = 'iq-' + assertion.id; assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId; assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId; assertion.source = iraqSource(assertion.source);
  }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-iq-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-iq-synthetic', countryCode: 'IQ', releaseId: 'iq-synthetic-2026.01.1', policyVersion: 'iraq-five-digit-postal-object-v0.1' };
  pack.geometry.countryCode = 'IQ'; pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'iq-' + feature.id; feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId; feature.source = iraqSource(feature.source);
    if (feature.role === 'postal_area') { feature.geometry = { type: 'Polygon', coordinates: [[[43.985, 32.490], [44.015, 32.490], [44.015, 32.510], [43.985, 32.510], [43.985, 32.490]]] }; feature.source = { ...feature.source, sourceId: 'iq-synthetic-derived-postal-context-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' }; feature.quality = { status: 'derived', accuracyMeters: 1000 }; }
    else if (feature.role === 'address_point') feature.geometry = { type: 'Point', coordinates: [IRAQ_POSTAL_CONTEXT_TEST_POINT.longitude, IRAQ_POSTAL_CONTEXT_TEST_POINT.latitude] };
    else if (feature.role === 'building_footprint') feature.geometry = { type: 'Polygon', coordinates: [[[43.99992, 32.49994], [44.00008, 32.49994], [44.00008, 32.50006], [43.99992, 32.50006], [43.99992, 32.49994]]] };
    return feature;
  });
  return pack;
}
