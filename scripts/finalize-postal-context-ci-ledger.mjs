import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const ledgerPath = 'docs/postal-context-m2-rollout.json';
const evidenceCommit = '056ad9b815ea9d8526e5cd6520642442c4af58f0';
const observedAt = '2026-09-03T00:54:33.850Z';
const completedAt = '2026-09-03T01:15:22.264Z';
const retryAfter = '2026-12-03T00:54:33.850Z';
const sourceReport = 'reports/postal-context-m2/ci-source-review-2026-09-03.json';
const engineeringReport = 'reports/postal-context-m2/ci-checks-2026-09-03.json';
const countryReport = 'docs/postal-context-cote-divoire-m2.md';
const manifestPath = 'data/postal_country_packs/ci/postal-context/repository-manifest.json';
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
if (!stage) throw new Error('missing-ci-m2-definition');
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const index = ledger.countries.findIndex(item => item.countryCode === 'CI');
if (index < 0) throw new Error('missing-ci-ledger-entry');
const previous = ledger.countries[index];
const artifactPaths = [
  manifestPath,
  'data/postal_country_packs/ci/postal-context/source-profile.json',
  'data/postal_country_packs/ci/postal-context/README.md',
  'data/postal-context/research-catalog.json',
  'src/data/address_formats/africa/western_africa/CI.json',
  'src/data/address_formats/africa/western_africa/CI.yaml',
  'src/data/address_hierarchy/africa.json',
  'src/data/africaOpenGeoSources.ts',
  'src/data/coteDIvoireOpenGeoSources.test.ts',
  'src/lib/officialPostalSourceCatalog.ts',
  'src/lib/postalContextCoteDIvoireQuality.ts',
  'src/lib/postalContextCoteDIvoireQuality.test.ts',
  'scripts/inspect-postal-context-ci-sources.py',
  'scripts/inspect-postal-context-ci-sources.test.py',
  'scripts/postal-context-ci-address-metadata.test.mjs',
  'scripts/verify-postal-context-ci-browser.mjs',
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
  console.log(
    JSON.stringify(
      { countryCode: 'CI', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length, alreadyFinalized: true },
      null,
      2,
    ),
  );
  process.exit(0);
}
if (!(previous.status === 'pending' && previous.attempts === 0)) throw new Error('unexpected-ci-ledger-state');

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
    nextAction: 'Continue the pending-country sweep to CM. Re-check CI only after the deadline or a competent-authority postcode-system release.',
  },
  blocker: {
    kind: 'no-current-postcode-system',
    reason: "The current UPU no-postcode list explicitly includes Côte d'Ivoire. The UPU CI sheet defines 06/17 as two-digit post-office codes, 104 as a home-delivery indicator for office 04 and BP as the P.O.-box delivery object; none is a national postcode or postal area. The false five-digit AGID metadata was removed. Offices, localities, roads, administrative shapes, foreign assignments, OSM features, model output, draft planning cells and AGID cells are not CI postal assignments or areas. The real CI API returned 404 unsupported and no translucent postal overlay rendered.",
    observedAt,
    retryAfter,
    requiresExplicitApproval: false,
    retryPolicy: 'Finish all pending countries before this timed review. Do not contact a provider or authority, request data, register, authenticate, accept terms, licence, permission or contract, pay, access protected data, create a destination, publish or deploy without explicit approval.',
    unblockCondition: 'A competent authority introduces a current CI postcode system and publishes a complete immutable assignment denominator and exact valid Polygon/MultiPolygon geometry under compatible AGID rights; then verify the real CI API/app/browser normalization, states, fit, translucent fill/outline, metadata, clear and re-search path.',
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
      falseFiveDigitAddressMetadataCorrected: true,
      jurisdictionIdentity: "ISO CI and Côte d'Ivoire retained without neighbouring-country imports",
      upuNoPostcodeListEdition: 'Universal DataBase Sep. 2025; file updated Aug. 2026',
      upuAddressingEdition: '09/2004',
      upuAddressExamples: ['06 B.P. 37 ABIDJAN 06', '17 B.P. 105 ABIDJAN 17'],
      twoDigitValuesClass: 'post-office-code-not-postcode',
      homeDelivery104Class: 'home-delivery-by-office-04-not-postcode',
      bpClass: 'po-box-delivery-object-not-postcode',
      currentCompletePostalCodeAssignmentsValidated: 0,
      exactBodiesByteAndSha256Bound: 3,
      exactOfficialReferenceBytes: 818237,
      upuCopyrightAndDatabaseRestrictionsRecorded: true,
      artciAllRightsReservedRecorded: true,
      artciDirectExactBodyRetrieved: false,
      openPostalDatasetLicencePublished: false,
      compatibleAgidPostalProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished: false,
      providerContactRegistrationAuthenticationContractTermsOrPaymentAttempted: false,
      qualityGateImplemented: true,
      arbitraryDigitsRejected: true,
      twoDigitOfficeCodesRejectedAsPostcodes: true,
      homeDeliveryIndicator104RejectedAsPostcode: true,
      bpObjectsRejectedAsPostcodes: true,
      foreignAssignmentsPromotedToCi: 0,
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
      realCiAgidPostalApiStatus: 404,
      realCiAgidPostalApiMessage: 'Postal Context country is not supported',
      realCiAgidAppAreaVisualizationVerified: false,
      nonPostalAddressContextObserved: true,
      detailedAddressContext: "Bibliothèque nationale de Côte d'Ivoire, Boulevard Carde, Le Plateau, Abidjan",
      detailedAddressContextNeedsReview: true,
      nonPostalAgidIdExample: 'CI01ZMYVT7E8',
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
console.log(JSON.stringify({ countryCode: 'CI', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length }, null, 2));
