import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPanamaPostalContextRuntimeTestPack } from './postalContextPanamaRuntimeFixture';

export const BARBADOS_POSTAL_CONTEXT_TEST_POINT = { latitude: 13.101234, longitude: -59.601234 } as const;
export const BARBADOS_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function barbadosSource(value: PostalContextSource): PostalContextSource { return { ...value, sourceId: value.sourceId.replace(/^pa-/, 'bb-'), sourceVersion: value.sourceVersion?.replace(/^pa-/, 'bb-') }; }

export function createBarbadosPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPanamaPostalContextRuntimeTestPack());
  const ids = new Map<string, string>([['postal-pa-syn-z9zzzzzzzz','postal-bb-syn-bb99999-z9z9z'],['country-pa','country-bb'],['province-pa-synthetic','parish-bb-synthetic'],['district-pa-synthetic','locality-bb-synthetic'],['agid-pa-synthetic-cover','agid-bb-synthetic-cover'],['civic-address-point-pa-synthetic','civic-address-point-bb-synthetic'],['civic-address-pa-synthetic','civic-address-bb-synthetic'],['building-pa-synthetic','building-bb-synthetic']]);
  for (const node of pack.graph.nodes) {
    node.id = ids.get(node.id) ?? node.id; node.countryCode = 'BB';
    if (node.id === 'postal-bb-syn-bb99999-z9z9z') { node.postalCode = 'BB99999-Z9Z9Z'; node.label = 'Synthetic Barbados BBID-linked validation area BB99999-Z9Z9Z'; }
    else if (node.id === 'country-bb') node.label = 'Barbados';
    else if (node.id === 'parish-bb-synthetic') node.label = 'Synthetic Barbadian parish context';
    else if (node.id === 'locality-bb-synthetic') node.label = 'Synthetic Barbadian locality context';
    else if (node.id === 'agid-bb-synthetic-cover') { node.agidCellId = 'BB0000000000'; node.label = 'Synthetic Barbadian AGID cover'; }
    else if (node.id === 'civic-address-bb-synthetic') node.label = 'Synthetic rights-cleared Barbadian civic address BB-SYN-CIVIC-999';
    else if (node.id === 'building-bb-synthetic') node.label = 'Synthetic explicitly BBID-linked Barbadian building';
  }
  for (const assertion of pack.graph.assertions) { assertion.id = assertion.id.replace(/^pa-/, 'bb-'); assertion.fromNodeId = ids.get(assertion.fromNodeId) ?? assertion.fromNodeId; assertion.toNodeId = ids.get(assertion.toNodeId) ?? assertion.toNodeId; assertion.source = barbadosSource(assertion.source); }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-bb-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-bb-synthetic', countryCode: 'BB', releaseId: 'bb-synthetic-2026.01.1', policyVersion: 'barbados-postal-context-v0.1' };
  pack.geometry.countryCode = 'BB'; pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = feature.id.replace(/^pa-/, 'bb-'); feature.nodeId = ids.get(feature.nodeId) ?? feature.nodeId; feature.source = barbadosSource(feature.source);
    if (feature.role === 'postal_area') { feature.geometry = { type: 'Polygon', coordinates: [[[-59.601250,13.101218],[-59.601218,13.101218],[-59.601218,13.101250],[-59.601250,13.101250],[-59.601250,13.101218]]] }; feature.source = { ...feature.source, sourceId: 'bb-synthetic-building-linked-validation-polygon', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' }; feature.quality = { status: 'derived', accuracyMeters: 3.5 }; }
    else if (feature.role === 'address_point') feature.geometry = { type: 'Point', coordinates: [BARBADOS_POSTAL_CONTEXT_TEST_POINT.longitude, BARBADOS_POSTAL_CONTEXT_TEST_POINT.latitude] };
    else if (feature.role === 'building_footprint') feature.geometry = { type: 'Polygon', coordinates: [[[-59.601242,13.101226],[-59.601226,13.101226],[-59.601226,13.101242],[-59.601242,13.101242],[-59.601242,13.101226]]] };
    return feature;
  });
  return pack;
}
