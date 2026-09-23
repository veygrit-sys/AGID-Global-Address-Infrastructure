import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const KUWAIT_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 29.3759,
  longitude: 47.9774,
} as const;

export const KUWAIT_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function kuwaitSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'kw-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'kw-'),
  };
}

export function createKuwaitPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-kw-syn-00000'],
    ['country-jp', 'country-kw'],
    ['prefecture-synthetic', 'governorate-kw-synthetic'],
    ['locality-synthetic', 'block-kw-synthetic'],
    ['agid-synthetic-cover', 'agid-kw-synthetic-cover'],
    ['address-point-synthetic', 'paci-address-point-kw-synthetic'],
    ['premise-synthetic', 'civic-address-kw-synthetic'],
    ['building-synthetic', 'building-kw-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'KW';
    if (node.id === 'postal-kw-syn-00000') {
      node.postalCode = '00000';
      node.label = 'Synthetic Kuwait five-digit block assignment';
    } else if (node.id === 'country-kw') {
      node.label = 'Kuwait';
    } else if (node.id === 'governorate-kw-synthetic') {
      node.label = 'Synthetic Kuwait Governorate';
    } else if (node.id === 'block-kw-synthetic') {
      node.label = 'Synthetic Kuwait Block 0';
    } else if (node.id === 'agid-kw-synthetic-cover') {
      node.agidCellId = 'KW0000000000';
      node.label = 'Synthetic Kuwait AGID cover';
    } else if (node.id === 'civic-address-kw-synthetic') {
      node.label = 'Synthetic Block 0, Street 0, Building 0, PACI 00000000';
    } else if (node.id === 'building-kw-synthetic') {
      node.label = 'Synthetic explicitly linked Kuwait building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `kw-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = kuwaitSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-kw-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-kw-synthetic',
    countryCode: 'KW',
    releaseId: 'kw-synthetic-2026.01.1',
    policyVersion: 'kuwait-five-digit-block-or-po-box-v0.1',
  };

  pack.geometry.countryCode = 'KW';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `kw-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = kuwaitSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [47.966, 29.365],
          [47.988, 29.365],
          [47.988, 29.386],
          [47.966, 29.386],
          [47.966, 29.365],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'kw-synthetic-derived-block-postal-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 250 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [KUWAIT_POSTAL_CONTEXT_TEST_POINT.longitude, KUWAIT_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [47.97732, 29.37584],
          [47.97748, 29.37584],
          [47.97748, 29.37596],
          [47.97732, 29.37596],
          [47.97732, 29.37584],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
