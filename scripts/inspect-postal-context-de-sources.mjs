import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

export const config = JSON.parse(readFileSync(new URL('../data/postal_country_packs/de/postal-context/m2-source-review.json', import.meta.url), 'utf8'));
const fail = (message) => { throw new Error(`de-${message}`); };
const deepEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);
export const sourceDigest = (bytes) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

export function parseDbf(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 66 || bytes[0] !== 0x03) fail('dbf-signature');
  const records = bytes.readUInt32LE(4);
  const headerBytes = bytes.readUInt16LE(8);
  const recordBytes = bytes.readUInt16LE(10);
  if (headerBytes > bytes.length || bytes[headerBytes - 1] !== 0x0d) fail('dbf-header');
  const fields = [];
  for (let offset = 32; offset + 32 <= headerBytes - 1; offset += 32) {
    const name = bytes.subarray(offset, offset + 11).toString('ascii').replace(/\0.*$/, '');
    const type = String.fromCharCode(bytes[offset + 11]);
    const length = bytes[offset + 16];
    if (!name || !length) fail('dbf-field');
    fields.push({ name, type, length });
  }
  if (!fields.length || 1 + fields.reduce((sum, field) => sum + field.length, 0) !== recordBytes) fail('dbf-record-width');
  const rows = [];
  for (let index = 0; index < records; index += 1) {
    let offset = headerBytes + index * recordBytes;
    if (offset + recordBytes > bytes.length || bytes[offset] === 0x2a) fail('dbf-row');
    offset += 1;
    const row = {};
    for (const field of fields) {
      row[field.name] = bytes.subarray(offset, offset + field.length).toString('latin1').trim();
      offset += field.length;
    }
    rows.push(row);
  }
  return { fields, rows };
}

const finiteBounds = (values) => values.every(Number.isFinite);
export function parseShp(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 100 || bytes.readInt32BE(0) !== 9994) fail('shp-header');
  if (bytes.readInt32BE(24) * 2 !== bytes.length || bytes.readInt32LE(28) !== 1000 || bytes.readInt32LE(32) !== 5) fail('shp-file-contract');
  const fileBounds = [bytes.readDoubleLE(36), bytes.readDoubleLE(44), bytes.readDoubleLE(52), bytes.readDoubleLE(60)];
  if (!finiteBounds(fileBounds)) fail('shp-file-bounds');
  const records = [];
  let offset = 100;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) fail('shp-record-header');
    const recordNumber = bytes.readInt32BE(offset);
    const contentBytes = bytes.readInt32BE(offset + 4) * 2;
    const start = offset + 8;
    const end = start + contentBytes;
    if (contentBytes < 48 || end > bytes.length || bytes.readInt32LE(start) !== 5) fail('shp-record-contract');
    const bounds = [bytes.readDoubleLE(start + 4), bytes.readDoubleLE(start + 12), bytes.readDoubleLE(start + 20), bytes.readDoubleLE(start + 28)];
    const parts = bytes.readInt32LE(start + 36);
    const points = bytes.readInt32LE(start + 40);
    if (!finiteBounds(bounds) || parts < 1 || points < 4 || 44 + parts * 4 + points * 16 !== contentBytes) fail('shp-polygon-size');
    const starts = Array.from({ length: parts }, (_, index) => bytes.readInt32LE(start + 44 + index * 4));
    if (starts[0] !== 0 || starts.some((value, index) => value < 0 || value >= points || (index > 0 && value <= starts[index - 1]))) fail('shp-parts');
    const pointOffset = start + 44 + parts * 4;
    for (let part = 0; part < parts; part += 1) {
      const first = starts[part];
      const limit = part + 1 < parts ? starts[part + 1] : points;
      if (limit - first < 4) fail('shp-ring-size');
      const x1 = bytes.readDoubleLE(pointOffset + first * 16);
      const y1 = bytes.readDoubleLE(pointOffset + first * 16 + 8);
      const x2 = bytes.readDoubleLE(pointOffset + (limit - 1) * 16);
      const y2 = bytes.readDoubleLE(pointOffset + (limit - 1) * 16 + 8);
      if (![x1, y1, x2, y2].every(Number.isFinite) || x1 !== x2 || y1 !== y2) fail('shp-ring-closure');
    }
    records.push({ recordNumber, contentBytes, shapeType: 5, parts, points, bounds });
    offset = end;
  }
  if (offset !== bytes.length || records.some((record, index) => record.recordNumber !== index + 1)) fail('shp-record-sequence');
  return { fileBounds, records };
}

