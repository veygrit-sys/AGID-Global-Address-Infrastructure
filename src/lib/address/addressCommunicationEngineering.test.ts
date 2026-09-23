import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assessAddressCommunicationTechnique,
  createAddressCommunicationMessage,
  createAddressCommunicationImprovementSignals,
  getAddressCommunicationTechnique,
  getAddressCommunicationTechniques,
  summarizeAddressCommunicationEngineering,
  validateAddressCommunicationMessage,
} from './addressCommunicationEngineering';

test('address communication engineering catalog covers all 50 communication techniques', () => {
  const techniques = getAddressCommunicationTechniques();
  const summary = summarizeAddressCommunicationEngineering();

  assert.equal(techniques.length, 50);
  assert.equal(summary.total, 50);
  assert.deepEqual(summary.byCategory, {
    'network-foundation': 10,
    'protocol-design': 10,
    'messaging-events': 10,
    'mobile-near-field': 10,
    'secure-authenticated-communication': 10,
  });
  assert.equal(getAddressCommunicationTechnique(24).technology, 'Webhook');
  assert.equal(getAddressCommunicationTechnique(50).technology, 'End-to-End Encryption');
  assert.ok(summary.privacyCritical >= 40);
});

test('safe public communication message uses refs and receipts instead of raw address material', () => {
  const message = createAddressCommunicationMessage({
    sender: 'pos-terminal-01',
    destination: { kind: 'commitment', ref: ' commitment_123 ' },
    resolver: { kind: 'address-dns', ref: ' example.agid ' },
    policy: {
      purpose: 'delivery-status',
      scope: 'handoff.receipt',
      expiresAt: '2026-06-27T05:00:00.000Z',
      retry: 'unsafe-denied',
      cache: 'no-store',
      disclosure: 'none',
    },
    evidence: {
      receiptRef: 'receipt_abc',
      commitmentRef: 'commitment_123',
    },
    publicPayload: {
      status: 'handoff_completed',
      alias: 'alias_123',
      rawAddressReturned: false,
    },
  });

  const validation = validateAddressCommunicationMessage(message);

  assert.equal(message.destination.ref, 'commitment_123');
  assert.equal(message.resolver.ref, 'example.agid');
  assert.equal(validation.valid, true);
  assert.equal(validation.safeForPublicTransport, true);
  assert.equal(validation.model, 'resolve-authorize-minimize-handoff-receipt-audit');
  assert.deepEqual(validation.errors, []);
});

test('public communication rejects raw address and unsafe disclosure policy', () => {
  const message = createAddressCommunicationMessage({
    sender: 'checkout',
    destination: { kind: 'alias', ref: 'alias_123' },
    resolver: { kind: 'registry', ref: 'registry.local' },
    policy: {
      purpose: 'shipping',
      scope: 'carrier.label',
      expiresAt: '2026-06-27T05:00:00.000Z',
      retry: 'safe',
      cache: 'short-lived',
      disclosure: 'coarse',
    },
    evidence: {},
    publicPayload: {
      addressText: 'REDACTED_ADDRESS_SHOULD_NOT_BE_HERE',
      nested: {
        recipient: 'REDACTED_RECIPIENT_SHOULD_NOT_BE_HERE',
      },
    },
  });

  const validation = validateAddressCommunicationMessage(message);

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes('unsafe-retry-must-be-denied-when-disclosure-is-possible'));
  assert.ok(validation.errors.includes('disclosing-messages-must-use-no-store-cache'));
  assert.ok(validation.errors.includes('public-payload-forbidden-field:publicPayload.addressText'));
  assert.ok(validation.errors.includes('public-payload-forbidden-field:publicPayload.nested.recipient'));
  assert.ok(validation.warnings.includes('communication-message-has-no-receipt-commitment-or-audit-ref'));
});

test('carrier-only disclosure is allowed only for carrier destinations and is not public transport safe', () => {
  const invalidMessage = createAddressCommunicationMessage({
    sender: 'portal',
    destination: { kind: 'locker', ref: 'locker_1' },
    resolver: { kind: 'local-only', ref: 'local' },
    policy: {
      purpose: 'carrier-disclosure',
      scope: 'delivery.final-mile',
      expiresAt: '2026-06-27T05:00:00.000Z',
      retry: 'unsafe-denied',
      cache: 'no-store',
      disclosure: 'authorized-carrier-only',
    },
    evidence: { auditRef: 'audit_1' },
  });
  assert.ok(validateAddressCommunicationMessage(invalidMessage).errors.includes('carrier-only-disclosure-requires-carrier-destination'));

  const carrierMessage = createAddressCommunicationMessage({
    ...invalidMessage,
    destination: { kind: 'carrier', ref: 'carrier_1' },
  });
  const validation = validateAddressCommunicationMessage(carrierMessage);

  assert.equal(validation.valid, true);
  assert.equal(validation.safeForPublicTransport, false);
});

