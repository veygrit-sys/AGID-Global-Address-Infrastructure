import {
  evaluateMandatorySecurityReleaseGate,
  type MandatorySecurityReleaseGateResult,
} from './securityMandatoryReleaseGate';
import {
  separatePublicPrivatePayload,
  validatePublicPayloadSeparation,
  type PublicPrivateSeparationResult,
} from './publicPrivateSeparation';
import {
  addSecondsToIso,
  cleanBoolean,
  cleanText,
  stableCommitment,
  stableId,
  toIsoTimestamp,
} from './redactedWorkflowCore';

export const SETTINGS_POLICY_CENTER_VERSION = 'agid-settings-policy-center-v1';

export type SettingsPolicyMode =
  | 'local-only'
  | 'server-registry'
  | 'zk-only'
  | 'ethereum-registry'
  | 'full-zk-ethereum';

export type SettingsPolicyProviderId =
  | 'hosted-registry'
  | 'zk-prover'
  | 'ethereum-l2'
  | 'notification'
  | 'evidence-vault'
  | 'carrier-api'
  | 'address-dns'
  | 'cloud-adapter';

export type SettingsPolicyDeviceId =
  | 'qr-camera'
  | 'web-nfc'
  | 'printer'
  | 'cash-drawer'
  | 'barcode-reader'
  | 'measurement-device'
  | 'locker-mqtt'
  | 'locker-modbus';

export type SettingsPolicyDataCategory =
  | 'commitment'
  | 'nullifier'
  | 'issuer-metadata'
  | 'revocation-status'
  | 'freshness-root'
  | 'safe-alias'
  | 'coarse-region'
  | 'redacted-receipt'
  | 'device-status'
  | 'raw-address'
  | 'raw-agid'
  | 'raw-aoid'
  | 'precise-location'
  | 'recipient-identity'
  | 'proof-secret';

export type SettingsPolicyProvider = {
  id: SettingsPolicyProviderId;
  enabled: boolean;
  displayName?: string;
  endpointRef?: string;
  outboundData: SettingsPolicyDataCategory[];
};

export type SettingsPolicyDeviceConnector = {
  id: SettingsPolicyDeviceId;
  enabled: boolean;
  localOnly: boolean;
  requiresOperatorApproval?: boolean;
};

export type SettingsPolicyInput = {
  mode: SettingsPolicyMode;
  language: string;
  highRiskMode?: boolean;
  localFirst?: boolean;
  ethereumOptional?: boolean;
  noRawAddressByDefault?: boolean;
  noAddressHistory?: boolean;
  agidSOnlyForHighRisk?: boolean;
  shortAliasTtlSeconds?: number;
  providers?: SettingsPolicyProvider[];
  devices?: SettingsPolicyDeviceConnector[];
  now?: string;
};

export type SettingsPolicyModeProfile = {
  mode: SettingsPolicyMode;
  label: string;
  zkRequired: boolean;
  ethereumRequired: boolean;
  serverRequired: boolean;
  gasCostRisk: 'none' | 'low' | 'medium' | 'high';
  offlineCapable: boolean;
  operatorSummary: string;
};

export type SettingsPolicyFindingSeverity = 'info' | 'warning' | 'error';

export type SettingsPolicyFinding = {
  severity: SettingsPolicyFindingSeverity;
  code: string;
  detail: string;
};

export type SettingsPolicyImpact = {
  localOnlyAvailable: boolean;
  externalDataFlowCount: number;
  enabledProviderCount: number;
  enabledDeviceCount: number;
  highRiskControlsFree: true;
  rawAddressLeavesDevice: false;
  rawAoidLeavesDevice: false;
  rawAgidLeavesDevice: boolean;
  proofSecretLeavesDevice: false;
  addressHistoryStored: boolean;
};

