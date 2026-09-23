import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const CHILE_POSTAL_CONTEXT_TEST_POINT = { latitude: -33.4500, longitude: -70.6500 } as const;
export const CHILE_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function chileSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'cl-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'cl-'),
  };
}

export function createChilePostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-cl-syn-9999999'],
    ['country-jp', 'country-cl'],
    ['prefecture-synthetic', 'region-cl-synthetic'],
    ['locality-synthetic', 'commune-cl-synthetic'],
    ['agid-synthetic-cover', 'agid-cl-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-cl-synthetic'],
    ['premise-synthetic', 'civic-address-cl-synthetic'],
    ['building-synthetic', 'building-cl-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'CL';
    if (node.id === 'postal-cl-syn-9999999') {
      node.postalCode = '9999999';
      node.label = 'Synthetic Chile block-face postcode object 9999999';
    } else if (node.id === 'country-cl') {
      node.label = 'Chile';
    } else if (node.id === 'region-cl-synthetic') {
      node.label = 'Synthetic Chile region context';
    } else if (node.id === 'commune-cl-synthetic') {
      node.label = 'Synthetic Chile commune context';
    } else if (node.id === 'agid-cl-synthetic-cover') {
      node.agidCellId = 'CL0000000000';
      node.label = 'Synthetic Chile AGID cover';
    } else if (node.id === 'civic-address-cl-synthetic') {
      node.label = 'Synthetic rights-cleared Chile civic address CL-SYN-CIVIC-999';
    } else if (node.id === 'building-cl-synthetic') {
      node.label = 'Synthetic explicitly address-linked Chile building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `cl-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = chileSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-cl-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-cl-synthetic',
    countryCode: 'CL',
    releaseId: 'cl-synthetic-2026.01.1',
    policyVersion: 'chile-postal-context-v0.1',
  };
  pack.geometry.countryCode = 'CL';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `cl-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = chileSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-70.665, -33.460], [-70.635, -33.460], [-70.635, -33.440],
          [-70.665, -33.440], [-70.665, -33.460],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'cl-synthetic-derived-block-face-review-polygon',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [CHILE_POSTAL_CONTEXT_TEST_POINT.longitude, CHILE_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-70.65008, -33.45006], [-70.64992, -33.45006], [-70.64992, -33.44994],
          [-70.65008, -33.44994], [-70.65008, -33.45006],
        ]],
      };
    }
    return feature;
  });
  return pack;
}
