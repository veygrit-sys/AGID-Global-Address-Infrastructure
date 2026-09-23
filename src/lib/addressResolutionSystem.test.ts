import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createInMemoryAgidRegistryApiStore } from './agidRegistryApi';
import {
  createAddressConsentGrant,
  createAddressRevocationStatus,
  createAddressRouteAdvertisement,
  createAddressServiceRecord,
  makeIssuerAuthSignaturePayload,
  signAddressProtocolPayload,
  type AddressIssuerAuthEnvelope,
  type AddressIssuerAuthPolicy,
} from './addressInternetProtocols';
import {
  getAddressResolutionSystemCapabilities,
  resolveAddressSystem,
  type AddressResolutionInput,
} from './addressResolutionSystem';
import type { FederatedResolverRequest } from './federatedResolver';

const tokyoAddress: AddressResolutionInput = {
  addressText: '100-0005 Tokyo Chiyoda Marunouchi 1-9-1',
  address: {
    country_code: 'JP',
    state: 'Tokyo',
    city: 'Chiyoda',
    road: 'Marunouchi',
    house_number: '1-9-1',
    postcode: '100-0005',
  },
  countryCode: 'JP',
  targetCountries: ['JP'],
  postalCode: '100-0005',
  postalEvidence: [{
    source: 'japan-postcode-api',
    sourceId: 'japan-postcode-api',
    countryCode: 'JP',
    postalCode: '100-0005',
    state: 'Tokyo',
    city: 'Chiyoda',
    confidence: 0.97,
  }],
  lat: 35.681236,
  lon: 139.767125,
  now: '2026-06-17T00:00:00.000Z',
};

test('address resolution capabilities expose the information engineering architecture summary', () => {
  const capabilities = getAddressResolutionSystemCapabilities();

  assert.equal(capabilities.informationArchitecture.total, 15);
  assert.ok(capabilities.informationArchitecture.implementedConceptIds.includes('entity-resolution'));
  assert.ok(capabilities.informationArchitecture.implementedConceptIds.includes('spatial-index'));
  assert.ok(capabilities.informationArchitecture.partialConceptIds.includes('state-machine'));
  assert.ok(capabilities.informationArchitecture.plannedConceptIds.includes('differential-privacy'));
  assert.equal(capabilities.privacy.rawAddressToFederation, false);
});

test('address resolution system resolves local-only without network, ZK, Ethereum, or gas', async () => {
  const result = await resolveAddressSystem({
    ...tokyoAddress,
    mode: 'local-only',
    domain: 'pos:local-only',
  });

  assert.equal(result.mode, 'local-only');
  assert.equal(result.decision, 'accept');
  assert.equal(result.status, 'resolved');
  assert.equal(result.privacy.privateInputKeptLocal, true);
  assert.equal(result.privacy.rawAddressSentToFederation, false);
  assert.ok(result.agid?.id);
  assert.ok(result.addressDnsRecord?.target.addressReferenceCommitment);
  assert.equal(result.addressDnsRecord?.privacy.rawAddressStored, false);
  assert.ok(result.commitments.addressReferenceCommitment?.startsWith('ars:'));
  assert.equal(result.entityResolution.status, 'insufficient-evidence');
  assert.equal(result.entityResolution.privacy.rawAddressStored, false);
});

test('address resolution system sends conflicting entity candidates to operator review', async () => {
  const result = await resolveAddressSystem({
    ...tokyoAddress,
    mode: 'local-only',
    domain: 'pos:entity-review',
    entityCandidates: [{
      candidateId: 'conflicting-suite',
      source: 'carrier-history',
      canonical: {
        country_code: 'JP',
        state: 'Tokyo',
        city: 'Chiyoda',
        road: 'Marunouchi',
        house_number: '9-9-9',
        postcode: '100-0005',
      },
      confidence: 0.9,
    }],
  });

  assert.equal(result.status, 'partial');
  assert.equal(result.decision, 'review');
  assert.equal(result.entityResolution.status, 'distinct');
  assert.ok(result.nextActions.includes('review-entity-resolution-clusters'));
});

