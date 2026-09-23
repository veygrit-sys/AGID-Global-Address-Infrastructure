import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBoundedOfficialResponse, probeOfficialReference, sourceDigest } from './lib/postal-context-source-probe.mjs';

const PROFILE = JSON.parse(readFileSync(new URL('../data/postal_country_packs/bt/postal-context/m2-source-review.json', import.meta.url)));
const LOCATOR = PROFILE.locator_probe;
const HOSTS = new Set([LOCATOR.form_url, ...PROFILE.reference_probes.map(p => p.url)].map(url => new URL(url).hostname));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const normalized = value => value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
const repeats = map => [...map.values()].filter(n => n > 1);
const decode = bytes => {
  if (bytes.length > PROFILE.limits.max_response_bytes) throw new Error('bt-byte-limit');
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error('bt-invalid-utf8'); }
};
const entities = text => text.replace(/&([^;\s]{1,32});/g, (_, entity) => {
  const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
  if (Object.hasOwn(named, entity)) return named[entity];
  if (!/^#(?:x[0-9a-f]+|\d+)$/i.test(entity)) throw new Error('bt-unknown-entity');
  const hex = entity[1].toLowerCase() === 'x', n = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
  if (n === 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) throw new Error('bt-invalid-entity');
  return String.fromCodePoint(n);
});
const plain = text => {
  if (/[<>]/.test(text)) throw new Error('bt-cell-markup');
  const result = entities(text).normalize('NFC').trim().replace(/\s+/g, ' ');
  if (result.length > PROFILE.limits.max_string_characters || /[\u0000-\u001f\u007f]/.test(result)) throw new Error('bt-cell-text');
  return result;
};
const attribute = (tag, name) => {
  const matches = [...tag.matchAll(new RegExp('(?:^|\\s)' + name + '\\s*=\\s*([\x22\x27])([^\x22\x27]*)\\1', 'gi'))];
  if (matches.length !== 1) throw new Error('bt-form-attribute');
  return matches[0][2];
};

export function parseBtLocatorForm(bytes, pageUrl = LOCATOR.form_url) {
  if (![LOCATOR.form_url, LOCATOR.search_url].includes(pageUrl)) throw new Error('bt-form-url');
  const html = decode(bytes).replace(/<!--[\s\S]*?-->/g, '');
  const forms = [...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form\s*>/gi)];
  if (forms.length !== 1 || /<(?:script|iframe|object)\b/i.test(forms[0][2])) throw new Error('bt-form-schema');
  const [, attributes, body] = forms[0];
  if (attribute(attributes, 'method').toLowerCase() !== 'post'
    || new URL(attribute(attributes, 'action'), pageUrl).href !== LOCATOR.search_url) throw new Error('bt-form-target');
  const selects = [...body.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select\s*>/gi)];
  const inputs = [...body.matchAll(/<input\b([^>]*)>/gi)];
  if (selects.length !== 1 || attribute(selects[0][1], 'name') !== 'dzongkhag' || inputs.length !== 1
    || attribute(inputs[0][1], 'type') !== 'submit' || attribute(inputs[0][1], 'name') !== 'submit'
    || attribute(inputs[0][1], 'value') !== 'Search') throw new Error('bt-form-controls');
  // Accept only the observed legacy option syntax; never execute JavaScript.
  const options = [...selects[0][2].matchAll(/<option\s*\/?\s*>([^<]*)(?:<\/option\s*>)?/gi)].map(m => plain(m[1])).filter(Boolean);
  const residue = selects[0][2].replace(/<option\s*\/?\s*>[^<]*(?:<\/option\s*>)?/gi, '').replace(/<br\s*\/?\s*>/gi, '').trim();
  if (residue || !same(options, LOCATOR.reviewed_dzongkhag_options)) throw new Error('bt-form-options-drift');
  return { options, method: 'POST', target: LOCATOR.search_url, authenticationRequiredByReviewedForm: false };
}

