import {
  buildPosDeviceDiagnostics,
  getPosStaffProfile,
  listPosStaffProfiles,
  type PosDeviceDiagnostic,
  type PosDeviceStatus,
  type PosHardwareCapabilitySnapshot,
  type PosStaffProfile,
  type PosStaffRole,
} from './posOperationalControls';
import { sha256Hex } from './sha256';

export const ADDRESS_TERMINAL_MODEL_VERSION = 'agid-address-terminal-v1';

export const ADDRESS_TERMINAL_SCREENS = [
  'terminal-list',
  'terminal-diagnostics',
  'scan-history',
  'registry-sync',
  'offline-queue',
  'staff-permissions',
  'reverification-report',
  'settings',
] as const;

export const ADDRESS_TERMINAL_DEVICE_CLASSES = [
  'pos-terminal',
  'qr-reader',
  'nfc-reader',
  'barcode-reader',
  'receipt-printer',
  'cash-drawer',
  'measurement-instrument',
] as const;

export type AddressTerminalScreen = (typeof ADDRESS_TERMINAL_SCREENS)[number];
export type AddressTerminalDeviceClass = (typeof ADDRESS_TERMINAL_DEVICE_CLASSES)[number];
export type AddressTerminalSyncState = 'fresh' | 'pending' | 'conflict' | 'offline' | 'error';
export type AddressTerminalGrade = 'ready' | 'attention' | 'blocked';

export type AddressTerminalInput = {
  terminalId?: unknown;
  label?: unknown;
  siteId?: unknown;
  staffRole?: unknown;
  hardware?: PosHardwareCapabilitySnapshot;
  registryFresh?: unknown;
  syncState?: unknown;
  pendingOfflineItems?: unknown;
  scanHistoryCount?: unknown;
  activeSecureKeys?: unknown;
  totalSecureKeys?: unknown;
  lastSeenAt?: unknown;
};

export type AddressTerminalFleetInput = {
  generatedAt?: unknown;
  terminals?: unknown;
};

export type AddressTerminalCard = {
  terminalId: string;
  label: string;
  siteId: string;
  staff: PosStaffProfile;
  grade: AddressTerminalGrade;
  lastSeenAt: string;
  registryFresh: boolean;
  syncState: AddressTerminalSyncState;
  pendingOfflineItems: number;
  scanHistoryCount: number;
  activeSecureKeys: number;
  totalSecureKeys: number;
  devices: PosDeviceDiagnostic[];
  attention: string[];
};

export type AddressTerminalFleetSnapshot = {
  modelVersion: string;
  snapshotId: string;
  generatedAt: string;
  screens: Array<{
    id: AddressTerminalScreen;
    label: string;
    purpose: string;
    primaryActions: string[];
  }>;
  deviceClasses: AddressTerminalDeviceClass[];
  terminals: AddressTerminalCard[];
  totals: {
    terminals: number;
    ready: number;
    attention: number;
    blocked: number;
    pendingOfflineItems: number;
    scanHistoryCount: number;
  };
  staffProfiles: PosStaffProfile[];
  privacy: AddressTerminalPrivacyBoundary;
  warnings: string[];
};

export type AddressTerminalPrivacyBoundary = {
  rawPayloadStorage: false;
  rawAddressStorage: false;
  rawAgidStorage: false;
  rawAoidStorage: false;
  rawWaybillIdStorage: false;
  rawProofStorage: false;
  deviceTelemetryOnly: true;
};

const ADDRESS_TERMINAL_PRIVACY: AddressTerminalPrivacyBoundary = {
  rawPayloadStorage: false,
  rawAddressStorage: false,
  rawAgidStorage: false,
  rawAoidStorage: false,
  rawWaybillIdStorage: false,
  rawProofStorage: false,
  deviceTelemetryOnly: true,
};

