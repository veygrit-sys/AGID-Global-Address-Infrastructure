import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createVenezuelaPostalContextRuntimeTestPack } from './postalContextVenezuelaRuntimeFixture';

export const PERU_POSTAL_CONTEXT_TEST_POINT = { latitude: -12.0464, longitude: -77.0428 } as const;
export const PERU_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function source(value: PostalContextSource): PostalContextSource {
  return { ...value, sourceId: value.sourceId.replace(/^ve-/, 'pe-'), sourceVersion: value.sourceVersion?.replace(/^ve-/, 'pe-') };
}
export function createPeruPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createVenezuelaPostalContextRuntimeTestPack());
  const ids = new Map<string, string>([
    ['postal-ve-syn-9999', 'postal-pe-syn-99999'], ['country-ve', 'country-pe'],
    ['federal-entity-ve-synthetic', 'department-pe-synthetic'], ['parish-ve-synthetic', 'district-pe-synthetic'],
    ['agid-ve-synthetic-cover', 'agid-pe-synthetic-cover'], ['civic-address-point-ve-synthetic', 'civic-address-point-pe-synthetic'],
    ['civic-address-ve-synthetic', 'civic-address-pe-synthetic'], ['building-ve-synthetic', 'building-pe-synthetic'],
  ]);
  for (const node of pack.graph.nodes) {
    node.id = ids.get(node.id) ?? node.id; node.countryCode = 'PE';
    if (node.id === 'postal-pe-syn-99999') { node.postalCode = '99999'; node.label = 'Synthetic Peruvian routing-locality service object 99999'; }
    else if (node.id === 'country-pe') node.label = 'Peru';
    else if (node.id === 'department-pe-synthetic') node.label = 'Synthetic Peruvian department context';
    else if (node.id === 'district-pe-synthetic') node.label = 'Synthetic Peruvian district context';
    else if (node.id === 'agid-pe-synthetic-cover') { node.agidCellId = 'PE0000000000'; node.label = 'Synthetic Peruvian AGID cover'; }
    else if (node.id === 'civic-address-pe-synthetic') node.label = 'Synthetic rights-cleared Peruvian civic address PE-SYN-CIVIC-999';
    else if (node.id === 'building-pe-synthetic') node.label = 'Synthetic explicitly address-linked Peruvian building';
  }
  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^ve-/, 'pe-'); assertion.fromNodeId = ids.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = ids.get(assertion.toNodeId) ?? assertion.toNodeId; assertion.source = source(assertion.source);
  }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-pe-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-pe-synthetic', countryCode: 'PE', releaseId: 'pe-synthetic-2026.01.1', policyVersion: 'peru-postal-context-v0.1' };
  pack.geometry.countryCode = 'PE'; pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = feature.id.replace(/^ve-/, 'pe-'); feature.nodeId = ids.get(feature.nodeId) ?? feature.nodeId; feature.source = source(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[-77.0578, -12.0564], [-77.0278, -12.0564], [-77.0278, -12.0364], [-77.0578, -12.0364], [-77.0578, -12.0564]]] };
      feature.source = { ...feature.source, sourceId: 'pe-synthetic-derived-postal-service-area-review-polygon', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') feature.geometry = { type: 'Point', coordinates: [PERU_POSTAL_CONTEXT_TEST_POINT.longitude, PERU_POSTAL_CONTEXT_TEST_POINT.latitude] };
    else if (feature.role === 'building_footprint') feature.geometry = { type: 'Polygon', coordinates: [[[-77.04288, -12.04646], [-77.04272, -12.04646], [-77.04272, -12.04634], [-77.04288, -12.04634], [-77.04288, -12.04646]]] };
    return feature;
  });
  return pack;
}
