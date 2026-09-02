import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';

const ledgerPath = 'docs/postal-context-m2-rollout.json';
const evidenceCommit = 'd281ee8288dd7440499fdc2d0f1bbbc13127c70a';
const observedAt = '2026-09-02T18:08:57.070Z';
const completedAt = '2026-09-02T18:35:00.000Z';
const retryAfter = '2026-12-02T18:08:57.070Z';
const sourceReport = 'reports/postal-context-m2/vi-zcta-validation-2026-09-03.json';
const engineeringReport = 'reports/postal-context-m2/vi-engineering-validation-2026-09-03.json';
const browserReport = 'reports/postal-context-m2/vi-browser-validation-2026-09-03.json';
const countryReport = 'docs/postal-context-us-virgin-islands-m2.md';
const digest = path => `sha256:${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
const artifact = path => ({
  url: `https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure/blob/${evidenceCommit}/${path.replaceAll('\\', '/')}`,
  digest: digest(path),
  bytes: statSync(path).size,
});

const manifest = JSON.parse(readFileSync('data/postal_country_packs/vi/postal-context/repository-manifest.json', 'utf8'));
const stage = manifest.promotion.stages.find(item => item.id === manifest.promotion.target_stage);
if (!stage) throw new Error('missing-vi-m2-definition');
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const index = ledger.countries.findIndex(item => item.countryCode === 'VI');
if (index < 0) throw new Error('missing-vi-ledger-entry');
const previous = ledger.countries[index];
if (!((previous.status === 'pending' && previous.attempts === 0) || (previous.status === 'blocked' && previous.attempts === 1))) {
  throw new Error('unexpected-vi-ledger-state');
}
const artifactPaths = [
  'data/postal_country_packs/vi/postal-context/m2/descriptor.json',
  'data/postal_country_packs/vi/postal-context/m2/graph.json',
  'data/postal_country_packs/vi/postal-context/m2/geometry.json',
  sourceReport,
  engineeringReport,
  browserReport,
  countryReport,
  'reports/postal-context-m2/vi-actual-app-unavailable-2026-09-03.png',
  'reports/postal-context-m2/vi-derived-polygon-visual-2026-09-03.png',
];

ledger.countries[index] = {
  ...previous,
  manifest: 'data/postal_country_packs/vi/postal-context/repository-manifest.json',
  declaredStage: 'M1_metadata',
  m2Definition: { id: stage.id, definition: stage.definition },
  status: 'blocked',
  attempts: 1,
  lastAttempt: {
    observedAt,
    completedAt,
    result: 'blocked-current-complete-usps-vi-assignment-denominator-and-production-runtime-unavailable-six-real-census-zcta-validation-surfaces-published',
    report: sourceReport,
    reportDigest: digest(sourceReport),
    engineeringReport,
    engineeringReportDigest: digest(engineeringReport),
    browserReport,
    browserReportDigest: digest(browserReport),
    countryReport,
    countryReportDigest: digest(countryReport),
    currentPostalCodeFormat: 'NNNNN or NNNNN-NNNN',
    postcodeDataCreationTarget: true,
    fixedDerivedCensusZctaSurfaces: 6,
    completeCurrentUspsAssignmentRecords: 0,
    m2QualifiedRecords: 0,
    realApiStatus: 404,
    realAppPostalAreaVisualized: false,
    nextAction: 'Continue the pending-country sweep to the next ledger-selected country. Re-check VI only after the deadline or when a complete current typed USPS VI assignment/non-area denominator with compatible rights and a production app path become available.',
  },
  blocker: {
    kind: 'complete-current-usps-vi-assignment-denominator-and-production-runtime-unavailable',
    reason: 'USPS primary material confirms the current VI ZIP system, but the comprehensive assignment products are encrypted/licensed and compatible open AGID serving rights were not established. Census publishes six real January 1, 2020 VI ZCTAs, but states that ZCTAs are generalized statistical areas, omit some valid ZIP Codes and may represent unique or P.O. Box codes. The coordinate-preserving derived surfaces and detailed IDs are published for validation only. The real VI API returned 404, the actual app exposed no VI postal controls, in-app Browser and bitmap inspection failed on Windows, and deterministic Playwright rendering is not represented as production or human visual success.',
    observedAt,
    retryAfter,
    requiresExplicitApproval: true,
    retryPolicy: 'Do not contact USPS, Census or another provider or authority, request data, register, authenticate, accept terms, licence, permission or contract, pay, access protected data, create a destination, publish or deploy without explicit approval. Finish pending countries before this timed review.',
    unblockCondition: 'A competent authority publishes or explicitly supplies and licenses a complete current immutable typed VI five-digit and ZIP+4 assignment, alias, validity, correction, exception and explicit area/non-area denominator for AGID processing, storage, derivation, redistribution and public serving; reconcile eligible real geometry without treating ZCTAs as USPS delivery boundaries, then verify the production VI API/app/browser state handling, fit, translucent fill/outline, detailed IDs, clear and re-search path.',
    evidence: {
      evidenceCommit,
      sourceReport,
      sourceReportDigest: digest(sourceReport),
      engineeringReport,
      engineeringReportDigest: digest(engineeringReport),
      browserReport,
      browserReportDigest: digest(browserReport),
      countryReport,
      countryReportDigest: digest(countryReport),
      dataCreationScope: 'included-current-vi-zip-system-blocked-missing-complete-current-redistributable-typed-usps-denominator-with-six-fixed-census-zcta-derived-validation-surfaces',
      postcodeDataCreationTarget: true,
      currentPostalSystemConfirmed: true,
      currentPostalCodeFormat: 'NNNNN or NNNNN-NNNN',
      sourceBodyCount: 9,
      sourceBodyBytes: 2209911,
      exactBodiesByteAndSha256Bound: true,
      currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished: false,
      compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished: false,
      providerContactRegistrationAuthenticationContractAcceptancePaymentOrProtectedAccessAttempted: false,
      censusReferenceDate: '2020-01-01',
      censusZctaFeaturesPublished: 6,
      polygonRecords: 4,
      multiPolygonRecords: 2,
      polygonParts: 8,
      rings: 8,
      closedRings: 8,
      zeroAreaRings: 0,
      positions: 11767,
      structuralGeometryValid: true,
      coordinateModification: false,
      sourceType: 'derived',
      officialUspsPostalPolygonRecords: 0,
      fabricatedSurfaces: 0,
      sampleNormalizedPostcode: '00802',
      samplePostalContextId: 'postal-vi-census-zcta-00802',
      sampleGeometryId: 'census-vi-zcta-2020-00802',
      sampleCensusOid: '221704258615104',
      sampleCensusObjectId: 23557,
      sampleCountryAssertionId: 'census-vi-zcta-2020-00802-part-of-vi',
      sampleAgidAssertionId: 'census-vi-zcta-2020-00802-agid-internal-point',
      sampleAgidNodeId: 'agid-vi-census-zcta-00802-internal-point',
      sampleAgidCellId: 'VI0ETQS7G4ZH',
      agidCrosswalksPublished: 5,
      agidCrosswalksWithheld: 1,
      mismatchedComputedAgidCellId: 'VG0ETQRJZKGQ',
      viIdentityPreserved: true,
      neighbouringCountryOrTerritoryIdentityMerged: false,
      actualAppStarted: true,
      actualAppHttpStatus: 200,
      realViAgidPostalApiStatus: 404,
      realViAgidPostalApiMessage: 'Postal Context country is not supported',
      actualUiPostalControlsFound: false,
      realViAgidAppAreaVisualizationVerified: false,
      inAppBrowserAttempted: true,
      inAppBrowserNavigated: false,
      screenshotBitmapInspectionSucceeded: false,
      deterministicPlaywrightFallbackRan: true,
      deterministicRealSourceGeometryFitAndRenderPassed: true,
      deterministicClearAndResearchPassed: true,
      deterministicDetailedIdsVisible: true,
      manualLiveBrowserVisualInspection: false,
      addressesBuildingsParcelsRecipientsCustomersPeopleOrLandRightsPublished: 0,
      viArtifactTestsPassed: 3,
      viArtifactTestsFailed: 0,
      typecheckViSpecificErrors: 0,
      rawSourceBodiesInGit: 0,
      artifacts: artifactPaths.map(artifact),
    },
  },
  evidence: null,
};

writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(JSON.stringify({ countryCode: 'VI', status: 'blocked', evidenceCommit, artifactCount: artifactPaths.length }, null, 2));
