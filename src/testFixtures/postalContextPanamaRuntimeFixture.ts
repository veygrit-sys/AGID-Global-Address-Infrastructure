import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createHaitiPostalContextRuntimeTestPack } from './postalContextHaitiRuntimeFixture';

export const PANAMA_POSTAL_CONTEXT_TEST_POINT = { latitude: 8.981234, longitude: -79.521234 } as const;
export const PANAMA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function panamaSource(value: PostalContextSource): PostalContextSource { return { ...value, sourceId: value.sourceId.replace(/^ht-/, 'pa-'), sourceVersion: value.sourceVersion?.replace(/^ht-/, 'pa-') }; }

export function createPanamaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createHaitiPostalContextRuntimeTestPack());
  const ids = new Map<string, string>([['postal-ht-syn-ht9999','postal-pa-syn-z9zzzzzzzz'],['country-ht','country-pa'],['department-ht-synthetic','province-pa-synthetic'],['commune-ht-synthetic','district-pa-synthetic'],['agid-ht-synthetic-cover','agid-pa-synthetic-cover'],['civic-address-point-ht-synthetic','civic-address-point-pa-synthetic'],['civic-address-ht-synthetic','civic-address-pa-synthetic'],['building-ht-synthetic','building-pa-synthetic']]);
  for (const node of pack.graph.nodes) {
    node.id = ids.get(node.id) ?? node.id; node.countryCode = 'PA';
    if (node.id === 'postal-pa-syn-z9zzzzzzzz') { node.postalCode = 'Z9ZZZ-ZZZZZ'; node.label = 'Synthetic Panama derived-review PICO cell Z9ZZZ-ZZZZZ'; }
    else if (node.id === 'country-pa') node.label = 'Panama';
    else if (node.id === 'province-pa-synthetic') node.label = 'Synthetic Panamanian province context';
    else if (node.id === 'district-pa-synthetic') node.label = 'Synthetic Panamanian district context';
    else if (node.id === 'agid-pa-synthetic-cover') { node.agidCellId = 'PA0000000000'; node.label = 'Synthetic Panamanian AGID cover'; }
    else if (node.id === 'civic-address-pa-synthetic') node.label = 'Synthetic rights-cleared Panamanian civic address PA-SYN-CIVIC-999';
    else if (node.id === 'building-pa-synthetic') node.label = 'Synthetic explicitly address-linked Panamanian building';
  }
  for (const assertion of pack.graph.assertions) { assertion.id = assertion.id.replace(/^ht-/, 'pa-'); assertion.fromNodeId = ids.get(assertion.fromNodeId) ?? assertion.fromNodeId; assertion.toNodeId = ids.get(assertion.toNodeId) ?? assertion.toNodeId; assertion.source = panamaSource(assertion.source); }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-pa-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-pa-synthetic', countryCode: 'PA', releaseId: 'pa-synthetic-2026.01.1', policyVersion: 'panama-postal-context-v0.1' };
  pack.geometry.countryCode = 'PA'; pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = feature.id.replace(/^ht-/, 'pa-'); feature.nodeId = ids.get(feature.nodeId) ?? feature.nodeId; feature.source = panamaSource(feature.source);
    if (feature.role === 'postal_area') { feature.geometry = { type: 'Polygon', coordinates: [[[-79.521249,8.981219],[-79.521219,8.981219],[-79.521219,8.981249],[-79.521249,8.981249],[-79.521249,8.981219]]] }; feature.source = { ...feature.source, sourceId: 'pa-synthetic-derived-pico-validation-polygon', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' }; feature.quality = { status: 'derived', accuracyMeters: 3.3 }; }
    else if (feature.role === 'address_point') feature.geometry = { type: 'Point', coordinates: [PANAMA_POSTAL_CONTEXT_TEST_POINT.longitude, PANAMA_POSTAL_CONTEXT_TEST_POINT.latitude] };
    else if (feature.role === 'building_footprint') feature.geometry = { type: 'Polygon', coordinates: [[[-79.521241,8.981228],[-79.521227,8.981228],[-79.521227,8.981240],[-79.521241,8.981240],[-79.521241,8.981228]]] };
    return feature;
  });
  return pack;
}
