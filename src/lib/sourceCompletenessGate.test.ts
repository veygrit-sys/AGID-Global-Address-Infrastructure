import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildOpenGeoSourceCompletenessSummary,
  buildSourceCompletenessInputFromOpenGeoRepository,
  buildScopedLayerClaimChecks,
  classifySourceEvidenceKinds,
  evaluateSourceCompletenessGate,
  SOURCE_COMPLETENESS_DIMENSIONS,
  type SourceCompletenessDimensionId,
} from './sourceCompletenessGate';

const requestedDimensions: SourceCompletenessDimensionId[] = [
  'official-gazetteer',
  'osm',
  'geonames',
  'wikidata',
  'administrative-divisions',
  'islands',
  'poi',
  'natural-features',
  'historical-aliases',
];

test('source completeness gate separates the requested evidence layers', () => {
  assert.deepEqual(SOURCE_COMPLETENESS_DIMENSIONS.map(dimension => dimension.id), requestedDimensions);
  assert.ok(SOURCE_COMPLETENESS_DIMENSIONS.every(dimension => dimension.requiredForGlobalClaim));
  assert.ok(SOURCE_COMPLETENESS_DIMENSIONS.every(dimension => dimension.nonClaim.length > 20));
});

test('source evidence classifier reads official authority from source descriptors', () => {
  const kinds = classifySourceEvidenceKinds([
    {
      id: 'official-national-gazetteer',
      name: 'National official place-name gazetteer',
      url: 'https://gov.example.test/gazetteer',
      role: 'gazetteer',
    },
  ]);

  assert.deepEqual(kinds, ['official', 'official-gazetteer']);
});

test('source evidence classifier recognizes open reference and admin-boundary descriptors', () => {
  const kinds = classifySourceEvidenceKinds([
    {
      id: 'open-reference-boundary-catalog',
      name: 'Synthetic open reference admin-boundary catalog',
      url: 'https://reference.example.test/admin-boundary',
      role: 'administrative boundary reference',
    },
  ]);

  assert.ok(kinds.includes('admin-boundary'));
  assert.ok(kinds.includes('open-reference'));
  assert.ok(!kinds.includes('official'));
  assert.ok(!kinds.includes('official-gazetteer'));
});

test('source evidence classifier keeps note-only official non-claims out of authority evidence', () => {
  const kinds = classifySourceEvidenceKinds([
    {
      id: 'wikidata-synthetic-alias-reference',
      name: 'Wikidata synthetic alias reference',
      url: 'https://wikidata.example.test/alias-regression',
      role: 'historical-alias-cross-reference',
      notes: ['Alias matching does not prove current official status.'],
    },
  ]);

  assert.ok(kinds.includes('wikidata'));
  assert.ok(kinds.includes('open-reference'));
  assert.ok(!kinds.includes('official'));
  assert.ok(!kinds.includes('official-gazetteer'));
});

test('source evidence classifier recognizes OSM GeoNames and Wikidata descriptors', () => {
  const kinds = classifySourceEvidenceKinds([
    {
      id: 'osm-cross-check',
      name: 'OpenStreetMap',
      url: 'https://www.openstreetmap.org/',
      role: 'cross-check',
    },
    {
      id: 'geonames-cross-check',
      name: 'GeoNames',
      url: 'https://www.geonames.org/',
      role: 'cross-check',
    },
    {
      id: 'wikidata-identity-source',
      name: 'Wikidata',
      url: 'https://www.wikidata.org/',
      role: 'identity-source',
    },
  ]);

  assert.deepEqual(kinds, ['osm', 'geonames', 'wikidata']);
});

test('source evidence classifier recognizes place-record geodata links without source descriptors', () => {
  const kinds = classifySourceEvidenceKinds([], [
    {
      agidPlaceId: 'agid:place:GEODATA-LINKS:synthetic',
      name: 'Synthetic Geodata Linked Place',
      featureClass: 'toponym',
      geodataLinks: {
        osm: 'https://osm.example.test/node/1',
        geonames: 'https://geonames.example.test/1',
        wikidata: 'https://wikidata.example.test/Q1',
      },
    },
  ]);

  assert.deepEqual(kinds, ['osm', 'geonames', 'wikidata']);
});

