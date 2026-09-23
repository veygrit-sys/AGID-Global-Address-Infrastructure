import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const CANADA_POSTAL_CONTEXT_TEST_POINT = { latitude: 56.0000, longitude: -106.0000 } as const;
export const CANADA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function canadaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'ca-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'ca-'),
  };
}

export function createCanadaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-ca-syn-h9h9h9'],
    ['country-jp', 'country-ca'],
    ['prefecture-synthetic', 'province-territory-ca-synthetic'],
    ['locality-synthetic', 'municipality-ca-synthetic'],
    ['agid-synthetic-cover', 'agid-ca-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-ca-synthetic'],
    ['premise-synthetic', 'civic-address-ca-synthetic'],
    ['building-synthetic', 'building-ca-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'CA';
    if (node.id === 'postal-ca-syn-h9h9h9') {
      node.postalCode = 'H9H 9H9';
      node.label = 'Synthetic Canada delivery-unit object H9H 9H9';
    } else if (node.id === 'country-ca') {
      node.label = 'Canada';
    } else if (node.id === 'province-territory-ca-synthetic') {
      node.label = 'Synthetic Canada province or territory context';
    } else if (node.id === 'municipality-ca-synthetic') {
      node.label = 'Synthetic Canada municipality context';
    } else if (node.id === 'agid-ca-synthetic-cover') {
      node.agidCellId = 'CA0000000000';
      node.label = 'Synthetic Canada AGID cover';
    } else if (node.id === 'civic-address-ca-synthetic') {
      node.label = 'Synthetic rights-cleared Canada civic address CA-SYN-CIVIC-999';
    } else if (node.id === 'building-ca-synthetic') {
      node.label = 'Synthetic explicitly address-linked Canada building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `ca-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = canadaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-ca-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-ca-synthetic',
    countryCode: 'CA',
    releaseId: 'ca-synthetic-2026.01.1',
    policyVersion: 'canada-postal-context-v0.1',
  };
  pack.geometry.countryCode = 'CA';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `ca-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = canadaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-106.015, 55.990], [-105.985, 55.990], [-105.985, 56.010],
          [-106.015, 56.010], [-106.015, 55.990],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'ca-synthetic-delivery-unit-validation-polygon',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [CANADA_POSTAL_CONTEXT_TEST_POINT.longitude, CANADA_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-106.00008, 55.99994], [-105.99992, 55.99994], [-105.99992, 56.00006],
          [-106.00008, 56.00006], [-106.00008, 55.99994],
        ]],
      };
    }
    return feature;
  });
  return pack;
}
