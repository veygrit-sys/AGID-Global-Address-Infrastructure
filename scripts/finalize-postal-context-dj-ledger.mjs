import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const ledgerPath = 'docs/postal-context-m2-rollout.json';
const evidenceCommit = '39ad0f07441ba22e1f03ce034b4665c33f060274';
const observedAt = '2026-09-03T02:56:06.364Z';
const completedAt = '2026-09-03T03:25:00.000Z';
const retryAfter = '2026-12-03T02:56:06.364Z';
const sourceReport = 'reports/postal-context-m2/dj-source-review-2026-09-03.json';
const engineeringReport = 'reports/postal-context-m2/dj-checks-2026-09-03.json';
const countryReport = 'docs/postal-context-djibouti-m2.md';
const manifestPath = 'data/postal_country_packs/dj/postal-context/repository-manifest.json';
const digest = path => 'sha256:' + createHash('sha256').update(readFileSync(path)).digest('hex');
const artifact = path => {
  const bytes = execFileSync('git', ['show', `${evidenceCommit}:${path}`]);
  return { url: `https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure/blob/${evidenceCommit}/${path}`, digest: 'sha256:' + createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length };
};
const artifactPaths = [
  manifestPath,
  'data/postal_country_packs/dj/postal-context/source-profile.json',
  'data/postal_country_packs/dj/postal-context/m2-source-review.json',
  'src/data/address_formats/africa/eastern_africa/DJ.json',
  'src/data/address_formats/africa/eastern_africa/DJ.yaml',
  'src/data/address_hierarchy/africa.json',
  'src/data/africaOpenGeoSources.ts',
  'src/data/djiboutiOpenGeoSources.test.ts',
  'src/lib/officialPostalSourceCatalog.ts',
  'src/lib/postalContextDjiboutiQuality.ts',
  'src/lib/postalContextDjiboutiQuality.test.ts',
  'src/lib/postalContextDjiboutiRepository.test.ts',
  'scripts/inspect-postal-context-dj-sources.mjs',
  'scripts/postal-context-dj-address-metadata.test.mjs',
  'scripts/verify-postal-context-dj-browser.mjs',
  sourceReport,
  engineeringReport,
  countryReport,
  'data/postal-context/research-catalog.json',
  'package.json'
];
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const stage = manifest.promotion.stages.find(item => item.id === manifest.promotion.target_stage);
if (!stage) throw new Error('missing-dj-m2-definition');
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const index = ledger.countries.findIndex(item => item.countryCode === 'DJ');
if (index < 0) throw new Error('missing-dj-ledger-entry');
const previous = ledger.countries[index];
if (previous.status === 'blocked' && previous.blocker?.evidence?.evidenceCommit === evidenceCommit) process.exit(0);
if (!(previous.status === 'pending' && previous.attempts === 0)) throw new Error('unexpected-dj-ledger-state');
ledger.countries[index] = {
  ...previous,
  manifest: manifestPath,
  declaredStage: 'M1_metadata',
  m2Definition: { id: stage.id, definition: stage.definition },
  status: 'blocked',
  attempts: 1,
  lastAttempt: {
    observedAt, completedAt,
    result: 'blocked-no-complete-current-assignment-denominator-rights-or-postal-geometry',
    report: sourceReport, reportDigest: digest(sourceReport),
    engineeringReport, engineeringReportDigest: digest(engineeringReport),
    countryReport, countryReportDigest: digest(countryReport),
    currentPostalCodeFormat: '99999', postcodeDataCreationTarget: true,
    currentCompletePostalCodeAssignments: null, completeAssignmentDenominatorAvailable: false,
    datedPublicReferenceRows: 10, m2QualifiedRecords: 0,
    realApiStatus: 404, realAppPostalAreaVisualized: false,
    nextAction: 'Continue the pending-country sweep. Re-check DJ only after the deadline or a complete rights-cleared La Poste assignment and postal-geometry release.'
  },
  blocker: {
    kind: 'assignment-denominator-rights-and-postal-geometry-unavailable',
    reason: 'UPU 05/2020 publishes ten five-digit reference rows and the August 2026 table confirms current length, but no complete current assignment, alias, validity and exception denominator or compatible rights were found. The contractual UPU 2026.1 database was not accessed and its public Africa sample contains no Djibouti files. No exact postal Polygon/MultiPolygon exists; administration, office points, addresses, OSM, models and AGID cells are not postal areas. The real DJ API returned 404 unsupported and no translucent postal overlay rendered.',
    observedAt, retryAfter, requiresExplicitApproval: false,
    retryPolicy: 'Finish all pending countries before this timed review. Do not contact a provider, request data, register, authenticate, accept terms, licence, NDA or contract, pay, access protected data, create a destination, publish or deploy without explicit approval.',
    unblockCondition: 'La Poste de Djibouti or another competent authority publishes a complete current immutable five-digit assignment and explicit area/non-area denominator plus exact valid postal Polygon/MultiPolygon under rights compatible with AGID processing, storage, derivation, redistribution and public serving; then verify the real DJ API/app normalization, states, fit, translucent fill/outline, metadata, clear and re-search path.',
    evidence: {
      evidenceCommit, sourceReport, sourceReviewDigest: digest(sourceReport), engineeringReport, engineeringChecksDigest: digest(engineeringReport), countryReport, countryReportDigest: digest(countryReport),
      postcodeDataCreationTarget: true, currentPostalSystemConfirmed: true, currentPostalCodeFormat: '99999',
      upuAddressingEdition: '05/2020', upuCurrentTableEdition: 'Universal DataBase Aug. 2026',
      datedPublicReferenceRows: 10, currentCompleteAssignmentDenominatorAvailable: false, currentCompletePostalCodeAssignmentsValidated: 0,
      exactBodiesByteAndSha256Bound: 9, exactReferenceBytes: 8796563, publicAfricaSampleContainsDjibouti: false,
      providerContactRegistrationAuthenticationContractTermsOrPaymentAttempted: false,
      compatibleAgidPostalProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished: false,
      qualityGateImplemented: true, officialPostalPolygonOrMultiPolygonRecords: 0, derivedPostalPolygonOrMultiPolygonRecords: 0, virtualPostalPolygonOrMultiPolygonRecords: 0, productionEligibleRecords: 0,
      huggingFaceOrModelProductionIngested: false, pointRouteOfficeAdminBufferHullVoronoiRasterOsmModelOrAgidProxiesPromoted: 0,
      appStarted: true, appHttpStatus: 200, realDjAgidPostalApiStatus: 404, realDjAgidPostalApiMessage: 'Postal Context country is not supported', realDjAgidAppAreaVisualizationVerified: false,
      selectedCandidateEvidence: 'La Poste de Djibouti; Rue de Mohamed Doura; Le Plateau du Marabout; Djibouti; OSM via Photon; high; ambiguous/needs-review',
      renderedDetailedAddressContextMoreSpecificThanPostcode: true, nonPostalAgidIdExample: 'DJ02RHS2MYNN', nonPostalAgidIdPromotedToPostalId: false,
      inAppBrowserAttempted: true, inAppBrowserNavigated: false, deterministicPlaywrightFallbackRan: true, postalApiMocked: false,
      renderedMapCanvasCount: 2, postalAreaNoticeCount: 0, browserScreenshotBytes: 112019, browserScreenshotSha256: 'dd013d3ea997417a4f1bbe1586702cc3cc9486532a826f51eaf3b4c6dc807c84', browserE2eVerified: false, manualVisualInspection: false,
      exactBuildingIdentityAsserted: false, explicitRightsClearedAddressBuildingRelationRequired: true,
      approvedAgidRuntimeArtifacts: 0, rawSourceBodiesInGit: 0,
      artifacts: artifactPaths.map(artifact)
    }
  },
  evidence: null
};
writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
console.log(JSON.stringify({ countryCode: 'DJ', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length }, null, 2));
