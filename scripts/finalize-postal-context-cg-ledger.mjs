import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const ledgerPath = 'docs/postal-context-m2-rollout.json';
const evidenceCommit = '86aa16f539a2304a7b3b303f0b0b1d53a8761fd3';
const observedAt = '2026-09-03T00:24:33.589Z';
const completedAt = '2026-09-03T00:46:00.000Z';
const retryAfter = '2026-12-03T00:24:33.589Z';
const sourceReport = 'reports/postal-context-m2/cg-source-review-2026-09-03.json';
const engineeringReport = 'reports/postal-context-m2/cg-checks-2026-09-03.json';
const countryReport = 'docs/postal-context-congo-republic-m2.md';
const manifestPath = 'data/postal_country_packs/cg/postal-context/repository-manifest.json';
const digest = path => `sha256:${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
const publishedBytes = path => execFileSync('git', ['show', `${evidenceCommit}:${path.replaceAll('\\', '/')}`]);
const artifact = path => {
  const bytes = publishedBytes(path);
  return {
    url: `https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure/blob/${evidenceCommit}/${path.replaceAll('\\', '/')}`,
    digest: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
    bytes: bytes.length,
  };
};

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const stage = manifest.promotion.stages.find(item => item.id === manifest.promotion.target_stage);
if (!stage) throw new Error('missing-cg-m2-definition');
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const index = ledger.countries.findIndex(item => item.countryCode === 'CG');
if (index < 0) throw new Error('missing-cg-ledger-entry');
const previous = ledger.countries[index];
if (!(previous.status === 'pending' && previous.attempts === 0)) throw new Error('unexpected-cg-ledger-state');
const artifactPaths = [
  manifestPath,
  'data/postal_country_packs/cg/postal-context/source-profile.json',
  'data/postal_country_packs/cg/postal-context/README.md',
  'src/data/address_formats/africa/central_africa/CG.json',
  'src/data/address_formats/africa/central_africa/CG.yaml',
  'src/data/address_hierarchy/africa.json',
  'src/data/africaOpenGeoSources.ts',
  'src/data/congoRepublicOpenGeoSources.test.ts',
  'src/lib/officialPostalSourceCatalog.ts',
  'src/lib/postalContextCongoRepublicQuality.ts',
  'src/lib/postalContextCongoRepublicQuality.test.ts',
  'scripts/inspect-postal-context-cg-sources.py',
  'scripts/inspect-postal-context-cg-sources.test.py',
  'scripts/postal-context-cg-address-metadata.test.mjs',
  'scripts/verify-postal-context-cg-browser.mjs',
  sourceReport,
  engineeringReport,
  countryReport,
];

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
    result: 'excluded-no-current-postcode-system',
    report: sourceReport,
    reportDigest: digest(sourceReport),
    engineeringReport,
    engineeringReportDigest: digest(engineeringReport),
    countryReport,
    countryReportDigest: digest(countryReport),
    currentPostalCodeFormat: 'none',
    postcodeDataCreationTarget: false,
    currentCompletePostalCodeAssignments: 0,
    m2QualifiedRecords: 0,
    realApiStatus: 404,
    realAppPostalAreaVisualized: false,
    nextAction: 'Continue the pending-country sweep to CI. Re-check CG only after the deadline or a competent-authority postcode-system release.',
  },
  blocker: {
    kind: 'no-current-postcode-system',
    reason: 'The current UPU no-postcode list explicitly includes Congo (Rep.); the UPU CG sheet and current SOPECO location use Brazzaville addresses without a postcode. BP, localities, offices, roads, administrative shapes, CD/CF assignments, OSM features, model output, draft planning cells and AGID cells are not CG postal assignments or areas. The real CG API returned 404 unsupported and no translucent postal overlay rendered.',
    observedAt,
    retryAfter,
    requiresExplicitApproval: false,
    retryPolicy: 'Finish all pending countries before this timed review. Do not contact a provider or authority, request data, register, authenticate, accept terms, licence, permission or contract, pay, access protected data, create a destination, publish or deploy without explicit approval.',
    unblockCondition: 'A competent authority introduces a current CG postcode system and publishes a complete immutable assignment denominator and exact valid Polygon/MultiPolygon geometry under compatible AGID rights; then verify the real CG API/app/browser normalization, states, fit, translucent fill/outline, metadata, clear and re-search path.',
    evidence: {
      evidenceCommit,
      sourceReport,
      sourceReviewDigest: digest(sourceReport),
      engineeringReport,
      engineeringChecksDigest: digest(engineeringReport),
      countryReport,
      countryReportDigest: digest(countryReport),
      dataCreationScope: 'excluded_no_current_postcode_system',
      postcodeDataCreationTarget: false,
      currentPostalSystemConfirmed: false,
      currentPostalCodeFormat: 'none',
      jurisdictionIdentity: 'ISO CG retained separately from CD and CF',
      upuNoPostcodeListEdition: 'Universal DataBase Sep. 2025; file updated 20 Aug. 2026',
      upuAddressingEdition: '09/2004',
      upuAddressExamples: ['12, rue Kakamoueka / BRAZZAVILLE / CONGO (REP.)', 'BP 652 / BRAZZAVILLE'],
      sopecoCurrentLocation: '68 Boulevard Denis Sassou Nguesso, central Brazzaville, Congo',
      sopecoCurrentNetworkEstablishments: 39,
      bpClass: 'po-box-delivery-object-not-postcode',
      currentCompletePostalCodeAssignmentsValidated: 0,
      exactBodiesByteAndSha256Bound: 4,
      exactOfficialReferenceBytes: 848825,
      upuCopyrightAndDatabaseRestrictionsRecorded: true,
      sopecoAllRightsReservedRecorded: true,
      openPostalDatasetLicencePublished: false,
      compatibleAgidPostalProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished: false,
      providerContactRegistrationAuthenticationContractTermsOrPaymentAttempted: false,
      qualityGateImplemented: true,
      postcodeLikeDigitsRejected: true,
      bpObjectsRejectedAsPostcodes: true,
      cdOrCfAssignmentsPromotedToCg: 0,
      pointRouteOfficeAdminBufferHullVoronoiRasterOrAgidProxiesPromoted: 0,
      officialPostalPolygonOrMultiPolygonRecords: 0,
      derivedOrVirtualPostalPolygonOrMultiPolygonRecords: 0,
      productionEligibleRecords: 0,
      huggingFaceOrLibpostalProductionIngested: false,
      openStreetMapPromotedToPostalAssignmentOrArea: false,
      draftPackOfficialStatus: 'draft',
      draftLocalities: 48,
      draftBoundaries: 12,
      draftPlanningCells: 218,
      draftRouteEvidence: 55,
      draftQualityEvidence: 41,
      draftTestVectors: 3,
      syntheticDraftRecordsPromoted: 0,
      appStarted: true,
      appHttpStatus: 200,
      realCgAgidPostalApiStatus: 404,
      realCgAgidPostalApiMessage: 'Postal Context country is not supported',
      realCgAgidAppAreaVisualizationVerified: false,
      nonPostalAddressContextObserved: true,
      nonPostalAgidIdExample: 'CG039MN8CVH1',
      nonPostalAgidIdPromotedToPostalId: false,
      liveSearchSource: 'Photon',
      inAppBrowserAttempted: true,
      inAppBrowserNavigated: false,
      deterministicPlaywrightFallbackRan: true,
      postalApiMocked: false,
      renderedMapCanvasCount: 2,
      postalAreaNoticeCount: 0,
      browserE2eVerified: false,
      manualVisualInspection: false,
      approvedAgidRuntimeArtifacts: 0,
      rawSourceBodiesInGit: 0,
      artifacts: artifactPaths.map(artifact),
    },
  },
  evidence: null,
};

writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(JSON.stringify({ countryCode: 'CG', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length }, null, 2));
