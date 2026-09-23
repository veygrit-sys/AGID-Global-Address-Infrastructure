import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fetchBoundedOfficialResponse, probeOfficialReference, sourceDigest } from './lib/postal-context-source-probe.mjs';

const PROFILE = JSON.parse(readFileSync(new URL('../data/postal_country_packs/am/postal-context/m2-source-review.json', import.meta.url), 'utf8'));
const HOSTS = new Set(['www.haypost.am', 'www.upu.int', 'www.cadastre.am', 'cadastre.am']);
export const probeAmReference = (reference, fetcher = fetch) => probeOfficialReference(reference, HOSTS, fetcher);

export function summarizeAmDirectoryPages(pages) {
  // Layout is specific to the pinned PDF, not a general PDF/address parser.
  if (pages.length !== PROFILE.directory_probe.expected_pages) throw new Error('directory-page-count');
  const codes = new Map(), perPage = [];
  let invalidCodeCells = 0, missingContextRows = 0, leadingZeroRows = 0;
  for (const items of pages) {
    if (!Array.isArray(items) || items.length > 10_000) throw new Error('directory-item-limit');
    const text = items.filter(item => typeof item.str === 'string' && item.str.trim());
    if (text.some(item => !Array.isArray(item.transform) || !Number.isFinite(item.transform[4]) || !Number.isFinite(item.transform[5]))) throw new Error('directory-invalid-position');
    const cells = text.filter(item => item.transform[4] >= 330 && item.transform[4] < 365 && item.str.trim() !== 'P/O');
    let rows = 0;
    for (const cell of cells) {
      const code = cell.str.trim();
      if (!/^\d{4}$/.test(code)) { invalidCodeCells++; continue; }
      rows++;
      if (code.startsWith('0')) leadingZeroRows++;
      codes.set(code, (codes.get(code) ?? 0) + 1);
      const sameRow = text.filter(item => Math.abs(item.transform[5] - cell.transform[5]) <= 0.5);
      if (!sameRow.some(item => item.transform[4] < 160)
        || !sameRow.some(item => item.transform[4] >= 160 && item.transform[4] < 330)
        || !sameRow.some(item => item.transform[4] >= 365)) missingContextRows++;
    }
    perPage.push(rows);
  }
  const rows = perPage.reduce((sum, n) => sum + n, 0);
  const repeated = [...codes.values()].filter(count => count > 1);
  return {
    grain: 'listed-post-office-row-not-postal-area-or-civic-address',
    pages: pages.length, perPage, observedDirectoryRows: rows, distinctPostcodes: codes.size,
    leadingZeroRows, invalidCodeCells, missingContextRows,
    duplicatePostcodeGroups: repeated.length, rowsInDuplicateGroups: repeated.reduce((sum, n) => sum + n, 0),
    postcodeIsUniqueKey: rows > 0 && repeated.length === 0,
    codeAndBasicRowChecksPassed: rows > 0 && perPage.every(n => n > 0) && invalidCodeCells === 0 && missingContextRows === 0,
    fullRowReconstructionVerified: false, currentAssignmentVerified: false,
    postalGeometryRecords: 0, civicAddressesVerified: 0, buildingLinksVerified: 0,
  };
}

