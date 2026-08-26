import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const CUBA_POSTAL_CONTEXT_TEST_POINT = { latitude: 21.5000, longitude: -79.5000 } as const;
export const CUBA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function cubaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'cu-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'cu-'),
  };
}

export function createCubaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-cu-syn-99999'],
    ['country-jp', 'country-cu'],
    ['prefecture-synthetic', 'province-cu-synthetic'],
    ['locality-synthetic', 'municipality-cu-synthetic'],
    ['agid-synthetic-cover', 'agid-cu-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-cu-synthetic'],
    ['premise-synthetic', 'civic-address-cu-synthetic'],
    ['building-synthetic', 'building-cu-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'CU';
    if (node.id === 'postal-cu-syn-99999') {
      node.postalCode = '99999';
      node.label = 'Synthetic Cuba routing-locality object 99999';
    } else if (node.id === 'country-cu') {
      node.label = 'Cuba';
    } else if (node.id === 'province-cu-synthetic') {
      node.label = 'Synthetic Cuba province context';
    } else if (node.id === 'municipality-cu-synthetic') {
      node.label = 'Synthetic Cuba municipality context';
    } else if (node.id === 'agid-cu-synthetic-cover') {
      node.agidCellId = 'CU0000000000';
      node.label = 'Synthetic Cuba AGID cover';
    } else if (node.id === 'civic-address-cu-synthetic') {
      node.label = 'Synthetic rights-cleared Cuba civic address CU-SYN-CIVIC-999';
    } else if (node.id === 'building-cu-synthetic') {
      node.label = 'Synthetic explicitly address-linked Cuba building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `cu-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = cubaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-cu-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-cu-synthetic',
    countryCode: 'CU',
    releaseId: 'cu-synthetic-2026.01.1',
    policyVersion: 'cuba-postal-context-v0.1',
  };
  pack.geometry.countryCode = 'CU';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `cu-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = cubaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-79.515, 21.490], [-79.485, 21.490], [-79.485, 21.510],
          [-79.515, 21.510], [-79.515, 21.490],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'cu-synthetic-routing-locality-validation-polygon',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [CUBA_POSTAL_CONTEXT_TEST_POINT.longitude, CUBA_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-79.50008, 21.49994], [-79.49992, 21.49994], [-79.49992, 21.50006],
          [-79.50008, 21.50006], [-79.50008, 21.49994],
        ]],
      };
    }
    return feature;
  });
  return pack;
}
