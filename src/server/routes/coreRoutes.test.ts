import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { ADDRESS_CREDENTIAL_VERSION } from '../../lib/addressCredential';
import { buildAOIDEncryptedSyncEnvelope } from '../../lib/aoid';
import { buildRegisteredAddressRecord } from '../../lib/registeredAddressQr';
import { registerCoreApiRoutes } from './coreRoutes';

let server: Server;
let baseUrl = '';
const zkScope = 'delivery-checkout';
const zkAudience = 'delivery-service';
const zkChallengeHash = 'bundle-challenge-hash-001';
const zkIssuedAt = '2026-01-01T00:05:00.000Z';
const zkExpiresAt = '2026-01-01T00:06:00.000Z';

const revocationRegistry = {
  id: 'aoid-revocation-list',
  version: '2026-01-01T00:05:00Z',
  checkedAt: '2026-01-01T00:05:00.000Z',
  freshUntil: '2026-01-01T00:15:00.000Z',
  sourceIds: ['agid-local-status-list', 'issuer-status-feed'],
  revokedCredentialHashes: ['secret-revoked-credential-handle-a'],
  revokedSubjectHashes: ['secret-revoked-subject-handle-b'],
  revokedAddressCommitmentHashes: ['secret-revoked-address-handle-c'],
  revokedIssuerScopedHashes: ['secret-revoked-issuer-handle-d'],
};

const privateAmnAddress = '東京都千代田区丸の内1丁目9-1 private unit 10F phone +81-3-SECRET';

const amnCandidates = [
  {
    id: 'jp-official-tokyo-station',
    label: '東京都千代田区丸の内1丁目9-1',
    canonical: {
      country_code: 'jp',
      country: 'Japan',
      state: 'Tokyo',
      city: 'Chiyoda',
      subdistrict: 'Marunouchi',
      road: 'Marunouchi',
      house_number: '1-9-1',
      postcode: '1000005',
    },
    lat: 35.681236,
    lon: 139.767125,
    sources: ['jp-open-data', 'nominatim'],
    confidence: 0.94,
    validationScore: 0.96,
    historyEvents: [
      { kind: 'delivery_success', weight: 4, source: 'carrier-proof' },
      { kind: 'manual_confirmation', weight: 2, source: 'owner-device' },
    ],
  },
  {
    id: 'osm-tokyo-station',
    label: '1-9-1 Marunouchi, Chiyoda City, Tokyo 100-0005, Japan',
    canonical: {
      country_code: 'jp',
      country: 'Japan',
      state: 'Tokyo',
      city: 'Chiyoda',
      subdistrict: 'Marunouchi',
      road: 'Marunouchi',
      house_number: '1-9-1',
      postcode: '1000005',
    },
    lat: 35.68124,
    lon: 139.76713,
    sources: ['openaddresses', 'osm-nominatim'],
    confidence: 0.9,
    validationScore: 0.91,
  },
];

function amnResolvePayload() {
  return {
    inputAddress: privateAmnAddress,
    candidates: amnCandidates,
    context: {
      purpose: 'shipping',
      countryCode: 'jp',
      postcode: '1000005',
      lat: 35.6812,
      lon: 139.7671,
    },
    policy: {
      resolverVersion: 'api-test-resolver-v1',
      purpose: 'shipping',
      qualityThreshold: 0.78,
      unresolvedPolicy: 'do-not-issue-pid-for-unresolved',
      privacyMode: 'commitments-only',
    },
    evidence: [
      {
        sourceId: 'jp-open-data',
        evidenceType: 'official-postal',
        subjectCommitment: 'jp-postal-tokyo-station-commitment',
        confidence: 0.97,
        observedAt: '2026-06-06T00:00:00.000Z',
      },
      {
        sourceId: 'osm-nominatim',
        evidenceType: 'map-feature',
        subjectCommitment: 'osm-tokyo-station-commitment',
        confidence: 0.86,
        observedAt: '2026-06-06T00:00:00.000Z',
      },
    ],
    historyUpdate: {
      previousHistoryRoot: 'history-root-before',
      nextHistoryRoot: 'history-root-after',
      eventCount: 2,
      updatedAt: '2026-06-06T00:01:00.000Z',
    },
    proofBundleId: 'ZKB-TOKYO-STATION-AMN-API',
    issuedAt: '2026-06-06T00:02:00.000Z',
    privateSalt: 'private-amn-api-salt',
  };
}

function trustedIssuerPayload() {
  return {
    registryId: 'agid-credential-issuer-trust',
    registryVersion: '2026.06',
    now: '2026-06-01T00:00:00.000Z',
    trustPolicy: {
      allowedStatuses: ['trusted'],
      minimumTrustScore: 0.85,
      requireValidWindow: true,
      requireCredentialScopeMatch: true,
    },
    issuers: [
      {
        issuerId: 'agid-jp-postal-issuer',
        issuerDid: 'did:kilt:agid-japan-post',
        status: 'trusted',
        trustLevel: 'official',
        credentialTypes: [ADDRESS_CREDENTIAL_VERSION],
        layers: ['AOID'],
        countryCodes: ['JP'],
        schemaHashes: ['schema-address-credential-v1'],
        policyVersions: ['jp-postal-policy-v1'],
        keyCommitments: ['issuer-key-commitment-public-only'],
        publicAttestationRefs: ['japan-post-official-postcode-source'],
        trustScore: 0.97,
        validFrom: '2025-01-01T00:00:00.000Z',
        validUntil: '2027-01-01T00:00:00.000Z',
        sourceIds: ['japan-post-open-data', 'agid-official-source-review'],
      },
    ],
  };
}