test('source evidence classifier recognizes explicit official place-record links only', () => {
  const officialKinds = classifySourceEvidenceKinds([], [
    {
      agidPlaceId: 'agid:place:OFFICIAL-LINK:synthetic',
      name: 'Synthetic Official Linked Place',
      featureClass: 'toponym',
      geodataLinks: {
        official: 'https://gov.example.test/synthetic-place',
      },
    },
  ]);
  const nearMissKinds = classifySourceEvidenceKinds([], [
    {
      agidPlaceId: 'agid:place:UNOFFICIAL-LINK:synthetic',
      name: 'Synthetic Unofficial Linked Place',
      featureClass: 'toponym',
      geodataLinks: {
        unofficial: 'https://gov.example.test/synthetic-place',
        officialCandidate: 'https://gov.example.test/synthetic-place-candidate',
      },
    },
  ]);

  assert.deepEqual(officialKinds, ['official']);
  assert.deepEqual(nearMissKinds, []);
});

test('source evidence classifier keeps open-reference evidence descriptor-scoped', () => {
  const descriptorKinds = classifySourceEvidenceKinds([
    {
      id: 'synthetic-open-reference',
      name: 'Synthetic OpenFactbook reference catalog',
      url: 'https://reference.example.test/catalog',
      role: 'reference',
    },
  ]);
  const noteOnlyKinds = classifySourceEvidenceKinds([
    {
      id: 'synthetic-note-only',
      name: 'Synthetic note-only catalog',
      role: 'poi-source',
      notes: ['Analyst note: reference review still pending.'],
    },
  ]);
  const placeRecordLinkKinds = classifySourceEvidenceKinds([], [
    {
      agidPlaceId: 'agid:place:REFERENCE-LINK:synthetic',
      name: 'Synthetic Reference Linked Place',
      featureClass: 'poi',
      geodataLinks: {
        reference: 'https://reference.example.test/place',
        wikipedia: 'https://wikipedia.example.test/place',
      },
      notes: ['Place-level reference link is metadata until promoted into source descriptors.'],
    },
  ]);

  assert.deepEqual(descriptorKinds, ['open-reference']);
  assert.deepEqual(noteOnlyKinds, []);
  assert.deepEqual(placeRecordLinkKinds, []);
});

test('scoped layer claim checks flag inconsistent global claim leaks', () => {
  const checks = buildScopedLayerClaimChecks([
    {
      repository: 'agid-open-synthetic-leaky-poi-report',
      globalAllPlaceNamesAllowed: true,
      missingForGlobalClaim: ['official-gazetteer'],
      results: [
        {
          dimension: 'poi',
          status: 'passing',
          evidenceKinds: ['osm'],
          observedRecords: 1,
          expectedRecords: null,
          reasons: [],
          nextGate: 'Synthetic inconsistent report fixture.',
        },
      ],
    },
  ]);
  const poiCheck = checks.find(check => check.dimension === 'poi');

  assert.equal(poiCheck?.assertion, 'layer-passing-global-claim-leak-detected');
  assert.equal(poiCheck?.passingRepositories, 1);
  assert.equal(poiCheck?.globalClaimAllowedRepositories, 1);
  assert.equal(poiCheck?.blockedGlobalClaimRepositories, 0);
  assert.deepEqual(poiCheck?.scopeLeakRepositories, ['agid-open-synthetic-leaky-poi-report']);
  assert.deepEqual(poiCheck?.sampleGlobalClaimAllowedRepositories, ['agid-open-synthetic-leaky-poi-report']);
});

