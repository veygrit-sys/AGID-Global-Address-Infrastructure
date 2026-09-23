import {
  ADDRESS_OFFLINE_SYNC_CRDT_VERSION,
  applyAddressOfflineCrdtOperation,
  buildAddressOfflineSyncEnvelope,
  createAddressOfflineCrdtOperation,
  summarizeAddressOfflineCrdtState,
  type AddressOfflineSyncEnvelope,
} from './addressOfflineSyncCrdt';
import {
  createDeliveryReachabilityReport,
  validateDeliveryReachabilityReport,
  type DeliveryReachabilityReport,
} from './deliveryReachabilityReport';
import {
  FIELD_HANDOFF_APP_VERSION,
  buildFieldHandoffReceipt,
  createFieldReachabilityReport,
  normalizeFieldHandoffTask,
  type FieldHandoffReceipt,
  type FieldHandoffTask,
} from './fieldHandoff';
import { NO_RAW_ADDRESS_COMPLIANCE_KIT_VERSION } from './noRawAddressComplianceKit';
import {
  POS_OFFLINE_USAGE_LEDGER_VERSION,
  buildPosOfflineUsageSyncItems,
  normalizePosOfflineUsageEntries,
  summarizePosOfflineUsageLedger,
  type PosOfflineUsageLedgerEntry,
  type PosOfflineUsageSyncItem,
} from './posOfflineUsageLedger';

export const OFFLINE_FIELD_KIT_VERSION = 'agid-offline-field-kit-v0.1';

export type OfflineFieldKitMode =
  | 'local-only'
  | 'deferred-sync'
  | 'server-registry-when-online'
  | 'zk-ready-local-verification';

export type OfflineFieldKitSurface =
  | 'field-handoff'
  | 'pos-terminal'
  | 'ngo-aid-station'
  | 'warehouse-locker'
  | 'drone-reachability'
  | 'hotel-check-in'
  | 'registry-sync';

export type OfflineFieldKitFile = {
  path: string;
  role:
    | 'manifest'
    | 'kit'
    | 'runbooks'
    | 'fixtures'
    | 'checklists'
    | 'documentation';
  mediaType: 'application/json' | 'text/markdown';
  licenseOrTerms: 'Apache-2.0';
  containsPersonalData: false;
  containsRawAddressData: false;
  containsThirdPartyData: false;
};

export type OfflineFieldKitRunbook = {
  runbookId: string;
  surface: OfflineFieldKitSurface;
  label: string;
  defaultMode: OfflineFieldKitMode;
  primaryWorkflow: Array<
    | 'prepare'
    | 'scan'
    | 'decision'
    | 'handoff'
    | 'cannot-reach'
    | 'queue'
    | 'sync'
    | 'report'
  >;
  operatorActions: string[];
  requiredControls: string[];
  forbiddenStorage: string[];
  syncPolicy: string;
  fallbackPolicy: string;
};

export type OfflineFieldKitChecklist = {
  role:
    | 'field-operator'
    | 'pos-supervisor'
    | 'registry-operator'
    | 'security-reviewer'
    | 'humanitarian-coordinator';
  requiredActions: string[];
};

export type OfflineFieldKitFixture = {
  fixtureId: string;
  generatedAt: string;
  task: FieldHandoffTask;
  scanReceipt: FieldHandoffReceipt;
  reachabilityReceipt: FieldHandoffReceipt;
  crdtEnvelope: AddressOfflineSyncEnvelope;
  crdtSummary: ReturnType<typeof summarizeAddressOfflineCrdtState>;
  offlineLedger: PosOfflineUsageLedgerEntry[];
  offlineSyncItems: PosOfflineUsageSyncItem[];
  offlineLedgerSummary: ReturnType<typeof summarizePosOfflineUsageLedger>;
  reachabilityReport: DeliveryReachabilityReport;
};

export type OfflineFieldKitManifest = {
  kitId: 'offline-field-kit';
  version: typeof OFFLINE_FIELD_KIT_VERSION;
  fieldHandoffVersion: typeof FIELD_HANDOFF_APP_VERSION;
  crdtVersion: typeof ADDRESS_OFFLINE_SYNC_CRDT_VERSION;
  posOfflineLedgerVersion: typeof POS_OFFLINE_USAGE_LEDGER_VERSION;
  noRawAddressKitVersion: typeof NO_RAW_ADDRESS_COMPLIANCE_KIT_VERSION;
  generatedAt: string;
  licenseOrTerms: 'Apache-2.0';
  privacyPosition: string;
  files: OfflineFieldKitFile[];
  counts: {
    runbooks: number;
    surfaces: number;
    checklists: number;
    fixtures: number;
  };
};

