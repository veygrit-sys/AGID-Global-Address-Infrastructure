import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const ledgerPath = 'docs/postal-context-m2-rollout.json';
const evidenceCommit = 'f920b3595e4c8fb994790e69950faad3b5d52870';
const observedAt = '2026-09-03T03:31:06.887Z';
const completedAt = '2026-09-03T04:07:14.792Z';
const retryAfter = '2026-12-03T03:31:06.887Z';
const sourceReport = 'reports/postal-context-m2/dz-source-review-2026-09-03.json';
const engineeringReport = 'reports/postal-context-m2/dz-checks-2026-09-03.json';
const countryReport = 'docs/postal-context-algeria-m2.md';
const manifestPath = 'data/postal_country_packs/dz/postal-context/repository-manifest.json';
const digest = path => 'sha256:' + createHash('sha256').update(readFileSync(path)).digest('hex');
const artifact = path => {
  const bytes = execFileSync('git', ['show', `${evidenceCommit}:${path}`]);
  return { url: `https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure/blob/${evidenceCommit}/${path}`, digest: 'sha256:' + createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length };
};
const artifactPaths = [
  manifestPath,
  'data/postal_country_packs/dz/postal-context/source-profile.json',
  'data/postal_country_packs/dz/postal-context/m2-source-review.json',
  'src/data/address_formats/africa/northern_africa/DZ.json',
  'src/data/address_formats/africa/northern_africa/DZ.yaml',
  'src/data/address_hierarchy/africa.json',
  'src/data/africaOpenGeoSources.ts',
  'src/data/algeriaOpenGeoSources.test.ts',
  'src/lib/officialPostalSourceCatalog.ts',
  'src/lib/postalContextAlgeriaQuality.ts',
  'src/lib/postalContextAlgeriaQuality.test.ts',
  'src/lib/postalContextAlgeriaRepository.test.ts',
  'src/lib/postalContextAlgeriaRuntime.test.ts',
  'src/server/routes/postalContextAlgeriaRoutes.test.ts',
  'src/server/postalContextMultiCountryStore.test.ts',
  'scripts/inspect-postal-context-dz-sources.mjs',
  'scripts/verify-postal-context-dz-browser.mjs',
  sourceReport,
  engineeringReport,
  countryReport,
  'data/postal-context/research-catalog.json',
  'package.json',
  'docs/postal-context-algeria-runtime.md'
];

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const stage = manifest.promotion.stages.find(item => item.id === manifest.promotion.target_stage);
if (!stage) throw new Error('missing-dz-m2-definition');
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const index = ledger.countries.findIndex(item => item.countryCode === 'DZ');
if (index < 0) throw new Error('missing-dz-ledger-entry');
const previous = ledger.countries[index];
if (previous.status === 'blocked' && previous.blocker?.evidence?.evidenceCommit === evidenceCommit) process.exit(0);
if (!(previous.status === 'pending' && previous.attempts === 0)) throw new Error('unexpected-dz-ledger-state');

