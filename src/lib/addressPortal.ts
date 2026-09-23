import {
  buildAddressItem,
  evaluateAddressItemScope,
  type AddressItem,
  type AddressItemInput,
  type AddressItemScopeEvaluation,
  type AddressItemStatus,
} from './addressItem';
import type { AddressLinkScope } from './addressLink';
import { sha256Hex } from './sha256';

export const ADDRESS_PORTAL_MODEL_VERSION = 'agid-address-portal-v1';

export const ADDRESS_PORTAL_ACTIONS = [
  'review',
  'revoke',
  'delete_data',
  'refresh',
  'reduce_scope',
  'export',
] as const;

export const ADDRESS_PORTAL_PARTICIPANT_TYPES = [
  'merchant',
  'carrier',
  'ngo',
  'municipality',
  'cms',
  'shopping-agent',
] as const;

export type AddressPortalAction = typeof ADDRESS_PORTAL_ACTIONS[number];
export type AddressPortalParticipantType = typeof ADDRESS_PORTAL_PARTICIPANT_TYPES[number];

export type AddressPortalConnectionInput = AddressItemInput & {
  connectionId?: unknown;
  participantName?: unknown;
  participantType?: unknown;
  purpose?: unknown;
  dataCategories?: unknown;
  lastAccessedAt?: unknown;
};

export type AddressPortalConnection = {
  connectionId: string;
  participantName: string;
  participantType: AddressPortalParticipantType;
  purpose: string;
  dataCategories: string[];
  item: AddressItem;
  lastAccessedAt: string | null;
  allowedActions: AddressPortalAction[];
  scopeEvaluation: AddressItemScopeEvaluation;
};

export type AddressPortalSnapshot = {
  modelVersion: typeof ADDRESS_PORTAL_MODEL_VERSION;
  generatedAt: string;
  portalRoot: string;
  connections: AddressPortalConnection[];
  counts: {
    total: number;
    active: number;
    needsReview: number;
    revokedOrExpired: number;
  };
  warnings: string[];
  privacy: {
    plaintextAddressDisplayed: false;
    rawAgidDisplayed: false;
    rawAoidDisplayed: false;
    showsParticipantScopesAndCommitmentsOnly: true;
  };
};

export type AddressPortalSafeConnectionExport = {
  connectionId: string;
  participantName: string;
  participantType: AddressPortalParticipantType;
  purpose: string;
  issuerId: string | null;
  status: AddressItemStatus;
  revocationState: AddressPortalConnection['item']['revocationState'];
  scopes: AddressLinkScope[];
  dataCategories: string[];
  credentialFingerprint: string | null;
  itemRoot: string;
  lastVerifiedAt: string | null;
  lastAccessedAt: string | null;
  allowedActions: AddressPortalAction[];
  nextAction: AddressPortalConnection['item']['nextAction'];
};

export type AddressPortalSafeExport = {
  modelVersion: typeof ADDRESS_PORTAL_MODEL_VERSION;
  exportVersion: 'agid-address-portal-safe-export-v1';
  generatedAt: string;
  exportId: string;
  portalRoot: string;
  counts: AddressPortalSnapshot['counts'];
  privacy: AddressPortalSnapshot['privacy'] & {
    rawPrivateFieldsExported: false;
  };
  connections: AddressPortalSafeConnectionExport[];
  warnings: string[];
};

export type AddressPortalPayloadSafety = {
  safe: boolean;
  findings: string[];
};

export type AddressPortalActionReceipt = {
  receiptVersion: 'agid-address-portal-action-receipt-v1';
  receiptId: string;
  action: AddressPortalAction;
  createdAt: string;
  domain: 'address-portal';
  connectionId: string;
  participantName: string;
  participantType: AddressPortalParticipantType;
  purpose: string;
  statusBefore: AddressItemStatus;
  issuerId: string | null;
  credentialFingerprint: string | null;
  itemRoot: string;
  scopeHash: string;
  nextAction: AddressPortalConnection['item']['nextAction'];
  privacy: {
    rawPrivateFieldsIncluded: false;
    containsRawAddress: false;
    containsRawAgid: false;
    containsRawAoid: false;
    containsRecipientSecret: false;
  };
};