export type SettingsPolicyCenterSnapshot = {
  version: typeof SETTINGS_POLICY_CENTER_VERSION;
  createdAt: string;
  profile: SettingsPolicyModeProfile;
  input: {
    mode: SettingsPolicyMode;
    language: string;
    highRiskMode: boolean;
    localFirst: boolean;
    ethereumOptional: boolean;
    noRawAddressByDefault: boolean;
    noAddressHistory: boolean;
    agidSOnlyForHighRisk: boolean;
    shortAliasTtlSeconds: number;
  };
  providers: SettingsPolicyProvider[];
  devices: SettingsPolicyDeviceConnector[];
  findings: SettingsPolicyFinding[];
  blocked: boolean;
  recommendedNextActions: string[];
  impact: SettingsPolicyImpact;
  mandatorySecurityGate: MandatorySecurityReleaseGateResult;
  publicPrivatePreview: PublicPrivateSeparationResult;
  safeExport: Record<string, unknown>;
  policyFingerprint: string;
};

const FORBIDDEN_OUTBOUND_CATEGORIES = new Set<SettingsPolicyDataCategory>([
  'raw-address',
  'raw-agid',
  'raw-aoid',
  'precise-location',
  'recipient-identity',
  'proof-secret',
]);

const HIGH_RISK_FORBIDDEN_CATEGORIES = new Set<SettingsPolicyDataCategory>([
  'raw-address',
  'raw-agid',
  'raw-aoid',
  'precise-location',
  'recipient-identity',
  'proof-secret',
]);

export const DEFAULT_SETTINGS_POLICY_PROVIDERS: SettingsPolicyProvider[] = [
  {
    id: 'hosted-registry',
    enabled: false,
    displayName: 'Hosted Registry',
    endpointRef: 'registry.local',
    outboundData: ['commitment', 'nullifier', 'revocation-status', 'freshness-root'],
  },
  {
    id: 'zk-prover',
    enabled: false,
    displayName: 'ZK Prover',
    endpointRef: 'prover.local',
    outboundData: ['commitment', 'issuer-metadata', 'freshness-root'],
  },
  {
    id: 'ethereum-l2',
    enabled: false,
    displayName: 'Ethereum L2',
    endpointRef: 'chain-ref',
    outboundData: ['nullifier', 'revocation-status', 'freshness-root'],
  },
  {
    id: 'carrier-api',
    enabled: false,
    displayName: 'Carrier API',
    endpointRef: 'carrier-adapter',
    outboundData: ['safe-alias', 'redacted-receipt', 'coarse-region'],
  },
  {
    id: 'notification',
    enabled: false,
    displayName: 'Notification',
    endpointRef: 'notify-adapter',
    outboundData: ['safe-alias', 'redacted-receipt'],
  },
  {
    id: 'evidence-vault',
    enabled: false,
    displayName: 'Evidence Vault',
    endpointRef: 'vault-ref',
    outboundData: ['commitment', 'redacted-receipt'],
  },
];

export const DEFAULT_SETTINGS_POLICY_DEVICES: SettingsPolicyDeviceConnector[] = [
  { id: 'qr-camera', enabled: true, localOnly: true },
  { id: 'web-nfc', enabled: true, localOnly: true },
  { id: 'printer', enabled: false, localOnly: true, requiresOperatorApproval: true },
  { id: 'cash-drawer', enabled: false, localOnly: true, requiresOperatorApproval: true },
  { id: 'barcode-reader', enabled: false, localOnly: true },
  { id: 'measurement-device', enabled: false, localOnly: true, requiresOperatorApproval: true },
  { id: 'locker-mqtt', enabled: false, localOnly: true, requiresOperatorApproval: true },
  { id: 'locker-modbus', enabled: false, localOnly: true, requiresOperatorApproval: true },
];

