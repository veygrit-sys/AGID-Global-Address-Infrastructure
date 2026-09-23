import { sha256Hex } from './sha256';

export const ADDRESS_OFFLINE_SYNC_CRDT_VERSION = 'address-offline-sync-crdt-v1';

export type AddressOfflineCrdtEntityKind =
  | 'address-reference'
  | 'aoid'
  | 'credential'
  | 'shipping-label'
  | 'pos-usage'
  | 'settings';

export type AddressOfflineCrdtAction =
  | 'upsert-field'
  | 'remove-field'
  | 'add-set-member'
  | 'remove-set-member'
  | 'tombstone-entity';

export type AddressOfflineCrdtClock = Record<string, number>;

export type AddressOfflineCrdtClockOrder =
  | 'equal'
  | 'before'
  | 'after'
  | 'concurrent';

export type AddressOfflineCrdtJson =
  | string
  | number
  | boolean
  | null
  | AddressOfflineCrdtJson[]
  | { [key: string]: AddressOfflineCrdtJson };

export type AddressOfflineCrdtOperation = {
  modelVersion: typeof ADDRESS_OFFLINE_SYNC_CRDT_VERSION;
  operationId: string;
  actorId: string;
  deviceId?: string;
  entityId: string;
  entityKind: AddressOfflineCrdtEntityKind;
  domain: string;
  action: AddressOfflineCrdtAction;
  clock: AddressOfflineCrdtClock;
  createdAt: string;
  field?: string;
  setName?: string;
  memberId?: string;
  memberCommitment?: string;
  observedAddTags?: string[];
  publicValue?: AddressOfflineCrdtJson;
  valueCommitment?: string;
  reason?: string;
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  rawRecipientStored: false;
  rawPhoneStored: false;
  rawProofStored: false;
};

export type AddressOfflineCrdtRegister = {
  field: string;
  operationId: string;
  actorId: string;
  clock: AddressOfflineCrdtClock;
  updatedAt: string;
  publicValue?: AddressOfflineCrdtJson;
  valueCommitment?: string;
  tombstone: boolean;
};

export type AddressOfflineCrdtSetMember = {
  setName: string;
  memberId: string;
  memberCommitment: string;
  addTags: string[];
  removeTags: string[];
  clock: AddressOfflineCrdtClock;
  updatedAt: string;
};

export type AddressOfflineCrdtConflict = {
  conflictId: string;
  entityId: string;
  conflictType:
    | 'concurrent-field-write'
    | 'set-member-commitment-mismatch'
    | 'entity-metadata-mismatch';
  field?: string;
  setName?: string;
  memberId?: string;
  leftOperationId?: string;
  rightOperationId?: string;
  winningOperationId?: string;
  detectedAt: string;
  resolution: 'deterministic-winner' | 'audit-required';
  rawMaterialStored: false;
};

export type AddressOfflineCrdtState = {
  modelVersion: typeof ADDRESS_OFFLINE_SYNC_CRDT_VERSION;
  entityId: string;
  entityKind: AddressOfflineCrdtEntityKind;
  domain: string;
  clock: AddressOfflineCrdtClock;
  fields: Record<string, AddressOfflineCrdtRegister>;
  sets: Record<string, Record<string, AddressOfflineCrdtSetMember>>;
  tombstone?: AddressOfflineCrdtRegister;
  conflicts: AddressOfflineCrdtConflict[];
  createdAt: string;
  updatedAt: string;
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  rawRecipientStored: false;
  rawPhoneStored: false;
  rawProofStored: false;
};

export type CreateAddressOfflineCrdtOperationInput = {
  actorId: string;
  deviceId?: string;
  entityId: string;
  entityKind: AddressOfflineCrdtEntityKind;
  domain?: string;
  action: AddressOfflineCrdtAction;
  clock?: AddressOfflineCrdtClock;
  now?: string;
  field?: string;
  setName?: string;
  memberId?: string;
  memberCommitment?: string;
  observedAddTags?: string[];
  publicValue?: AddressOfflineCrdtJson;
  valueCommitment?: string;
  reason?: string;
};

