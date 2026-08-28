import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { JAPAN_POST_M2_URLS, normalizeJapanPostAssignments, summarizeJapanPostAssignments } from '../intake-postal-context-jp-m2.mjs';
import {
  POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
  type PostalContextAssertion,
  type PostalContextDigest,
  type PostalContextGraph,
  type PostalContextNode,
  type PostalContextSource,
} from '../../src/lib/postalContextGraph';
import { POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION } from '../../src/lib/postalContextSpatial';
import { POSTAL_CONTEXT_PACK_LIMITS } from '../../src/lib/postalContextTopology';
import {
  computePostalContextGraphManifestDigest,
  loadPostalContextPack,
  POSTAL_CONTEXT_PACK_DESCRIPTOR_SCHEMA_VERSION,
  type PostalContextPackDescriptor,
} from '../../src/server/postalContextPackStore';

export type JapanPostM2Row = ReturnType<typeof normalizeJapanPostAssignments>[number];
export type JapanPostM2Receipt = {
  schemaVersion: string;
  countryCode: string;
  status: string;
  observedAt: string;
  sourceRelease: string;
  synthetic: boolean;
  sources: {
    archive: { digest: string; byteLength: number; url: string };
    releasePage: { digest: string; url: string };
    termsPage: { digest: string; url: string };
    expandedCsv: { digest: string; byteLength: number };
  };
  summary: { rows: number; normalizedDigest: string };
};

const SHA256 = /^sha256:[a-f0-9]{64}$/;
const jsonBytes = (value: unknown) => Buffer.from(`${JSON.stringify(value)}\n`, 'utf8');
export const jpM2Digest = (value: Uint8Array | string): PostalContextDigest => `sha256:${createHash('sha256').update(value).digest('hex')}`;
const GRAPH_MEDIA = 'application/vnd.agid.postal-context-graph+json';
const GEOMETRY_MEDIA = 'application/vnd.agid.postal-context-geometry+json';

function assertReceipt(receipt: JapanPostM2Receipt, rows: JapanPostM2Row[]) {
  if (receipt.schemaVersion !== 'postal-context-jp-m2-intake/v1' || receipt.countryCode !== 'JP'
    || receipt.status !== 'intake_validated_not_m2' || typeof receipt.synthetic !== 'boolean') throw new Error('jp-m2-receipt-invalid');
  const time = new Date(receipt.observedAt);
  if (!Number.isFinite(time.getTime()) || time.toISOString() !== receipt.observedAt) throw new Error('jp-m2-observation-time-invalid');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receipt.sourceRelease) || receipt.sourceRelease > receipt.observedAt.slice(0, 10)) throw new Error('jp-m2-source-version-invalid');
  const sourceDate = new Date(receipt.sourceRelease + 'T00:00:00.000Z');
  if (!Number.isFinite(sourceDate.getTime()) || sourceDate.toISOString().slice(0, 10) !== receipt.sourceRelease) throw new Error('jp-m2-source-version-invalid');
  for (const key of ['archive', 'releasePage', 'termsPage', 'expandedCsv'] as const) {
    if (!SHA256.test(receipt.sources[key]?.digest)) throw new Error('jp-m2-source-digest-invalid');
  }
  for (const key of ['archive', 'expandedCsv'] as const) {
    const bytes = receipt.sources[key].byteLength;
    if (!Number.isSafeInteger(bytes) || bytes <= 0 || bytes > 64 * 1024 * 1024) throw new Error('jp-m2-source-size-invalid');
  }
  if (!receipt.synthetic && (receipt.sources.archive.url !== JAPAN_POST_M2_URLS.archive
    || receipt.sources.releasePage.url !== JAPAN_POST_M2_URLS.release
    || receipt.sources.termsPage.url !== JAPAN_POST_M2_URLS.terms)) throw new Error('jp-m2-official-source-url-required');
  const summary = summarizeJapanPostAssignments(rows);
  if (summary.rows !== receipt.summary.rows || summary.normalizedDigest !== receipt.summary.normalizedDigest) throw new Error('jp-m2-normalized-source-mismatch');
}