test('address resolution system does not send raw private address, AGID, AOID, or recipient to external sources', async () => {
  const observedRequests: FederatedResolverRequest[] = [];
  const result = await resolveAddressSystem({
    mode: 'server-registry',
    domain: 'delivery:privacy-test',
    salt: 'privacy-test-salt',
    now: '2026-06-17T00:00:00.000Z',
    includeLocalSource: false,
    payload: {
      agid: 'ML01R1A0ZTR4',
      aoid: 'ABCDEFGHJKLMNPQ',
      address: '東京都千代田区丸の内1-9-1',
      recipient: 'Example Recipient',
      issuerId: 'issuer-jp',
    },
    sources: [{
      sourceId: 'partner-observer',
      sourceKind: 'partner-resolver',
      trustScore: 0.9,
      resolve: async request => {
        observedRequests.push(request);
        return {
          status: 'resolved',
          confidence: 0.9,
          addressReferenceCommitment: request.commitments[0]?.commitment || '0xobserved',
        };
      },
    }],
  });

  const sentText = JSON.stringify(observedRequests);
  assert.notEqual(result.federated.status, 'blocked');
  assert.equal(observedRequests.length, 1);
  assert.doesNotMatch(sentText, /東京都|Example Recipient|ML01R1A0ZTR4|ABCDEFGHJKLMNPQ/);
  assert.ok(result.federated.commitments.length >= 4);
});