export const SETTINGS_POLICY_MODE_PROFILES: Record<SettingsPolicyMode, SettingsPolicyModeProfile> = {
  'local-only': {
    mode: 'local-only',
    label: 'Mode 0: Local Only',
    zkRequired: false,
    ethereumRequired: false,
    serverRequired: false,
    gasCostRisk: 'none',
    offlineCapable: true,
    operatorSummary: 'Fast, free, offline-capable operation for POS, field handoff, and local verification.',
  },
  'server-registry': {
    mode: 'server-registry',
    label: 'Mode 1: Local + Server Registry',
    zkRequired: false,
    ethereumRequired: false,
    serverRequired: true,
    gasCostRisk: 'none',
    offlineCapable: false,
    operatorSummary: 'Fast registry checks for revocation, freshness, and used-state with operator-server trust.',
  },
  'zk-only': {
    mode: 'zk-only',
    label: 'Mode 2: ZK Only',
    zkRequired: true,
    ethereumRequired: false,
    serverRequired: false,
    gasCostRisk: 'none',
    offlineCapable: true,
    operatorSummary: 'Private predicate verification without gas costs; public auditability depends on local verifier logs.',
  },
  'ethereum-registry': {
    mode: 'ethereum-registry',
    label: 'Mode 3: Ethereum Registry Only',
    zkRequired: false,
    ethereumRequired: true,
    serverRequired: false,
    gasCostRisk: 'medium',
    offlineCapable: false,
    operatorSummary: 'Public issuer, revocation, nullifier, and payment checks without private address predicates.',
  },
  'full-zk-ethereum': {
    mode: 'full-zk-ethereum',
    label: 'Mode 4: Full ZK + Ethereum',
    zkRequired: true,
    ethereumRequired: true,
    serverRequired: false,
    gasCostRisk: 'high',
    offlineCapable: false,
    operatorSummary: 'Strongest privacy and public verification mode; highest latency, gas, and prover cost.',
  },
};

function cloneProvider(provider: SettingsPolicyProvider): SettingsPolicyProvider {
  return {
    ...provider,
    outboundData: [...provider.outboundData],
  };
}

function cloneDevice(device: SettingsPolicyDeviceConnector): SettingsPolicyDeviceConnector {
  return { ...device };
}

function normalizeProviders(providers: SettingsPolicyProvider[] | undefined) {
  const byId = new Map(DEFAULT_SETTINGS_POLICY_PROVIDERS.map(provider => [provider.id, cloneProvider(provider)]));
  for (const provider of providers ?? []) {
    const base = byId.get(provider.id);
    byId.set(provider.id, {
      ...base,
      ...provider,
      outboundData: [...provider.outboundData],
    });
  }
  return Array.from(byId.values());
}

function normalizeDevices(devices: SettingsPolicyDeviceConnector[] | undefined) {
  const byId = new Map(DEFAULT_SETTINGS_POLICY_DEVICES.map(device => [device.id, cloneDevice(device)]));
  for (const device of devices ?? []) {
    byId.set(device.id, {
      ...byId.get(device.id),
      ...device,
    });
  }
  return Array.from(byId.values());
}

function providerEnabled(providers: SettingsPolicyProvider[], id: SettingsPolicyProviderId) {
  return providers.some(provider => provider.id === id && provider.enabled);
}

function pushFinding(
  findings: SettingsPolicyFinding[],
  severity: SettingsPolicyFindingSeverity,
  code: string,
  detail: string,
) {
  findings.push({ severity, code, detail });
}

function mapModeToSeparationMode(mode: SettingsPolicyMode) {
  if (mode === 'local-only') return 'local-only';
  if (mode === 'server-registry') return 'server-registry';
  if (mode === 'zk-only') return 'zk-proof';
  if (mode === 'ethereum-registry') return 'ethereum-registry';
  return 'ethereum-registry';
}

function normalizeTtl(value: unknown, highRiskMode: boolean) {
  const number = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : undefined;
  const fallback = highRiskMode ? 240 : 600;
  return Math.max(60, Math.min(number ?? fallback, highRiskMode ? 300 : 900));
}

