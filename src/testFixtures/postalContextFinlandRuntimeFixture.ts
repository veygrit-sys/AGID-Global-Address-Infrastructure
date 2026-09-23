import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const FINLAND_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 60.1699,
  longitude: 24.9384,
} as const;

export const FINLAND_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function finlandSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'fi-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'fi-'),
  };
}

export function createFinlandPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-fi-syn-00000'],
    ['country-jp', 'country-fi'],
    ['prefecture-synthetic', 'region-fi-synthetic'],
    ['locality-synthetic', 'municipality-fi-synthetic'],
    ['agid-synthetic-cover', 'agid-fi-synthetic-cover'],
    ['address-point-synthetic', 'ryhti-address-point-fi-synthetic'],
    ['premise-synthetic', 'dvv-apartment-address-fi-synthetic'],
    ['building-synthetic', 'ryhti-building-fi-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'FI';
    if (node.id === 'postal-fi-syn-00000') {
      node.postalCode = '00000';
      node.label = 'Synthetic Statistics Finland-style statistical postcode area';
    } else if (node.id === 'country-fi') {
      node.label = 'Finland';
    } else if (node.id === 'region-fi-synthetic') {
      node.label = 'Synthetic Region';
    } else if (node.id === 'municipality-fi-synthetic') {
      node.label = 'Synthetic Municipality';
    } else if (node.id === 'agid-fi-synthetic-cover') {
      node.agidCellId = 'FI0000000000';
      node.label = 'Synthetic Finland AGID cover';
    } else if (node.id === 'dvv-apartment-address-fi-synthetic') {
      node.label = 'Mallikatu 1 A 2';
    } else if (node.id === 'ryhti-building-fi-synthetic') {
      node.label = 'Synthetic Ryhti building linked by permanent building identifier';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `fi-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = finlandSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-fi-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-fi-synthetic',
    countryCode: 'FI',
    releaseId: 'fi-synthetic-2026.01.1',
    policyVersion: 'finland-posti-paavo-dvv-ryhti-nls-v0.1',
  };

  pack.geometry.countryCode = 'FI';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `fi-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = finlandSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [24.921, 60.158],
          [24.956, 60.158],
          [24.956, 60.181],
          [24.921, 60.181],
          [24.921, 60.158],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'fi-synthetic-paavo-statistical-postcode-area',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 5 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          FINLAND_POSTAL_CONTEXT_TEST_POINT.longitude,
          FINLAND_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [24.93832, 60.16984],
          [24.93848, 60.16984],
          [24.93848, 60.16996],
          [24.93832, 60.16996],
          [24.93832, 60.16984],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
