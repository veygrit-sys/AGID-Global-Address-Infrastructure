import {
  addSecondsToIso,
  cleanBoolean,
  cleanNonNegativeInteger,
  cleanNumber,
  cleanText,
  cleanTextArray,
  stableCommitment,
  stableId,
  stableJson,
  toIsoTimestamp,
} from './redactedWorkflowCore';

export const TABLE_VERSION = 'table-v1';

export const TABLE_SESSION_STATUSES = [
  'open',
  'needs-staff',
  'checkout',
  'closed',
  'expired',
] as const;

export const TABLE_ORDER_STATUSES = [
  'draft',
  'submitted',
  'accepted',
  'preparing',
  'ready',
  'served',
  'cancelled',
  'requires-review',
] as const;

export const TABLE_KDS_STATUSES = [
  'new',
  'preparing',
  'ready',
  'served',
  'cancelled',
] as const;

export const TABLE_PAYMENT_STATUSES = [
  'unpaid',
  'authorized',
  'paid',
  'refunded',
  'voided',
] as const;

export const TABLE_POS_SYNC_STATUSES = [
  'pending',
  'synced',
  'failed',
  'offline',
  'disabled',
] as const;

export type TableSessionStatus = typeof TABLE_SESSION_STATUSES[number];
export type TableOrderStatus = typeof TABLE_ORDER_STATUSES[number];
export type TableKdsStatus = typeof TABLE_KDS_STATUSES[number];
export type TablePaymentStatus = typeof TABLE_PAYMENT_STATUSES[number];
export type TablePosSyncStatus = typeof TABLE_POS_SYNC_STATUSES[number];
export type TableInventoryStatus = 'in-stock' | 'low-stock' | 'sold-out' | 'unknown';
export type TableMenuAvailability = 'available' | 'limited' | 'sold-out' | 'hidden';
export type TableLineStatus = 'accepted' | 'unavailable' | 'needs-review';

export type TableLanguageMap = Record<string, string>;

export type TablePrivacyBoundary = {
  rawCustomerNameStored: false;
  rawPhoneStored: false;
  rawAddressStored: false;
  rawPaymentCredentialStored: false;
  qrTokenStoredAsCommitment: true;
  specialInstructionsPrivateMaterialRedacted: boolean;
};

export type TableSessionInput = {
  sessionId?: unknown;
  tableId?: unknown;
  locationId?: unknown;
  qrToken?: unknown;
  guestCount?: unknown;
  language?: unknown;
  status?: unknown;
  openedAt?: unknown;
  ttlSeconds?: unknown;
  staffRequested?: unknown;
};

export type TableSession = {
  modelVersion: typeof TABLE_VERSION;
  sessionId: string;
  tableId: string;
  locationId: string;
  qrSessionRef: string;
  guestCount: number;
  language: string;
  status: TableSessionStatus;
  openedAt: string;
  expiresAt: string;
  warnings: string[];
  privacy: TablePrivacyBoundary;
};

export type TableMenuCategoryInput = {
  categoryId?: unknown;
  name?: unknown;
  names?: unknown;
  sortOrder?: unknown;
  active?: unknown;
};

export type TableMenuCategory = {
  categoryId: string;
  name: TableLanguageMap;
  displayName: string;
  sortOrder: number;
  active: boolean;
};

export type TableModifierInput = {
  modifierId?: unknown;
  name?: unknown;
  names?: unknown;
  price?: unknown;
  active?: unknown;
};

export type TableModifier = {
  modifierId: string;
  name: TableLanguageMap;
  displayName: string;
  price: number;
  active: boolean;
};

export type TableInventoryInput = {
  itemId?: unknown;
  locationId?: unknown;
  stockQuantity?: unknown;
  reservedQuantity?: unknown;
  lowStockThreshold?: unknown;
  ecommerceQuantity?: unknown;
  ecommerceListed?: unknown;
  lastSyncedAt?: unknown;
};

export type TableInventorySnapshot = {
  itemId: string;
  locationId: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  ecommerceQuantity: number;
  ecommerceListed: boolean;
  lastSyncedAt?: string;
  status: TableInventoryStatus;
};

export type TableMenuItemInput = {
  itemId?: unknown;
  categoryId?: unknown;
  name?: unknown;
  names?: unknown;
  description?: unknown;
  descriptions?: unknown;
  price?: unknown;
  taxRate?: unknown;
  active?: unknown;
  imageRef?: unknown;
  allergens?: unknown;
  dietaryTags?: unknown;
  modifiers?: unknown;
};

