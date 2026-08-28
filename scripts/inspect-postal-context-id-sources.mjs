import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBoundedOfficialResponse, sourceDigest } from './lib/postal-context-source-probe.mjs';

const P = JSON.parse(readFileSync(new URL('../data/postal_country_packs/id/postal-context/m2-source-review.json', import.meta.url)));
const HOSTS = new Set(['kodepos.posindonesia.co.id', 'data.go.id', 'opendata.jabarprov.go.id']);
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const decode = bytes => {
  if (!bytes.length || bytes.length > P.limits.max_response_bytes) throw new Error('id-byte-limit');
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new Error('id-invalid-utf8'); }
};
const clean = text => {
  const value = text.replace(/&([^;\s]+);/g, (_, key) => {
    const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
    if (Object.hasOwn(entities, key)) return entities[key];
    if (!/^#(?:x[0-9a-f]+|\d+)$/i.test(key)) throw new Error('id-unknown-entity');
    const hex = key[1].toLowerCase() === 'x', n = Number.parseInt(key.slice(hex ? 2 : 1), hex ? 16 : 10);
    if (!n || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) throw new Error('id-invalid-entity');
    return String.fromCodePoint(n);
  }).normalize('NFC').trim().replace(/\s+/g, ' ');
  if (value.length > P.limits.max_text_characters || /[<>\u0000-\u001f\u007f]/.test(value)) throw new Error('id-field-text');
  return value;
};
const withoutComments = html => html.replace(/<!--[\s\S]*?-->/g, '');
const plainDocument = html => withoutComments(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);

export function profileIdSearchForm(bytes) {
  const html = withoutComments(decode(bytes));
  const forms = [...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)].filter(m => m[2].includes('name="kodepos"'));
  if (forms.length !== 1 || !forms[0][1].includes(`action="${P.postal_probe.search_url}"`) || !/method="post"/i.test(forms[0][1])) throw new Error('id-form-contract');
  if ((forms[0][2].match(/<input\b/gi) ?? []).length !== 1 || !forms[0][2].includes('type="text"')) throw new Error('id-form-input-contract');
  return { publicFormVerified: true, authenticationRequiredByReviewedForm: false,
    rightsReservedMarkerPresent: plainDocument(html).includes(P.postal_probe.rights_marker),
    activeDownloadLinkPresent: /href="[^"\s]*\/CariKodepos\/download"/.test(html),
    bulkApiDocumented: false, redistributionRightsCleared: false };
}

export function profileIdPostalResult(bytes) {
  const html = withoutComments(decode(bytes));
  const tables = [...html.matchAll(/<table\b[^>]*\bid="list-data"[^>]*>([\s\S]*?)<\/table>/gi)];
  if (tables.length !== 1) throw new Error('id-result-table');
  const table = tables[0][1];
  const heads = [...table.matchAll(/<thead>\s*<tr>([\s\S]*?)<\/tr>\s*<\/thead>/gi)];
  const bodies = [...table.matchAll(/<tbody>([\s\S]*?)<\/tbody>/gi)];
  if (heads.length !== 1 || bodies.length !== 1) throw new Error('id-result-sections');
  const headers = [...heads[0][1].matchAll(/<th>([^<]*)<\/th>/gi)].map(m => clean(m[1]));
  if (JSON.stringify(headers) !== JSON.stringify(P.postal_probe.headers) || heads[0][1].replace(/<th>[^<]*<\/th>/gi, '').trim()) throw new Error('id-result-headers');
  if (table.replace(heads[0][0], '').replace(bodies[0][0], '').trim()) throw new Error('id-result-extra-markup');
  const matches = [...bodies[0][1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)];
  if (!matches.length || matches.length > P.limits.max_rows_per_query || bodies[0][1].replace(/<tr>[\s\S]*?<\/tr>/gi, '').trim()) throw new Error('id-result-rows');
  const codes = new Set(), provinces = new Set(), tuples = new Map(), labels = new Map(), codeTuples = new Map();
  let missingCodes = 0, invalidCodes = 0, incompleteLocalityRows = 0, repeatedDisplayOrdinals = 0;
  const ordinals = new Set(), canonicalRows = [];
  for (const m of matches) {
    const cells = [...m[1].matchAll(/<td>([^<]*)<\/td>/gi)].map(c => clean(c[1]));
    if (cells.length !== 6 || m[1].replace(/<td>[^<]*<\/td>/gi, '').trim()) throw new Error('id-result-cells');
    const [ordinal, code, ...locality] = cells;
    if (!/^[1-9]\d*$/.test(ordinal) || !Number.isSafeInteger(Number(ordinal))) throw new Error('id-display-ordinal');
    if (ordinals.has(ordinal)) repeatedDisplayOrdinals++; ordinals.add(ordinal);
    if (!code) missingCodes++; else if (!/^[1-9]\d{4}$/.test(code)) invalidCodes++; else codes.add(code);
    if (locality.some(v => !v)) incompleteLocalityRows++;
    provinces.add(locality[3]);
    const tuple = JSON.stringify([code, ...locality]), label = JSON.stringify(locality);
    canonicalRows.push(tuple); bump(tuples, tuple);
    if (!labels.has(label)) labels.set(label, new Set()); labels.get(label).add(code);
    if (!codeTuples.has(code)) codeTuples.set(code, new Set()); codeTuples.get(code).add(label);
  }
  const n = matches.length, duplicates = [...tuples.values()].reduce((s, v) => s + Math.max(v - 1, 0), 0);
  return { observedRows: n, distinctValidCodes: codes.size, distinctProvinceLabels: provinces.size,
    missingCodeRows: missingCodes, missingCodeRate: missingCodes / n, invalidCodeRows: invalidCodes, invalidCodeRate: invalidCodes / n,
    incompleteLocalityRows, incompleteLocalityRate: incompleteLocalityRows / n, repeatedDisplayOrdinals,
    distinctLocalityTuples: labels.size, localityTuplesWithMultipleCodes: [...labels.values()].filter(v => v.size > 1).length,
    codesWithMultipleLocalityTuples: [...codeTuples.values()].filter(v => v.size > 1).length,
    excessDuplicateTupleRows: duplicates, excessDuplicateTupleRate: duplicates / n,
    normalizedTupleMultisetDigest: sourceDigest(Buffer.from(JSON.stringify(canonicalRows.sort()))),
    observedShapeValid: missingCodes + invalidCodes + incompleteLocalityRows + repeatedDisplayOrdinals === 0,
    geometryType: 'none', geometryRecords: 0, civicAddressRelations: 0, exactBuildingRelations: 0,
    coordinateRecords: 0, stableRecordIdentityVerified: false, assignmentEdition: null, assignmentValidity: null,
    currentNationalCoverageVerified: false, sourceRowsPersisted: 0, deduplicatedRows: 0, inferredCodes: 0 };
}

