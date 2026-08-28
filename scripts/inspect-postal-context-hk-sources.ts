import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBoundedOfficialResponse, probeOfficialReference, sourceDigest } from './lib/postal-context-source-probe.mjs';
import { parseHongKongAlsCandidates, linkHongKongCandidateCell } from '../src/lib/postalContextHongKongCandidate';

const contract = JSON.parse(readFileSync(new URL('../data/postal_country_packs/hk/postal-context/m2-source-review.json', import.meta.url), 'utf8'));
const HOSTS = new Set(['www.hongkongpost.hk', 'data.gov.hk', 'www.als.gov.hk']);
const cleanError = (error: unknown) => error instanceof Error && /^hk-[a-z-]+$/.test(error.message) ? error.message : 'network-or-content-check-failed';
type Fetcher = typeof fetch;
type Reference = { id: string; contentVerified: boolean; responseDigest?: string; [key: string]: unknown };

export function hongKongLookupUrl(query: string) {
  if (!contract.live_queries.includes(query)) throw new Error('hk-query-outside-reviewed-scope');
  const url = new URL('https://www.als.gov.hk/lookup');
  url.searchParams.set('q', query);
  for (const [key, value] of Object.entries(contract.request_parameters)) url.searchParams.set(key, String(value));
  return url.href;
}

