import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBoundedOfficialResponse, sourceDigest } from './lib/postal-context-source-probe.mjs';
import { createPostalCurlFetcher } from './lib/postal-context-curl-fetch.mjs';

export const config = JSON.parse(readFileSync(new URL('../data/postal_country_packs/kp/postal-context/m2-source-review.json', import.meta.url)));
const hosts = new Set(config.allowed_hosts);
const visible = html => html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|head|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
const plain = html => visible(html).replace(/<[^>]*>/g, ' ').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/gu, ' ').trim();
export function profileKpReference(bytes, ref, mime) {
  const digest = sourceDigest(bytes);
  const base = { byteLength: bytes.length, responseDigest: digest, sourceDocumentDigest: null, contentVerified: false, sourceDataRecords: 0 };
  if ((mime ?? '').split(';')[0].trim().toLowerCase() !== ref.mime) return { ...base, status: 'unexpected-mime' };
  if (ref.mime === 'application/pdf') {
    // A checksum binds the human full-page review, not a fresh automated PDF interpretation.
    const ok = bytes.subarray(0, 5).toString('ascii') === '%PDF-' && digest === ref.expected_digest;
    return { ...base, status: ok ? 'digest-bound-selected-page-review-not-data' : 'pdf-re-review-required', contentVerified: ok,
      sourceDocumentDigest: ok ? digest : null, physicalPages: ok ? ref.physical_pages : null,
      visuallyReviewedPages: ok ? ref.visually_reviewed_pages : [], kpTablePhysicalPage: ok ? ref.kp_table_physical_page : null,
      kpTableEdition: ok ? ref.kp_table_edition : null, otherRequiredCodeTableEdition: ok ? ref.other_required_code_table_edition : null,
      currentNationalFrameworkVerified: false, fixedCodeFormatVerified: false, permanentAbsenceInferred: false };
  }
  const html = visible(new TextDecoder('utf8', { fatal: true }).decode(bytes));
  let ok = false;
  if (ref.id === 'member') {
    const sections = [...html.matchAll(/<section\b[^>]*class="member-countries-detail"[^>]*>([\s\S]*?)<\/section>/g)];
    const fields = sections.length === 1 ? [...sections[0][1].matchAll(/<span class="member-countries-value">([^<]*)<\/span>/g)].map(m => plain(m[1])) : [];
    ok = fields[0] === "Dem. People's Rep. of Korea" && fields[1] === 'KP' && fields[2] === '06.06.1974';
  } else if (ref.id === 'copyright') {
    const sections = [...html.matchAll(/<div class="fr-view">([\s\S]*?)<\/div>/g)].map(m => plain(m[1]));
    ok = sections.some(section => ref.markers.every(marker => section.includes(marker)));
  } else if (ref.id === 'portal') {
    ok = ref.markers.every(marker => plain(html).includes(marker) || html.includes(`/${marker}`));
  }
  return { ...base, status: ok ? 'reference-verified-not-data' : 'unconfirmed-reference-body', contentVerified: ok, sourceDocumentDigest: ok ? digest : null };
}
export function kpFailure(error) {
  const safe = new Set(['unapproved-reference-host', 'reference-byte-limit', 'empty-reference', 'reference-redirect-limit', 'redirect-without-location', 'curl-timeout', 'curl-network-error', 'curl-tls-verification-failed', 'curl-invalid-response']);
  if (safe.has(error?.message)) return error.message;
  return ['TimeoutError', 'AbortError'].includes(error?.name) ? 'request-timeout' : 'network-or-parser-error';
}
export async function inspectKpSources(fetcher = fetch, transport = 'node-verified-tls') {
  const report = { schemaVersion: 'postal-context-kp-source-review/v1', countryCode: 'KP', observedAt: new Date().toISOString(), transport, references: [],
    observationGrain: 'public-reference-document-not-national-postal-or-address-record', sourceRowsPersisted: 0, currentAssignmentRowsValidated: 0,
    productionGeometryRecords: 0, civicBuildingRelations: 0, publishedDataArtifacts: 0, realAgidRuntimeVerified: false,
    assignmentQuality: { missingCodeRate: null, duplicateAssignmentRate: null, reason: 'no-current-assignment-dataset-obtained-not-zero-national-coverage' },
    rightsReview: config.rights_review, paidOperations: 0, authenticatedRequests: 0, privateQueries: 0, countryM2Achieved: false };
  for (let i = 0; i < config.references.length; i += config.limits.concurrent_requests) {
    report.references.push(...await Promise.all(config.references.slice(i, i + config.limits.concurrent_requests).map(async ref => {
      try {
        const r = await fetchBoundedOfficialResponse(ref.url, { allowedHosts: hosts, fetcher, maxBytes: config.limits.max_response_bytes });
        return { id: ref.id, role: ref.role, ...r.metadata, observedAt: new Date().toISOString(), ...(r.bytes ? profileKpReference(r.bytes, ref, r.metadata.contentType) : { status: 'http-error', byteLength: null, responseDigest: null, sourceDocumentDigest: null, contentVerified: false, sourceDataRecords: 0 }) };
      } catch (e) {
        return { id: ref.id, requestedUrl: ref.url, observedAt: new Date().toISOString(), status: 'review-failed', failureKind: kpFailure(e), contentVerified: false, sourceDocumentDigest: null, sourceDataRecords: 0 };
      }
    })));
  }
  report.completedAt = new Date().toISOString();
  return report;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (![2, 4].includes(args.length) || args[0] !== '--report' || (args.length === 4 && args[2] !== '--curl')) throw Error('usage: --report NEW_REPORT.json [--curl EXECUTABLE]');
  const path = resolve(args[1]);
  if (existsSync(path)) throw Error('report-already-exists');
  const report = await inspectKpSources(args[3] ? createPostalCurlFetcher(args[3], hosts) : fetch, args[3] ? 'curl-verified-tls' : 'node-verified-tls');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ report: path, references: report.references.map(r => ({ id: r.id, status: r.status })), m2: report.countryM2Achieved }));
}