function publicZkProof(version: string, nullifier: string, commitment: string) {
  return {
    claim: {
      version,
      scope: zkScope,
      challengeHash: zkChallengeHash,
      issuedAt: zkIssuedAt,
      expiresAt: zkExpiresAt,
      subject: {
        kind: 'AOID',
        commitment: `${commitment}:subject`,
      },
      nullifiers: {
        requestNullifier: nullifier,
      },
      commitments: {
        proofCommitment: `${commitment}:proof`,
        policyCommitment: `${commitment}:policy`,
      },
      privacy: {
        hides: ['address', 'person', 'phone', 'raw-coordinate'],
        reveals: ['scope', 'challenge-hash', 'predicate-result'],
      },
      proofHint: {
        zkReady: true,
        zkpGenerated: true,
        statement: 'public-fixture-for-zk-proof-bundle-api',
      },
    },
    signature: {
      algorithm: 'HMAC-SHA-256',
      issuerId: 'agid-zk-registry-test',
      value: 'test-signature-not-verified-by-registry',
    },
  };
}

function compatibleZkBundle(suffix = 'API') {
  return [
    publicZkProof('quality-threshold-proof-v1', `QUALITY-REQUEST-NULLIFIER-${suffix}`, `QUALITY-COMMITMENT-${suffix}`),
    publicZkProof('region-membership-proof-v1', `REGION-REQUEST-NULLIFIER-${suffix}`, `REGION-COMMITMENT-${suffix}`),
    publicZkProof('anonymous-rate-limit-proof-v1', `RATE-REQUEST-NULLIFIER-${suffix}`, `RATE-COMMITMENT-${suffix}`),
  ];
}

function expectedChallengeHashesByVersion(proofs: ReturnType<typeof compatibleZkBundle>) {
  return Object.fromEntries(proofs.map(proof => [proof.claim.version, proof.claim.challengeHash]));
}

function apiPrivateAoidRecord() {
  return buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Private Receiver',
      street: '2-2 Roppongi',
      city: 'Tokyo',
      phone: '+81 3 0000 0000',
      room: '2801',
    },
    {
      mode: 'AOID',
      id: '05AV8TJGH8QZ6M2R',
      agid: 'JP05AV8TJGH8',
      coords: { lat: 35.66, lon: 139.73 },
      now: '2026-06-03T00:00:00.000Z',
    },
  );
}

function apiEncryptedAoidEnvelope() {
  return buildAOIDEncryptedSyncEnvelope(apiPrivateAoidRecord(), {
    encryptedPayload: 'base64url.ciphertext.tag',
    ownerKeyId: 'owner-key-api',
    deviceKeyId: 'device-key-api',
    now: 1000,
  });
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'test-request-id' },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

async function getJson(path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'X-AGID-Request-ID': 'test-request-id' },
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

