import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  InMemoryAddressAbuseLimiter,
  createAddressCachePolicy,
  createAddressCertificateTransparencyEntry,
  createAddressConsentGrant,
  createAddressLocalDiscoveryRecord,
  createAddressRdapMetadata,
  createAddressRevocationStatus,
  createAddressRouteAdvertisement,
  createAddressServiceRecord,
  createEphemeralAddressAlias,
  createSignedAddressZoneBundle,
  createAddressWebhookEvent,
  createContentAddressedAddressSnapshot,
  makeIssuerAuthSignaturePayload,
  mapAddressResolutionToHttpStatus,
  negotiateAddressContentLanguage,
  selectAddressEdgeRoute,
  signAddressProtocolPayload,
  validateAddressCachePolicy,
  validateAddressCertificateTransparencyLog,
  validateAddressConsentGrant,
  validateAddressLocalDiscoveryRecord,
  validateAddressRdapMetadata,
  validateAddressRevocationStatus,
  validateAddressServiceRecord,
  validateAddressServiceRecordSet,
  validateEphemeralAddressAlias,
  validateAddressRouteAdvertisement,
  validateAddressRouteSet,
  validateAddressWebhookEvent,
  validateContentAddressedAddressSnapshot,
  validateIssuerAuthenticationEnvelope,
  validateSignedAddressZoneBundle,
  type AddressIssuerAuthEnvelope,
  type AddressIssuerAuthPolicy,
} from './addressInternetProtocols';

const signedAt = '2026-06-17T00:00:00.000Z';

