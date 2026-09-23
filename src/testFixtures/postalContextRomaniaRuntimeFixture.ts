import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const ROMANIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 44.4268,
  longitude: 26.1025,
} as const;

export const ROMANIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function romaniaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'ro-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'ro-'),
  };
}

export function createRomaniaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-ro-syn-000000'],
    ['country-jp', 'country-ro'],
    ['prefecture-synthetic', 'county-ro-synthetic'],
    ['locality-synthetic', 'locality-ro-synthetic'],
    ['agid-synthetic-cover', 'agid-ro-synthetic-cover'],
    ['address-point-synthetic', 'renns-address-point-ro-synthetic'],
    ['premise-synthetic', 'renns-address-ro-synthetic'],
    ['building-synthetic', 'ancpi-building-ro-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'RO';
    if (node.id === 'postal-ro-syn-000000') {
      node.postalCode = '000000';
      node.label = 'Synthetic Romania address-range postal assignment';
    } else if (node.id === 'country-ro') {
      node.label = 'Romania';
    } else if (node.id === 'county-ro-synthetic') {
      node.label = 'Județ de probă';
    } else if (node.id === 'locality-ro-synthetic') {
      node.label = 'Localitate de probă';
    } else if (node.id === 'agid-ro-synthetic-cover') {
      node.agidCellId = 'RO0000000000';
      node.label = 'Synthetic Romania AGID cover';
    } else if (node.id === 'renns-address-ro-synthetic') {
      node.label = 'Strada Exemplu nr. 1';
    } else if (node.id === 'ancpi-building-ro-synthetic') {
      node.label = 'Synthetic explicitly linked ANCPI construction';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `ro-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = romaniaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-ro-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-ro-synthetic',
    countryCode: 'RO',
    releaseId: 'ro-synthetic-2026.01.1',
    policyVersion: 'romania-posta-renns-ancpi-building-v0.1',
  };

  pack.geometry.countryCode = 'RO';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `ro-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = romaniaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [26.087, 44.416],
          [26.118, 44.416],
          [26.118, 44.438],
          [26.087, 44.438],
          [26.087, 44.416],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'ro-synthetic-derived-cua-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 250 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          ROMANIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          ROMANIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [26.10242, 44.42674],
          [26.10258, 44.42674],
          [26.10258, 44.42686],
          [26.10242, 44.42686],
          [26.10242, 44.42674],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