test('each communication technique gets a quality review and next improvement unit', () => {
  const dns = assessAddressCommunicationTechnique(1);
  const ipv6 = assessAddressCommunicationTechnique(3);
  const graphql = assessAddressCommunicationTechnique(13);
  const coap = assessAddressCommunicationTechnique(17);
  const webRtc = assessAddressCommunicationTechnique(18);
  const sip = assessAddressCommunicationTechnique(19);
  const stream = assessAddressCommunicationTechnique(23);
  const uwb = assessAddressCommunicationTechnique(34);
  const wifiRtt = assessAddressCommunicationTechnique(35);
  const cellular = assessAddressCommunicationTechnique(37);
  const fiveG = assessAddressCommunicationTechnique(38);
  const lpwa = assessAddressCommunicationTechnique(39);
  const satellite = assessAddressCommunicationTechnique(40);
  const qr = assessAddressCommunicationTechnique(32);

  assert.equal(dns.technology, 'DNS');
  assert.equal(dns.grade, 'release-ready');
  assert.ok(dns.requiredEvidence.includes('no-raw public payload'));
  assert.equal(ipv6.grade, 'draft');
  assert.equal(ipv6.threatModel?.boundary, 'research-only');
  assert.match(ipv6.threatModel?.releaseCondition ?? '', /must not ship as a public person\/building\/unit identifier/);
  assert.ok(!ipv6.requiredEvidence.includes('research boundary note'));
  assert.equal(graphql.grade, 'draft');
  assert.equal(graphql.threatModel?.boundary, 'connector');
  assert.match(graphql.nextImprovement, /allowed public fields/);
  assert.ok(!graphql.requiredEvidence.includes('research boundary note'));
  assert.equal(qr.grade, 'release-ready');
  assert.equal(coap.grade, 'draft');
  assert.equal(coap.threatModel?.boundary, 'connector');
  assert.match(coap.nextImprovement, /allowed public fields/);
  assert.ok(!coap.requiredEvidence.includes('research boundary note'));
  assert.equal(coap.recommendedGate, 'verify:no-raw-address-kit');
  assert.equal(webRtc.grade, 'draft');
  assert.equal(webRtc.threatModel?.boundary, 'connector');
  assert.match(webRtc.threatModel?.releaseCondition ?? '', /consent-expiry/);
  assert.equal(sip.grade, 'draft');
  assert.equal(sip.threatModel?.boundary, 'connector');
  assert.match(sip.threatModel?.releaseCondition ?? '', /masked-call consent/);
  assert.equal(stream.grade, 'draft');
  assert.equal(stream.threatModel?.boundary, 'connector');
  assert.match(stream.threatModel?.releaseCondition ?? '', /dead-letter scrub/);
  assert.equal(uwb.grade, 'draft');
  assert.equal(uwb.threatModel?.boundary, 'connector');
  assert.match(uwb.threatModel?.releaseCondition ?? '', /zone-quantization/);
  assert.equal(wifiRtt.grade, 'draft');
  assert.equal(wifiRtt.threatModel?.boundary, 'connector');
  assert.match(wifiRtt.threatModel?.releaseCondition ?? '', /access-point redaction/);
  assert.equal(cellular.grade, 'draft');
  assert.equal(cellular.threatModel?.boundary, 'connector');
  assert.match(cellular.threatModel?.releaseCondition ?? '', /no-verified-upgrade/);
  assert.equal(fiveG.grade, 'draft');
  assert.equal(fiveG.threatModel?.boundary, 'connector');
  assert.match(fiveG.threatModel?.releaseCondition ?? '', /telemetry minimization/);
  assert.equal(lpwa.grade, 'draft');
  assert.equal(lpwa.threatModel?.boundary, 'connector');
  assert.match(lpwa.threatModel?.releaseCondition ?? '', /beacon rotation/);
  assert.equal(satellite.grade, 'draft');
  assert.equal(satellite.threatModel?.boundary, 'connector');
  assert.match(satellite.threatModel?.releaseCondition ?? '', /store-and-forward expiry/);
});

test('address communication engineering produces safe improvement loop signals', () => {
  const signals = createAddressCommunicationImprovementSignals(3);

  assert.equal(signals.length, 3);
  assert.ok(signals.every(signal => signal.source === 'address-communication-engineering'));
  assert.ok(signals.every(signal => signal.compatibilityRisk === 'low'));
  assert.ok(signals.every(signal => signal.id.startsWith('address-communication-')));
  assert.ok(signals.every(signal => !/recipient|phone|email|privateKey|secret|witness/i.test(signal.title)));
  assert.ok(createAddressCommunicationImprovementSignals(50).every(signal => !(
    ['address-communication-39', 'address-communication-40'].includes(signal.id)
    && /Write the .* threat model/i.test(signal.title)
  )));
});
