import { createHash } from 'node:crypto';

export const sourceDigest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

// Explicit hosts and bounded, unauthenticated GETs only. Callers never persist
// these bodies by default; document access does not grant data reuse rights.
export async function fetchBoundedOfficialResponse(requestedUrl, { allowedHosts, fetcher = fetch, maxBytes = 4 * 1024 * 1024 }) {
  let url = requestedUrl;
  const redirects = [];
  for (let i = 0; i <= 3; i++) {
    const target = new URL(url);
    if (target.protocol !== 'https:' || !allowedHosts.has(target.hostname) || target.username || target.password || target.port) throw new Error('unapproved-reference-host');
    const response = await fetcher(url, { redirect: 'manual', signal: AbortSignal.timeout(25_000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location) throw new Error('redirect-without-location');
      url = new URL(location, url).href; redirects.push(url); continue;
    }
    const metadata = { requestedUrl, finalUrl: url, redirects, httpStatus: response.status, contentType: response.headers.get('content-type'), lastModified: response.headers.get('last-modified') };
    if (response.status !== 200 || !response.body) { await response.body?.cancel(); return { metadata, bytes: null }; }
    if (Number(response.headers.get('content-length') || 0) > maxBytes) { await response.body.cancel(); throw new Error('reference-byte-limit'); }
    const reader = response.body.getReader(), chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > maxBytes) { await reader.cancel(); throw new Error('reference-byte-limit'); }
      chunks.push(value);
    }
    if (!total) throw new Error('empty-reference');
    return { metadata, bytes: Buffer.concat(chunks) };
  }
  throw new Error('reference-redirect-limit');
}

export async function probeOfficialReference(reference, allowedHosts, fetcher = fetch) {
  const { metadata, bytes } = await fetchBoundedOfficialResponse(reference.url, { allowedHosts, fetcher });
  const base = { id: reference.id, ...metadata, expectedMime: reference.mime };
  if (!bytes) return { ...base, status: 'http-error', contentVerified: false };
  const plain = bytes.toString('utf8').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  const mimeMatches = (metadata.contentType ?? '').split(';')[0].trim().toLowerCase() === reference.mime;
  const pdfMatches = reference.mime !== 'application/pdf' || bytes.subarray(0, 5).toString('ascii') === '%PDF-';
  const missingMarkers = reference.markers.filter(marker => !plain.toLowerCase().includes(marker.toLowerCase()));
  const digest = sourceDigest(bytes);
  const digestMatches = !reference.expectedDigest || reference.expectedDigest === digest;
  const contentVerified = mimeMatches && pdfMatches && missingMarkers.length === 0 && digestMatches;
  return { ...base, status: contentVerified ? 'reference-verified-not-data' : 'unexpected-content', contentVerified, missingMarkers, ...(reference.expectedDigest ? { expectedDigest: reference.expectedDigest, digestMatches } : {}), byteLength: bytes.length, responseDigest: digest, sourceDocumentDigest: contentVerified ? digest : null, edition: contentVerified ? reference.edition ?? 'not-established-by-reference-probe' : 'unconfirmed-content', sourceDataRecords: 0 };
}