/** A source-observation experiment, not a national/current address service. */
export function buildJapanPostM2Pack(rows: JapanPostM2Row[], receipt: JapanPostM2Receipt, municipalityCodes: readonly string[]) {
  assertReceipt(receipt, rows);
  const scopeCodes = [...new Set(municipalityCodes)].sort();
  if (!scopeCodes.length || scopeCodes.length > 10 || scopeCodes.some(code => !/^\d{5}$/.test(code))) throw new Error('jp-m2-scope-invalid');
  const selected = rows.filter(row => scopeCodes.includes(row.localGovernmentCode));
  if (scopeCodes.some(code => !selected.some(row => row.localGovernmentCode === code))) throw new Error('jp-m2-scope-not-in-source');
  const codeSet = new Set(selected.map(row => row.postalCode));
  if (rows.some(row => codeSet.has(row.postalCode) && !scopeCodes.includes(row.localGovernmentCode))) throw new Error('jp-m2-postcode-crosses-scope-expand-selection');
  const scopeId = jpM2Digest(scopeCodes.join(',')).slice(7, 19);
  const releaseId = `jp-post-${receipt.sourceRelease}-${scopeId}-${receipt.observedAt.replace(/[^0-9]/g, '')}`;
  // Source effective dates are absent. This experiment evaluates only the recorded
  // observation, not an invented past/future lifetime for each assignment.
  const validTime = { from: receipt.observedAt, to: new Date(Date.parse(receipt.observedAt) + 1).toISOString() };
  const knownTime = { from: receipt.observedAt, to: null };
  const licenseId = receipt.synthetic ? 'AGID-SYNTHETIC-ONLY' : 'JP-POST-POSTCODE-NO-COPYRIGHT';
  const source: PostalContextSource = {
    sourceId: receipt.synthetic ? 'jp-m2-synthetic-assignment' : 'jp-post-postal-code-data',
    sourceType: receipt.synthetic ? 'synthetic' : 'official',
    assignmentAuthority: receipt.synthetic ? 'synthetic_fixture_assignment' : 'official_postal_operator',
    geometryAuthority: 'none', sourceVersion: receipt.sourceRelease, sourceDate: receipt.sourceRelease,
    licenseId, digest: receipt.sources.archive.digest as PostalContextDigest,
  };
  const nodes = new Map<string, PostalContextNode>();
  const assertions: PostalContextAssertion[] = [];
  const edges = new Set<string>();
  const addNode = (node: PostalContextNode) => {
    const old = nodes.get(node.id);
    if (old && JSON.stringify(old) !== JSON.stringify(node)) throw new Error('jp-m2-conflicting-source-label');
    nodes.set(node.id, node);
  };
  const node = (id: string, kind: PostalContextNode['kind'], featureKind: PostalContextNode['featureKind'], label: string, postalCode?: string) => {
    addNode({ id, kind, featureKind, geometryType: 'none', countryCode: 'JP', visibility: 'public', label, ...(postalCode ? { postalCode } : {}) });
  };
  const edge = (fromNodeId: string, toNodeId: string, rowNumber: number) => {
    const key = `${fromNodeId}|${toNodeId}`;
    if (edges.has(key)) return;
    edges.add(key);
    assertions.push({
      id: `jp-post:${receipt.sourceRelease}:row-${rowNumber}:${assertions.length + 1}`,
      fromNodeId, toNodeId, relation: 'admin_within', validTime, knownTime,
      source, method: 'source_relation', quality: { status: 'verified', validatedAt: receipt.observedAt },
      purposes: ['postal_lookup', 'display', 'validation'],
    });
  };
  node('jp-post:country:JP', 'administrative_area', 'country', '日本');
  for (const row of selected) {
    const prefecture = `jp-post:prefecture:${row.localGovernmentCode.slice(0, 2)}`;
    const municipality = `jp-post:municipality:${row.localGovernmentCode}`;
    const postal = `jp-post:postal:${row.postalCode}`;
    node(prefecture, 'administrative_area', 'administrative', row.prefecture);
    node(municipality, 'administrative_area', 'administrative', row.municipality);
    node(postal, 'postal_feature', 'unknown', row.postalCode, row.postalCode);
    edge(prefecture, 'jp-post:country:JP', row.sourceRow);
    edge(municipality, prefecture, row.sourceRow);
    if (['fallback_not_a_town', 'no_town_designator'].includes(row.classification)) {
      edge(postal, municipality, row.sourceRow);
    } else {
      const locality = `jp-post:${receipt.sourceRelease}:locality-row-${row.sourceRow}`;
      node(locality, 'locality', 'locality', row.townLabel);
      edge(postal, locality, row.sourceRow);
      edge(locality, municipality, row.sourceRow);
    }
  }
  if (nodes.size > POSTAL_CONTEXT_PACK_LIMITS.nodes || assertions.length > POSTAL_CONTEXT_PACK_LIMITS.assertions) throw new Error('jp-m2-scope-exceeds-runtime-budget');
  const geometry = { schemaVersion: POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION, countryCode: 'JP', releaseId, features: [] };
  const geometryBytes = jsonBytes(geometry);
  const scope = {
    schemaVersion: 'postal-context-jp-m2-scope/v1', countryCode: 'JP', releaseId,
    municipalityCodes: scopeCodes, selectedRows: selected.length, selectedPostalCodes: codeSet.size,
    nationalRowsValidated: receipt.summary.rows, nationalRuntimeCoverage: false,
    excludedNationalRows: rows.length - selected.length, sourcePartition: 'ordinary-locality-assignment-file-only',
    snapshotOnly: true, validAt: receipt.observedAt, validTime, knownTime,
    temporalPolicy: 'One-millisecond observation window only; not source-effective-date history or live assignment validity.',
    semantics: 'Japan Post labels and JIS references, not ABR town identity or legal administrative boundaries.',
    noTownDesignatorsBecomeLocalities: false, canonicalPostalPolygons: 0, buildingLinks: 0,
    agidRule: 'AGID is an independent coordinate index; absent geometry yields no postal spatial match or cover.',
    classificationCounts: summarizeJapanPostAssignments(selected).classifications,
  };
  const sourceEvidence = {
    schemaVersion: 'postal-context-jp-m2-source-evidence/v1', countryCode: 'JP', synthetic: receipt.synthetic,
    sourceRelease: receipt.sourceRelease, observedAt: receipt.observedAt, sources: receipt.sources,
    normalizedSourceDigest: receipt.summary.normalizedDigest, sourceRows: receipt.summary.rows,
    assignmentAuthority: source.assignmentAuthority, geometryAuthority: 'none', licenseId,
    termsExcerpt: receipt.synthetic ? 'Synthetic test evidence only.' : '郵便番号データに限っては日本郵便株式会社は著作権を主張しません。自由に配布していただいて結構です。',
    termsScope: 'Postal-code dataset only, not a licence to republish the complete website HTML or other sources.',
    transformations: ['strict-15-field-utf8-parser', 'conservative-exception-classification', 'explicit-municipality-scope', 'postal-label-hierarchy-without-geometry'],
  };
  // Preserve exact row flags/classification outside the runtime graph schema.
  // This sidecar is source evidence, not building or town-identity verification.
  const assignmentBytes = Buffer.from(selected.map(row => JSON.stringify(row)).join('\n') + '\n', 'utf8');
  const evidenceBytes = jsonBytes(sourceEvidence);
  const scopeBytes = jsonBytes(scope);
  const graph: PostalContextGraph = {
    schemaVersion: POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
    release: {
      schemaVersion: POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION, repositoryId: 'agid-postal-jp', countryCode: 'JP',
      releaseId, policyVersion: 'jp-m2-observation-only-v1', releasedAt: receipt.observedAt, validTime,
      manifestDigest: `sha256:${'0'.repeat(64)}`,
      artifacts: [
        { path: 'assignments.jsonl', mediaType: 'application/x-ndjson', digest: jpM2Digest(assignmentBytes), byteLength: assignmentBytes.length, recordCount: selected.length, licenseRefs: [licenseId] },
        { path: 'geometry.json', mediaType: GEOMETRY_MEDIA, digest: jpM2Digest(geometryBytes), byteLength: geometryBytes.length, recordCount: 0, licenseRefs: [licenseId] },
        { path: 'source-evidence.json', mediaType: 'application/json', digest: jpM2Digest(evidenceBytes), byteLength: evidenceBytes.length, licenseRefs: [licenseId] },
        { path: 'scope.json', mediaType: 'application/json', digest: jpM2Digest(scopeBytes), byteLength: scopeBytes.length, licenseRefs: [licenseId] },
        { path: 'japan-post-utf-ken-all.zip', mediaType: 'application/zip', digest: receipt.sources.archive.digest as PostalContextDigest, byteLength: receipt.sources.archive.byteLength, licenseRefs: [licenseId] },
      ],
    },
    nodes: [...nodes.values()], assertions,
  };
  graph.release.manifestDigest = computePostalContextGraphManifestDigest(graph.release) as PostalContextDigest;
  const graphBytes = jsonBytes(graph);
  if (graphBytes.length > POSTAL_CONTEXT_PACK_LIMITS.graphBytes) throw new Error('jp-m2-graph-byte-budget');
  const descriptor: PostalContextPackDescriptor = {
    schemaVersion: POSTAL_CONTEXT_PACK_DESCRIPTOR_SCHEMA_VERSION, repositoryId: 'agid-postal-jp', countryCode: 'JP',
    releaseId, policyVersion: graph.release.policyVersion, sequence: 1, previousDescriptorDigest: null,
    graphManifestDigest: graph.release.manifestDigest, createdAt: receipt.observedAt,
    maturity: 'M2_experimental', synthetic: receipt.synthetic, promotionEligible: false, containsResidentialAddressPoints: false,
    artifacts: [
      { role: 'graph', path: 'graph.json', mediaType: GRAPH_MEDIA, schemaVersion: POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION, byteLength: graphBytes.length, digest: jpM2Digest(graphBytes), recordCounts: { nodes: nodes.size, assertions: assertions.length } },
      { role: 'geometry', path: 'geometry.json', mediaType: GEOMETRY_MEDIA, schemaVersion: POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION, byteLength: geometryBytes.length, digest: jpM2Digest(geometryBytes), recordCounts: { features: 0, positions: 0 } },
    ],
  };
  const descriptorBytes = jsonBytes(descriptor);
  return {
    graph, descriptor, scope, selectedRows: selected,
    descriptorDigest: jpM2Digest(descriptorBytes),
    files: new Map([
      ['descriptor.json', descriptorBytes], ['graph.json', graphBytes], ['geometry.json', geometryBytes],
      ['source-evidence.json', evidenceBytes], ['scope.json', scopeBytes], ['assignments.jsonl', assignmentBytes],
    ]),
  };
}

export function materializeJapanPostM2Pack(directory: string, built: ReturnType<typeof buildJapanPostM2Pack>) {
  mkdirSync(directory); // Existing directories are deliberately not overwritten.
  for (const [name, bytes] of built.files) writeFileSync(join(directory, name), bytes, { flag: 'wx' });
  return loadPostalContextPack(join(directory, 'descriptor.json'), built.descriptorDigest, {
    expectedCountryCode: 'JP', allowExperimental: true, allowSynthetic: built.descriptor.synthetic,
  });
}
