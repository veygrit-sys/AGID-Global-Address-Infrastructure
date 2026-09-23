import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const SERBIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 44.8176,
  longitude: 20.4633,
} as const;

export const SERBIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function serbiaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'rs-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'rs-'),
  };
}

export function createSerbiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-rs-syn-00000'],
    ['country-jp', 'country-rs'],
    ['prefecture-synthetic', 'administrative-district-rs-synthetic'],
    ['locality-synthetic', 'populated-place-rs-synthetic'],
    ['agid-synthetic-cover', 'agid-rs-synthetic-cover'],
    ['address-point-synthetic', 'rgz-house-number-point-rs-synthetic'],
    ['premise-synthetic', 'rgz-address-rs-synthetic'],
    ['building-synthetic', 'rgz-building-rs-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'RS';
    if (node.id === 'postal-rs-syn-00000') {
      node.postalCode = '00000';
      node.label = 'Synthetic Serbia destination-post-office assignment';
    } else if (node.id === 'country-rs') {
      node.label = 'Serbia';
    } else if (node.id === 'administrative-district-rs-synthetic') {
      node.label = 'Synthetic Administrative District';
    } else if (node.id === 'populated-place-rs-synthetic') {
      node.label = 'Probno naselje';
    } else if (node.id === 'agid-rs-synthetic-cover') {
      node.agidCellId = 'RS0000000000';
      node.label = 'Synthetic Serbia AGID cover';
    } else if (node.id === 'rgz-address-rs-synthetic') {
      node.label = 'Probna ulica 1A';
    } else if (node.id === 'rgz-building-rs-synthetic') {
      node.label = 'Synthetic explicitly linked RGZ cadastral building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `rs-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = serbiaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-rs-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-rs-synthetic',
    countryCode: 'RS',
    releaseId: 'rs-synthetic-2026.01.1',
    policyVersion: 'serbia-posta-pak-rgz-address-building-v0.1',
  };

  pack.geometry.countryCode = 'RS';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `rs-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = serbiaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [20.448, 44.807],
          [20.478, 44.807],
          [20.478, 44.828],
          [20.448, 44.828],
          [20.448, 44.807],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'rs-synthetic-derived-address-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 300 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          SERBIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          SERBIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [20.46322, 44.81754],
          [20.46338, 44.81754],
          [20.46338, 44.81766],
          [20.46322, 44.81766],
          [20.46322, 44.81754],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