export type AddressPortalPermissionTimelineEvent =
  | 'permission_granted'
  | 'permission_used'
  | 'permission_verified'
  | 'permission_expires'
  | 'permission_revoked';

export type AddressPortalPermissionTimelineEntry = {
  timelineVersion: 'agid-address-portal-permission-timeline-v1';
  eventId: string;
  event: AddressPortalPermissionTimelineEvent;
  occurredAt: string;
  connectionId: string;
  participantName: string;
  participantType: AddressPortalParticipantType;
  purpose: string;
  status: AddressItemStatus;
  issuerId: string | null;
  scopes: AddressLinkScope[];
  dataCategories: string[];
  credentialFingerprint: string | null;
  itemRoot: string;
  canRevoke: boolean;
  nextAction: AddressPortalConnection['item']['nextAction'];
  privacy: {
    rawPrivateFieldsIncluded: false;
    containsRawAddress: false;
    containsRawAgid: false;
    containsRawAoid: false;
    containsRecipientSecret: false;
  };
};

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const entries = Object.keys(value as Record<string, unknown>)
    .sort()
    .map(key => [key, (value as Record<string, unknown>)[key]] as const);
  return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`).join(',')}}`;
}

function safeText(value: unknown, fallback: string, maxLength = 80): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.trim().replace(/[^\p{L}\p{N}\s:._/-]+/gu, '').replace(/\s+/g, ' ');
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

function optionalIso(value: unknown): string | null {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : null;
}

function normalizeParticipantType(value: unknown): AddressPortalParticipantType {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase().replace(/_/g, '-') : '';
  return ADDRESS_PORTAL_PARTICIPANT_TYPES.includes(normalized as AddressPortalParticipantType)
    ? normalized as AddressPortalParticipantType
    : 'merchant';
}

function normalizeDataCategories(value: unknown, scopes: AddressLinkScope[]): string[] {
  const explicit = Array.isArray(value)
    ? value.map(item => safeText(item, '', 40)).filter(Boolean)
    : [];
  if (explicit.length > 0) return Array.from(new Set(explicit));
  return scopes.map(scope => scope.replace(':', ' '));
}

function actionSetForStatus(status: AddressItemStatus): AddressPortalAction[] {
  if (status === 'active') return ['review', 'revoke', 'delete_data', 'reduce_scope', 'export'];
  if (status === 'requires_reverification') return ['review', 'refresh', 'revoke', 'delete_data'];
  if (status === 'requires_credential') return ['review', 'delete_data'];
  if (status === 'revoked' || status === 'expired') return ['review', 'delete_data', 'export'];
  return ['review', 'delete_data'];
}

function normalizePortalScopes(value: unknown, fallback: AddressLinkScope[] = []): AddressLinkScope[] {
  const requested = Array.isArray(value) ? value : fallback;
  return Array.from(new Set(
    requested
      .map(scope => typeof scope === 'string' ? scope.trim().toLowerCase().replace(/_/g, ':') : '')
      .filter((scope): scope is AddressLinkScope => [
        'delivery:eligible',
        'recipient:verify',
        'region:coarse',
        'address:quality',
        'return:label',
      ].includes(scope)),
  ));
}

function findForbiddenPortalFields(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenPortalFields(item, `${prefix}[${index}]`));
  }

  const findings: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if ([
      'address',
      'rawaddress',
      'addresstext',
      'plaintextaddress',
      'formattedaddress',
      'recipient',
      'recipientname',
      'phone',
      'phonenumber',
      'unit',
      'room',
      'roomnumber',
      'building',
      'street',
      'road',
      'housenumber',
      'house_number',
      'lat',
      'latitude',
      'lon',
      'lng',
      'longitude',
      'coordinates',
      'agid',
      'rawagid',
      'aoid',
      'rawaoid',
      'proofcode',
      'recipientsecret',
      'credentialsecret',
      'privatekey',
      'secret',
    ].includes(normalizedKey)) {
      findings.push(path);
    }
    findings.push(...findForbiddenPortalFields(nested, path));
  }
  return findings;
}

