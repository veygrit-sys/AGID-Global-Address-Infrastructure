import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBoundedOfficialResponse, probeOfficialReference, sourceDigest } from './lib/postal-context-source-probe.mjs';
import { createPostalCurlFetcher } from './lib/postal-context-curl-fetch.mjs';

const PROFILE = JSON.parse(readFileSync(new URL('../data/postal_country_packs/bd/postal-context/m2-source-review.json', import.meta.url)));
const HOSTS = new Set([...PROFILE.table_probes, ...PROFILE.reference_probes].map(p => new URL(p.url).hostname));
const classes = ['GPO', 'HO', 'TSO', 'UPO', 'SO', 'EDSO', 'EDBO'];
const bengaliClasses = new Map([['জিপিও','GPO'], ['এইচও','HO'], ['টিএসও','TSO'], ['ইউপিও','UPO'], ['এসও','SO'], ['ইডিএসও','EDSO'], ['ইডিবিও','EDBO']]);
const asciiDigits = text => text.normalize('NFKC').replace(/[০-৯]/g, c => String(c.charCodeAt(0) - 0x09e6));
const canonicalCode = text => asciiDigits(text).replace(/\s/g, '');
const plain = html => html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]*>/g, ' ')
  .replace(/&(nbsp|amp|quot|apos|lt|gt|#(?:x[0-9a-f]+|\d+));/gi, (_, entity) => {
    if (entity[0] === '#') {
      const value = Number.parseInt(entity.slice(entity[1].toLowerCase() === 'x' ? 2 : 1), entity[1].toLowerCase() === 'x' ? 16 : 10);
      if (value > 0x10ffff || value === 0 || (value >= 0xd800 && value <= 0xdfff)) throw new Error('bd-invalid-entity');
      return String.fromCodePoint(value);
    }
    return ({nbsp:' ', amp:'&', quot:'"', apos:"'", lt:'<', gt:'>'})[entity.toLowerCase()];
  }).normalize('NFC').replace(/\s+/g, ' ').trim();
const duplicateCounts = map => [...map.values()].filter(count => count > 1);
export const probeBdReference = (reference, fetcher = fetch) => probeOfficialReference(reference, HOSTS, fetcher);

