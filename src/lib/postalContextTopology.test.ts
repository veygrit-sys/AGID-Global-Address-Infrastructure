import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION,
  type PostalContextGeometryCollection,
  type PostalContextLinearRing,
} from './postalContextSpatial';
import {
  POSTAL_CONTEXT_PACK_LIMITS,
  validatePostalContextGeometryTopology,
} from './postalContextTopology';

const RANGE = { from: '2026-01-01T00:00:00.000Z', to: null } as const;
const DIGEST = `sha256:${'a'.repeat(64)}` as const;

function ring(
  minimumLongitude: number,
  minimumLatitude: number,
  size: number,
): PostalContextLinearRing {
  return [
    [minimumLongitude, minimumLatitude],
    [minimumLongitude + size, minimumLatitude],
    [minimumLongitude + size, minimumLatitude + size],
    [minimumLongitude, minimumLatitude + size],
    [minimumLongitude, minimumLatitude],
  ];
}

function collectionWithPolygon(
  coordinates: PostalContextGeometryCollection['features'][number]['geometry'] extends infer _Geometry
    ? readonly PostalContextLinearRing[]
    : never,
): PostalContextGeometryCollection {
  return {
    schemaVersion: POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION,
    countryCode: 'JP',
    releaseId: 'jp-topology-load-test',
    features: [{
      id: 'topology-load-feature',
      nodeId: 'topology-load-node',
      role: 'postal_area',
      publicationClass: 'public_context',
      geometry: { type: 'Polygon', coordinates },
      source: {
        sourceId: 'topology-load-source',
        sourceType: 'synthetic',
        assignmentAuthority: 'none',
        geometryAuthority: 'synthetic_fixture_geometry',
        licenseId: 'AGID-SYNTHETIC-ONLY',
        digest: DIGEST,
      },
      validTime: RANGE,
      knownTime: RANGE,
      quality: { status: 'verified' },
    }],
  };
}

test('topology sweep skips disjoint segment boxes without consuming the comparison budget', () => {
  const holes = Array.from({ length: 1_000 }, (_, index) => {
    const column = index % 100;
    const row = Math.floor(index / 100);
    return ring(-75 + column * 1.5, -75 + row * 3, 0.2);
  });
  const collection = collectionWithPolygon([
    ring(-80, -80, 160),
    ...holes,
  ]);

  const result = validatePostalContextGeometryTopology(collection);

  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.equal(result.positionCount, 5 + holes.length * 5);
  assert.deepEqual(result.errors, []);
});

test('topology validation still aborts an adversarial overlapping-longitude scan at the same budget', () => {
  const zigzag: Array<readonly [number, number]> = Array.from({ length: 2_200 }, (_, index) => [
    index % 2,
    index * 0.001,
  ] as const);
  const maximumLatitude = (zigzag.length - 1) * 0.001;
  const adversarialRing = [
    ...zigzag,
    [2, maximumLatitude + 1] as const,
    [2, -1] as const,
    [-1, -1] as const,
    zigzag[0],
  ] as PostalContextLinearRing;
  const result = validatePostalContextGeometryTopology(collectionWithPolygon([adversarialRing]));

  assert.equal(result.valid, false);
  assert.equal(result.positionCount, adversarialRing.length);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /^geometry-topology-budget-exceeded:/u);
});

test('topology validation hard-caps negative errors and stops scanning the remaining features', () => {
  const invalidRing = [[0, 0], [0, 0], [0, 0], [0, 0]] as const;
  const prototype = collectionWithPolygon([invalidRing]).features[0];
  const collection: PostalContextGeometryCollection = {
    schemaVersion: POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION,
    countryCode: 'JP',
    releaseId: 'jp-topology-error-cap-test',
    features: Array.from({ length: 1_000 }, (_, index) => ({
      ...prototype,
      id: `invalid-topology-${index}`,
      nodeId: `invalid-topology-node-${index}`,
    })),
  };

  const result = validatePostalContextGeometryTopology(collection);

  assert.equal(result.valid, false);
  assert.equal(result.errors.length, POSTAL_CONTEXT_PACK_LIMITS.topologyErrors);
  assert.equal(result.errors.at(-1), 'geometry-topology-error-limit-exceeded');
  assert.ok(result.positionCount < collection.features.length * invalidRing.length);
});

test('topology validation accepts OGC-valid point contacts without accepting edge overlap', () => {
  const outer = ring(0, 0, 10);
  const pointTouchingOuter = [
    [0, 0], [2, 1], [1, 2], [0, 0],
  ] as PostalContextLinearRing;
  const firstHole = ring(3, 3, 1);
  const pointTouchingHole = ring(4, 4, 1);
  const valid = validatePostalContextGeometryTopology(collectionWithPolygon([
    outer, pointTouchingOuter, firstHole, pointTouchingHole,
  ]));
  assert.equal(valid.valid, true, valid.errors.join('\n'));

  const edgeOverlappingOuter = [
    [0, 2], [2, 2], [2, 4], [0, 4], [0, 2],
  ] as PostalContextLinearRing;
  const invalid = validatePostalContextGeometryTopology(collectionWithPolygon([
    outer, edgeOverlappingOuter,
  ]));
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.includes('geometry-hole-intersects-outer')));

  const bowTie = [
    [0, 0], [2, 2], [0, 2], [2, 0], [0, 0],
  ] as PostalContextLinearRing;
  const crossed = validatePostalContextGeometryTopology(collectionWithPolygon([bowTie]));
  assert.equal(crossed.valid, false);
  assert.ok(crossed.errors.some(error => error.includes('geometry-ring-self-intersection')));
});