export function profileCompatibilityArchive(bytes) {
  let entries;
  try { entries = new AdmZip(bytes).getEntries().filter((entry) => !entry.isDirectory); } catch { fail('test-zip'); }
  const byName = new Map(entries.map((entry) => [basename(entry.entryName), entry.getData()]));
  const expectedNames = ['lizenzvereinbarung_zu_testzwecken.pdf', 'plz_ags.txt', 'plz_utm32s_shape.html', 'PLZ.cpg', 'PLZ.dbf', 'PLZ.prj', 'PLZ.shp', 'PLZ.shx'];
  if (entries.length !== expectedNames.length || !expectedNames.every((name) => byName.has(name))) fail('test-entry-set');
  const dbf = parseDbf(byName.get('PLZ.dbf'));
  const shp = parseShp(byName.get('PLZ.shp'));
  const postcodes = dbf.rows.map((row) => row.PLZ_5);
  if (dbf.fields.length !== 1 || dbf.fields[0].name !== 'PLZ_5' || dbf.fields[0].type !== 'C' || dbf.fields[0].length !== 5 || postcodes.some((code) => !/^\d{5}$/.test(code))) fail('test-postcodes');
  const prj = byName.get('PLZ.prj').toString('ascii');
  if (!prj.includes('ETRS_1989_UTM_Zone_32N') || !prj.includes('AUTHORITY["EPSG",25832]')) fail('test-crs');
  return {
    entries: entries.length,
    uncompressed_bytes: entries.reduce((sum, entry) => sum + entry.header.size, 0),
    dbf_records: dbf.rows.length,
    postcodes,
    shape_records: shp.records.length,
    shape_type: 5,
    parts: shp.records.reduce((sum, record) => sum + record.parts, 0),
    points: shp.records.reduce((sum, record) => sum + record.points, 0),
    crs: 'EPSG:25832',
    production_eligible_records: 0,
  };
}

export function profileReference(bytes, reference) {
  if (!Buffer.isBuffer(bytes) || bytes.length !== reference.reviewed_bytes || sourceDigest(bytes) !== reference.expected_digest) fail(`${reference.id}-content-drift`);
  if (reference.kind !== 'test-shapefile-zip') return { byteLength: bytes.length, digest: sourceDigest(bytes) };
  const profile = profileCompatibilityArchive(bytes);
  if (!deepEqual(profile, reference.expected_profile)) fail(`${reference.id}-profile-drift`);
  return profile;
}

export function validateGermanyAuditReport(report) {
  if (report.countryCode !== 'DE' || report.criterionId !== config.m2_criterion.id) fail('report-identity');
  if (report.references.length !== config.references.length || new Set(report.references.map((item) => item.id)).size !== report.references.length) fail('report-reference-set');
  for (const reference of config.references) {
    const receipt = report.references.find((item) => item.id === reference.id);
    if (!receipt || receipt.requestedUrl !== reference.url || receipt.httpStatus !== 200 || receipt.byteLength !== reference.reviewed_bytes || receipt.responseDigest !== reference.expected_digest || receipt.contentVerified !== true) fail(`report-receipt-${reference.id}`);
  }
  if (report.currentProduct.release !== '2026-02' || report.currentProduct.deliveryPostcodeAreas !== 8169 || report.compatibilityTest.shapeRecords !== 3 || report.compatibilityTest.productionEligibleRecords !== 0) fail('report-profile');
  if (report.geometry.currentNationalSourcePolygonRecordsAvailableToAgid !== 0 || report.geometry.productionEligibleRecords !== 0 || report.geometry.inventedSpecialCodeSurfaces !== 0) fail('report-geometry-overclaim');
  if (report.rights.agidPublicRedistributionGrantEstablished || report.publishedImmutableDataArtifacts !== 0 || report.realAgidRuntimeVerified || report.realAgidAppAreaVisualizationVerified || report.countryM2Achieved) fail('report-m2-overclaim');
  if (report.authenticatedRequests !== 0 || report.paidOperations !== 0 || report.contractAcceptances !== 0 || report.newAccountsRepositoriesOrDestinations !== 0 || report.rawSourceBodiesInGit !== 0) fail('report-operation-overclaim');
  if (report.postalPolicy.deliveryAreaIsAdministrativeBoundary || report.postalPolicy.deliveryAreaIsExactBuildingGeometry || report.postalPolicy.testPolygonMayShipAsNationalData || report.postalPolicy.specialCodeReceivesInventedArea || report.postalPolicy.austrianRoutingCodeBecomesGermanTerritory) fail('report-authority-overclaim');
  return { references: config.references.length, documentedAreas: 8169, testPolygons: 3, productionEligibleRecords: 0, countryM2Achieved: false };
}

export function auditGermanySourceDirectory(sourceDirectory, report) {
  const profiles = {};
  for (const reference of config.references) profiles[reference.id] = profileReference(readFileSync(join(sourceDirectory, reference.audit_file)), reference);
  validateGermanyAuditReport(report);
  return profiles;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceDirectory = process.argv[2];
  const reportPath = process.argv[3] ?? fileURLToPath(new URL('../reports/postal-context-m2/de-source-review-2026-08-30.json', import.meta.url));
  if (!sourceDirectory) fail('usage');
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const profiles = auditGermanySourceDirectory(sourceDirectory, report);
  console.log(JSON.stringify({ report: validateGermanyAuditReport(report), compatibilityTest: profiles['bkg-plz-compatibility-test'] }));
}