export type TableMenuItem = {
  itemId: string;
  categoryId: string;
  name: TableLanguageMap;
  displayName: string;
  description: TableLanguageMap;
  displayDescription: string;
  price: number;
  taxRate: number;
  active: boolean;
  imageRef?: string;
  allergens: string[];
  dietaryTags: string[];
  modifiers: TableModifier[];
  inventory?: TableInventorySnapshot;
  availability: TableMenuAvailability;
  availableQuantity: number;
  canOrder: boolean;
  warnings: string[];
};

export type TableMenuInput = {
  language?: unknown;
  locationId?: unknown;
  categories?: unknown;
  items?: unknown;
  inventory?: unknown;
  updatedAt?: unknown;
};

export type TableMenu = {
  modelVersion: typeof TABLE_VERSION;
  language: string;
  locationId: string;
  updatedAt: string;
  categories: TableMenuCategory[];
  items: TableMenuItem[];
  warnings: string[];
};

export type TableCartLineInput = {
  lineId?: unknown;
  itemId?: unknown;
  quantity?: unknown;
  modifierIds?: unknown;
  specialInstructions?: unknown;
};

export type TableOrderLine = {
  lineId: string;
  itemId: string;
  displayName: string;
  quantity: number;
  modifierIds: string[];
  modifierNames: string[];
  unitPrice: number;
  subtotal: number;
  tax: number;
  status: TableLineStatus;
  specialInstructions?: string;
  warnings: string[];
};

export type TablePosSync = {
  status: TablePosSyncStatus;
  endpointRef?: string;
  payloadCommitment: string;
  lastAttemptAt?: string;
  warnings: string[];
};

export type TableInventoryReservation = {
  itemId: string;
  quantity: number;
  reservationCommitment: string;
};

export type TableKitchenTicketLine = {
  lineId: string;
  itemId: string;
  displayName: string;
  quantity: number;
  modifierNames: string[];
  specialInstructions?: string;
};

export type TableKitchenTicket = {
  ticketId: string;
  orderId: string;
  tableId: string;
  station: string;
  status: TableKdsStatus;
  priority: number;
  submittedAt: string;
  elapsedMinutes: number;
  lines: TableKitchenTicketLine[];
  warnings: string[];
};

export type TableOrderInput = {
  orderId?: unknown;
  session?: TableSession | TableSessionInput;
  menu?: TableMenu;
  menuItems?: unknown;
  inventory?: unknown;
  cartLines?: unknown;
  language?: unknown;
  taxRate?: unknown;
  serviceChargeRate?: unknown;
  paymentStatus?: unknown;
  orderStatus?: unknown;
  priority?: unknown;
  submittedAt?: unknown;
  posEndpointRef?: unknown;
  posSyncStatus?: unknown;
  offline?: unknown;
  station?: unknown;
};

export type TableOrder = {
  modelVersion: typeof TABLE_VERSION;
  orderId: string;
  sessionId: string;
  tableId: string;
  locationId: string;
  language: string;
  status: TableOrderStatus;
  paymentStatus: TablePaymentStatus;
  priority: number;
  submittedAt: string;
  lines: TableOrderLine[];
  subtotal: number;
  taxTotal: number;
  serviceCharge: number;
  total: number;
  posSync: TablePosSync;
  inventoryReservations: TableInventoryReservation[];
  kdsTicket: TableKitchenTicket;
  warnings: string[];
  privacy: TablePrivacyBoundary;
};

export type TableKitchenDisplayInput = {
  orders?: unknown;
  now?: unknown;
  statuses?: unknown;
  station?: unknown;
};

export type TableKitchenDisplay = {
  modelVersion: typeof TABLE_VERSION;
  generatedAt: string;
  station: string;
  tickets: TableKitchenTicket[];
  summary: {
    new: number;
    preparing: number;
    ready: number;
    served: number;
    cancelled: number;
    urgent: number;
  };
};

export type TableAdminDashboardInput = {
  sessions?: unknown;
  orders?: unknown;
  inventory?: unknown;
  locations?: unknown;
  now?: unknown;
};