// Read the one JSON-valued response property, never evaluate the page's scripts.
// Unrelated account/contact fields are neither traversed nor returned/logged.
function catalogResponse(html) {
  let stream = '';
  for (const m of html.matchAll(/self\.__next_f\.push\((\[[\s\S]*?\])\)/g)) {
    let part; try { part = JSON.parse(m[1]); } catch { throw new Error('id-catalog-stream'); }
    if (part[0] === 1 && typeof part[1] === 'string') stream += part[1];
  }
  const starts = [...stream.matchAll(/"response":\{/g)];
  if (starts.length !== 1) throw new Error('id-catalog-response-count');
  const start = starts[0].index + '"response":'.length;
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < stream.length; i++) {
    const ch = stream[i];
    if (quoted) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === '"') quoted = false; continue; }
    if (ch === '"') { quoted = true; continue; }
    if (ch === '{') { if (++depth > 64) throw new Error('id-catalog-depth'); }
    else if (ch === '}' && --depth === 0) {
      try { return JSON.parse(stream.slice(start, i + 1)); } catch { throw new Error('id-catalog-json'); }
    }
  }
  throw new Error('id-catalog-truncated');
}

export function profileIdCatalog(bytes) {
  const html = decode(bytes), data = catalogResponse(html), spec = P.catalog_probe;
  if (!object(data) || data.id !== spec.dataset_id || data.name !== spec.dataset_name || data.organization?.title !== spec.provider) throw new Error('id-catalog-identity');
  if (typeof data.isopen !== 'boolean' || typeof data.private !== 'boolean' || !Object.hasOwn(data, 'license_title')
    || !(data.license_title === null || typeof data.license_title === 'string') || !Array.isArray(data.extras)
    || !Number.isSafeInteger(data.num_resources) || data.num_resources < 0 || !Array.isArray(data.resources)
    || data.resources.length !== data.num_resources) throw new Error('id-catalog-fields');
  for (const key of ['metadata_created', 'metadata_modified']) if (typeof data[key] !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(data[key]) || !Number.isFinite(Date.parse(data[key] + 'Z'))) throw new Error('id-catalog-date');
  const reviews = data.extras.filter(e => object(e) && e.key === 'review_status');
  if (reviews.length !== 1 || !['rejected', 'approved', 'pending'].includes(reviews[0].value)) throw new Error('id-catalog-review-status');
  const plain = plainDocument(html), publicLabelPresent = new RegExp(`\\b${spec.public_label}\\b`).test(plain);
  return { datasetId: data.id, datasetName: data.name, provider: data.organization.title,
    metadataCreated: data.metadata_created, metadataModified: data.metadata_modified, metadataTimestampTimezone: 'not-stated',
    declaredOpen: data.isopen, declaredPrivate: data.private, declaredLicenseTitle: data.license_title === null ? null : clean(data.license_title),
    reviewStatus: reviews[0].value, declaredResourceCount: data.num_resources, publicLabelPresent,
    reviewNoticePresent: plain.includes(spec.review_notice), publicLabelConflictsWithAccessFlags: publicLabelPresent && (data.private || !data.isopen),
    bulkResourceRequests: 0, sourceDataRecords: 0, assignmentEdition: null, currentNationalCoverageVerified: false, redistributionRightsCleared: false };
}

