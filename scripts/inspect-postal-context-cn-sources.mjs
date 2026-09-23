import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBoundedOfficialResponse, probeOfficialReference, sourceDigest } from './lib/postal-context-source-probe.mjs';

const PROFILE = JSON.parse(readFileSync(new URL('../data/postal_country_packs/cn/postal-context/m2-source-review.json', import.meta.url)));
const L = PROFILE.locator_probe;
const HOSTS = new Set([L.page_url, ...PROFILE.reference_probes.map(p => p.url)].map(u => new URL(u).hostname));
const exactKeys = (object, keys) => object && typeof object === 'object' && !Array.isArray(object)
  && JSON.stringify(Object.keys(object).sort()) === JSON.stringify([...keys].sort());
const text = bytes => {
  if (bytes.length > PROFILE.limits.max_response_bytes) throw new Error('cn-byte-limit');
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error('cn-invalid-utf8'); }
};
const validPage = page => { if (!L.reviewed_pages.includes(page)) throw new Error('cn-page-not-reviewed'); };

export function inspectCnPageContract(bytes) {
  const html = text(bytes);
  if (L.page_markers.some(marker => !html.includes(marker))) throw new Error('cn-page-contract-drift');
  return { reviewedMarkersPresent: true, javascriptExecuted: false, endpointDerivedFromUntrustedInput: false };
}

export function parseCnOutletResponse(bytes, page) {
  validPage(page);
  let data;
  try { data = JSON.parse(text(bytes)); }
  catch (error) { if (error.message.startsWith('cn-')) throw error; throw new Error('cn-invalid-json'); }
  if (!exactKeys(data, L.response_fields) || data.code !== L.success_code || data.success !== true
    || data.page !== page || data.size !== L.page_size || !Number.isSafeInteger(data.total)
    || data.total < 0 || data.total > PROFILE.limits.max_reported_total || !Array.isArray(data.list)) throw new Error('cn-response-schema');
  const expectedRows = Math.max(0, Math.min(L.page_size, data.total - (page - 1) * L.page_size));
  if (data.list.length !== expectedRows) throw new Error('cn-response-page-length');
  const keys = [...L.row_string_fields, ...L.row_integer_fields, L.row_boolean_array_field];
  const rows = data.list.map(row => {
    if (!exactKeys(row, keys) || L.row_string_fields.some(k => typeof row[k] !== 'string'
      || row[k].length > PROFILE.limits.max_string_characters || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(row[k]))
      || L.row_integer_fields.some(k => !Number.isSafeInteger(row[k]))
      || !Array.isArray(row.dayFlags) || row.dayFlags.length !== 7 || row.dayFlags.some(f => typeof f !== 'boolean')) throw new Error('cn-row-schema');
    // Drop contact, address and service-time contents immediately; never emit or
    // persist them. The remaining labels exist only for in-memory aggregate checks.
    return { labels: [row.province, row.cities, row.county, row.sitename, row.sitenameSuffix], code: row.zipcode,
      addressPresent: Boolean(row.address.trim()), suspensionLabelPresent: Boolean(row.ztstop.trim()),
      resumptionLabelPresent: Boolean(row.hfstart.trim()) };
  });
  return { reportedTotal: data.total, rows };
}

