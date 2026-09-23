import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

export const JAPAN_POST_M2_URLS = Object.freeze({
  archive: 'https://www.post.japanpost.jp/service/search/zipcode/download/utf/zip/utf_ken_all.zip',
  release: 'https://www.post.japanpost.jp/service/search/zipcode/download/utf-zip.html',
  terms: 'https://www.post.japanpost.jp/service/search/zipcode/download/readme.html',
});
export const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const MAX_CSV_BYTES = 64 * 1024 * 1024;
const MAX_ROWS = 250_000;

function csvLine(line, rowNumber) {
  const fields = [];
  let field = '';
  let state = 'start';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (state === 'quoted') {
      if (c === '"' && line[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') state = 'closed';
      else field += c;
    } else if (c === ',') {
      fields.push(field); field = ''; state = 'start';
    } else if (state === 'closed') throw new Error(`csv-after-quote:row-${rowNumber}`);
    else if (c === '"') {
      if (state !== 'start') throw new Error(`csv-quote-in-field:row-${rowNumber}`);
      state = 'quoted';
    } else { field += c; state = 'unquoted'; }
  }
  if (state === 'quoted') throw new Error(`csv-unclosed-quote:row-${rowNumber}`);
  fields.push(field);
  return fields;
}

export function classifyJapanPostRow(fields) {
  const town = fields[8];
  if (town === '以下に掲載がない場合') return 'fallback_not_a_town';
  if (/の次に番地がくる場合|一円$/.test(town)) return 'no_town_designator';
  if (fields[9] === '1' || /[（）()]/.test(town)) return 'partial_or_qualified_town';
  if (fields[12] === '1') return 'multi_town_code';
  return 'ordinary_locality_context_only';
}

export function normalizeJapanPostAssignments(csv) {
  if (Buffer.byteLength(csv, 'utf8') > MAX_CSV_BYTES) throw new Error('csv-byte-limit');
  if (/\uFFFD|\u0000/.test(csv)) throw new Error('invalid-csv-text');
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop();
  if (!lines.length || lines.length > MAX_ROWS) throw new Error('csv-row-limit');
  const assignments = [];
  for (const [index, line] of lines.entries()) {
    if (!line || /[\r\n]/.test(line)) throw new Error(`csv-empty-or-multiline:row-${index + 1}`);
    const fields = csvLine(line, index + 1);
    if (fields.length !== 15) throw new Error(`csv-field-count:row-${index + 1}`);
    if (!/^\d{5}$/.test(fields[0]) || !/^\d{7}$/.test(fields[2])) throw new Error(`csv-code-shape:row-${index + 1}`);
    if (fields.slice(6, 9).some(f => !f)) throw new Error(`csv-missing-locality:row-${index + 1}`);
    if (fields.slice(9, 13).some(f => !/^[01]$/.test(f)) || !/^[01]$/.test(fields[13]) || !/^[0-5]$/.test(fields[14])) throw new Error(`csv-invalid-or-retired-flag:row-${index + 1}`);
    assignments.push({
      sourceRow: index + 1,
      localGovernmentCode: fields[0], postalCode: fields[2],
      prefecture: fields[6], municipality: fields[7], townLabel: fields[8],
      classification: classifyJapanPostRow(fields),
      flags: { townHasMultipleCodes: fields[9] === '1', koazaNumbering: fields[10] === '1', hasChome: fields[11] === '1', codeHasMultipleTowns: fields[12] === '1', updated: fields[13], changeReason: fields[14] },
      assignmentAuthority: 'official_postal_operator', geometryAuthority: 'none', geometry: null,
    });
  }
  return assignments;
}

export function summarizeJapanPostAssignments(assignments) {
  const classes = {};
  const postalCodes = new Set();
  const municipalities = new Set();
  const prefectures = new Set();
  const normalized = createHash('sha256');
  let bytes = 0;
  for (const row of assignments) {
    classes[row.classification] = (classes[row.classification] ?? 0) + 1;
    postalCodes.add(row.postalCode); municipalities.add(row.localGovernmentCode); prefectures.add(row.localGovernmentCode.slice(0, 2));
    const line = `${JSON.stringify(row)}\n`;
    normalized.update(line); bytes += Buffer.byteLength(line);
  }
  return {
    rows: assignments.length, distinctPostalCodes: postalCodes.size, municipalities: municipalities.size,
    prefectures: prefectures.size, classifications: classes,
    classifiedRows: Object.values(classes).reduce((a, b) => a + b, 0),
    normalizedDigest: `sha256:${normalized.digest('hex')}`, normalizedByteLength: bytes,
    normalizedFormat: 'ordered UTF-8 JSONL; source row order; intake-postal-context-jp-m2/v1',
    canonicalGeometryCount: 0, buildingLinks: 0,
  };
}

export async function fetchOfficialBounded(url, maximumBytes, fetcher = fetch) {
  let next = url;
  for (let redirects = 0; redirects <= 3; redirects++) {
    const target = new URL(next);
    if (target.protocol !== 'https:' || target.hostname !== 'www.post.japanpost.jp' || target.username || target.password || target.port) throw new Error('unapproved-source-host');
    const response = await fetcher(next, { redirect: 'manual', signal: AbortSignal.timeout(30_000), headers: { 'user-agent': 'AGID-PostalContext-M2-Intake/1.0' } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location) throw new Error('missing-redirect-location');
      next = new URL(location, next).href;
      continue;
    }
    if (!response.ok || !response.body) throw new Error(`source-http-${response.status}`);
    if (Number(response.headers.get('content-length') || 0) > maximumBytes) { await response.body.cancel(); throw new Error('source-byte-limit'); }
    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) { await reader.cancel(); throw new Error('source-byte-limit'); }
      chunks.push(value);
    }
    if (!total) throw new Error('empty-source');
    const data = Buffer.concat(chunks);
    return { data, url: next, digest: digest(data), byteLength: data.length, lastModified: response.headers.get('last-modified'), etag: response.headers.get('etag') };
  }
  throw new Error('too-many-redirects');
}

