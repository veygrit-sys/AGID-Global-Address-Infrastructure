import type { ImprovementSignal } from '../continuousImprovementLoop';

export const ADDRESS_COMMUNICATION_ENGINEERING_VERSION = 'address-communication-engineering-v1';

export type AddressCommunicationCategory =
  | 'network-foundation'
  | 'protocol-design'
  | 'messaging-events'
  | 'mobile-near-field'
  | 'secure-authenticated-communication';

export type AddressCommunicationPriority = 'implemented' | 'partial' | 'planned' | 'research';
export type AddressCommunicationQualityGrade = 'release-ready' | 'integration-ready' | 'draft' | 'research-only';

export type AddressCommunicationTechnique = {
  no: number;
  category: AddressCommunicationCategory;
  technology: string;
  addressApplication: string;
  implementationTheory: string;
  priority: AddressCommunicationPriority;
  privacyCritical: boolean;
};

export type AddressCommunicationEndpointKind =
  | 'agid'
  | 'aoid'
  | 'alias'
  | 'commitment'
  | 'receipt'
  | 'resolver'
  | 'delivery-zone'
  | 'locker'
  | 'carrier';

export type AddressCommunicationPolicy = {
  purpose: string;
  scope: string;
  expiresAt: string;
  retry: 'safe' | 'unsafe-denied' | 'manual-review';
  cache: 'no-store' | 'short-lived' | 'public-pack';
  disclosure: 'none' | 'coarse' | 'authorized-carrier-only';
};

export type AddressCommunicationEvidence = {
  receiptRef?: string;
  commitmentRef?: string;
  signatureRef?: string;
  auditRef?: string;
  nullifierRef?: string;
};

export type AddressCommunicationMessage = {
  version: typeof ADDRESS_COMMUNICATION_ENGINEERING_VERSION;
  sender: string;
  destination: {
    kind: AddressCommunicationEndpointKind;
    ref: string;
  };
  resolver: {
    kind: 'address-dns' | 'registry' | 'country-pack' | 'postal-api' | 'local-only';
    ref: string;
  };
  policy: AddressCommunicationPolicy;
  evidence: AddressCommunicationEvidence;
  publicPayload?: Record<string, unknown>;
};

export type AddressCommunicationValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  model: 'resolve-authorize-minimize-handoff-receipt-audit';
  safeForPublicTransport: boolean;
};

export type AddressCommunicationQualityReview = {
  techniqueNo: number;
  technology: string;
  grade: AddressCommunicationQualityGrade;
  score: number;
  nextImprovement: string;
  requiredEvidence: string[];
  recommendedGate: string;
  threatModel?: AddressCommunicationThreatModel;
};

export type AddressCommunicationThreatModel = {
  techniqueNo: number;
  boundary: 'core' | 'connector' | 'research-only';
  misuseCases: string[];
  mitigations: string[];
  releaseCondition: string;
};