const SCREEN_DESCRIPTIONS: Record<AddressTerminalScreen, {
  label: string;
  purpose: string;
  primaryActions: string[];
}> = {
  'terminal-list': {
    label: 'Terminals',
    purpose: 'View POS terminals, current posture, site, and last-seen state.',
    primaryActions: ['open-diagnostics', 'view-sync-state', 'assign-staff-role'],
  },
  'terminal-diagnostics': {
    label: 'Device diagnostics',
    purpose: 'Check printer, cash drawer, barcode reader, NFC, QR, and electronic measuring devices.',
    primaryActions: ['run-diagnostics', 'pair-device', 'print-test-slip'],
  },
  'scan-history': {
    label: 'Scan history',
    purpose: 'Review redacted QR/NFC/barcode handoff receipts without raw payload persistence.',
    primaryActions: ['filter-scans', 'open-receipt', 'export-redacted'],
  },
  'registry-sync': {
    label: 'Registry sync',
    purpose: 'Inspect revocation, used-state, freshness, key, and issuer synchronization.',
    primaryActions: ['refresh-registry', 'retry-sync', 'open-conflicts'],
  },
  'offline-queue': {
    label: 'Offline queue',
    purpose: 'Handle deferred usage/nullifier sync from stores, warehouses, and field sites.',
    primaryActions: ['sync-now', 'resolve-conflict', 'mark-audit-required'],
  },
  'staff-permissions': {
    label: 'Staff permissions',
    purpose: 'Assign cashier, pickup, delivery supervisor, and field-admin capabilities.',
    primaryActions: ['assign-role', 'review-permissions', 'require-supervisor'],
  },
  'reverification-report': {
    label: 'Reverification report',
    purpose: 'Rebuild post-handoff evidence after carrier and recipient scans.',
    primaryActions: ['generate-report', 'print-report', 'attach-audit-case'],
  },
  settings: {
    label: 'Settings',
    purpose: 'Configure language, device connectors, registry mode, keys, and high-risk mode.',
    primaryActions: ['set-language', 'rotate-keys', 'configure-connectors'],
  },
};

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(0, Math.floor(parsed));
  }
  return fallback;
}

function readStaffRole(value: unknown): PosStaffRole {
  const role = cleanText(value);
  return role === 'cashier'
    || role === 'pickup-operator'
    || role === 'delivery-supervisor'
    || role === 'field-admin'
    ? role
    : 'pickup-operator';
}

function readSyncState(value: unknown): AddressTerminalSyncState {
  const state = cleanText(value);
  return state === 'fresh'
    || state === 'pending'
    || state === 'conflict'
    || state === 'offline'
    || state === 'error'
    ? state
    : 'fresh';
}

function deviceAttention(devices: PosDeviceDiagnostic[]) {
  return devices
    .filter(device => device.status !== 'ready')
    .map(device => `${device.kind}:${device.status}`);
}

function gradeForTerminal(options: {
  registryFresh: boolean;
  syncState: AddressTerminalSyncState;
  pendingOfflineItems: number;
  activeSecureKeys: number;
  devices: PosDeviceDiagnostic[];
}): AddressTerminalGrade {
  const allDevicesOffline = options.devices.length > 0
    && options.devices.every(device => device.status === 'offline');
  if (options.syncState === 'conflict' || options.syncState === 'error' || allDevicesOffline) return 'blocked';
  if (!options.registryFresh || options.syncState === 'offline' || options.syncState === 'pending') return 'attention';
  if (options.pendingOfflineItems > 0 || options.activeSecureKeys === 0) return 'attention';
  return options.devices.some(device => device.status !== 'ready') ? 'attention' : 'ready';
}

