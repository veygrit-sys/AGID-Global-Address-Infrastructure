import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const SLOVAKIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 48.1486,
  longitude: 17.1077,
} as const;

export const SLOVAKIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function slovakiaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'sk-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'sk-'),
  };
}

export function createSlovakiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-sk-syn-00000'],
    ['country-jp', 'country-sk'],
    ['prefecture-synthetic', 'region-sk-synthetic'],
    ['locality-synthetic', 'municipality-sk-synthetic'],
    ['agid-synthetic-cover', 'agid-sk-synthetic-cover'],
    ['address-point-synthetic', 'register-address-point-sk-synthetic'],
    ['premise-synthetic', 'civic-address-sk-synthetic'],
    ['building-synthetic', 'register-building-sk-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'SK';
    if (node.id === 'postal-sk-syn-00000') {
      node.postalCode = '000 00';
      node.label = 'Synthetic Slovak PSČ routing assignment';
    } else if (node.id === 'country-sk') {
      node.label = 'Slovakia';
    } else if (node.id === 'region-sk-synthetic') {
      node.label = 'Synthetic Kraj';
    } else if (node.id === 'municipality-sk-synthetic') {
      node.label = 'Synthetic Obec';
    } else if (node.id === 'agid-sk-synthetic-cover') {
      node.agidCellId = 'SK0000000000';
      node.label = 'Synthetic Slovakia AGID cover';
    } else if (node.id === 'civic-address-sk-synthetic') {
      node.label = 'Skúšobná 1/2';
    } else if (node.id === 'register-building-sk-synthetic') {
      node.label = 'Synthetic explicitly linked Register adries building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `sk-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = slovakiaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-sk-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-sk-synthetic',
    countryCode: 'SK',
    releaseId: 'sk-synthetic-2026.01.1',
    policyVersion: 'slovakia-psc-register-addresses-zbgis-v0.1',
  };

  pack.geometry.countryCode = 'SK';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `sk-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = slovakiaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [17.09, 48.139],
          [17.125, 48.139],
          [17.125, 48.158],
          [17.09, 48.158],
          [17.09, 48.139],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'sk-synthetic-derived-address-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 100 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          SLOVAKIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          SLOVAKIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [17.10762, 48.14854],
          [17.10778, 48.14854],
          [17.10778, 48.14866],
          [17.10762, 48.14866],
          [17.10762, 48.14854],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