export type TableAdminDashboard = {
  modelVersion: typeof TABLE_VERSION;
  generatedAt: string;
  metrics: {
    activeSessions: number;
    openOrders: number;
    kdsQueue: number;
    revenue: number;
    averageTicket: number;
    lowStockItems: number;
    ecommerceSellableItems: number;
    pendingPosSync: number;
    supportRequests: number;
    locationCount: number;
  };
  recommendedActions: string[];
  privacy: {
    customerPersonalDataRequired: false;
    rawPaymentDataRequired: false;
    staffOperationalDataOnly: true;
  };
};

const PRIVATE_VALUE_RE = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s().-]{7,}\d|(?:AGID|AOID)[-:\s]?[A-Z0-9]{6,}|(?:\d{1,3}\.){3}\d{1,3})/i;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function oneOf<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]): T[number] {
  const text = cleanText(value).toLowerCase();
  return values.includes(text) ? text as T[number] : fallback;
}

function normalizeLanguage(value: unknown, fallback = 'en') {
  const text = cleanText(value, fallback, 24).replace('_', '-');
  return text || fallback;
}

function normalizeMoney(value: unknown, fallback = 0) {
  return Math.round(Math.max(0, cleanNumber(value, fallback)) * 100) / 100;
}

function normalizeRate(value: unknown, fallback = 0) {
  return Math.max(0, Math.min(1, cleanNumber(value, fallback)));
}

function containsPrivateMaterial(value: unknown) {
  return PRIVATE_VALUE_RE.test(stableJson(value));
}

function publicRef(prefix: string, value: unknown, fallbackSeed: unknown) {
  const text = cleanText(value, '', 96);
  if (text && !containsPrivateMaterial(text)) return text;
  return stableId(prefix, { value: text || fallbackSeed, version: TABLE_VERSION }, { length: 12 });
}

function languageMap(primary: unknown, localized: unknown, fallback = 'Untitled'): TableLanguageMap {
  const map: TableLanguageMap = {};
  const localizedRecord = asRecord(localized);
  for (const [key, value] of Object.entries(localizedRecord)) {
    const lang = normalizeLanguage(key);
    const text = cleanText(value, '', 160);
    if (lang && text) map[lang] = text;
  }

  const primaryText = cleanText(primary, '', 160);
  if (primaryText && !map.en) map.en = primaryText;
  if (!Object.keys(map).length) map.en = fallback;
  return map;
}

function chooseLocalizedText(map: TableLanguageMap, language: string) {
  const normalized = normalizeLanguage(language);
  const base = normalized.split('-')[0];
  return map[normalized] ?? map[base] ?? map.en ?? Object.values(map)[0] ?? '';
}

function redactInstruction(value: unknown, warnings: string[]) {
  const text = cleanText(value, '', 240);
  if (!text) return undefined;
  if (!containsPrivateMaterial(text)) return text;
  warnings.push('special-instructions-redacted-private-material');
  return 'redacted-private-instruction';
}

function buildPrivacy(privateMaterialRedacted: boolean): TablePrivacyBoundary {
  return {
    rawCustomerNameStored: false,
    rawPhoneStored: false,
    rawAddressStored: false,
    rawPaymentCredentialStored: false,
    qrTokenStoredAsCommitment: true,
    specialInstructionsPrivateMaterialRedacted: privateMaterialRedacted,
  };
}

function normalizeInventory(input: unknown, locationIdFallback: string): TableInventorySnapshot {
  const record = asRecord(input);
  const itemId = publicRef('item', record.itemId, record);
  const stockQuantity = cleanNonNegativeInteger(record.stockQuantity, 0);
  const reservedQuantity = Math.min(stockQuantity, cleanNonNegativeInteger(record.reservedQuantity, 0));
  const availableQuantity = Math.max(0, stockQuantity - reservedQuantity);
  const lowStockThreshold = cleanNonNegativeInteger(record.lowStockThreshold, 3);
  const status: TableInventoryStatus = stockQuantity === 0
    ? 'sold-out'
    : availableQuantity <= lowStockThreshold
      ? 'low-stock'
      : 'in-stock';

  return {
    itemId,
    locationId: publicRef('loc', record.locationId, locationIdFallback),
    stockQuantity,
    reservedQuantity,
    availableQuantity,
    lowStockThreshold,
    ecommerceQuantity: Math.min(availableQuantity, cleanNonNegativeInteger(record.ecommerceQuantity, 0)),
    ecommerceListed: cleanBoolean(record.ecommerceListed, false),
    lastSyncedAt: record.lastSyncedAt ? toIsoTimestamp(record.lastSyncedAt) : undefined,
    status,
  };
}

