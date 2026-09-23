import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const GUATEMALA_POSTAL_CONTEXT_TEST_POINT = { latitude: 15.5000, longitude: -90.2500 } as const;
export const GUATEMALA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function guatemalaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'gt-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'gt-'),
  };
}

export function createGuatemalaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-gt-syn-99999'],
    ['country-jp', 'country-gt'],
    ['prefecture-synthetic', 'province-gt-synthetic'],
    ['locality-synthetic', 'municipality-gt-synthetic'],
    ['agid-synthetic-cover', 'agid-gt-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-gt-synthetic'],
    ['premise-synthetic', 'civic-address-gt-synthetic'],
    ['building-synthetic', 'building-gt-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'GT';
    if (node.id === 'postal-gt-syn-99999') {
      node.postalCode = '99999';
      node.label = 'Synthetic Guatemala routing-locality object 99999';
    } else if (node.id === 'country-gt') {
      node.label = 'Guatemala';
    } else if (node.id === 'province-gt-synthetic') {
      node.label = 'Synthetic Guatemala province context';
    } else if (node.id === 'municipality-gt-synthetic') {
      node.label = 'Synthetic Guatemala municipality context';
    } else if (node.id === 'agid-gt-synthetic-cover') {
      node.agidCellId = 'GT0000000000';
      node.label = 'Synthetic Guatemala AGID cover';
    } else if (node.id === 'civic-address-gt-synthetic') {
      node.label = 'Synthetic rights-cleared Guatemala civic address GT-SYN-CIVIC-999';
    } else if (node.id === 'building-gt-synthetic') {
      node.label = 'Synthetic explicitly address-linked Guatemala building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `gt-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = guatemalaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-gt-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-gt-synthetic',
    countryCode: 'GT',
    releaseId: 'gt-synthetic-2026.01.1',
    policyVersion: 'guatemala-postal-context-v0.1',
  };
  pack.geometry.countryCode = 'GT';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `gt-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = guatemalaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-90.265, 15.490], [-90.235, 15.490], [-90.235, 15.510],
          [-90.265, 15.510], [-90.265, 15.490],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'gt-synthetic-routing-locality-validation-polygon',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [GUATEMALA_POSTAL_CONTEXT_TEST_POINT.longitude, GUATEMALA_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-90.25008, 15.49994], [-90.24992, 15.49994], [-90.24992, 15.50006],
          [-90.25008, 15.50006], [-90.25008, 15.49994],
        ]],
      };
    }
    return feature;
  });
  return pack;
}
