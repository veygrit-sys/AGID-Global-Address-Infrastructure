import type { RegisteredAddressQrPrivacy } from './privacyPolicy';

export const GLOBAL_PRIVACY_MODE_VERSION = 'global-privacy-mode-v1';

export type GlobalPrivacyRuntimeMode =
  | 'local-only'
  | 'local-server-registry'
  | 'zk-only'
  | 'ethereum-registry'
  | 'full-zk-ethereum';

export type GlobalPrivacyRiskLevel = 'standard' | 'elevated' | 'high-risk';

export interface GlobalPrivacyModeInput {
  qrPayloadPrivacy?: RegisteredAddressQrPrivacy;
  registryEnabled?: boolean;
  zkEnabled?: boolean;
  ethereumEnabled?: boolean;
  online?: boolean;
  shippingMode?: boolean;
  disasterMode?: boolean;
  droneMode?: boolean;
  gisMode?: boolean;
  systematicMode?: boolean;
  regionalMode?: boolean;
  nauticalMode?: boolean;
  seaTypeMode?: boolean;
}

export interface GlobalPrivacyModeSummary {
  schemaVersion: typeof GLOBAL_PRIVACY_MODE_VERSION;
  runtimeMode: GlobalPrivacyRuntimeMode;
  modeCode: 'Mode 0' | 'Mode 1' | 'Mode 2' | 'Mode 3' | 'Mode 4';
  modeLabel: string;
  privacyDefault: 'no-raw-address';
  qrExposure: 'minimal-public-reference' | 'sensitive-full-payload';
  qrLabel: string;
  networkLabel: 'online' | 'offline-ready';
  riskLevel: GlobalPrivacyRiskLevel;
  activeContextLabels: string[];
  warnings: string[];
}

function resolveRuntimeMode(input: GlobalPrivacyModeInput): Pick<GlobalPrivacyModeSummary, 'runtimeMode' | 'modeCode' | 'modeLabel'> {
  if (input.zkEnabled && input.ethereumEnabled) {
    return {
      runtimeMode: 'full-zk-ethereum',
      modeCode: 'Mode 4',
      modeLabel: 'Full ZK + Ethereum',
    };
  }

  if (input.ethereumEnabled) {
    return {
      runtimeMode: 'ethereum-registry',
      modeCode: 'Mode 3',
      modeLabel: 'Ethereum Registry',
    };
  }

  if (input.zkEnabled) {
    return {
      runtimeMode: 'zk-only',
      modeCode: 'Mode 2',
      modeLabel: 'ZK Only',
    };
  }

  if (input.registryEnabled) {
    return {
      runtimeMode: 'local-server-registry',
      modeCode: 'Mode 1',
      modeLabel: 'Local + Server Registry',
    };
  }

  return {
    runtimeMode: 'local-only',
    modeCode: 'Mode 0',
    modeLabel: 'Local Only',
  };
}

function resolveRiskLevel(input: GlobalPrivacyModeInput): GlobalPrivacyRiskLevel {
  if (input.disasterMode) return 'high-risk';
  if (input.shippingMode || input.droneMode || input.nauticalMode || input.seaTypeMode) return 'elevated';
  return 'standard';
}

function resolveActiveContextLabels(input: GlobalPrivacyModeInput): string[] {
  const labels: string[] = [];
  if (input.shippingMode) labels.push('Shipping');
  if (input.disasterMode) labels.push('High-risk');
  if (input.droneMode) labels.push('Drone');
  if (input.gisMode) labels.push('GIS');
  if (input.systematicMode) labels.push('Systematic');
  if (input.regionalMode) labels.push('Regional');
  if (input.nauticalMode) labels.push('Nautical');
  if (input.seaTypeMode) labels.push('Sea');
  return labels;
}

export function buildGlobalPrivacyModeSummary(input: GlobalPrivacyModeInput = {}): GlobalPrivacyModeSummary {
  const runtime = resolveRuntimeMode(input);
  const qrExposure = input.qrPayloadPrivacy === 'public'
    ? 'minimal-public-reference'
    : 'sensitive-full-payload';
  const riskLevel = resolveRiskLevel(input);
  const warnings: string[] = [];

  if (qrExposure === 'sensitive-full-payload') {
    warnings.push('Full QR payload can expose more address detail. Prefer public QR for low-disclosure sharing.');
  }

  if (riskLevel === 'high-risk') {
    warnings.push('High-risk context: prefer AGID-S, short expiry, revocation, and no address history.');
  }

  if (input.online === false) {
    warnings.push('Offline mode: keep local used-state and sync later for collision review.');
  }

  return {
    schemaVersion: GLOBAL_PRIVACY_MODE_VERSION,
    ...runtime,
    privacyDefault: 'no-raw-address',
    qrExposure,
    qrLabel: qrExposure === 'minimal-public-reference' ? 'Public QR' : 'Full QR',
    networkLabel: input.online === false ? 'offline-ready' : 'online',
    riskLevel,
    activeContextLabels: resolveActiveContextLabels(input),
    warnings,
  };
}
