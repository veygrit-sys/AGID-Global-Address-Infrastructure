import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';

import {
  buildAOIDEncryptedSyncEnvelope,
  buildAOIDPublicDescriptor,
  buildAOIDSyncQueuePayload,
  generateAOID,
  normalizeAOIDId,
  redactAOIDForPublicUse,
} from '../src/lib/aoid';
import { encodeAGID, getGridFeatures } from '../src/lib/agid';
import {
  issueAddressCredential,
  verifyAddressCredential,
  type AddressCredentialEnvelope,
} from '../src/lib/addressCredential';
import {
  createAddressCredentialFreshnessProof,
  stripPrivateAddressCredentialFreshnessProofMaterial,
  verifyAddressCredentialFreshnessProof,
  type AddressCredentialRevocationRegistrySnapshot,
} from '../src/lib/addressCredentialFreshnessProof';
import {
  createAddressDuplicateNullifierProof,
  generateOwnerNullifierSecret,
  verifyAddressDuplicateNullifierProof,
} from '../src/lib/addressDuplicateNullifier';
import {
  createAOIDOwnershipProof,
  generateAOIDOwnerKeyPair,
  stripPrivateAOIDOwnershipProofMaterial,
  verifyAOIDOwnershipProof,
  type AOIDOwnerKeyPairJwk,
} from '../src/lib/aoidOwnershipProof';
import { buildRegularMetricGridFeatures } from '../src/lib/gridWorkerWasm';
import {
  buildRegisteredAddressQrPayload,
  buildRegisteredAddressRecord,
  buildSavedQrFromRegisteredAddress,
  type RegisteredAddressRecord,
} from '../src/lib/registeredAddressQr';
import { sanitizeDatabaseRecords } from '../src/lib/appDatabase';
import { buildSyncQueueRecord } from '../src/lib/syncQueue';

type BenchFn = () => void | Promise<void>;

type BenchCase = {
  category: string;
  name: string;
  batchSizes: number[];
  fn: BenchFn;
  note?: string;
};

type BenchResult = {
  category: string;
  name: string;
  batchSize: number;
  coldMs: number;
  totalMs: number;
  meanMs: number;
  medianMs: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  opsPerSecond: number;
  note?: string;
};

const STANDARD_BATCHES = [1, 100, 1_000, 10_000];
const MEDIUM_BATCHES = [1, 100, 1_000];
const CRYPTO_BATCHES = [1, 100];
const HEAVY_CRYPTO_BATCHES = [1, 25];
const PROOF_BATCHES = [1, 25];
const SVG_BATCHES = [1, 10, 100];
const textEncoder = new TextEncoder();

const coordinate = {
  lat: 35.681236,
  lon: 139.767125,
};

const address = {
  country_code: 'JP',
  country: 'Japan',
  state: 'Tokyo',
  city: 'Chiyoda-ku',
  district: 'Marunouchi',
  road: 'Marunouchi',
  house_number: '1',
  building: 'Benchmark Tower',
  postcode: '100-0001',
};

const formData = {
  country: 'Japan',
  recipient: 'Benchmark Receiver',
  organization: 'AGID Lab',
  street: 'Marunouchi 1',
  city: 'Chiyoda-ku',
  state: 'Tokyo',
  postcode: '100-0001',
  phone: '+81-3-0000-0000',
  building: 'Benchmark Tower',
  room: '1201',
};

const credentialIssuerId = 'agid-benchmark-credential-issuer';
const credentialIssuerSecret = 'benchmark-only-address-credential-issuer-secret';
const proofIssuerId = 'agid-benchmark-proof-issuer';
const proofIssuerSecret = 'benchmark-only-proof-issuer-secret';
const benchmarkStartedAt = new Date();
const issuedAt = benchmarkStartedAt.toISOString();
const verificationNow = new Date(benchmarkStartedAt.getTime() + 5 * 60 * 1000).toISOString();
const credentialTtlSeconds = 24 * 60 * 60;
const registry: AddressCredentialRevocationRegistrySnapshot = {
  id: 'aoid-benchmark-revocation-list',
  version: verificationNow,
  checkedAt: verificationNow,
  freshUntil: new Date(benchmarkStartedAt.getTime() + 15 * 60 * 1000).toISOString(),
  sourceIds: ['agid-local-status-list'],
};

