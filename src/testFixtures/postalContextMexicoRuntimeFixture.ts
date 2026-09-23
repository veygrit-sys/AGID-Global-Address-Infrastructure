import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createColombiaPostalContextRuntimeTestPack } from './postalContextColombiaRuntimeFixture';

export const MEXICO_POSTAL_CONTEXT_TEST_POINT = { latitude: 19.4326, longitude: -99.1332 } as const;
export const MEXICO_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function mexicoSource(value: PostalContextSource): PostalContextSource {
  return { ...value, sourceId: value.sourceId.replace(/^co-/, 'mx-'), sourceVersion: value.sourceVersion?.replace(/^co-/, 'mx-') };
}

export function createMexicoPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createColombiaPostalContextRuntimeTestPack());
  const ids = new Map<string, string>([
    ['postal-co-syn-999999', 'postal-mx-syn-99999'], ['country-co', 'country-mx'],
    ['department-co-synthetic', 'entity-mx-synthetic'], ['municipality-co-synthetic', 'municipality-mx-synthetic'],
    ['agid-co-synthetic-cover', 'agid-mx-synthetic-cover'], ['civic-address-point-co-synthetic', 'civic-address-point-mx-synthetic'],
    ['civic-address-co-synthetic', 'civic-address-mx-synthetic'], ['construction-co-synthetic', 'building-mx-synthetic'],
  ]);
  for (const node of pack.graph.nodes) {
    node.id = ids.get(node.id) ?? node.id;
    node.countryCode = 'MX';
    if (node.id === 'postal-mx-syn-99999') { node.postalCode = '99999'; node.label = 'Synthetic Mexico official-release-like postal area 99999'; }
    else if (node.id === 'country-mx') node.label = 'Mexico';
    else if (node.id === 'entity-mx-synthetic') node.label = 'Synthetic Mexican federative-entity context';
    else if (node.id === 'municipality-mx-synthetic') node.label = 'Synthetic Mexican municipality context';
    else if (node.id === 'agid-mx-synthetic-cover') { node.agidCellId = 'MX0000000000'; node.label = 'Synthetic Mexican AGID cover'; }
    else if (node.id === 'civic-address-mx-synthetic') node.label = 'Synthetic rights-cleared Mexican civic address MX-SYN-CIVIC-999';
    else if (node.id === 'building-mx-synthetic') node.label = 'Synthetic explicitly address-linked Mexican building';
  }
  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^co-/, 'mx-');
    assertion.fromNodeId = ids.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = ids.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = mexicoSource(assertion.source);
  }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-mx-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-mx-synthetic', countryCode: 'MX', releaseId: 'mx-synthetic-2026.01.1', policyVersion: 'mexico-postal-context-v0.1' };
  pack.geometry.countryCode = 'MX';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = feature.id.replace(/^co-/, 'mx-');
    feature.nodeId = ids.get(feature.nodeId) ?? feature.nodeId;
    feature.source = mexicoSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[-99.1482, 19.4226], [-99.1182, 19.4226], [-99.1182, 19.4426], [-99.1482, 19.4426], [-99.1482, 19.4226]]] };
      feature.source = { ...feature.source, sourceId: 'mx-synthetic-official-release-like-validation-polygon', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') feature.geometry = { type: 'Point', coordinates: [MEXICO_POSTAL_CONTEXT_TEST_POINT.longitude, MEXICO_POSTAL_CONTEXT_TEST_POINT.latitude] };
    else if (feature.role === 'building_footprint') feature.geometry = { type: 'Polygon', coordinates: [[[-99.13328, 19.43254], [-99.13312, 19.43254], [-99.13312, 19.43266], [-99.13328, 19.43266], [-99.13328, 19.43254]]] };
    return feature;
  });
  return pack;
}
