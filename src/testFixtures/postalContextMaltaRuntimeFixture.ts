import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const MALTA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 35.8997,
  longitude: 14.5147,
} as const;

export const MALTA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function maltaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'mt-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'mt-'),
  };
}

export function createMaltaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-mt-syn-zzz0000'],
    ['country-jp', 'country-mt'],
    ['prefecture-synthetic', 'region-mt-synthetic'],
    ['locality-synthetic', 'locality-mt-synthetic'],
    ['agid-synthetic-cover', 'agid-mt-synthetic-cover'],
    ['address-point-synthetic', 'oar-addressable-object-mt-synthetic'],
    ['premise-synthetic', 'civic-address-mt-synthetic'],
    ['building-synthetic', 'pa-building-mt-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'MT';
    if (node.id === 'postal-mt-syn-zzz0000') {
      node.postalCode = 'ZZZ 0000';
      node.label = 'Synthetic MaltaPost address-range assignment';
    } else if (node.id === 'country-mt') {
      node.label = 'Malta';
    } else if (node.id === 'region-mt-synthetic') {
      node.label = 'Synthetic Region';
    } else if (node.id === 'locality-mt-synthetic') {
      node.label = 'Synthetic Locality';
    } else if (node.id === 'agid-mt-synthetic-cover') {
      node.agidCellId = 'MT0000000000';
      node.label = 'Synthetic Malta AGID cover';
    } else if (node.id === 'civic-address-mt-synthetic') {
      node.label = '1 Triq tat-Test';
    } else if (node.id === 'pa-building-mt-synthetic') {
      node.label = 'Synthetic explicitly linked Planning Authority building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `mt-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = maltaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-mt-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-mt-synthetic',
    countryCode: 'MT',
    releaseId: 'mt-synthetic-2026.01.1',
    policyVersion: 'malta-postcode-oar-v0.1',
  };

  pack.geometry.countryCode = 'MT';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `mt-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = maltaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [14.500, 35.890],
          [14.530, 35.890],
          [14.530, 35.910],
          [14.500, 35.910],
          [14.500, 35.890],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'mt-synthetic-derived-postcode-area',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 100 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          MALTA_POSTAL_CONTEXT_TEST_POINT.longitude,
          MALTA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [14.51462, 35.89964],
          [14.51478, 35.89964],
          [14.51478, 35.89976],
          [14.51462, 35.89976],
          [14.51462, 35.89964],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
