import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const ledgerPath = 'docs/postal-context-m2-rollout.json';
const evidenceCommit = '6ab280746cca991550d56502d01618a2c74dd7be';
const observedAt = '2026-09-02T23:56:03.144Z';
const completedAt = '2026-09-03T00:20:00.000Z';
const retryAfter = '2026-12-02T23:56:03.144Z';
const sourceReport = 'reports/postal-context-m2/cf-source-review-2026-09-03.json';
const engineeringReport = 'reports/postal-context-m2/cf-checks-2026-09-03.json';
const countryReport = 'docs/postal-context-central-african-republic-m2.md';
const manifestPath = 'data/postal_country_packs/cf/postal-context/repository-manifest.json';
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
if (!stage) throw new Error('missing-cf-m2-definition');
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const index = ledger.countries.findIndex(item => item.countryCode === 'CF');
if (index < 0) throw new Error('missing-cf-ledger-entry');
const previous = ledger.countries[index];
if (!(previous.status === 'pending' && previous.attempts === 0)) throw new Error('unexpected-cf-ledger-state');
const artifactPaths = [
  manifestPath,
  'data/postal_country_packs/cf/postal-context/source-profile.json',
  'data/postal_country_packs/cf/postal-context/README.md',
  'src/data/address_formats/africa/central_africa/CF.json',
  'src/data/address_formats/africa/central_africa/CF.yaml',
  'src/data/address_hierarchy/africa.json',
  'src/data/africaOpenGeoSources.ts',
  'src/data/centralAfricanRepublicOpenGeoSources.test.ts',
  'src/lib/officialPostalSourceCatalog.ts',
  'src/lib/postalContextCentralAfricanRepublicQuality.ts',
  'src/lib/postalContextCentralAfricanRepublicQuality.test.ts',
  'scripts/inspect-postal-context-cf-sources.py',
  'scripts/inspect-postal-context-cf-sources.test.py',
  'scripts/postal-context-cf-address-metadata.test.mjs',
  'scripts/verify-postal-context-cf-browser.mjs',
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
    nextAction: 'Continue the pending-country sweep to CG. Re-check CF only after the deadline or a competent-authority postcode-system release.',
  },
  blocker: {
    kind: 'no-current-postcode-system',
    reason: 'The current UPU no-postcode list explicitly includes Central African Rep.; the UPU CF sheet and current ARCEP contact use BP plus Bangui without a postcode. BP, localities, offices, roads, administrative shapes, OSM features, model output, draft planning cells and AGID cells are not postal assignments or areas. The real CF API returned 404 unsupported and no translucent postal overlay rendered.',
    observedAt,
    retryAfter,
    requiresExplicitApproval: false,
    retryPolicy: 'Finish all pending countries before this timed review. Do not contact a provider or authority, request data, register, authenticate, accept terms, licence, permission or contract, pay, access protected data, create a destination, publish or deploy without explicit approval.',
    unblockCondition: 'A competent authority introduces a current CF postcode system and publishes a complete immutable assignment denominator and exact valid Polygon/MultiPolygon geometry under compatible AGID rights; then verify the real CF API/app/browser normalization, states, fit, translucent fill/outline, metadata, clear and re-search path.',
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
      upuNoPostcodeListEdition: 'Universal DataBase Sep. 2025; file updated 20 Aug. 2026',
      upuAddressingEdition: '03/2022',
      upuAddressExamples: ['BP 729 / BANGUI', 'BP 655 / BANGUI'],
      arcepCurrentContact: 'B.P. 1046 Bangui',
      bpClass: 'po-box-delivery-object-not-postcode',
      currentCompletePostalCodeAssignmentsValidated: 0,
      exactBodiesByteAndSha256Bound: 4,
      exactOfficialReferenceBytes: 845353,
      upuCopyrightAndDatabaseRestrictionsRecorded: true,
      arcepAllRightsReservedRecorded: true,
      openPostalDatasetLicencePublished: false,
      compatibleAgidPostalProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished: false,
      providerContactRegistrationAuthenticationContractTermsOrPaymentAttempted: false,
      qualityGateImplemented: true,
      postcodeLikeDigitsRejected: true,
      bpObjectsRejectedAsPostcodes: true,
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
      realCfAgidPostalApiStatus: 404,
      realCfAgidPostalApiMessage: 'Postal Context country is not supported',
      realCfAgidAppAreaVisualizationVerified: false,
      nonPostalAddressContextObserved: true,
      nonPostalAgidIdExample: 'CF022WKY25JD',
      nonPostalAgidIdPromotedToPostalId: false,
      liveSearchSource: 'OSM / OpenStreetMap',
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
console.log(JSON.stringify({ countryCode: 'CF', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length }, null, 2));
