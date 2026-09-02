import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const ledgerPath = 'docs/postal-context-m2-rollout.json';
const evidenceCommit = '0ea18839f88af144275f9636de0bdc3f6bac03de';
const observedAt = '2026-09-02T19:30:58.531Z';
const completedAt = '2026-09-02T19:55:00.000Z';
const retryAfter = '2026-12-02T19:30:58.531Z';
const sourceReport = 'reports/postal-context-m2/ao-source-review-2026-09-03.json';
const engineeringReport = 'reports/postal-context-m2/ao-checks-2026-09-03.json';
const countryReport = 'docs/postal-context-angola-m2.md';
const manifestPath = 'data/postal_country_packs/ao/postal-context/repository-manifest.json';
const digest = path => `sha256:${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
const publishedBytes = path => execFileSync('git', ['show', `${evidenceCommit}:${path.replaceAll('\\', '/')}`]);
const artifact = path => {
  const bytes = publishedBytes(path);
  return {
  url: `https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure/blob/${evidenceCommit}/${path.replaceAll('\\', '/')}`,
  digest: `sha256:${createHash('sha256').update(bytes).digest('hex')}`, bytes: bytes.length,
  };
};

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const stage = manifest.promotion.stages.find(item => item.id === manifest.promotion.target_stage);
if (!stage) throw new Error('missing-ao-m2-definition');
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const index = ledger.countries.findIndex(item => item.countryCode === 'AO');
if (index < 0) throw new Error('missing-ao-ledger-entry');
const previous = ledger.countries[index];
if (!((previous.status === 'pending' && previous.attempts === 0) || (previous.status === 'blocked' && previous.attempts === 1))) throw new Error('unexpected-ao-ledger-state');
const artifactPaths = [
  manifestPath,
  'data/postal_country_packs/ao/postal-context/source-profile.json',
  'data/postal_country_packs/ao/postal-context/README.md',
  'src/data/address_formats/africa/central_africa/AO.json',
  'src/data/address_hierarchy/africa.json',
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
    observedAt, completedAt,
    result: 'blocked-no-current-postcode-system-and-no-postal-area-artifact',
    report: sourceReport, reportDigest: digest(sourceReport),
    engineeringReport, engineeringReportDigest: digest(engineeringReport),
    countryReport, countryReportDigest: digest(countryReport),
    currentPostalCodeFormat: 'none', postcodeDataCreationTarget: false,
    currentCompletePostalCodeAssignments: 0, m2QualifiedRecords: 0,
    realApiStatus: 404, realAppPostalAreaVisualized: false,
    nextAction: 'Continue the pending-country sweep to BF. Re-check AO only after the deadline or an official Correios de Angola, INACOM or UPU postcode-system announcement.',
  },
  blocker: {
    kind: 'no-current-postcode-system-and-no-postal-area-artifact',
    reason: 'The UPU Universal DataBase Sep. 2025 list updated 20 August 2026 includes Angola among countries which do not require postal codes. Current Correios de Angola station/service pages and the UPU Angola sheet provide street/locality and postal-box context but no postcode assignment denominator. A postal box is not a postcode. No authoritative postal Polygon/MultiPolygon exists, reviewed rights do not authorize a postal dataset, the real AO API returned 404 unsupported, and no AO postal overlay was rendered. Country, province, municipality, locality, station, route, box, Point, buffer, cell, AGID or synthetic planning geometry was not promoted.',
    observedAt, retryAfter,
    requiresExplicitApproval: false,
    retryPolicy: 'Finish all pending countries before this timed review. Do not contact a provider or authority, request data, register, authenticate, accept terms, licence, permission or contract, pay, access protected data, create a destination, publish or deploy without explicit approval.',
    unblockCondition: 'Correios de Angola or another competent authority introduces and publishes a current complete immutable postcode assignment, alias, validity, correction, exception and explicit area/non-area denominator with compatible AGID processing, storage, derivation, redistribution and public-serving rights; reconcile real eligible Polygon/MultiPolygon geometry and verify the production AO API/app/browser normalization, state handling, fit, translucent fill/outline, metadata, clear and re-search path.',
    evidence: {
      evidenceCommit,
      sourceReport, sourceReviewDigest: digest(sourceReport),
      engineeringReport, engineeringChecksDigest: digest(engineeringReport),
      countryReport, countryReportDigest: digest(countryReport),
      dataCreationScope: 'excluded_no_current_postcode_system',
      postcodeDataCreationTarget: false,
      currentPostalSystemConfirmed: false,
      currentPostalCodeFormat: 'none',
      upuEdition: 'Universal DataBase Sep. 2025; updated 20 Aug. 2026',
      upuListsAngolaAsNotRequiringPostalCodes: true,
      postalBoxIsNonPostcodeObject: true,
      incorrectFourDigitMetadataCorrected: true,
      exactBodiesByteAndSha256Bound: 7,
      exactOfficialBodiesBytes: 1158228,
      currentCompletePostalCodeAssignmentsValidated: 0,
      currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished: false,
      upuCopyrightAndDatabaseRestrictionsRecorded: true,
      openPostalDatasetLicencePublishedOnReviewedBodies: false,
      compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished: false,
      providerContactRegistrationAuthenticationContractAcceptancePaymentOrProtectedAccessAttempted: false,
      officialPostalPolygonOrMultiPolygonRecords: 0,
      derivedOrVirtualPostalPolygonOrMultiPolygonRecords: 0,
      countryProvinceMunicipalityLocalityStationRouteServiceAreaPostalBoxProxiesPromoted: 0,
      pointBuffers: 0, convexOrConcaveHulls: 0, voronoiOrRasterCells: 0,
      agidCellsPromoted: 0, syntheticAoPlanningCellsAvailable: 245,
      syntheticAoPlanningCellsPromoted: 0, syntheticAoCodeSeedsPromoted: 0,
      syntheticFixturePromoted: false, productionEligibleRecords: 0,
      draftPackOfficialStatus: 'draft', draftLocalities: 48, draftBoundaries: 12, draftTestVectors: 3,
      sharedAppAreaPathVerified: true, appStarted: true, appHttpStatus: 200,
      realAoAgidPostalApiStatus: 404, realAoAgidPostalApiMessage: 'Postal Context country is not supported',
      realAoAgidPostalApiVerified: false, realAoAgidAppAreaVisualizationVerified: false,
      controlledNonPostalAddressContextObserved: true,
      controlledNonPostalAgidIdExample: 'AO0398FRV4ZN',
      controlledNonPostalAgidIdPromotedToPostalId: false,
      inAppBrowserAttempted: true, inAppBrowserNavigated: false,
      deterministicPlaywrightFallbackRan: true, postalApiMocked: false,
      renderedMapCanvasCount: 2, postalAreaNoticeCount: 0,
      browserE2eVerified: false, manualVisualInspection: false,
      approvedAgidRuntimeArtifacts: 0, rawSourceBodiesInGit: 0,
      artifacts: artifactPaths.map(artifact),
    },
  },
  evidence: null,
};

writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(JSON.stringify({ countryCode: 'AO', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length }, null, 2));