function buildSafeExport(input: {
  mode: SettingsPolicyMode;
  language: string;
  highRiskMode: boolean;
  localFirst: boolean;
  ethereumOptional: boolean;
  noRawAddressByDefault: boolean;
  noAddressHistory: boolean;
  agidSOnlyForHighRisk: boolean;
  shortAliasTtlSeconds: number;
  providers: SettingsPolicyProvider[];
  devices: SettingsPolicyDeviceConnector[];
  publicPrivatePreview: PublicPrivateSeparationResult;
  blocked: boolean;
}) {
  return {
    version: SETTINGS_POLICY_CENTER_VERSION,
    mode: input.mode,
    language: input.language,
    highRiskMode: input.highRiskMode,
    localFirst: input.localFirst,
    ethereumOptional: input.ethereumOptional,
    noRawAddressByDefault: input.noRawAddressByDefault,
    noAddressHistory: input.noAddressHistory,
    agidSOnlyForHighRisk: input.agidSOnlyForHighRisk,
    shortAliasTtlSeconds: input.shortAliasTtlSeconds,
    providers: input.providers.map(provider => ({
      id: provider.id,
      enabled: provider.enabled,
      endpointRef: provider.endpointRef,
      outboundData: provider.outboundData,
    })),
    devices: input.devices.map(device => ({
      id: device.id,
      enabled: device.enabled,
      localOnly: device.localOnly,
      requiresOperatorApproval: Boolean(device.requiresOperatorApproval),
    })),
    privacy: input.publicPrivatePreview.privacy,
    publicPayloadFingerprint: input.publicPrivatePreview.auditFingerprint,
    releaseBlocked: input.blocked,
  };
}

