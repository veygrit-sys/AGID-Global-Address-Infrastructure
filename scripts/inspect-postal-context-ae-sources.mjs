import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROFILE = new URL('../data/postal_country_packs/ae/postal-context/source-profile.json', import.meta.url);
const HOSTS = new Set(['www.upu.int', 'www.emiratespost.ae', 'pages.dmt.gov.ae', 'www.dmt.gov.ae', 'www.dm.gov.ae', 'www.dubaipulse.gov.ae']);
const MAX_BYTES = 4 * 1024 * 1024;
export const aeReferenceDigest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

export async function probeAeReference(reference, fetcher = fetch) {
  let url = reference.url;
  const redirects = [];
  for (let i = 0; i <= 3; i++) {
    const target = new URL(url);
    if (target.protocol !== 'https:' || !HOSTS.has(target.hostname) || target.username || target.password || target.port) throw new Error('unapproved-reference-host');
    const response = await fetcher(url, { redirect: 'manual', signal: AbortSignal.timeout(25_000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location) throw new Error('redirect-without-location');
      url = new URL(location, url).href; redirects.push(url); continue;
    }
    const base = { id: reference.id, requestedUrl: reference.url, finalUrl: url, redirects, httpStatus: response.status, expectedMime: reference.mime, contentType: response.headers.get('content-type'), lastModified: response.headers.get('last-modified') };
    if (response.status !== 200 || !response.body) { await response.body?.cancel(); return { ...base, status: 'http-error', contentVerified: false }; }
    if (Number(response.headers.get('content-length') || 0) > MAX_BYTES) { await response.body.cancel(); throw new Error('reference-byte-limit'); }
    const reader = response.body.getReader(), chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) { await reader.cancel(); throw new Error('reference-byte-limit'); }
      chunks.push(value);
    }
    if (!total) throw new Error('empty-reference');
    const bytes = Buffer.concat(chunks);
    const plain = bytes.toString('utf8').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    const mimeMatches = (base.contentType ?? '').toLowerCase().includes(reference.mime);
    const pdfMatches = reference.mime !== 'application/pdf' || bytes.subarray(0, 5).toString('ascii') === '%PDF-';
    const missingMarkers = reference.markers.filter(marker => !plain.toLowerCase().includes(marker.toLowerCase()));
    const contentVerified = mimeMatches && pdfMatches && missingMarkers.length === 0;
    return { ...base, status: contentVerified ? 'reference-verified-not-data' : 'unexpected-content', contentVerified, missingMarkers, byteLength: bytes.length, responseDigest: aeReferenceDigest(bytes), sourceDocumentDigest: contentVerified ? aeReferenceDigest(bytes) : null, edition: reference.edition ?? 'not-established-by-reference-probe', sourceDataRecords: 0 };
  }
  throw new Error('reference-redirect-limit');
}

export async function inspectAeReferences(fetcher = fetch) {
  const profile = JSON.parse(readFileSync(PROFILE, 'utf8'));
  const observedAt = new Date().toISOString();
  const references = [];
  // Small fixed reference list only; never enumerate address/parcel/box records.
  for (let offset = 0; offset < profile.reference_probes.length; offset += 3) {
    references.push(...await Promise.all(profile.reference_probes.slice(offset, offset + 3).map(async reference => {
      try { return { ...await probeAeReference(reference, fetcher), observedAt: new Date().toISOString() }; }
      catch (error) { return { id: reference.id, requestedUrl: reference.url, observedAt: new Date().toISOString(), status: 'fetch-error', contentVerified: false, error: error.name === 'TimeoutError' ? 'timeout' : error.message === 'fetch failed' ? 'network-error' : error.message }; }
    })));
  }
  return { schemaVersion: 'postal-context-ae-reference-review/v1', countryCode: 'AE', observedAt, status: 'reference-review-not-m2', references, sourceDataRecords: 0, sourceDataSnapshotsPersisted: 0, publishedDataArtifacts: 0, countryM2Achieved: false, rightsForPublicTransformedArtifactsCleared: false, note: 'Only reference-document responses were inspected and hashed. Website availability is not bulk-data availability, permission, nationwide coverage or an AGID runtime verification.' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--report') throw new Error('usage: node scripts/inspect-postal-context-ae-sources.mjs --report new-report.json');
  const output = resolve(args[1]); if (existsSync(output)) throw new Error('report-already-exists');
  const report = await inspectAeReferences();
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ status: report.status, references: report.references.map(r => ({ id: r.id, status: r.status })), countryM2Achieved: false }, null, 2));
}