function formatMs(value: number) {
  if (!Number.isFinite(value)) return 'n/a';
  if (value >= 10) return value.toFixed(2);
  if (value >= 1) return value.toFixed(3);
  if (value >= 0.01) return value.toFixed(4);
  return value.toFixed(5);
}

function percentile(sortedValues: number[], percentileValue: number) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sortedValues.length) - 1),
  );
  return sortedValues[index];
}

function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function runMaybeAsync(fn: BenchFn) {
  const result = fn();
  if (result && typeof (result as Promise<void>).then === 'function') {
    await result;
  }
}

async function timed(fn: BenchFn) {
  const startedAt = performance.now();
  await runMaybeAsync(fn);
  return performance.now() - startedAt;
}

async function measureCase(benchCase: BenchCase, batchSize: number): Promise<BenchResult> {
  const coldMs = await timed(benchCase.fn);
  const warmupCount = Math.min(20, Math.max(1, Math.floor(batchSize / 10)));
  for (let index = 0; index < warmupCount; index += 1) {
    await runMaybeAsync(benchCase.fn);
  }

  const samples: number[] = [];
  const batchStartedAt = performance.now();
  for (let index = 0; index < batchSize; index += 1) {
    samples.push(await timed(benchCase.fn));
  }
  const totalMs = performance.now() - batchStartedAt;
  const sorted = [...samples].sort((a, b) => a - b);

  return {
    category: benchCase.category,
    name: benchCase.name,
    batchSize,
    coldMs,
    totalMs,
    meanMs: mean(samples),
    medianMs: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    p99Ms: percentile(sorted, 99),
    maxMs: sorted[sorted.length - 1] ?? 0,
    opsPerSecond: totalMs > 0 ? (batchSize / totalMs) * 1000 : 0,
    note: benchCase.note,
  };
}

function buildAoidAddressCard(record: RegisteredAddressRecord) {
  return React.createElement(
    'article',
    { className: 'aoid-card', 'data-id': record.id },
    React.createElement('h2', null, record.id),
    React.createElement('p', null, record.name),
    React.createElement('p', null, record.address),
    React.createElement('small', null, `${record.country ?? ''} ${record.postcode ?? ''}`.trim()),
  );
}

async function issueAoidCredential(privateSalt = 'benchmark-credential-private-salt'): Promise<AddressCredentialEnvelope> {
  return issueAddressCredential({
    issuerId: credentialIssuerId,
    issuerSecret: credentialIssuerSecret,
    layer: 'AOID',
    subjectId: 'aoid:benchmark-subject',
    address,
    countryCode: 'JP',
    postalCode: '100-0001',
    verificationStatus: 'verified',
    verificationScore: 0.94,
    sourceIds: ['zipcloud', 'japan-post'],
    policyVersion: 'address-verification-engine-v1',
    issuedAt,
    ttlSeconds: credentialTtlSeconds,
    privateSalt,
  });
}

