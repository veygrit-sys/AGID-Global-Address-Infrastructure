import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const ledgerPath = 'docs/postal-context-m2-rollout.json';
const evidenceCommit = '274e80c66fcb36a60d92dc9adbf187c0cb45e980';
const observedAt = '2026-09-03T02:16:05.886Z';
const completedAt = '2026-09-03T02:46:00.000Z';
const retryAfter = '2026-12-03T02:16:05.886Z';
const sourceReport = 'reports/postal-context-m2/cv-source-review-2026-09-03.json';
const engineeringReport = 'reports/postal-context-m2/cv-checks-2026-09-03.json';
const countryReport = 'docs/postal-context-cabo-verde-m2.md';
const manifestPath = 'data/postal_country_packs/cv/postal-context/repository-manifest.json';
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
if (!stage) throw new Error('missing-cv-m2-definition');
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const index = ledger.countries.findIndex(item => item.countryCode === 'CV');
if (index < 0) throw new Error('missing-cv-ledger-entry');
const previous = ledger.countries[index];
const artifactPaths = [
  manifestPath,
  'data/postal_country_packs/cv/postal-context/m2-source-review.json',
  'data/postal_country_packs/cv/postal-context/source-profile.json',
  'data/postal-context/research-catalog.json',
  'src/data/address_formats/africa/western_africa/CV.json',
  'src/data/address_formats/africa/western_africa/CV.yaml',
  'src/data/address_hierarchy/africa.json',
  'src/data/africaOpenGeoSources.ts',
  'src/data/caboVerdeOpenGeoSources.test.ts',
  'src/lib/officialPostalSourceCatalog.ts',
  'src/lib/postalContextCaboVerdeQuality.ts',
  'src/lib/postalContextCaboVerdeQuality.test.ts',
  'src/lib/postalContextCaboVerdeRepository.test.ts',
  'scripts/inspect-postal-context-cv-sources.py',
  'scripts/inspect-postal-context-cv-sources.test.py',
  'scripts/postal-context-cv-address-metadata.test.mjs',
  'scripts/verify-postal-context-cv-browser.mjs',
  'package.json',
  sourceReport,
  engineeringReport,
  countryReport,
  'docs/postal-context-cabo-verde-runtime.md',
];
if (
  previous.status === 'blocked' &&
  previous.attempts === 1 &&
  previous.blocker?.evidence?.evidenceCommit === evidenceCommit
) {
  console.log(JSON.stringify({ countryCode: 'CV', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length, alreadyFinalized: true }, null, 2));
  process.exit(0);
}
if (!(previous.status === 'pending' && previous.attempts === 0)) throw new Error('unexpected-cv-ledger-state');

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
    result: 'blocked-no-complete-assignment-denominator-or-postal-geometry',
    report: sourceReport,
    reportDigest: digest(sourceReport),
    engineeringReport,
    engineeringReportDigest: digest(engineeringReport),
    countryReport,
    countryReportDigest: digest(countryReport),
    currentPostalCodeFormat: '9999',
    postcodeDataCreationTarget: true,
    currentCompletePostalCodeAssignments: null,
    completeAssignmentDenominatorAvailable: false,
    operatorReferenceExamplesObserved: 3,
    m2QualifiedRecords: 0,
    realApiStatus: 503,
    realAppPostalAreaVisualized: false,
    nextAction: 'Continue the pending-country sweep to DJ. Re-check CV only after the deadline or a complete rights-cleared Correios assignment and postal-geometry release.',
  },
  blocker: {
    kind: 'assignment-denominator-and-postal-geometry-unavailable',
    reason: 'Correios and the August 2026 UPU table confirm a current four-digit postcode system, but the three public FAQ examples are not a complete current assignment denominator. Correios NNNN-NNN contact values and authenticated CIP remain separate typed objects. No compatible licence or exact postal Polygon/MultiPolygon was found; INGT island, municipality, parish, zone, locality and neighbourhood polygons are administrative or toponymic context, not postal areas. The real CV API returned 503 unavailable and no translucent postal overlay rendered.',
    observedAt,
    retryAfter,
    requiresExplicitApproval: false,
    retryPolicy: 'Finish all pending countries before this timed review. Do not contact a provider or authority, request data, register, authenticate, accept terms, licence, permission or contract, pay, access protected data, create a destination, publish or deploy without explicit approval.',
    unblockCondition: 'Correios or another competent authority publishes a complete current immutable four-digit assignment and explicit area/non-area denominator plus exact valid postal Polygon/MultiPolygon geometry under rights compatible with AGID processing, storage, derivation, redistribution and public serving; then verify the real CV API/app/browser normalization, states, fit, translucent fill/outline, metadata, clear and re-search path.',
    evidence: {
      evidenceCommit,
      sourceReport,
      sourceReviewDigest: digest(sourceReport),
      engineeringReport,
      engineeringChecksDigest: digest(engineeringReport),
      countryReport,
      countryReportDigest: digest(countryReport),
      dataCreationScope: 'current-postcode-system-confirmed-but-no-complete-rights-cleared-assignment-and-polygon-artifact',
      postcodeDataCreationTarget: true,
      currentPostalSystemConfirmed: true,
      currentPostalCodeFormat: '9999',
      operatorReferenceExamples: ['7600 Plateau', '7601 Fazenda', '7602 Achada Santo Antonio'],
      currentCompleteAssignmentDenominatorAvailable: false,
      currentCompletePostalCodeAssignmentsValidated: 0,
      operatorExamplesPromotedAsCompleteAssignments: 0,
      jurisdictionIdentity: 'ISO CV and Cabo Verde/Cape Verde retained',
      upuAddressingEdition: '04/2014',
      upuCurrentTableEdition: 'Universal DataBase Aug. 2026',
      exactBodiesByteAndSha256Bound: 8,
      exactOfficialReferenceBytes: 1429576,
      operatorContactIdentifierClass: 'NNNN-NNN separate typed operator contact value',
      contactPageExtendedOccurrences: 35,
      contactPageUniqueExtendedValues: 32,
      identifiersMergedOrDigitsInferred: false,
      cipRowsAccessed: 0,
      providerContactRegistrationAuthenticationContractTermsOrPaymentAttempted: false,
      correiosAllRightsReservedRecorded: true,
      cipPortalUnauthorizedReproductionRestrictionRecorded: true,
      upuCopyrightAndDatabaseRestrictionsRecorded: true,
      openCompleteAssignmentLicencePublished: false,
      openPostalPolygonLicencePublished: false,
      compatibleAgidPostalProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished: false,
      qualityGateImplemented: true,
      pointRouteOfficeAdminBufferHullVoronoiRasterOrAgidProxiesPromoted: 0,
      officialPostalPolygonOrMultiPolygonRecords: 0,
      derivedPostalPolygonOrMultiPolygonRecords: 0,
      virtualPostalPolygonOrMultiPolygonRecords: 0,
      productionEligibleRecords: 0,
      huggingFaceOrModelProductionIngested: false,
      openStreetMapPromotedToPostalAssignmentOrArea: false,
      appStarted: true,
      appHttpStatus: 200,
      realCvAgidPostalApiStatus: 503,
      realCvAgidPostalApiMessage: 'Postal Context pack is unavailable',
      realCvAgidAppAreaVisualizationVerified: false,
      selectedCandidateEvidence: 'Universidade de Cabo Verde; Palmarejo Grande; Praia; Cabo Verde; Photon; high; ambiguous',
      detailedAddressContext: 'En3-St-05, 5298 Praia',
      detailedAddressContextNeedsReview: true,
      nonPostalAgidIdExample: 'CV014TVAYWAK',
      nonPostalAgidIdPromotedToPostalId: false,
      liveSearchSource: 'Photon',
      inAppBrowserAttempted: true,
      inAppBrowserNavigated: false,
      deterministicPlaywrightFallbackRan: true,
      postalApiMocked: false,
      renderedMapCanvasCount: 2,
      postalAreaNoticeCount: 0,
      browserScreenshotBytes: 168421,
      browserScreenshotSha256: '8ad4e05318a3feaa81ed17856558924ce46a8ca24cf10b2139b0070cca76ce9d',
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
console.log(JSON.stringify({ countryCode: 'CV', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length }, null, 2));