export function summarizeBdOfficeRows(rows, layout) {
  if (!['district-bilingual','regional-bengali'].includes(layout)) throw new Error('bd-unknown-layout');
  if (!Array.isArray(rows) || rows.length > PROFILE.limits.max_rows_per_table) throw new Error('bd-row-limit');
  const regional = layout === 'regional-bengali', codes = new Map(), rowKeys = new Map(), officeCodes = new Map();
  const result = {
    grain: 'source-qualified-office-row-not-postal-area-or-civic-address', layout, observedOfficeRows: rows.length,
    validCodeRows: 0, blankCodeRows: 0, invalidCodeRows: 0, bengaliDigitCodeRows: 0, mixedDigitCodeRows: 0,
    missingUpazilaRows: 0, missingOfficeNameRows: 0, missingDistrictRows: 0, missingBilingualNameRows: 0,
    missingAccountingOfficeRows: 0, missingHeadOfficeRows: 0,
    officeClassBasis: regional ? 'explicit-bengali-type-cell' : 'explicit-english-name-suffix',
    officeClasses: Object.fromEntries([...classes, 'unknown'].map(key => [key, 0])),
    blankCodeOfficeClasses: Object.fromEntries([...classes, 'unknown'].map(key => [key, 0])),
    serialSequenceMatchesRowOrder: regional ? null : rows.length > 0,
  };
  for (const [index, row] of rows.entries()) {
    if (!Array.isArray(row) || row.length !== (regional ? 7 : 5)
      || row.some(cell => typeof cell !== 'string' || cell.length > PROFILE.limits.max_cell_characters)) throw new Error('bd-row-schema');
    const values = row.map(cell => cell.normalize('NFC').replace(/\s+/g, ' ').trim());
    const upazila = values[1], name = values[2], code = canonicalCode(values[regional ? 5 : 4]);
    const suffix = name.replaceAll('.', '').match(/(?:^|\s)(GPO|HO|TSO|UPO|SO|EDSO|EDBO)$/i)?.[1].toUpperCase();
    const officeClass = regional ? bengaliClasses.get(values[6].replace(/[\s.]/g, '')) ?? 'unknown' : suffix ?? 'unknown';
    result.officeClasses[officeClass]++;
    if (!code) { result.blankCodeRows++; result.blankCodeOfficeClasses[officeClass]++; }
    else if (!/^[1-9]\d{3}$/.test(code)) result.invalidCodeRows++;
    else { result.validCodeRows++; codes.set(code, (codes.get(code) ?? 0) + 1); }
    const rawCode = values[regional ? 5 : 4];
    if (/[০-৯]/.test(rawCode)) result.bengaliDigitCodeRows++;
    if (/[০-৯]/.test(rawCode) && /[0-9]/.test(rawCode)) result.mixedDigitCodeRows++;
    if (!upazila) result.missingUpazilaRows++;
    if (!name) result.missingOfficeNameRows++;
    if (regional) {
      if (!values[0]) result.missingDistrictRows++;
      if (!values[3]) result.missingAccountingOfficeRows++;
      if (!values[4]) result.missingHeadOfficeRows++;
    } else {
      if (!values[3]) result.missingBilingualNameRows++;
      if (asciiDigits(values[0]) !== String(index + 1)) result.serialSequenceMatchesRowOrder = false;
    }
    const rowKey = JSON.stringify(regional ? values : values.slice(1));
    rowKeys.set(rowKey, (rowKeys.get(rowKey) ?? 0) + 1);
    const officeKey = JSON.stringify(regional ? values.slice(0, 3) : values.slice(1, 4));
    if (!officeCodes.has(officeKey)) officeCodes.set(officeKey, new Set());
    if (/^[1-9]\d{3}$/.test(code)) officeCodes.get(officeKey).add(code);
  }
  const repeatedCodes = duplicateCounts(codes), repeatedRows = duplicateCounts(rowKeys);
  return { ...result, distinctPostcodes: codes.size, duplicatePostcodeGroups: repeatedCodes.length,
    rowsInDuplicatePostcodeGroups: repeatedCodes.reduce((sum, count) => sum + count, 0),
    duplicateAssignmentRowGroups: repeatedRows.length, rowsInDuplicateAssignmentGroups: repeatedRows.reduce((sum, n) => sum + n, 0),
    officeContextsWithMultipleNonblankCodes: [...officeCodes.values()].filter(set => set.size > 1).length,
    codeAndRequiredNameChecksPassed: rows.length > 0 && result.invalidCodeRows === 0 && result.missingOfficeNameRows === 0 && result.missingBilingualNameRows === 0 && result.missingDistrictRows === 0,
    blankCodesFilled: 0, missingContextFilled: 0, stableOfficeIdentityVerified: false,
    completeNationalCoverageVerified: false, currentAssignmentVerified: false, sourceAssignmentEdition: null,
    validFrom: null, validTo: null, postalGeometryRecords: 0, civicAddressesVerified: 0, buildingLinksVerified: 0,
  };
}

export function profileBdOfficeHtml(bytes, probe) {
  if (bytes.length > PROFILE.limits.max_response_bytes) throw new Error('reference-byte-limit');
  let html; try { html = new TextDecoder('utf-8', {fatal:true}).decode(bytes); } catch { throw new Error('bd-invalid-utf8'); }
  const safe = html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  const tables = [...safe.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)];
  if (tables.length > PROFILE.limits.max_tables_per_page || tables.length !== [...safe.matchAll(/<table\b/gi)].length) throw new Error('bd-table-shape');
  const decodeRows = table => [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(match =>
    [...match[1].matchAll(/<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/gi)].map(cell => plain(cell[3])));
  const expected = probe.headers.map(plain);
  const matches = tables.filter(table => JSON.stringify(decodeRows(table[0])[0]) === JSON.stringify(expected));
  if (matches.length !== 1) throw new Error('bd-table-header-count');
  const table = matches[0][0], rows = decodeRows(table);
  if (/\b(?:rowspan|colspan)\s*=/i.test(table)) throw new Error('bd-spanned-cell-requires-review');
  if (rows.length !== [...table.matchAll(/<tr\b/gi)].length) throw new Error('bd-row-shape');
  const text = plain(html), marker = plain('কনটেন্টটি শেষ হাল-নাগাদ');
  const start = text.indexOf(marker);
  const contentDateMatches = start >= 0 && text.slice(start, start + 150).includes(plain(probe.page_updated_marker));
  return { ...summarizeBdOfficeRows(rows.slice(1), probe.layout), coverage: probe.coverage,
    pageContentDate: contentDateMatches ? probe.page_content_date : null, expectedPageContentDate: probe.page_content_date,
    pageContentDateVerified: contentDateMatches, siteFooterDateUsedAsAssignmentValidity: false,
    responseDigest: sourceDigest(bytes), tableDigest: sourceDigest(Buffer.from(table)), byteLength: bytes.length,
    parser: 'bangladesh-post-exact-unspanned-table/v1', responseIsRetainedSourceSnapshot: false };
}

