import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import booleanValid from '@turf/boolean-valid';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(root, 'data/postal_country_packs/dk/postal-context/m2-source-review.json'), 'utf8'));

function fail(code) { throw new Error(`dk-source-audit:${code}`); }
export function sourceDigest(bytes) { return `sha256:${createHash('sha256').update(bytes).digest('hex')}`; }

function inspectPolygon(polygon, featureIndex, ringIssues, counters, bbox) {
  for (const ring of polygon) {
    counters.rings += 1;
    const closed = ring.length >= 4 && ring[0]?.[0] === ring.at(-1)?.[0] && ring[0]?.[1] === ring.at(-1)?.[1];
    if (!closed) ringIssues.push(featureIndex);
    for (const position of ring) {
      counters.coordinates += 1;
      const [x, y] = position;
      if (!Number.isFinite(x) || !Number.isFinite(y)) counters.nonFinite.add(featureIndex);
      if (x < -180 || x > 180 || y < -90 || y > 90) counters.outOfRange.add(featureIndex);
      bbox[0] = Math.min(bbox[0], x); bbox[1] = Math.min(bbox[1], y);
      bbox[2] = Math.max(bbox[2], x); bbox[3] = Math.max(bbox[3], y);
    }
  }
}

export function inspectDenmarkGeoJson(input) {
  const collection = typeof input === 'string' || Buffer.isBuffer(input) ? JSON.parse(input.toString()) : input;
  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) fail('geojson-feature-collection');
  const codes = [];
  const geometryTypes = {};
  const invalidGeometryCodes = [];
  const ringIssues = [];
  const counters = { coordinates: 0, rings: 0, nonFinite: new Set(), outOfRange: new Set() };
  const bbox = [Infinity, Infinity, -Infinity, -Infinity];
  let erGadepostnummerFields = 0;
  let stormodtagerTrue = 0;

  collection.features.forEach((feature, featureIndex) => {
    const code = String(feature.properties?.nr ?? '');
    codes.push(code);
    if (!/^\d{4}$/.test(code)) fail(`postcode-${featureIndex}`);
    const type = feature.geometry?.type ?? 'missing';
    geometryTypes[type] = (geometryTypes[type] ?? 0) + 1;
    if (type === 'Polygon') inspectPolygon(feature.geometry.coordinates, featureIndex, ringIssues, counters, bbox);
    else if (type === 'MultiPolygon') feature.geometry.coordinates.forEach(polygon => inspectPolygon(polygon, featureIndex, ringIssues, counters, bbox));
    else fail(`geometry-type-${featureIndex}`);
    if (Object.hasOwn(feature.properties ?? {}, 'erGadepostnummer')) erGadepostnummerFields += 1;
    if (feature.properties?.stormodtager === true) stormodtagerTrue += 1;
    try { if (!booleanValid(feature)) invalidGeometryCodes.push(code); } catch { invalidGeometryCodes.push(code); }
  });

  return {
    featureCount: collection.features.length,
    codes,
    duplicateCodeCount: codes.length - new Set(codes).size,
    geometryTypes,
    invalidGeometryCodes,
    invalidGeometryCount: invalidGeometryCodes.length,
    ringIssueCodes: [...new Set(ringIssues.map(index => codes[index]))],
    ringIssueCount: ringIssues.length,
    coordinateCount: counters.coordinates,
    ringCount: counters.rings,
    nonFiniteCoordinateRecordCount: counters.nonFinite.size,
    outOfRangeCoordinateRecordCount: counters.outOfRange.size,
    erGadepostnummerFields,
    stormodtagerTrue,
    bbox,
  };
}

export function inspectDenmarkJsonList(input) {
  const records = typeof input === 'string' || Buffer.isBuffer(input) ? JSON.parse(input.toString()) : input;
  if (!Array.isArray(records)) fail('json-list');
  const codes = records.map((record, index) => {
    const code = String(record.nr ?? '');
    if (!/^\d{4}$/.test(code)) fail(`json-postcode-${index}`);
    return code;
  });
  return { recordCount: records.length, codes, duplicateCodeCount: codes.length - new Set(codes).size };
}