before(async () => {
  const app = express();
  app.use(express.json());
  registerCoreApiRoutes(app, {
    publicCachedGetFetch: async () => new Response('{}', { status: 200 }),
    connectorFetchNoCache: async () => new Response('{}', { status: 200 }),
    qualityStats: {},
    continentQuality: {},
  });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('address verification API uses bundled global country formats without paid services', async () => {
  const capabilities = await getJson('/api/address/verify/capabilities');
  assert.equal(capabilities.status, 200);
  assert.equal(capabilities.body.ok, true);
  assert.equal(capabilities.body.data.freeOnly, true);
  assert.equal(capabilities.body.data.standardLibrary.freeOnly, true);
  assert.ok(capabilities.body.data.standardLibrary.primary.some((entry: { id: string }) => entry.id === 'local-address-parser'));
  assert.ok(capabilities.body.data.addressFormatCountries >= 240);

  const standardLibrary = await getJson('/api/address/standard-library/capabilities?cc=JP&hasPostcode=1&hasCoordinates=1&sourceLanguage=ja&targetLanguage=en&natural=1');
  assert.equal(standardLibrary.status, 200);
  assert.equal(standardLibrary.body.ok, true);
  assert.equal(standardLibrary.body.data.countryCode, 'JP');
  assert.ok(standardLibrary.body.data.primary.some((entry: { id: string }) => entry.id === 'local-address-parser'));
  assert.ok(standardLibrary.body.data.fallback.some((entry: { id: string }) => entry.id === 'open-source-translation-api'));
  assert.ok(standardLibrary.body.data.fallback.some((entry: { id: string }) => entry.id === 'space-agency-open-geodata'));

  const verification = await postJson('/api/address/verify', {
    countryCode: 'PT',
    targetCountries: ['PT'],
    postalCode: '1000-001',
    scope: 'postal',
    address: {
      country_code: 'PT',
      city: 'Lisboa',
      postcode: '1000-001',
    },
  });

  assert.equal(verification.status, 200);
  assert.equal(verification.body.ok, true);
  assert.equal(verification.body.data.status, 'partial');
  assert.equal(verification.body.data.country.supported, true);
  assert.equal(verification.body.data.country.policy.countryCode, 'PT');
  assert.equal(verification.body.data.quality.freeOnly, true);
  assert.equal(verification.body.data.quality.paidApiParityClaimed, false);
  assert.ok(verification.body.data.standardLibrary.primary.some((entry: { id: string }) => entry.id === 'local-address-parser'));
  assert.ok(verification.body.data.audit.some((step: { step: string }) => step.step === 'standard-library-resolution'));
  assert.ok(verification.body.data.sources.includes('server-address-format-pack'));
});

test('address parser only enables an explicit loopback libpostal sidecar', async () => {
  const keys = ['AGID_LIBPOSTAL_LOCAL_URL', 'AGID_LIBPOSTAL_LOCAL_ENABLED', 'LIBPOSTAL_PARSE_URL'];
  const previous = new Map(keys.map(key => [key, process.env[key]]));

  try {
    process.env.AGID_LIBPOSTAL_LOCAL_URL = 'https://parser.example.invalid/parse';
    process.env.AGID_LIBPOSTAL_LOCAL_ENABLED = 'true';
    delete process.env.LIBPOSTAL_PARSE_URL;

    const blocked = await postJson('/api/address/parse', {
      text: '42 Example Road, Sample City',
      countryCode: 'US',
    });

    assert.equal(blocked.status, 200);
    assert.equal(blocked.body.source, 'local-parser');
    assert.equal(blocked.body.available, false);
    assert.match(blocked.body.warnings[0], /loopback HTTP URL/);

    process.env.AGID_LIBPOSTAL_LOCAL_URL = 'http://127.0.0.1:8765/parse';
    const local = await postJson('/api/address/parse', {
      text: '42 Example Road, Sample City',
      countryCode: 'US',
    });

    assert.equal(local.status, 200);
    assert.equal(local.body.source, 'libpostal');
    assert.equal(local.body.available, true);
  } finally {
    for (const key of keys) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('external address validator routes import metadata safely and merge server-allowlisted evidence', async () => {
  const unsafeImport = await postJson('/api/address/external-validators/import', {
    id: 'unsafe-validator',
    name: 'Unsafe Validator',
    adapter: 'generic-json',
    capabilities: ['address-verify'],
    privacyMode: 'redacted-only',
    endpoint: 'https://validator.example/verify',
    apiKey: 'secret',
    addressText: privateAmnAddress,
  });
  assert.equal(unsafeImport.status, 400);
  assert.equal(unsafeImport.body.ok, false);
  assert.match(unsafeImport.body.error, /must not contain runtime URLs/);

  const originalConfig = process.env.AGID_EXTERNAL_ADDRESS_VALIDATORS_JSON;
  const originalToken = process.env.AGID_EXTERNAL_VALIDATOR_CONNECTOR_TOKEN;
  process.env.AGID_EXTERNAL_VALIDATOR_CONNECTOR_TOKEN = 'test-external-validator-token';
  process.env.AGID_EXTERNAL_ADDRESS_VALIDATORS_JSON = JSON.stringify([
    {
      id: 'jp-official-postal-test',
      name: 'JP Official Postal Test',
      adapter: 'agid-json-v1',
      capabilities: ['postal-lookup', 'address-verify'],
      supportedCountries: ['JP'],
      privacyMode: 'redacted-only',
      endpointId: 'jp-postal-test',
      endpoint: 'https://validator.example/verify',
    },
  ]);

  const app = express();
  const externalCalls: any[] = [];
  app.use(express.json());
  registerCoreApiRoutes(app, {
    publicCachedGetFetch: async () => new Response('{}', { status: 200 }),
    connectorFetchNoCache: async (_url, options) => {
      externalCalls.push(JSON.parse(String(options?.body ?? '{}')));
      return new Response(JSON.stringify({
        ok: true,
        status: 'verified',
        confidence: 0.97,
        postalEvidence: [
          {
            source: 'japan-post-test',
            countryCode: 'JP',
            postalCode: '1000005',
            state: 'Tokyo',
            city: 'Chiyoda',
            confidence: 0.98,
          },
        ],
      }), { status: 200 });
    },
    qualityStats: {},
    continentQuality: {},
  });
  const localServer = app.listen(0);

  try {
    await new Promise<void>(resolve => localServer.once('listening', resolve));
    const address = localServer.address();
    assert.ok(address && typeof address === 'object');
    const localBaseUrl = `http://127.0.0.1:${address.port}`;

    const capabilities = await fetch(`${localBaseUrl}/api/address/external-validators/capabilities`);
    const capabilitiesBody = await capabilities.json();
    assert.equal(capabilities.status, 200);
    assert.equal(capabilitiesBody.data.serverConfigured, true);
    assert.equal(capabilitiesBody.data.validators[0].id, 'jp-official-postal-test');
    assert.equal('endpoint' in capabilitiesBody.data.validators[0], false);

    const verification = await fetch(`${localBaseUrl}/api/address/verify/external`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AGID-External-Validator-Token': 'test-external-validator-token',
      },
      body: JSON.stringify({
        countryCode: 'JP',
        targetCountries: ['JP'],
        postalCode: '1000005',
        scope: 'postal',
        addressText: privateAmnAddress,
        externalValidatorIds: ['jp-official-postal-test'],
        address: {
          country_code: 'JP',
          state: 'Tokyo',
          city: 'Chiyoda',
          road: 'Marunouchi',
          house_number: '1-9-1',
          postcode: '1000005',
        },
      }),
    });
    const verificationBody = await verification.json();
    assert.equal(verification.status, 200);
    assert.equal(typeof verificationBody.data.verification.status, 'string');
    assert.equal(verificationBody.data.external.attempted, 1);
    assert.equal(verificationBody.data.external.validators[0].postalEvidenceCount, 1);
    assert.ok(verificationBody.data.verification.sources.includes('japan-post-test'));
    assert.equal(externalCalls.length, 1);
    assert.equal(externalCalls[0].addressText, undefined);
    assert.equal(externalCalls[0].address.road, undefined);
    assert.equal(externalCalls[0].address.house_number, undefined);
    assert.equal(externalCalls[0].address.city, 'Chiyoda');
  } finally {
    await new Promise<void>(resolve => localServer.close(() => resolve()));
    if (originalConfig === undefined) {
      delete process.env.AGID_EXTERNAL_ADDRESS_VALIDATORS_JSON;
    } else {
      process.env.AGID_EXTERNAL_ADDRESS_VALIDATORS_JSON = originalConfig;
    }
    if (originalToken === undefined) {
      delete process.env.AGID_EXTERNAL_VALIDATOR_CONNECTOR_TOKEN;
    } else {
      process.env.AGID_EXTERNAL_VALIDATOR_CONNECTOR_TOKEN = originalToken;
    }
  }
});

test('cloud DB connector APIs plan integrations without allowing plaintext AOID sync', async () => {
  const connectors = await getJson('/api/cloud-db/connectors');
  assert.equal(connectors.status, 200);
  assert.equal(connectors.body.ok, true);
  assert.equal(connectors.body.data.plaintextAoidStorageAllowed, false);
  assert.ok(connectors.body.data.connectors.some((profile: { id: string }) => profile.id === 'postgres'));
  assert.ok(connectors.body.data.connectors.some((profile: { id: string }) => profile.id === 'cloudflare-r2'));
  assert.ok(connectors.body.data.connectors.some((profile: { id: string }) => profile.id === 'aws-rds-postgres'));
  assert.ok(connectors.body.data.connectors.some((profile: { id: string }) => profile.id === 'bigquery'));
  assert.ok(connectors.body.data.connectors.some((profile: { id: string }) => profile.id === 'opensearch'));

  const compatibility = await getJson('/api/cloud-db/compatibility');
  assert.equal(compatibility.status, 200);
  assert.equal(compatibility.body.ok, true);
  assert.equal(compatibility.body.data.plaintextAoidStorageAllowed, false);
  assert.deepEqual(compatibility.body.data.summary.runtimeLedgerAdapters, ['memory', 'sqlite', 'postgres', 'redis', 'mongodb']);
  assert.ok(compatibility.body.data.summary.postgresCompatibleRuntimeAdapters.includes('aws-rds-postgres'));
  assert.ok(compatibility.body.data.summary.plannedRuntimeAdapters.includes('mysql'));
  assert.ok(compatibility.body.data.summary.plannedRuntimeAdapters.includes('azure-sql'));
  assert.ok(compatibility.body.data.summary.plannedRuntimeAdapters.includes('dynamodb'));
  assert.ok(compatibility.body.data.summary.connectorPlanOnlyAdapters.includes('bigquery'));
  assert.ok(compatibility.body.data.summary.cacheOnlyAdapters.includes('cloudflare-kv'));

  const publicPlan = await postJson('/api/cloud-db/plan', {
    providerId: 'cloudflare-r2',
    purpose: 'public-agid-cache',
    layer: 'AGID',
    payload: {
      id: 'JP05AV8TJGH8',
      label: 'Tokyo public AGID reference',
    },
  });
  assert.equal(publicPlan.status, 200);
  assert.equal(publicPlan.body.data.storageMode, 'public-cache');
  assert.equal(publicPlan.body.data.governance.payloadClass, 'public-agid-reference');

  const blockedPlainAoid = await postJson('/api/cloud-db/plan', {
    providerId: 'postgres',
    purpose: 'encrypted-aoid-sync',
    entityType: 'aoid',
    payload: apiPrivateAoidRecord(),
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
  });
  assert.equal(blockedPlainAoid.status, 400);
  assert.equal(blockedPlainAoid.body.ok, false);
  assert.ok(blockedPlainAoid.body.data.errors.includes('aoid-sync-requires-owner-device-encrypted-envelope'));
  assert.doesNotMatch(JSON.stringify(blockedPlainAoid.body), /Private Receiver|2801|\+81 3|35\.66|139\.73/);

  const job = await postJson('/api/cloud-db/sync-job', {
    providerId: 'postgres',
    purpose: 'encrypted-aoid-sync',
    entityType: 'aoid',
    entityId: '05AV8TJGH8QZ6M2R',
    action: 'update',
    payload: apiEncryptedAoidEnvelope(),
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    now: 1000,
  });
  assert.equal(job.status, 200);
  assert.equal(job.body.data.queueRecord.audit.surface, 'encrypted-sync');
  assert.equal(job.body.data.queueRecord.audit.payloadClass, 'aoid-encrypted-envelope');
  assert.equal(job.body.data.dispatch.networkRequestBuilt, false);
  assert.doesNotMatch(JSON.stringify(job.body), /Private Receiver|2801|\+81 3|35\.66|139\.73/);
});

test('private deployment APIs plan tenant-isolated municipality, NGO, and carrier deployments', async () => {
  const capabilities = await getJson('/api/private-deployments/capabilities');
  assert.equal(capabilities.status, 200);
  assert.equal(capabilities.body.ok, true);
  assert.ok(capabilities.body.data.sectors.includes('municipality'));
  assert.ok(capabilities.body.data.sectors.includes('ngo'));
  assert.ok(capabilities.body.data.sectors.includes('carrier'));
  assert.equal(capabilities.body.data.privacy.privateMaterialAccepted, false);

  const plan = await postJson('/api/private-deployments/plan', {
    requestedAt: '2026-06-17T00:00:00.000Z',
    tenantId: 'humanitarian-private-deploy',
    sector: 'ngo',
    countryCodes: ['JP', 'PH'],
    offlineSites: 4,
    expectedDailyEvents: 2500,
    requiresZk: true,
  });

  assert.equal(plan.status, 200);
  assert.equal(plan.body.ok, true);
  assert.equal(plan.body.data.accepted, true);
  assert.equal(plan.body.data.deploymentProfile, 'private-ngo');
  assert.equal(plan.body.data.networkMode, 'offline-first');
  assert.equal(plan.body.data.security.rawAddressStorage, false);
  assert.ok(plan.body.data.operations.launchGates.includes('offline-conflict-review-playbook'));
  assert.doesNotMatch(JSON.stringify(plan.body), /Private Receiver|2801|\+81 3|35\.66|139\.73/);
});

test('address intent APIs create and update public workflow state', async () => {
  const capabilities = await getJson('/api/address-intents/capabilities');
  assert.equal(capabilities.status, 200);
  assert.equal(capabilities.body.ok, true);
  assert.ok(capabilities.body.data.statuses.includes('requires_input'));
  assert.equal(capabilities.body.data.privacy.plaintextAddressStored, false);

  const created = await postJson('/api/address-intents', {
    purpose: 'delivery',
    mode: 'server',
    requiresRecipientProof: true,
    evidence: [
      { source: 'address-form', safeFingerprint: 'addr-cmt-1' },
      { source: 'postal-api', safeFingerprint: 'postal-cmt-1' },
    ],
  });
  assert.equal(created.status, 200);
  assert.equal(created.body.data.status, 'requires_input');
  assert.equal(created.body.data.nextAction, 'request_recipient_proof');
  assert.doesNotMatch(JSON.stringify(created.body), /addressText|recipientName|phoneNumber|proofCode/i);

  const intentId = created.body.data.id;
  const updated = await postJson(`/api/address-intents/${intentId}/update`, {
    appendEvidence: true,
    evidence: [
      { source: 'recipient-proof', safeFingerprint: 'recipient-proof-cmt-1' },
    ],
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.id, intentId);
  assert.equal(updated.body.data.status, 'verified');
  assert.equal(updated.body.data.nextAction, 'issue_waybill');

  const fetched = await getJson(`/api/address-intents/${intentId}`);
  assert.equal(fetched.status, 200);
  assert.equal(fetched.body.data.status, 'verified');
});

test('address element and radar APIs expose safe public workflow surfaces', async () => {
  const capabilities = await getJson('/api/address-element/capabilities');
  assert.equal(capabilities.status, 200);
  assert.equal(capabilities.body.ok, true);
  assert.equal(capabilities.body.data.supports.postalCodeAutocomplete, true);
  assert.equal(capabilities.body.data.privacy.publicApiRawFieldValuesAccepted, false);

  const safeSession = await postJson('/api/address-element/session', {
    purpose: 'delivery',
    mode: 'server',
    countryCode: 'JP',
    selectedLanguage: 'ja',
    fieldPresence: {
      countryCode: true,
      postcode: true,
      state: true,
      city: true,
      street: true,
    },
    postalCandidates: [
      {
        source: 'japan-post',
        countryCode: 'JP',
        postalCode: '100-0005',
        state: 'Tokyo',
        city: 'Chiyoda',
        confidence: 0.97,
      },
    ],
    agidCandidate: {
      present: true,
      exposure: 'commitment',
      safeFingerprint: 'agid-cmt-api',
    },
  });
  assert.equal(safeSession.status, 200);
  assert.equal(safeSession.body.ok, true);
  assert.equal(safeSession.body.data.status, 'ready');
  assert.equal(safeSession.body.data.privacy.plaintextAddressServerStorage, false);
  assert.equal(safeSession.body.data.privacy.rawAoidServerStorage, false);
  assert.doesNotMatch(JSON.stringify(safeSession.body), /Marunouchi|Private Receiver|\+81/i);

  const privateSession = await postJson('/api/address-element/session', {
    fields: {
      recipient: 'Private Receiver',
      phone: '+81-3-0000-0000',
      postcode: '100-0005',
    },
  });
  assert.equal(privateSession.status, 400);
  assert.equal(privateSession.body.ok, false);
  assert.equal(privateSession.body.data.rawFieldValuesAccepted, false);
  assert.doesNotMatch(JSON.stringify(privateSession.body), /Private Receiver|\+81-3/i);

  const radarRules = await getJson('/api/address-radar/rules');
  assert.equal(radarRules.status, 200);
  assert.ok(radarRules.body.data.rules.some((rule: { id: string }) => rule.id === 'qr-used-before'));

  const radar = await postJson('/api/address-radar/evaluate', {
    highRiskMode: true,
    qr: {
      channel: 'qr',
      hasJti: false,
      usedBefore: true,
      reuseCount: 1,
      liveChallengeSigned: false,
    },
  });
  assert.equal(radar.status, 409);
  assert.equal(radar.body.data.decision, 'block');
  assert.ok(radar.body.data.nextActions.includes('rotate_qr'));
  assert.equal(radar.body.data.privacy.rawAoidStored, false);
  assert.doesNotMatch(JSON.stringify(radar.body), /recipientName|phoneNumber|plaintextAddress/i);
});

test('credential issuer trust snapshot API returns an anchorable public registry root', async () => {
  const { status, body } = await postJson('/api/credential-issuers/trust-registry/snapshot', trustedIssuerPayload());

  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.match(body.data.registryRoot, /^[a-f0-9]{64}$/u);
  assert.equal(body.data.issuerCounts.trusted, 1);
  assert.equal(body.data.chainCommitment.publicPayload.trustRegistryRoot, body.data.registryRoot);
  assert.doesNotMatch(JSON.stringify(body), /issuerSecret|privateSalt|phone|email|plaintext-address/i);
});

test('credential issuer trust evaluate API checks issuer scope against the supplied snapshot', async () => {
  const snapshotResult = await postJson('/api/credential-issuers/trust-registry/snapshot', trustedIssuerPayload());
  const credential = {
    claim: {
      version: ADDRESS_CREDENTIAL_VERSION,
      layer: 'AOID',
      countryCode: 'JP',
      policyVersion: 'jp-postal-policy-v1',
    },
    signature: {
      issuerId: 'agid-jp-postal-issuer',
    },
  };

  const { status, body } = await postJson('/api/credential-issuers/trust-registry/evaluate', {
    credential,
    trustRegistry: snapshotResult.body.data,
    now: '2026-06-01T00:10:00.000Z',
    requiredLayer: 'AOID',
    requiredCountryCode: 'JP',
    requiredSchemaHash: 'schema-address-credential-v1',
    trustedRegistryRoots: [snapshotResult.body.data.registryRoot],
  });

  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.trusted, true);
  assert.equal(body.data.issuer.issuerDid, 'did:kilt:agid-japan-post');
});

test('credential issuer trust verify API does not accept public issuer secrets', async () => {
  const snapshotResult = await postJson('/api/credential-issuers/trust-registry/snapshot', trustedIssuerPayload());
  const { status, body } = await postJson('/api/credential-issuers/trust-registry/verify-credential', {
    credential: {
      claim: {
        version: ADDRESS_CREDENTIAL_VERSION,
        layer: 'AOID',
        countryCode: 'JP',
      },
      signature: {
        issuerId: 'agid-jp-postal-issuer',
      },
    },
    trustRegistry: snapshotResult.body.data,
    issuerSecret: 'must-not-be-accepted',
    privateSalt: 'must-not-be-accepted',
  });

  assert.equal(status, 503);
  assert.equal(body.ok, false);
  assert.match(body.error, /server-managed issuer key/i);
  assert.doesNotMatch(JSON.stringify(body), /must-not-be-accepted|issuerSecret|privateSalt/i);
});

test('ZK proof bundle APIs register, verify, report, and revoke public proof bundles', async () => {
  const proofs = compatibleZkBundle('API-LIFECYCLE');
  const registration = await postJson('/api/zk/proof-bundles/register', {
    proofs,
    scope: zkScope,
    audience: zkAudience,
    operationId: 'delivery-checkout-api-lifecycle',
    expectedChallengeHashesByVersion: expectedChallengeHashesByVersion(proofs),
    now: '2026-01-01T00:05:30.000Z',
  });

  assert.equal(registration.status, 200);
  assert.equal(registration.body.ok, true);
  assert.equal(registration.body.data.status, 'registered');
  assert.equal(registration.body.data.record.rawProofsStored, false);
  assert.doesNotMatch(JSON.stringify(registration.body), /QUALITY-REQUEST-NULLIFIER-API-LIFECYCLE|test-signature-not-verified-by-registry/i);

  const bundleId = registration.body.data.bundleId;
  const active = await postJson(`/api/zk/proof-bundles/${bundleId}/verify`, {
    now: '2026-01-01T00:05:40.000Z',
  });
  assert.equal(active.status, 200);
  assert.equal(active.body.data.valid, true);

  const stats = await getJson('/api/zk/proof-bundles/stats');
  assert.equal(stats.status, 200);
  assert.equal(stats.body.data.totalBundles, 1);
  assert.equal(stats.body.data.activeBundles, 1);

  const revoked = await postJson(`/api/zk/proof-bundles/${bundleId}/revoke`, {
    reason: 'issuer-key-rotated',
    revokedAt: '2026-01-01T00:05:50.000Z',
  });
  assert.equal(revoked.status, 200);
  assert.equal(revoked.body.data.valid, false);
  assert.ok(revoked.body.data.errors.includes('bundle-revoked'));
});

test('revocation freshness APIs anchor and verify roots without leaking revoked handles', async () => {
  const anchorResult = await postJson('/api/revocation-freshness/anchor', {
    registry: revocationRegistry,
    issuerDid: 'did:kilt:agid-root-anchor-issuer',
    credentialType: 'aoid-address-credential',
    schemaHash: 'SCHEMA-HASH-AOID-ADDRESS-V1',
    freshnessPolicy: {
      maxFreshnessAgeSeconds: 600,
      statusListSourcePolicyHash: 'STATUS-LIST-SOURCE-POLICY-V1',
    },
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(anchorResult.status, 200);
  assert.equal(anchorResult.body.ok, true);
  assert.equal(anchorResult.body.data.anchorable, true);
  assert.doesNotMatch(JSON.stringify(anchorResult.body), /secret-revoked-credential-handle-a|secret-revoked-subject-handle-b/i);

  const anchor = anchorResult.body.data;
  const verification = await postJson('/api/revocation-freshness/verify', {
    anchor,
    envelope: {
      claim: {
        revocation: {
          registryId: anchor.registryId,
          registryVersion: anchor.registryVersion,
          listRootCommitment: anchor.revocationRoot,
          checkedAt: anchor.checkedAt,
          freshUntil: anchor.freshUntil,
        },
      },
      signature: {
        issuerId: 'agid-public-freshness-fixture',
      },
    },
    now: '2026-01-01T00:06:10.000Z',
  });

  assert.equal(verification.status, 200);
  assert.equal(verification.body.ok, true);
  assert.equal(verification.body.data.valid, true);
  assert.equal(verification.body.data.rootMatched, true);
});

test('AMN APIs create, register, verify, and report public resolution envelopes', async () => {
  const resolution = await postJson('/api/amn/resolve', amnResolvePayload());

  assert.equal(resolution.status, 200);
  assert.equal(resolution.body.ok, true);
  assert.equal(resolution.body.data.registration.status, 'registered');
  assert.match(resolution.body.data.envelope.claim.envelopeId, /^AMN-[0-9A-F]{24}$/u);
  assert.match(resolution.body.data.envelope.claim.policyHash, /^[a-f0-9]{64}$/u);
  assert.match(resolution.body.data.envelope.claim.evidenceRoot, /^[a-f0-9]{64}$/u);
  assert.equal(resolution.body.data.envelope.claim.resolution.status, 'verified');
  assert.equal(resolution.body.data.envelope.claim.resolution.candidateCount, 2);
  assert.doesNotMatch(JSON.stringify(resolution.body), /private unit|phone \+81|SECRET|owner-device|東京都千代田区丸の内/i);

  const envelopeId = resolution.body.data.envelope.claim.envelopeId;
  const verification = await postJson(`/api/amn/registry/${envelopeId}/verify`, {
    now: '2026-06-06T00:03:00.000Z',
  });
  assert.equal(verification.status, 200);
  assert.equal(verification.body.ok, true);
  assert.equal(verification.body.data.valid, true);

  const stats = await getJson('/api/amn/registry/stats');
  assert.equal(stats.status, 200);
  assert.equal(stats.body.data.activeEnvelopes, 1);
});

test('Polkadot APIs build, anchor, query, and finalize public commitments', async () => {
  const stages = await getJson('/api/polkadot/stages');
  assert.equal(stages.status, 200);
  assert.ok(stages.body.data.some((stage: { id: string }) => stage.id === 'chain-commitment'));

  const commitmentResult = await postJson('/api/polkadot/commitment', {
    stageId: 'chain-commitment',
    entityType: 'zk-proof',
    entityId: 'proof:api:tokyo',
    salt: 'api-chain-salt',
    publicPayload: {
      verifierVersion: 'zk-address-v1',
      policyHash: 'POLICY-ROOT-2026',
    },
  });
  assert.equal(commitmentResult.status, 200);
  assert.equal(commitmentResult.body.data.commitment.publishable, true);

  const commitment = commitmentResult.body.data.commitment;
  const anchorResult = await postJson('/api/polkadot/anchor', {
    commitment,
    adapterOptions: {
      networkId: 'api-local',
      initialBlockNumber: 100,
    },
    observedAt: '2026-06-05T00:00:00.000Z',
  });
  assert.equal(anchorResult.status, 200);
  assert.equal(anchorResult.body.data.status, 'anchored');
  assert.doesNotMatch(JSON.stringify(anchorResult.body), /addressText|phone|recipient/i);

  const stored = await getJson(`/api/polkadot/commitments/${commitment.commitmentId}?networkId=api-local`);
  assert.equal(stored.status, 200);
  assert.equal(stored.body.data.commitmentHash, commitment.commitmentHash);

  const finality = await postJson(`/api/polkadot/commitments/${commitment.commitmentId}/finality`, {
    networkId: 'api-local',
    finalizedBlockNumber: 101,
    requiredConfirmations: 2,
    observedAt: '2026-06-05T00:01:00.000Z',
  });
  assert.equal(finality.status, 200);
  assert.equal(finality.body.data.finalized, true);
});

test('MCP endpoint initializes and lists public AGID tools without private fields', async () => {
  const initialized = await postJson('/api/mcp', {
    jsonrpc: '2.0',
    id: 'mcp-init',
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: {
        name: 'agid-route-test',
        version: '1.0.0',
      },
    },
  });

  assert.equal(initialized.status, 200);
  assert.equal(initialized.body.jsonrpc, '2.0');
  assert.equal(initialized.body.id, 'mcp-init');
  assert.equal(initialized.body.result.protocolVersion, '2025-06-18');
  assert.equal(initialized.body.result.serverInfo.name, 'agid-mcp-server');
  assert.equal(initialized.body.result.capabilities.tools.listChanged, false);

  const listed = await postJson('/api/mcp', {
    jsonrpc: '2.0',
    id: 'mcp-tools',
    method: 'tools/list',
  });

  assert.equal(listed.status, 200);
  const toolNames = listed.body.result.tools.map((tool: { name: string }) => tool.name);
  assert.ok(toolNames.includes('agid.health'));
  assert.ok(toolNames.includes('agid.zk.proof_bundle.register'));
  assert.ok(toolNames.includes('agid.zk.proof_bundle.verify'));
  assert.ok(toolNames.includes('agid.revocation_freshness.verify'));
  assert.ok(toolNames.includes('agid.polkadot.stages'));
  assert.doesNotMatch(JSON.stringify(listed.body), /issuerSecret|privateSalt|addressText|phone|recipient|plaintext-address/i);
});

test('MCP tool calls register and verify a public ZK proof bundle', async () => {
  const health = await postJson('/api/mcp', {
    jsonrpc: '2.0',
    id: 'mcp-health',
    method: 'tools/call',
    params: {
      name: 'agid.health',
      arguments: {},
    },
  });

  assert.equal(health.status, 200);
  assert.equal(health.body.result.isError, false);
  assert.equal(health.body.result.structuredContent.ok, true);
  assert.match(health.body.result.content[0].text, /AGID MCP server is ready/i);

  const proofs = compatibleZkBundle('MCP');
  const registration = await postJson('/api/mcp', {
    jsonrpc: '2.0',
    id: 'mcp-register-zk',
    method: 'tools/call',
    params: {
      name: 'agid.zk.proof_bundle.register',
      arguments: {
        proofs,
        scope: zkScope,
        audience: zkAudience,
        operationId: 'delivery-checkout-mcp',
        expectedChallengeHashesByVersion: expectedChallengeHashesByVersion(proofs),
        now: '2026-01-01T00:05:30.000Z',
      },
    },
  });

  assert.equal(registration.status, 200);
  assert.equal(registration.body.result.isError, false);
  assert.equal(registration.body.result.structuredContent.ok, true);
  assert.equal(registration.body.result.structuredContent.data.status, 'registered');
  assert.doesNotMatch(JSON.stringify(registration.body), /QUALITY-REQUEST-NULLIFIER-MCP|test-signature-not-verified-by-registry/i);

  const bundleId = registration.body.result.structuredContent.data.bundleId;
  const verification = await postJson('/api/mcp', {
    jsonrpc: '2.0',
    id: 'mcp-verify-zk',
    method: 'tools/call',
    params: {
      name: 'agid.zk.proof_bundle.verify',
      arguments: {
        bundleId,
        now: '2026-01-01T00:05:40.000Z',
      },
    },
  });

  assert.equal(verification.status, 200);
  assert.equal(verification.body.result.structuredContent.ok, true);
  assert.equal(verification.body.result.structuredContent.data.valid, true);
});

test('MCP endpoint rejects unknown tools and private argument material without leaking values', async () => {
  const unknownTool = await postJson('/api/mcp', {
    jsonrpc: '2.0',
    id: 'mcp-unknown-tool',
    method: 'tools/call',
    params: {
      name: 'agid.unknown',
      arguments: {},
    },
  });

  assert.equal(unknownTool.status, 200);
  assert.equal(unknownTool.body.error.code, -32602);
  assert.match(unknownTool.body.error.message, /Unknown MCP tool/i);

  const privateMaterial = await postJson('/api/mcp', {
    jsonrpc: '2.0',
    id: 'mcp-private-material',
    method: 'tools/call',
    params: {
      name: 'agid.zk.proof_bundle.register',
      arguments: {
        proofs: [],
        issuerSecret: 'must-not-leak-through-mcp',
        privateSalt: 'must-not-leak-through-mcp',
        addressText: '1 private street',
      },
    },
  });

  assert.equal(privateMaterial.status, 200);
  assert.equal(privateMaterial.body.result.isError, true);
  assert.equal(privateMaterial.body.result.structuredContent.error, 'private-mcp-tool-material-present');
  assert.doesNotMatch(JSON.stringify(privateMaterial.body), /must-not-leak-through-mcp|1 private street/i);
});

test('postal code status API exposes lazy loading state without triggering downloads', async () => {
  const { status, body } = await getJson('/api/postal-code/status');

  assert.equal(status, 200);
  assert.ok(Array.isArray(body.supportedCountries));
  assert.ok(Array.isArray(body.loadedCountries));
  assert.ok(Array.isArray(body.loadingCountries));
  assert.ok(Array.isArray(body.failedCountries));
});
