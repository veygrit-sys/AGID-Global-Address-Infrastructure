import { probeOfficialReference, sourceDigest } from './lib/postal-context-source-probe.mjs';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROFILE = new URL('../data/postal_country_packs/ae/postal-context/source-profile.json', import.meta.url);
const HOSTS = new Set(['www.upu.int', 'www.emiratespost.ae', 'pages.dmt.gov.ae', 'www.dmt.gov.ae', 'www.dm.gov.ae', 'www.dubaipulse.gov.ae']);
export const aeReferenceDigest = sourceDigest;
export const probeAeReference = (reference, fetcher = fetch) => probeOfficialReference(reference, HOSTS, fetcher);

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