export function buildAddressPortalConnection(input: AddressPortalConnectionInput): AddressPortalConnection {
  const item = buildAddressItem(input);
  const participantName = safeText(input.participantName, item.issuerId || 'Unknown participant');
  const participantType = normalizeParticipantType(input.participantType);
  const purpose = safeText(input.purpose, 'delivery', 40);
  const connectionSeed = stableJson({
    participantName,
    participantType,
    purpose,
    addressItemId: item.addressItemId,
    itemRoot: item.itemRoot,
  });
  const explicitConnectionId = typeof input.connectionId === 'string' ? input.connectionId.trim() : '';
  const connectionId = explicitConnectionId || `APC-${sha256Hex(connectionSeed).slice(0, 18).toUpperCase()}`;

  return {
    connectionId,
    participantName,
    participantType,
    purpose,
    dataCategories: normalizeDataCategories(input.dataCategories, item.scopes),
    item,
    lastAccessedAt: optionalIso(input.lastAccessedAt),
    allowedActions: actionSetForStatus(item.status),
    scopeEvaluation: evaluateAddressItemScope(item, item.scopes),
  };
}

export function buildAddressPortalSnapshot(
  connectionsInput: AddressPortalConnectionInput[],
  generatedAt = new Date().toISOString(),
): AddressPortalSnapshot {
  const connections = connectionsInput.map(buildAddressPortalConnection);
  const counts = connections.reduce(
    (acc, connection) => {
      acc.total += 1;
      if (connection.item.status === 'active') acc.active += 1;
      if (connection.item.status === 'requires_reverification' || connection.item.status === 'requires_credential' || connection.item.status === 'error') {
        acc.needsReview += 1;
      }
      if (connection.item.status === 'revoked' || connection.item.status === 'expired' || connection.item.status === 'suspended') {
        acc.revokedOrExpired += 1;
      }
      return acc;
    },
    { total: 0, active: 0, needsReview: 0, revokedOrExpired: 0 },
  );

  const warnings = connections.flatMap(connection => connection.item.warnings.map(warning => `${connection.connectionId}:${warning}`));
  const portalRoot = sha256Hex(stableJson({
    modelVersion: ADDRESS_PORTAL_MODEL_VERSION,
    generatedAt,
    connectionRoots: connections.map(connection => ({
      connectionId: connection.connectionId,
      itemRoot: connection.item.itemRoot,
      status: connection.item.status,
      scopes: connection.item.scopes,
    })),
  }));

  return {
    modelVersion: ADDRESS_PORTAL_MODEL_VERSION,
    generatedAt,
    portalRoot,
    connections,
    counts,
    warnings,
    privacy: {
      plaintextAddressDisplayed: false,
      rawAgidDisplayed: false,
      rawAoidDisplayed: false,
      showsParticipantScopesAndCommitmentsOnly: true,
    },
  };
}

export function validateAddressPortalPayloadIsSafe(value: unknown): AddressPortalPayloadSafety {
  const findings = findForbiddenPortalFields(value);
  return {
    safe: findings.length === 0,
    findings,
  };
}

