import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import booleanValid from '@turf/boolean-valid';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(root, 'data/postal_country_packs/ee/postal-context/m2-source-review.json'), 'utf8'));

function fail(code) { throw new Error(`ee-source-audit:${code}`); }
export function sourceDigest(bytes) { return `sha256:${createHash('sha256').update(bytes).digest('hex')}`; }

function asCollection(input) {
  const collection = typeof input === 'string' || Buffer.isBuffer(input) ? JSON.parse(input.toString()) : input;
  if (collection?.type !== 'FeatureCollection' || !Array.isArray(collection.features)) fail('geojson-feature-collection');
  return collection;
}

function normalizeCode(rawCode, index) {
  const code = Number.isInteger(rawCode) ? String(rawCode).padStart(5, '0') : String(rawCode ?? '');
  if (!/^\d{5}$/.test(code)) fail(`postcode-${index}`);
  return code;
}

function inspectRing(ring, code, counters, bbox) {
  counters.rings += 1;
  const closed = ring.length >= 4 && ring[0]?.[0] === ring.at(-1)?.[0] && ring[0]?.[1] === ring.at(-1)?.[1];
  if (!closed) counters.ringIssueCodes.add(code);
  for (const position of ring) {
    counters.coordinates += 1;
    const [x, y] = position;
    if (!Number.isFinite(x) || !Number.isFinite(y)) counters.nonFiniteCodes.add(code);
    if (x < -180 || x > 180 || y < -90 || y > 90) counters.outOfRangeCodes.add(code);
    bbox[0] = Math.min(bbox[0], x); bbox[1] = Math.min(bbox[1], y);
    bbox[2] = Math.max(bbox[2], x); bbox[3] = Math.max(bbox[3], y);
  }
}

export function inspectEstoniaGeoJsonPage(input) {
  const collection = asCollection(input);
  const codeCounts = new Map();
  const idCounts = new Map();
  const geometryTypes = {};
  const invalidGeometryCodes = [];
  const nullGeometryCodes = [];
  const stamps = [];
  const counters = {
    coordinates: 0,
    rings: 0,
    ringIssueCodes: new Set(),
    nonFiniteCodes: new Set(),
    outOfRangeCodes: new Set(),
  };
  const bbox = [Infinity, Infinity, -Infinity, -Infinity];

  collection.features.forEach((feature, index) => {
    const code = normalizeCode(feature.properties?.sihtnumber, index);
    const id = String(feature.properties?.id ?? '');
    codeCounts.set(code, (codeCounts.get(code) ?? 0) + 1);
    idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
    const type = feature.geometry?.type ?? 'missing';
    geometryTypes[type] = (geometryTypes[type] ?? 0) + 1;
    if (!feature.geometry) nullGeometryCodes.push(code);
    else if (type === 'Polygon') feature.geometry.coordinates.forEach(ring => inspectRing(ring, code, counters, bbox));
    else if (type === 'MultiPolygon') feature.geometry.coordinates.forEach(polygon => polygon.forEach(ring => inspectRing(ring, code, counters, bbox)));
    else fail(`geometry-type-${index}`);
    if (feature.properties?.stamp_cre) stamps.push(feature.properties.stamp_cre);
    try { if (!booleanValid(feature)) invalidGeometryCodes.push(code); } catch { invalidGeometryCodes.push(code); }
  });

  const codes = [...codeCounts.keys()];
  const ids = [...idCounts.keys()];
  stamps.sort();
  return {
    featureCount: collection.features.length,
    distinctPostcodeCount: codeCounts.size,
    duplicatePostcodeFeatureCount: collection.features.length - codeCounts.size,
    codes,
    distinctIdCount: idCounts.size,
    duplicateIdCount: collection.features.length - idCounts.size,
    ids,
    geometryTypes,
    invalidGeometryCodes,
    invalidGeometryCount: invalidGeometryCodes.length,
    ringIssueCodes: [...counters.ringIssueCodes].sort(),
    ringIssueCount: counters.ringIssueCodes.size,
    nullGeometryCount: nullGeometryCodes.length,
    nonFiniteCoordinateCodes: [...counters.nonFiniteCodes].sort(),
    outOfRangeCoordinateCodes: [...counters.outOfRangeCodes].sort(),
    coordinateCount: counters.coordinates,
    ringCount: counters.rings,
    bbox,
    stampMinimum: stamps[0] ?? null,
    stampMaximum: stamps.at(-1) ?? null,
  };
}

export function inspectEstoniaFeaturePages(inputs) {
  const collections = inputs.map(asCollection);
  const combined = inspectEstoniaGeoJsonPage({ type: 'FeatureCollection', features: collections.flatMap(page => page.features) });
  return {
    ...combined,
    pageFeatureCounts: collections.map(page => page.features.length),
    crossPageDuplicatePostcodes: combined.duplicatePostcodeFeatureCount,
    crossPageDuplicateIds: combined.duplicateIdCount,
    minimumPostcode: [...combined.codes].sort()[0] ?? null,
    maximumPostcode: [...combined.codes].sort().at(-1) ?? null,
  };
}