export function csvFromJapanPostArchive(bytes) {
  const entries = new AdmZip(bytes).getEntries();
  if (entries.length !== 1 || entries[0].isDirectory || entries[0].entryName.toLowerCase() !== 'utf_ken_all.csv') throw new Error('unexpected-archive-entries');
  if (entries[0].header.size <= 0 || entries[0].header.size > MAX_CSV_BYTES) throw new Error('expanded-csv-byte-limit');
  const data = entries[0].getData();
  if (data.length !== entries[0].header.size) throw new Error('expanded-csv-size-mismatch');
  return { csv: new TextDecoder('utf-8', { fatal: true }).decode(data), digest: digest(data), byteLength: data.length };
}

export function verifyJapanPostReference(releaseHtml, termsHtml) {
  const releaseMatch = releaseHtml.match(/(\d{4})年(\d{1,2})月(\d{1,2})日更新/);
  if (!releaseMatch) throw new Error('release-date-not-found');
  if (!/日本郵便株式会社は著作権を主張しません/.test(termsHtml) || !/自由に配布していただいて結構です/.test(termsHtml)) throw new Error('terms-changed-review-required');
  return `${releaseMatch[1]}-${releaseMatch[2].padStart(2, '0')}-${releaseMatch[3].padStart(2, '0')}`;
}

export async function intakeJapanPostM2(expectedArchiveDigest = null) {
  if (expectedArchiveDigest && !/^sha256:[a-f0-9]{64}$/.test(expectedArchiveDigest)) throw new Error('invalid-expected-digest');
  const observedAt = new Date().toISOString();
  const [archive, release, terms] = await Promise.all([
    fetchOfficialBounded(JAPAN_POST_M2_URLS.archive, 16 * 1024 * 1024),
    fetchOfficialBounded(JAPAN_POST_M2_URLS.release, 4 * 1024 * 1024),
    fetchOfficialBounded(JAPAN_POST_M2_URLS.terms, 4 * 1024 * 1024),
  ]);
  if (expectedArchiveDigest && archive.digest !== expectedArchiveDigest) throw new Error('archive-digest-mismatch');
  const sourceRelease = verifyJapanPostReference(release.data.toString('utf8'), terms.data.toString('utf8'));
  if (sourceRelease > observedAt.slice(0, 10)) throw new Error('future-source-release');
  const expanded = csvFromJapanPostArchive(archive.data);
  const summary = summarizeJapanPostAssignments(normalizeJapanPostAssignments(expanded.csv));
  if (summary.rows < 100_000 || summary.prefectures !== 47) throw new Error('national-coverage-review-required');
  const receipt = ({ data, ...metadata }) => metadata;
  return {
    schemaVersion: 'postal-context-jp-m2-intake/v1', countryCode: 'JP', status: 'intake_validated_not_m2',
    observedAt, sourceRelease, synthetic: false,
    scope: 'Nationwide ordinary Japan Post locality assignments only; excludes business-specific file, geometry, civic addresses, buildings and deliverability.',
    sources: { archive: receipt(archive), releasePage: receipt(release), termsPage: receipt(terms), expandedCsv: { digest: expanded.digest, byteLength: expanded.byteLength } },
    rights: { provider: 'Japan Post Co., Ltd.', review: 'Official terms permit redistribution of postal-code data only; no licence claim about website HTML or other datasets.', termsUrl: JAPAN_POST_M2_URLS.terms, termsDigest: terms.digest },
    summary,
    validation: { schemaFields: 15, allRowsClassified: summary.rows === summary.classifiedRows, leadingZerosPreserved: true, retiredRowsRejected: true, noInferredGeometry: true },
    publication: { rawArchivesPersisted: false, rawAddressRowsPersisted: false, normalizedRowsPersisted: false, reportContainsLocalityRows: false, containsPersonalData: false },
    m2: { achieved: false, remaining: ['durable-rights-cleared-source-snapshot-and-terms-evidence', 'digest-pinned-Postal-Context-runtime-artifacts', 'AGID-descriptor-loader-and-API-integration-test', 'approved-external-artifact-publication-and-remote-verification'], note: 'A successful intake and aggregate report are not an M2 country release. Existing country maturity remains M1.' },
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  if (![2, 4].includes(args.length) || args[0] !== '--report' || (args.length === 4 && args[2] !== '--expected-archive-digest')) throw new Error('usage: node scripts/intake-postal-context-jp-m2.mjs --report report.json [--expected-archive-digest sha256:...]');
  const output = resolve(args[1]);
  const report = await intakeJapanPostM2(args[3] ?? null);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  console.log(JSON.stringify({ report: output, status: report.status, sourceRelease: report.sourceRelease, rows: report.summary.rows, distinctPostalCodes: report.summary.distinctPostalCodes, archiveDigest: report.sources.archive.digest, m2Achieved: false }, null, 2));
}