const safeError = e => /^id-[a-z-]+$/.test(e.message) ? e.message : 'network-or-parser-error';
const receipt = (metadata, bytes) => ({ ...metadata, observedAt: new Date().toISOString(), byteLength: bytes?.length ?? 0, responseDigest: bytes ? sourceDigest(bytes) : null });
async function search(query, fetcher) {
  if (!P.postal_probe.queries.includes(query)) throw new Error('id-query-not-reviewed');
  const url = P.postal_probe.search_url;
  const r = await fetcher(url, { method: 'POST', redirect: 'manual', credentials: 'omit', signal: AbortSignal.timeout(P.limits.timeout_ms),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ kodepos: query }).toString() });
  if (r.status !== 200 || !r.body || (r.headers.get('content-type') ?? '').split(';')[0] !== 'text/html') { await r.body?.cancel(); throw new Error('id-search-status-or-mime'); }
  if (Number(r.headers.get('content-length') ?? 0) > P.limits.max_response_bytes) { await r.body.cancel(); throw new Error('id-byte-limit'); }
  const chunks = []; let n = 0;
  for await (const chunk of r.body) { n += chunk.length; if (n > P.limits.max_response_bytes) throw new Error('id-byte-limit'); chunks.push(chunk); }
  const bytes = Buffer.concat(chunks);
  return { ...receipt({ requestedUrl: url, finalUrl: url, redirects: [], httpStatus: r.status, contentType: r.headers.get('content-type'), lastModified: r.headers.get('last-modified') }, bytes),
    query, method: 'POST', profile: profileIdPostalResult(bytes) };
}

export async function inspectIdSources(fetcher = fetch) {
  const report = { schemaVersion: 'postal-context-id-source-review/v1', countryCode: 'ID', observedAt: new Date().toISOString(),
    postalForm: null, postalSearch: [], catalog: null, publisher: null,
    sourceRowsPersisted: 0, sourceSnapshotsRetained: 0, bulkResourceRequests: 0, userAuthenticationPerformed: false,
    embeddedAccountFieldsPersisted: false, contractAcceptancePerformed: false, paidOperations: 0,
    publishedDataArtifacts: 0, realAgidRuntimeVerified: false, countryM2Achieved: false };
  for (const [key, url, profile] of [['postalForm', P.postal_probe.form_url, profileIdSearchForm], ['catalog', P.catalog_probe.url, profileIdCatalog], ['publisher', P.catalog_probe.publisher_url, null]]) {
    try {
      const r = await fetchBoundedOfficialResponse(url, { allowedHosts: HOSTS, fetcher, maxBytes: P.limits.max_response_bytes });
      const record = receipt(r.metadata, r.bytes);
      if (!r.bytes) report[key] = { ...record, status: 'http-error', sourceDataRecords: 0 };
      else if ((r.metadata.contentType ?? '').split(';')[0] !== 'text/html') report[key] = { ...record, status: 'unexpected-mime', sourceDataRecords: 0 };
      else {
        try { report[key] = { ...record, status: profile ? 'metadata-or-form-verified-not-data' : 'reference-only-not-data', ...(profile ? { profile: profile(r.bytes) } : {}), sourceDataRecords: 0 }; }
        catch (e) { report[key] = { ...record, status: 'parser-error', error: safeError(e), sourceDataRecords: 0 }; }
      }
    } catch (e) { report[key] = { requestedUrl: url, observedAt: new Date().toISOString(), status: 'fetch-error', error: safeError(e), sourceDataRecords: 0 }; }
  }
  if (report.postalForm?.profile?.publicFormVerified) {
    for (const query of [...P.postal_probe.queries, P.postal_probe.repeat_query]) {
      try { report.postalSearch.push(await search(query, fetcher)); }
      catch (e) { report.postalSearch.push({ query, observedAt: new Date().toISOString(), status: 'probe-error', error: safeError(e) }); break; }
    }
  }
  const repeated = report.postalSearch.filter(r => r.query === P.postal_probe.repeat_query);
  report.repeat = { query: P.postal_probe.repeat_query, verifiedObservations: repeated.filter(r => r.profile).length,
    byteIdentical: repeated.length === 2 && repeated.every(r => r.profile) && repeated[0].responseDigest === repeated[1].responseDigest,
    tupleMultisetIdentical: repeated.length === 2 && repeated.every(r => r.profile) && repeated[0].profile.normalizedTupleMultisetDigest === repeated[1].profile.normalizedTupleMultisetDigest,
    atomicOrNationalSnapshotVerified: false };
  report.completedAt = new Date().toISOString();
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--report') throw new Error('usage: node scripts/inspect-postal-context-id-sources.mjs --report new.json');
  const output = resolve(args[1]); if (existsSync(output)) throw new Error('report-already-exists');
  const report = await inspectIdSources(); mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ country: 'ID', postalRows: report.postalSearch.map(r => r.profile?.observedRows ?? null), catalog: report.catalog?.profile ?? report.catalog?.status,
    publisherStatus: report.publisher?.httpStatus ?? report.publisher?.status, countryM2Achieved: false }));
}