function normalizeCategory(input: unknown, language: string, index: number): TableMenuCategory {
  const record = asRecord(input);
  const categoryId = publicRef('cat', record.categoryId, { record, index });
  const name = languageMap(record.name, record.names, 'Menu');
  return {
    categoryId,
    name,
    displayName: chooseLocalizedText(name, language),
    sortOrder: cleanNonNegativeInteger(record.sortOrder, index),
    active: cleanBoolean(record.active, true),
  };
}

function normalizeModifier(input: unknown, language: string, index: number): TableModifier {
  const record = asRecord(input);
  const modifierId = publicRef('mod', record.modifierId, { record, index });
  const name = languageMap(record.name, record.names, 'Option');
  return {
    modifierId,
    name,
    displayName: chooseLocalizedText(name, language),
    price: normalizeMoney(record.price, 0),
    active: cleanBoolean(record.active, true),
  };
}

function normalizeMenuItem(
  input: unknown,
  language: string,
  inventoryByItemId: Map<string, TableInventorySnapshot>,
  index: number,
): TableMenuItem {
  const record = asRecord(input);
  const itemId = publicRef('item', record.itemId, { record, index });
  const categoryId = publicRef('cat', record.categoryId, 'uncategorized');
  const name = languageMap(record.name, record.names, 'Menu item');
  const description = languageMap(record.description, record.descriptions, '');
  const active = cleanBoolean(record.active, true);
  const inventory = inventoryByItemId.get(itemId);
  const availableQuantity = inventory?.availableQuantity ?? Number.POSITIVE_INFINITY;
  const warnings: string[] = [];
  let availability: TableMenuAvailability = 'available';

  if (!active) availability = 'hidden';
  else if (inventory && inventory.availableQuantity === 0) availability = 'sold-out';
  else if (inventory?.status === 'low-stock') availability = 'limited';

  if (availability === 'sold-out') warnings.push('inventory-sold-out');
  if (availability === 'limited') warnings.push('inventory-low-stock');
  if (availability === 'hidden') warnings.push('item-hidden');

  return {
    itemId,
    categoryId,
    name,
    displayName: chooseLocalizedText(name, language),
    description,
    displayDescription: chooseLocalizedText(description, language),
    price: normalizeMoney(record.price, 0),
    taxRate: normalizeRate(record.taxRate, 0.1),
    active,
    imageRef: cleanText(record.imageRef, '', 240) || undefined,
    allergens: cleanTextArray(record.allergens).map(item => item.toLowerCase()),
    dietaryTags: cleanTextArray(record.dietaryTags).map(item => item.toLowerCase()),
    modifiers: asArray(record.modifiers).map((modifier, modifierIndex) => normalizeModifier(modifier, language, modifierIndex)),
    inventory,
    availability,
    availableQuantity: Number.isFinite(availableQuantity) ? availableQuantity : 999999,
    canOrder: active && availability !== 'sold-out' && availability !== 'hidden',
    warnings,
  };
}

function normalizeSessionLike(input: TableSession | TableSessionInput | undefined, languageFallback: unknown): TableSession {
  if (input && asRecord(input).modelVersion === TABLE_VERSION) return input as TableSession;
  return createTableSession({ ...(asRecord(input)), language: asRecord(input).language ?? languageFallback });
}

function normalizeOrderLike(input: unknown): TableOrder | undefined {
  const record = asRecord(input);
  return record.modelVersion === TABLE_VERSION ? input as TableOrder : undefined;
}

function cloneTicket(ticket: TableKitchenTicket, generatedAt: string): TableKitchenTicket {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((new Date(generatedAt).getTime() - new Date(ticket.submittedAt).getTime()) / 60000),
  );
  return { ...ticket, elapsedMinutes };
}

