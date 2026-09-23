import type { PostalContextAssertion, PostalContextNode, PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const MONGOLIA_POSTAL_CONTEXT_TEST_POINT = { latitude: 47.9000, longitude: 106.9000 } as const;
export const MONGOLIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function mongoliaSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'mn-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'mn-') };
}

export function createMongoliaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-mn-syn-99999'],
    ['country-jp', 'country-mn'],
    ['prefecture-synthetic', 'aimag-or-capital-mn-synthetic'],
    ['locality-synthetic', 'soum-district-bag-khoroo-mn-synthetic'],
    ['agid-synthetic-cover', 'agid-mn-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-mn-synthetic'],
    ['premise-synthetic', 'civic-address-mn-synthetic'],
    ['building-synthetic', 'building-mn-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'MN';
    if (node.id === 'postal-mn-syn-99999') { node.postalCode = '99999'; node.label = 'Synthetic Mongolia five-digit postal zone 99999'; }
    else if (node.id === 'country-mn') node.label = 'Mongolia';
    else if (node.id === 'aimag-or-capital-mn-synthetic') node.label = 'Synthetic Mongolia Aimag or Capital';
    else if (node.id === 'soum-district-bag-khoroo-mn-synthetic') node.label = 'Synthetic Mongolia Soum District Bag or Khoroo';
    else if (node.id === 'agid-mn-synthetic-cover') { node.agidCellId = 'MN0000000000'; node.label = 'Synthetic Mongolia AGID cover'; }
    else if (node.id === 'civic-address-mn-synthetic') node.label = 'Synthetic rights-cleared civic address with unified code 99999-9999';
    else if (node.id === 'building-mn-synthetic') node.label = 'Synthetic explicitly address-linked Mongolia building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'mn-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = mongoliaSource(assertion.source);
  }

  const unifiedCodeNode: PostalContextNode = { id: 'postal-mn-syn-99999-9999', kind: 'postal_feature', featureKind: 'building', geometryType: 'none', countryCode: 'MN', postalCode: '99999-9999', label: 'Synthetic Mongolia nine-digit unified building code 99999-9999', visibility: 'public' };
  const zoneContext = pack.graph.assertions.find(assertion => assertion.id === 'mn-a-postal-locality');
  if (!zoneContext) throw new Error('missing synthetic postal locality context');
  const unifiedCodeContext: PostalContextAssertion = { ...structuredClone(zoneContext), id: 'mn-a-unified-code-locality', fromNodeId: 'postal-mn-syn-99999-9999', source: { ...zoneContext.source, sourceId: 'mn-synthetic-unified-code-context', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'none' } };
  pack.graph = { ...pack.graph, nodes: [...pack.graph.nodes, unifiedCodeNode], assertions: [...pack.graph.assertions, unifiedCodeContext] };

  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-mn-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-mn-synthetic', countryCode: 'MN', releaseId: 'mn-synthetic-2026.01.1', policyVersion: 'mongolia-five-nine-digit-v0.1' };
  pack.geometry.countryCode = 'MN';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'mn-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = mongoliaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[106.880, 47.885], [106.920, 47.885], [106.920, 47.915], [106.880, 47.915], [106.880, 47.885]]] };
      feature.source = { ...feature.source, sourceId: 'mn-synthetic-derived-postal-zone-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [MONGOLIA_POSTAL_CONTEXT_TEST_POINT.longitude, MONGOLIA_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[106.89990, 47.89994], [106.90010, 47.89994], [106.90010, 47.90006], [106.89990, 47.90006], [106.89990, 47.89994]]] };
    }
    return feature;
  });
  return pack;
}