export function buildAddressPortalSafeExport(
  snapshot: AddressPortalSnapshot,
  exportId = `APE-${sha256Hex(stableJson({
    portalRoot: snapshot.portalRoot,
    generatedAt: snapshot.generatedAt,
  })).slice(0, 20).toUpperCase()}`,
): AddressPortalSafeExport {
  const connections = snapshot.connections.map((connection): AddressPortalSafeConnectionExport => ({
    connectionId: connection.connectionId,
    participantName: connection.participantName,
    participantType: connection.participantType,
    purpose: connection.purpose,
    issuerId: connection.item.issuerId,
    status: connection.item.status,
    revocationState: connection.item.revocationState,
    scopes: connection.item.scopes,
    dataCategories: connection.dataCategories,
    credentialFingerprint: connection.item.credentialRef?.fingerprint ?? null,
    itemRoot: connection.item.itemRoot,
    lastVerifiedAt: connection.item.lastVerifiedAt,
    lastAccessedAt: connection.lastAccessedAt,
    allowedActions: connection.allowedActions,
    nextAction: connection.item.nextAction,
  }));

  const safeExport = {
    modelVersion: ADDRESS_PORTAL_MODEL_VERSION,
    exportVersion: 'agid-address-portal-safe-export-v1',
    generatedAt: snapshot.generatedAt,
    exportId,
    portalRoot: snapshot.portalRoot,
    counts: snapshot.counts,
    privacy: {
      ...snapshot.privacy,
      rawPrivateFieldsExported: false,
    },
    connections,
    warnings: snapshot.warnings,
  } satisfies AddressPortalSafeExport;

  const safety = validateAddressPortalPayloadIsSafe(safeExport);
  if (!safety.safe) {
    throw new Error(`address-portal-safe-export-contained-private-fields:${safety.findings.join(',')}`);
  }

  return safeExport;
}

export function buildAddressPortalActionReceipt(
  connection: AddressPortalConnection,
  action: AddressPortalAction,
  createdAt = new Date().toISOString(),
): AddressPortalActionReceipt {
  const scopeHash = sha256Hex(stableJson({
    domain: 'address-portal:scope-hash',
    connectionId: connection.connectionId,
    scopes: connection.item.scopes,
    dataCategories: connection.dataCategories,
  }));
  const receiptId = `APR-${sha256Hex(stableJson({
    version: 'agid-address-portal-action-receipt-v1',
    action,
    createdAt,
    connectionId: connection.connectionId,
    itemRoot: connection.item.itemRoot,
    scopeHash,
  })).slice(0, 24).toUpperCase()}`;

  const receipt = {
    receiptVersion: 'agid-address-portal-action-receipt-v1',
    receiptId,
    action,
    createdAt,
    domain: 'address-portal',
    connectionId: connection.connectionId,
    participantName: connection.participantName,
    participantType: connection.participantType,
    purpose: connection.purpose,
    statusBefore: connection.item.status,
    issuerId: connection.item.issuerId,
    credentialFingerprint: connection.item.credentialRef?.fingerprint ?? null,
    itemRoot: connection.item.itemRoot,
    scopeHash,
    nextAction: connection.item.nextAction,
    privacy: {
      rawPrivateFieldsIncluded: false,
      containsRawAddress: false,
      containsRawAgid: false,
      containsRawAoid: false,
      containsRecipientSecret: false,
    },
  } satisfies AddressPortalActionReceipt;

  const safety = validateAddressPortalPayloadIsSafe(receipt);
  if (!safety.safe) {
    throw new Error(`address-portal-action-receipt-contained-private-fields:${safety.findings.join(',')}`);
  }

  return receipt;
}