export function createTableSession(input: TableSessionInput = {}): TableSession {
  const openedAt = toIsoTimestamp(input.openedAt);
  const ttlSeconds = Math.max(60, cleanNonNegativeInteger(input.ttlSeconds, 60 * 60 * 3));
  const tableId = publicRef('tbl', input.tableId, { input, openedAt });
  const locationId = publicRef('loc', input.locationId, 'default-location');
  const sessionId = publicRef('sess', input.sessionId, { tableId, locationId, openedAt });
  const warnings: string[] = [];

  if (containsPrivateMaterial(input.qrToken)) warnings.push('qr-token-stored-as-commitment');

  const requestedStatus = oneOf(input.status, TABLE_SESSION_STATUSES, 'open');
  const status = cleanBoolean(input.staffRequested, false) ? 'needs-staff' : requestedStatus;

  return {
    modelVersion: TABLE_VERSION,
    sessionId,
    tableId,
    locationId,
    qrSessionRef: stableCommitment('table.qr', {
      qrToken: input.qrToken ?? sessionId,
      tableId,
      openedAt,
      version: TABLE_VERSION,
    }, { length: 32 }),
    guestCount: Math.max(1, cleanNonNegativeInteger(input.guestCount, 1)),
    language: normalizeLanguage(input.language, 'en'),
    status,
    openedAt,
    expiresAt: addSecondsToIso(openedAt, ttlSeconds),
    warnings,
    privacy: buildPrivacy(false),
  };
}

export function buildTableMenu(input: TableMenuInput = {}): TableMenu {
  const language = normalizeLanguage(input.language, 'en');
  const locationId = publicRef('loc', input.locationId, 'default-location');
  const updatedAt = toIsoTimestamp(input.updatedAt);
  const inventory = asArray(input.inventory).map(item => normalizeInventory(item, locationId));
  const inventoryByItemId = new Map(inventory.map(item => [item.itemId, item]));
  const categories = asArray(input.categories)
    .map((category, index) => normalizeCategory(category, language, index))
    .filter(category => category.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName));
  const items = asArray(input.items)
    .map((item, index) => normalizeMenuItem(item, language, inventoryByItemId, index))
    .filter(item => item.availability !== 'hidden');
  const categoryIds = new Set(categories.map(category => category.categoryId));
  const warnings = items
    .filter(item => !categoryIds.has(item.categoryId))
    .map(item => `item-category-missing:${item.itemId}`);

  return {
    modelVersion: TABLE_VERSION,
    language,
    locationId,
    updatedAt,
    categories,
    items,
    warnings,
  };
}