test('signed address route advertisements validate and tampering is rejected', () => {
  const route = createAddressRouteAdvertisement({
    zone: 'jp.agid.example',
    countries: ['JP'],
    regions: ['tokyo'],
    carrierIds: ['carrier-jp-1'],
    serviceClasses: ['address-resolution', 'delivery'],
    resolverEndpoint: 'https://resolver.jp.agid.example/resolve',
    rdapEndpoint: 'https://resolver.jp.agid.example/.well-known/agid-rdap',
    priority: 10,
    trustScore: 0.94,
    validFrom: '2026-06-17T00:00:00.000Z',
    validUntil: '2026-06-17T00:15:00.000Z',
    roots: {
      postalDatasetRoot: '0xpostal',
      boundaryRoot: '0xboundary',
      revocationRoot: '0xrevocation',
    },
  }, {
    keyId: 'route-key',
    secret: 'route-secret',
    signedAt,
  });

  const valid = validateAddressRouteAdvertisement(route, {
    now: '2026-06-17T00:05:00.000Z',
    secretsByKeyId: { 'route-key': 'route-secret' },
    requireVerifiedSignature: true,
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.signatureVerified, true);

  const tampered = {
    ...route,
    resolverEndpoint: 'https://evil.example/resolve',
  };
  const rejected = validateAddressRouteAdvertisement(tampered, {
    now: '2026-06-17T00:05:00.000Z',
    secretsByKeyId: { 'route-key': 'route-secret' },
    requireVerifiedSignature: true,
  });
  assert.equal(rejected.valid, false);
  assert.match(rejected.errors.join('\n'), /routeHash|signature-verification-failed/);
});

test('address route sets require usable signed route advertisements', () => {
  const route = createAddressRouteAdvertisement({
    zone: 'us.agid.example',
    countries: ['US'],
    resolverEndpoint: 'https://resolver.us.agid.example/resolve',
    validFrom: '2026-06-17T00:00:00.000Z',
    validUntil: '2026-06-17T00:15:00.000Z',
  }, {
    keyId: 'route-key',
    secret: 'route-secret',
    signedAt,
  });
  const unsigned = {
    ...route,
    signature: undefined,
  } as any;

  const result = validateAddressRouteSet([unsigned], {
    now: '2026-06-17T00:05:00.000Z',
    requireVerifiedSignature: true,
  });
  assert.equal(result.accepted, 0);
  assert.equal(result.rejected, 1);
  assert.match(result.errors.join('\n'), /signed-route-advertisement-required/);
});

test('DNS/SRV/MX-style service records validate signed resolver and revocation endpoints', () => {
  const record = createAddressServiceRecord({
    zone: 'jp.agid.example',
    ownerName: 'resolver.jp.agid.example',
    recordType: 'SRV',
    service: 'resolver',
    endpoint: 'https://resolver.jp.agid.example/.well-known/agid-resolver',
    countries: ['JP'],
    regions: ['tokyo'],
    carrierIds: ['carrier-jp-1'],
    serviceClasses: ['address-resolution', 'delivery'],
    priority: 5,
    weight: 20,
    validFrom: '2026-06-17T00:00:00.000Z',
    validUntil: '2026-06-17T00:15:00.000Z',
  }, {
    keyId: 'service-key',
    secret: 'service-secret',
    signedAt,
  });

  const valid = validateAddressServiceRecord(record, {
    now: '2026-06-17T00:05:00.000Z',
    secretsByKeyId: { 'service-key': 'service-secret' },
    requireVerifiedSignature: true,
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.signatureVerified, true);

  const set = validateAddressServiceRecordSet([record], {
    now: '2026-06-17T00:05:00.000Z',
    secretsByKeyId: { 'service-key': 'service-secret' },
    requireVerifiedSignature: true,
  });
  assert.equal(set.accepted, 1);
  assert.equal(set.rejected, 0);
});

test('service records reject raw private address material and insecure public endpoints', () => {
  const record = createAddressServiceRecord({
    zone: 'jp.agid.example',
    ownerName: 'recipient-home.jp.agid.example',
    recordType: 'CARRIER',
    service: 'carrier',
    endpoint: 'http://carrier.example/resolve',
    countries: ['JP'],
  }, {
    keyId: 'service-key',
    secret: 'service-secret',
    signedAt,
  });
  const leaking = {
    ...record,
    publicAddress: '東京都千代田区丸の内1-9-1',
  } as any;
  const rejected = validateAddressServiceRecord(leaking, {
    now: '2026-06-17T00:05:00.000Z',
    secretsByKeyId: { 'service-key': 'service-secret' },
  });
  assert.equal(rejected.valid, false);
  assert.match(rejected.errors.join('\n'), /private material|service endpoint/);
});

test('signed zone bundles validate DNSSEC/RPKI-style address zone authority', () => {
  const record = createAddressServiceRecord({
    zone: 'jp.agid.example',
    recordType: 'REVOCATION',
    service: 'revocation',
    endpoint: 'https://registry.jp.agid.example/revocation',
    countries: ['JP'],
    validFrom: '2026-06-17T00:00:00.000Z',
    validUntil: '2026-06-17T00:15:00.000Z',
  }, {
    keyId: 'service-key',
    secret: 'service-secret',
    signedAt,
  });
  const bundle = createSignedAddressZoneBundle({
    zone: 'jp.agid.example',
    serial: 42,
    authorizedIssuerIds: ['issuer-jp-1'],
    authorizedKeyIds: ['service-key'],
    serviceRecords: [record],
    validFrom: '2026-06-17T00:00:00.000Z',
    validUntil: '2026-06-17T00:15:00.000Z',
  }, {
    keyId: 'zone-key',
    secret: 'zone-secret',
    signedAt,
  });

  const valid = validateSignedAddressZoneBundle(bundle, {
    now: '2026-06-17T00:05:00.000Z',
    secretsByKeyId: { 'zone-key': 'zone-secret' },
    serviceRecordSecretsByKeyId: { 'service-key': 'service-secret' },
    requireVerifiedSignature: true,
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.signatureVerified, true);

  const tampered = {
    ...bundle,
    zone: 'evil.example',
  };
  const rejected = validateSignedAddressZoneBundle(tampered, {
    now: '2026-06-17T00:05:00.000Z',
    secretsByKeyId: { 'zone-key': 'zone-secret' },
  });
  assert.equal(rejected.valid, false);
  assert.match(rejected.errors.join('\n'), /bundleHash|service-record-zone-outside-bundle|signature/);
});

test('certificate transparency style logs detect issuer key log chain breakage', () => {
  const first = createAddressCertificateTransparencyEntry({
    logId: 'agid-ct',
    issuerId: 'issuer-jp-1',
    subjectKind: 'aoid-issuer',
    subjectId: 'issuer-jp-1',
    publicKeyCommitment: '0xissuerkey1',
    notBefore: '2026-06-17T00:00:00.000Z',
    notAfter: '2026-07-17T00:00:00.000Z',
  });
  const second = createAddressCertificateTransparencyEntry({
    logId: 'agid-ct',
    issuerId: 'issuer-jp-1',
    subjectKind: 'aoid-issuer',
    subjectId: 'issuer-jp-1',
    publicKeyCommitment: '0xissuerkey2',
    previousEntryHash: first.entryHash,
    notBefore: '2026-06-17T00:00:00.000Z',
    notAfter: '2026-07-17T00:00:00.000Z',
  });

  assert.equal(validateAddressCertificateTransparencyLog([first, second], {
    now: '2026-06-17T00:05:00.000Z',
  }).valid, true);
  const broken = validateAddressCertificateTransparencyLog([{ ...first }, { ...second, previousEntryHash: '0xwrong' }], {
    now: '2026-06-17T00:05:00.000Z',
  });
  assert.equal(broken.valid, false);
  assert.match(broken.errors.join('\n'), /ct-log-chain-broken/);
});

test('OCSP/CRL-style revocation statuses are signed and stale statuses are rejected', () => {
  const status = createAddressRevocationStatus({
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
    signedAt,
  });
  const valid = validateAddressRevocationStatus(status, {
    now: '2026-06-17T00:05:00.000Z',
    secretsByKeyId: { 'revocation-key': 'revocation-secret' },
    requireVerifiedSignature: true,
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.revoked, true);

  const stale = validateAddressRevocationStatus(status, {
    now: '2026-06-17T00:16:00.000Z',
    secretsByKeyId: { 'revocation-key': 'revocation-secret' },
  });
  assert.equal(stale.valid, false);
  assert.match(stale.errors.join('\n'), /revocation-status-stale/);
});

test('TTL Cache-Control and ETag policies distinguish fresh, stale, and tampered payloads', () => {
  const payload = { dataset: 'jp-postal-codes', version: '2026-06' };
  const policy = createAddressCachePolicy({
    profile: 'postal-code',
    payload,
    ttlSeconds: 600,
    generatedAt: '2026-06-17T00:00:00.000Z',
  });
  assert.equal(validateAddressCachePolicy(policy, {
    now: '2026-06-17T00:04:00.000Z',
    payload,
  }).valid, true);
  assert.match(validateAddressCachePolicy(policy, {
    now: '2026-06-17T00:04:00.000Z',
    payload: { dataset: 'changed' },
  }).errors.join('\n'), /etag/);
  const expired = validateAddressCachePolicy(policy, {
    now: '2026-06-17T00:11:00.000Z',
    payload,
  });
  assert.equal(expired.valid, false);
  assert.match(expired.errors.join('\n'), /cache-policy-expired/);
});

test('OAuth-scope-style consent grants enforce purpose-bound address use', () => {
  const grant = createAddressConsentGrant({
    subjectCommitment: '0xaddress',
    issuerId: 'issuer-jp-1',
    audience: 'delivery:carrier',
    purpose: 'delivery',
    scopes: ['delivery:read', 'recipient:verify'],
    nonce: 'consent-nonce',
    issuedAt: '2026-06-17T00:00:00.000Z',
    expiresAt: '2026-06-17T00:10:00.000Z',
  }, {
    keyId: 'consent-key',
    secret: 'consent-secret',
    signedAt,
  });

  const valid = validateAddressConsentGrant(grant, ['delivery:read'], {
    now: '2026-06-17T00:05:00.000Z',
    secretsByKeyId: { 'consent-key': 'consent-secret' },
    requireVerifiedSignature: true,
    expectedAudience: 'delivery:carrier',
  });
  assert.equal(valid.valid, true);

  const rejected = validateAddressConsentGrant(grant, ['return:label'], {
    now: '2026-06-17T00:05:00.000Z',
    secretsByKeyId: { 'consent-key': 'consent-secret' },
    expectedAudience: 'delivery:carrier',
  });
  assert.equal(rejected.valid, false);
  assert.match(rejected.errors.join('\n'), /consent-scope-missing/);
});

test('ephemeral aliases provide IPv6 privacy-address-like purpose separation', () => {
  const delivery = createEphemeralAddressAlias({
    stableCommitment: '0xaoid',
    domain: 'delivery:carrier',
    purpose: 'delivery',
    nonce: 'nonce-a',
    issuedAt: '2026-06-17T00:00:00.000Z',
    expiresAt: '2026-06-17T00:10:00.000Z',
  });
  const returns = createEphemeralAddressAlias({
    stableCommitment: '0xaoid',
    domain: 'delivery:carrier',
    purpose: 'return',
    nonce: 'nonce-a',
    issuedAt: '2026-06-17T00:00:00.000Z',
    expiresAt: '2026-06-17T00:10:00.000Z',
  });
  assert.notEqual(delivery.aliasCommitment, returns.aliasCommitment);
  assert.equal(validateEphemeralAddressAlias(delivery, {
    now: '2026-06-17T00:05:00.000Z',
    expectedDomain: 'delivery:carrier',
    expectedPurpose: 'delivery',
  }).valid, true);
});

test('anycast edge selection prefers matching service records over generic routes', () => {
  const serviceRecord = createAddressServiceRecord({
    zone: 'jp.agid.example',
    recordType: 'SRV',
    service: 'resolver',
    endpoint: 'https://edge-tokyo.jp.agid.example/resolve',
    countries: ['JP'],
    regions: ['Tokyo'],
    carrierIds: ['carrier-jp-1'],
    serviceClasses: ['delivery'],
    priority: 1,
    weight: 100,
    validFrom: '2026-06-17T00:00:00.000Z',
    validUntil: '2026-06-17T00:15:00.000Z',
  }, {
    keyId: 'service-key',
    secret: 'service-secret',
    signedAt,
  });
  const genericRoute = createAddressRouteAdvertisement({
    zone: 'jp.agid.example',
    countries: ['JP'],
    resolverEndpoint: 'https://generic.jp.agid.example/resolve',
    priority: 50,
    trustScore: 0.5,
    validFrom: '2026-06-17T00:00:00.000Z',
    validUntil: '2026-06-17T00:15:00.000Z',
  }, {
    keyId: 'route-key',
    secret: 'route-secret',
    signedAt,
  });
  const selected = selectAddressEdgeRoute({
    serviceRecords: [serviceRecord],
    routeAdvertisements: [genericRoute],
    now: '2026-06-17T00:05:00.000Z',
    context: {
      country: 'JP',
      region: 'Tokyo',
      carrierId: 'carrier-jp-1',
      serviceClass: 'delivery',
    },
  });
  assert.equal(selected.recordId, serviceRecord.recordId);
  assert.match(selected.reasons.join('\n'), /carrier-match/);
});

test('mDNS/local-first records allow loopback and .local endpoints only for local discovery', () => {
  const local = createAddressLocalDiscoveryRecord({
    serviceName: '_agid-address._tcp.local',
    instanceId: 'warehouse-pos-1',
    endpoint: 'http://127.0.0.1:4317/.well-known/agid-local',
    capabilities: ['resolver', 'revocation'],
    validUntil: '2026-06-17T00:10:00.000Z',
  });
  assert.equal(validateAddressLocalDiscoveryRecord(local, {
    now: '2026-06-17T00:05:00.000Z',
  }).valid, true);

  const rejected = validateAddressLocalDiscoveryRecord({
    ...local,
    endpoint: 'http://public.example/resolve',
  }, {
    now: '2026-06-17T00:05:00.000Z',
  });
  assert.equal(rejected.valid, false);
  assert.match(rejected.errors.join('\n'), /local endpoint/);
});

test('HTTP-style status mapping exposes operator-oriented resolution states', () => {
  assert.equal(mapAddressResolutionToHttpStatus({
    status: 'resolved',
    decision: 'accept',
  }).code, 200);
  assert.equal(mapAddressResolutionToHttpStatus({
    status: 'partial',
    decision: 'review',
  }).code, 206);
  assert.equal(mapAddressResolutionToHttpStatus({
    status: 'rejected',
    decision: 'reject',
    errors: ['credential-revoked'],
  }).code, 410);
  assert.equal(mapAddressResolutionToHttpStatus({
    status: 'blocked',
    decision: 'reject',
    highRiskMode: true,
  }).code, 451);
});

test('RDAP metadata is public zone or issuer metadata and rejects private address material', () => {
  const metadata = createAddressRdapMetadata({
    rdapClass: 'issuer',
    handle: 'issuer-jp-1',
    issuerId: 'issuer-jp-1',
    organization: 'AGID Japan Public Test Issuer',
    roles: ['technical', 'security', 'abuse'],
    serviceEndpoints: ['https://issuer.jp.agid.example/.well-known/agid-rdap'],
    publicKeyCommitments: ['0xissuerkey'],
  });

  assert.equal(validateAddressRdapMetadata(metadata).valid, true);

  const leaking = {
    ...metadata,
    email: 'recipient@example.com',
  } as any;
  const rejected = validateAddressRdapMetadata(leaking);
  assert.equal(rejected.valid, false);
  assert.match(rejected.errors.join('\n'), /private material|email/);
});

test('issuer authentication follows DMARC/SPF/DKIM-like policy checks', () => {
  const unsignedEnvelope: Omit<AddressIssuerAuthEnvelope, 'signature'> = {
    kind: 'address-credential',
    issuerId: 'issuer-jp-1',
    fromDomain: 'issuer.example',
    signingDomain: 'mail.issuer.example',
    dkimSelector: 'agid1',
    resolverHost: 'resolver.issuer.example',
    messageHash: '0xmessage',
    scope: 'delivery',
  };
  const signature = signAddressProtocolPayload(
    makeIssuerAuthSignaturePayload(unsignedEnvelope),
    'issuer-key',
    'issuer-secret',
    signedAt,
  );
  const envelope: AddressIssuerAuthEnvelope = {
    ...unsignedEnvelope,
    signature,
  };
  const policy: AddressIssuerAuthPolicy = {
    domain: 'issuer.example',
    dmarcPolicy: 'reject',
    alignment: 'relaxed',
    allowedIssuerIds: ['issuer-jp-1'],
    allowedFromDomains: ['issuer.example'],
    allowedSigningDomains: ['mail.issuer.example'],
    allowedResolverHosts: ['resolver.issuer.example'],
    requiredDkimSelectors: ['agid1'],
    publicKeyCommitments: ['0xissuerkey'],
  };

  const valid = validateIssuerAuthenticationEnvelope(envelope, policy, {
    secretsByKeyId: { 'issuer-key': 'issuer-secret' },
    requireVerifiedSignature: true,
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.signatureVerified, true);

  const rejected = validateIssuerAuthenticationEnvelope(envelope, {
    ...policy,
    alignment: 'strict',
  }, {
    secretsByKeyId: { 'issuer-key': 'issuer-secret' },
    requireVerifiedSignature: true,
  });
  assert.equal(rejected.valid, false);
  assert.match(rejected.errors.join('\n'), /dmarc-like-domain-alignment-failed/);
});

test('address display content negotiation honors Accept-Language style preferences', () => {
  const decision = negotiateAddressContentLanguage('fr-CA, ja-JP;q=0.9, en;q=0.6', ['en', 'ja', 'ja-JP'], 'en');
  assert.equal(decision.selected, 'ja-jp');
  assert.equal(decision.fallback, false);

  const fallback = negotiateAddressContentLanguage('fr-CA', ['en', 'ja'], 'en');
  assert.equal(fallback.selected, 'en');
  assert.equal(fallback.fallback, true);
});

test('content addressed public address snapshots detect tampering', () => {
  const payload = {
    country: 'JP',
    rules: ['postcode-before-locality'],
  };
  const snapshot = createContentAddressedAddressSnapshot({
    datasetKind: 'address-rules',
    sourceUri: 'https://example.org/address-rules/jp.json',
    license: 'CC0-1.0',
    payload,
    generatedAt: signedAt,
  });

  assert.equal(validateContentAddressedAddressSnapshot(snapshot, payload).valid, true);
  const tampered = validateContentAddressedAddressSnapshot(snapshot, {
    country: 'JP',
    rules: ['changed'],
  });
  assert.equal(tampered.valid, false);
  assert.match(tampered.errors.join('\n'), /payloadHash|contentAddress/);
});

test('webhook events are signed commitment-only events', () => {
  const event = createAddressWebhookEvent({
    eventType: 'delivery.completed',
    subjectCommitment: '0xwaybill',
    publicPayload: {
      status: 'handoff-complete',
      carrierReceiptCommitment: '0xreceipt',
    },
    createdAt: signedAt,
  }, {
    keyId: 'webhook-key',
    secret: 'webhook-secret',
    signedAt,
  });

  const valid = validateAddressWebhookEvent(event, {
    secretsByKeyId: { 'webhook-key': 'webhook-secret' },
    requireVerifiedSignature: true,
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.signatureVerified, true);

  const leaking = createAddressWebhookEvent({
    eventType: 'delivery.completed',
    subjectCommitment: '0xwaybill',
    publicPayload: {
      recipient: 'Alice Example',
    },
    createdAt: signedAt,
  }, {
    keyId: 'webhook-key',
    secret: 'webhook-secret',
    signedAt,
  });
  const rejected = validateAddressWebhookEvent(leaking, {
    secretsByKeyId: { 'webhook-key': 'webhook-secret' },
    requireVerifiedSignature: true,
  });
  assert.equal(rejected.valid, false);
  assert.match(rejected.errors.join('\n'), /private material|recipient/);
});

test('abuse limiter blocks repeated reverse lookup attempts without exposing actor keys', () => {
  const limiter = new InMemoryAddressAbuseLimiter();
  const first = limiter.check({
    actorKey: 'operator@example.test',
    operation: 'reverse-lookup',
    limit: 2,
    windowMs: 60_000,
    now: 1000,
  });
  const second = limiter.check({
    actorKey: 'operator@example.test',
    operation: 'reverse-lookup',
    limit: 2,
    windowMs: 60_000,
    now: 2000,
  });
  const third = limiter.check({
    actorKey: 'operator@example.test',
    operation: 'reverse-lookup',
    limit: 2,
    windowMs: 60_000,
    now: 3000,
  });

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
  assert.notEqual(third.actorKeyHash, 'operator@example.test');
  assert.match(third.warnings.join('\n'), /abuse-rate-limit-exceeded/);
});