const TECHNIQUES: AddressCommunicationTechnique[] = [
  { no: 1, category: 'network-foundation', technology: 'DNS', addressApplication: 'Readable address names resolve to commitments, resolvers, policies, and roots.', implementationTheory: 'Address DNS returns public metadata, never the address body.', priority: 'implemented', privacyCritical: true },
  { no: 2, category: 'network-foundation', technology: 'IP address design', addressApplication: 'Hierarchical address IDs and routing-like prefixes.', implementationTheory: 'AGID uses country, region, cell, and object-level prefixes without private AOID data.', priority: 'partial', privacyCritical: false },
  { no: 3, category: 'network-foundation', technology: 'IPv6', addressApplication: 'Large addressable space for buildings, rooms, lockers, and handoff points.', implementationTheory: 'Use as design inspiration, not as a public unit-level identifier.', priority: 'research', privacyCritical: true },
  { no: 4, category: 'network-foundation', technology: 'Anycast', addressApplication: 'Connect clients to the nearest address resolver.', implementationTheory: 'Route resolver reads to nearest regional country pack or registry replica.', priority: 'planned', privacyCritical: false },
  { no: 5, category: 'network-foundation', technology: 'CDN', addressApplication: 'Fast global delivery of public address formats and country packs.', implementationTheory: 'Cache only public packs, formats, policy hashes, and download manifests.', priority: 'partial', privacyCritical: true },
  { no: 6, category: 'network-foundation', technology: 'Edge Computing', addressApplication: 'Run address completion and delivery checks close to the user.', implementationTheory: 'Prefer local/edge validation and redaction before central requests.', priority: 'planned', privacyCritical: true },
  { no: 7, category: 'network-foundation', technology: 'Load Balancing', addressApplication: 'Distribute resolver, verification, and webhook traffic.', implementationTheory: 'Scale public APIs while keeping connector writes idempotent.', priority: 'planned', privacyCritical: false },
  { no: 8, category: 'network-foundation', technology: 'Packet Routing', addressApplication: 'Model parcels as routeable packets with next-hop handoff receipts.', implementationTheory: 'Represent delivery as destination commitment, policy, next hop, and receipt.', priority: 'planned', privacyCritical: true },
  { no: 9, category: 'network-foundation', technology: 'BGP', addressApplication: 'Exchange reachability between countries, carriers, and municipalities.', implementationTheory: 'Carrier route announcements expose zone reachability and roots.', priority: 'partial', privacyCritical: true },
  { no: 10, category: 'network-foundation', technology: 'NAT', addressApplication: 'Hide the real destination behind aliases and tokens.', implementationTheory: 'Merchant sees alias; authorized carrier receives scoped disclosure.', priority: 'implemented', privacyCritical: true },
  { no: 11, category: 'protocol-design', technology: 'HTTP / HTTPS', addressApplication: 'Base transport for address APIs.', implementationTheory: 'HTTPS required except explicit local-only loopback development.', priority: 'implemented', privacyCritical: true },
  { no: 12, category: 'protocol-design', technology: 'REST API', addressApplication: 'Standard resolve, translate, verify, handoff, and receipt endpoints.', implementationTheory: 'Stable verbs around redacted request and response envelopes.', priority: 'implemented', privacyCritical: true },
  { no: 13, category: 'protocol-design', technology: 'GraphQL', addressApplication: 'Fetch only needed address attributes.', implementationTheory: 'Field-level authorization is required before exposing selective queries.', priority: 'research', privacyCritical: true },
  { no: 14, category: 'protocol-design', technology: 'gRPC', addressApplication: 'High-throughput B2B address verification.', implementationTheory: 'Use for carriers and warehouses after the REST contract is stable.', priority: 'planned', privacyCritical: true },
  { no: 15, category: 'protocol-design', technology: 'WebSocket', addressApplication: 'Live address completion, verification, and sync queue updates.', implementationTheory: 'Stream candidate status and refs, not private address bodies.', priority: 'partial', privacyCritical: true },
  { no: 16, category: 'protocol-design', technology: 'MQTT', addressApplication: 'Lightweight locker, smart-lock, and robot communication.', implementationTheory: 'Publish status, receipt, and command refs with short-lived scopes.', priority: 'planned', privacyCritical: true },
  { no: 17, category: 'protocol-design', technology: 'CoAP', addressApplication: 'Low-power address and delivery notifications.', implementationTheory: 'Use for rural, LPWA, and disaster devices with tiny public payloads.', priority: 'research', privacyCritical: true },
  { no: 18, category: 'protocol-design', technology: 'WebRTC', addressApplication: 'Temporary anonymous recipient-to-driver communication.', implementationTheory: 'Bind session to a purpose scope and avoid persistent transcript storage.', priority: 'research', privacyCritical: true },
  { no: 19, category: 'protocol-design', technology: 'SIP / VoIP', addressApplication: 'Masked calls without exposing recipient phone numbers.', implementationTheory: 'Store call receipt and consent only, not phone or transcript material.', priority: 'research', privacyCritical: true },
  { no: 20, category: 'protocol-design', technology: 'SMTP-style model', addressApplication: 'Address-like aliases that route delivery requests.', implementationTheory: 'Resolve alias@zone to policy, resolver, and delivery authorization.', priority: 'planned', privacyCritical: true },
  { no: 21, category: 'messaging-events', technology: 'Pub/Sub', addressApplication: 'Publish address and delivery status changes.', implementationTheory: 'Topic payloads carry commitments, receipts, and status refs.', priority: 'partial', privacyCritical: true },
  { no: 22, category: 'messaging-events', technology: 'Message Queue', addressApplication: 'Queue verification, label, and handoff jobs.', implementationTheory: 'Jobs include retry policy and redaction status.', priority: 'partial', privacyCritical: true },
  { no: 23, category: 'messaging-events', technology: 'Kafka-style event stream', addressApplication: 'Process high-volume address updates and delivery events.', implementationTheory: 'Public streams carry refs; encrypted private streams need strict scopes.', priority: 'research', privacyCritical: true },
  { no: 24, category: 'messaging-events', technology: 'Webhook', addressApplication: 'Notify EC and carriers about updates and completions.', implementationTheory: 'Require HMAC, idempotency, payload fingerprints, and redacted body policy.', priority: 'implemented', privacyCritical: true },
  { no: 25, category: 'messaging-events', technology: 'Push notification', addressApplication: 'Notify recipients about address requests and delivery events.', implementationTheory: 'Notification text uses aliases and links, not detailed address data.', priority: 'planned', privacyCritical: true },
  { no: 26, category: 'messaging-events', technology: 'SMS Gateway', addressApplication: 'Reach users without the app.', implementationTheory: 'SMS contains only short-lived URL and alias.', priority: 'planned', privacyCritical: true },
  { no: 27, category: 'messaging-events', technology: 'Email notification', addressApplication: 'Send address request and confirmation notices.', implementationTheory: 'Email body stays low-risk; detailed data is behind authenticated flow.', priority: 'planned', privacyCritical: true },
  { no: 28, category: 'messaging-events', technology: 'Retry control', addressApplication: 'Retry communication safely after failures.', implementationTheory: 'Disallow unsafe retry for disclosures, payment, PMS, and connector writes.', priority: 'implemented', privacyCritical: true },
  { no: 29, category: 'messaging-events', technology: 'Idempotency Key', addressApplication: 'Prevent duplicate registration and handoff.', implementationTheory: 'Key by request, purpose, and subject commitment.', priority: 'implemented', privacyCritical: true },
  { no: 30, category: 'messaging-events', technology: 'Dead Letter Queue', addressApplication: 'Isolate failed address or delivery jobs.', implementationTheory: 'Store failure reason, retry state, and scrubbed refs for review.', priority: 'partial', privacyCritical: true },
  { no: 31, category: 'mobile-near-field', technology: 'NFC', addressApplication: 'Tap to pass destination token or receipt.', implementationTheory: 'Use the same Secure Address envelope as QR.', priority: 'partial', privacyCritical: true },
  { no: 32, category: 'mobile-near-field', technology: 'QR code communication', addressApplication: 'Carry address intake URL, delivery token, or receipt.', implementationTheory: 'QR carries commitment, scope, expiry, and receipt refs.', priority: 'implemented', privacyCritical: true },
  { no: 33, category: 'mobile-near-field', technology: 'Bluetooth Low Energy', addressApplication: 'Locker, smart lock, and robot proximity handoff.', implementationTheory: 'Exchange proximity proof and receipt with no private payload logging.', priority: 'planned', privacyCritical: true },
  { no: 34, category: 'mobile-near-field', technology: 'UWB', addressApplication: 'High-accuracy indoor handoff zones.', implementationTheory: 'Use for bay/zone confirmation, not persistent room-level tracking.', priority: 'research', privacyCritical: true },
  { no: 35, category: 'mobile-near-field', technology: 'Wi-Fi RTT', addressApplication: 'Indoor positioning for reception and pickup shelves.', implementationTheory: 'Prefer local computation and avoid storing precise indoor traces.', priority: 'research', privacyCritical: true },
  { no: 36, category: 'mobile-near-field', technology: 'GPS / GNSS', addressApplication: 'Confirm delivery points and temporary disaster addresses.', implementationTheory: 'Use as AGID evidence with precision policy and redaction.', priority: 'implemented', privacyCritical: true },
  { no: 37, category: 'mobile-near-field', technology: 'Cellular positioning', addressApplication: 'Estimate area when GNSS is weak.', implementationTheory: 'Use coarse area only; never replace verified address evidence.', priority: 'research', privacyCritical: true },
  { no: 38, category: 'mobile-near-field', technology: '5G', addressApplication: 'Low-latency logistics, drone, and robot coordination.', implementationTheory: 'Expose reachability and handoff safety, not precise telemetry by default.', priority: 'research', privacyCritical: true },
  { no: 39, category: 'mobile-near-field', technology: 'LPWA / LoRaWAN', addressApplication: 'Rural, island, and mountain address beacons.', implementationTheory: 'Use for low-bandwidth AGID beacon and receipt sync.', priority: 'research', privacyCritical: true },
  { no: 40, category: 'mobile-near-field', technology: 'Satellite communication', addressApplication: 'Remote, disaster, desert, sea, and island address sync.', implementationTheory: 'Sync AGID, coordinate refs, receipts, and manual-review state.', priority: 'research', privacyCritical: true },
  { no: 41, category: 'secure-authenticated-communication', technology: 'TLS', addressApplication: 'Encrypt address data transport.', implementationTheory: 'Required for public APIs, connectors, manifests, and registries.', priority: 'implemented', privacyCritical: true },
  { no: 42, category: 'secure-authenticated-communication', technology: 'mTLS', addressApplication: 'Mutual authentication between carriers, hotels, EC, and registries.', implementationTheory: 'Use for connector writes and regulated B2B integrations.', priority: 'planned', privacyCritical: true },
  { no: 43, category: 'secure-authenticated-communication', technology: 'OAuth 2.0', addressApplication: 'Delegate address usage rights.', implementationTheory: 'Address Portal issues purpose, scope, and expiry-bound grants.', priority: 'partial', privacyCritical: true },
  { no: 44, category: 'secure-authenticated-communication', technology: 'OpenID Connect', addressApplication: 'Connect login and address consent.', implementationTheory: 'Authentication is separate from address disclosure consent.', priority: 'planned', privacyCritical: true },
  { no: 45, category: 'secure-authenticated-communication', technology: 'JWT', addressApplication: 'Short-lived address access and delivery tokens.', implementationTheory: 'JWT contains refs, audience, scope, expiry, nonce, and no private body.', priority: 'planned', privacyCritical: true },
  { no: 46, category: 'secure-authenticated-communication', technology: 'MAC signature / HMAC', addressApplication: 'Verify webhook and connector request integrity.', implementationTheory: 'Sign canonical payloads and verify before processing.', priority: 'implemented', privacyCritical: true },
  { no: 47, category: 'secure-authenticated-communication', technology: 'Rate Limiting', addressApplication: 'Prevent address harvesting and abuse.', implementationTheory: 'Apply to lookup, QR verify, postal lookup, auth, and webhooks.', priority: 'implemented', privacyCritical: true },
  { no: 48, category: 'secure-authenticated-communication', technology: 'WAF', addressApplication: 'Protect address forms and APIs.', implementationTheory: 'Reject injection, SSRF, prompt injection, and oversized payloads.', priority: 'planned', privacyCritical: true },
  { no: 49, category: 'secure-authenticated-communication', technology: 'Zero Trust Network', addressApplication: 'Always verify internal and external address access.', implementationTheory: 'Check role, scope, device, purpose, and audit on every operation.', priority: 'partial', privacyCritical: true },
  { no: 50, category: 'secure-authenticated-communication', technology: 'End-to-End Encryption', addressApplication: 'Let only recipient and authorized carrier decrypt destination details.', implementationTheory: 'Merchant sees eligibility and receipt; carrier receives scoped encrypted payload.', priority: 'planned', privacyCritical: true },
];

