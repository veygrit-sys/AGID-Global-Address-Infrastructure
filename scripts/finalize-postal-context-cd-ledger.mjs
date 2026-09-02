import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const ledgerPath = 'docs/postal-context-m2-rollout.json';
const evidenceCommit = '8906b8757d4cd7f59e4b38f8e91a3209ad225d02';
const observedAt = '2026-09-02T23:01:02.073Z';
const completedAt = '2026-09-02T23:31:00.000Z';
const retryAfter = '2026-12-02T23:01:02.073Z';
const sourceReport = 'reports/postal-context-m2/cd-source-review-2026-09-03.json';
const engineeringReport = 'reports/postal-context-m2/cd-checks-2026-09-03.json';
const countryReport = 'docs/postal-context-dr-congo-m2.md';
const manifestPath = 'data/postal_country_packs/cd/postal-context/repository-manifest.json';
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
if (!stage) throw new Error('missing-cd-m2-definition');
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const index = ledger.countries.findIndex(item => item.countryCode === 'CD');
if (index < 0) throw new Error('missing-cd-ledger-entry');
const previous = ledger.countries[index];
if (!(previous.status === 'pending' && previous.attempts === 0)) throw new Error('unexpected-cd-ledger-state');
const artifactPaths = [
  manifestPath,
  'data/postal_country_packs/cd/postal-context/source-profile.json',
  'data/postal_country_packs/cd/postal-context/README.md',
  'src/data/address_formats/africa/central_africa/CD.json',
  'src/data/address_formats/africa/central_africa/CD.yaml',
  'src/data/address_hierarchy/africa.json',
  'src/data/africaOpenGeoSources.ts',
  'src/data/drCongoOpenGeoSources.test.ts',
  'src/lib/officialPostalSourceCatalog.ts',
  'src/lib/postalContextDrCongoQuality.ts',
  'src/lib/postalContextDrCongoQuality.test.ts',
  'src/postal/postalForgePreparation.ts',
  'scripts/inspect-postal-context-cd-sources.py',
  'scripts/inspect-postal-context-cd-sources.test.py',
  'scripts/postal-context-cd-address-metadata.test.mjs',
  'scripts/verify-postal-context-cd-browser.mjs',
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
    result: 'blocked-no-rights-cleared-complete-assignments-or-postal-area-geometry',
    report: sourceReport,
    reportDigest: digest(sourceReport),
    engineeringReport,
    engineeringReportDigest: digest(engineeringReport),
    countryReport,
    countryReportDigest: digest(countryReport),
    currentPostalCodeFormat: 'NNNNNNN',
    postcodeDataCreationTarget: true,
    currentCompletePostalCodeAssignments: 0,
    validatedOfficialExamples: 2,
    m2QualifiedRecords: 0,
    realApiStatus: 404,
    realAppPostalAreaVisualized: false,
    nextAction: 'Continue the pending-country sweep to CF. Re-check CD only after the deadline or a complete rights-cleared competent-authority assignment and exact postal-area release.',
  },
  blocker: {
    kind: 'current-system-no-complete-rights-cleared-assignments-or-postal-area-geometry',
    reason: 'SCPT and UPU confirm a current seven-digit system and two source-qualified SCPT examples, but the reviewed public bodies do not provide a versioned complete national assignment denominator, compatible processing/derivation/redistribution/public-serving rights, or exact postal Polygon/MultiPolygon geometry. SCPT API rows have no geometry. Observed OSM results were a Point, a broader administrative MultiPolygon, or an unrelated health Polygon and were rejected. Hugging Face/libpostal material has no postal authority or geometry and was retained only as an unpromoted parser-evaluation candidate. The real CD API returned 404 unsupported and no translucent postal overlay rendered.',
    observedAt,
    retryAfter,
    requiresExplicitApproval: false,
    retryPolicy: 'Finish all pending countries before this timed review. Do not contact a provider or authority, request data, register, authenticate, accept terms, licence, permission or contract, pay, access protected data, create a destination, publish or deploy without explicit approval.',
    unblockCondition: 'SCPT or another competent authority publishes a current complete immutable seven-digit assignment with stable row identity, aliases, validity, corrections, exceptions and explicit area/non-area denominator under compatible AGID rights; reconcile exact valid Polygon/MultiPolygon geometry and verify the production CD API/app/browser normalization, states, fit, translucent fill/outline, metadata, clear and re-search path.',
    evidence: {
      evidenceCommit,
      sourceReport,
      sourceReviewDigest: digest(sourceReport),
      engineeringReport,
      engineeringChecksDigest: digest(engineeringReport),
      countryReport,
      countryReportDigest: digest(countryReport),
      dataCreationScope: 'blocked_current_postcode_system_no_redistributable_complete_assignments_or_area_geometry',
      postcodeDataCreationTarget: true,
      currentPostalSystemConfirmed: true,
      currentPostalCodeFormat: 'NNNNNNN',
      upuAddressingEdition: '09/2022',
      scptValidatedOfficialExamples: 2,
      scptExamplePostcodes: ['1004131', '3202011'],
      scptExampleRowIds: [175, 1160],
      currentCompletePostalCodeAssignmentsValidated: 0,
      completeVersionedNationalAssignmentDenominatorEstablished: false,
      scptPublicApiHasGeometry: false,
      exactBodiesByteAndSha256Bound: 17,
      exactOfficialReferenceBodies: 11,
      exactOfficialReferenceBytes: 4063260,
      exactCandidateBodies: 6,
      exactCandidateBytes: 330701,
      scptAllRightsReservedRecorded: true,
      upuCopyrightAndDatabaseRestrictionsRecorded: true,
      openPostalDatasetLicencePublished: false,
      compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished: false,
      providerContactRegistrationAuthenticationContractTermsOrPaymentAttempted: false,
      qualityGateImplemented: true,
      observedExactNeighbourhoodGeometry: 'Point',
      observedBroaderAdminGeometry: 'MultiPolygon',
      observedUnrelatedFeatureGeometry: 'Polygon',
      pointCandidatesRejected: true,
      broaderAdminCandidatesRejected: true,
      unrelatedFeatureCandidatesRejected: true,
      officialPostalPolygonOrMultiPolygonRecords: 0,
      derivedOrVirtualPostalPolygonOrMultiPolygonRecords: 0,
      pointRouteFacilityAdminBufferHullVoronoiRasterOrAgidProxiesPromoted: 0,
      productionEligibleRecords: 0,
      huggingFaceDataset: 'ellenhp/libpostal',
      huggingFaceRevision: '79e9bdd2145dcd2040e0bafea4596a49e0c2f70b',
      huggingFaceLicenceTagPresent: false,
      huggingFaceCdCoverageEstablished: false,
      huggingFaceGeometryAvailable: false,
      huggingFaceOrModelOutputPromoted: false,
      draftPackOfficialStatus: 'draft',
      draftLocalities: 48,
      draftBoundaries: 12,
      draftPlanningCells: 217,
      draftRouteEvidence: 55,
      draftQualityEvidence: 41,
      draftTestVectors: 3,
      syntheticDraftRecordsPromoted: 0,
      appStarted: true,
      appHttpStatus: 200,
      realCdAgidPostalApiStatus: 404,
      realCdAgidPostalApiMessage: 'Postal Context country is not supported',
      realCdAgidPostalApiVerified: false,
      realCdAgidAppAreaVisualizationVerified: false,
      nonPostalAddressContextObserved: true,
      nonPostalAgidIdExample: 'CD039MNVG8PJ',
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
console.log(JSON.stringify({ countryCode: 'CD', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length }, null, 2));
