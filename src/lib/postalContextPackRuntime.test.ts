import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parsePostalContextRuntimePack } from './postalContextPackParser';
import type {
  PostalContextAssertion,
  PostalContextNode,
  PostalContextSource,
} from './postalContextGraph';
import type { PostalContextGeometryFeature } from './postalContextSpatial';
import {
  POSTAL_CONTEXT_RUNTIME_INDEX_LIMITS,
  PostalContextPackRuntime,
  normalizeJapanPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  POSTAL_CONTEXT_TEST_INSTANT,
  POSTAL_CONTEXT_TEST_POINT,
  createPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextRuntimeFixture';

test('normalizes Japanese postal codes without inventing non-seven-digit codes', () => {
  assert.equal(normalizeJapanPostalCode('０００－０００１'), '000-0001');
  assert.equal(normalizeJapanPostalCode('0000001'), '000-0001');
  assert.equal(normalizeJapanPostalCode('100-001'), null);
  assert.equal(normalizeJapanPostalCode('ABC-0001'), null);
});

test('resolves a source-linked synthetic address point to premise and building', () => {
  const runtime = new PostalContextPackRuntime(createPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.equal(result.selected?.components.some(component => component.label === '架空AGIDビル'), true);
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /geometry-address-point-synthetic/);
  assert.doesNotMatch(serialized, /address-point-synthetic/);
  assert.doesNotMatch(serialized, /distanceMeters|matchRadiusMeters/);
  assert.doesNotMatch(serialized, /"latitude"|"longitude"/);
});

test('postal polygon alone stops at postal area and never adds a nearby building', () => {
  const runtime = new PostalContextPackRuntime(createPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    latitude: 35.685,
    longitude: 139.755,
    purpose: 'display',
    validAt: POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'partial');
  assert.equal(result.resolvedLevel, 'postal_area');
  assert.equal(result.capabilities.building, false);
  assert.equal(result.addressPointEvidence.matched, false);
  assert.ok(result.warnings.includes('postal-area-only-no-source-address-point'));
});

test('a postal boundary remains ambiguous', () => {
  const runtime = new PostalContextPackRuntime(createPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    latitude: 35.68,
    longitude: 139.74,
    purpose: 'display',
    validAt: POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'ambiguous');
  assert.ok(result.warnings.includes('postal-boundary-requires-disambiguation'));
  assert.equal(result.selected, undefined);
});

test('release validity is enforced for lookup and coordinate resolution', () => {
  const runtime = new PostalContextPackRuntime(createPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('000-0001', '2025-06-01T00:00:00.000Z');
  const coordinate = runtime.resolvePublicCoordinate({
    ...POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: '2025-06-01T00:00:00.000Z',
  });

  assert.equal(lookup.status, 'no_match');
  assert.equal(coordinate.status, 'no_match');
  assert.ok(coordinate.warnings.includes('release-not-effective-at-request-time'));
});

test('candidate address points do not promote a coordinate beyond postal area', () => {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const point = pack.geometry.features.find(feature => feature.role === 'address_point');
  assert.ok(point);
  point.quality.status = 'candidate';
  const runtime = new PostalContextPackRuntime(pack);
  const result = runtime.resolvePublicCoordinate({
    ...POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'partial');
  assert.equal(result.resolvedLevel, 'postal_area');
  assert.equal(result.addressPointEvidence.matched, false);
});

test('candidate and disputed assertions cannot promote premise, building, or lookup context', () => {
  for (const qualityStatus of ['candidate', 'disputed'] as const) {
    const premisePack = structuredClone(createPostalContextRuntimeTestPack());
    const premiseLink = premisePack.graph.assertions.find(
      assertion => assertion.id === 'a-address-point-premise',
    );
    assert.ok(premiseLink);
    premiseLink.quality.status = qualityStatus;
    const premiseResult = new PostalContextPackRuntime(premisePack).resolvePublicCoordinate({
      ...POSTAL_CONTEXT_TEST_POINT,
      purpose: 'display',
      validAt: POSTAL_CONTEXT_TEST_INSTANT,
    });

    assert.equal(premiseResult.status, 'partial');
    assert.equal(premiseResult.resolvedLevel, 'postal_area');
    assert.equal(premiseResult.capabilities.premise, false);
    assert.equal(premiseResult.capabilities.building, false);

    const buildingPack = structuredClone(createPostalContextRuntimeTestPack());
    const buildingLink = buildingPack.graph.assertions.find(
      assertion => assertion.id === 'a-premise-building',
    );
    assert.ok(buildingLink);
    buildingLink.quality.status = qualityStatus;
    const buildingResult = new PostalContextPackRuntime(buildingPack).resolvePublicCoordinate({
      ...POSTAL_CONTEXT_TEST_POINT,
      purpose: 'display',
      validAt: POSTAL_CONTEXT_TEST_INSTANT,
    });

    assert.equal(buildingResult.status, 'unique');
    assert.equal(buildingResult.resolvedLevel, 'premise');
    assert.equal(buildingResult.capabilities.premise, true);
    assert.equal(buildingResult.capabilities.building, false);

    const lookupPack = structuredClone(createPostalContextRuntimeTestPack());
    const contextLink = lookupPack.graph.assertions.find(
      assertion => assertion.id === 'a-postal-locality',
    );
    assert.ok(contextLink);
    contextLink.quality.status = qualityStatus;
    const lookup = new PostalContextPackRuntime(lookupPack).lookupPostalCode(
      '000-0001',
      POSTAL_CONTEXT_TEST_INSTANT,
    );

    assert.equal(lookup.status, 'unique');
    assert.equal(lookup.contexts.some(context => context.id === 'locality-synthetic'), false);
    assert.equal(lookup.contexts.some(context => context.id === 'prefecture-synthetic'), false);
  }
});

test('nearest and virtual assertions cannot become definitive lookup or address context', () => {
  for (const method of ['nearest', 'virtual_grid'] as const) {
    const pack = structuredClone(createPostalContextRuntimeTestPack());
    const premiseLink = pack.graph.assertions.find(
      assertion => assertion.id === 'a-address-point-premise',
    );
    const contextLink = pack.graph.assertions.find(
      assertion => assertion.id === 'a-postal-locality',
    );
    assert.ok(premiseLink && contextLink);
    premiseLink.method = method;
    contextLink.method = method;
    if (method === 'virtual_grid') {
      for (const assertion of [premiseLink, contextLink]) {
        assertion.source = {
          ...assertion.source,
          sourceType: 'virtual',
          assignmentAuthority: 'virtual_assignment',
          geometryAuthority: 'virtual_geometry',
        };
      }
    }

    const runtime = new PostalContextPackRuntime(pack);
    const lookup = runtime.lookupPostalCode('000-0001', POSTAL_CONTEXT_TEST_INSTANT);
    const coordinate = runtime.resolvePublicCoordinate({
      ...POSTAL_CONTEXT_TEST_POINT,
      purpose: 'display',
      validAt: POSTAL_CONTEXT_TEST_INSTANT,
    });

    assert.equal(lookup.status, 'unique');
    assert.equal(lookup.contexts.some(context => context.kind === 'locality'), false);
    assert.equal(lookup.contexts.some(context => context.kind === 'administrative_area'), false);
    assert.equal(lookup.alternatives.every(alternative =>
      alternative.contexts.every(context =>
        context.kind !== 'locality' && context.kind !== 'administrative_area')), true);
    assert.equal(coordinate.status, 'partial');
    assert.equal(coordinate.resolvedLevel, 'postal_area');
    assert.equal(coordinate.capabilities.premise, false);
    assert.equal(coordinate.capabilities.building, false);
    assert.equal(coordinate.selected?.components.some(component =>
      component.kind === 'address_record' || component.kind === 'building'), false);
  }
});

test('postal-only paths cannot promote a lookup or coordinate to street level', () => {
  const thoroughfare: PostalContextNode = {
    id: 'thoroughfare-synthetic',
    kind: 'thoroughfare',
    featureKind: 'street',
    geometryType: 'none',
    countryCode: 'JP',
    label: '架空検証通り',
    visibility: 'public',
  };

  const directLookupPack = structuredClone(createPostalContextRuntimeTestPack());
  const postalContextLink = directLookupPack.graph.assertions.find(
    assertion => assertion.id === 'a-postal-locality',
  );
  assert.ok(postalContextLink);
  (directLookupPack.graph.nodes as PostalContextNode[]).push(structuredClone(thoroughfare));
  postalContextLink.toNodeId = thoroughfare.id;
  postalContextLink.relation = 'part_of';
  const lookup = new PostalContextPackRuntime(directLookupPack).lookupPostalCode(
    '000-0001',
    POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(lookup.contexts.some(context => context.kind === 'thoroughfare'), false);
  assert.equal(lookup.alternatives.every(alternative =>
    alternative.contexts.every(context => context.kind !== 'thoroughfare')), true);

  const multiHopPack = structuredClone(createPostalContextRuntimeTestPack());
  const localityContextLink = multiHopPack.graph.assertions.find(
    assertion => assertion.id === 'a-locality-prefecture',
  );
  assert.ok(localityContextLink);
  (multiHopPack.graph.nodes as PostalContextNode[]).push(structuredClone(thoroughfare));
  (multiHopPack.graph.assertions as PostalContextAssertion[]).push({
    ...structuredClone(localityContextLink),
    id: 'a-locality-thoroughfare',
    fromNodeId: 'locality-synthetic',
    toNodeId: thoroughfare.id,
    relation: 'part_of',
  });
  const coordinate = new PostalContextPackRuntime(multiHopPack).resolvePublicCoordinate({
    latitude: 35.685,
    longitude: 139.755,
    purpose: 'display',
    validAt: POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(coordinate.status, 'partial');
  assert.equal(coordinate.resolvedLevel, 'postal_area');
  assert.equal(coordinate.capabilities.streetOrBlock, false);
  assert.equal(coordinate.selected?.components.some(component =>
    component.kind === 'thoroughfare'), false);
});

test('postal lookup excludes context assertions intended for another purpose', () => {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const contextLink = pack.graph.assertions.find(
    assertion => assertion.id === 'a-postal-locality',
  );
  assert.ok(contextLink);
  contextLink.purposes = ['delivery'];

  const lookup = new PostalContextPackRuntime(pack).lookupPostalCode(
    '000-0001',
    POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.contexts.some(context => context.kind === 'locality'), false);
  assert.equal(lookup.contexts.some(context => context.kind === 'administrative_area'), false);
  assert.equal(lookup.alternatives.every(alternative =>
    alternative.contexts.every(context =>
      context.kind !== 'locality' && context.kind !== 'administrative_area')), true);
});

test('virtual geometry is excluded from definitive public spatial matching', () => {
  const postalPack = structuredClone(createPostalContextRuntimeTestPack());
  const postalGeometry = postalPack.geometry.features.find(
    feature => feature.role === 'postal_area',
  );
  assert.ok(postalGeometry);
  postalGeometry.source = {
    ...postalGeometry.source,
    sourceType: 'virtual',
    geometryAuthority: 'virtual_geometry',
  };
  const postalRuntime = new PostalContextPackRuntime(postalPack);
  const lookup = postalRuntime.lookupPostalCode(
    '000-0001',
    POSTAL_CONTEXT_TEST_INSTANT,
    POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );
  const intersects = postalRuntime.intersectsPostalBbox(
    [139.745, 35.675, 139.755, 35.685],
    POSTAL_CONTEXT_TEST_INSTANT,
  );
  const coordinate = postalRuntime.resolvePublicCoordinate({
    latitude: 35.685,
    longitude: 139.755,
    purpose: 'display',
    validAt: POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.deepEqual(lookup.geometries, []);
  assert.equal(intersects.status, 'no_match');
  assert.equal(coordinate.status, 'no_match');

  const virtualAssignmentPack = structuredClone(createPostalContextRuntimeTestPack());
  const virtualAssignmentGeometry = virtualAssignmentPack.geometry.features.find(
    feature => feature.role === 'postal_area',
  );
  assert.ok(virtualAssignmentGeometry);
  virtualAssignmentGeometry.source = {
    ...virtualAssignmentGeometry.source,
    sourceType: 'derived',
    assignmentAuthority: 'virtual_assignment',
    geometryAuthority: 'derived_geometry',
  };
  const virtualAssignmentIntersects = new PostalContextPackRuntime(
    virtualAssignmentPack,
  ).intersectsPostalBbox(
    [139.745, 35.675, 139.755, 35.685],
    POSTAL_CONTEXT_TEST_INSTANT,
  );
  assert.equal(virtualAssignmentIntersects.status, 'no_match');

  const pointPack = structuredClone(createPostalContextRuntimeTestPack());
  const addressPoint = pointPack.geometry.features.find(
    feature => feature.role === 'address_point',
  );
  assert.ok(addressPoint);
  addressPoint.source = {
    ...addressPoint.source,
    sourceType: 'derived',
    assignmentAuthority: 'virtual_assignment',
    geometryAuthority: 'derived_geometry',
  };
  const pointResult = new PostalContextPackRuntime(pointPack).resolvePublicCoordinate({
    ...POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(pointResult.status, 'partial');
  assert.equal(pointResult.resolvedLevel, 'postal_area');
  assert.equal(pointResult.addressPointEvidence.matched, false);
  assert.equal(pointResult.capabilities.premise, false);
  assert.equal(pointResult.capabilities.building, false);
});

test('derived address-point evidence cannot promote premise or building in M2', () => {
  const basePack = structuredClone(createPostalContextRuntimeTestPack());
  const basePoint = basePack.geometry.features.find(feature => feature.role === 'address_point');
  assert.ok(basePoint);
  const unsafeSources: PostalContextSource[] = [{
    ...basePoint.source,
    sourceType: 'derived',
    assignmentAuthority: 'none',
    geometryAuthority: 'official_address_registry_geometry',
  }, {
    ...basePoint.source,
    sourceType: 'official',
    assignmentAuthority: 'none',
    geometryAuthority: 'derived_geometry',
  }, {
    ...basePoint.source,
    sourceType: 'official',
    assignmentAuthority: 'derived_spatial_assignment',
    geometryAuthority: 'official_address_registry_geometry',
  }];

  for (const source of unsafeSources) {
    const pack = structuredClone(basePack);
    const point = pack.geometry.features.find(feature => feature.role === 'address_point');
    assert.ok(point);
    point.source = source;
    const result = new PostalContextPackRuntime(pack).resolvePublicCoordinate({
      ...POSTAL_CONTEXT_TEST_POINT,
      purpose: 'display',
      validAt: POSTAL_CONTEXT_TEST_INSTANT,
    });

    assert.equal(result.status, 'partial');
    assert.equal(result.resolvedLevel, 'postal_area');
    assert.equal(result.addressPointEvidence.matched, false);
    assert.equal(result.capabilities.premise, false);
    assert.equal(result.capabilities.building, false);
  }
});

test('lookup omits geometry by default and returns it only when explicitly requested', () => {
  const runtime = new PostalContextPackRuntime(createPostalContextRuntimeTestPack());
  const result = runtime.lookupPostalCode('0000001', POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000001',
    POSTAL_CONTEXT_TEST_INSTANT,
    POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.normalizedPostalCode, '000-0001');
  assert.equal(result.geometries.length, 0);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0].geometry.type, 'Polygon');
  assert.equal(result.alternatives.length, 1);
  assert.equal(result.contexts.some(context => context.kind === 'agid_cell'), true);
  assert.equal(result.contexts.some(context => context.label === '架空都'), true);
});

test('lookup separates conflicting address branches and exposes only their common context', () => {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const locality = pack.graph.nodes.find(node => node.id === 'locality-synthetic');
  const postalToLocality = pack.graph.assertions.find(
    assertion => assertion.id === 'a-postal-locality',
  );
  const localityToPrefecture = pack.graph.assertions.find(
    assertion => assertion.id === 'a-locality-prefecture',
  );
  assert.ok(locality && postalToLocality && localityToPrefecture);

  const alternateLocality: PostalContextNode = {
    ...structuredClone(locality),
    id: 'locality-synthetic-alternative',
    label: '架空検証町別枝',
  };
  const alternateAssertions: PostalContextAssertion[] = [{
    ...structuredClone(postalToLocality),
    id: 'a-postal-locality-alternative',
    toNodeId: alternateLocality.id,
  }, {
    ...structuredClone(localityToPrefecture),
    id: 'a-locality-alternative-prefecture',
    fromNodeId: alternateLocality.id,
  }];
  (pack.graph.nodes as PostalContextNode[]).push(alternateLocality);
  (pack.graph.assertions as PostalContextAssertion[]).push(...alternateAssertions);

  const result = new PostalContextPackRuntime(pack).lookupPostalCode(
    '0000001',
    POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'ambiguous');
  assert.equal(result.alternatives.length, 2);
  assert.equal(result.contexts.some(context => context.kind === 'locality'), false);
  assert.equal(result.contexts.some(context => context.id === 'prefecture-synthetic'), true);
  assert.equal(result.contexts.some(context => context.id === 'country-jp'), true);
  assert.equal(result.contexts.some(context => context.kind === 'agid_cell'), true);
  assert.equal(result.alternatives.every(alternative =>
    alternative.contexts.filter(context => context.kind === 'locality').length === 1), true);
  assert.deepEqual(
    result.alternatives.map(alternative =>
      alternative.contexts.find(context => context.kind === 'locality')?.id).sort(),
    ['locality-synthetic', 'locality-synthetic-alternative'],
  );
  assert.equal(result.assertionIds.includes('a-postal-locality'), false);
  assert.equal(result.assertionIds.includes('a-postal-locality-alternative'), false);
});

test('bbox intersection performs exact geometry checks and enforces scope limits', () => {
  const runtime = new PostalContextPackRuntime(createPostalContextRuntimeTestPack());
  const match = runtime.intersectsPostalBbox(
    [139.745, 35.675, 139.755, 35.685],
    POSTAL_CONTEXT_TEST_INSTANT,
  );
  const outside = runtime.intersectsPostalBbox(
    [140, 36, 140.1, 36.1],
    POSTAL_CONTEXT_TEST_INSTANT,
  );
  const tooLarge = runtime.intersectsPostalBbox(
    [130, 30, 140, 40],
    POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(match.status, 'unique');
  assert.equal(match.matches.length, 1);
  assert.equal(outside.status, 'no_match');
  assert.equal(tooLarge.status, 'invalid');
  assert.deepEqual(tooLarge.errors, ['bbox-scope-limit-exceeded']);
});

test('geometry responses are omitted or truncated before feature limits are exceeded', () => {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const postalGeometry = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.ok(postalGeometry);
  for (let index = 1; index <= 16; index += 1) {
    (pack.geometry.features as PostalContextGeometryFeature[]).push({
      ...structuredClone(postalGeometry),
      id: `geometry-postal-response-limit-${index}`,
    });
  }
  const runtime = new PostalContextPackRuntime(pack);
  const lookup = runtime.lookupPostalCode(
    '0000001',
    POSTAL_CONTEXT_TEST_INSTANT,
    POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );
  const intersects = runtime.intersectsPostalBbox(
    [139.745, 35.675, 139.755, 35.685],
    POSTAL_CONTEXT_TEST_INSTANT,
    POSTAL_CONTEXT_TEST_INSTANT,
    16,
  );

  assert.equal(lookup.status, 'unique');
  assert.deepEqual(lookup.geometries, []);
  assert.ok(lookup.warnings.includes('postal-geometry-response-limit-exceeded'));
  assert.equal(intersects.status, 'unique');
  assert.equal(intersects.matches.length, 16);
  assert.equal(intersects.truncated, true);
  assert.ok(intersects.warnings.includes('postal-intersection-results-truncated'));
});

test('spatial candidate fan-out fails closed before point-in-polygon work', () => {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const postalGeometry = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.ok(postalGeometry);
  for (let index = 1; index <= 2_048; index += 1) {
    (pack.geometry.features as PostalContextGeometryFeature[]).push({
      ...structuredClone(postalGeometry),
      id: `geometry-postal-candidate-limit-${index}`,
    });
  }
  const result = new PostalContextPackRuntime(pack).resolvePublicCoordinate({
    ...POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'invalid');
  assert.deepEqual(result.errors, ['spatial-candidate-limit-exceeded']);
});

test('spatial indexes share a fail-closed posting budget during construction', () => {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const postalGeometry = pack.geometry.features.find(feature => feature.role === 'postal_area');
  const addressPoint = pack.geometry.features.find(feature => feature.role === 'address_point');
  assert.ok(postalGeometry);
  assert.ok(addressPoint);

  // This aligned rectangle occupies exactly 64 x 64 = 4,096 postal index cells.
  const amplifiedGeometry: PostalContextGeometryFeature['geometry'] = {
    type: 'Polygon',
    coordinates: [[
      [130, 30],
      [136.3, 30],
      [136.3, 36.3],
      [130, 36.3],
      [130, 30],
    ]],
  };
  const amplifiedPostalCount = Math.floor(
    (POSTAL_CONTEXT_RUNTIME_INDEX_LIMITS.postings - 2)
      / POSTAL_CONTEXT_RUNTIME_INDEX_LIMITS.cellsPerFeature,
  );
  for (let index = 0; index < amplifiedPostalCount; index += 1) {
    (pack.geometry.features as PostalContextGeometryFeature[]).push({
      ...structuredClone(postalGeometry),
      id: `geometry-postal-index-amplification-${index}`,
      geometry: amplifiedGeometry,
    });
  }

  // The original postal polygon and address point each consume one posting.
  // These copies cross the limit only while the second (address) index builds,
  // proving that both indexes consume one shared construction budget.
  const addressPointCopies = POSTAL_CONTEXT_RUNTIME_INDEX_LIMITS.postings
    - amplifiedPostalCount * POSTAL_CONTEXT_RUNTIME_INDEX_LIMITS.cellsPerFeature
    - 2
    + 1;
  for (let index = 0; index < addressPointCopies; index += 1) {
    (pack.geometry.features as PostalContextGeometryFeature[]).push({
      ...structuredClone(addressPoint),
      id: `geometry-address-index-amplification-${index}`,
    });
  }

  assert.equal(validatePostalContextRuntimePack(pack).valid, true);
  assert.throws(
    () => new PostalContextPackRuntime(pack),
    /spatial-index-posting-limit-exceeded/u,
  );
});

test('postal effectiveness and resolution graph scans fail closed at their shared budgets', () => {
  const lookupPack = structuredClone(createPostalContextRuntimeTestPack());
  const postalGeometry = lookupPack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.ok(postalGeometry);
  postalGeometry.validTime = { from: '2024-01-01T00:00:00.000Z', to: '2025-01-01T00:00:00.000Z' };
  for (const assertion of lookupPack.graph.assertions) {
    if (assertion.fromNodeId === 'postal-jp-syn-0000001'
      || assertion.toNodeId === 'postal-jp-syn-0000001') {
      assertion.quality.status = 'candidate';
    }
  }
  const incomingTemplate = lookupPack.graph.assertions.find(
    assertion => assertion.id === 'a-premise-postal',
  );
  assert.ok(incomingTemplate);
  for (let index = 0; index <= 2_048; index += 1) {
    (lookupPack.graph.assertions as PostalContextAssertion[]).push({
      ...structuredClone(incomingTemplate),
      id: `a-expired-postal-incoming-${index}`,
      quality: { ...incomingTemplate.quality, status: 'verified' },
      validTime: { from: '2024-01-01T00:00:00.000Z', to: '2025-01-01T00:00:00.000Z' },
    });
  }
  const lookup = new PostalContextPackRuntime(lookupPack).lookupPostalCode(
    '0000001',
    POSTAL_CONTEXT_TEST_INSTANT,
  );
  assert.equal(lookup.status, 'invalid');
  assert.deepEqual(lookup.errors, ['postal-effectiveness-limit-exceeded']);

  const resolutionPack = structuredClone(createPostalContextRuntimeTestPack());
  const contextTemplate = resolutionPack.graph.assertions.find(
    assertion => assertion.id === 'a-premise-locality',
  );
  assert.ok(contextTemplate);
  for (let index = 0; index <= 2_048; index += 1) {
    (resolutionPack.graph.assertions as PostalContextAssertion[]).push({
      ...structuredClone(contextTemplate),
      id: `a-address-point-fanout-${index}`,
      fromNodeId: 'address-point-synthetic',
    });
  }
  const resolution = new PostalContextPackRuntime(resolutionPack).resolvePublicCoordinate({
    ...POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: POSTAL_CONTEXT_TEST_INSTANT,
  });
  assert.equal(resolution.status, 'invalid');
  assert.deepEqual(resolution.errors, ['resolution-subgraph-limit-exceeded']);
});

test('runtime validation rejects private nodes and missing source-authorized radius', () => {
  const privatePack = structuredClone(createPostalContextRuntimeTestPack());
  privatePack.graph.nodes[0].visibility = 'private';
  assert.equal(validatePostalContextRuntimePack(privatePack).valid, false);

  const radiusPack = structuredClone(createPostalContextRuntimeTestPack());
  const point = radiusPack.geometry.features.find(feature => feature.role === 'address_point');
  assert.ok(point);
  delete point.matchRadiusMeters;
  const validation = validatePostalContextRuntimePack(radiusPack);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some(error => error.includes('address-point-match-radius-required')));
});

test('total pack parser returns errors for malformed and self-intersecting external JSON', () => {
  const malformed = parsePostalContextRuntimePack({ schemaVersion: 'bad' });
  assert.equal(malformed.ok, false);
  assert.ok(malformed.errors.length > 0);

  const bowTie = structuredClone(createPostalContextRuntimeTestPack());
  const postal = bowTie.geometry.features.find(feature => feature.role === 'postal_area');
  assert.ok(postal && postal.geometry.type === 'Polygon');
  postal.geometry.coordinates = [[
    [139.74, 35.67],
    [139.76, 35.69],
    [139.76, 35.67],
    [139.74, 35.69],
    [139.74, 35.67],
  ]];
  const parsed = parsePostalContextRuntimePack(bowTie, 'JP');
  assert.equal(parsed.ok, false);
  assert.ok(parsed.errors.some(error => error.includes('self-intersection') || error.includes('zero-area')));

  const unknownField = structuredClone(createPostalContextRuntimeTestPack());
  (unknownField.geometry.features[0] as unknown as Record<string, unknown>)
    .privateResidentialUnit = 'must-not-enter-public-pack';
  const unknownParsed = parsePostalContextRuntimePack(unknownField, 'JP');
  assert.equal(unknownParsed.ok, false);
  assert.ok(unknownParsed.errors.some(error =>
    error.includes('privateResidentialUnit:unknown-field')));
});