export type OfflineFieldKit = {
  manifest: OfflineFieldKitManifest;
  modes: Array<{
    mode: OfflineFieldKitMode;
    label: string;
    useWhen: string[];
    tradeoffs: string[];
  }>;
  runbooks: OfflineFieldKitRunbook[];
  checklists: OfflineFieldKitChecklist[];
  fixtures: OfflineFieldKitFixture[];
  releaseRules: string[];
};

export type OfflineFieldKitValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const GENERATED_AT = '2026-06-20T00:00:00.000Z';

export const OFFLINE_FIELD_KIT_FILES: OfflineFieldKitFile[] = [
  {
    path: 'data/offline_field_kit/manifest.json',
    role: 'manifest',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
  {
    path: 'data/offline_field_kit/offline-field-kit.json',
    role: 'kit',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
  {
    path: 'data/offline_field_kit/runbooks.json',
    role: 'runbooks',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
  {
    path: 'data/offline_field_kit/fixtures.json',
    role: 'fixtures',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
  {
    path: 'data/offline_field_kit/checklists.json',
    role: 'checklists',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
  {
    path: 'data/offline_field_kit/README.md',
    role: 'documentation',
    mediaType: 'text/markdown',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
];

export const OFFLINE_FIELD_KIT_MODES: OfflineFieldKit['modes'] = [
  {
    mode: 'local-only',
    label: 'Local Only',
    useWhen: [
      'no network is available',
      'a field team needs immediate scan-to-decision behavior',
      'privacy or safety requires keeping records on the device',
    ],
    tradeoffs: [
      'no live revocation check',
      'local duplicate detection only',
      'operator must synchronize or export later',
    ],
  },
  {
    mode: 'deferred-sync',
    label: 'Deferred Sync',
    useWhen: [
      'field work continues offline but later registry reconciliation is required',
      'humanitarian, locker, or delivery teams need signed local receipts',
      'nullifier collisions must become review cases instead of silent overwrites',
    ],
    tradeoffs: [
      'server truth is delayed',
      'conflicts may need manual review',
      'local device integrity matters',
    ],
  },
  {
    mode: 'server-registry-when-online',
    label: 'Server Registry When Online',
    useWhen: [
      'low-cost online checks are acceptable',
      'revocation, freshness, used-state, and issuer status need quick confirmation',
      'Ethereum or ZK are unnecessary for the current risk level',
    ],
    tradeoffs: [
      'operator trusts the registry server',
      'metadata minimization and webhook signing are still required',
    ],
  },
  {
    mode: 'zk-ready-local-verification',
    label: 'ZK-ready Local Verification',
    useWhen: [
      'a proof can be verified locally without a public chain',
      'address facts must be checked without exposing the underlying address',
      'gas fees, latency, or public metadata are unacceptable',
    ],
    tradeoffs: [
      'proof generation may be heavy',
      'public auditability depends on later anchoring or signed export',
    ],
  },
];

export const OFFLINE_FIELD_KIT_RUNBOOKS: OfflineFieldKitRunbook[] = [
  {
    runbookId: 'ofk-field-handoff-scan-decision-report',
    surface: 'field-handoff',
    label: 'Field Handoff: Scan -> Decision -> Handoff -> Report',
    defaultMode: 'deferred-sync',
    primaryWorkflow: ['prepare', 'scan', 'decision', 'handoff', 'queue', 'sync', 'report'],
    operatorActions: [
      'confirm device clock and operator session',
      'scan QR or NFC alias',
      'show only decision state and safe reason codes',
      'request recipient proof when required',
      'sign local receipt and queue sync item',
      'mark conflict as review-required if reconciliation fails',
    ],
    requiredControls: [
      'terminal signature',
      'offline queue reference',
      'short alias for stop or waybill',
      'AGID-S QR/NFC intake summary without raw payload persistence',
      'recipient proof secret is never stored',
      'high-risk mode redacts precise AGID and address history',
    ],
    forbiddenStorage: [
      'raw address text',
      'raw AGID in high-risk mode',
      'AOID body',
      'recipient name',
      'phone number',
      'proof code or proof secret',
      'QR or NFC raw payload',
    ],
    syncPolicy: 'Queue signed receipts and nullifier sync items locally, then reconcile as accepted, conflict, or audit-required.',
    fallbackPolicy: 'If the scan cannot be accepted, record a safe cannot-reach reason and open a review case.',
  },
  {
    runbookId: 'ofk-ngo-aid-local-station',
    surface: 'ngo-aid-station',
    label: 'NGO Aid Station: Offline Eligibility and Used-state Capture',
    defaultMode: 'local-only',
    primaryWorkflow: ['prepare', 'scan', 'decision', 'queue', 'sync', 'report'],
    operatorActions: [
      'load signed issuer and area roots before deployment',
      'accept local proof verification or credential status cache',
      'record only nullifier and aid-event alias',
      'use deferred sync when network returns',
    ],
    requiredControls: [
      'local issuer cache expiry',
      'aid-event domain separation',
      'AGID-S or local proof transport for high-risk area eligibility',
      'no household-level public zone',
      'recipient proof code is not retained',
    ],
    forbiddenStorage: [
      'precise refuge location',
      'recipient identity',
      'raw address evidence',
      'proof witness',
    ],
    syncPolicy: 'Batch nullifiers and receipt roots; conflicts become audit-required rather than public accusation.',
    fallbackPolicy: 'If issuer cache is stale, continue only in local provisional mode and require supervisor review.',
  },
  {
    runbookId: 'ofk-warehouse-locker-local-control',
    surface: 'warehouse-locker',
    label: 'Warehouse / Locker: Local Control with Later Registry Sync',
    defaultMode: 'server-registry-when-online',
    primaryWorkflow: ['prepare', 'scan', 'decision', 'handoff', 'queue', 'sync', 'report'],
    operatorActions: [
      'bind locker bay alias to a short-lived handoff receipt',
      'open bay only after QR, NFC, PIN, passkey, or local proof passes',
      'sign device event before queueing',
      'keep Modbus/MQTT/HTTP simulator events address-free',
    ],
    requiredControls: [
      'locker bay alias',
      'device event signature',
      'QR/NFC reader emits alias, proof status, and receipt only',
      'used-state sync item',
      'local open/close receipt',
    ],
    forbiddenStorage: [
      'raw destination address',
      'full waybill identifier',
      'recipient private credential',
      'precise high-risk delivery location',
    ],
    syncPolicy: 'Sync used-state, device health, and signed event roots; never sync full locker access payloads.',
    fallbackPolicy: 'If bay state and server state diverge, freeze the bay and create a review case.',
  },
  {
    runbookId: 'ofk-drone-reachability-report',
    surface: 'drone-reachability',
    label: 'Drone Reachability: Feasibility Report, Not Drone OS',
    defaultMode: 'deferred-sync',
    primaryWorkflow: ['prepare', 'decision', 'cannot-reach', 'queue', 'sync', 'report'],
    operatorActions: [
      'classify route feasibility using safe reachability categories',
      'store precise telemetry only in encrypted local or evidence vault storage',
      'publish only coarse cells and public-safe categories',
      'restrict no-fly, landing-impossible, and high-risk telemetry',
    ],
    requiredControls: [
      'coarse cell projection',
      'restricted evidence commitment',
      'device event signature',
      'offline report queue',
      'device attestation reference',
      'TTL on public reachability warning',
    ],
    forbiddenStorage: [
      'precise route telemetry in public feed',
      'raw address or AOID in reachability feed',
      'operator identity in public feed',
    ],
    syncPolicy: 'Sync public-safe reachability feed items separately from restricted evidence commitments.',
    fallbackPolicy: 'If safety classification is uncertain, keep the report restricted and require manual review.',
  },
  {
    runbookId: 'ofk-hotel-check-in-address-transfer',
    surface: 'hotel-check-in',
    label: 'Hotel Check-in: QR Address Transfer without Persistent Raw Storage',
    defaultMode: 'local-only',
    primaryWorkflow: ['prepare', 'scan', 'decision', 'queue', 'report'],
    operatorActions: [
      'scan traveler QR or NFC address envelope',
      'let the guest approve only required hotel fields',
      'store check-in receipt and consent scope rather than reusable address payload',
      'export a redacted receipt for audit',
    ],
    requiredControls: [
      'explicit consent scope',
      'short-lived hotel alias',
      'local redaction before export',
      'guest can revoke or delete later',
    ],
    forbiddenStorage: [
      'reusable address QR payload',
      'passport or travel document image in public logs',
      'phone number in receipt export',
    ],
    syncPolicy: 'Sync only consent receipt, alias, and retention policy when the hotel back office is online.',
    fallbackPolicy: 'If consent cannot be confirmed, fall back to manual entry without retaining scan payload.',
  },
  {
    runbookId: 'ofk-registry-reconciliation',
    surface: 'registry-sync',
    label: 'Registry Reconciliation: Conflict-safe Offline Sync',
    defaultMode: 'deferred-sync',
    primaryWorkflow: ['queue', 'sync', 'decision', 'report'],
    operatorActions: [
      'submit CRDT envelope and nullifier sync items',
      'accept server used-state response',
      'mark conflicts as audit-required',
      'return redacted reconciliation report to device',
    ],
    requiredControls: [
      'offline queue reconciliation decision',
      'CRDT vector clock',
      'commitment-only sensitive fields',
      'nullifier replay check',
      'redacted audit outcome',
    ],
    forbiddenStorage: [
      'raw address in registry',
      'full QR/NFC payload in webhook',
      'proof witness in server log',
    ],
    syncPolicy: 'Server may accept, reject, or conflict each item; client must preserve local receipt history.',
    fallbackPolicy: 'If registry is unreachable, keep queue append-only and surface stale sync state to operator.',
  },
];

export const OFFLINE_FIELD_KIT_CHECKLISTS: OfflineFieldKitChecklist[] = [
  {
    role: 'field-operator',
    requiredActions: [
      'Confirm the device is in the intended mode before scanning.',
      'Use safe categories for cannot-reach reports.',
      'Do not type private address details into notes.',
      'Sync or export queued receipts before handing the device to another team.',
    ],
  },
  {
    role: 'pos-supervisor',
    requiredActions: [
      'Check printer, NFC, QR, cash drawer, and measuring device diagnostics before shift start.',
      'Review offline queue length and sync freshness.',
      'Require recipient proof for high-risk or high-value handoffs.',
      'Treat duplicate nullifiers as review-required.',
    ],
  },
  {
    role: 'registry-operator',
    requiredActions: [
      'Accept commitments, nullifiers, roots, aliases, and receipt fingerprints only.',
      'Reject raw address, QR payload, proof witness, private credential, or precise high-risk coordinates.',
      'Return conflict reasons as safe codes.',
      'Keep webhook payloads signed and redacted.',
    ],
  },
  {
    role: 'security-reviewer',
    requiredActions: [
      'Run no-raw-address release tests on generated docs and fixtures.',
      'Inspect receipts for terminal signature and offline queue reference.',
      'Confirm high-risk mode avoids precise public location.',
      'Verify local-only and Ethereum-optional positioning remains visible.',
    ],
  },
  {
    role: 'humanitarian-coordinator',
    requiredActions: [
      'Prefer coarse AGID-S or local proof modes for refuge, DV, disaster, and displacement contexts.',
      'Set short TTLs and immediate post-use revocation for sensitive vouchers.',
      'Avoid public maps of active safe locations.',
      'Use aggregated reachability only when it cannot expose individuals or shelters.',
    ],
  },
];

export const OFFLINE_FIELD_KIT_RELEASE_RULES = [
  'Local-first is the default; server, ZK, and Ethereum modes are optional overlays.',
  'Public artifacts use aliases, commitments, roots, nullifiers, fingerprints, and safe categories.',
  'Raw address, full AGID in high-risk contexts, AOID body, proof secret, witness, recipient identity, phone number, QR/NFC payload, and private key material must not be stored in public logs or fixtures.',
  'AGID-S QR/NFC intake is summarized as channel, key id, envelope fingerprint, proof status, and required controls; the encrypted token and decrypted AGID stay local.',
  'Offline conflicts are review-required; never overwrite or silently accept duplicate nullifiers.',
  'Reachability reports publish only public-safe, coarse categories; high-risk evidence remains local or encrypted.',
];

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, nested]) => nested !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
    .join(',')}}`;
}

function createOfflineFixture(generatedAt: string): OfflineFieldKitFixture {
  const task = normalizeFieldHandoffTask({
    taskId: 'FHT-OFFLINE-KIT-001',
    stopAlias: 'STOP-ALIAS-001',
    status: 'assigned',
    priority: 'high',
    routeName: 'Field Route Alpha',
    operatorId: 'field-operator-alpha',
    terminalId: 'FIELD-TERM-ALPHA',
    highRiskMode: true,
    offlineMode: true,
    createdAt: generatedAt,
    updatedAt: generatedAt,
  }, generatedAt);

  const scanReceipt = buildFieldHandoffReceipt({
    task,
    status: 'recipient_pending',
    action: 'arrived',
    now: generatedAt,
    proofMethod: 'presence-only',
    warnings: ['offline-scan-fixture-uses-short-alias-only'],
  });

  const reachability = createFieldReachabilityReport({
    task: {
      ...task,
      status: 'arrived',
    },
    reason: 'weather-or-disaster',
    note: 'temporary access blocked; safe category only',
    now: generatedAt,
  });

  const operation = createAddressOfflineCrdtOperation({
    actorId: 'field-operator-alpha',
    deviceId: 'FIELD-TERM-ALPHA',
    entityId: 'field-task:FHT-OFFLINE-KIT-001',
    entityKind: 'shipping-label',
    domain: 'offline-field-kit:handoff',
    action: 'upsert-field',
    field: 'handoffState',
    publicValue: 'cannot_reach',
    now: generatedAt,
  });
  const crdtState = applyAddressOfflineCrdtOperation(undefined, operation);
  const crdtEnvelope = buildAddressOfflineSyncEnvelope(crdtState);
  const crdtSummary = summarizeAddressOfflineCrdtState(crdtState);

  const offlineLedger = normalizePosOfflineUsageEntries([
    {
      nullifier: 'SLN-AABBCCDDEEFF00112233',
      receiptId: reachability.receipt.receiptId,
      waybillAlias: 'WBA-AABBCCDDEEFF',
      addressReferenceCommitment: 'addr_commitment_offline_field_alpha',
      terminalId: task.terminalId,
      operatorId: task.operatorId,
      createdAt: generatedAt,
      updatedAt: generatedAt,
      syncStatus: 'pending-sync',
    },
  ]);
  const offlineSyncItems = buildPosOfflineUsageSyncItems(offlineLedger);
  const offlineLedgerSummary = summarizePosOfflineUsageLedger(offlineLedger);

  const reachabilityReport = createDeliveryReachabilityReport({
    problemKind: 'road-closed',
    severity: 'blocker',
    reporterType: 'ngo',
    reporterTrusted: true,
    reporterCredentialRef: 'issuer_ref_ngo_alpha',
    coarseAgid: 'JP05AV8T*',
    countryCode: 'JP',
    regionCode: 'JP-TYO-COARSE',
    publicNote: 'Temporary access issue reported by a verified field operator.',
    highRiskMode: true,
    evidence: [
      {
        kind: 'operator-note',
        signed: true,
        redacted: true,
        sourceRef: 'field-receipt-root-alpha',
      },
    ],
    timeWindow: {
      observedAt: generatedAt,
      expectedDuration: 'hours',
    },
    sourceDomain: 'offline-field-kit',
    now: generatedAt,
  });

  return {
    fixtureId: 'offline-field-kit-synthetic-field-run-v1',
    generatedAt,
    task,
    scanReceipt,
    reachabilityReceipt: reachability.receipt,
    crdtEnvelope,
    crdtSummary,
    offlineLedger,
    offlineSyncItems,
    offlineLedgerSummary,
    reachabilityReport,
  };
}

function createManifest(generatedAt: string): OfflineFieldKitManifest {
  return {
    kitId: 'offline-field-kit',
    version: OFFLINE_FIELD_KIT_VERSION,
    fieldHandoffVersion: FIELD_HANDOFF_APP_VERSION,
    crdtVersion: ADDRESS_OFFLINE_SYNC_CRDT_VERSION,
    posOfflineLedgerVersion: POS_OFFLINE_USAGE_LEDGER_VERSION,
    noRawAddressKitVersion: NO_RAW_ADDRESS_COMPLIANCE_KIT_VERSION,
    generatedAt,
    licenseOrTerms: 'Apache-2.0',
    privacyPosition: 'Offline Field Kit is local-first and no-raw-address by default: field devices may create signed receipts, reachability reports, CRDT sync envelopes, and nullifier used-state items without publishing raw address, AOID body, recipient identity, proof secret, or QR/NFC payload material.',
    files: OFFLINE_FIELD_KIT_FILES.map(file => ({ ...file })),
    counts: {
      runbooks: OFFLINE_FIELD_KIT_RUNBOOKS.length,
      surfaces: new Set(OFFLINE_FIELD_KIT_RUNBOOKS.map(runbook => runbook.surface)).size,
      checklists: OFFLINE_FIELD_KIT_CHECKLISTS.length,
      fixtures: 1,
    },
  };
}

export function buildOfflineFieldKit(input: {
  generatedAt?: string;
} = {}): OfflineFieldKit {
  const generatedAt = input.generatedAt || GENERATED_AT;
  return {
    manifest: createManifest(generatedAt),
    modes: OFFLINE_FIELD_KIT_MODES.map(mode => ({
      ...mode,
      useWhen: [...mode.useWhen],
      tradeoffs: [...mode.tradeoffs],
    })),
    runbooks: OFFLINE_FIELD_KIT_RUNBOOKS.map(runbook => ({
      ...runbook,
      primaryWorkflow: [...runbook.primaryWorkflow],
      operatorActions: [...runbook.operatorActions],
      requiredControls: [...runbook.requiredControls],
      forbiddenStorage: [...runbook.forbiddenStorage],
    })),
    checklists: OFFLINE_FIELD_KIT_CHECKLISTS.map(checklist => ({
      ...checklist,
      requiredActions: [...checklist.requiredActions],
    })),
    fixtures: [createOfflineFixture(generatedAt)],
    releaseRules: [...OFFLINE_FIELD_KIT_RELEASE_RULES],
  };
}

function collectStringValues(value: unknown, output: string[] = []) {
  if (typeof value === 'string') {
    output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStringValues(item, output);
    return output;
  }
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) collectStringValues(nested, output);
  }
  return output;
}

function containsForbiddenRawText(value: unknown) {
  const text = collectStringValues(value).join('\n').toLowerCase();
  const forbidden = [
    'raw address text',
    'raw agid',
    'raw aoid',
    'recipientname',
    'phone number',
    'proof secret',
    'qr raw payload',
    'nfc raw payload',
  ];
  return forbidden.some(term => text.includes(term));
}

function validatePrivacyFlags(fixture: OfflineFieldKitFixture, errors: string[]) {
  if (fixture.scanReceipt.privacy.rawAddressStored !== false) errors.push('scan-receipt-raw-address-stored');
  if (fixture.scanReceipt.privacy.rawAgidStored !== false) errors.push('scan-receipt-raw-agid-stored');
  if (fixture.scanReceipt.privacy.rawAoidStored !== false) errors.push('scan-receipt-raw-aoid-stored');
  if (fixture.scanReceipt.privacy.proofSecretStored !== false) errors.push('scan-receipt-proof-secret-stored');
  if (fixture.reachabilityReceipt.privacy.preciseLocationStored !== false) errors.push('reachability-precise-location-stored');
  if (fixture.crdtEnvelope.privacy.rawAddressStored !== false) errors.push('crdt-raw-address-stored');
  if (fixture.crdtEnvelope.privacy.rawAoidStored !== false) errors.push('crdt-raw-aoid-stored');
  if (fixture.offlineLedgerSummary.rawAddressStored !== false) errors.push('ledger-raw-address-stored');
  if (fixture.offlineLedgerSummary.rawProofStored !== false) errors.push('ledger-raw-proof-stored');
  if (fixture.reachabilityReport.privacy.publicContainsRawAddress !== false) errors.push('reachability-public-raw-address');
  if (fixture.reachabilityReport.privacy.publicContainsPreciseCoordinates !== false) {
    errors.push('reachability-public-precise-coordinates');
  }
}

export function validateOfflineFieldKit(
  kit = buildOfflineFieldKit(),
): OfflineFieldKitValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (kit.manifest.version !== OFFLINE_FIELD_KIT_VERSION) errors.push('version-mismatch');
  if (kit.manifest.fieldHandoffVersion !== FIELD_HANDOFF_APP_VERSION) errors.push('field-handoff-version-mismatch');
  if (kit.manifest.crdtVersion !== ADDRESS_OFFLINE_SYNC_CRDT_VERSION) errors.push('crdt-version-mismatch');
  if (kit.manifest.posOfflineLedgerVersion !== POS_OFFLINE_USAGE_LEDGER_VERSION) {
    errors.push('pos-offline-ledger-version-mismatch');
  }
  if (kit.manifest.counts.runbooks !== kit.runbooks.length) errors.push('runbook-count-mismatch');
  if (kit.manifest.counts.checklists !== kit.checklists.length) errors.push('checklist-count-mismatch');
  if (kit.manifest.counts.fixtures !== kit.fixtures.length) errors.push('fixture-count-mismatch');

  for (const file of kit.manifest.files) {
    if (file.containsPersonalData !== false) errors.push(`file-personal-data-not-false:${file.path}`);
    if (file.containsRawAddressData !== false) errors.push(`file-raw-address-data-not-false:${file.path}`);
    if (file.containsThirdPartyData !== false) errors.push(`file-third-party-data-not-false:${file.path}`);
  }

  const runbookIds = new Set<string>();
  for (const runbook of kit.runbooks) {
    if (runbookIds.has(runbook.runbookId)) errors.push(`duplicate-runbook:${runbook.runbookId}`);
    runbookIds.add(runbook.runbookId);
    if (!runbook.primaryWorkflow.includes('decision')) errors.push(`runbook-missing-decision:${runbook.runbookId}`);
    if (!runbook.requiredControls.some(control => /signature|proof|alias|queue/i.test(control))) {
      errors.push(`runbook-missing-operational-control:${runbook.runbookId}`);
    }
    if (
      ['field-handoff', 'ngo-aid-station', 'warehouse-locker'].includes(runbook.surface)
      && !runbook.requiredControls.some(control => /AGID-S|QR\/NFC|proof transport/i.test(control))
    ) {
      errors.push(`runbook-missing-secure-scan-control:${runbook.runbookId}`);
    }
    if (!runbook.forbiddenStorage.some(item => /raw|proof|recipient|payload/i.test(item))) {
      errors.push(`runbook-missing-forbidden-storage:${runbook.runbookId}`);
    }
  }

  if (!kit.runbooks.some(runbook => runbook.surface === 'field-handoff')) errors.push('missing-field-handoff-runbook');
  if (!kit.runbooks.some(runbook => runbook.surface === 'warehouse-locker')) errors.push('missing-locker-runbook');
  if (!kit.runbooks.some(runbook => runbook.surface === 'drone-reachability')) errors.push('missing-drone-runbook');
  if (!kit.modes.some(mode => mode.mode === 'local-only')) errors.push('missing-local-only-mode');
  if (!kit.modes.some(mode => mode.mode === 'deferred-sync')) errors.push('missing-deferred-sync-mode');

  for (const fixture of kit.fixtures) {
    validatePrivacyFlags(fixture, errors);
    if (fixture.scanReceipt.syncState !== 'queued') errors.push(`fixture-scan-not-queued:${fixture.fixtureId}`);
    if (fixture.reachabilityReceipt.syncState !== 'queued') errors.push(`fixture-reachability-not-queued:${fixture.fixtureId}`);
    if (fixture.offlineLedgerSummary.pendingSync < 1) errors.push(`fixture-missing-pending-nullifier:${fixture.fixtureId}`);
    if (fixture.offlineSyncItems.length !== fixture.offlineLedgerSummary.pendingSync) {
      errors.push(`fixture-sync-item-count-mismatch:${fixture.fixtureId}`);
    }
    const reachabilityValidation = validateDeliveryReachabilityReport(fixture.reachabilityReport);
    if (!reachabilityValidation.valid) {
      errors.push(`fixture-reachability-invalid:${fixture.fixtureId}:${reachabilityValidation.errors.join('|')}`);
    }
    if (containsForbiddenRawText({
      scanReceipt: fixture.scanReceipt,
      reachabilityReceipt: fixture.reachabilityReceipt,
      crdtEnvelope: fixture.crdtEnvelope,
      offlineLedgerSummary: fixture.offlineLedgerSummary,
      reachabilityPublicProjection: fixture.reachabilityReport.publicProjection,
    })) {
      errors.push(`fixture-public-material-contains-forbidden-raw-text:${fixture.fixtureId}`);
    }
  }

  if (!kit.releaseRules.some(rule => /Local-first/i.test(rule))) warnings.push('missing-local-first-release-rule');
  if (!kit.releaseRules.some(rule => /Ethereum/i.test(rule))) warnings.push('missing-ethereum-optional-release-rule');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