const FORBIDDEN_PUBLIC_KEYS = [
  'address',
  'addressText',
  'recipient',
  'phone',
  'email',
  'room',
  'unit',
  'latitude',
  'longitude',
  'coordinates',
  'agidSecureCiphertext',
  'witness',
  'privateKey',
  'secret',
];

const THREAT_MODELS: Record<number, AddressCommunicationThreatModel> = {
  3: {
    techniqueNo: 3,
    boundary: 'research-only',
    misuseCases: [
      'Treating a globally routable address-like number as a public unit-level destination.',
      'Encoding building, room, or person-level data in a stable identifier.',
      'Confusing network reachability with legal, postal, or carrier reachability.',
    ],
    mitigations: [
      'Use IPv6 only as address-space design inspiration.',
      'Keep public routing at AGID, alias, commitment, or zone granularity.',
      'Require AOID or carrier authorization before any private destination disclosure.',
    ],
    releaseCondition: 'IPv6-inspired structures may document hierarchy, but must not ship as a public person/building/unit identifier.',
  },
  13: {
    techniqueNo: 13,
    boundary: 'connector',
    misuseCases: [
      'Using flexible queries to infer hidden address fields by requesting many small attributes.',
      'Leaving schema introspection, nested joins, or broad filters enabled in production.',
      'Returning raw address fields from a resolver that was meant to expose only refs or eligibility.',
    ],
    mitigations: [
      'Keep REST as the core public API and expose GraphQL only as an optional connector profile.',
      'Require field-level scopes, depth limits, persisted queries, and production introspection controls.',
      'Route every resolver through the no-raw envelope and return aliases, commitments, receipts, or coarse status by default.',
    ],
    releaseCondition: 'GraphQL can ship only as a connector after field-scope, depth-limit, persisted-query, and no-raw resolver tests pass.',
  },
  17: {
    techniqueNo: 17,
    boundary: 'connector',
    misuseCases: [
      'Sending precise destination, recipient, or telemetry data from low-power devices with weak storage controls.',
      'Accepting replayed locker, beacon, or disaster-device packets as fresh delivery evidence.',
      'Treating an intermittent CoAP device as authoritative when the address state requires manual review.',
    ],
    mitigations: [
      'Use CoAP only for low-bandwidth connector profiles such as lockers, beacons, rural sync, and disaster devices.',
      'Require DTLS or OSCORE, nonce windows, short expiry, and device-key revocation.',
      'Limit payloads to coarse zone, device status, receipt refs, and manual-review state.',
    ],
    releaseCondition: 'CoAP can ship only after replay-window, device-revocation, expiry, and no-raw public payload fixtures pass.',
  },
  18: {
    techniqueNo: 18,
    boundary: 'connector',
    misuseCases: [
      'Turning temporary recipient-driver contact into persistent raw address, phone, or transcript storage.',
      'Leaking private address context through signaling, TURN logs, or unrestricted data channels.',
      'Reusing a session beyond the original delivery purpose and consent window.',
    ],
    mitigations: [
      'Use WebRTC only for temporary Address Portal contact and never as a source of record for addresses.',
      'Bind signaling to alias, commitment, purpose, expiry, and receipt refs rather than raw address data.',
      'Disable recording by default, minimize relay logs, and allow only consented data-channel message classes.',
    ],
    releaseCondition: 'WebRTC can ship only after consent-expiry, signaling-redaction, relay-log-minimization, and no-recording-default tests pass.',
  },
  19: {
    techniqueNo: 19,
    boundary: 'connector',
    misuseCases: [
      'Using masked calls as a side channel to reveal recipient phone numbers, rooms, or raw destination details.',
      'Keeping call transcripts, recordings, or dialed numbers beyond the delivery purpose.',
      'Allowing carrier or hotel staff to call outside the consent window or after revocation.',
    ],
    mitigations: [
      'Use SIP and VoIP only through a masked-call connector with alias, purpose, expiry, and receipt refs.',
      'Store consent, call status, and handoff receipt; do not store phone numbers or transcripts by default.',
      'Require revocation checks, role scope, and audit refs before every call attempt.',
    ],
    releaseCondition: 'SIP/VoIP can ship only after masked-call consent, expiry, revocation, and no-transcript-default tests pass.',
  },
  23: {
    techniqueNo: 23,
    boundary: 'connector',
    misuseCases: [
      'Streaming raw address updates into replayable logs or analytical topics.',
      'Joining event streams across merchants, carriers, and regions to reconstruct private movement or identity graphs.',
      'Retaining failed connector payloads in dead-letter topics without privacy scrubbing.',
    ],
    mitigations: [
      'Separate public event streams from encrypted private connector streams.',
      'Use commitments, receipts, policy hashes, and coarse status as public stream payloads.',
      'Require retention limits, consumer scope, replay controls, and dead-letter scrubbing for every topic.',
    ],
    releaseCondition: 'Kafka-style streams can ship only after topic classification, retention, consumer-scope, replay, and dead-letter scrub tests pass.',
  },
  34: {
    techniqueNo: 34,
    boundary: 'connector',
    misuseCases: [
      'Treating centimeter-level indoor proximity as a persistent room, person, or desk address.',
      'Logging exact UWB traces that reveal daily movement inside hotels, airports, warehouses, or homes.',
      'Using proximity proof as sole delivery proof when the destination still requires human confirmation.',
    ],
    mitigations: [
      'Use UWB only for ephemeral handoff zones, locker bays, dock doors, or reception counters.',
      'Quantize results to zone-level evidence and discard raw ranging traces after receipt creation.',
      'Require manual-review fallback whenever proximity confidence or authorization is incomplete.',
    ],
    releaseCondition: 'UWB can ship only after zone-quantization, raw-trace discard, authorization, and manual-review fallback tests pass.',
  },
  35: {
    techniqueNo: 35,
    boundary: 'connector',
    misuseCases: [
      'Using indoor RTT observations to infer a room, desk, shelf, or resident routine.',
      'Uploading access point identifiers or raw ranging samples that become a persistent indoor tracking graph.',
      'Treating Wi-Fi RTT as an address source of truth when the building or handoff policy is unverified.',
    ],
    mitigations: [
      'Use Wi-Fi RTT only for local indoor guidance to a reception area, pickup shelf, or handoff zone.',
      'Keep raw access point and ranging data on device; transmit only zone-level confidence and receipt refs.',
      'Require building policy, purpose scope, expiry, and manual-review fallback before connector use.',
    ],
    releaseCondition: 'Wi-Fi RTT can ship only after local-only ranging, zone-level export, access-point redaction, and manual-review fallback tests pass.',
  },
  37: {
    techniqueNo: 37,
    boundary: 'connector',
    misuseCases: [
      'Replacing verified addresses with coarse cellular area estimates in high-risk deliveries.',
      'Combining repeated cell observations into a movement or residence inference profile.',
      'Leaking carrier, tower, or timing metadata through logs, analytics, or debug payloads.',
    ],
    mitigations: [
      'Use cellular positioning only as a coarse fallback signal when GNSS or postal data is weak.',
      'Never promote cellular estimates to verified address status without independent evidence.',
      'Quantize to broad area, minimize carrier metadata, and keep confidence and manual-review state visible.',
    ],
    releaseCondition: 'Cellular positioning can ship only after coarse-area quantization, metadata minimization, confidence labeling, and no-verified-upgrade tests pass.',
  },
  38: {
    techniqueNo: 38,
    boundary: 'connector',
    misuseCases: [
      'Using low-latency 5G telemetry as a precise live address or route-tracking feed.',
      'Exposing drone, robot, vehicle, or locker telemetry that reveals private destination context.',
      'Optimizing for speed while bypassing purpose scope, consent expiry, or handoff authorization.',
    ],
    mitigations: [
      'Use 5G for reachability, safety state, queue sync, and receipt exchange rather than raw telemetry sharing.',
      'Export coarse handoff readiness and constraint status, not continuous precise tracks by default.',
      'Keep consent, policy expiry, and no-raw connector gates in the fast path.',
    ],
    releaseCondition: '5G connector flows can ship only after telemetry minimization, consent-expiry, safety-state, and no-raw fast-path tests pass.',
  },
  39: {
    techniqueNo: 39,
    boundary: 'connector',
    misuseCases: [
      'Turning rural, island, or mountain beacons into long-lived household or route trackers.',
      'Sending raw coordinates, recipient state, or delivery notes over tiny unauthenticated uplinks.',
      'Accepting delayed or replayed LPWA packets as fresh handoff evidence.',
    ],
    mitigations: [
      'Use LPWA / LoRaWAN only for low-bandwidth AGID beacon, locker status, and receipt sync connector profiles.',
      'Rotate beacon aliases, use coarse region or cell refs, short validity windows, and uplink payload minimization.',
      'Require device attestation, replay windows, dead-letter review, and manual confirmation for delivery completion.',
    ],
    releaseCondition: 'LPWA / LoRaWAN can ship only after beacon rotation, coarse-region payload, replay-window, and manual-confirmation tests pass.',
  },
  40: {
    techniqueNo: 40,
    boundary: 'connector',
    misuseCases: [
      'Using satellite sync to reveal exact remote homes, vessels, camps, or disaster shelters.',
      'Buffering private address payloads in store-and-forward relays beyond policy expiry.',
      'Treating stale satellite receipts as current delivery or safety evidence.',
    ],
    mitigations: [
      'Use satellite communication for remote AGID sync, coarse region refs, manual-review state, and receipt exchange.',
      'Encrypt connector payloads end-to-end when disclosure is authorized; public payloads remain alias, commitment, and receipt only.',
      'Require expiry checks after delayed delivery, stale-evidence labeling, and no-store relay policy for private payloads.',
    ],
    releaseCondition: 'Satellite communication can ship only after coarse-region sync, store-and-forward expiry, stale-evidence labeling, and no-store relay tests pass.',
  },
};