function permissionTimelineEntry(
  connection: AddressPortalConnection,
  event: AddressPortalPermissionTimelineEvent,
  occurredAt: string,
): AddressPortalPermissionTimelineEntry {
  const eventId = `APT-${sha256Hex(stableJson({
    timelineVersion: 'agid-address-portal-permission-timeline-v1',
    event,
    occurredAt,
    connectionId: connection.connectionId,
    itemRoot: connection.item.itemRoot,
  })).slice(0, 24).toUpperCase()}`;

  const entry = {
    timelineVersion: 'agid-address-portal-permission-timeline-v1',
    eventId,
    event,
    occurredAt,
    connectionId: connection.connectionId,
    participantName: connection.participantName,
    participantType: connection.participantType,
    purpose: connection.purpose,
    status: connection.item.status,
    issuerId: connection.item.issuerId,
    scopes: connection.item.scopes,
    dataCategories: connection.dataCategories,
    credentialFingerprint: connection.item.credentialRef?.fingerprint ?? null,
    itemRoot: connection.item.itemRoot,
    canRevoke: connection.allowedActions.includes('revoke'),
    nextAction: connection.item.nextAction,
    privacy: {
      rawPrivateFieldsIncluded: false,
      containsRawAddress: false,
      containsRawAgid: false,
      containsRawAoid: false,
      containsRecipientSecret: false,
    },
  } satisfies AddressPortalPermissionTimelineEntry;

  const safety = validateAddressPortalPayloadIsSafe(entry);
  if (!safety.safe) {
    throw new Error(`address-portal-permission-timeline-contained-private-fields:${safety.findings.join(',')}`);
  }

  return entry;
}

export function buildAddressPortalPermissionTimeline(
  snapshot: AddressPortalSnapshot,
): AddressPortalPermissionTimelineEntry[] {
  const entries = snapshot.connections.flatMap(connection => {
    const timeline: AddressPortalPermissionTimelineEntry[] = [
      permissionTimelineEntry(connection, 'permission_granted', connection.item.createdAt),
    ];

    if (connection.lastAccessedAt) {
      timeline.push(permissionTimelineEntry(connection, 'permission_used', connection.lastAccessedAt));
    }
    if (connection.item.lastVerifiedAt) {
      timeline.push(permissionTimelineEntry(connection, 'permission_verified', connection.item.lastVerifiedAt));
    }
    if (connection.item.expiresAt) {
      timeline.push(permissionTimelineEntry(connection, 'permission_expires', connection.item.expiresAt));
    }
    if (connection.item.status === 'revoked') {
      timeline.push(permissionTimelineEntry(connection, 'permission_revoked', connection.item.lastVerifiedAt ?? connection.item.createdAt));
    }

    return timeline;
  });

  return entries.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}

export function narrowAddressPortalConnectionScopes(
  connection: AddressPortalConnection,
  nextScopes: Array<AddressLinkScope | string>,
): AddressPortalConnection {
  const normalizedScopes = normalizePortalScopes(nextScopes);
  const scoped = normalizedScopes.filter(scope => connection.item.scopes.includes(scope));
  return buildAddressPortalConnection({
    connectionId: connection.connectionId,
    participantName: connection.participantName,
    participantType: connection.participantType,
    purpose: connection.purpose,
    dataCategories: connection.dataCategories.filter(category =>
      scoped.some(scope => category.toLowerCase().includes(scope.split(':')[0]))
      || category.toLowerCase().includes('coarse')
      || category.toLowerCase().includes('quality'),
    ),
    addressItemId: connection.item.addressItemId,
    issuerId: connection.item.issuerId,
    credentialRef: connection.item.credentialRef ?? undefined,
    scopes: scoped,
    revocationState: connection.item.revocationState,
    lastVerifiedAt: connection.item.lastVerifiedAt ?? undefined,
    createdAt: connection.item.createdAt,
    expiresAt: connection.item.expiresAt,
    lastAccessedAt: connection.lastAccessedAt ?? undefined,
  });
}

export function revokeAddressPortalConnection(connection: AddressPortalConnection): AddressPortalConnection {
  return buildAddressPortalConnection({
    connectionId: connection.connectionId,
    participantName: connection.participantName,
    participantType: connection.participantType,
    purpose: connection.purpose,
    dataCategories: connection.dataCategories,
    addressItemId: connection.item.addressItemId,
    issuerId: connection.item.issuerId,
    credentialRef: connection.item.credentialRef ?? undefined,
    scopes: connection.item.scopes,
    revocationState: 'revoked',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: connection.item.createdAt,
    expiresAt: connection.item.expiresAt,
    lastAccessedAt: connection.lastAccessedAt ?? undefined,
  });
}
