import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

export const config = JSON.parse(readFileSync(new URL('../data/postal_country_packs/cz/postal-context/m2-source-review.json', import.meta.url), 'utf8'));
const fail = (message) => { throw new Error(`cz-${message}`); };
const decoder = new TextDecoder('windows-1250', { fatal: true });
const expectedRuianHeader = 'Kód ADM;Kód obce;Název obce;Kód MOMC;Název MOMC;Kód obvodu Prahy;Název obvodu Prahy;Kód části obce;Název části obce;Kód ulice;Název ulice;Typ SO;Číslo domovní;Číslo orientační;Znak čísla orientačního;PSČ;Souřadnice Y;Souřadnice X;Platí Od';

export const sourceDigest = (bytes) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const normalizedPostcode = (value) => /^\d{5}$/.test(String(value ?? '').trim()) ? String(value).trim() : null;
const plainProfile = (profile) => Object.fromEntries(Object.entries(profile).filter(([key]) => !key.startsWith('_')));
const deepEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const profileMatches = (actual, expected, id) => {
  for (const [key, value] of Object.entries(expected ?? {})) if (!deepEqual(actual[key], value)) fail(`${id}-${key}`);
};

export function parseSemicolonCsv(bytes, id = 'csv') {
  let text;
  try { text = decoder.decode(bytes).replace(/^\uFEFF/, ''); } catch { fail(`${id}-encoding`); }
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) fail(`${id}-empty`);
  const header = lines.shift().split(';');
  if (new Set(header).size !== header.length) fail(`${id}-header`);
  const records = lines.map((line, row) => {
    const fields = line.split(';');
    if (fields.length !== header.length) fail(`${id}-columns-${row + 2}`);
    return Object.fromEntries(header.map((name, column) => [name, fields[column]]));
  });
  return { header, records };
}

export function profileSingleCsvArchive(bytes, reference) {
  let entries;
  try { entries = new AdmZip(bytes).getEntries().filter((entry) => !entry.isDirectory); } catch { fail(`${reference.id}-zip`); }
  if (entries.length !== 1 || entries[0].entryName !== reference.expected_profile.entry) fail(`${reference.id}-entry`);
  const csvBytes = entries[0].getData();
  const { header, records } = parseSemicolonCsv(csvBytes, reference.id);
  const postcodeField = entries[0].entryName === 'zv_mbds.csv' ? 'ADRESNÍ PSČ' : entries[0].entryName === 'zv_cobce_psc.csv' ? 'psc' : 'PSC';
  if (!header.includes(postcodeField)) fail(`${reference.id}-postcode-field`);
  const postcodes = records.map((record) => normalizedPostcode(record[postcodeField]));
  const profile = {
    entry: entries[0].entryName,
    uncompressed_bytes: csvBytes.length,
    rows: records.length,
    distinct_postcodes: new Set(postcodes.filter(Boolean)).size,
    invalid_postcodes: postcodes.filter((value) => !value).length,
    _records: records,
    _postcode_field: postcodeField,
  };
  if (entries[0].entryName === 'zv_psc_adr.csv') {
    const counts = {};
    for (const record of records) counts[record.TYP_PSC] = (counts[record.TYP_PSC] ?? 0) + 1;
    profile.type_counts = counts;
  }
  return profile;
}