const PRIORITY_SCORE: Record<AddressCommunicationPriority, number> = {
  implemented: 88,
  partial: 68,
  planned: 45,
  research: 25,
};

function qualityGrade(score: number): AddressCommunicationQualityGrade {
  if (score >= 85) return 'release-ready';
  if (score >= 65) return 'integration-ready';
  if (score >= 40) return 'draft';
  return 'research-only';
}

function nextImprovementFor(technique: AddressCommunicationTechnique, grade: AddressCommunicationQualityGrade) {
  if (grade === 'release-ready') {
    return `Keep ${technique.technology} covered by compatibility, no-raw payload, and release-gate tests.`;
  }
  if (grade === 'integration-ready') {
    return `Add a connector-safe ${technique.technology} fixture with retry, cache, scope, and receipt evidence.`;
  }
  if (grade === 'draft') {
    return `Define the ${technique.technology} envelope, allowed public fields, failure states, and manual-review fallback.`;
  }
  return `Write the ${technique.technology} threat model and decide whether it belongs in core, connector, or research-only scope.`;
}

function requiredEvidenceFor(technique: AddressCommunicationTechnique, grade: AddressCommunicationQualityGrade) {
  const base = ['no-raw public payload', 'purpose/scope/expiry policy', 'receipt or audit reference'];
  if (technique.privacyCritical) base.push('privacy threat model');
  if (grade !== 'release-ready') base.push('safe fixture before UI exposure');
  if (technique.priority === 'research' && !THREAT_MODELS[technique.no]) base.push('research boundary note');
  return base;
}

