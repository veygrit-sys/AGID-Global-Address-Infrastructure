import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBoundedOfficialResponse, probeOfficialReference, sourceDigest } from './lib/postal-context-source-probe.mjs';

const PROFILE = JSON.parse(readFileSync(new URL('../data/postal_country_packs/az/postal-context/m2-source-review.json', import.meta.url), 'utf8'));
const HOSTS = new Set(['www.azerpost.az', 'www.upu.int', 'emlak.gov.az', 'unvanportali.az', 'www.unvanportali.az', 'opendata.az']);
export const probeAzReference = (reference, fetcher = fetch) => probeOfficialReference(reference, HOSTS, fetcher);
const exactKeys = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).sort().join('|') === [...keys].sort().join('|');
const branchKeys = ['id', 'title', 'city', 'city_id', 'type', 'region', 'address', 'post_index', 'coordinates', 'streets'];
const repeatedCounts = values => [...values.values()].filter(n => n > 1);

export function summarizeAzBranches(data) {
  const probe = PROFILE.branch_probe;
  if (!exactKeys(data, ['branches', 'cities', 'regions', 'search_url'])
    || !Array.isArray(data.branches) || !Array.isArray(data.cities) || !Array.isArray(data.regions)
    || typeof data.search_url !== 'string') throw new Error('branch-root-schema');
  if (data.branches.length > probe.max_branches || data.cities.length > probe.max_branches
    || data.regions.length > probe.max_branches) throw new Error('branch-row-limit');
  const codes = new Map(), ids = new Map();
  const result = {
    grain: 'displayed-post-office-or-branch-not-postal-area-or-civic-address',
    observedBranchRows: data.branches.length, cityFilterEntries: data.cities.length, regionFilterEntries: data.regions.length,
    invalidPostcodeRows: 0, leadingZeroRows: 0, emptyTypeRows: 0,
    missingTitleRows: 0, missingCityRows: 0, missingRegionRows: 0, missingOfficeAddressRows: 0,
    presentationIdsMatchRowIndexes: data.branches.length > 0,
    coordinates: { missingBoth: 0, missingOne: 0, invalidDecimal: 0, outOfRange: 0, zeroPair: 0, rangeValid: 0 },
    streetEntries: 0, branchRowsWithStreetDetails: 0, streetEntriesMissingName: 0, streetEntriesMissingNumbers: 0,
  };
  for (const [index, branch] of data.branches.entries()) {
    if (!exactKeys(branch, branchKeys) || !Number.isSafeInteger(branch.id) || branch.id < 0
      || !['title', 'city', 'city_id', 'type', 'region', 'address', 'post_index'].every(key => typeof branch[key] === 'string')
      || !exactKeys(branch.coordinates, ['latitude', 'longitude'])
      || !['latitude', 'longitude'].every(key => typeof branch.coordinates[key] === 'string')
      || !Array.isArray(branch.streets)) throw new Error('branch-record-schema');
    ids.set(branch.id, (ids.get(branch.id) ?? 0) + 1);
    if (branch.id !== index) result.presentationIdsMatchRowIndexes = false;
    // Syntax only. Do not coerce numbers, repair provider values or deduplicate assignments.
    if (/^AZ\d{4}$/.test(branch.post_index)) {
      codes.set(branch.post_index, (codes.get(branch.post_index) ?? 0) + 1);
      if (branch.post_index.startsWith('AZ0')) result.leadingZeroRows++;
    } else result.invalidPostcodeRows++;
    if (!branch.type.trim()) result.emptyTypeRows++;
    for (const [field, counter] of [['title', 'missingTitleRows'], ['city', 'missingCityRows'], ['region', 'missingRegionRows'], ['address', 'missingOfficeAddressRows']]) {
      if (!branch[field].trim()) result[counter]++;
    }
    const lat = branch.coordinates.latitude.trim(), lon = branch.coordinates.longitude.trim();
    const decimal = /^[+-]?\d+(?:\.\d+)?$/;
    if (!lat && !lon) result.coordinates.missingBoth++;
    else if (!lat || !lon) result.coordinates.missingOne++;
    else if (!decimal.test(lat) || !decimal.test(lon)) result.coordinates.invalidDecimal++;
    else if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon)) || Math.abs(Number(lat)) > 90 || Math.abs(Number(lon)) > 180) result.coordinates.outOfRange++;
    else if (Number(lat) === 0 && Number(lon) === 0) result.coordinates.zeroPair++;
    else result.coordinates.rangeValid++;
    result.streetEntries += branch.streets.length;
    if (result.streetEntries > probe.max_street_entries) throw new Error('branch-street-limit');
    if (branch.streets.length) result.branchRowsWithStreetDetails++;
    for (const street of branch.streets) {
      if (!exactKeys(street, ['street_name', 'street_numbers'])
        || typeof street.street_name !== 'string' || typeof street.street_numbers !== 'string') throw new Error('branch-street-schema');
      if (!street.street_name.trim()) result.streetEntriesMissingName++;
      if (!street.street_numbers.trim()) result.streetEntriesMissingNumbers++;
    }
  }
  const duplicateCodes = repeatedCounts(codes), duplicateIds = repeatedCounts(ids);
  return { ...result, distinctPostcodes: codes.size, distinctPresentationIds: ids.size,
    duplicatePostcodeGroups: duplicateCodes.length, rowsInDuplicatePostcodeGroups: duplicateCodes.reduce((a, n) => a + n, 0),
    duplicatePresentationIdGroups: duplicateIds.length,
    postcodeUniqueWithinResponse: data.branches.length > 0 && duplicateCodes.length === 0 && result.invalidPostcodeRows === 0,
    codeAndBasicRowChecksPassed: data.branches.length > 0 && result.invalidPostcodeRows === 0 && duplicateIds.length === 0
      && result.missingTitleRows === 0 && result.missingCityRows === 0 && result.missingRegionRows === 0 && result.missingOfficeAddressRows === 0,
    postcodeIsStableObjectKey: false, stableProviderObjectIdsVerified: false, postalRecordClassesVerified: false,
    coordinateReferenceSystem: null, coordinateAccuracyVerified: false, spatialCoverageVerified: false,
    currentAssignmentVerified: false, sourceEdition: null, validFrom: null, validTo: null,
    readyForAddressContextIngestion: false, postalGeometryRecords: 0, civicAddressesVerified: 0, buildingLinksVerified: 0,
  };
}