const xmlText = (xml) => [...xml.matchAll(/<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g)]
  .map((match) => match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'"))
  .join(' ');

export function profileCertificate(bytes, reference) {
  let text;
  if (reference.kind === 'docx-certificate') {
    let entry;
    try { entry = new AdmZip(bytes).getEntry('word/document.xml'); } catch { fail(`${reference.id}-docx`); }
    if (!entry) fail(`${reference.id}-document-xml`);
    text = xmlText(entry.getData().toString('utf8'));
  } else {
    if (bytes.subarray(0, 8).toString('hex') !== 'd0cf11e0a1b11ae1') fail(`${reference.id}-legacy-doc-signature`);
    text = bytes.toString('utf16le');
  }
  const expected = reference.expected_profile;
  const compact = (value) => value.replace(/[\s\u00a0]+/g, '');
  const compactText = compact(text);
  if (!compactText.includes(compact(expected.effective_date)) || !compactText.includes('Cyklusaktualizace') || !compactText.includes('měsíčně')) fail(`${reference.id}-certificate-content`);
  if (expected.states_all_usable_locality_postcodes && !compactText.includes('využitelnýmiPSČ')) fail(`${reference.id}-locality-scope`);
  if (expected.states_exceptional_no_delivery_cases && !compactText.includes('výjimečnépřípady')) fail(`${reference.id}-exception-scope`);
  if (expected.states_all_localities_with_usable_address_postcodes && !compactText.includes('využitelnýmiadresnímiPSČ')) fail(`${reference.id}-address-locality-scope`);
  if (expected.declares_type_codes && !expected.declares_type_codes.every((code) => text.includes(` ${code} `) || text.includes(`${code} –`))) fail(`${reference.id}-type-codes`);
  return { ...expected };
}

export function profileRuianArchive(bytes, reference) {
  let entries;
  try { entries = new AdmZip(bytes).getEntries().filter((entry) => !entry.isDirectory); } catch { fail(`${reference.id}-zip`); }
  let rows = 0;
  let uncompressed = 0;
  let missingPostcodes = 0;
  let invalidPostcodes = 0;
  let coordinatePairs = 0;
  let partialCoordinateRows = 0;
  let invalidCoordinates = 0;
  let minValidFrom = null;
  let maxValidFrom = null;
  const postcodeCoordinates = new Map();
  for (const entry of entries) {
    if (!/^CSV\/20260731_OB_\d{6}_ADR\.csv$/.test(entry.entryName)) fail(`${reference.id}-entry`);
    const csvBytes = entry.getData();
    uncompressed += csvBytes.length;
    const { header, records } = parseSemicolonCsv(csvBytes, entry.entryName);
    if (header.join(';') !== expectedRuianHeader) fail(`${reference.id}-header`);
    for (const record of records) {
      rows += 1;
      const rawPostcode = record['PSČ'].trim();
      if (!rawPostcode) missingPostcodes += 1;
      const postcode = normalizedPostcode(rawPostcode);
      if (rawPostcode && !postcode) invalidPostcodes += 1;
      const x = record['Souřadnice X'].trim();
      const y = record['Souřadnice Y'].trim();
      let hasCoordinates = false;
      if (x && y) {
        if (Number.isFinite(Number(x.replace(',', '.'))) && Number.isFinite(Number(y.replace(',', '.')))) {
          coordinatePairs += 1;
          hasCoordinates = true;
        } else invalidCoordinates += 1;
      } else if (x || y) partialCoordinateRows += 1;
      if (postcode) {
        const stats = postcodeCoordinates.get(postcode) ?? { coordinates: 0, missing: 0 };
        if (hasCoordinates) stats.coordinates += 1; else stats.missing += 1;
        postcodeCoordinates.set(postcode, stats);
      }
      const validFrom = record['Platí Od'].trim();
      if (validFrom) {
        if (minValidFrom === null || validFrom < minValidFrom) minValidFrom = validFrom;
        if (maxValidFrom === null || validFrom > maxValidFrom) maxValidFrom = validFrom;
      }
    }
  }
  const postcodesWithNoCoordinates = [...postcodeCoordinates.values()].filter((stats) => stats.coordinates === 0).length;
  const postcodesWithPartialCoordinateCoverage = [...postcodeCoordinates.values()].filter((stats) => stats.coordinates > 0 && stats.missing > 0).length;
  return {
    entries: entries.length,
    uncompressed_bytes: uncompressed,
    rows,
    distinct_postcodes: postcodeCoordinates.size,
    missing_postcodes: missingPostcodes,
    invalid_postcodes: invalidPostcodes,
    coordinate_pairs: coordinatePairs,
    missing_coordinate_rows: rows - coordinatePairs - partialCoordinateRows,
    partial_coordinate_rows: partialCoordinateRows,
    invalid_coordinates: invalidCoordinates,
    postcodes_with_no_coordinates: postcodesWithNoCoordinates,
    postcodes_with_partial_coordinate_coverage: postcodesWithPartialCoordinateCoverage,
    min_valid_from: minValidFrom,
    max_valid_from: maxValidFrom,
    geometry_columns: 0,
    _codes: new Set(postcodeCoordinates.keys()),
  };
}

export function profileReference(bytes, reference) {
  if (!Buffer.isBuffer(bytes) || bytes.length !== reference.reviewed_bytes || sourceDigest(bytes) !== reference.expected_digest) fail(`${reference.id}-content-drift`);
  const profile = reference.kind === 'single-csv-zip' ? profileSingleCsvArchive(bytes, reference)
    : reference.kind === 'ruian-municipality-csv-zip' ? profileRuianArchive(bytes, reference)
      : profileCertificate(bytes, reference);
  profileMatches(profile, reference.expected_profile, reference.id);
  return profile;
}

const values = (profile) => new Set(profile._records.map((record) => normalizedPostcode(record[profile._postcode_field])).filter(Boolean));
const typeCounts = (codes, typeMap) => {
  const counts = {};
  for (const code of codes) counts[typeMap.get(code) ?? 'missing'] = (counts[typeMap.get(code) ?? 'missing'] ?? 0) + 1;
  return counts;
};

export function compareAssignments(profiles) {
  const codeTypes = profiles['ceska-posta-address-postcode-types-2026-08'];
  const typeMap = new Map(codeTypes._records.map((record) => [record.PSC, record.TYP_PSC]));
  const operatorCodes = values(codeTypes);
  const localityCodes = values(profiles['ceska-posta-locality-postcodes-2026-08']);
  const municipalityCodes = values(profiles['ceska-posta-municipality-part-postcodes-2026-08']);
  const noDeliveryCodes = values(profiles['ceska-posta-no-delivery-service-2026-08']);
  const ruianCodes = profiles['cuzk-ruian-addresses-2026-07-31']._codes;
  const difference = (left, right) => [...left].filter((code) => !right.has(code)).sort();
  return {
    operator_codes: operatorCodes.size,
    ruian_codes: ruianCodes.size,
    matched_codes: [...operatorCodes].filter((code) => ruianCodes.has(code)).length,
    operator_codes_without_ruian_address_rows: difference(operatorCodes, ruianCodes).length,
    ruian_codes_without_operator_classification: difference(ruianCodes, operatorCodes).length,
    locality_codes_without_ruian_address_rows: difference(localityCodes, ruianCodes).length,
    municipality_part_codes_without_ruian_address_rows: difference(municipalityCodes, ruianCodes),
    ruian_type_counts: typeCounts(ruianCodes, typeMap),
    no_delivery_type_counts: typeCounts(noDeliveryCodes, typeMap),
  };
}

export function validateCzechiaAuditReport(report) {
  if (report.countryCode !== 'CZ' || report.criterionId !== config.m2_criterion.id) fail('report-identity');
  if (report.references.length !== config.references.length || new Set(report.references.map((item) => item.id)).size !== report.references.length) fail('report-reference-set');
  for (const reference of config.references) {
    const receipt = report.references.find((item) => item.id === reference.id);
    if (!receipt || receipt.requestedUrl !== reference.url || receipt.httpStatus !== 200 || receipt.byteLength !== reference.reviewed_bytes || receipt.responseDigest !== reference.expected_digest || receipt.contentVerified !== true) fail(`report-receipt-${reference.id}`);
  }
  if (report.operator.addressPostcodeCodes !== 15666 || report.operator.localityPostcodes !== 2677 || report.ruian.addressRows !== 3020222 || report.ruian.distinctPostcodes !== 2677 || report.ruian.coordinatePairs !== 3019302) fail('report-profile');
  if (report.geometry.operatorOfficialPolygonRecords !== 0 || report.geometry.derivedPolygonRecords !== 0 || report.geometry.productionEligibleRecords !== 0) fail('report-geometry-overclaim');
  if (report.publishedImmutableDataArtifacts !== 0 || report.realAgidRuntimeVerified || report.realAgidAppAreaVisualizationVerified || report.countryM2Achieved) fail('report-m2-overclaim');
  if (report.authenticatedRequests !== 0 || report.paidOperations !== 0 || report.contractAcceptances !== 0 || report.newAccountsRepositoriesOrDestinations !== 0 || report.rawSourceBodiesInGit !== 0) fail('report-operation-overclaim');
  if (report.postalPolicy.addressPointIsPostcodeArea || report.postalPolicy.localityAssignmentIsPostcodeArea || report.postalPolicy.specialCodeReceivesInventedArea) fail('report-authority-overclaim');
  return { references: config.references.length, operatorCodes: 15666, ruianRows: 3020222, productionEligibleRecords: 0, countryM2Achieved: false };
}

export function auditCzechiaSourceDirectory(sourceDirectory, report) {
  const profiles = {};
  for (const reference of config.references) profiles[reference.id] = profileReference(readFileSync(join(sourceDirectory, reference.audit_file)), reference);
  const comparison = compareAssignments(profiles);
  if (!deepEqual(comparison, config.expected_comparison)) fail('comparison-drift');
  validateCzechiaAuditReport(report);
  return { profiles: Object.fromEntries(Object.entries(profiles).map(([id, profile]) => [id, plainProfile(profile)])), comparison };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceDirectory = process.argv[2];
  const reportPath = process.argv[3] ?? fileURLToPath(new URL('../reports/postal-context-m2/cz-source-review-2026-08-30.json', import.meta.url));
  if (!sourceDirectory) fail('usage');
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const result = auditCzechiaSourceDirectory(sourceDirectory, report);
  console.log(JSON.stringify({ report: validateCzechiaAuditReport(report), comparison: result.comparison }));
}