function normalizeTerminal(input: unknown, index: number, generatedAt: string): AddressTerminalCard {
  const source = input && typeof input === 'object' && !Array.isArray(input)
    ? input as AddressTerminalInput
    : {};
  const terminalId = cleanText(source.terminalId) || `AGID-POS-${String(index + 1).padStart(3, '0')}`;
  const label = cleanText(source.label) || `AGID POS Terminal ${index + 1}`;
  const siteId = cleanText(source.siteId) || 'local-site';
  const staff = getPosStaffProfile(readStaffRole(source.staffRole));
  const devices = buildPosDeviceDiagnostics(source.hardware ?? { checkedAt: generatedAt });
  const registryFresh = source.registryFresh !== false;
  const syncState = readSyncState(source.syncState);
  const pendingOfflineItems = cleanNumber(source.pendingOfflineItems);
  const scanHistoryCount = cleanNumber(source.scanHistoryCount);
  const activeSecureKeys = cleanNumber(source.activeSecureKeys);
  const totalSecureKeys = cleanNumber(source.totalSecureKeys, activeSecureKeys);
  const attention = [
    ...deviceAttention(devices),
    registryFresh ? '' : 'registry:stale',
    syncState === 'fresh' ? '' : `sync:${syncState}`,
    pendingOfflineItems > 0 ? 'offline-queue:pending' : '',
    activeSecureKeys > 0 ? '' : 'agid-s-keys:missing',
  ].filter(Boolean);

  return {
    terminalId,
    label,
    siteId,
    staff,
    grade: gradeForTerminal({
      registryFresh,
      syncState,
      pendingOfflineItems,
      activeSecureKeys,
      devices,
    }),
    lastSeenAt: cleanText(source.lastSeenAt) || generatedAt,
    registryFresh,
    syncState,
    pendingOfflineItems,
    scanHistoryCount,
    activeSecureKeys,
    totalSecureKeys,
    devices,
    attention,
  };
}

export function listAddressTerminalCapabilities() {
  return {
    modelVersion: ADDRESS_TERMINAL_MODEL_VERSION,
    screens: ADDRESS_TERMINAL_SCREENS.map(id => ({ id, ...SCREEN_DESCRIPTIONS[id] })),
    deviceClasses: [...ADDRESS_TERMINAL_DEVICE_CLASSES],
    staffProfiles: listPosStaffProfiles(),
    registryChecks: ['revocation', 'used-status', 'freshness', 'issuer-trust', 'key-status'],
    offlineControls: ['local-used-ledger', 'deferred-sync', 'conflict-to-audit', 'no-raw-payload-queue'],
    privacy: ADDRESS_TERMINAL_PRIVACY,
  };
}

export function buildAddressTerminalFleetSnapshot(input: AddressTerminalFleetInput = {}): AddressTerminalFleetSnapshot {
  const generatedAt = cleanText(input.generatedAt) || new Date().toISOString();
  const terminals = (Array.isArray(input.terminals) && input.terminals.length > 0 ? input.terminals : [{}])
    .map((terminal, index) => normalizeTerminal(terminal, index, generatedAt));
  const ready = terminals.filter(terminal => terminal.grade === 'ready').length;
  const attention = terminals.filter(terminal => terminal.grade === 'attention').length;
  const blocked = terminals.filter(terminal => terminal.grade === 'blocked').length;
  const snapshotSeed = terminals
    .map(terminal => `${terminal.terminalId}|${terminal.grade}|${terminal.pendingOfflineItems}`)
    .join('|');

  return {
    modelVersion: ADDRESS_TERMINAL_MODEL_VERSION,
    snapshotId: `ATF-${sha256Hex(`${generatedAt}|${snapshotSeed}`).slice(0, 16).toUpperCase()}`,
    generatedAt,
    screens: ADDRESS_TERMINAL_SCREENS.map(id => ({ id, ...SCREEN_DESCRIPTIONS[id] })),
    deviceClasses: [...ADDRESS_TERMINAL_DEVICE_CLASSES],
    terminals,
    totals: {
      terminals: terminals.length,
      ready,
      attention,
      blocked,
      pendingOfflineItems: terminals.reduce((count, terminal) => count + terminal.pendingOfflineItems, 0),
      scanHistoryCount: terminals.reduce((count, terminal) => count + terminal.scanHistoryCount, 0),
    },
    staffProfiles: listPosStaffProfiles(),
    privacy: ADDRESS_TERMINAL_PRIVACY,
    warnings: blocked > 0
      ? ['blocked-terminal-requires-supervisor-before-release']
      : attention > 0
        ? ['attention-terminal-usable-but-not-for-high-risk-release']
        : [],
  };
}

export function addressTerminalDeviceTone(status: PosDeviceStatus) {
  return status === 'ready' ? 'ok' : status === 'warning' ? 'warning' : 'danger';
}