export type AddressOfflineSyncEnvelope = {
  modelVersion: typeof ADDRESS_OFFLINE_SYNC_CRDT_VERSION;
  entityId: string;
  entityKind: AddressOfflineCrdtEntityKind;
  domain: string;
  clock: AddressOfflineCrdtClock;
  fields: Record<string, Pick<AddressOfflineCrdtRegister, 'field' | 'operationId' | 'actorId' | 'clock' | 'updatedAt' | 'publicValue' | 'valueCommitment' | 'tombstone'>>;
  sets: Record<string, Array<Pick<AddressOfflineCrdtSetMember, 'setName' | 'memberId' | 'memberCommitment' | 'addTags' | 'removeTags' | 'clock' | 'updatedAt'>>>;
  conflicts: AddressOfflineCrdtConflict[];
  updatedAt: string;
  privacy: {
    rawAddressStored: false;
    rawAgidStored: false;
    rawAoidStored: false;
    rawRecipientStored: false;
    rawPhoneStored: false;
    rawProofStored: false;
    publicSyncMaterial: 'public-values-and-commitments-only';
  };
};

const DEFAULT_DOMAIN = 'offline-sync:default';
const SENSITIVE_FIELD_PATTERNS = [
  /address/i,
  /street/i,
  /room/i,
  /unit/i,
  /recipient/i,
  /phone/i,
  /email/i,
  /agid/i,
  /aoid/i,
  /lat/i,
  /lon/i,
  /proof/i,
  /secret/i,
  /waybill/i,
  /instruction/i,
];

function cleanText(value: unknown, fallback = '') {
  return typeof value === 'string'
    ? value.normalize('NFKC').trim().replace(/[\r\n\t]+/g, ' ')
    : fallback;
}