export function createTableOrder(input: TableOrderInput = {}): TableOrder {
  const submittedAt = toIsoTimestamp(input.submittedAt);
  const session = normalizeSessionLike(input.session, input.language);
  const language = normalizeLanguage(input.language, session.language);
  const menu = input.menu ?? buildTableMenu({
    items: input.menuItems,
    inventory: input.inventory,
    language,
    locationId: session.locationId,
    updatedAt: submittedAt,
  });
  const menuByItemId = new Map(menu.items.map(item => [item.itemId, item]));
  const orderId = publicRef('order', input.orderId, { sessionId: session.sessionId, submittedAt, lines: input.cartLines });
  const warnings: string[] = [];
  const selectedLines = asArray(input.cartLines).map((lineInput, index) => {
    const lineRecord = asRecord(lineInput);
    const itemId = publicRef('item', lineRecord.itemId, { lineRecord, index });
    const item = menuByItemId.get(itemId);
    const lineWarnings: string[] = [];
    const quantity = Math.max(1, cleanNonNegativeInteger(lineRecord.quantity, 1));
    const modifierIds = cleanTextArray(lineRecord.modifierIds).map(modifierId => publicRef('mod', modifierId, modifierId));
    const activeModifiers = item?.modifiers.filter(modifier => modifier.active && modifierIds.includes(modifier.modifierId)) ?? [];
    const missingModifiers = modifierIds.filter(modifierId => !activeModifiers.some(modifier => modifier.modifierId === modifierId));
    if (!item) lineWarnings.push('menu-item-missing');
    if (item && !item.canOrder) lineWarnings.push(`menu-item-${item.availability}`);
    if (missingModifiers.length) lineWarnings.push('modifier-missing-or-inactive');

    const instructionWarnings: string[] = [];
    const specialInstructions = redactInstruction(lineRecord.specialInstructions, instructionWarnings);
    lineWarnings.push(...instructionWarnings);

    const status: TableLineStatus = !item || !item.canOrder ? 'unavailable' : lineWarnings.includes('modifier-missing-or-inactive') ? 'needs-review' : 'accepted';
    const unitPrice = item ? normalizeMoney(item.price + activeModifiers.reduce((total, modifier) => total + modifier.price, 0), 0) : 0;
    const subtotal = status === 'unavailable' ? 0 : normalizeMoney(unitPrice * quantity, 0);
    const taxRate = item?.taxRate ?? normalizeRate(input.taxRate, 0.1);

    return {
      lineId: publicRef('line', lineRecord.lineId, { orderId, index, itemId }),
      itemId,
      displayName: item?.displayName ?? 'Unavailable item',
      quantity,
      modifierIds: activeModifiers.map(modifier => modifier.modifierId),
      modifierNames: activeModifiers.map(modifier => modifier.displayName),
      unitPrice,
      subtotal,
      tax: normalizeMoney(subtotal * taxRate, 0),
      status,
      specialInstructions,
      warnings: lineWarnings,
    } satisfies TableOrderLine;
  });

  const lines = selectedLines.filter(line => line.quantity > 0);
  const acceptedLines = lines.filter(line => line.status !== 'unavailable');
  const subtotal = normalizeMoney(acceptedLines.reduce((total, line) => total + line.subtotal, 0), 0);
  const taxTotal = normalizeMoney(acceptedLines.reduce((total, line) => total + line.tax, 0), 0);
  const serviceCharge = normalizeMoney(subtotal * normalizeRate(input.serviceChargeRate, 0), 0);
  const total = normalizeMoney(subtotal + taxTotal + serviceCharge, 0);
  const privateMaterialRedacted = lines.some(line => line.warnings.includes('special-instructions-redacted-private-material'));
  if (!lines.length) warnings.push('order-empty');
  if (lines.some(line => line.status === 'unavailable')) warnings.push('order-has-unavailable-lines');
  if (lines.some(line => line.status === 'needs-review')) warnings.push('order-needs-review');
  if (privateMaterialRedacted) warnings.push('private-material-redacted');

  const status = !acceptedLines.length
    ? 'requires-review'
    : oneOf(input.orderStatus, TABLE_ORDER_STATUSES, 'submitted');
  const paymentStatus = oneOf(input.paymentStatus, TABLE_PAYMENT_STATUSES, 'unpaid');
  const priority = cleanNonNegativeInteger(input.priority, 1);
  const station = cleanText(input.station, 'main-kitchen', 64);
  const inventoryReservations = acceptedLines.map(line => ({
    itemId: line.itemId,
    quantity: line.quantity,
    reservationCommitment: stableCommitment('table.inventory.reservation', {
      orderId,
      lineId: line.lineId,
      itemId: line.itemId,
      quantity: line.quantity,
      submittedAt,
    }, { length: 32 }),
  }));
  const payloadCommitment = stableCommitment('table.pos.payload', {
    orderId,
    sessionId: session.sessionId,
    lineCount: acceptedLines.length,
    subtotal,
    taxTotal,
    serviceCharge,
    total,
    paymentStatus,
    submittedAt,
  }, { length: 32 });
  const posStatus = cleanBoolean(input.offline, false)
    ? 'offline'
    : oneOf(input.posSyncStatus, TABLE_POS_SYNC_STATUSES, 'pending');
  const posSync: TablePosSync = {
    status: posStatus,
    endpointRef: cleanText(input.posEndpointRef, '', 160) || undefined,
    payloadCommitment,
    lastAttemptAt: posStatus === 'pending' ? undefined : submittedAt,
    warnings: posStatus === 'offline' ? ['offline-sync-required'] : [],
  };
  const kdsTicket: TableKitchenTicket = {
    ticketId: stableId('kds', { orderId, station, submittedAt }, { length: 12 }),
    orderId,
    tableId: session.tableId,
    station,
    status: status === 'cancelled' ? 'cancelled' : 'new',
    priority,
    submittedAt,
    elapsedMinutes: 0,
    lines: acceptedLines.map(line => ({
      lineId: line.lineId,
      itemId: line.itemId,
      displayName: line.displayName,
      quantity: line.quantity,
      modifierNames: line.modifierNames,
      specialInstructions: line.specialInstructions,
    })),
    warnings: acceptedLines.length ? [] : ['no-kitchen-lines'],
  };

  return {
    modelVersion: TABLE_VERSION,
    orderId,
    sessionId: session.sessionId,
    tableId: session.tableId,
    locationId: session.locationId,
    language,
    status,
    paymentStatus,
    priority,
    submittedAt,
    lines,
    subtotal,
    taxTotal,
    serviceCharge,
    total,
    posSync,
    inventoryReservations,
    kdsTicket,
    warnings,
    privacy: buildPrivacy(privateMaterialRedacted),
  };
}