export async function inspectHongKongSources(fetcher: Fetcher = fetch, referenceProbe: typeof probeOfficialReference = probeOfficialReference) {
  const report = { schemaVersion: 'postal-context-hk-source-review/v1', countryCode: 'HK', observedAt: new Date().toISOString(), completedAt: '',
    references: [] as Reference[], queries: [] as Record<string, unknown>[], repeat: null as Record<string, unknown> | null,
    geoAddressLookup: null as Record<string, unknown> | null,
    safety: { publicGovernmentBuildingQueriesOnly: true, userAuthenticationPerformed: false, clickThroughAcceptancePerformed: false,
      browsewrapTermsNotALegalNoContractAssertion: true, additionalPaidOperations: 0, dataRowsPersisted: 0, unitsOrRecipientsRequested: false,
      newRepositoriesOrSpacesCreated: 0, publishedDataArtifacts: 0, sourceSnapshotsRetained: 0 },
    rights: { portalTermsVersion: contract.terms_version, conditionalCommercialAndNoncommercialReuse: false, attributionRequired: true,
      indemnityConditionPresent: true, dictionaryReproductionSeparatelyRestricted: true, publicationApproved: false },
    sourceEdition: null, completeNationalCoverageVerified: false, atomicSnapshotVerified: false,
    realCandidateAdapterVerified: false, realCoordinateCellChecks: 0, realPublishedPackLoaderApiVerified: false, countryM2Achieved: false };
  for (const ref of contract.reference_probes) {
    try { report.references.push({ ...await referenceProbe(ref, HOSTS, fetcher), observedAt: new Date().toISOString() }); }
    catch (error) { report.references.push({ id: ref.id, requestedUrl: ref.url, contentVerified: false, status: 'probe-error', error: cleanError(error), observedAt: new Date().toISOString() }); }
  }
  // Do not query actual address records when the reviewed policy/terms/interface drift.
  if (report.references.some(r => !r.contentVerified)) { report.completedAt = new Date().toISOString(); return report; }
  const termsDigest = report.references.find(r => r.id === 'hk-open-data-terms')!.responseDigest!;
  report.rights.conditionalCommercialAndNoncommercialReuse = true;
  const jsonFetcher: Fetcher = (url, options) => fetcher(url, { ...options, credentials: 'omit', headers: { Accept: 'application/json', 'Accept-Language': 'en,zh-Hant' } });
  const query = async (url: string) => {
    const r = await fetchBoundedOfficialResponse(url, { allowedHosts: HOSTS, fetcher: jsonFetcher, maxBytes: contract.limits.max_response_bytes });
    const receipt = { ...r.metadata, observedAt: new Date().toISOString(), byteLength: r.bytes?.length ?? 0, responseDigest: r.bytes ? sourceDigest(r.bytes) : null };
    if (!r.bytes || r.metadata.httpStatus !== 200 || !(r.metadata.contentType ?? '').startsWith('application/json')) throw new Error('hk-response-http-or-mime');
    const result = parseHongKongAlsCandidates(r.bytes, { url, observedAt: receipt.observedAt, responseDigest: receipt.responseDigest!,
      termsUrl: 'https://data.gov.hk/en/terms-and-conditions', termsDigest }, contract.limits.max_rows);
    const cells = result.candidates.map(linkHongKongCandidateCell).filter(v => v !== null);
    // Identity comparison ignores transport echo, score, response pointer and observation time.
    const semanticDigest = sourceDigest(Buffer.from(JSON.stringify(result.candidates.map(c => [c.geoAddress, c.address, c.location]))));
    return { receipt: { ...receipt, status: 'bounded-live-candidates-not-data-release', profile: result.summary, semanticDigest,
      coordinateCellChecks: cells.length, sourceCountryIdentityPreserved: cells.every(c => c.sourceCountryCode === 'HK' && !c.countryIdentityOverridden),
      encodedPrefixCounts: Object.fromEntries([...new Set(cells.map(c => c.encodedPrefix))].map(p => [p, cells.filter(c => c.encodedPrefix === p).length])),
      rawRowsPersisted: 0, exactBuildingFootprints: 0 }, candidates: result.candidates };
  };
  let first: Awaited<ReturnType<typeof query>> | null = null;
  for (const name of contract.live_queries) {
    const url = hongKongLookupUrl(name);
    try { const result = await query(url); first ??= result; report.queries.push(result.receipt); report.realCoordinateCellChecks += result.receipt.coordinateCellChecks; }
    catch (error) { report.queries.push({ requestedUrl: url, status: 'probe-error', error: cleanError(error), observedAt: new Date().toISOString() }); }
  }
  if (first) {
    try { const again = await query(first.receipt.requestedUrl); report.repeat = { ...again.receipt,
      byteIdentical: again.receipt.responseDigest === first.receipt.responseDigest, semanticIdentical: again.receipt.semanticDigest === first.receipt.semanticDigest }; }
    catch (error) { report.repeat = { status: 'probe-error', error: cleanError(error) }; }
    const ga = first.candidates[0]?.geoAddress.value;
    if (ga) {
      const url = new URL('https://www.als.gov.hk/galookup'); url.searchParams.set('ga', ga); url.searchParams.set('n', '10'); url.searchParams.set('3d', '0');
      try { const byId = await query(url.href); report.geoAddressLookup = { ...byId.receipt,
        allReturnedIdentifiersMatch: byId.candidates.every(c => c.geoAddress.value === ga),
        sameSemanticDigestAsFirstQuery: byId.receipt.semanticDigest === first.receipt.semanticDigest }; }
      catch (error) { report.geoAddressLookup = { status: 'probe-error', error: cleanError(error) }; }
    }
  }
  report.realCandidateAdapterVerified = report.queries.length === contract.live_queries.length && report.queries.every(q => q.status !== 'probe-error') && report.realCoordinateCellChecks > 0
    && report.repeat?.semanticIdentical === true && report.geoAddressLookup?.allReturnedIdentifiersMatch === true;
  report.completedAt = new Date().toISOString();
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--report') throw new Error('usage: tsx scripts/inspect-postal-context-hk-sources.ts --report new.json');
  const path = resolve(args[1]); if (existsSync(path)) throw new Error('report-already-exists');
  const report = await inspectHongKongSources(); mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ referencesVerified: report.references.filter(r => r.contentVerified).length,
    queries: report.queries, repeat: report.repeat, geoAddressLookup: report.geoAddressLookup,
    realCandidateAdapterVerified: report.realCandidateAdapterVerified, countryM2Achieved: false }));
}
