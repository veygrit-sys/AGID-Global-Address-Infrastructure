import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const ledgerPath = 'docs/postal-context-m2-rollout.json';
const evidenceCommit = 'eb58aab927314109a0b0211f0a02e575f2b11489';
const observedAt = '2026-09-02T22:16:31.130Z';
const completedAt = '2026-09-02T22:42:19.921Z';
const retryAfter = '2026-12-02T22:16:31.130Z';
const sourceReport = 'reports/postal-context-m2/bw-source-review-2026-09-03.json';
const engineeringReport = 'reports/postal-context-m2/bw-checks-2026-09-03.json';
const countryReport = 'docs/postal-context-botswana-m2.md';
const manifestPath = 'data/postal_country_packs/bw/postal-context/repository-manifest.json';
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
if (!stage) throw new Error('missing-bw-m2-definition');
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const index = ledger.countries.findIndex(item => item.countryCode === 'BW');
if (index < 0) throw new Error('missing-bw-ledger-entry');
const previous = ledger.countries[index];
if (!(previous.status === 'pending' && previous.attempts === 0)) throw new Error('unexpected-bw-ledger-state');
const artifactPaths = [
  manifestPath,
  'data/postal_country_packs/bw/postal-context/source-profile.json',
  'data/postal_country_packs/bw/postal-context/README.md',
  'src/data/address_formats/africa/southern_africa/BW.json',
  'src/data/address_formats/africa/southern_africa/BW.yaml',
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
    nextAction: 'Continue the pending-country sweep to CD. Re-check BW only after the deadline or an official BotswanaPost, Botswana Government or UPU postcode-system announcement.',
  },
  blocker: {
    kind: 'no-current-postcode-system-and-no-postal-area-artifact',
    reason: 'The UPU Universal DataBase Sep. 2025 list updated 20 August 2026 includes Botswana among countries which do not require postal codes. The published UPU Botswana sheet uses P.O. Box or private bag plus locality without postcode; current BotswanaPost and Botswana Government pages likewise use P.O. Box or private bag and explicitly separate the government physical Plot address. The unsupported AA NNN repository claim was removed. No authoritative postal Polygon/MultiPolygon exists, reviewed rights do not authorize a postal dataset, the real BW API returned 404 unsupported, and no BW postal overlay was rendered. Country, district, ward, village, locality, post office, P.O. box, private bag, plot, street, route, Point, buffer, cell, AGID or synthetic planning geometry was not promoted.',
    observedAt,
    retryAfter,
    requiresExplicitApproval: false,
    retryPolicy: 'Finish all pending countries before this timed review. Do not contact a provider or authority, request data, register, authenticate, accept terms, licence, permission or contract, pay, access protected data, create a destination, publish or deploy without explicit approval.',
    unblockCondition: 'BotswanaPost or another competent authority introduces and publishes a current complete immutable postcode assignment, P.O.-box/private-bag distinction, alias, validity, correction, exception and explicit area/non-area denominator with compatible AGID processing, storage, derivation, redistribution and public-serving rights; reconcile real eligible Polygon/MultiPolygon geometry and verify the production BW API/app/browser normalization, state handling, fit, translucent fill/outline, metadata, clear and re-search path.',
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
      upuListsBotswanaAsNotRequiringPostalCodes: true,
      currentPublishedUpuBotswanaAddressSheetEdition: '09/2004',
      upuAddressSheetUsesPoBoxOrPrivateBagAndLocalityWithoutPostcode: true,
      currentBotswanaPostPageUsesPoBoxAndLocalityWithoutPostcode: true,
      governmentPageSeparatesPrivateBagPostalAddressFromPlotPhysicalAddress: true,
      postalBoxAndPrivateBagAreNonPostcodeObjects: true,
      priorAlpha2PlusThreeDigitRepositoryClaimPromoted: false,
      addressMetadataUpdatedToCurrentEvidence: true,
      exactBodiesByteAndSha256Bound: 5,
      exactOfficialBodiesBytes: 1102846,
      currentCompletePostalCodeAssignmentsValidated: 0,
      currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished: false,
      botswanaPostCopyrightRecorded: true,
      upuCopyrightAndDatabaseRestrictionsRecorded: true,
      openPostalDatasetLicencePublishedOnReviewedBodies: false,
      compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished: false,
      providerContactRegistrationAuthenticationContractAcceptancePaymentOrProtectedAccessAttempted: false,
      officialPostalPolygonOrMultiPolygonRecords: 0,
      derivedOrVirtualPostalPolygonOrMultiPolygonRecords: 0,
      countryDistrictWardVillageLocalityPostOfficeBoxPrivateBagPlotStreetRouteServiceAreaProxiesPromoted: 0,
      pointBuffers: 0,
      convexOrConcaveHulls: 0,
      voronoiOrRasterCells: 0,
      agidCellsPromoted: 0,
      syntheticBwPlanningCellsAvailable: 236,
      syntheticBwPlanningCellsPromoted: 0,
      syntheticBwCodeSeedsPromoted: 0,
      syntheticFixturePromoted: false,
      productionEligibleRecords: 0,
      draftPackOfficialStatus: 'draft',
      draftLocalities: 48,
      draftBoundaries: 12,
      draftTestVectors: 3,
      sharedAppAreaPathVerified: true,
      appStarted: true,
      appHttpStatus: 200,
      realBwAgidPostalApiStatus: 404,
      realBwAgidPostalApiMessage: 'Postal Context country is not supported',
      realBwAgidPostalApiVerified: false,
      realBwAgidAppAreaVisualizationVerified: false,
      nonPostalAddressContextObserved: true,
      nonPostalAgidIdExample: 'BW03TY8S4KWK',
      nonPostalAgidIdPromotedToPostalId: false,
      explicitBotswanaCandidateSelected: true,
      liveSearchSource: 'OSM/OpenStreetMap',
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
console.log(JSON.stringify({ countryCode: 'BW', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length }, null, 2));
