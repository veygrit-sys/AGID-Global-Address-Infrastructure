import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createZambiaPostalContextRuntimeTestPack } from './postalContextZambiaRuntimeFixture';

export const SENEGAL_POSTAL_CONTEXT_TEST_POINT = { latitude: 14.716234, longitude: -17.467234 } as const;
export const SENEGAL_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function senegalSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^zm-/, 'sn-'), sourceVersion: source.sourceVersion?.replace(/^zm-/, 'sn-') };
}

export function createSenegalPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createZambiaPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-zm-syn-09998', 'postal-sn-syn-09997'],
    ['country-zm', 'country-sn'],
    ['province-zm-synthetic', 'region-sn-synthetic'],
    ['district-zm-synthetic', 'department-sn-synthetic'],
    ['agid-zm-synthetic-cover', 'agid-sn-synthetic-cover'],
    ['national-address-point-zm-synthetic', 'civic-address-point-sn-synthetic'],
    ['national-address-zm-synthetic', 'civic-address-sn-synthetic'],
    ['national-address-building-zm-synthetic', 'civic-address-building-sn-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'SN';
    if (node.id === 'postal-sn-syn-09997') { node.postalCode = '09997'; node.label = 'Synthetic Senegal five-digit operator observation'; }
    else if (node.id === 'country-sn') node.label = 'Senegal';
    else if (node.id === 'region-sn-synthetic') node.label = 'Synthetic Region';
    else if (node.id === 'department-sn-synthetic') node.label = 'Synthetic Department';
    else if (node.id === 'agid-sn-synthetic-cover') { node.agidCellId = 'SN0000000000'; node.label = 'Synthetic Senegal AGID cover'; }
    else if (node.id === 'civic-address-sn-synthetic') node.label = 'Synthetic civic address SN-CIVIC-ADDRESS-SYN-09997';
    else if (node.id === 'civic-address-building-sn-synthetic') node.label = 'Synthetic explicitly rights-cleared civic-address-linked Senegal building';
  }
  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^zm-/, 'sn-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = senegalSource(assertion.source);
  }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-sn-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-sn-synthetic', countryCode: 'SN', releaseId: 'sn-synthetic-2026.01.1', policyVersion: 'senegal-evidence-gated-five-digit-bp-nicad-separation-v0.1' };
  pack.geometry.countryCode = 'SN';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = feature.id.replace(/^zm-/, 'sn-');
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = senegalSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[-17.477, 14.706], [-17.457, 14.706], [-17.457, 14.726], [-17.477, 14.726], [-17.477, 14.706]]] };
      feature.source = { ...feature.source, sourceId: 'sn-synthetic-derived-postal-review-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 500 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [SENEGAL_POSTAL_CONTEXT_TEST_POINT.longitude, SENEGAL_POSTAL_CONTEXT_TEST_POINT.latitude] };
      feature.source = { ...feature.source, sourceId: 'sn-synthetic-explicit-civic-address-point' };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[-17.46730, 14.71617], [-17.46717, 14.71617], [-17.46717, 14.71630], [-17.46730, 14.71630], [-17.46730, 14.71617]]] };
      feature.source = { ...feature.source, sourceId: 'sn-synthetic-explicit-civic-address-building-link' };
    }
    return feature;
  });
  return pack;
}