test('address resolution system rejects revoked address-reference commitments in Mode 1 registry mode', async () => {
  const store = createInMemoryAgidRegistryApiStore();
  store.revokeCommitment({
    commitment: '0xrevoked-address-reference',
    commitmentType: 'address-reference',
    reason: 'test revocation',
  });

  const result = await resolveAddressSystem({
    ...tokyoAddress,
    mode: 'server-registry',
    domain: 'registry:revoked',
    salt: 'registry-revoked-salt',
    addressReferenceCommitment: '0xrevoked-address-reference',
    registryStore: store,
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.decision, 'reject');
  assert.equal(result.registryVerification?.valid, false);
  assert.match(result.errors.join('\n'), /commitment-revoked/);
});

test('address resolution system surfaces resolver conflicts for operator review', async () => {
  const result = await resolveAddressSystem({
    mode: 'server-registry',
    domain: 'resolver:conflict',
    salt: 'conflict-salt',
    includeLocalSource: false,
    payload: {
      ownerName: 'candidate.jp.agid',
      issuerId: 'issuer-jp',
    },
    sources: [
      {
        sourceId: 'registry-a',
        sourceKind: 'registry-api',
        trustScore: 0.85,
        resolve: async () => ({
          status: 'resolved',
          confidence: 0.8,
          addressReferenceCommitment: '0xA',
        }),
      },
      {
        sourceId: 'registry-b',
        sourceKind: 'address-dns',
        trustScore: 0.85,
        resolve: async () => ({
          status: 'resolved',
          confidence: 0.8,
          addressReferenceCommitment: '0xB',
        }),
      },
    ],
    quorum: 1,
  });

  assert.equal(result.status, 'conflict');
  assert.equal(result.decision, 'review');
  assert.ok(result.nextActions.includes('check-conflicting-resolvers'));
});

test('address resolution system applies Accept-Language negotiation and validates signed route advertisements', async () => {
  const route = createAddressRouteAdvertisement({
    zone: 'jp.agid.example',
    countries: ['JP'],
    regions: ['tokyo'],
    carrierIds: ['carrier-jp-1'],
    serviceClasses: ['address-resolution', 'delivery'],
    resolverEndpoint: 'https://resolver.jp.agid.example/resolve',
    validFrom: '2026-06-17T00:00:00.000Z',
    validUntil: '2026-06-17T00:15:00.000Z',
  }, {
    keyId: 'route-key',
    secret: 'route-secret',
    signedAt: '2026-06-17T00:00:00.000Z',
  });

  const result = await resolveAddressSystem({
    ...tokyoAddress,
    mode: 'local-only',
    language: 'en',
    acceptLanguage: 'ja-JP, en;q=0.8',
    availableLanguages: ['en', 'ja-JP'],
    routeAdvertisements: [route],
    routeSignatureSecrets: { 'route-key': 'route-secret' },
    requireVerifiedRouteSignatures: true,
  });

  assert.equal(result.status, 'resolved');
  assert.equal(result.displayHints.language, 'ja-jp');
  assert.equal(result.internetProtocols.routeAdvertisements.accepted, 1);
  assert.equal(result.internetProtocols.routeAdvertisements.rejected, 0);
});

test('address resolution system validates DNS/SRV/MX service records and selects an edge resolver', async () => {
  const serviceRecord = createAddressServiceRecord({
    zone: 'jp.agid.example',
    ownerName: 'resolver.jp.agid.example',
    recordType: 'SRV',
    service: 'resolver',
    endpoint: 'https://edge-tokyo.jp.agid.example/resolve',
    countries: ['JP'],
    regions: ['Tokyo'],
    carrierIds: ['carrier-jp-1'],
    serviceClasses: ['address-resolution'],
    priority: 1,
    weight: 100,
    validFrom: '2026-06-17T00:00:00.000Z',
    validUntil: '2026-06-17T00:15:00.000Z',
  }, {
    keyId: 'service-key',
    secret: 'service-secret',
    signedAt: '2026-06-17T00:00:00.000Z',
  });

  const result = await resolveAddressSystem({
    ...tokyoAddress,
    mode: 'local-only',
    serviceRecords: [serviceRecord],
    serviceRecordSignatureSecrets: { 'service-key': 'service-secret' },
    requireVerifiedServiceRecordSignatures: true,
    edgeRoutingContext: {
      carrierId: 'carrier-jp-1',
      serviceClass: 'address-resolution',
    },
  });

  assert.equal(result.status, 'resolved');
  assert.equal(result.internetProtocols.serviceRecords.accepted, 1);
  assert.equal(result.internetProtocols.edgeRoute.recordId, serviceRecord.recordId);
  assert.equal(result.internetProtocols.httpStatus.code, 200);
});

test('address resolution system rejects revoked address protocol subjects with 410 semantics', async () => {
  const revocation = createAddressRevocationStatus({
    subjectKind: 'delivery-qr',
    subjectCommitment: '0xdeliveryqr',
    issuerId: 'issuer-jp-1',
    status: 'revoked',
    reason: 'used',
    thisUpdate: '2026-06-17T00:00:00.000Z',
    nextUpdate: '2026-06-17T00:15:00.000Z',
  }, {
    keyId: 'revocation-key',
    secret: 'revocation-secret',
    signedAt: '2026-06-17T00:00:00.000Z',
  });

  const result = await resolveAddressSystem({
    ...tokyoAddress,
    mode: 'local-only',
    revocationStatuses: [revocation],
    revocationSignatureSecrets: { 'revocation-key': 'revocation-secret' },
    requireVerifiedRevocationSignatures: true,
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.decision, 'reject');
  assert.equal(result.internetProtocols.revocationStatuses.revoked, 1);
  assert.equal(result.internetProtocols.httpStatus.code, 410);
});

test('address resolution system rejects missing purpose-bound consent scopes', async () => {
  const consent = createAddressConsentGrant({
    subjectCommitment: '0xaddress',
    issuerId: 'issuer-jp-1',
    audience: 'pos:local-only',
    purpose: 'delivery',
    scopes: ['delivery:read'],
    nonce: 'consent-nonce',
    issuedAt: '2026-06-17T00:00:00.000Z',
    expiresAt: '2026-06-17T00:10:00.000Z',
  }, {
    keyId: 'consent-key',
    secret: 'consent-secret',
    signedAt: '2026-06-17T00:00:00.000Z',
  });

  const result = await resolveAddressSystem({
    ...tokyoAddress,
    mode: 'local-only',
    domain: 'pos:local-only',
    consentGrant: consent,
    requiredConsentScopes: ['delivery:read', 'recipient:verify'],
    consentSecrets: { 'consent-key': 'consent-secret' },
    requireVerifiedConsentSignature: true,
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.decision, 'reject');
  assert.match(result.errors.join('\n'), /consent-scope-missing/);
});

test('address resolution system rejects invalid issuer authentication envelopes', async () => {
  const unsignedEnvelope: Omit<AddressIssuerAuthEnvelope, 'signature'> = {
    kind: 'delivery-notification',
    issuerId: 'issuer-jp-1',
    fromDomain: 'issuer.example',
    signingDomain: 'mail.issuer.example',
    dkimSelector: 'agid1',
    resolverHost: 'resolver.issuer.example',
    messageHash: '0xmessage',
    scope: 'delivery',
  };
  const issuerAuthEnvelope: AddressIssuerAuthEnvelope = {
    ...unsignedEnvelope,
    signature: signAddressProtocolPayload(
      makeIssuerAuthSignaturePayload(unsignedEnvelope),
      'issuer-key',
      'issuer-secret',
      '2026-06-17T00:00:00.000Z',
    ),
  };
  const issuerAuthPolicy: AddressIssuerAuthPolicy = {
    domain: 'issuer.example',
    dmarcPolicy: 'reject',
    alignment: 'strict',
    allowedIssuerIds: ['issuer-jp-1'],
    allowedFromDomains: ['issuer.example'],
    allowedSigningDomains: ['mail.issuer.example'],
    allowedResolverHosts: ['resolver.issuer.example'],
    requiredDkimSelectors: ['agid1'],
    publicKeyCommitments: ['0xissuerkey'],
  };

  const result = await resolveAddressSystem({
    ...tokyoAddress,
    mode: 'local-only',
    issuerAuthEnvelope,
    issuerAuthPolicy,
    issuerAuthSecrets: { 'issuer-key': 'issuer-secret' },
    requireVerifiedIssuerSignature: true,
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.decision, 'reject');
  assert.equal(result.internetProtocols.issuerAuthentication?.valid, false);
  assert.match(result.errors.join('\n'), /dmarc-like-domain-alignment-failed/);
});