function cleanKey(value: unknown, fallback = '') {
  return cleanText(value, fallback)
    .replace(/[^a-zA-Z0-9:._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || fallback;
}

function cleanIso(value: unknown, fallback = new Date().toISOString()) {
  const text = cleanText(value);
  if (!text) return fallback;
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function privacyFlags() {
  return {
    rawAddressStored: false as const,
    rawAgidStored: false as const,
    rawAoidStored: false as const,
    rawRecipientStored: false as const,
    rawPhoneStored: false as const,
    rawProofStored: false as const,
  };
}

function normalizeClock(clock: AddressOfflineCrdtClock | undefined): AddressOfflineCrdtClock {
  const result: AddressOfflineCrdtClock = {};
  for (const [actor, value] of Object.entries(clock || {})) {
    const key = cleanKey(actor);
    const numeric = Math.max(0, Math.floor(Number(value)));
    if (key && Number.isFinite(numeric)) result[key] = numeric;
  }
  return result;
}

export function incrementAddressOfflineCrdtClock(
  clock: AddressOfflineCrdtClock | undefined,
  actorId: string,
) {
  const next = normalizeClock(clock);
  const actor = cleanKey(actorId, 'local-actor');
  next[actor] = (next[actor] ?? 0) + 1;
  return next;
}

export function joinAddressOfflineCrdtClocks(
  left: AddressOfflineCrdtClock | undefined,
  right: AddressOfflineCrdtClock | undefined,
) {
  const result: AddressOfflineCrdtClock = {};
  const normalizedLeft = normalizeClock(left);
  const normalizedRight = normalizeClock(right);
  for (const actor of new Set([...Object.keys(normalizedLeft), ...Object.keys(normalizedRight)])) {
    result[actor] = Math.max(normalizedLeft[actor] ?? 0, normalizedRight[actor] ?? 0);
  }
  return result;
}

export function compareAddressOfflineCrdtClocks(
  left: AddressOfflineCrdtClock | undefined,
  right: AddressOfflineCrdtClock | undefined,
): AddressOfflineCrdtClockOrder {
  const normalizedLeft = normalizeClock(left);
  const normalizedRight = normalizeClock(right);
  let leftLess = false;
  let leftGreater = false;
  for (const actor of new Set([...Object.keys(normalizedLeft), ...Object.keys(normalizedRight)])) {
    const a = normalizedLeft[actor] ?? 0;
    const b = normalizedRight[actor] ?? 0;
    if (a < b) leftLess = true;
    if (a > b) leftGreater = true;
  }
  if (!leftLess && !leftGreater) return 'equal';
  if (leftLess && !leftGreater) return 'before';
  if (!leftLess && leftGreater) return 'after';
  return 'concurrent';
}

function isSensitiveField(field?: string) {
  const normalized = cleanKey(field).toLowerCase();
  return SENSITIVE_FIELD_PATTERNS.some(pattern => pattern.test(normalized));
}

function normalizeCommitment(value: unknown) {
  const text = cleanText(value);
  if (!text) return '';
  return text.startsWith('0x') ? `0x${text.slice(2).toLowerCase()}` : text;
}

function operationIdFrom(input: Omit<AddressOfflineCrdtOperation, 'operationId'>) {
  return `AOSC-${sha256Hex(stableJson(input)).slice(0, 24).toUpperCase()}`;
}

function memberIdFrom(input: {
  domain: string;
  entityId: string;
  setName: string;
  memberCommitment: string;
}) {
  return `MEM-${sha256Hex(stableJson(input)).slice(0, 20).toUpperCase()}`;
}

function normalizePublicValue(value: AddressOfflineCrdtJson | undefined) {
  if (value === undefined) return undefined;
  const json = stableJson(value);
  if (json.length > 4096) throw new Error('offline CRDT publicValue is too large');
  return JSON.parse(json) as AddressOfflineCrdtJson;
}

export function createAddressOfflineCrdtOperation(
  input: CreateAddressOfflineCrdtOperationInput,
): AddressOfflineCrdtOperation {
  const actorId = cleanKey(input.actorId, 'local-actor');
  const entityId = cleanKey(input.entityId);
  if (!entityId) throw new Error('offline CRDT operation requires entityId');
  const entityKind = input.entityKind;
  const domain = cleanKey(input.domain || DEFAULT_DOMAIN, DEFAULT_DOMAIN);
  const createdAt = cleanIso(input.now);
  const clock = incrementAddressOfflineCrdtClock(input.clock, actorId);
  const field = input.field ? cleanKey(input.field) : undefined;
  const setName = input.setName ? cleanKey(input.setName) : undefined;
  const valueCommitment = normalizeCommitment(input.valueCommitment);
  const memberCommitment = normalizeCommitment(input.memberCommitment);
  const publicValue = normalizePublicValue(input.publicValue);

  if ((input.action === 'upsert-field' || input.action === 'remove-field') && !field) {
    throw new Error('offline CRDT field operation requires field');
  }
  if (input.action === 'upsert-field') {
    if (isSensitiveField(field) && publicValue !== undefined) {
      throw new Error(`offline CRDT sensitive field "${field}" must use a commitment, not publicValue`);
    }
    if (publicValue === undefined && !valueCommitment) {
      throw new Error('offline CRDT upsert-field requires publicValue or valueCommitment');
    }
  }
  if (input.action === 'add-set-member' || input.action === 'remove-set-member') {
    if (!setName) throw new Error('offline CRDT set operation requires setName');
    if (!memberCommitment) throw new Error('offline CRDT set operation requires memberCommitment');
  }

  const memberId = input.memberId
    ? cleanKey(input.memberId)
    : setName && memberCommitment
      ? memberIdFrom({ domain, entityId, setName, memberCommitment })
      : undefined;

  const operationWithoutId = {
    modelVersion: ADDRESS_OFFLINE_SYNC_CRDT_VERSION,
    actorId,
    ...(input.deviceId ? { deviceId: cleanKey(input.deviceId) } : {}),
    entityId,
    entityKind,
    domain,
    action: input.action,
    clock,
    createdAt,
    ...(field ? { field } : {}),
    ...(setName ? { setName } : {}),
    ...(memberId ? { memberId } : {}),
    ...(memberCommitment ? { memberCommitment } : {}),
    ...(Array.isArray(input.observedAddTags) ? { observedAddTags: input.observedAddTags.map(tag => cleanKey(tag)).filter(Boolean) } : {}),
    ...(publicValue !== undefined ? { publicValue } : {}),
    ...(valueCommitment ? { valueCommitment } : {}),
    ...(input.reason ? { reason: cleanText(input.reason).slice(0, 160) } : {}),
    ...privacyFlags(),
  } satisfies Omit<AddressOfflineCrdtOperation, 'operationId'>;

  return {
    ...operationWithoutId,
    operationId: operationIdFrom(operationWithoutId),
  };
}

export function createAddressOfflineCrdtState(input: {
  entityId: string;
  entityKind: AddressOfflineCrdtEntityKind;
  domain?: string;
  now?: string;
}): AddressOfflineCrdtState {
  const now = cleanIso(input.now);
  return {
    modelVersion: ADDRESS_OFFLINE_SYNC_CRDT_VERSION,
    entityId: cleanKey(input.entityId),
    entityKind: input.entityKind,
    domain: cleanKey(input.domain || DEFAULT_DOMAIN, DEFAULT_DOMAIN),
    clock: {},
    fields: {},
    sets: {},
    conflicts: [],
    createdAt: now,
    updatedAt: now,
    ...privacyFlags(),
  };
}

function cloneState(state: AddressOfflineCrdtState): AddressOfflineCrdtState {
  return JSON.parse(stableJson(state)) as AddressOfflineCrdtState;
}

function registerDigest(register: AddressOfflineCrdtRegister) {
  return stableJson({
    publicValue: register.publicValue,
    valueCommitment: register.valueCommitment,
    tombstone: register.tombstone,
  });
}

function winnerRegister(
  left: AddressOfflineCrdtRegister,
  right: AddressOfflineCrdtRegister,
) {
  const leftTime = Date.parse(left.updatedAt);
  const rightTime = Date.parse(right.updatedAt);
  if (leftTime !== rightTime) return leftTime > rightTime ? left : right;
  return left.operationId >= right.operationId ? left : right;
}

function buildConflict(input: {
  entityId: string;
  conflictType: AddressOfflineCrdtConflict['conflictType'];
  detectedAt: string;
  field?: string;
  setName?: string;
  memberId?: string;
  leftOperationId?: string;
  rightOperationId?: string;
  winningOperationId?: string;
}) {
  const conflictId = `AOSC-CONFLICT-${sha256Hex(stableJson(input)).slice(0, 20).toUpperCase()}`;
  return {
    conflictId,
    entityId: input.entityId,
    conflictType: input.conflictType,
    ...(input.field ? { field: input.field } : {}),
    ...(input.setName ? { setName: input.setName } : {}),
    ...(input.memberId ? { memberId: input.memberId } : {}),
    ...(input.leftOperationId ? { leftOperationId: input.leftOperationId } : {}),
    ...(input.rightOperationId ? { rightOperationId: input.rightOperationId } : {}),
    ...(input.winningOperationId ? { winningOperationId: input.winningOperationId } : {}),
    detectedAt: input.detectedAt,
    resolution: 'audit-required' as const,
    rawMaterialStored: false as const,
  };
}

function mergeConflictLists(...lists: AddressOfflineCrdtConflict[][]) {
  const byId = new Map<string, AddressOfflineCrdtConflict>();
  for (const conflict of lists.flat()) byId.set(conflict.conflictId, conflict);
  return Array.from(byId.values()).sort((a, b) => a.detectedAt.localeCompare(b.detectedAt));
}

function mergeRegister(
  entityId: string,
  current: AddressOfflineCrdtRegister | undefined,
  incoming: AddressOfflineCrdtRegister,
) {
  if (!current) return { register: incoming, conflicts: [] as AddressOfflineCrdtConflict[] };
  const order = compareAddressOfflineCrdtClocks(current.clock, incoming.clock);
  if (order === 'before') return { register: incoming, conflicts: [] as AddressOfflineCrdtConflict[] };
  if (order === 'after' || order === 'equal') return { register: current, conflicts: [] as AddressOfflineCrdtConflict[] };
  if (registerDigest(current) === registerDigest(incoming)) {
    return {
      register: {
        ...winnerRegister(current, incoming),
        clock: joinAddressOfflineCrdtClocks(current.clock, incoming.clock),
      },
      conflicts: [],
    };
  }

  const winner = winnerRegister(current, incoming);
  return {
    register: {
      ...winner,
      clock: joinAddressOfflineCrdtClocks(current.clock, incoming.clock),
    },
    conflicts: [buildConflict({
      entityId,
      conflictType: 'concurrent-field-write',
      field: incoming.field,
      leftOperationId: current.operationId,
      rightOperationId: incoming.operationId,
      winningOperationId: winner.operationId,
      detectedAt: new Date(Math.max(Date.parse(current.updatedAt), Date.parse(incoming.updatedAt))).toISOString(),
    })],
  };
}

function setMemberVisible(member: AddressOfflineCrdtSetMember) {
  const removed = new Set(member.removeTags);
  return member.addTags.some(tag => !removed.has(tag));
}

export function getAddressOfflineCrdtVisibleSetMembers(
  state: AddressOfflineCrdtState,
  setName: string,
) {
  const set = state.sets[cleanKey(setName)] || {};
  return Object.values(set)
    .filter(setMemberVisible)
    .sort((a, b) => a.memberId.localeCompare(b.memberId));
}

function applyRegisterOperation(
  state: AddressOfflineCrdtState,
  operation: AddressOfflineCrdtOperation,
) {
  const field = operation.field || '';
  const register: AddressOfflineCrdtRegister = {
    field,
    operationId: operation.operationId,
    actorId: operation.actorId,
    clock: operation.clock,
    updatedAt: operation.createdAt,
    ...(operation.publicValue !== undefined ? { publicValue: operation.publicValue } : {}),
    ...(operation.valueCommitment ? { valueCommitment: operation.valueCommitment } : {}),
    tombstone: operation.action === 'remove-field',
  };
  const result = mergeRegister(state.entityId, state.fields[field], register);
  state.fields[field] = result.register;
  state.conflicts = mergeConflictLists(state.conflicts, result.conflicts);
}

function applySetOperation(
  state: AddressOfflineCrdtState,
  operation: AddressOfflineCrdtOperation,
) {
  const setName = operation.setName || '';
  const memberId = operation.memberId || '';
  if (!state.sets[setName]) state.sets[setName] = {};
  const existing = state.sets[setName][memberId];

  if (existing && existing.memberCommitment !== operation.memberCommitment) {
    state.conflicts = mergeConflictLists(state.conflicts, [buildConflict({
      entityId: state.entityId,
      conflictType: 'set-member-commitment-mismatch',
      setName,
      memberId,
      leftOperationId: existing.addTags[0],
      rightOperationId: operation.operationId,
      detectedAt: operation.createdAt,
    })]);
  }

  const addTags = new Set(existing?.addTags || []);
  const removeTags = new Set(existing?.removeTags || []);
  if (operation.action === 'add-set-member') {
    addTags.add(operation.operationId);
  } else {
    const observed = operation.observedAddTags?.length
      ? operation.observedAddTags
      : existing?.addTags || [];
    for (const tag of observed) removeTags.add(tag);
  }

  state.sets[setName][memberId] = {
    setName,
    memberId,
    memberCommitment: existing?.memberCommitment || operation.memberCommitment || '',
    addTags: Array.from(addTags).sort(),
    removeTags: Array.from(removeTags).sort(),
    clock: joinAddressOfflineCrdtClocks(existing?.clock, operation.clock),
    updatedAt: existing && Date.parse(existing.updatedAt) > Date.parse(operation.createdAt)
      ? existing.updatedAt
      : operation.createdAt,
  };
}

function assertSameEntity(
  state: AddressOfflineCrdtState,
  operation: AddressOfflineCrdtOperation,
) {
  if (state.entityId !== operation.entityId || state.entityKind !== operation.entityKind || state.domain !== operation.domain) {
    throw new Error('offline CRDT operation entity metadata does not match state');
  }
}

export function applyAddressOfflineCrdtOperation(
  state: AddressOfflineCrdtState | undefined,
  operation: AddressOfflineCrdtOperation,
) {
  const next = state
    ? cloneState(state)
    : createAddressOfflineCrdtState({
      entityId: operation.entityId,
      entityKind: operation.entityKind,
      domain: operation.domain,
      now: operation.createdAt,
    });
  assertSameEntity(next, operation);
  next.clock = joinAddressOfflineCrdtClocks(next.clock, operation.clock);
  next.updatedAt = Date.parse(next.updatedAt) > Date.parse(operation.createdAt) ? next.updatedAt : operation.createdAt;

  if (operation.action === 'upsert-field' || operation.action === 'remove-field') {
    applyRegisterOperation(next, operation);
  } else if (operation.action === 'add-set-member' || operation.action === 'remove-set-member') {
    applySetOperation(next, operation);
  } else if (operation.action === 'tombstone-entity') {
    const tombstoneRegister: AddressOfflineCrdtRegister = {
      field: '__entity__',
      operationId: operation.operationId,
      actorId: operation.actorId,
      clock: operation.clock,
      updatedAt: operation.createdAt,
      ...(operation.valueCommitment ? { valueCommitment: operation.valueCommitment } : {}),
      tombstone: true,
    };
    const result = mergeRegister(next.entityId, next.tombstone, tombstoneRegister);
    next.tombstone = result.register;
    next.conflicts = mergeConflictLists(next.conflicts, result.conflicts);
  }

  return next;
}

export function mergeAddressOfflineCrdtStates(
  left: AddressOfflineCrdtState,
  right: AddressOfflineCrdtState,
) {
  if (left.entityId !== right.entityId || left.entityKind !== right.entityKind || left.domain !== right.domain) {
    const detectedAt = new Date(Math.max(Date.parse(left.updatedAt), Date.parse(right.updatedAt))).toISOString();
    const base = cloneState(left);
    base.conflicts = mergeConflictLists(base.conflicts, right.conflicts, [buildConflict({
      entityId: left.entityId,
      conflictType: 'entity-metadata-mismatch',
      detectedAt,
    })]);
    return base;
  }

  const merged = cloneState(left);
  merged.clock = joinAddressOfflineCrdtClocks(left.clock, right.clock);
  merged.updatedAt = Date.parse(left.updatedAt) > Date.parse(right.updatedAt) ? left.updatedAt : right.updatedAt;
  merged.conflicts = mergeConflictLists(left.conflicts, right.conflicts);

  for (const [field, register] of Object.entries(right.fields)) {
    const result = mergeRegister(merged.entityId, merged.fields[field], register);
    merged.fields[field] = result.register;
    merged.conflicts = mergeConflictLists(merged.conflicts, result.conflicts);
  }

  if (right.tombstone) {
    const result = mergeRegister(merged.entityId, merged.tombstone, right.tombstone);
    merged.tombstone = result.register;
    merged.conflicts = mergeConflictLists(merged.conflicts, result.conflicts);
  }

  for (const [setName, members] of Object.entries(right.sets)) {
    if (!merged.sets[setName]) merged.sets[setName] = {};
    for (const [memberId, member] of Object.entries(members)) {
      const existing = merged.sets[setName][memberId];
      if (existing && existing.memberCommitment !== member.memberCommitment) {
        merged.conflicts = mergeConflictLists(merged.conflicts, [buildConflict({
          entityId: merged.entityId,
          conflictType: 'set-member-commitment-mismatch',
          setName,
          memberId,
          leftOperationId: existing.addTags[0],
          rightOperationId: member.addTags[0],
          detectedAt: merged.updatedAt,
        })]);
      }
      merged.sets[setName][memberId] = {
        setName,
        memberId,
        memberCommitment: existing?.memberCommitment || member.memberCommitment,
        addTags: Array.from(new Set([...(existing?.addTags || []), ...member.addTags])).sort(),
        removeTags: Array.from(new Set([...(existing?.removeTags || []), ...member.removeTags])).sort(),
        clock: joinAddressOfflineCrdtClocks(existing?.clock, member.clock),
        updatedAt: existing && Date.parse(existing.updatedAt) > Date.parse(member.updatedAt)
          ? existing.updatedAt
          : member.updatedAt,
      };
    }
  }

  return merged;
}

export function buildAddressOfflineSyncEnvelope(
  state: AddressOfflineCrdtState,
): AddressOfflineSyncEnvelope {
  const sets = Object.fromEntries(Object.entries(state.sets).map(([setName, members]) => [
    setName,
    Object.values(members)
      .sort((a, b) => a.memberId.localeCompare(b.memberId))
      .map(member => ({
        setName: member.setName,
        memberId: member.memberId,
        memberCommitment: member.memberCommitment,
        addTags: member.addTags,
        removeTags: member.removeTags,
        clock: member.clock,
        updatedAt: member.updatedAt,
      })),
  ]));

  return {
    modelVersion: ADDRESS_OFFLINE_SYNC_CRDT_VERSION,
    entityId: state.entityId,
    entityKind: state.entityKind,
    domain: state.domain,
    clock: state.clock,
    fields: state.fields,
    sets,
    conflicts: state.conflicts,
    updatedAt: state.updatedAt,
    privacy: {
      ...privacyFlags(),
      publicSyncMaterial: 'public-values-and-commitments-only',
    },
  };
}

export function summarizeAddressOfflineCrdtState(state: AddressOfflineCrdtState) {
  const visibleMembers = Object.fromEntries(Object.keys(state.sets).map(setName => [
    setName,
    getAddressOfflineCrdtVisibleSetMembers(state, setName).length,
  ]));
  return {
    modelVersion: ADDRESS_OFFLINE_SYNC_CRDT_VERSION,
    entityId: state.entityId,
    entityKind: state.entityKind,
    domain: state.domain,
    fieldCount: Object.values(state.fields).filter(field => !field.tombstone).length,
    tombstonedFieldCount: Object.values(state.fields).filter(field => field.tombstone).length,
    setMemberCount: visibleMembers,
    conflictCount: state.conflicts.length,
    auditRequired: state.conflicts.length > 0,
    clock: state.clock,
    updatedAt: state.updatedAt,
    ...privacyFlags(),
  };
}