export function buildSettingsPolicyCenterSnapshot(input: SettingsPolicyInput): SettingsPolicyCenterSnapshot {
  const createdAt = toIsoTimestamp(input.now);
  const mode = input.mode ?? 'local-only';
  const profile = SETTINGS_POLICY_MODE_PROFILES[mode] ?? SETTINGS_POLICY_MODE_PROFILES['local-only'];
  const highRiskMode = cleanBoolean(input.highRiskMode, false);
  const shortAliasTtlSeconds = normalizeTtl(input.shortAliasTtlSeconds, highRiskMode);
  const language = cleanText(input.language, 'ja-JP', 32);
  const localFirst = cleanBoolean(input.localFirst, true);
  const ethereumOptional = cleanBoolean(input.ethereumOptional, true);
  const noRawAddressByDefault = cleanBoolean(input.noRawAddressByDefault, true);
  const noAddressHistory = cleanBoolean(input.noAddressHistory, highRiskMode);
  const agidSOnlyForHighRisk = cleanBoolean(input.agidSOnlyForHighRisk, highRiskMode);
  const providers = normalizeProviders(input.providers);
  const devices = normalizeDevices(input.devices);
  const findings: SettingsPolicyFinding[] = [];

  if (profile.serverRequired && !providerEnabled(providers, 'hosted-registry')) {
    pushFinding(findings, 'error', 'missing-server-registry', 'Mode 1 requires a registry provider for freshness, revocation, and used-state checks.');
  }
  if (profile.zkRequired && !providerEnabled(providers, 'zk-prover')) {
    pushFinding(findings, 'error', 'missing-zk-prover', 'This mode requires a ZK prover or local verifier adapter.');
  }
  if (profile.ethereumRequired && !providerEnabled(providers, 'ethereum-l2')) {
    pushFinding(findings, 'error', 'missing-ethereum-l2', 'This mode requires an Ethereum L2 registry adapter.');
  }
  if (!localFirst) {
    pushFinding(findings, 'warning', 'local-first-disabled', 'Local-first should remain enabled so POS and field use continue during network loss.');
  }
  if (!ethereumOptional && mode !== 'ethereum-registry' && mode !== 'full-zk-ethereum') {
    pushFinding(findings, 'warning', 'ethereum-not-optional', 'Ethereum should remain optional outside Ethereum registry modes.');
  }
  if (!noRawAddressByDefault) {
    pushFinding(findings, 'error', 'raw-address-default-disabled', 'No raw address by default must stay enabled for OSS and high-risk deployments.');
  }
  if (highRiskMode && !agidSOnlyForHighRisk) {
    pushFinding(findings, 'error', 'high-risk-must-use-agid-s', 'High-risk mode must share AGID-S or commitments, not public precise location references.');
  }
  if (highRiskMode && !noAddressHistory) {
    pushFinding(findings, 'error', 'high-risk-address-history-enabled', 'High-risk mode must avoid retaining address history by default.');
  }
  if (highRiskMode && shortAliasTtlSeconds > 300) {
    pushFinding(findings, 'error', 'high-risk-alias-ttl-too-long', 'High-risk aliases must expire within five minutes.');
  }

  for (const provider of providers.filter(item => item.enabled)) {
    const forbidden = provider.outboundData.filter(category => FORBIDDEN_OUTBOUND_CATEGORIES.has(category));
    if (forbidden.length > 0) {
      pushFinding(
        findings,
        'error',
        `provider-forbidden-data:${provider.id}`,
        `${provider.displayName ?? provider.id} is enabled with forbidden outbound categories: ${forbidden.join(', ')}.`,
      );
    }
    const highRiskForbidden = highRiskMode
      ? provider.outboundData.filter(category => HIGH_RISK_FORBIDDEN_CATEGORIES.has(category))
      : [];
    if (highRiskForbidden.length > 0) {
      pushFinding(
        findings,
        'error',
        `high-risk-provider-data:${provider.id}`,
        `${provider.displayName ?? provider.id} cannot receive sensitive categories in high-risk mode.`,
      );
    }
  }

  for (const device of devices.filter(item => item.enabled && !item.localOnly)) {
    pushFinding(
      findings,
      highRiskMode ? 'error' : 'warning',
      `device-not-local-only:${device.id}`,
      `${device.id} should be local-only unless a separate signed device policy exists.`,
    );
  }

  const aliasIssuedAt = createdAt;
  const aliasExpiresAt = addSecondsToIso(aliasIssuedAt, shortAliasTtlSeconds);
  const policyAlias = stableId('ALIAS', { mode, createdAt, language }, { length: 12 });
  const terminalSignature = stableId('SIG', { mode, language, createdAt }, { length: 32 });
  const auditEvent = {
    eventId: stableId('POLICY', { mode, createdAt, highRiskMode }, { length: 12 }),
    action: 'settings.policy.updated',
    mode,
    policyAlias,
    highRiskMode,
    redactedPolicyRef: stableCommitment('policy', { mode, language, highRiskMode }, { length: 16 }),
  };
  const mandatorySecurityGate = evaluateMandatorySecurityReleaseGate({
    releaseText: 'Policy center export uses commitments, short aliases, device refs, and redacted operational status.',
    highRiskMode,
    privacyPolicy: {
      noRawAddressByDefault,
      rawAddressStorage: false,
      publicPayloadUsesCommitments: true,
      purposeLimited: true,
      highRiskModeReviewed: highRiskMode,
      externalSharingReviewed: true,
      plaintextTransmissionAllowed: false,
      retentionDays: highRiskMode ? 7 : 30,
      maxRetentionDays: highRiskMode ? 7 : 30,
    },
    terminalSignature: {
      terminalId: 'SETTINGS-POLICY-CENTER',
      signature: terminalSignature,
      signedAt: createdAt,
      algorithm: 'ed25519-policy-receipt-v1',
    },
    alias: {
      value: policyAlias,
      issuedAt: aliasIssuedAt,
      expiresAt: aliasExpiresAt,
    },
    auditLog: {
      redactionApplied: true,
      redactionVersion: SETTINGS_POLICY_CENTER_VERSION,
      event: auditEvent,
    },
  });

  const publicPrivatePreview = separatePublicPrivatePayload({
    mode: mapModeToSeparationMode(mode),
    domain: `settings:${mode}`,
    salt: stableCommitment('settings-salt', { createdAt, mode, language }, { length: 24 }),
    now: createdAt,
    highRiskMode,
    allowPublicAgid: !highRiskMode && mode === 'local-only',
    payload: {
      language,
      mode,
      safeAlias: policyAlias,
      agid: 'ML01R1A0ZTR4',
      aoid: 'ABCDEFGHJKLMNPQ',
      rawAddress: 'private address sample kept out of public export',
      recipientName: 'private recipient sample',
      issuerStatus: 'active',
      policyCommitment: stableCommitment('policy', { mode, language, highRiskMode }),
      enabledProviders: providers.filter(provider => provider.enabled).map(provider => provider.id),
    },
  });
  const publicValidation = validatePublicPayloadSeparation(publicPrivatePreview.publicPayload);
  if (!publicValidation.valid) {
    pushFinding(findings, 'error', 'public-private-preview-invalid', publicValidation.errors.join('; '));
  }
  for (const warning of publicValidation.warnings) {
    pushFinding(findings, 'warning', 'public-private-preview-warning', warning);
  }
  if (publicPrivatePreview.blocked) {
    pushFinding(findings, 'error', 'public-private-preview-blocked', publicPrivatePreview.errors.join('; '));
  }
  if (!mandatorySecurityGate.valid) {
    pushFinding(findings, 'error', 'mandatory-security-gate-failed', mandatorySecurityGate.findings.map(item => item.code).join(', '));
  }

  const enabledProviders = providers.filter(provider => provider.enabled);
  const enabledDevices = devices.filter(device => device.enabled);
  const rawAgidLeavesDevice = enabledProviders.some(provider => provider.outboundData.includes('raw-agid'));
  const blocked = findings.some(finding => finding.severity === 'error');
  const impact: SettingsPolicyImpact = {
    localOnlyAvailable: localFirst && mode === 'local-only',
    externalDataFlowCount: enabledProviders.reduce((sum, provider) => sum + provider.outboundData.length, 0),
    enabledProviderCount: enabledProviders.length,
    enabledDeviceCount: enabledDevices.length,
    highRiskControlsFree: true,
    rawAddressLeavesDevice: false,
    rawAoidLeavesDevice: false,
    rawAgidLeavesDevice,
    proofSecretLeavesDevice: false,
    addressHistoryStored: !noAddressHistory,
  };

  const recommendedNextActions = [
    ...(blocked ? ['Fix blocking privacy or dependency findings before exporting this policy.'] : ['Policy can be applied to local POS, Field, Portal, and Dashboard surfaces.']),
    ...(mode === 'local-only' ? ['Keep Mode 0 available as the no-cost fallback for field and disaster use.'] : []),
    ...(profile.ethereumRequired ? ['Show gas and latency warnings before users enable Ethereum-backed operations.'] : []),
    ...(profile.zkRequired ? ['Keep proof generation optional and never persist witnesses or proof secrets.'] : []),
    ...(highRiskMode ? ['Use AGID-S, short alias expiry, no address history, and coarse public reporting.'] : []),
  ];

  const safeExport = buildSafeExport({
    mode,
    language,
    highRiskMode,
    localFirst,
    ethereumOptional,
    noRawAddressByDefault,
    noAddressHistory,
    agidSOnlyForHighRisk,
    shortAliasTtlSeconds,
    providers,
    devices,
    publicPrivatePreview,
    blocked,
  });

  return {
    version: SETTINGS_POLICY_CENTER_VERSION,
    createdAt,
    profile,
    input: {
      mode,
      language,
      highRiskMode,
      localFirst,
      ethereumOptional,
      noRawAddressByDefault,
      noAddressHistory,
      agidSOnlyForHighRisk,
      shortAliasTtlSeconds,
    },
    providers,
    devices,
    findings,
    blocked,
    recommendedNextActions,
    impact,
    mandatorySecurityGate,
    publicPrivatePreview,
    safeExport,
    policyFingerprint: stableCommitment('settings-policy', safeExport, { length: 24 }),
  };
}