export function profileAzBranchHtml(bytes) {
  if (bytes.length > PROFILE.branch_probe.max_response_bytes) throw new Error('reference-byte-limit');
  let html;
  try { html = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new Error('branch-invalid-utf8'); }
  const matches = [...html.matchAll(/\s:branches\s*=\s*(["'])([\s\S]*?)\1/g)];
  if (matches.length !== 1) throw new Error('branch-attribute-count');
  // Decode once, then strict JSON.parse. No JavaScript evaluation or search endpoint execution.
  const entities = { quot: '"', apos: "'", amp: '&', lt: '<', gt: '>' };
  let decoded, data;
  try {
    decoded = matches[0][2].replace(/&(quot|apos|amp|lt|gt|#(?:x[0-9a-f]+|\d+));/gi, (_, entity) =>
      entity[0] === '#' ? String.fromCodePoint(Number.parseInt(entity.slice(entity[1].toLowerCase() === 'x' ? 2 : 1), entity[1].toLowerCase() === 'x' ? 16 : 10)) : entities[entity.toLowerCase()]);
    data = JSON.parse(decoded);
  } catch { throw new Error('branch-json-invalid'); }
  return { ...summarizeAzBranches(data), responseDigest: sourceDigest(bytes),
    embeddedJsonDigest: sourceDigest(Buffer.from(decoded, 'utf8')), byteLength: bytes.length,
    parser: 'azerpost-single-branches-attribute-json/v1', responseIsRetainedSourceSnapshot: false };
}

export async function inspectAzSources(fetcher = fetch) {
  const observedAt = new Date().toISOString(), references = [];
  // Only fixed public references. No individual address query, registry search, login or crawl.
  for (let offset = 0; offset < PROFILE.reference_probes.length; offset += 3) {
    references.push(...await Promise.all(PROFILE.reference_probes.slice(offset, offset + 3).map(async reference => {
      try { return { ...await probeAzReference(reference, fetcher), observedAt: new Date().toISOString() }; }
      catch (error) { return { id: reference.id, requestedUrl: reference.url, observedAt: new Date().toISOString(), status: 'fetch-error', contentVerified: false, error: safeError(error) }; }
    })));
  }
  let branchObservation;
  const probe = PROFILE.branch_probe;
  try {
    const { metadata, bytes } = await fetchBoundedOfficialResponse(probe.url, { allowedHosts: HOSTS, fetcher, maxBytes: probe.max_response_bytes });
    const base = { ...metadata, observedAt: new Date().toISOString() };
    if (!bytes) branchObservation = { ...base, status: 'http-error' };
    else if ((metadata.contentType ?? '').split(';')[0].trim().toLowerCase() !== 'text/html') branchObservation = { ...base, status: 'unexpected-content', responseDigest: sourceDigest(bytes) };
    else {
      try { branchObservation = { ...base, status: 'branch-directory-observed-not-m2', validation: profileAzBranchHtml(bytes) }; }
      catch (error) { branchObservation = { ...base, status: 'preflight-error', responseDigest: sourceDigest(bytes), error: safeError(error) }; }
    }
  } catch (error) { branchObservation = { requestedUrl: probe.url, observedAt: new Date().toISOString(), status: 'fetch-error', error: safeError(error) }; }
  return { schemaVersion: 'postal-context-az-source-review/v1', countryCode: 'AZ', observedAt, status: 'source-preflight-not-m2',
    references, branchObservation, sourceDataSnapshotsPersisted: 0, publishedDataArtifacts: 0,
    rightsForPublicTransformedArtifactsCleared: false, realAgidRuntimeVerified: false, countryM2Achieved: false,
    note: 'Aggregate review only. No source rows, office addresses, street names/numbers, coordinate pairs, contact details or source response bodies are persisted. Hashes and reference access are not a current data release, rights clearance, geographic coverage or M2.' };
}

function safeError(error) {
  if (error.name === 'TimeoutError') return 'timeout';
  if (error.cause?.code === 'CERT_HAS_EXPIRED') return 'tls-certificate-expired';
  if (error.cause?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') return 'tls-certificate-unverified';
  if (error.cause?.code === 'ENOTFOUND') return 'dns-not-found';
  if (['branch-root-schema', 'branch-row-limit', 'branch-record-schema', 'branch-street-schema', 'branch-street-limit',
    'branch-invalid-utf8', 'branch-attribute-count', 'branch-json-invalid', 'reference-byte-limit', 'unapproved-reference-host',
    'reference-redirect-limit'].includes(error.message)) return error.message;
  return 'network-or-parser-error';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--report') throw new Error('usage: node scripts/inspect-postal-context-az-sources.mjs --report new-report.json');
  const output = resolve(args[1]); if (existsSync(output)) throw new Error('report-already-exists');
  const report = await inspectAzSources();
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ references: report.references.map(r => ({ id: r.id, status: r.status, error: r.error, missingMarkers: r.missingMarkers })), branchObservation: report.branchObservation, countryM2Achieved: false }, null, 2));
}
