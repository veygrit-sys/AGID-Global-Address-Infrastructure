import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const ledgerPath = 'docs/postal-context-m2-rollout.json';
const evidenceCommit = '043b1f0f79222939821aca375bc4c75084cce949';
const observedAt = '2026-09-03T01:38:04.222Z';
const completedAt = '2026-09-03T01:59:56.115Z';
const retryAfter = '2026-12-03T01:38:04.222Z';
const sourceReport = 'reports/postal-context-m2/cm-source-review-2026-09-03.json';
const engineeringReport = 'reports/postal-context-m2/cm-checks-2026-09-03.json';
const countryReport = 'docs/postal-context-cameroon-m2.md';
const manifestPath = 'data/postal_country_packs/cm/postal-context/repository-manifest.json';
const digest = path => 'sha256:' + createHash('sha256').update(readFileSync(path)).digest('hex');
const publishedBytes = path => execFileSync('git', ['show', evidenceCommit + ':' + path.replaceAll('\\', '/')]);
const artifact = path => {
  const bytes = publishedBytes(path);
  return {
    url: 'https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure/blob/' + evidenceCommit + '/' + path.replaceAll('\\', '/'),
    digest: 'sha256:' + createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.length,
  };
};

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const stage = manifest.promotion.stages.find(item => item.id === manifest.promotion.target_stage);
if (!stage) throw new Error('missing-cm-m2-definition');
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const index = ledger.countries.findIndex(item => item.countryCode === 'CM');
if (index < 0) throw new Error('missing-cm-ledger-entry');
const previous = ledger.countries[index];
const artifactPaths = [
  manifestPath,
  'data/postal_country_packs/cm/postal-context/source-profile.json',
  'data/postal_country_packs/cm/postal-context/README.md',
  'data/postal-context/research-catalog.json',
  'src/data/address_formats/africa/central_africa/CM.json',
  'src/data/address_formats/africa/central_africa/CM.yaml',
  'src/data/address_hierarchy/africa.json',
  'src/data/africaOpenGeoSources.ts',
  'src/data/cameroonOpenGeoSources.test.ts',
  'src/lib/englishShippingAddress.ts',
  'src/lib/officialPostalSourceCatalog.ts',
  'src/lib/postalContextCameroonQuality.ts',
  'src/lib/postalContextCameroonQuality.test.ts',
  'scripts/inspect-postal-context-cm-sources.py',
  'scripts/inspect-postal-context-cm-sources.test.py',
  'scripts/postal-context-cm-address-metadata.test.mjs',
  'scripts/verify-postal-context-cm-browser.mjs',
  'package.json',
  sourceReport,
  engineeringReport,
  countryReport,
];
if (
  previous.status === 'blocked' &&
  previous.attempts === 1 &&
  previous.blocker?.evidence?.evidenceCommit === evidenceCommit
) {
  console.log(JSON.stringify({ countryCode: 'CM', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length, alreadyFinalized: true }, null, 2));
  process.exit(0);
}
if (!(previous.status === 'pending' && previous.attempts === 0)) throw new Error('unexpected-cm-ledger-state');

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
    nextAction: 'Continue the pending-country sweep to CV. Re-check CM only after the deadline or a competent-authority postcode-system release.',
  },
  blocker: {
    kind: 'no-current-postcode-system',
    reason: 'The current UPU no-postcode list explicitly includes Cameroon. The UPU CM sheet shows BP 6000 followed by YAOUNDE without a postcode; MINESUP labels 54190 and 1739 as BP/address-postale values. These are P.O.-box identifiers, not postcodes or postal areas. The false five-digit shipping metadata was corrected. Offices, localities, roads, administrative shapes, foreign assignments, OSM features, model output, draft planning cells and AGID cells are not CM postal assignments or areas. The real CM API returned 404 unsupported and no translucent postal overlay rendered.',
    observedAt,
    retryAfter,
    requiresExplicitApproval: false,
    retryPolicy: 'Finish all pending countries before this timed review. Do not contact a provider or authority, request data, register, authenticate, accept terms, licence, permission or contract, pay, access protected data, create a destination, publish or deploy without explicit approval.',
    unblockCondition: 'A competent authority introduces a current CM postcode system and publishes a complete immutable assignment denominator and exact valid Polygon/MultiPolygon geometry under compatible AGID rights; then verify the real CM API/app/browser normalization, states, fit, translucent fill/outline, metadata, clear and re-search path.',
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
      falseFiveDigitShippingMetadataCorrected: true,
      jurisdictionIdentity: 'ISO CM and Cameroon/Cameroun retained without neighbouring-country imports',
      upuNoPostcodeListEdition: 'Universal DataBase Sep. 2025; file updated Aug. 2026',
      upuAddressingEdition: '07/2002',
      upuAddressExample: 'BP 6000 / YAOUNDE',
      minesupBpAddressExamples: ['B.P. 54190', 'BP 1739 Yaoundé-Cameroun'],
      bpClass: 'po-box-delivery-object-not-postcode',
      currentCompletePostalCodeAssignmentsValidated: 0,
      exactBodiesByteAndSha256Bound: 5,
      exactOfficialReferenceBytes: 938084,
      upuCopyrightAndDatabaseRestrictionsRecorded: true,
      cameroonGovernmentAllRightsReservedRecorded: true,
      openPostalDatasetLicencePublished: false,
      compatibleAgidPostalProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished: false,
      providerContactRegistrationAuthenticationContractTermsOrPaymentAttempted: false,
      qualityGateImplemented: true,
      arbitraryDigitsRejected: true,
      bpAndNumericPoBoxRejectedAsPostcodes: true,
      foreignAssignmentsPromotedToCm: 0,
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
      realCmAgidPostalApiStatus: 404,
      realCmAgidPostalApiMessage: 'Postal Context country is not supported',
      realCmAgidAppAreaVisualizationVerified: false,
      nonPostalAddressContextObserved: true,
      detailedAddressContext: 'GCM3T yaounde Cameroon, Rue 7.082, Étoug-ébé, Yaoundé, Centre, Cameroun',
      detailedAddressContextNeedsReview: true,
      nonPostalAgidIdExample: 'CM0224YJ5QS9',
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

writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
console.log(JSON.stringify({ countryCode: 'CM', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length }, null, 2));
