import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const ledgerPath = 'docs/postal-context-m2-rollout.json';
const evidenceCommit = '195f06823f0cfac01c8bedbc1358a625badc7d34';
const observedAt = '2026-09-03T04:20:37.745Z';
const completedAt = '2026-09-03T05:03:58.322Z';
const retryAfter = '2026-12-03T04:20:37.745Z';
const sourceReport = 'reports/postal-context-m2/ea-source-review-2026-09-03.json';
const browserReport = 'reports/postal-context-m2/ea-browser-2026-09-03.json';
const engineeringReport = 'reports/postal-context-m2/ea-checks-2026-09-03.json';
const countryReport = 'docs/postal-context-ceuta-melilla-m2.md';
const manifestPath = 'data/postal_country_packs/ea/postal-context/repository-manifest.json';
const digest = path => 'sha256:' + createHash('sha256').update(readFileSync(path)).digest('hex');
const artifact = path => {
  const bytes = execFileSync('git', ['show', `${evidenceCommit}:${path}`]);
  return {
    url: `https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure/blob/${evidenceCommit}/${path}`,
    digest: 'sha256:' + createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.length,
  };
};
const artifactPaths = [
  manifestPath,
  'data/postal_country_packs/ea/postal-context/source-profile.json',
  'data/postal_country_packs/ea/postal-context/m2-source-review.json',
  'src/data/address_formats/europe/spanish_autonomous_regions/EA.json',
  'src/data/address_formats/europe/spanish_autonomous_regions/EA.yaml',
  'src/data/address_hierarchy/europe.json',
  'src/data/europeOpenGeoSources.ts',
  'src/lib/officialPostalSourceCatalog.ts',
  'src/lib/officialPostalSourceCatalog.test.ts',
  'src/lib/postalContextCountryPolicy.ts',
  'src/lib/postalContextCountryPolicy.test.ts',
  'src/lib/postalContextCeutaMelillaQuality.ts',
  'src/lib/postalContextCeutaMelillaQuality.test.ts',
  'src/lib/postalContextCeutaMelillaRepository.test.ts',
  'src/server/postalContextMultiCountryStore.test.ts',
  'src/server/routes/postalContextCeutaMelillaRoutes.test.ts',
  'scripts/inspect-postal-context-ea-sources.mjs',
  'scripts/verify-postal-context-ea-browser.mjs',
  sourceReport,
  browserReport,
  engineeringReport,
  countryReport,
  'package.json',
];

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const stage = manifest.promotion.stages.find(item => item.id === manifest.promotion.target_stage);
if (!stage) throw new Error('missing-ea-m2-definition');
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const index = ledger.countries.findIndex(item => item.countryCode === 'EA');
if (index < 0) throw new Error('missing-ea-ledger-entry');
const previous = ledger.countries[index];
if (previous.status === 'blocked' && previous.blocker?.evidence?.evidenceCommit === evidenceCommit) process.exit(0);
if (!(previous.status === 'pending' && previous.attempts === 0)) throw new Error('unexpected-ea-ledger-state');