test('a synthetic fully evidenced pack can pass every source completeness layer', () => {
  const report = evaluateSourceCompletenessGate({
    repository: 'agid-open-example-gazetteer',
    releaseGates: [
      'source-license-ledger-required',
      'geodata-link-required',
      'complete-1-island-coverage-required',
      'all-1-islands-source-linked',
      'admin-division-conformance-required',
      'no-poi-overclaim',
      'no-natural-feature-overclaim',
      'no-alias-overclaim',
    ],
    sources: [
      { id: 'official-gazetteer', name: 'National official gazetteer and municipality list', url: 'https://gov.example.test/gazetteer', role: 'gazetteer' },
      { id: 'osm', name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/', role: 'gazetteer' },
      { id: 'geonames', name: 'GeoNames', url: 'https://www.geonames.org/', role: 'gazetteer' },
      { id: 'wikidata', name: 'Wikidata', url: 'https://www.wikidata.org/', role: 'reference' },
    ],
    placeRecords: [
      {
        agidPlaceId: 'agid:place:EX:country',
        name: 'Exampleland',
        featureClass: 'country',
        localNames: { en: 'Exampleland', official: 'Republic of Exampleland', alternate: 'Old Exampleland' },
        geodataLinks: { official: 'https://gov.example.test/gazetteer', osm: 'https://osm.example.test/relation/1', geonames: 'https://geonames.example.test/1', wikidata: 'https://wikidata.example.test/Q1' },
      },
      { agidPlaceId: 'agid:place:EX:district', name: 'Example District', featureClass: 'district', geodataLinks: { official: 'https://gov.example.test/gazetteer', geonames: 'https://geonames.example.test/2' } },
      { agidPlaceId: 'agid:place:EX:island', name: 'Example Island', featureClass: 'island', geodataLinks: { official: 'https://gov.example.test/gazetteer', geonames: 'https://geonames.example.test/3' } },
      { agidPlaceId: 'agid:place:EX:port', name: 'Example Port', featureClass: 'poi', geodataLinks: { osm: 'https://osm.example.test/node/1', wikidata: 'https://wikidata.example.test/Q2' } },
      { agidPlaceId: 'agid:place:EX:river', name: 'Example River', featureClass: 'natural', geodataLinks: { geonames: 'https://geonames.example.test/4', wikidata: 'https://wikidata.example.test/Q3' } },
    ],
  }, new Date('2026-07-02T00:00:00Z'));

  assert.equal(report.globalAllPlaceNamesAllowed, true);
  assert.equal(report.summary.passing, requestedDimensions.length);
  assert.deepEqual(report.missingForGlobalClaim, []);
});

test('Kiribati all-island seed passes island/admin source gates but not full global coverage', () => {
  const input = buildSourceCompletenessInputFromOpenGeoRepository('data/open_geo_repositories/agid-open-ki-gazetteer');
  const report = evaluateSourceCompletenessGate(input, new Date('2026-07-02T00:00:00Z'));
  const rows = new Map(report.results.map(result => [result.dimension, result]));

  assert.equal(rows.get('official-gazetteer')?.status, 'passing');
  assert.equal(rows.get('osm')?.status, 'passing');
  assert.equal(rows.get('geonames')?.status, 'passing');
  assert.equal(rows.get('wikidata')?.status, 'passing');
  assert.equal(rows.get('administrative-divisions')?.status, 'passing');
  assert.equal(rows.get('islands')?.status, 'passing');
  assert.equal(rows.get('islands')?.observedRecords, 33);
  assert.equal(rows.get('islands')?.expectedRecords, 33);
  assert.equal(rows.get('poi')?.status, 'blocked');
  assert.equal(report.globalAllPlaceNamesAllowed, false);
  assert.ok(report.missingForGlobalClaim.includes('poi'));
});

test('synthetic POI source-scope fixture passes POI without implying global coverage', () => {
  const input = buildSourceCompletenessInputFromOpenGeoRepository('data/open_geo_repositories/agid-open-poi-source-scope-fixtures');
  const report = evaluateSourceCompletenessGate(input, new Date('2026-07-02T00:00:00Z'));
  const rows = new Map(report.results.map(result => [result.dimension, result]));
  const poi = rows.get('poi');

  assert.equal(input.sources.length, 2);
  assert.equal(input.placeRecords.length, 2);
  assert.equal(poi?.status, 'passing');
  assert.equal(poi?.observedRecords, 2);
  assert.ok(poi?.evidenceKinds.includes('osm'));
  assert.ok(poi?.evidenceKinds.includes('open-reference'));
  assert.equal(report.globalAllPlaceNamesAllowed, false);
  assert.ok(report.missingForGlobalClaim.includes('official-gazetteer'));
  assert.ok(report.missingForGlobalClaim.includes('natural-features'));
  assert.ok(report.nonClaims.some(nonClaim => /POI coverage is volatile/.test(nonClaim)));
});

test('synthetic natural-feature source-scope fixture passes natural features without implying global coverage', () => {
  const input = buildSourceCompletenessInputFromOpenGeoRepository('data/open_geo_repositories/agid-open-natural-feature-source-scope-fixtures');
  const report = evaluateSourceCompletenessGate(input, new Date('2026-07-02T00:00:00Z'));
  const rows = new Map(report.results.map(result => [result.dimension, result]));
  const naturalFeatures = rows.get('natural-features');

  assert.equal(input.sources.length, 3);
  assert.equal(input.placeRecords.length, 2);
  assert.equal(naturalFeatures?.status, 'passing');
  assert.equal(naturalFeatures?.observedRecords, 2);
  assert.ok(naturalFeatures?.evidenceKinds.includes('geonames'));
  assert.ok(naturalFeatures?.evidenceKinds.includes('osm'));
  assert.ok(naturalFeatures?.evidenceKinds.includes('open-reference'));
  assert.equal(report.globalAllPlaceNamesAllowed, false);
  assert.ok(report.missingForGlobalClaim.includes('official-gazetteer'));
  assert.ok(report.missingForGlobalClaim.includes('poi'));
  assert.ok(report.nonClaims.some(nonClaim => /Natural feature coverage/.test(nonClaim)));
});

test('synthetic historical-alias source-scope fixture passes aliases without implying global coverage', () => {
  const input = buildSourceCompletenessInputFromOpenGeoRepository('data/open_geo_repositories/agid-open-historical-alias-source-scope-fixtures');
  const report = evaluateSourceCompletenessGate(input, new Date('2026-07-02T00:00:00Z'));
  const rows = new Map(report.results.map(result => [result.dimension, result]));
  const historicalAliases = rows.get('historical-aliases');

  assert.equal(input.sources.length, 3);
  assert.equal(input.placeRecords.length, 2);
  assert.equal(historicalAliases?.status, 'passing');
  assert.equal(historicalAliases?.observedRecords, 2);
  assert.ok(historicalAliases?.evidenceKinds.includes('geonames'));
  assert.ok(historicalAliases?.evidenceKinds.includes('wikidata'));
  assert.ok(historicalAliases?.evidenceKinds.includes('open-reference'));
  assert.equal(report.globalAllPlaceNamesAllowed, false);
  assert.ok(report.missingForGlobalClaim.includes('official-gazetteer'));
  assert.ok(report.missingForGlobalClaim.includes('poi'));
  assert.ok(report.nonClaims.some(nonClaim => /Alias matching/.test(nonClaim)));
});

test('historical-alias non-claims mentioning official status do not count as official source evidence', () => {
  const report = evaluateSourceCompletenessGate({
    repository: 'agid-open-alias-official-wording-regression',
    releaseGates: [
      'source-license-ledger-required',
      'geodata-link-required',
      'no-alias-overclaim',
    ],
    sources: [
      {
        id: 'wikidata-synthetic-alias-reference',
        name: 'Wikidata synthetic alias reference',
        url: 'https://wikidata.example.test/alias-regression',
        role: 'historical-alias-cross-reference',
        notes: ['Alias matching does not prove current official status.'],
      },
      {
        id: 'geonames-synthetic-alias-reference',
        name: 'GeoNames synthetic alias reference',
        url: 'https://geonames.example.test/alias-regression',
        role: 'historical-alias-cross-reference',
      },
    ],
    placeRecords: [
      {
        agidPlaceId: 'agid:place:ALIAS-REGRESSION:synthetic',
        name: 'Synthetic Alias Regression',
        featureClass: 'toponym',
        localNames: { en: 'Synthetic Alias Regression', former: 'Synthetic Former Regression' },
        geodataLinks: {
          wikidata: 'https://wikidata.example.test/QALIASREGRESSION',
          geonames: 'https://geonames.example.test/alias-regression',
        },
      },
    ],
  }, new Date('2026-07-02T00:00:00Z'));
  const rows = new Map(report.results.map(result => [result.dimension, result]));
  const officialGazetteer = rows.get('official-gazetteer');
  const historicalAliases = rows.get('historical-aliases');

  assert.equal(historicalAliases?.status, 'passing');
  assert.equal(officialGazetteer?.status, 'blocked');
  assert.ok(!officialGazetteer?.evidenceKinds.includes('official'));
  assert.ok(!officialGazetteer?.evidenceKinds.includes('official-gazetteer'));
  assert.ok(report.missingForGlobalClaim.includes('official-gazetteer'));
});

test('open geo source completeness summary keeps global all-place-name claims blocked', () => {
  const summary = buildOpenGeoSourceCompletenessSummary();
  const scopedLayerChecks = new Map(summary.claimBoundary.scopedLayerClaimChecks.map(check => [check.dimension, check]));
  const poiScopeCheck = scopedLayerChecks.get('poi');
  const naturalFeatureScopeCheck = scopedLayerChecks.get('natural-features');

  assert.ok(summary.repositoryCount >= 800);
  assert.equal(summary.globalAllPlaceNamesAllowedCount, 0);
  assert.equal(summary.claimBoundary.verdict, 'global-all-place-name-claim-blocked');
  assert.equal(summary.claimBoundary.globalAllPlaceNamesAllowed, false);
  assert.equal(summary.claimBoundary.blockedClaim, 'global-all-place-name-completeness');
  assert.match(summary.claimBoundary.allowedClaim, /explicitly named repositories/);
  assert.deepEqual(summary.claimBoundary.requiredPassingDimensions, requestedDimensions);
  assert.ok(summary.claimBoundary.blockedDimensions.includes('poi'));
  assert.ok(summary.claimBoundary.blockedDimensions.includes('natural-features'));
  assert.ok(summary.claimBoundary.blockedDimensions.includes('historical-aliases'));
  assert.equal(summary.claimBoundary.layerPassingScopeInvariant, true);
  assert.equal(poiScopeCheck?.assertion, 'layer-passing-remains-scoped-unless-all-required-layers-pass');
  assert.equal(poiScopeCheck?.scopeLeakRepositories.length, 0);
  assert.equal(poiScopeCheck?.globalClaimAllowedRepositories, 0);
  assert.equal(poiScopeCheck?.blockedGlobalClaimRepositories, poiScopeCheck?.passingRepositories);
  assert.ok((poiScopeCheck?.sampleScopedRepositories.length ?? 0) > 0);
  assert.equal(naturalFeatureScopeCheck?.assertion, 'layer-passing-remains-scoped-unless-all-required-layers-pass');
  assert.equal(naturalFeatureScopeCheck?.scopeLeakRepositories.length, 0);
  assert.equal(naturalFeatureScopeCheck?.globalClaimAllowedRepositories, 0);
  assert.equal(naturalFeatureScopeCheck?.blockedGlobalClaimRepositories, naturalFeatureScopeCheck?.passingRepositories);
  assert.ok((naturalFeatureScopeCheck?.sampleScopedRepositories.length ?? 0) > 0);
  assert.equal(summary.claimBoundary.nonClaimCount, requestedDimensions.length);
  assert.match(summary.claimBoundary.nextGate, /source completeness layers/);
  assert.ok(summary.byDimension['official-gazetteer'].passing > 0);
  assert.ok(summary.byDimension.poi.passing > 0);
  assert.ok(summary.byDimension.poi.blocked > 0);
  assert.ok(summary.byDimension['natural-features'].passing > 0);
  assert.ok(summary.byDimension['natural-features'].blocked > 0);
  assert.ok(summary.byDimension['historical-aliases'].passing > 0);
  assert.ok(summary.byDimension['historical-aliases'].blocked > 0);
});
