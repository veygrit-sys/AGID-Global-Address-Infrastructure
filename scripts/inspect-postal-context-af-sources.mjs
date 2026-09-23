import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBoundedOfficialResponse, probeOfficialReference, sourceDigest } from './lib/postal-context-source-probe.mjs';

const PROFILE = new URL('../data/postal_country_packs/af/postal-context/m2-source-review.json', import.meta.url);
const HOSTS = new Set(['afghanpost.gov.af', 'www.afghanpost.gov.af', 'postalcode.afghanpost.gov.af', 'www.upu.int', 'data.humdata.org']);
const COMPONENTS = /^(?:[123]\d|4[0-3])(?:0[1-9]|[1-9]\d)(?:0[1-9]|[1-9]\d)$/;

export function inspectAfPostalArea(payload, requestedCode) {
  const errors = [];
  if (!COMPONENTS.test(requestedCode)) errors.push('invalid-request-code-components');
  const value = payload?.properties?.postal_cod;
  const sourceCode = typeof value === 'string' ? value : Number.isInteger(value) ? String(value) : null;
  if (!sourceCode || !COMPONENTS.test(sourceCode) || sourceCode !== requestedCode) errors.push('source-postcode-mismatch');
  const geometry = payload?.geometry;
  const polygons = geometry?.type === 'Polygon' ? [geometry.coordinates] : geometry?.type === 'MultiPolygon' ? geometry.coordinates : null;
  let rings = 0, positions = 0;
  if (payload?.type !== 'Feature' || !Array.isArray(polygons) || !polygons.length) errors.push('expected-postal-area-feature');
  else for (const polygon of polygons) {
    if (!Array.isArray(polygon) || !polygon.length) { errors.push('empty-polygon'); continue; }
    for (const ring of polygon) {
      rings++;
      if (!Array.isArray(ring) || ring.length < 4) { errors.push('short-ring'); continue; }
      positions += ring.length;
      if (positions > 100_000) throw new Error('position-limit');
      const valid = ring.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90);
      if (!valid) { errors.push('invalid-longitude-latitude-position'); continue; }
      if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) errors.push('unclosed-ring');
      const area = ring.slice(0, -1).reduce((sum, p, i) => sum + p[0] * ring[i + 1][1] - ring[i + 1][0] * p[1], 0);
      if (Math.abs(area) <= Number.EPSILON) errors.push('degenerate-ring');
    }
  }
  return { basicChecksPassed: errors.length === 0, errors: [...new Set(errors)], sourceCodeStorageType: typeof value, matchesRequestedCode: sourceCode === requestedCode, geometryType: geometry?.type ?? null, polygons: Array.isArray(polygons) ? polygons.length : 0, rings, positions, completeTopologyVerified: false, sourceCrsVerified: false, sourceEdition: null, validFrom: null, validTo: null };
}

export async function probeAfPostalArea(probe, fetcher = fetch) {
  // This is intentionally not a general address/coordinate search or downloader.
  if (!COMPONENTS.test(probe.query_postal_code) || probe.url !== `https://postalcode.afghanpost.gov.af/client_postal_code_location/${probe.query_postal_code}` || probe.max_queries_per_run !== 1 || probe.allow_search_queries !== false || probe.allow_bulk_endpoints !== false || probe.allow_authentication !== false || probe.persist_source_response !== false || probe.max_response_bytes !== 2 * 1024 * 1024) throw new Error('unsafe-area-probe');
  const { metadata, bytes } = await fetchBoundedOfficialResponse(probe.url, { allowedHosts: HOSTS, fetcher, maxBytes: probe.max_response_bytes });
  const base = { ...metadata, observedAt: new Date().toISOString(), sourceResponsesPersisted: 0, publicDataArtifacts: 0, rightsCleared: false, realAgidRuntimeVerified: false, countryM2Achieved: false };
  if (!bytes) return { ...base, status: 'http-error', observedAreaRecords: 0 };
  const evidence = { responseDigest: sourceDigest(bytes), byteLength: bytes.length };
  if ((metadata.contentType ?? '').split(';')[0].trim().toLowerCase() !== 'application/json') return { ...base, ...evidence, status: 'unexpected-content', observedAreaRecords: 0 };
  let payload;
  try { payload = JSON.parse(bytes.toString('utf8')); } catch { return { ...base, ...evidence, status: 'invalid-json', observedAreaRecords: 0 }; }
  const validation = inspectAfPostalArea(payload, probe.query_postal_code);
  // Only structural counts survive. Never emit raw geometry, arbitrary fields,
  // address labels, identities, home numbers, coordinates or search responses.
  return { ...base, ...evidence, status: validation.basicChecksPassed ? 'live-area-observed-not-m2' : 'area-validation-failed', validation, observedAreaRecords: validation.basicChecksPassed ? 1 : 0 };
}

const errorCode = error => error.name === 'TimeoutError' ? 'timeout' : error.message === 'fetch failed' ? 'network-error' : error.message;
export async function inspectAfSources(fetcher = fetch) {
  const profile = JSON.parse(readFileSync(PROFILE, 'utf8'));
  const observedAt = new Date().toISOString(), references = [];
  for (let i = 0; i < profile.reference_probes.length; i += 3) {
    references.push(...await Promise.all(profile.reference_probes.slice(i, i + 3).map(async reference => {
      try { return { ...await probeOfficialReference(reference, HOSTS, fetcher), observedAt: new Date().toISOString() }; }
      catch (error) { return { id: reference.id, requestedUrl: reference.url, observedAt: new Date().toISOString(), status: 'fetch-error', contentVerified: false, error: errorCode(error) }; }
    })));
  }
  let areaObservation;
  try { areaObservation = await probeAfPostalArea(profile.area_probe, fetcher); }
  catch (error) { areaObservation = { requestedUrl: profile.area_probe.url, status: 'fetch-error', error: errorCode(error), observedAt: new Date().toISOString(), observedAreaRecords: 0, sourceResponsesPersisted: 0, countryM2Achieved: false }; }
  return { schemaVersion: 'postal-context-af-source-review/v1', countryCode: 'AF', observedAt, status: 'source-preflight-not-m2', references, areaObservation, sourceDataSnapshotsPersisted: 0, publishedDataArtifacts: 0, rightsForPublicTransformedArtifactsCleared: false, countryM2Achieved: false, note: 'Document hashes and one live public area observation are not retained, editioned, rights-cleared source snapshots, published data artifacts or real AGID runtime verification.' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--report') throw new Error('usage: node scripts/inspect-postal-context-af-sources.mjs --report new-report.json');
  const output = resolve(args[1]); if (existsSync(output)) throw new Error('report-already-exists');
  const report = await inspectAfSources();
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(report, null, 2));
}