function recommendedGateFor(technique: AddressCommunicationTechnique) {
  if (technique.privacyCritical) return 'verify:no-raw-address-kit';
  if (technique.category === 'mobile-near-field') return 'verify:app-shell';
  if (technique.category === 'messaging-events') return 'verify:mandatory-security';
  return 'lint';
}

function clean(value: unknown) {
  return String(value ?? '').normalize('NFKC').trim();
}

function walkPublicPayload(value: unknown, path: string, errors: string[]) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkPublicPayload(item, `${path}[${index}]`, errors));
    return;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const normalizedKey = key.replace(/[-_\s]/g, '').toLowerCase();
    if (FORBIDDEN_PUBLIC_KEYS.some(forbidden => normalizedKey === forbidden.toLowerCase())) {
      errors.push(`public-payload-forbidden-field:${path}.${key}`);
    }
    walkPublicPayload(nested, `${path}.${key}`, errors);
  }
}

export function getAddressCommunicationTechniques(): AddressCommunicationTechnique[] {
  return TECHNIQUES.map(technique => ({ ...technique }));
}

export function getAddressCommunicationTechnique(no: number): AddressCommunicationTechnique {
  const technique = TECHNIQUES.find(item => item.no === no);
  if (!technique) throw new Error(`unknown-address-communication-technique:${no}`);
  return { ...technique };
}