async function buildBenchCases() {
  const agid = encodeAGID(coordinate.lat, coordinate.lon);
  const aoid = generateAOID(agid.id);
  const record = buildRegisteredAddressRecord(formData, {
    mode: 'AOID',
    id: aoid,
    agid: agid.id,
    coords: coordinate,
    now: issuedAt,
  });
  const publicQrPayload = buildRegisteredAddressQrPayload(record, { privacy: 'public' });
  const fullQrPayload = buildRegisteredAddressQrPayload(record);
  const savedQr = buildSavedQrFromRegisteredAddress(record, publicQrPayload, issuedAt);
  const encryptedEnvelope = buildAOIDEncryptedSyncEnvelope(record, {
    encryptedPayload: 'opaque-owner-device-ciphertext-benchmark',
    ownerKeyId: 'owner-key-benchmark',
    deviceKeyId: 'device-key-benchmark',
    now: Date.parse(issuedAt),
  });
  const credential = await issueAoidCredential();
  const ownerSecret = generateOwnerNullifierSecret();
  const ownerKeyPair = await generateAOIDOwnerKeyPair();

  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new Error('Web Crypto API is required for benchmark crypto cases.');
  }
  const ecdsaKeyPair = await cryptoApi.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign', 'verify'],
  ) as CryptoKeyPair;
  const hmacKey = await cryptoApi.subtle.importKey(
    'raw',
    textEncoder.encode('benchmark-hmac-key'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  const signPayload = textEncoder.encode('agid/aoid benchmark payload');
  const ecdsaSignature = await cryptoApi.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    ecdsaKeyPair.privateKey,
    signPayload,
  );
  const hmacSignature = await cryptoApi.subtle.sign('HMAC', hmacKey, signPayload);

  const nullifierProof = await createAddressDuplicateNullifierProof({
    credential,
    credentialIssuerSecret,
    address,
    aoid,
    ownerNullifierSecret: ownerSecret,
    registryId: 'main-registry',
    regionKey: 'jp/tokyo/chiyoda',
    regionLevel: 'city',
    issuedAt,
    ttlSeconds: 3600,
    minimumScore: 0.9,
  });

  const ownershipProof = await createAOIDOwnershipProof({
    issuerId: proofIssuerId,
    issuerSecret: proofIssuerSecret,
    scope: 'delivery-registration',
    challenge: 'delivery-session-nonce-001',
    aoid,
    ownerPrivateKeyJwk: ownerKeyPair.privateKeyJwk,
    ownerPublicKeyJwk: ownerKeyPair.publicKeyJwk,
    issuedAt,
    ttlSeconds: 3600,
    privateProofSalt: 'owner-proof-private-salt',
  });
  const publicOwnershipProof = stripPrivateAOIDOwnershipProofMaterial(ownershipProof);

  const freshnessProof = await createAddressCredentialFreshnessProof({
    issuerId: proofIssuerId,
    issuerSecret: proofIssuerSecret,
    credential,
    credentialIssuerSecret,
    revocationRegistry: registry,
    scope: 'delivery-checkout',
    challenge: 'checkout-freshness-nonce-001',
    issuedAt: verificationNow,
    freshnessSeconds: 600,
    ttlSeconds: 600,
    privateProofSalt: 'freshness-private-proof-salt',
    minimumCredentialScore: 0.9,
    expectedLayer: 'AOID',
  });
  const publicFreshnessProof = stripPrivateAddressCredentialFreshnessProofMaterial(freshnessProof);

  const workerBounds: [[number, number], [number, number]] = [
    [139.75, 35.67],
    [139.78, 35.69],
  ];

  const cases: BenchCase[] = [
    {
      category: 'single',
      name: 'AGID encode',
      batchSizes: STANDARD_BATCHES,
      fn: () => {
        encodeAGID(coordinate.lat, coordinate.lon);
      },
    },
    {
      category: 'single',
      name: 'AOID generate linked to AGID',
      batchSizes: STANDARD_BATCHES,
      fn: () => {
        generateAOID(agid.id);
      },
    },
    {
      category: 'single',
      name: 'AOID normalize and reserved-pattern check',
      batchSizes: STANDARD_BATCHES,
      fn: () => {
        normalizeAOIDId(aoid, { linkedAgid: agid.id });
      },
    },
    {
      category: 'single',
      name: 'AOID public descriptor',
      batchSizes: STANDARD_BATCHES,
      fn: () => {
        buildAOIDPublicDescriptor(record);
      },
    },
    {
      category: 'single',
      name: 'AOID public redaction',
      batchSizes: STANDARD_BATCHES,
      fn: () => {
        redactAOIDForPublicUse(record);
      },
    },
    {
      category: 'single',
      name: 'QR payload public',
      batchSizes: MEDIUM_BATCHES,
      fn: () => {
        buildRegisteredAddressQrPayload(record, { privacy: 'public' });
      },
    },
    {
      category: 'single',
      name: 'QR payload full private',
      batchSizes: MEDIUM_BATCHES,
      fn: () => {
        buildRegisteredAddressQrPayload(record);
      },
    },
    {
      category: 'single',
      name: 'Saved QR record materialization',
      batchSizes: STANDARD_BATCHES,
      fn: () => {
        buildSavedQrFromRegisteredAddress(record, fullQrPayload, issuedAt);
      },
    },
    {
      category: 'single',
      name: 'AGID grid features range=5',
      batchSizes: [1, 100],
      fn: () => {
        getGridFeatures(coordinate.lat, coordinate.lon, 5);
      },
    },
    {
      category: 'crypto',
      name: 'WebCrypto ECDSA P-256 key generation',
      batchSizes: HEAVY_CRYPTO_BATCHES,
      fn: async () => {
        await cryptoApi.subtle.generateKey(
          { name: 'ECDSA', namedCurve: 'P-256' },
          false,
          ['sign', 'verify'],
        );
      },
      note: '10,000件は低速端末で重いので別途長時間ベンチ対象',
    },
    {
      category: 'crypto',
      name: 'WebCrypto ECDSA sign cached key',
      batchSizes: CRYPTO_BATCHES,
      fn: async () => {
        await cryptoApi.subtle.sign(
          { name: 'ECDSA', hash: 'SHA-256' },
          ecdsaKeyPair.privateKey,
          signPayload,
        );
      },
    },
    {
      category: 'crypto',
      name: 'WebCrypto ECDSA verify cached key',
      batchSizes: CRYPTO_BATCHES,
      fn: async () => {
        await cryptoApi.subtle.verify(
          { name: 'ECDSA', hash: 'SHA-256' },
          ecdsaKeyPair.publicKey,
          ecdsaSignature,
          signPayload,
        );
      },
    },
    {
      category: 'crypto',
      name: 'WebCrypto HMAC sign cached key',
      batchSizes: CRYPTO_BATCHES,
      fn: async () => {
        await cryptoApi.subtle.sign('HMAC', hmacKey, signPayload);
      },
    },
    {
      category: 'crypto',
      name: 'WebCrypto HMAC verify cached key',
      batchSizes: CRYPTO_BATCHES,
      fn: async () => {
        await cryptoApi.subtle.verify('HMAC', hmacKey, hmacSignature, signPayload);
      },
    },
    {
      category: 'crypto',
      name: 'Address credential issue',
      batchSizes: PROOF_BATCHES,
      fn: async () => {
        await issueAoidCredential();
      },
    },
    {
      category: 'crypto',
      name: 'Address credential verify',
      batchSizes: PROOF_BATCHES,
      fn: async () => {
        await verifyAddressCredential(credential, {
          issuerId: credentialIssuerId,
          issuerSecret: credentialIssuerSecret,
          expectedLayer: 'AOID',
          minimumScore: 0.9,
          allowedStatuses: ['verified'],
          address,
          now: verificationNow,
        });
      },
    },
    {
      category: 'crypto',
      name: 'Duplicate nullifier proof create',
      batchSizes: PROOF_BATCHES,
      fn: async () => {
        await createAddressDuplicateNullifierProof({
          credential,
          credentialIssuerSecret,
          address,
          aoid,
          ownerNullifierSecret: ownerSecret,
          registryId: 'main-registry',
          regionKey: 'jp/tokyo/chiyoda',
          regionLevel: 'city',
          issuedAt,
          ttlSeconds: 3600,
          minimumScore: 0.9,
        });
      },
      note: '現行はZK-ready envelopeであり本物のZKP proverではない',
    },
    {
      category: 'crypto',
      name: 'Duplicate nullifier proof verify',
      batchSizes: MEDIUM_BATCHES,
      fn: () => {
        verifyAddressDuplicateNullifierProof(nullifierProof, {
          registryId: 'main-registry',
          regionKey: 'jp/tokyo/chiyoda',
          now: verificationNow,
          minimumScore: 0.9,
        });
      },
    },
    {
      category: 'crypto',
      name: 'AOID ownership proof create owner-key',
      batchSizes: HEAVY_CRYPTO_BATCHES,
      fn: async () => {
        await createAOIDOwnershipProof({
          issuerId: proofIssuerId,
          issuerSecret: proofIssuerSecret,
          scope: 'delivery-registration',
          challenge: 'delivery-session-nonce-001',
          aoid,
          ownerPrivateKeyJwk: ownerKeyPair.privateKeyJwk,
          ownerPublicKeyJwk: ownerKeyPair.publicKeyJwk,
          issuedAt,
          ttlSeconds: 3600,
          privateProofSalt: 'owner-proof-private-salt',
        });
      },
      note: 'ECDSA key import + sign + issuer HMACを含む',
    },
    {
      category: 'crypto',
      name: 'AOID ownership proof verify owner-key',
      batchSizes: HEAVY_CRYPTO_BATCHES,
      fn: async () => {
        await verifyAOIDOwnershipProof(publicOwnershipProof, {
          issuerId: proofIssuerId,
          issuerSecret: proofIssuerSecret,
          ownerPublicKeyJwk: (ownerKeyPair as AOIDOwnerKeyPairJwk).publicKeyJwk,
          expectedScope: 'delivery-registration',
          expectedChallenge: 'delivery-session-nonce-001',
          requireOwnerKey: true,
          now: verificationNow,
        });
      },
      note: 'ECDSA public key import + verify + issuer HMAC verifyを含む',
    },
    {
      category: 'crypto',
      name: 'Freshness/revocation proof create',
      batchSizes: PROOF_BATCHES,
      fn: async () => {
        await createAddressCredentialFreshnessProof({
          issuerId: proofIssuerId,
          issuerSecret: proofIssuerSecret,
          credential,
          credentialIssuerSecret,
          revocationRegistry: registry,
          scope: 'delivery-checkout',
          challenge: 'checkout-freshness-nonce-001',
          issuedAt: verificationNow,
          freshnessSeconds: 600,
          ttlSeconds: 600,
          privateProofSalt: 'freshness-private-proof-salt',
          minimumCredentialScore: 0.9,
          expectedLayer: 'AOID',
        });
      },
      note: '現行は失効リストroot commitment + freshness envelope',
    },
    {
      category: 'crypto',
      name: 'Freshness/revocation proof verify',
      batchSizes: PROOF_BATCHES,
      fn: async () => {
        await verifyAddressCredentialFreshnessProof(publicFreshnessProof, {
          issuerId: proofIssuerId,
          issuerSecret: proofIssuerSecret,
          expectedScope: 'delivery-checkout',
          expectedChallenge: 'checkout-freshness-nonce-001',
          expectedCredentialIssuerId: credentialIssuerId,
          expectedLayer: 'AOID',
          trustedRegistryIds: ['AOID-BENCHMARK-REVOCATION-LIST'],
          minimumCredentialScore: 0.9,
          allowedCredentialStatuses: ['verified'],
          now: '2026-01-01T00:06:00.000Z',
          maxFreshnessAgeSeconds: 600,
        });
      },
    },
    {
      category: 'ui-approx',
      name: 'QR SVG render to static markup',
      batchSizes: SVG_BATCHES,
      fn: () => {
        renderToStaticMarkup(
          React.createElement(QRCodeSVG, {
            value: publicQrPayload,
            size: 120,
            level: 'H',
            includeMargin: false,
          }),
        );
      },
      note: 'Canvas paint/toDataURLはブラウザ実測が必要',
    },
    {
      category: 'ui-approx',
      name: 'AOID address card React SSR markup',
      batchSizes: MEDIUM_BATCHES,
      fn: () => {
        renderToStaticMarkup(buildAoidAddressCard(record));
      },
      note: '実ブラウザのlayout/paintは未計測',
    },
    {
      category: 'ui-approx',
      name: 'IndexedDB payload sanitize fallback',
      batchSizes: MEDIUM_BATCHES,
      fn: () => {
        sanitizeDatabaseRecords([record, savedQr, { id: '', bad: true }]);
      },
      note: 'IndexedDB write latencyそのものではない',
    },
    {
      category: 'ui-approx',
      name: 'Sync queue add AOID local-device',
      batchSizes: MEDIUM_BATCHES,
      fn: () => {
        buildSyncQueueRecord({
          entityType: 'aoid',
          entityId: record.id,
          action: 'update',
          payload: record,
          now: Date.parse(issuedAt),
          targetSurface: 'local-device',
        });
      },
    },
    {
      category: 'ui-approx',
      name: 'AOID sync queue encrypted envelope',
      batchSizes: MEDIUM_BATCHES,
      fn: () => {
        buildAOIDSyncQueuePayload(encryptedEnvelope);
      },
    },
    {
      category: 'ui-approx',
      name: 'Worker message structuredClone model',
      batchSizes: STANDARD_BATCHES,
      fn: () => {
        structuredClone({
          lat: coordinate.lat,
          lon: coordinate.lon,
          zoom: 18,
          bounds: workerBounds,
          requestId: 'benchmark-grid-request',
        });
      },
      note: '実Worker postMessage往復ではない',
    },
    {
      category: 'ui-approx',
      name: 'Worker grid compute model',
      batchSizes: [1, 100],
      fn: () => {
        buildRegularMetricGridFeatures({
          lat: coordinate.lat,
          lon: coordinate.lon,
          zoom: 18,
          columns: 25,
          rows: 25,
          bounds: workerBounds,
          paddingCells: 8,
        });
      },
      note: 'Worker越しの転送・スケジューリングは含まない',
    },
  ];

  return { cases, fixture: { agid: agid.id, aoid, qrPayloadBytes: Buffer.byteLength(publicQrPayload) } };
}

