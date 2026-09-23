import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createDominicanRepublicPostalContextRuntimeTestPack } from './postalContextDominicanRepublicRuntimeFixture';

export const BRAZIL_POSTAL_CONTEXT_TEST_POINT = { latitude: -23.5505, longitude: -46.6333 } as const;
export const BRAZIL_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function brazilSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^do-/, 'br-'), sourceVersion: source.sourceVersion?.replace(/^do-/, 'br-') };
}

export function createBrazilPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createDominicanRepublicPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-do-syn-99999', 'postal-br-syn-99999-999'], ['country-do', 'country-br'],
    ['province-do-synthetic', 'federative-unit-br-synthetic'], ['sector-do-synthetic', 'locality-br-synthetic'],
    ['agid-do-synthetic-cover', 'agid-br-synthetic-cover'], ['civic-address-point-do-synthetic', 'civic-address-point-br-synthetic'],
    ['civic-address-do-synthetic', 'civic-address-br-synthetic'], ['building-do-synthetic', 'building-br-synthetic'],
  ]);
  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'BR';
    if (node.id === 'postal-br-syn-99999-999') { node.postalCode = '99999-999'; node.label = 'Synthetic Brazilian typed CEP object 99999-999'; }
    else if (node.id === 'country-br') node.label = 'Brazil';
    else if (node.id === 'federative-unit-br-synthetic') node.label = 'Synthetic Brazilian federative-unit context';
    else if (node.id === 'locality-br-synthetic') node.label = 'Synthetic Brazilian locality context';
    else if (node.id === 'agid-br-synthetic-cover') { node.agidCellId = 'BR0000000000'; node.label = 'Synthetic Brazilian AGID cover'; }
    else if (node.id === 'civic-address-br-synthetic') node.label = 'Synthetic rights-cleared Brazilian civic address BR-SYN-CIVIC-999';
    else if (node.id === 'building-br-synthetic') node.label = 'Synthetic explicitly address-linked Brazilian building';
  }
  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^do-/, 'br-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = brazilSource(assertion.source);
  }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-br-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-br-synthetic', countryCode: 'BR', releaseId: 'br-synthetic-2026.01.1', policyVersion: 'brazil-postal-context-v0.1' };
  pack.geometry.countryCode = 'BR';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = feature.id.replace(/^do-/, 'br-');
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = brazilSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[-46.6483, -23.5605], [-46.6183, -23.5605], [-46.6183, -23.5405], [-46.6483, -23.5405], [-46.6483, -23.5605]]] };
      feature.source = { ...feature.source, sourceId: 'br-synthetic-derived-postal-area-review-polygon', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [BRAZIL_POSTAL_CONTEXT_TEST_POINT.longitude, BRAZIL_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[-46.63338, -23.55056], [-46.63322, -23.55056], [-46.63322, -23.55044], [-46.63338, -23.55044], [-46.63338, -23.55056]]] };
    }
    return feature;
  });
  return pack;
}
