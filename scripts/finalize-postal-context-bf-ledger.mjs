import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const ledgerPath = 'docs/postal-context-m2-rollout.json';
const evidenceCommit = '957a9787c401d88b4cf0c38c264141dccec72eca';
const observedAt = '2026-09-02T20:11:29.104Z';
const completedAt = '2026-09-02T20:50:00.000Z';
const retryAfter = '2026-12-02T20:11:29.104Z';
const sourceReport = 'reports/postal-context-m2/bf-source-review-2026-09-03.json';
const engineeringReport = 'reports/postal-context-m2/bf-checks-2026-09-03.json';
const countryReport = 'docs/postal-context-burkina-faso-m2.md';
const manifestPath = 'data/postal_country_packs/bf/postal-context/repository-manifest.json';
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
if (!stage) throw new Error('missing-bf-m2-definition');
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const index = ledger.countries.findIndex(item => item.countryCode === 'BF');
if (index < 0) throw new Error('missing-bf-ledger-entry');
const previous = ledger.countries[index];
if (!((previous.status === 'pending' && previous.attempts === 0) || (previous.status === 'blocked' && previous.attempts === 1))) {
  throw new Error('unexpected-bf-ledger-state');
}
const artifactPaths = [
  manifestPath,
  'data/postal_country_packs/bf/postal-context/source-profile.json',
  'data/postal_country_packs/bf/postal-context/README.md',
  'src/data/address_formats/africa/western_africa/BF.json',
  'src/data/address_formats/africa/western_africa/BF.yaml',
  'src/data/address_hierarchy/africa.json',
  'src/lib/officialPostalSourceCatalog.ts',
  sourceReport,
  engineeringReport,
  countryReport,
  'scripts/inspect-postal-context-bf-sources.py',
  'scripts/inspect-postal-context-bf-sources.test.py',
  'scripts/postal-context-bf-address-metadata.test.mjs',
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
    result: 'blocked-current-postcode-system-without-rights-cleared-complete-assignments-or-postal-geometry',
    report: sourceReport,
    reportDigest: digest(sourceReport),
    engineeringReport,
    engineeringReportDigest: digest(engineeringReport),
    countryReport,
    countryReportDigest: digest(countryReport),
    currentPostalCodeFormat: 'NNNNN',
    postcodeDataCreationTarget: true,
    currentCompletePostalCodeAssignments: 0,
    m2QualifiedRecords: 0,
    realApiStatus: 404,
    realAppPostalAreaVisualized: false,
    nextAction: 'Continue the pending-country sweep to BI. Re-check BF only after the deadline or a competent authority publishes rights-cleared complete assignments and real postal geometry.',
  },
  blocker: {
    kind: 'current-postcode-system-without-rights-cleared-complete-assignments-or-postal-geometry',
    reason: 'Current La Poste Burkina Faso reference search and the UPU BF addressing sheet confirm a five-digit system and typed commune, quartier and agency results, but not a complete immutable assignment/alias/validity/correction/exception/explicit area-or-non-area denominator under compatible rights. The reviewed La Poste page is all-rights-reserved, UPU materials restrict reproduction/database use, and no reviewed source publishes authoritative postal Polygon/MultiPolygon geometry. IGB administrative maps are not postal surfaces. The real BF API returned 404 unsupported and no BF postal overlay was rendered. Administrative units, live reference results, boxes, offices, points, buffers, cells, buildings and AGID IDs were not promoted.',
    observedAt,
    retryAfter,
    requiresExplicitApproval: false,
    retryPolicy: 'Finish all pending countries before this timed review. Do not contact a provider or authority, request data, bulk extract, register, authenticate, accept terms, licence, permission or contract, pay, access protected data, create a destination, publish or deploy without explicit approval.',
    unblockCondition: 'La Poste Burkina Faso or another competent authority publishes a current complete immutable assignment, object-type, alias, validity, correction, exception and explicit area/non-area denominator under rights compatible with AGID processing, storage, derivation, redistribution and public serving; reconcile real eligible Polygon/MultiPolygon geometry and verify the production BF API/app/browser normalization, state handling, fit, translucent fill/outline, metadata, clear and re-search path.',
    evidence: {
      evidenceCommit,
      sourceReport,
      sourceReviewDigest: digest(sourceReport),
      engineeringReport,
      engineeringChecksDigest: digest(engineeringReport),
      countryReport,
      countryReportDigest: digest(countryReport),
      dataCreationScope: 'included_current_postcode_system_blocked_rights_and_geometry',
      postcodeDataCreationTarget: true,
      currentPostalSystemConfirmed: true,
      currentPostalCodeFormat: 'NNNNN',
      representativeCommuneCode: '10000',
      representativeQuarterCode: '10010',
      communeQuarterAndAgencyObjectsKeptDistinct: true,
      postalBoxIsNonPostcodeObject: true,
      upuEdition: 'Burkina Faso addressing sheet 12/2021; Universal DataBase Sep. 2025 updated 20 Aug. 2026',
      upuListsBurkinaFasoAsNotRequiringPostalCodes: true,
      upuCaveatDoesNotNegateCurrentOperatorSystem: true,
      exactBodiesByteAndSha256Bound: 10,
      exactOfficialBodiesBytes: 1364535,
      currentCompletePostalCodeAssignmentsValidated: 0,
      currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitAreaNonAreaDenominatorEstablished: false,
      laPosteAllRightsReservedRecorded: true,
      upuCopyrightAndDatabaseRestrictionsRecorded: true,
      openPostalDatasetLicencePublishedOnReviewedBodies: false,
      compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished: false,
      providerContactRegistrationAuthenticationContractAcceptancePaymentOrProtectedAccessAttempted: false,
      officialPostalPolygonOrMultiPolygonRecords: 0,
      derivedOrVirtualPostalPolygonOrMultiPolygonRecords: 0,
      countryRegionProvinceCommuneQuarterVillageAgencyBoxRoutePointOrBuildingProxiesPromoted: 0,
      pointBuffers: 0,
      convexOrConcaveHulls: 0,
      voronoiOrRasterCells: 0,
      agidCellsPromoted: 0,
      syntheticBfPlanningCellsAvailable: 218,
      syntheticBfPlanningCellsPromoted: 0,
      syntheticFixturePromoted: false,
      productionEligibleRecords: 0,
      draftPackOfficialStatus: 'draft',
      draftSources: 3,
      draftLocalities: 48,
      draftBoundaries: 12,
      draftRouteEvidence: 55,
      draftQualityEvidence: 41,
      draftTestVectors: 3,
      sharedAppAreaPathVerified: true,
      appStarted: true,
      appHttpStatus: 200,
      realBfAgidPostalApiStatus: 404,
      realBfAgidPostalApiMessage: 'Postal Context country is not supported',
      realBfAgidPostalApiVerified: false,
      realBfAgidAppAreaVisualizationVerified: false,
      controlledNonPostalAddressContextObserved: true,
      controlledNonPostalAgidIdExample: 'BF01RP0JZ6JW',
      controlledNonPostalAgidIdPromotedToPostalId: false,
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
console.log(JSON.stringify({ countryCode: 'BF', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length }, null, 2));