export function summarizeAddressCommunicationEngineering() {
  const techniques = getAddressCommunicationTechniques();
  const byCategory = techniques.reduce<Record<AddressCommunicationCategory, number>>((summary, technique) => {
    summary[technique.category] += 1;
    return summary;
  }, {
    'network-foundation': 0,
    'protocol-design': 0,
    'messaging-events': 0,
    'mobile-near-field': 0,
    'secure-authenticated-communication': 0,
  });
  return {
    version: ADDRESS_COMMUNICATION_ENGINEERING_VERSION,
    total: techniques.length,
    privacyCritical: techniques.filter(technique => technique.privacyCritical).length,
    implemented: techniques.filter(technique => technique.priority === 'implemented').length,
    partial: techniques.filter(technique => technique.priority === 'partial').length,
    planned: techniques.filter(technique => technique.priority === 'planned').length,
    research: techniques.filter(technique => technique.priority === 'research').length,
    byCategory,
  };
}

export function assessAddressCommunicationTechnique(no: number): AddressCommunicationQualityReview {
  const technique = getAddressCommunicationTechnique(no);
  const threatModel = THREAT_MODELS[technique.no];
  const privacyBonus = technique.privacyCritical ? 0 : 4;
  const securityReadyBonus = ['TLS', 'MAC signature / HMAC', 'Rate Limiting', 'Webhook', 'QR code communication']
    .includes(technique.technology) ? 5 : 0;
  const threatModelBonus = threatModel ? 16 : 0;
  const score = Math.min(100, PRIORITY_SCORE[technique.priority] + privacyBonus + securityReadyBonus + threatModelBonus);
  const grade = qualityGrade(score);
  return {
    techniqueNo: technique.no,
    technology: technique.technology,
    grade,
    score,
    nextImprovement: nextImprovementFor(technique, grade),
    requiredEvidence: requiredEvidenceFor(technique, grade),
    recommendedGate: recommendedGateFor(technique),
    threatModel,
  };
}

