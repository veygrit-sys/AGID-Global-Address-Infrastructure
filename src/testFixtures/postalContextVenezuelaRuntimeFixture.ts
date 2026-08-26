import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createBrazilPostalContextRuntimeTestPack } from './postalContextBrazilRuntimeFixture';

export const VENEZUELA_POSTAL_CONTEXT_TEST_POINT = { latitude: 10.4806, longitude: -66.9036 } as const;
export const VENEZUELA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function source(value: PostalContextSource): PostalContextSource {
  return { ...value, sourceId: value.sourceId.replace(/^br-/, 've-'), sourceVersion: value.sourceVersion?.replace(/^br-/, 've-') };
}
export function createVenezuelaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createBrazilPostalContextRuntimeTestPack());
  const ids = new Map<string, string>([
    ['postal-br-syn-99999-999', 'postal-ve-syn-9999'], ['country-br', 'country-ve'],
    ['federative-unit-br-synthetic', 'federal-entity-ve-synthetic'], ['locality-br-synthetic', 'parish-ve-synthetic'],
    ['agid-br-synthetic-cover', 'agid-ve-synthetic-cover'], ['civic-address-point-br-synthetic', 'civic-address-point-ve-synthetic'],
    ['civic-address-br-synthetic', 'civic-address-ve-synthetic'], ['building-br-synthetic', 'building-ve-synthetic'],
  ]);
  for (const node of pack.graph.nodes) {
    node.id = ids.get(node.id) ?? node.id; node.countryCode = 'VE';
    if (node.id === 'postal-ve-syn-9999') { node.postalCode = '9999'; node.label = 'Synthetic Venezuelan delivery-office service object 9999'; }
    else if (node.id === 'country-ve') node.label = 'Venezuela';
    else if (node.id === 'federal-entity-ve-synthetic') node.label = 'Synthetic Venezuelan federal-entity context';
    else if (node.id === 'parish-ve-synthetic') node.label = 'Synthetic Venezuelan parish context';
    else if (node.id === 'agid-ve-synthetic-cover') { node.agidCellId = 'VE0000000000'; node.label = 'Synthetic Venezuelan AGID cover'; }
    else if (node.id === 'civic-address-ve-synthetic') node.label = 'Synthetic rights-cleared Venezuelan civic address VE-SYN-CIVIC-999';
    else if (node.id === 'building-ve-synthetic') node.label = 'Synthetic explicitly address-linked Venezuelan building';
  }
  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^br-/, 've-'); assertion.fromNodeId = ids.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = ids.get(assertion.toNodeId) ?? assertion.toNodeId; assertion.source = source(assertion.source);
  }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-ve-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-ve-synthetic', countryCode: 'VE', releaseId: 've-synthetic-2026.01.1', policyVersion: 'venezuela-postal-context-v0.1' };
  pack.geometry.countryCode = 'VE'; pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = feature.id.replace(/^br-/, 've-'); feature.nodeId = ids.get(feature.nodeId) ?? feature.nodeId; feature.source = source(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[-66.9186, 10.4706], [-66.8886, 10.4706], [-66.8886, 10.4906], [-66.9186, 10.4906], [-66.9186, 10.4706]]] };
      feature.source = { ...feature.source, sourceId: 've-synthetic-derived-postal-service-area-review-polygon', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') feature.geometry = { type: 'Point', coordinates: [VENEZUELA_POSTAL_CONTEXT_TEST_POINT.longitude, VENEZUELA_POSTAL_CONTEXT_TEST_POINT.latitude] };
    else if (feature.role === 'building_footprint') feature.geometry = { type: 'Polygon', coordinates: [[[-66.90368, 10.48054], [-66.90352, 10.48054], [-66.90352, 10.48066], [-66.90368, 10.48066], [-66.90368, 10.48054]]] };
    return feature;
  });
  return pack;
}