export function profileCnOutlets(rows) {
  if (!Array.isArray(rows) || rows.length > L.reviewed_pages.length * L.page_size) throw new Error('cn-profile-limit');
  const tuples = new Map(), offices = new Set(), codes = new Map();
  const fields = ['province', 'cities', 'county', 'sitename', 'zipcode', 'address'];
  const missing = Object.fromEntries(fields.map(k => [k, 0]));
  let invalidPostcodeRows = 0, noncanonicalPostcodeRows = 0, suspensionLabels = 0, resumptionLabels = 0;
  for (const row of rows) {
    if (!row || !Array.isArray(row.labels) || row.labels.length !== 5 || row.labels.some(s => typeof s !== 'string')
      || typeof row.code !== 'string' || ['addressPresent', 'suspensionLabelPresent', 'resumptionLabelPresent'].some(k => typeof row[k] !== 'boolean')) throw new Error('cn-profile-row');
    row.labels.slice(0, 4).forEach((value, i) => { if (!value.trim()) missing[fields[i]]++; });
    if (!row.code.trim()) missing.zipcode++;
    if (!row.addressPresent) missing.address++;
    const code = row.code.trim();
    if (code && !/^[0-9]{6}$/.test(code)) invalidPostcodeRows++;
    if (row.code !== code) noncanonicalPostcodeRows++;
    // Comparison only: do not normalize returned source values or correct labels.
    const office = JSON.stringify(row.labels.map(s => s.normalize('NFC').trim().replace(/\s+/g, ' ')));
    offices.add(office);
    const tuple = JSON.stringify([office, code]);
    tuples.set(tuple, (tuples.get(tuple) ?? 0) + 1);
    if (/^[0-9]{6}$/.test(code)) {
      if (!codes.has(code)) codes.set(code, new Set());
      codes.get(code).add(office);
    }
    suspensionLabels += Number(row.suspensionLabelPresent); resumptionLabels += Number(row.resumptionLabelPresent);
  }
  const duplicates = [...tuples.values()].filter(n => n > 1), excess = duplicates.reduce((a, n) => a + n - 1, 0);
  return { observedRows: rows.length, missingFieldRows: missing,
    missingFieldRates: Object.fromEntries(fields.map(k => [k, rows.length ? missing[k] / rows.length : null])),
    invalidPostcodeRows, invalidPostcodeRate: rows.length ? invalidPostcodeRows / rows.length : null,
    noncanonicalPostcodeRows, distinctOfficeLabelTuples: offices.size, distinctPostcodes: codes.size,
    duplicateComparisonTupleGroups: duplicates.length, excessDuplicateComparisonRows: excess,
    duplicateComparisonExcessRate: rows.length ? excess / rows.length : null,
    postcodesSharedByDifferentOfficeLabels: [...codes.values()].filter(s => s.size > 1).length,
    serviceSuspensionLabelRows: suspensionLabels, serviceResumptionLabelRows: resumptionLabels,
    sourceAssignmentEdition: null, stableRecordIdentityVerified: false, currentNationalCoverageVerified: false,
    serviceDatesArePostalValidity: false, geometryType: 'none', postalGeometryRecords: 0,
    civicAddressRelations: 0, exactBuildingRelations: 0, rowsDeduplicated: 0, postcodesInferred: 0 };
}

export async function fetchCnOutletPage(page, fetcher = fetch) {
  validPage(page);
  const requestedAt = new Date().toISOString();
  // The reviewed page uses POST for read-only public search. Fixed endpoint and
  // parameters only; no cookies, caller-supplied filters, credentials or redirects.
  const response = await fetcher(L.search_url, { method: 'POST', redirect: 'manual', credentials: 'omit',
    signal: AbortSignal.timeout(PROFILE.limits.timeout_ms), headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ act: L.action, page: String(page), size: String(L.page_size), community: L.community }).toString() });
  if (response.status !== 200 || !response.body || (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase() !== L.expected_mime) {
    await response.body?.cancel(); throw new Error('cn-search-http-or-mime');
  }
  if (Number(response.headers.get('content-length') ?? 0) > PROFILE.limits.max_response_bytes) {
    await response.body.cancel(); throw new Error('cn-byte-limit');
  }
  const chunks = []; let total = 0;
  for await (const chunk of response.body) {
    total += chunk.length;
    if (total > PROFILE.limits.max_response_bytes) throw new Error('cn-byte-limit');
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks), parsed = parseCnOutletResponse(bytes, page);
  return { rows: parsed.rows, observation: { requestedUrl: L.search_url, requestedAt, observedAt: new Date().toISOString(),
    method: 'POST', page, pageSize: L.page_size, reportedTotal: parsed.reportedTotal,
    httpStatus: response.status, contentType: response.headers.get('content-type'), lastModified: response.headers.get('last-modified'),
    responseDigest: sourceDigest(bytes), byteLength: bytes.length, validation: profileCnOutlets(parsed.rows) } };
}