export function buildKitchenDisplay(input: TableKitchenDisplayInput = {}): TableKitchenDisplay {
  const generatedAt = toIsoTimestamp(input.now);
  const station = cleanText(input.station, 'all', 64);
  const statuses = new Set(cleanTextArray(input.statuses).map(status => oneOf(status, TABLE_KDS_STATUSES, 'new')));
  const tickets = asArray(input.orders)
    .map(normalizeOrderLike)
    .filter((order): order is TableOrder => Boolean(order))
    .map(order => cloneTicket(order.kdsTicket, generatedAt))
    .filter(ticket => station === 'all' || ticket.station === station)
    .filter(ticket => !statuses.size || statuses.has(ticket.status))
    .sort((a, b) => b.priority - a.priority || b.elapsedMinutes - a.elapsedMinutes || a.submittedAt.localeCompare(b.submittedAt));
  const summary = {
    new: 0,
    preparing: 0,
    ready: 0,
    served: 0,
    cancelled: 0,
    urgent: 0,
  };
  tickets.forEach(ticket => {
    summary[ticket.status] += 1;
    if (ticket.elapsedMinutes >= 15 || ticket.priority >= 5) summary.urgent += 1;
  });

  return {
    modelVersion: TABLE_VERSION,
    generatedAt,
    station,
    tickets,
    summary,
  };
}

export function buildTableDashboard(input: TableAdminDashboardInput = {}): TableAdminDashboard {
  const generatedAt = toIsoTimestamp(input.now);
  const sessions = asArray(input.sessions).filter((session): session is TableSession => asRecord(session).modelVersion === TABLE_VERSION);
  const orders = asArray(input.orders).map(normalizeOrderLike).filter((order): order is TableOrder => Boolean(order));
  const inventory = asArray(input.inventory).map(item => normalizeInventory(item, 'dashboard'));
  const locations = cleanTextArray(input.locations).map(location => publicRef('loc', location, location));
  const openOrderStatuses = new Set<TableOrderStatus>(['submitted', 'accepted', 'preparing', 'ready', 'requires-review']);
  const paidOrServedOrders = orders.filter(order => ['paid', 'authorized'].includes(order.paymentStatus) || order.status === 'served');
  const revenue = normalizeMoney(paidOrServedOrders.reduce((total, order) => total + order.total, 0), 0);
  const activeSessions = sessions.filter(session => ['open', 'needs-staff', 'checkout'].includes(session.status)).length;
  const openOrders = orders.filter(order => openOrderStatuses.has(order.status)).length;
  const lowStockItems = inventory.filter(item => item.status === 'low-stock' || item.status === 'sold-out').length;
  const pendingPosSync = orders.filter(order => ['pending', 'failed', 'offline'].includes(order.posSync.status)).length;
  const supportRequests = sessions.filter(session => session.status === 'needs-staff').length;
  const kdsQueue = orders.filter(order => ['new', 'preparing', 'ready'].includes(order.kdsTicket.status)).length;
  const recommendedActions: string[] = [];

  if (pendingPosSync) recommendedActions.push('review-pos-sync-queue');
  if (lowStockItems) recommendedActions.push('sync-menu-inventory');
  if (supportRequests) recommendedActions.push('dispatch-floor-staff');
  if (orders.some(order => order.status === 'requires-review')) recommendedActions.push('review-blocked-orders');

  return {
    modelVersion: TABLE_VERSION,
    generatedAt,
    metrics: {
      activeSessions,
      openOrders,
      kdsQueue,
      revenue,
      averageTicket: paidOrServedOrders.length ? normalizeMoney(revenue / paidOrServedOrders.length, 0) : 0,
      lowStockItems,
      ecommerceSellableItems: inventory.filter(item => item.ecommerceListed && item.ecommerceQuantity > 0).length,
      pendingPosSync,
      supportRequests,
      locationCount: Math.max(locations.length, new Set(sessions.map(session => session.locationId)).size),
    },
    recommendedActions,
    privacy: {
      customerPersonalDataRequired: false,
      rawPaymentDataRequired: false,
      staffOperationalDataOnly: true,
    },
  };
}
