import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createEthiopiaPostalContextRuntimeTestPack } from './postalContextEthiopiaRuntimeFixture';

export const CABO_VERDE_POSTAL_CONTEXT_TEST_POINT = { latitude: 15.001234, longitude: -24.001234 } as const;
export const CABO_VERDE_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function caboVerdeSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^et-/, 'cv-'), sourceVersion: source.sourceVersion?.replace(/^et-/, 'cv-') };
}

export function createCaboVerdePostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createEthiopiaPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-et-syn-0999', 'postal-cv-syn-0999'],
    ['country-et', 'country-cv'],
    ['region-et-synthetic', 'island-cv-synthetic'],
    ['woreda-et-synthetic', 'municipality-cv-synthetic'],
    ['agid-et-synthetic-cover', 'agid-cv-synthetic-cover'],
    ['edas-address-point-et-synthetic', 'cip-address-point-cv-synthetic'],
    ['edas-address-et-synthetic', 'cip-address-cv-synthetic'],
    ['edas-building-et-synthetic', 'cip-building-cv-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'CV';
    if (node.id === 'postal-cv-syn-0999') {
      node.postalCode = '0999';
      node.label = 'Synthetic Cabo Verde typed four-digit postcode';
    } else if (node.id === 'country-cv') node.label = 'Cabo Verde';
    else if (node.id === 'island-cv-synthetic') node.label = 'Ilha Sintética';
    else if (node.id === 'municipality-cv-synthetic') node.label = 'Município Sintético';
    else if (node.id === 'agid-cv-synthetic-cover') {
      node.agidCellId = 'CV0000000000';
      node.label = 'Synthetic Cabo Verde AGID cover';
    } else if (node.id === 'cip-address-cv-synthetic') node.label = 'Endereço CIP sintético CV-CIP-SYN-0999';
    else if (node.id === 'cip-building-cv-synthetic') node.label = 'Synthetic explicitly rights-cleared CIP-address-linked Cabo Verde building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^et-/, 'cv-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = caboVerdeSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-cv-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-cv-synthetic',
    countryCode: 'CV',
    releaseId: 'cv-synthetic-2026.01.1',
    policyVersion: 'cabo-verde-four-digit-postcode-cip-separation-v0.1',
  };

  pack.geometry.countryCode = 'CV';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = feature.id.replace(/^et-/, 'cv-');
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = caboVerdeSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[-24.01, 14.99], [-23.99, 14.99], [-23.99, 15.01], [-24.01, 15.01], [-24.01, 14.99]]] };
      feature.source = { ...feature.source, sourceId: 'cv-synthetic-derived-postal-review-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 500 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [CABO_VERDE_POSTAL_CONTEXT_TEST_POINT.longitude, CABO_VERDE_POSTAL_CONTEXT_TEST_POINT.latitude] };
      feature.source = { ...feature.source, sourceId: 'cv-synthetic-explicit-cip-address-point' };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[-24.00130, 15.00117], [-24.00117, 15.00117], [-24.00117, 15.00130], [-24.00130, 15.00130], [-24.00130, 15.00117]]] };
      feature.source = { ...feature.source, sourceId: 'cv-synthetic-explicit-cip-address-building-link' };
    }
    return feature;
  });
  return pack;
}