const safeError = error => {
  if (/^cn-[a-z-]+$/.test(error.message)) return error.message;
  if (['EACCES', 'ENOTFOUND', 'ECONNRESET', 'UND_ERR_CONNECT_TIMEOUT'].includes(error.cause?.code)) return error.cause.code;
  if (['TimeoutError', 'AbortError'].includes(error.name)) return 'timeout';
  if (['reference-byte-limit', 'reference-redirect-limit', 'unapproved-reference-host'].includes(error.message)) return error.message;
  return 'network-or-parser-error';
};

export async function inspectCnSources(fetcher = fetch) {
  const observedAt = new Date().toISOString(), references = [], pages = [], rows = [];
  for (const reference of PROFILE.reference_probes) {
    try { references.push({ ...await probeOfficialReference(reference, HOSTS, fetcher), observedAt: new Date().toISOString() }); }
    catch (error) { references.push({ id: reference.id, requestedUrl: reference.url, observedAt: new Date().toISOString(), status: 'fetch-error', contentVerified: false, error: safeError(error) }); }
  }
  let pageContract = null, repeatedPage = null;
  try {
    const { metadata, bytes } = await fetchBoundedOfficialResponse(L.page_url, { allowedHosts: HOSTS, fetcher });
    if (!bytes || (metadata.contentType ?? '').split(';')[0].trim().toLowerCase() !== 'text/html') throw new Error('cn-page-http-or-mime');
    pageContract = { ...metadata, observedAt: new Date().toISOString(), responseDigest: sourceDigest(bytes), byteLength: bytes.length,
      validation: inspectCnPageContract(bytes) };
    for (const page of L.reviewed_pages) {
      const result = await fetchCnOutletPage(page, fetcher);
      rows.push(...result.rows); pages.push(result.observation);
    }
    const repeat = await fetchCnOutletPage(L.repeat_page, fetcher);
    repeatedPage = { ...repeat.observation,
      byteIdenticalToFirstResponse: repeat.observation.responseDigest === pages[0].responseDigest };
  } catch (error) { pages.push({ status: 'probe-error', error: safeError(error), observedAt: new Date().toISOString() }); }
  const successes = pages.filter(p => p.validation), totals = successes.map(p => p.reportedTotal);
  return { schemaVersion: 'postal-context-cn-source-review/v1', countryCode: 'CN', observedAt, completedAt: new Date().toISOString(),
    status: 'source-preflight-not-m2', references, locatorObservation: { pageContract, pages, repeatedPage,
      aggregate: profileCnOutlets(rows), successfulPages: successes.length, expectedReviewedPages: L.reviewed_pages.length,
      allReviewedRequestsSucceeded: successes.length === L.reviewed_pages.length && repeatedPage !== null,
      reportedTotalsAgree: totals.length === L.reviewed_pages.length && new Set([...totals, repeatedPage?.reportedTotal]).size === 1,
      observedRowFractionOfReportedOutletTotal: totals[0] > 0 ? rows.length / totals[0] : null,
      fractionIsNationalPostalCoverage: false, atomicSnapshotVerified: false, sourceRowsPersisted: 0,
      orderedResponseManifestDigest: sourceDigest(Buffer.from(JSON.stringify(successes.map(p => [p.page, p.responseDigest, p.byteLength])))) },
    authenticationPerformed: false, tlsVerificationDisabled: false, privateQueriesPerformed: false, contractAcceptancePerformed: false,
    sourceSnapshotsRetainedForPublication: 0, publishedDataArtifacts: 0, rightsForPublicM2ArtifactCleared: false,
    realAgidRuntimeVerified: false, countryM2Achieved: false,
    note: 'Read-only outlet sample, not complete assignment data. Response hashes and aggregate counts only; no outlet/address/phone rows retained. Counts, service schedules and names do not define postal validity, official geometry, civic addresses or buildings. This inspector never promotes a country.' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--report') throw new Error('usage: node scripts/inspect-postal-context-cn-sources.mjs --report new.json');
  const output = resolve(args[1]); if (existsSync(output)) throw new Error('report-already-exists');
  const report = await inspectCnSources();
  mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ references: report.references.map(r => ({ id: r.id, status: r.status, error: r.error })),
    pages: report.locatorObservation.successfulPages, aggregate: report.locatorObservation.aggregate, countryM2Achieved: false }, null, 2));
}