ledger.countries[index] = {
  ...previous,
  manifest: manifestPath,
  declaredStage: 'M1_metadata',
  m2Definition: { id: stage.id, definition: stage.definition },
  status: 'blocked',
  attempts: 1,
  lastAttempt: {
    observedAt, completedAt,
    result: 'blocked-no-complete-current-assignment-denominator-compatible-rights-or-postal-geometry',
    report: sourceReport, reportDigest: digest(sourceReport),
    engineeringReport, engineeringReportDigest: digest(engineeringReport),
    countryReport, countryReportDigest: digest(countryReport),
    currentPostalCodeFormat: '99999', postcodeDataCreationTarget: true,
    currentCompletePostalCodeAssignments: null, completeAssignmentDenominatorAvailable: false,
    officialOperatorExamplesObserved: 6, m2QualifiedRecords: 0,
    realApiStatus: 503, realAppPostalAreaVisualized: false,
    nextAction: 'Continue the pending-country sweep. Re-check DZ only after the deadline or a complete rights-cleared Algérie Poste assignment and postal-geometry release.'
  },
  blocker: {
    kind: 'assignment-denominator-rights-and-postal-geometry-unavailable',
    reason: 'UPU August 2026 confirms Algeria currently requires a numeric five-digit postcode and Decree 19-258 assigns code authority exclusively to Algérie Poste. Public fixed/mobile directory examples are observations, include non-area and blank-code objects, and do not establish a complete versioned assignment, alias, validity and exception denominator or bulk reuse rights. No exact rights-cleared postal Polygon/MultiPolygon exists. Administration, office/address points, mobile routes, P.O. boxes, organizations, OSM, models and AGID cells are not postal areas. The real DZ API returned 503 unavailable and no translucent postal overlay rendered.',
    observedAt, retryAfter, requiresExplicitApproval: false,
    retryPolicy: 'Finish all pending countries before this timed review. Do not contact a provider, request data, register, authenticate, accept terms, licence, NDA or contract, pay, access protected data, create a destination, publish or deploy without explicit approval.',
    unblockCondition: 'Algérie Poste or another competent authority publishes a complete current immutable five-digit assignment and explicit area/non-area denominator plus exact valid postal Polygon/MultiPolygon under rights compatible with AGID processing, storage, derivation, redistribution and public serving; then verify the real DZ API/app normalization, states, fit, translucent fill/outline, metadata, clear and re-search path.',
    evidence: {
      evidenceCommit, sourceReport, sourceReviewDigest: digest(sourceReport), engineeringReport, engineeringChecksDigest: digest(engineeringReport), countryReport, countryReportDigest: digest(countryReport),
      postcodeDataCreationTarget: true, currentPostalSystemConfirmed: true, currentPostalCodeFormat: '99999',
      upuAddressingEdition: '07/2002', upuCurrentTableEdition: 'Universal DataBase Aug. 2026', decreeEdition: 'Executive Decree 19-258, 2019-09-28',
      officialOperatorExamplesObserved: 6, operatorDirectoryContainsBlankCodeRows: true, currentCompleteAssignmentDenominatorAvailable: false, currentCompletePostalCodeAssignmentsValidated: 0,
      exactBodiesByteAndSha256Bound: 5, exactReferenceBytes: 1151046,
      providerContactRegistrationAuthenticationContractTermsOrPaymentAttempted: false,
      compatibleAgidPostalProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished: false,
      qualityGateImplemented: true, officialPostalPolygonOrMultiPolygonRecords: 0, derivedPostalPolygonOrMultiPolygonRecords: 0, virtualPostalPolygonOrMultiPolygonRecords: 0, productionEligibleRecords: 0,
      huggingFaceOrModelProductionIngested: false, pointRouteOfficeAdminPoBoxOrganizationBufferHullVoronoiRasterOsmModelOrAgidProxiesPromoted: 0,
      appStarted: true, appHttpStatus: 200, realDzAgidPostalApiStatus: 503, realDzAgidPostalApiMessage: 'Postal Context pack is unavailable', realDzAgidAppAreaVisualizationVerified: false,
      selectedCandidateEvidence: "Bureau d'Algérie Poste de l'USTHB; BP 32; Boulevard de l'Université; Bab Ezzouar; Algiers; 16111; OSM via Photon; high; ambiguous/needs-review",
      renderedDetailedAddressContextMoreSpecificThanPostcode: true, nonPostalAgidIdExample: 'DZ02A83TH4JX', nonPostalAgidIdPromotedToPostalId: false,
      inAppBrowserAttempted: true, inAppBrowserNavigated: false, deterministicPlaywrightFallbackRan: true, postalApiMocked: false,
      renderedMapCanvasCount: 2, postalAreaNoticeCount: 0, browserScreenshotBytes: 100479, browserScreenshotSha256: '5bcece7eaad1e3f5115870a2ddc09967575fe2fbb5eed9450173e481161031c0', browserE2eVerified: false, manualVisualInspection: false,
      exactBuildingIdentityAsserted: false, explicitRightsClearedAddressBuildingRelationRequired: true,
      approvedAgidRuntimeArtifacts: 0, rawSourceBodiesInGit: 0,
      artifacts: artifactPaths.map(artifact)
    }
  },
  evidence: null
};

writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
console.log(JSON.stringify({ countryCode: 'DZ', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length }, null, 2));