export function parseBtLocatorTable(bytes, district) {
  if (!LOCATOR.reviewed_dzongkhag_options.includes(district)) throw new Error('bt-district');
  const html = decode(bytes).replace(/<!--[\s\S]*?-->/g, '');
  const tables = [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table\s*>/gi)].map(m => m[1]).filter(t => /<th\b/i.test(t));
  if (tables.length !== 1) throw new Error('bt-table-schema');
  const table = tables[0];
  const header = table.match(/^\s*<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/i);
  if (!header) throw new Error('bt-table-header');
  const headerCells = [...header[1].matchAll(/<th(?:\s+align=["']left["'])?\s*>([\s\S]*?)<\/th\s*>/gi)];
  const names = headerCells.map(m => plain(m[1].replace(/<\/?font\b[^>]*>/gi, '')));
  if (!same(names, LOCATOR.headers) || header[1].replace(/<th(?:\s+align=["']left["'])?\s*>[\s\S]*?<\/th\s*>/gi, '').trim()) throw new Error('bt-table-header');
  const segments = table.slice(header[0].length).split(/<\/tr\s*>/i), tail = segments.pop().trim();
  if (tail && !/^<tr\s*>\s*$/i.test(tail)) throw new Error('bt-partial-row');
  const rows = [], tags = { rowsMissingOpeningTag: 0, danglingEmptyOpeningRow: tail ? 1 : 0 };
  for (const segment of segments) {
    let content = segment.trim();
    if (/^<tr\s*>/i.test(content)) content = content.replace(/^<tr\s*>/i, '');
    else tags.rowsMissingOpeningTag++;
    const cells = [...content.matchAll(/<td\s*>([^<>]*)<\/td\s*>/gi)];
    if (cells.length !== 4 || content.replace(/<td\s*>[^<>]*<\/td\s*>/gi, '').trim()) throw new Error('bt-row-schema');
    rows.push(cells.map(m => plain(m[1])));
    if (rows.length > PROFILE.limits.max_rows_per_district) throw new Error('bt-row-limit');
  }
  return { rows, structure: { ...tags, explicitRowStructureValid: !tags.rowsMissingOpeningTag && !tags.danglingEmptyOpeningRow }, validation: profileBtRows(rows, district) };
}

export function profileBtRows(rows, district = null) {
  if (!Array.isArray(rows) || rows.length > PROFILE.limits.max_rows_per_district * PROFILE.limits.max_districts) throw new Error('bt-row-limit');
  const exact = new Map(), codes = new Map(), offices = new Map(), districts = new Set(), codeOffices = new Map();
  const missing = [0, 0, 0, 0];
  const r = { observedRows: rows.length, invalidPostcodeRows: 0, districtMismatchRows: 0, poBoxOfficeLabelRows: 0, officeKinds: {} };
  for (const row of rows) {
    if (!Array.isArray(row) || row.length !== 4 || row.some(s => typeof s !== 'string' || s.length > PROFILE.limits.max_string_characters)) throw new Error('bt-row-schema');
    row.forEach((s, i) => { if (!s.trim()) missing[i]++; });
    const [d, gewog, office, code] = row;
    if (d) districts.add(normalized(d));
    if (district && normalized(d) !== normalized(district)) r.districtMismatchRows++;
    if (code && !/^[0-9]{5}$/.test(code)) r.invalidPostcodeRows++;
    bump(exact, JSON.stringify(row.map(normalized)));
    if (office) bump(offices, JSON.stringify([normalized(d), normalized(gewog), normalized(office)]));
    if (/^[0-9]{5}$/.test(code)) {
      bump(codes, code);
      if (!codeOffices.has(code)) codeOffices.set(code, new Set());
      codeOffices.get(code).add(JSON.stringify([normalized(d), normalized(gewog), normalized(office)]));
    }
    const kind = office.match(/(?:^|\s)(GPO|PO|CMO|CC|PO\/CC|CC\/CMO)$/)?.[1] ?? 'unclassified';
    r.officeKinds[kind] = (r.officeKinds[kind] ?? 0) + 1;
    if (/p\.?\s*o\.?\s*box/i.test(office)) r.poBoxOfficeLabelRows++;
  }
  const duplicated = repeats(exact), repeatedCodes = repeats(codes);
  return { ...r, missingFieldRows: Object.fromEntries(LOCATOR.headers.map((name, i) => [name, missing[i]])),
    distinctDzongkhagLabels: districts.size, distinctPostcodes: codes.size, distinctOfficeTuples: offices.size,
    exactDuplicateGroups: duplicated.length, rowsInExactDuplicateGroups: duplicated.reduce((a, b) => a + b, 0),
    excessExactDuplicateRows: duplicated.reduce((a, b) => a + b - 1, 0),
    exactDuplicateExcessRate: rows.length ? duplicated.reduce((a, b) => a + b - 1, 0) / rows.length : null,
    repeatedPostcodeGroups: repeatedCodes.length, postcodesWithMultipleOfficeTuples: [...codeOffices.values()].filter(s => s.size > 1).length,
    rowsDeduplicated: 0, labelsCorrected: 0, postcodesInferred: 0, geometryType: 'none',
    stableRecordIdentityVerified: false, sourceAssignmentEdition: null, currentNationalCoverageVerified: false,
    postalGeometryRecords: 0, civicAddressRelations: 0, exactBuildingRelations: 0 };
}

export async function fetchBtDistrict(district, fetcher = fetch) {
  if (!LOCATOR.reviewed_dzongkhag_options.includes(district)) throw new Error('bt-district');
  // This one pinned public search endpoint is the only POST allowed. No redirect,
  // cookies, credentials, arbitrary fields, private queries or authentication.
  const response = await fetcher(LOCATOR.search_url, { method: 'POST', redirect: 'manual', credentials: 'omit',
    signal: AbortSignal.timeout(PROFILE.limits.timeout_ms), headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ dzongkhag: district, submit: 'Search' }).toString() });
  if (response.status !== 200 || !response.body || (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase() !== 'text/html') {
    await response.body?.cancel(); throw new Error('bt-search-http-or-mime');
  }
  if (Number(response.headers.get('content-length') ?? 0) > PROFILE.limits.max_response_bytes) {
    await response.body.cancel(); throw new Error('bt-byte-limit');
  }
  const chunks = [], reader = response.body.getReader(); let total = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    total += value.length;
    if (total > PROFILE.limits.max_response_bytes) { await reader.cancel(); throw new Error('bt-byte-limit'); }
    chunks.push(value);
  }
  if (!total) throw new Error('bt-empty-response');
  const bytes = Buffer.concat(chunks);
  return { bytes, metadata: { requestedUrl: LOCATOR.search_url, method: 'POST', district, observedAt: new Date().toISOString(),
    httpStatus: response.status, contentType: response.headers.get('content-type'), lastModified: response.headers.get('last-modified'),
    responseDigest: sourceDigest(bytes), byteLength: bytes.length, redirectsFollowed: 0 } };
}

const safeError = error => {
  if (/^bt-[a-z-]+$/.test(error.message)) return error.message;
  if (['EACCES', 'ENOTFOUND', 'ECONNRESET', 'UND_ERR_CONNECT_TIMEOUT'].includes(error.cause?.code)) return error.cause.code;
  if (error.name === 'TimeoutError' || error.name === 'AbortError') return 'timeout';
  if (['unapproved-reference-host', 'reference-byte-limit', 'reference-redirect-limit'].includes(error.message)) return error.message;
  return 'network-or-parser-error';
};
async function observeForm(fetcher) {
  const { metadata, bytes } = await fetchBoundedOfficialResponse(LOCATOR.form_url, { allowedHosts: HOSTS, fetcher });
  if (!bytes || (metadata.contentType ?? '').split(';')[0].trim().toLowerCase() !== 'text/html') throw new Error('bt-form-http-or-mime');
  return { ...metadata, observedAt: new Date().toISOString(), responseDigest: sourceDigest(bytes), byteLength: bytes.length, validation: parseBtLocatorForm(bytes) };
}

export async function inspectBtSources(fetcher = fetch) {
  const observedAt = new Date().toISOString(), references = [], districts = [], rows = [];
  for (const probe of PROFILE.reference_probes) {
    try { references.push({ ...await probeOfficialReference(probe, HOSTS, fetcher), observedAt: new Date().toISOString() }); }
    catch (error) { references.push({ id: probe.id, requestedUrl: probe.url, observedAt: new Date().toISOString(), status: 'fetch-error', contentVerified: false, error: safeError(error) }); }
  }
  let before, after, repeatedDistrict, firstDistrictDigest;
  try {
    before = await observeForm(fetcher);
    for (const district of before.validation.options) {
      try {
        const result = await fetchBtDistrict(district, fetcher), parsed = parseBtLocatorTable(result.bytes, district);
        parseBtLocatorForm(result.bytes, LOCATOR.search_url);
        if (district === before.validation.options[0]) firstDistrictDigest = result.metadata.responseDigest;
        rows.push(...parsed.rows);
        districts.push({ ...result.metadata, status: 'profiled-not-publishable', structure: parsed.structure, validation: parsed.validation });
      } catch (error) { districts.push({ district, requestedUrl: LOCATOR.search_url, observedAt: new Date().toISOString(), status: 'district-error', error: safeError(error) }); }
    }
    after = await observeForm(fetcher);
    const repeat = await fetchBtDistrict(before.validation.options[0], fetcher);
    repeatedDistrict = { ...repeat.metadata, byteIdenticalToFirstResponse: Boolean(firstDistrictDigest && firstDistrictDigest === repeat.metadata.responseDigest) };
  } catch (error) { districts.push({ status: 'preflight-error', observedAt: new Date().toISOString(), error: safeError(error) }); }
  const successful = districts.filter(d => d.status === 'profiled-not-publishable');
  return { schemaVersion: 'postal-context-bt-source-review/v1', countryCode: 'BT', observedAt, completedAt: new Date().toISOString(),
    status: 'source-preflight-not-m2', references, locatorObservation: { before: before ?? null, after: after ?? null, districts,
      repeatedDistrict: repeatedDistrict ?? null, aggregate: profileBtRows(rows),
      observedDistricts: successful.length, expectedDistrictOptions: LOCATOR.reviewed_dzongkhag_options.length,
      allReviewedDistrictRequestsSucceeded: successful.length === LOCATOR.reviewed_dzongkhag_options.length,
      districtFormsUnchanged: Boolean(before && after && before.responseDigest === after.responseDigest),
      allDistrictResponsesNonempty: successful.length > 0 && successful.every(d => d.validation.observedRows > 0),
      allDistrictLabelsMatchSearch: successful.length > 0 && successful.every(d => d.validation.districtMismatchRows === 0),
      explicitTableStructureValid: successful.length > 0 && successful.every(d => d.structure.explicitRowStructureValid),
      orderedResponseManifestDigest: sourceDigest(Buffer.from(JSON.stringify(successful.map(d => [d.district, d.responseDigest, d.byteLength])))),
      atomicSnapshotVerified: false, stableVersionOrAllocationDateVerified: false, sourceRowsPersisted: 0 },
    tlsVerificationDisabled: false, authenticationPerformed: false, privateQueriesPerformed: false, contractAcceptancePerformed: false,
    sourceSnapshotsRetainedForPublication: 0, publishedDataArtifacts: 0, rightsForPublicM2ArtifactCleared: false,
    realAgidRuntimeVerified: false, countryM2Achieved: false,
    note: 'Only reference metadata, response hashes and aggregate counts are retained. Profiled public routing labels are not official polygons, civic addresses, exact buildings, a stable national edition or permission to redistribute. Malformed rows and duplicates are reported, not silently repaired.' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--report') throw new Error('usage: node scripts/inspect-postal-context-bt-sources.mjs --report new.json');
  const output = resolve(args[1]); if (existsSync(output)) throw new Error('report-already-exists');
  const report = await inspectBtSources();
  mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ references: report.references.map(r => ({ id: r.id, status: r.status, error: r.error })),
    districts: report.locatorObservation.observedDistricts, aggregate: report.locatorObservation.aggregate, countryM2Achieved: false }, null, 2));
}