export function createAddressCommunicationImprovementSignals(limit = 5): ImprovementSignal[] {
  return getAddressCommunicationTechniques()
    .map(technique => ({
      technique,
      review: assessAddressCommunicationTechnique(technique.no),
    }))
    .filter(item => item.review.grade !== 'release-ready')
    .sort((left, right) => {
      const scoreDiff = left.review.score - right.review.score;
      if (scoreDiff !== 0) return scoreDiff;
      return left.technique.no - right.technique.no;
    })
    .slice(0, Math.max(1, Math.min(50, Math.floor(limit))))
    .map(({ technique, review }) => ({
      id: `address-communication-${String(technique.no).padStart(2, '0')}`,
      area: technique.privacyCritical ? 'privacy' : 'reliability',
      severity: review.grade === 'research-only' ? 'medium' : 'low',
      confidence: Math.max(0.55, Math.min(0.95, review.score / 100)),
      title: review.nextImprovement,
      source: 'address-communication-engineering',
      compatibilityRisk: 'low',
    }));
}

export function createAddressCommunicationMessage(input: Omit<AddressCommunicationMessage, 'version'>): AddressCommunicationMessage {
  return {
    version: ADDRESS_COMMUNICATION_ENGINEERING_VERSION,
    sender: clean(input.sender),
    destination: {
      kind: input.destination.kind,
      ref: clean(input.destination.ref),
    },
    resolver: {
      kind: input.resolver.kind,
      ref: clean(input.resolver.ref),
    },
    policy: {
      purpose: clean(input.policy.purpose),
      scope: clean(input.policy.scope),
      expiresAt: clean(input.policy.expiresAt),
      retry: input.policy.retry,
      cache: input.policy.cache,
      disclosure: input.policy.disclosure,
    },
    evidence: { ...input.evidence },
    publicPayload: input.publicPayload ? { ...input.publicPayload } : undefined,
  };
}