export async function inspectBdSources(fetcher = fetch, transport = 'node-fetch') {
  const observedAt = new Date().toISOString(), references = [], tableObservations = [];
  for (let offset = 0; offset < PROFILE.reference_probes.length; offset += 3) {
    references.push(...await Promise.all(PROFILE.reference_probes.slice(offset, offset + 3).map(async p => {
      try { return { ...await probeBdReference(p, fetcher), observedAt: new Date().toISOString() }; }
      catch (error) { return { id:p.id, requestedUrl:p.url, observedAt:new Date().toISOString(), status:'fetch-error', contentVerified:false, error:safeError(error) }; }
    })));
  }
  for (const probe of PROFILE.table_probes) {
    try {
      const { metadata, bytes } = await fetchBoundedOfficialResponse(probe.url, { allowedHosts:HOSTS, fetcher, maxBytes:PROFILE.limits.max_response_bytes });
      const base = { id:probe.id, ...metadata, observedAt:new Date().toISOString() };
      if (!bytes) tableObservations.push({ ...base, status:'http-error' });
      else if ((metadata.contentType ?? '').split(';')[0].trim().toLowerCase() !== 'text/html') tableObservations.push({ ...base, status:'unexpected-content', responseDigest:sourceDigest(bytes) });
      else {
        try { tableObservations.push({ ...base, status:'office-table-observed-not-m2', validation:profileBdOfficeHtml(bytes, probe) }); }
        catch (error) { tableObservations.push({ ...base, status:'preflight-error', responseDigest:sourceDigest(bytes), error:safeError(error) }); }
      }
    } catch (error) { tableObservations.push({ id:probe.id, requestedUrl:probe.url, observedAt:new Date().toISOString(), status:'fetch-error', error:safeError(error) }); }
  }
  return { schemaVersion:'postal-context-bd-source-review/v1', countryCode:'BD', observedAt, status:'source-preflight-not-m2',
    transport, tlsVerificationDisabled:false, references, tableObservations,
    sourceDataSnapshotsPersisted:0, publishedDataArtifacts:0, completeNationalCoverageVerified:false,
    rightsForPublicTransformedArtifactsCleared:false, realAgidRuntimeVerified:false, countryM2Achieved:false,
    note:'Only aggregate counts, document/table hashes and access metadata are retained. No source office rows, addresses, protected data or response bodies are persisted. Sources are not merged across scopes or editions. M2_assignment requires complete current rights-cleared assignments, not just these pages, code or synthetic tests.' };
}
function safeError(error) {
  if (error.name === 'TimeoutError') return 'timeout';
  if (['DEPTH_ZERO_SELF_SIGNED_CERT','UNABLE_TO_VERIFY_LEAF_SIGNATURE','CERT_HAS_EXPIRED'].includes(error.cause?.code)) return 'node-tls-verification-failed';
  if (/^(?:bd-(?:invalid-entity|unknown-layout|row-limit|row-schema|invalid-utf8|table-shape|table-header-count|spanned-cell-requires-review|row-shape)|curl-(?:tls-verification-failed|timeout|network-error|invalid-response)|reference-byte-limit|unapproved-reference-host|reference-redirect-limit)$/.test(error.message)) return error.message;
  return 'network-or-parser-error';
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (![2,4].includes(args.length) || args[0] !== '--report' || (args.length === 4 && args[2] !== '--curl-executable')) throw new Error('usage: node scripts/inspect-postal-context-bd-sources.mjs --report new.json [--curl-executable /trusted/curl]');
  const output = resolve(args[1]); if (existsSync(output)) throw new Error('report-already-exists');
  const transport = args.length === 4 ? 'curl-cli-verified-tls' : 'node-fetch';
  const report = await inspectBdSources(args.length === 4 ? createPostalCurlFetcher(resolve(args[3]), HOSTS) : fetch, transport);
  mkdirSync(dirname(output), {recursive:true}); writeFileSync(output, JSON.stringify(report,null,2)+'\n', {flag:'wx'});
  console.log(JSON.stringify({references:report.references.map(r=>({id:r.id,status:r.status,error:r.error,missingMarkers:r.missingMarkers})),tables:report.tableObservations,countryM2Achieved:false},null,2));
}