ledger.countries[index] = {
  ...previous,
  manifest: manifestPath,
  declaredStage: 'M1_metadata',
  m2Definition: { id: stage.id, definition: stage.definition },
  status: 'blocked',
  attempts: 1,
  lastAttempt: {
    observedAt,
    completedAt,
    result: 'blocked-no-complete-current-assignment-denominator-compatible-rights-or-redistributable-postal-geometry',
    report: sourceReport,
    reportDigest: digest(sourceReport),
    browserReport,
    browserReportDigest: digest(browserReport),
    engineeringReport,
    engineeringReportDigest: digest(engineeringReport),
    countryReport,
    countryReportDigest: digest(countryReport),
    currentPostalCodeFormat: '51NNN/52NNN',
    postcodeDataCreationTarget: true,
    currentCompletePostalCodeAssignments: null,
    completeAssignmentDenominatorAvailable: false,
    officialViewPolygonSamplesObserved: 1,
    m2QualifiedRecords: 0,
    realApiStatus: 503,
    realAppPostalAreaVisualized: false,
    nextAction: 'Continue the pending-country sweep with EG. Re-check EA only after the deadline or a complete rights-cleared Correos assignment and exact postal-geometry release.',
  },
  blocker: {
    kind: 'assignment-denominator-rights-and-redistributable-postal-geometry-unavailable',
    reason: 'CartoCiudad confirms the current annual Correos postcode system and returned one real 51001 Polygon, but documents postcode surfaces as view-only and not downloadable. CNIG identifies Correos as the sole distributor, while Correos Data is commercial and restricts transfer, sublicensing and similar Internet postcode-finder use. No complete current finite 51xxx/52xxx assignment, alias, validity and exception denominator or AGID-compatible immutable geometry release exists. Ceuta and Melilla remain distinct source members; points, autonomous-city outlines, buffers, OSM, models and AGID cells are not postal surfaces. The real EA API returned 503 unavailable and no translucent postal overlay rendered.',
    observedAt,
    retryAfter,
    requiresExplicitApproval: false,
    retryPolicy: 'Finish all pending countries before this timed review. Do not contact a provider, request data, register, authenticate, accept terms, licence, NDA or contract, pay, access protected data, create a destination, publish or deploy without explicit approval.',
    unblockCondition: 'Correos, CNIG or another competent authority publishes a complete current immutable EA 51xxx/52xxx assignment and explicit area/non-area denominator plus exact valid same-code postal Polygon/MultiPolygon under rights compatible with AGID processing, storage, derivation, redistribution and public serving; then verify the real EA API/app normalization, states, fit, translucent fill/outline, metadata, clear and re-search path.',
    evidence: {
      evidenceCommit,
      sourceReport,
      sourceReviewDigest: digest(sourceReport),
      browserReport,
      browserCheckDigest: digest(browserReport),
      engineeringReport,
      engineeringChecksDigest: digest(engineeringReport),
      countryReport,
      countryReportDigest: digest(countryReport),
      postcodeDataCreationTarget: true,
      currentPostalSystemConfirmed: true,
      currentPostalCodeFormat: '51NNN/52NNN',
      sourceMembersPreserved: ['Ceuta', 'Melilla'],
      memberPrefixes: { Ceuta: '51', Melilla: '52' },
      sourceIdentityOrTerritoryMerged: false,
      currentCompleteAssignmentDenominatorAvailable: false,
      currentCompletePostalCodeAssignmentsValidated: 0,
      exactBodiesByteAndSha256Bound: 9,
      exactReferenceBytes: 514425,
      cartoCiudadWmsVersion: '1.3.0',
      cartoCiudadUpdateSequence: 3203,
      samplePostcode: '51001',
      sampleFeatureId: 'codigo-postal.510010000005',
      sampleGeometryType: 'Polygon',
      sampleRingCount: 1,
      samplePositionCount: 184,
      sampleClosed: true,
      sampleBbox: [-5.33371012, 35.88421039, -5.2965182, 35.89902507],
      sampleDatabaseTimestamp: '2026-01-13T13:14:47Z',
      sampleSourceDate: '20260112',
      officialViewPolygonOrMultiPolygonRecords: 1,
      officialProductionPostalPolygonOrMultiPolygonRecords: 0,
      derivedPostalPolygonOrMultiPolygonRecords: 0,
      virtualPostalPolygonOrMultiPolygonRecords: 0,
      productionEligibleRecords: 0,
      cartoCiudadSurfacesDocumentedViewOnly: true,
      cartoCiudadSurfacesDocumentedNotDownloadable: true,
      correosIdentifiedAsSoleDistributor: true,
      providerContactRegistrationAuthenticationContractTermsOrPaymentAttempted: false,
      compatibleAgidPostalProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished: false,
      qualityGateImplemented: true,
      huggingFaceOrModelProductionIngested: false,
      pointOfficeAdminBufferHullVoronoiRasterOsmModelOrAgidProxiesPromoted: 0,
      appStarted: true,
      appHttpStatus: 200,
      realEaAgidPostalApiStatus: 503,
      realEaAgidPostalApiMessage: 'Postal Context pack is unavailable',
      realEaAgidAppAreaVisualizationVerified: false,
      selectedCandidateEvidence: 'Ceuta Center; Paseo de Colón; Manzanera - Otero; Ceuta; España; OSM via Photon; high; ambiguous/needs-review',
      renderedDetailedAddressContextMoreSpecificThanPostcode: true,
      nonPostalAgidIdExample: 'EA01NSDT6T2S',
      nonPostalAgidIdPromotedToPostalId: false,
      inAppBrowserAttempted: true,
      inAppBrowserNavigated: false,
      deterministicPlaywrightFallbackRan: true,
      postalApiMocked: false,
      renderedMapCanvasCount: 2,
      postalAreaNoticeCount: 0,
      browserScreenshotBytes: 162389,
      browserScreenshotSha256: '450ec164d9aaf5b0a0cf1f91cad926ae1296a67acb8ac39b64bcea0529666981',
      browserE2eVerified: false,
      manualVisualInspection: false,
      exactBuildingIdentityAsserted: false,
      explicitRightsClearedAddressBuildingRelationRequired: true,
      approvedAgidRuntimeArtifacts: 0,
      rawSourceBodiesInGit: 0,
      artifacts: artifactPaths.map(artifact),
    },
  },
  evidence: null,
};

writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
console.log(JSON.stringify({ countryCode: 'EA', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length }, null, 2));