function groupedResults(results: BenchResult[]) {
  const groups = new Map<string, BenchResult[]>();
  for (const result of results) {
    const key = result.category;
    groups.set(key, [...(groups.get(key) ?? []), result]);
  }
  return groups;
}

function renderMarkdown(results: BenchResult[], fixture: { agid: string; aoid: string; qrPayloadBytes: number }) {
  const generatedAt = new Date().toISOString();
  const lines: string[] = [
    '# AGID/AOID Strict Performance Benchmark',
    '',
    `Generated: ${generatedAt}`,
    '',
    '## Scope',
    '',
    'This benchmark separates single-operation work, WebCrypto-backed cryptographic work, UI approximations, and bulk counts. It reports cold run, mean, median, p95, p99, max, and throughput. The measurements are local Node.js measurements, not mobile-device measurements.',
    '',
    'Important limitation: current ZK-related modules generate ZK-ready envelopes and commitments, not full zero-knowledge proof circuits. Real prover/verifier costs must be benchmarked after a concrete proving backend is selected.',
    '',
    '## Fixture',
    '',
    `- AGID: \`${fixture.agid}\``,
    `- AOID: \`${fixture.aoid}\``,
    `- Public QR payload bytes: ${fixture.qrPayloadBytes}`,
    '',
  ];

  for (const [category, categoryResults] of groupedResults(results)) {
    lines.push(`## ${category}`);
    lines.push('');
    lines.push('| Operation | n | cold ms | mean ms | median ms | p95 ms | p99 ms | max ms | ops/sec | note |');
    lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---|');
    for (const result of categoryResults) {
      lines.push([
        result.name,
        result.batchSize.toLocaleString('en-US'),
        formatMs(result.coldMs),
        formatMs(result.meanMs),
        formatMs(result.medianMs),
        formatMs(result.p95Ms),
        formatMs(result.p99Ms),
        formatMs(result.maxMs),
        Math.round(result.opsPerSecond).toLocaleString('en-US'),
        result.note ?? '',
      ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
    }
    lines.push('');
  }

  const worstP99 = [...results].sort((a, b) => b.p99Ms - a.p99Ms).slice(0, 10);
  lines.push('## Strict Reading');
  lines.push('');
  lines.push('The strongest claims should be limited to the rows actually measured above. In particular, do not use these Node.js values to claim mobile Canvas, IndexedDB, Worker round-trip, or real ZKP proving performance.');
  lines.push('');
  lines.push('Highest p99 rows:');
  lines.push('');
  for (const result of worstP99) {
    lines.push(`- ${result.category} / ${result.name} / n=${result.batchSize}: p99=${formatMs(result.p99Ms)}ms, max=${formatMs(result.maxMs)}ms`);
  }
  lines.push('');
  lines.push('Unmeasured but required before a strong production claim:');
  lines.push('');
  lines.push('- Browser Canvas QR paint and PNG export (`toDataURL`) on desktop and mobile.');
  lines.push('- IndexedDB write/read latency and quota behavior with 1, 100, 1,000, and 10,000 records.');
  lines.push('- Real Worker `postMessage` round-trip, transfer costs, and cancellation behavior.');
  lines.push('- Low-end mobile cold-start WebCrypto key generation, first proof generation, p95, p99, and max.');
  lines.push('- Full ZKP prover/verifier cost after selecting the backend and circuits.');
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const { cases, fixture } = await buildBenchCases();
  const results: BenchResult[] = [];

  for (const benchCase of cases) {
    for (const batchSize of benchCase.batchSizes) {
      results.push(await measureCase(benchCase, batchSize));
    }
  }

  const markdown = renderMarkdown(results, fixture);
  if (process.argv.includes('--write')) {
    writeFileSync('docs/agid-aoid-strict-performance-benchmark-2026-06-07.md', markdown);
  }
  console.log(markdown);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