export function validateEstoniaAuditReport(report) {
  if (report.countryCode !== 'EE' || report.criterionId !== config.m2_criterion.id) fail('report-identity');
  if (report.references.length !== config.references.length || new Set(report.references.map(item => item.id)).size !== report.references.length) fail('report-reference-set');
  for (const reference of config.references) {
    const receipt = report.references.find(item => item.id === reference.id);
    if (!receipt || receipt.requestedUrl !== reference.url || receipt.httpStatus !== reference.http_status || receipt.byteLength !== reference.reviewed_bytes || receipt.responseDigest !== reference.expected_digest || receipt.contentVerified !== true) fail(`report-receipt-${reference.id}`);
  }
  if (report.currentOfficialObservation.numberMatched !== 5436 || report.currentOfficialObservation.distinctFiveDigitPostcodes !== 5436 || report.currentOfficialObservation.duplicatePostcodesAcrossPages !== 0) fail('report-denominator');
  if (report.currentOfficialObservation.pagingTransactionSafe || report.currentOfficialObservation.metadataReleaseEdition !== null || report.currentOfficialObservation.sample10621GeometryType !== 'MultiPolygon') fail('report-fixedness');
  if (report.geometry.sourcePolygonRecords !== 4320 || report.geometry.sourceMultiPolygonRecords !== 1116 || report.geometry.turfBooleanInvalidRecords !== 91 || report.geometry.productionEligibleRecords !== 0) fail('report-geometry');
  if (report.geometry.invalidGeometryAutomaticallyRepaired || report.geometry.inventedRepairOrProxyRecords !== 0) fail('report-repair');
  if (report.postcodeClasses.operatorAssignmentDenominatorComplete || report.postcodeClasses.inventedFacilityOrNonAreaSurfaces !== 0) fail('report-classification');
  if (!report.rights.agencyWfsExtractDeriveCombinePublishAndRedistributePermittedWithAttribution || report.rights.additionalExternalGeometryTermsResolvedForFullArtifact || report.rights.agidFullPostalAreaArtifactPublicationRightEstablished) fail('report-rights');
  if (report.reproducibility.liveResponsesPubliclyRetainedAtImmutableUrls || report.reproducibility.singleTransactionSafeNationalRead || report.reproducibility.publishedImmutableDataArtifacts !== 0) fail('report-reproducibility');
  if (report.applicationEvidence.realEeArtifactLoaderVerified || report.applicationEvidence.realEePostalApiVerified || report.applicationEvidence.realEeAppAreaVisualizationVerified || report.countryM2Achieved) fail('report-m2-overclaim');
  if (report.authenticatedRequests !== 0 || report.paidOperations !== 0 || report.contractAcceptances !== 0 || report.operatorDatabaseDownloads !== 0 || report.newAccountsRepositoriesOrDestinations !== 0 || report.rawSourceBodiesInGit !== 0) fail('report-operation-overclaim');
  if (report.postalPolicy.invalidGeometryAutomaticallyRepaired || report.postalPolicy.facilityOrNonAreaCodeReceivesInventedSurface) fail('report-postal-policy');
  return {
    references: report.references.length,
    officialFeatures: report.currentOfficialObservation.numberMatched,
    invalidGeometry: report.geometry.turfBooleanInvalidRecords,
    publishedImmutableArtifacts: report.reproducibility.publishedImmutableDataArtifacts,
    countryM2Achieved: false,
  };
}

export function auditEstoniaSourceDirectory(sourceDirectory, report) {
  for (const reference of config.references) {
    const bytes = readFileSync(join(sourceDirectory, reference.audit_file));
    if (bytes.length !== reference.reviewed_bytes) fail(`source-length-${reference.id}`);
    if (sourceDigest(bytes) !== reference.expected_digest) fail(`source-digest-${reference.id}`);
  }
  const hits = readFileSync(join(sourceDirectory, 'aks-postal-area-hits.xml'), 'utf8');
  const numberMatched = Number(/numberMatched="(\d+)"/.exec(hits)?.[1]);
  if (numberMatched !== 5436) fail('source-hits');
  const page1 = readFileSync(join(sourceDirectory, 'aks-postal-areas.geojson'));
  const page2 = readFileSync(join(sourceDirectory, 'aks-postal-areas-page2.geojson'));
  const combined = inspectEstoniaFeaturePages([page1, page2]);
  if (combined.featureCount !== 5436 || combined.distinctPostcodeCount !== 5436 || combined.crossPageDuplicatePostcodes !== 0 || combined.crossPageDuplicateIds !== 0) fail('source-denominator');
  if (combined.geometryTypes.Polygon !== 4320 || combined.geometryTypes.MultiPolygon !== 1116 || combined.invalidGeometryCount !== 91 || combined.ringIssueCount !== 0) fail('source-geometry');
  if (combined.coordinateCount !== 1238476 || combined.ringCount !== 8402) fail('source-coordinate-count');
  const sample = inspectEstoniaGeoJsonPage(readFileSync(join(sourceDirectory, 'aks-postal-area-10621.geojson')));
  if (sample.featureCount !== 1 || sample.codes[0] !== '10621' || sample.geometryTypes.MultiPolygon !== 1) fail('source-sample-10621');
  validateEstoniaAuditReport(report);
  return {
    officialFeatures: combined.featureCount,
    polygonRecords: combined.geometryTypes.Polygon,
    multiPolygonRecords: combined.geometryTypes.MultiPolygon,
    invalidGeometry: combined.invalidGeometryCount,
    samplePostcode: sample.codes[0],
    sampleGeometryType: 'MultiPolygon',
    countryM2Achieved: false,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceDirectory = process.argv[2];
  const reportPath = process.argv[3] ?? join(root, 'reports/postal-context-m2/ee-source-review-2026-08-30.json');
  if (!sourceDirectory) fail('usage');
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  console.log(JSON.stringify(auditEstoniaSourceDirectory(sourceDirectory, report)));
}
