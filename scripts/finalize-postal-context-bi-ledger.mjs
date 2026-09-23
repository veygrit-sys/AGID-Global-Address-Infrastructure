import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const ledgerPath = 'docs/postal-context-m2-rollout.json';
const evidenceCommit = '2e0e36ef16608ebc8f935ed878db50a4b4764c0f';
const observedAt = '2026-09-02T20:51:29.765Z';
const completedAt = '2026-09-02T21:35:00.000Z';
const retryAfter = '2026-12-02T20:51:29.765Z';
const sourceReport = 'reports/postal-context-m2/bi-source-review-2026-09-03.json';
const engineeringReport = 'reports/postal-context-m2/bi-checks-2026-09-03.json';
const countryReport = 'docs/postal-context-burundi-m2.md';
const manifestPath = 'data/postal_country_packs/bi/postal-context/repository-manifest.json';
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
if (!stage) throw new Error('missing-bi-m2-definition');
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const index = ledger.countries.findIndex(item => item.countryCode === 'BI');
if (index < 0) throw new Error('missing-bi-ledger-entry');
const previous = ledger.countries[index];
if (!(previous.status === 'pending' && previous.attempts === 0)) throw new Error('unexpected-bi-ledger-state');
const artifactPaths = [
  manifestPath,
  'data/postal_country_packs/bi/postal-context/source-profile.json',
  'data/postal_country_packs/bi/postal-context/README.md',
  'src/data/address_formats/africa/eastern_africa/BI.json',
  'src/data/address_formats/africa/eastern_africa/BI.yaml',
  'src/data/address_hierarchy/africa.json',
  'src/data/africaOpenGeoSources.ts',
  'src/lib/officialPostalSourceCatalog.ts',
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
    result: 'blocked-no-current-postcode-system-and-no-postal-area-artifact',
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
    nextAction: 'Continue the pending-country sweep to BJ. Re-check BI only after the deadline or an official RNP, Burundi Government or UPU postcode-system announcement.',
  },
  blocker: {
    kind: 'no-current-postcode-system-and-no-postal-area-artifact',
    reason: 'The UPU Universal DataBase Sep. 2025 list updated 20 August 2026 includes Burundi among countries which do not require postal codes. The current November 2025 UPU Burundi sheet identifies RNP and uses BP, commune and province without postcode. RNP confirms postal-box/home-delivery services but no postcode assignment denominator. The unrelated poste.bi four-digit claim was rejected because no competent-authority link or authoritative assignment release was established. No authoritative postal Polygon/MultiPolygon exists, reviewed rights do not authorize a postal dataset, the real BI API returned 404 unsupported, and no BI postal overlay was rendered. Province, commune, locality, office, route, box, Point, buffer, cell, AGID or synthetic planning geometry was not promoted.',
    observedAt,
    retryAfter,
    requiresExplicitApproval: false,
    retryPolicy: 'Finish all pending countries before this timed review. Do not contact a provider or authority, request data, register, authenticate, accept terms, licence, permission or contract, pay, access protected data, create a destination, publish or deploy without explicit approval.',
    unblockCondition: 'RNP or another competent authority introduces and publishes a current complete immutable postcode assignment, alias, validity, correction, exception and explicit area/non-area denominator with compatible AGID processing, storage, derivation, redistribution and public-serving rights; reconcile real eligible Polygon/MultiPolygon geometry and verify the production BI API/app/browser normalization, state handling, fit, translucent fill/outline, metadata, clear and re-search path.',
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
      upuEdition: 'Universal DataBase Sep. 2025; updated 20 Aug. 2026',
      upuListsBurundiAsNotRequiringPostalCodes: true,
      currentUpuBurundiAddressSheetEdition: '11/2025',
      currentUpuAddressSheetUsesBpCommuneProvinceWithoutPostcode: true,
      postalBoxIsNonPostcodeObject: true,
      unverifiedFourDigitCodeWebsitePromoted: false,
      addressMetadataUpdatedToCurrentUpuLineStructure: true,
      exactBodiesByteAndSha256Bound: 5,
      exactOfficialBodiesBytes: 1060734,
      currentCompletePostalCodeAssignmentsValidated: 0,
      currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished: false,
      upuCopyrightAndDatabaseRestrictionsRecorded: true,
      openPostalDatasetLicencePublishedOnReviewedBodies: false,
      compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished: false,
      providerContactRegistrationAuthenticationContractAcceptancePaymentOrProtectedAccessAttempted: false,
      officialPostalPolygonOrMultiPolygonRecords: 0,
      derivedOrVirtualPostalPolygonOrMultiPolygonRecords: 0,
      countryProvinceCommuneLocalityOfficeRouteServiceAreaPostalBoxProxiesPromoted: 0,
      pointBuffers: 0,
      convexOrConcaveHulls: 0,
      voronoiOrRasterCells: 0,
      agidCellsPromoted: 0,
      syntheticBiPlanningCellsAvailable: 218,
      syntheticBiPlanningCellsPromoted: 0,
      syntheticBiCodeSeedsPromoted: 0,
      syntheticFixturePromoted: false,
      productionEligibleRecords: 0,
      draftPackOfficialStatus: 'draft',
      draftLocalities: 48,
      draftBoundaries: 12,
      draftTestVectors: 3,
      sharedAppAreaPathVerified: true,
      appStarted: true,
      appHttpStatus: 200,
      realBiAgidPostalApiStatus: 404,
      realBiAgidPostalApiMessage: 'Postal Context country is not supported',
      realBiAgidPostalApiVerified: false,
      realBiAgidAppAreaVisualizationVerified: false,
      nonPostalAddressContextObserved: true,
      nonPostalAgidIdExample: 'BI0371Z5KS11',
      nonPostalAgidIdPromotedToPostalId: false,
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
console.log(JSON.stringify({ countryCode: 'BI', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length }, null, 2));
