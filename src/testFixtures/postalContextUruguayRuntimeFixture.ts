import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const URUGUAY_POSTAL_CONTEXT_TEST_POINT = { latitude: -32.5000, longitude: -56.0000 } as const;
export const URUGUAY_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function uruguaySource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'uy-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'uy-'),
  };
}

export function createUruguayPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-uy-syn-99999'],
    ['country-jp', 'country-uy'],
    ['prefecture-synthetic', 'department-uy-synthetic'],
    ['locality-synthetic', 'locality-uy-synthetic'],
    ['agid-synthetic-cover', 'agid-uy-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-uy-synthetic'],
    ['premise-synthetic', 'civic-address-uy-synthetic'],
    ['building-synthetic', 'building-uy-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'UY';
    if (node.id === 'postal-uy-syn-99999') {
      node.postalCode = '99999';
      node.label = 'Synthetic Uruguay postal object 99999';
    } else if (node.id === 'country-uy') {
      node.label = 'Uruguay';
    } else if (node.id === 'department-uy-synthetic') {
      node.label = 'Synthetic Uruguay department context';
    } else if (node.id === 'locality-uy-synthetic') {
      node.label = 'Synthetic Uruguay locality context';
    } else if (node.id === 'agid-uy-synthetic-cover') {
      node.agidCellId = 'UY0000000000';
      node.label = 'Synthetic Uruguay AGID cover';
    } else if (node.id === 'civic-address-uy-synthetic') {
      node.label = 'Synthetic rights-cleared Uruguay civic address UY-SYN-CIVIC-99';
    } else if (node.id === 'building-uy-synthetic') {
      node.label = 'Synthetic explicitly address-linked Uruguay building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `uy-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = uruguaySource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-uy-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-uy-synthetic',
    countryCode: 'UY',
    releaseId: 'uy-synthetic-2026.01.1',
    policyVersion: 'uruguay-postal-context-v0.1',
  };
  pack.geometry.countryCode = 'UY';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `uy-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = uruguaySource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-56.015, -32.510], [-55.985, -32.510], [-55.985, -32.490],
          [-56.015, -32.490], [-56.015, -32.510],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'uy-synthetic-official-release-like-validation-polygon',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [URUGUAY_POSTAL_CONTEXT_TEST_POINT.longitude, URUGUAY_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-56.00008, -32.50006], [-55.99992, -32.50006], [-55.99992, -32.49994],
          [-56.00008, -32.49994], [-56.00008, -32.50006],
        ]],
      };
    }
    return feature;
  });
  return pack;
}