export function validateDenmarkAuditReport(report) {
  if (report.countryCode !== 'DK' || report.criterionId !== config.m2_criterion.id) fail('report-identity');
  if (report.references.length !== config.references.length || new Set(report.references.map(item => item.id)).size !== report.references.length) fail('report-reference-set');
  for (const reference of config.references) {
    const receipt = report.references.find(item => item.id === reference.id);
    if (!receipt || receipt.requestedUrl !== reference.url || receipt.httpStatus !== reference.http_status || receipt.byteLength !== reference.reviewed_bytes || receipt.responseDigest !== reference.expected_digest || receipt.contentVerified !== true) fail(`report-receipt-${reference.id}`);
  }
  if (report.currentOfficialObservation.officialFeatureCount !== 1089 || report.currentOfficialObservation.jsonAssignmentRecords !== 1089 || report.currentOfficialObservation.codeSetDifference !== 0) fail('report-denominator');
  if (report.geometry.sourceMultiPolygonRecords !== 1089 || report.geometry.turfBooleanInvalidRecords !== 39 || report.geometry.ringsWithFewerThanFourPositions !== 2 || report.geometry.productionEligibleRecords !== 0) fail('report-geometry');
  if (report.postcodeClasses.erGadepostnummerFieldRecords !== 0 || report.postcodeClasses.gadepostnummerClassificationComplete || report.postcodeClasses.inventedSpecialCodeSurfaces !== 0) fail('report-classification');
  if (!report.rights.agidUseAndRedistributionRightEstablishedForReviewedFreeGeodata || report.reproducibility.liveResponsePubliclyRetainedAtImmutableUrl || report.reproducibility.publishedImmutableDataArtifacts !== 0) fail('report-rights-or-fixedness');
  if (report.realAgidRuntimeVerified || report.realAgidAppAreaVisualizationVerified || report.countryM2Achieved) fail('report-m2-overclaim');
  if (report.authenticatedRequests !== 0 || report.paidOperations !== 0 || report.contractAcceptances !== 0 || report.newAccountsRepositoriesOrDestinations !== 0 || report.rawSourceBodiesInGit !== 0) fail('report-operation-overclaim');
  if (report.postalPolicy.invalidGeometryAutomaticallyRepaired || report.postalPolicy.specialOrNonAreaCodeReceivesInventedSurface || report.postalPolicy.greenlandOrFaroeBecomesDkTerritory) fail('report-authority-overclaim');
  return { references: config.references.length, officialFeatures: 1089, invalidGeometry: 39, publishedImmutableArtifacts: 0, countryM2Achieved: false };
}

export function auditDenmarkSourceDirectory(sourceDirectory, report) {
  for (const reference of config.references) {
    const bytes = readFileSync(join(sourceDirectory, reference.audit_file));
    if (bytes.length !== reference.reviewed_bytes || sourceDigest(bytes) !== reference.expected_digest) fail(`source-byte-drift-${reference.id}`);
  }
  const geo = inspectDenmarkGeoJson(readFileSync(join(sourceDirectory, 'postnumre-land.geojson')));
  const list = inspectDenmarkJsonList(readFileSync(join(sourceDirectory, 'postnumre-land.json')));
  const sample = JSON.parse(readFileSync(join(sourceDirectory, 'postnummer-2400.geojson'), 'utf8'));
  const transaction = JSON.parse(readFileSync(join(sourceDirectory, 'latest-transaction.json'), 'utf8'));
  const geoCodes = new Set(geo.codes);
  const difference = list.codes.filter(code => !geoCodes.has(code)).length + geo.codes.filter(code => !new Set(list.codes).has(code)).length;
  if (geo.featureCount !== 1089 || list.recordCount !== 1089 || difference !== 0 || geo.duplicateCodeCount !== 0 || list.duplicateCodeCount !== 0) fail('source-denominator');
  if (geo.geometryTypes.MultiPolygon !== 1089 || geo.invalidGeometryCount !== 39 || geo.ringIssueCount !== 2 || geo.ringIssueCodes.join(',') !== '4000,8543') fail('source-geometry');
  if (geo.erGadepostnummerFields !== 0 || geo.stormodtagerTrue !== 0 || sample.type !== 'Feature' || sample.geometry?.type !== 'MultiPolygon') fail('source-profile');
  if (transaction.txid !== 4141673 || transaction.tidspunkt !== '2026-08-29T21:41:01.481Z') fail('source-transaction');
  validateDenmarkAuditReport(report);
  return { officialFeatures: geo.featureCount, invalidGeometry: geo.invalidGeometryCount, ringIssueCodes: geo.ringIssueCodes, transactionId: transaction.txid, countryM2Achieved: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceDirectory = process.argv[2];
  const reportPath = process.argv[3] ?? join(root, 'reports/postal-context-m2/dk-source-review-2026-08-30.json');
  if (!sourceDirectory) fail('usage');
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  console.log(JSON.stringify(auditDenmarkSourceDirectory(sourceDirectory, report)));
}