export async function profileAmDirectoryBytes(bytes, pdfjs) {
  const digest = sourceDigest(bytes), probe = PROFILE.directory_probe;
  if (digest !== probe.expected_digest || bytes.length > probe.max_response_bytes || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') throw new Error('directory-digest-or-format-mismatch');
  const pdf = await pdfjs.getDocument({ data: Uint8Array.from(bytes), useSystemFonts: true, isEvalSupported: false }).promise;
  try {
    if (pdf.numPages !== probe.expected_pages) throw new Error('directory-page-count');
    const pages = [];
    for (let page = 1; page <= pdf.numPages; page++) pages.push((await (await pdf.getPage(page)).getTextContent()).items);
    const { info } = await pdf.getMetadata();
    const pdfDate = value => typeof value === 'string' && /^D:\d{14}(?:Z|[+-]\d{2}'\d{2}')?$/.test(value) ? value : null;
    return { ...summarizeAmDirectoryPages(pages), extractor: 'pdfjs-dist', extractorVersion: pdfjs.version,
      pdfCreationDate: pdfDate(info.CreationDate), pdfModificationDate: pdfDate(info.ModDate),
      sourceEdition: null, validFrom: null, validTo: null, responseDigest: digest, byteLength: bytes.length };
  } finally { await pdf.destroy(); }
}

export async function inspectAmSources(pdfjs, fetcher = fetch) {
  const observedAt = new Date().toISOString(), references = [];
  // Fixed public references only. No query input, registry search, login or bulk crawl.
  for (let offset = 0; offset < PROFILE.reference_probes.length; offset += 3) {
    references.push(...await Promise.all(PROFILE.reference_probes.slice(offset, offset + 3).map(async reference => {
      try { return { ...await probeAmReference(reference, fetcher), observedAt: new Date().toISOString() }; }
      catch (error) { return { id: reference.id, requestedUrl: reference.url, observedAt: new Date().toISOString(), status: 'fetch-error', contentVerified: false, error: safeError(error) }; }
    })));
  }
  let directoryObservation;
  const probe = PROFILE.directory_probe;
  try {
    const { metadata, bytes } = await fetchBoundedOfficialResponse(probe.url, { allowedHosts: HOSTS, fetcher, maxBytes: probe.max_response_bytes });
    const base = { ...metadata, observedAt: new Date().toISOString(), sourceEdition: null };
    if (!bytes) directoryObservation = { ...base, status: 'http-error' };
    else if ((metadata.contentType ?? '').split(';')[0].trim().toLowerCase() !== 'application/pdf' || sourceDigest(bytes) !== probe.expected_digest) directoryObservation = { ...base, status: 'unexpected-content-or-edition', responseDigest: sourceDigest(bytes) };
    else directoryObservation = { ...base, status: 'directory-observed-not-m2', validation: await profileAmDirectoryBytes(bytes, pdfjs) };
  } catch (error) { directoryObservation = { requestedUrl: probe.url, observedAt: new Date().toISOString(), status: 'preflight-error', error: safeError(error) }; }
  return { schemaVersion: 'postal-context-am-source-review/v1', countryCode: 'AM', observedAt, status: 'source-preflight-not-m2', references, directoryObservation,
    sourceDataSnapshotsPersisted: 0, publishedDataArtifacts: 0, rightsForPublicTransformedArtifactsCleared: false,
    realAgidRuntimeVerified: false, countryM2Achieved: false,
    note: 'Aggregate inspection only. Source rows, addresses, PDF metadata identities and PDF bodies are not written by this tool. Document dates and directory rows do not establish current allocation, civic addresses, geometry, building links, reuse rights or M2.' };
}

function safeError(error) {
  if (error.name === 'TimeoutError') return 'timeout';
  if (['directory-page-count', 'directory-item-limit', 'directory-invalid-position', 'directory-digest-or-format-mismatch', 'reference-byte-limit', 'unapproved-reference-host', 'reference-redirect-limit'].includes(error.message)) return error.message;
  return 'network-or-parser-error';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 4 || args[0] !== '--pdfjs-module' || args[2] !== '--report') throw new Error('usage: node scripts/inspect-postal-context-am-sources.mjs --pdfjs-module /local/pdfjs-dist/legacy/build/pdf.mjs --report new-report.json');
  const output = resolve(args[3]); if (existsSync(output)) throw new Error('report-already-exists');
  const pdfjs = await import(pathToFileURL(resolve(args[1])).href);
  const report = await inspectAmSources(pdfjs);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ references: report.references.map(r => ({ id: r.id, status: r.status })), directoryObservation: report.directoryObservation, countryM2Achieved: false }, null, 2));
}