export function validateAddressCommunicationMessage(message: AddressCommunicationMessage): AddressCommunicationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const expiresAt = new Date(message.policy.expiresAt);

  if (message.version !== ADDRESS_COMMUNICATION_ENGINEERING_VERSION) errors.push('unsupported-address-communication-version');
  if (!message.sender) errors.push('sender-required');
  if (!message.destination.ref) errors.push('destination-ref-required');
  if (!message.resolver.ref) errors.push('resolver-ref-required');
  if (!message.policy.purpose) errors.push('purpose-required');
  if (!message.policy.scope) errors.push('scope-required');
  if (!Number.isFinite(expiresAt.getTime())) errors.push('expiresAt-must-be-iso-date');
  if (message.policy.retry !== 'unsafe-denied' && message.policy.disclosure !== 'none') {
    errors.push('unsafe-retry-must-be-denied-when-disclosure-is-possible');
  }
  if (message.policy.disclosure === 'authorized-carrier-only' && message.destination.kind !== 'carrier') {
    errors.push('carrier-only-disclosure-requires-carrier-destination');
  }
  if (message.policy.cache !== 'no-store' && message.policy.disclosure !== 'none') {
    errors.push('disclosing-messages-must-use-no-store-cache');
  }
  if (!message.evidence.receiptRef && !message.evidence.commitmentRef && !message.evidence.auditRef) {
    warnings.push('communication-message-has-no-receipt-commitment-or-audit-ref');
  }
  if (message.publicPayload) walkPublicPayload(message.publicPayload, 'publicPayload', errors);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    model: 'resolve-authorize-minimize-handoff-receipt-audit',
    safeForPublicTransport: errors.length === 0 && message.policy.disclosure !== 'authorized-carrier-only',
  };
}
