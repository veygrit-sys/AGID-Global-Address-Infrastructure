import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const inputDir = process.argv[2] ?? '.tmp-eg';
const outputPath = process.argv[3] ?? 'reports/postal-context-m2/eg-source-review-2026-09-03.json';
const observedAt = '2026-09-03T05:17:08.762Z';
const expected = {
  'egypt-post-new-code-guide.pdf': [2292511, '9ae7718d054ef6a6b7ac36cdd1ac92d804defc08f4a357a2be45c13c2df0df70'],
  'upu-addressing-gis-forum-2023.html': [105052, '7685fb9c5ba80bbc68d5742f39a2c65a8bee2af535f90b22d3d06cbb22302492'],
  'upu-egypt-2023.pdf': [144970, '86376a548e29fade9ea125d5d57cc3d378c7d6de48c745dec7d17165e9800964'],
  'upu-egypt-post-member.html': [104463, 'c0fc0a74ee513142ddafb09056ac26c56bd4a51b4deaab380efef66d667422e0'],
  'upu-general-addressing-issues.pdf': [631050, 'ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d'],
};

const receipt = file => {
  const body = readFileSync(join(inputDir, file));
  const sha256 = createHash('sha256').update(body).digest('hex');
  const [expectedBytes, expectedSha256] = expected[file];
  if (body.length !== expectedBytes || sha256 !== expectedSha256) throw new Error(`receipt-mismatch:${file}`);
  return { file, bytes: body.length, sha256 };
};

const receipts = Object.keys(expected).map(receipt);
const appVerificationPath = join(inputDir, 'eg-app-verification.json');
const app = existsSync(appVerificationPath)
  ? JSON.parse(readFileSync(appVerificationPath, 'utf8'))
  : null;
const report = {
  schemaVersion: 'postal-context-eg-source-review/v1',
  countryCode: 'EG',
  countryName: 'Egypt',
  observedAt,
  completedAt: '2026-09-03T05:38:17.6754861Z',
  result: 'blocked',
  dataCreationScope: 'current-postcode-system-confirmed-but-no-complete-current-rights-cleared-five-seven-digit-assignment-migration-denominator-or-postal-polygon-artifact',
  m2DefinitionId: 'M2_current_egypt_post_assignments_migration_and_postal_area_visualization',
  rawBodiesBundledInGit: false,
  receiptCount: receipts.length,
  receiptBytes: receipts.reduce((sum, item) => sum + item.bytes, 0),
  receipts,
  currentPostalSystem: {
    confirmed: true,
    upuAddressingSheetEdition: '07/2023',
    upuCurrentTableEdition: 'Universal DataBase Aug. 2026',
    upuCurrentFormatsObserved: ['99999', '9999999'],
    sevenDigitComponents: ['province:2', 'locality:1', 'neighbourhood:2', 'community:2'],
    completeCurrentAssignmentAndMigrationDenominatorAvailable: false,
    currentCompleteAssignmentsValidated: 0,
  },
  rightsAndGeometry: {
    officialBulkAssignmentLicencePublished: false,
    officialPostalPolygonLicencePublished: false,
    compatibleAgidRightsEstablished: false,
    officialPostalPolygonOrMultiPolygonRecords: 0,
    derivedPostalPolygonOrMultiPolygonRecords: 0,
    virtualPostalPolygonOrMultiPolygonRecords: 0,
    productionEligibleRecords: 0,
  },
  qualityDecision: {
    exactReceiptGateImplemented: true,
    dualFormatMigrationGateImplemented: true,
    pointAdminBuildingClusterBufferHullVoronoiOsmModelOrAgidProxyPromoted: false,
    huggingFaceOrModelProductionIngested: false,
    permittedModelRoles: ['Arabic and Latin parsing evaluation', 'candidate ranking', 'topology anomaly review', 'drift detection'],
    prohibitedModelRoles: ['invent assignment', 'invent official boundary', 'create rights', 'infer exact building identity'],
  },
  applicationEvidence: app ? {
    actualAppStarted: app.actualAppStarted,
    appUrl: app.appUrl,
    appHttpStatus: app.appHttpStatus,
    searchQuery: app.searchQuery,
    countryFilter: app.countryFilter,
    selectedCandidate: app.selectedCandidate,
    selectedCandidateSource: app.selectedCandidateSource,
    selectedCandidateConfidence: app.selectedCandidateConfidence,
    renderedAddressContextMoreSpecificThanPostcode: app.renderedAddressContextMoreSpecificThanPostcode,
    renderedAddressLine: app.renderedAddressLine,
    independentAgidIdExample: app.independentAgidIdExample,
    independentAgidPromotedToPostalId: app.independentAgidPromotedToPostalId,
    renderedMapCanvasCount: app.renderedMapCanvasCount,
    realEgPostalApiRequest: app.directSevenDigitRequest.request,
    realEgPostalApiStatus: app.directSevenDigitRequest.status,
    realEgPostalApiMessage: JSON.parse(app.directSevenDigitRequest.body).error,
    postalApiMocked: app.inferredOrMockedPostalAreaUsed,
    postalAreaNotice: app.postalAreaNotice,
    realEgPostalAreaVisualized: app.realEgPostalAreaVisualized,
    inAppBrowserAttempted: true,
    inAppBrowserNavigated: false,
    inAppBrowserFailure: 'windows sandbox failed: helper_unknown_error: apply deny-read ACLs',
    deterministicPlaywrightFallbackRan: app.deterministicPlaywrightFallbackRan,
    screenshotReceipts: app.screenshots,
    screenshotsCommitted: false,
    screenshotPixelChecks: { width: 1440, height: 1100, unavailableUniqueColors: 5721, addressAgidUniqueColors: 5204, blank: false },
    browserE2eVerified: app.browserE2eVerified,
    manualVisualInspection: app.manualVisualInspection,
    manualImageViewFailure: 'Windows error 206: file name or extension is too long',
  } : null,
  countryM2Achieved: false,
  retryAfter: '2026-12-03T05:17:08.762Z',
};

if (report.receiptBytes !== 3278046) throw new Error('unexpected-receipt-total');
if (report.currentPostalSystem.upuCurrentFormatsObserved.join(',') !== '99999,9999999') throw new Error('unexpected-current-formats');
if (app && (report.applicationEvidence.realEgPostalApiStatus !== 503 || report.applicationEvidence.realEgPostalAreaVisualized !== false)) throw new Error('unexpected-app-evidence');
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ countryCode: 'EG', result: report.result, receiptCount: receipts.length, receiptBytes: report.receiptBytes }, null, 2));
