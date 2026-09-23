import { sha256Hex } from './sha256';

export const VEY_WORKSPACE_VERSION = 'agid-vey-workspace-b2b-operations-v1';

export const VEY_WORKSPACE_STATUSES = ['ready', 'attention', 'blocked'] as const;
export const VEY_WORKSPACE_ORDER_STATUSES = [
  'draft',
  'received',
  'confirmed',
  'allocated',
  'partially-fulfilled',
  'fulfilled',
  'invoiced',
  'paid',
  'blocked',
] as const;
export const VEY_WORKSPACE_SHIPMENT_STATUSES = [
  'scheduled',
  'in-transit',
  'delivered',
  'exception',
  'blocked',
] as const;
export const VEY_WORKSPACE_INVOICE_STATUSES = [
  'draft',
  'sent',
  'partially-paid',
  'paid',
  'overdue',
  'disputed',
] as const;
export const VEY_WORKSPACE_COLLABORATION_PROVIDERS = ['slack', 'teams', 'email', 'webhook'] as const;

export type VeyWorkspaceStatus = typeof VEY_WORKSPACE_STATUSES[number];
export type VeyWorkspaceOrderStatus = typeof VEY_WORKSPACE_ORDER_STATUSES[number];
export type VeyWorkspaceShipmentStatus = typeof VEY_WORKSPACE_SHIPMENT_STATUSES[number];
export type VeyWorkspaceInvoiceStatus = typeof VEY_WORKSPACE_INVOICE_STATUSES[number];
export type VeyWorkspaceCollaborationProvider = typeof VEY_WORKSPACE_COLLABORATION_PROVIDERS[number];
export type VeyWorkspaceLocationType = 'warehouse' | 'store' | 'office' | 'fulfillment' | 'supplier' | 'cross-dock';
export type VeyWorkspaceTaskStatus = 'open' | 'in-progress' | 'blocked' | 'done';

export type VeyWorkspaceOrderLineInput = {
  skuId?: unknown;
  quantity?: unknown;
  unitPrice?: unknown;
  currency?: unknown;
};

export type VeyWorkspaceOrderInput = {
  orderId?: unknown;
  orderAlias?: unknown;
  channel?: unknown;
  status?: unknown;
  locationId?: unknown;
  supplierAlias?: unknown;
  partnerAlias?: unknown;
  requestedShipAt?: unknown;
  dueAt?: unknown;
  priority?: unknown;
  tradingIntentRef?: unknown;
  financeIntentRef?: unknown;
  addressCommitment?: unknown;
  lines?: unknown;
  rawAddress?: unknown;
  recipientName?: unknown;
  customerName?: unknown;
  phone?: unknown;
  email?: unknown;
  invoiceBody?: unknown;
};

export type VeyWorkspaceInventoryInput = {
  skuId?: unknown;
  locationId?: unknown;
  onHand?: unknown;
  allocated?: unknown;
  reorderPoint?: unknown;
  reorderQuantity?: unknown;
  unitCost?: unknown;
  currency?: unknown;
};

export type VeyWorkspaceShipmentInput = {
  shipmentId?: unknown;
  orderId?: unknown;
  carrierAlias?: unknown;
  trackingAlias?: unknown;
  status?: unknown;
  scheduledAt?: unknown;
  expectedDeliveredAt?: unknown;
  deliveredAt?: unknown;
  returnedAt?: unknown;
  cost?: unknown;
  currency?: unknown;
  regionId?: unknown;
  deliveryCommitment?: unknown;
  deliveryGatewayShipmentRef?: unknown;
  tradeGatewayIntentRef?: unknown;
  playlistCommerceIntentRef?: unknown;
  returnReasonAlias?: unknown;
  rawAddress?: unknown;
  recipientName?: unknown;
  phone?: unknown;
  email?: unknown;
};

export type VeyWorkspaceInvoiceInput = {
  invoiceId?: unknown;
  orderId?: unknown;
  status?: unknown;
  amountDue?: unknown;
  amountPaid?: unknown;
  currency?: unknown;
  dueAt?: unknown;
  sentAt?: unknown;
  financeIntentRef?: unknown;
  customerName?: unknown;
  email?: unknown;
  bankAccount?: unknown;
  cardPan?: unknown;
  invoiceBody?: unknown;
};

export type VeyWorkspaceLocationInput = {
  locationId?: unknown;
  label?: unknown;
  type?: unknown;
  country?: unknown;
  timezone?: unknown;
};

export type VeyWorkspaceChannelInput = {
  provider?: unknown;
  channelAlias?: unknown;
  status?: unknown;
  scopes?: unknown;
  webhookSecret?: unknown;
  rawWebhookUrl?: unknown;
};

export type VeyWorkspaceTaskInput = {
  taskId?: unknown;
  title?: unknown;
  status?: unknown;
  ownerRole?: unknown;
  dueAt?: unknown;
  relatedRef?: unknown;
};

export type VeyWorkspaceWorkflowInput = {
  workflowId?: unknown;
  trigger?: unknown;
  action?: unknown;
  active?: unknown;
};

export type VeyWorkspaceRoleInput = {
  role?: unknown;
  seats?: unknown;
  permissions?: unknown;
};

export type VeyWorkspaceInput = {
  id?: unknown;
  generatedAt?: unknown;
  organizationAlias?: unknown;
  autoGenerateInvoices?: unknown;
  locations?: unknown;
  orders?: unknown;
  inventory?: unknown;
  shipments?: unknown;
  invoices?: unknown;
  collaborationChannels?: unknown;
  tasks?: unknown;
  workflows?: unknown;
  roles?: unknown;
  auditLogEnabled?: unknown;
  backupEncrypted?: unknown;
  lastBackupAt?: unknown;
  retentionDays?: unknown;
  gdprExportEnabled?: unknown;
  deletionWorkflowEnabled?: unknown;
  rawAddress?: unknown;
  recipientName?: unknown;
  customerName?: unknown;
  phone?: unknown;
  email?: unknown;
  privateKey?: unknown;
  bankAccount?: unknown;
  cardPan?: unknown;
  invoiceBody?: unknown;
  contractBody?: unknown;
};

export type VeyWorkspaceLocation = {
  locationId: string;
  label: string;
  type: VeyWorkspaceLocationType;
  country: string;
  timezone: string;
};

export type VeyWorkspaceOrderLine = {
  skuId: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  lineTotal: number;
};

export type VeyWorkspaceOrder = {
  orderId: string;
  orderAlias: string;
  channel: string;
  status: VeyWorkspaceOrderStatus;
  locationId: string;
  supplierAlias?: string;
  partnerAlias?: string;
  requestedShipAt?: string;
  dueAt?: string;
  priority: number;
  tradingIntentRef?: string;
  financeIntentRef?: string;
  addressCommitment?: string;
  lines: VeyWorkspaceOrderLine[];
  total: number;
  currency: string;
  warnings: string[];
};

export type VeyWorkspaceInventoryItem = {
  skuId: string;
  locationId: string;
  onHand: number;
  allocated: number;
  openOrderDemand: number;
  available: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  currency: string;
  inventoryValue: number;
  status: 'healthy' | 'low-stock' | 'out-of-stock';
};

export type VeyWorkspaceShipment = {
  shipmentId: string;
  orderId: string;
  carrierAlias: string;
  trackingAlias?: string;
  status: VeyWorkspaceShipmentStatus;
  scheduledAt?: string;
  expectedDeliveredAt?: string;
  deliveredAt?: string;
  returnedAt?: string;
  cost: number;
  currency: string;
  regionId: string;
  deliveryCommitment?: string;
  deliveryGatewayShipmentRef?: string;
  tradeGatewayIntentRef?: string;
  playlistCommerceIntentRef?: string;
  returnReasonAlias?: string;
  warnings: string[];
};

export type VeyWorkspaceRegionalDeliveryQuality = {
  regionId: string;
  shipments: number;
  exceptions: number;
  delayed: number;
  returns: number;
  totalShippingCost: number;
  averageShippingCost: number;
  onTimeRate: number;
  returnRate: number;
  qualityScore: number;
  status: 'healthy' | 'watch' | 'attention';
};

export type VeyWorkspaceOperationsPlan = {
  planningKind: 'b2b-operations-cost-delay-return-regional-quality';
  cost: {
    totalShippingCost: number;
    averageShippingCost: number;
    highestCostShipmentRef?: string;
  };
  delay: {
    delayedShipments: number;
    delayedShipmentRefs: string[];
  };
  returns: {
    returnShipments: number;
    returnShipmentRefs: string[];
  };
  regionalQuality: VeyWorkspaceRegionalDeliveryQuality[];
  ecosystemConnections: {
    deliveryGatewayShipmentRefs: string[];
    tradeGatewayIntentRefs: string[];
    playlistCommerceIntentRefs: string[];
  };
  recommendedActions: string[];
  privacy: {
    usesRawAddress: false;
    usesRecipientContact: false;
    visibleFields: string[];
  };
};

export type VeyWorkspaceInvoice = {
  invoiceId: string;
  orderId: string;
  status: VeyWorkspaceInvoiceStatus;
  amountDue: number;
  amountPaid: number;
  balance: number;
  currency: string;
  dueAt?: string;
  sentAt?: string;
  financeIntentRef?: string;
  autoGenerated: boolean;
  warnings: string[];
};

export type VeyWorkspaceCollaborationChannel = {
  provider: VeyWorkspaceCollaborationProvider;
  channelAlias: string;
  status: 'connected' | 'disabled' | 'error';
  scopes: string[];
  storesSecret: false;
  storesRawWebhookUrl: false;
};

export type VeyWorkspaceTask = {
  taskId: string;
  title: string;
  status: VeyWorkspaceTaskStatus;
  ownerRole: string;
  dueAt?: string;
  relatedRef?: string;
};

export type VeyWorkspaceWorkflow = {
  workflowId: string;
  trigger: string;
  action: string;
  active: boolean;
};

export type VeyWorkspaceNotification = {
  notificationId: string;
  provider: VeyWorkspaceCollaborationProvider;
  channelAlias: string;
  eventType: 'order-blocked' | 'inventory-low' | 'shipment-exception' | 'invoice-overdue' | 'backup-stale';
  severity: 'info' | 'warning' | 'critical';
  summary: string;
  relatedRef: string;
  redacted: true;
};

export type VeyWorkspaceRecommendation = {
  type: 'reorder' | 'warehouse-transfer' | 'invoice-follow-up' | 'shipping-review' | 'regional-quality-review' | 'backup-review';
  priority: 'low' | 'medium' | 'high';
  summary: string;
  relatedRef: string;
};

export type VeyWorkspaceRole = {
  role: string;
  seats: number;
  permissions: string[];
};

export type VeyWorkspaceSecurity = {
  roleBasedAccessControl: boolean;
  roles: VeyWorkspaceRole[];
  auditLogEnabled: boolean;
  backupEncrypted: boolean;
  lastBackupAt?: string;
  retentionDays: number;
  gdprExportEnabled: boolean;
  deletionWorkflowEnabled: boolean;
};

export type VeyWorkspacePrivacy = {
  rawAddressStored: false;
  rawContactStored: false;
  rawInvoiceBodyStored: false;
  rawContractBodyStored: false;
  privateKeyStored: false;
  bankAccountStored: false;
  cardPanStored: false;
  collaborationPayloadsRedacted: true;
  publicSurface: 'aliases-commitments-statuses-amounts-kpis-and-redacted-work-events-only';
};

export type VeyWorkspaceHub = {
  modelVersion: typeof VEY_WORKSPACE_VERSION;
  id: string;
  concept: 'b2b-operations-workspace-not-a-raw-address-crm';
  generatedAt: string;
  organizationAlias: string;
  status: VeyWorkspaceStatus;
  locations: VeyWorkspaceLocation[];
  orders: VeyWorkspaceOrder[];
  inventory: VeyWorkspaceInventoryItem[];
  shipments: VeyWorkspaceShipment[];
  invoices: VeyWorkspaceInvoice[];
  collaborationChannels: VeyWorkspaceCollaborationChannel[];
  tasks: VeyWorkspaceTask[];
  workflows: VeyWorkspaceWorkflow[];
  operationsPlan: VeyWorkspaceOperationsPlan;
  notifications: VeyWorkspaceNotification[];
  recommendations: VeyWorkspaceRecommendation[];
  security: VeyWorkspaceSecurity;
  kpis: {
    orders: number;
    openOrders: number;
    blockedOrders: number;
    inventoryValue: number;
    lowStockItems: number;
    shipmentExceptions: number;
    totalShippingCost: number;
    averageShippingCost: number;
    delayedShipments: number;
    returnShipments: number;
    regionalQualityAttention: number;
    receivablesBalance: number;
    overdueInvoices: number;
    activeTasks: number;
    connectedCollaborationChannels: number;
  };
  errors: string[];
  warnings: string[];
  privacy: VeyWorkspacePrivacy;
};

const DEFAULT_GENERATED_AT = '2026-06-20T00:00:00.000Z';
const FORBIDDEN_INPUT_KEYS = [
  'rawAddress',
  'recipientName',
  'customerName',
  'phone',
  'email',
  'privateKey',
  'bankAccount',
  'cardPan',
  'invoiceBody',
  'contractBody',
  'webhookSecret',
  'rawWebhookUrl',
] as const;
const PRIVATE_VALUE_RE = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+\d[\d ().-]{7,}\d|\b\d{2,4}[-().\s]\d{2,4}[-().\s]\d{2,6}\b|\bA(?:GID|OID)[-_][A-Z0-9]{6,}\b|\b-?\d{1,2}\.\d{4,}[ \t]*,[ \t]*-?\d{1,3}\.\d{4,})/i;

function clean(value: unknown, maxLength = 180) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
    .join(',')}}`;
}

function compactHash(value: unknown, prefix: string) {
  return `${prefix}_${sha256Hex(stableJson(value)).slice(0, 20).toUpperCase()}`;
}

function validIsoOrUndefined(value: unknown) {
  const text = clean(value, 64);
  return text && !Number.isNaN(Date.parse(text)) ? text : undefined;
}

function validIsoOrDefault(value: unknown, fallback = DEFAULT_GENERATED_AT) {
  return validIsoOrUndefined(value) ?? fallback;
}

function numberInput(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value * 1000000) / 1000000);
  const text = clean(value, 40).replace(/,/g, '');
  if (!text) return 0;
  return /^(?:0|[1-9]\d*)(?:\.\d{1,8})?$/.test(text) ? Math.round(Number(text) * 1000000) / 1000000 : Number.NaN;
}

function money(value: unknown) {
  const amount = numberInput(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : amount;
}

function normalizeCurrency(value: unknown) {
  const text = clean(value, 12).toUpperCase();
  return /^[A-Z0-9]{2,12}$/.test(text) ? text : 'USD';
}

function normalizeCountry(value: unknown) {
  const text = clean(value, 8).toUpperCase();
  return /^[A-Z]{2,3}$/.test(text) ? text : '';
}

function normalizeRegionId(value: unknown) {
  const text = clean(value, 80).toUpperCase().replace(/\s+/g, '-');
  return /^[A-Z0-9][A-Z0-9_.:-]{1,79}$/.test(text) ? text : 'REGION-UNKNOWN';
}

function idFrom(prefix: string, value: unknown, seed: string) {
  const explicit = clean(value, 80).toUpperCase();
  if (/^[A-Z0-9][A-Z0-9_.:-]{2,79}$/.test(explicit)) return explicit;
  return `${prefix}-${sha256Hex(seed).slice(0, 12).toUpperCase()}`;
}

function normalizeLocationType(value: unknown): VeyWorkspaceLocationType {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (text === 'store' || text === 'office' || text === 'fulfillment' || text === 'supplier' || text === 'cross-dock') return text;
  return 'warehouse';
}

function normalizeOrderStatus(value: unknown): VeyWorkspaceOrderStatus {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (
    text === 'draft'
    || text === 'received'
    || text === 'confirmed'
    || text === 'allocated'
    || text === 'partially-fulfilled'
    || text === 'fulfilled'
    || text === 'invoiced'
    || text === 'paid'
    || text === 'blocked'
  ) return text;
  return 'received';
}

function normalizeShipmentStatus(value: unknown): VeyWorkspaceShipmentStatus {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (text === 'in-transit' || text === 'delivered' || text === 'exception' || text === 'blocked') return text;
  return 'scheduled';
}

function normalizeInvoiceStatus(value: unknown): VeyWorkspaceInvoiceStatus {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (text === 'sent' || text === 'partially-paid' || text === 'paid' || text === 'overdue' || text === 'disputed') return text;
  return 'draft';
}

function normalizeTaskStatus(value: unknown): VeyWorkspaceTaskStatus {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (text === 'in-progress' || text === 'blocked' || text === 'done') return text;
  return 'open';
}

function normalizeProvider(value: unknown): VeyWorkspaceCollaborationProvider {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (text === 'teams' || text === 'email' || text === 'webhook') return text;
  return 'slack';
}

function normalizeStatus(value: unknown): 'connected' | 'disabled' | 'error' {
  const text = clean(value).toLowerCase();
  if (text === 'disabled') return 'disabled';
  if (text === 'error' || text === 'failed') return 'error';
  return 'connected';
}

function hasForbiddenValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return PRIVATE_VALUE_RE.test(value);
  if (typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasForbiddenValue);
  return Object.entries(value as Record<string, unknown>).some(([key, child]) => (
    (FORBIDDEN_INPUT_KEYS as readonly string[]).includes(key)
    || hasForbiddenValue(child)
  ));
}

function normalizeLocations(input: unknown): VeyWorkspaceLocation[] {
  const locations = asArray<VeyWorkspaceLocationInput>(input).map((item, index) => {
    const locationId = idFrom('LOC', item.locationId, `location:${index}:${clean(item.label)}`);
    return {
      locationId,
      label: clean(item.label, 80) || locationId,
      type: normalizeLocationType(item.type),
      country: normalizeCountry(item.country),
      timezone: clean(item.timezone, 80) || 'UTC',
    };
  });
  return locations.length > 0 ? locations : [{
    locationId: 'LOC-PRIMARY',
    label: 'Primary location',
    type: 'warehouse',
    country: '',
    timezone: 'UTC',
  }];
}

function normalizeOrderLine(item: VeyWorkspaceOrderLineInput, orderSeed: string, index: number): VeyWorkspaceOrderLine {
  const skuId = idFrom('SKU', item.skuId, `${orderSeed}:line:${index}`);
  const quantity = numberInput(item.quantity);
  const unitPrice = money(item.unitPrice);
  const currency = normalizeCurrency(item.currency);
  return {
    skuId,
    quantity: Number.isFinite(quantity) ? quantity : 0,
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
    currency,
    lineTotal: Number.isFinite(quantity) && Number.isFinite(unitPrice)
      ? Math.round(quantity * unitPrice * 100) / 100
      : 0,
  };
}

function normalizeOrders(input: unknown, defaultLocationId: string): VeyWorkspaceOrder[] {
  return asArray<VeyWorkspaceOrderInput>(input).map((item, index) => {
    const orderId = idFrom('ORD', item.orderId, `order:${index}:${clean(item.orderAlias)}`);
    const lines = asArray<VeyWorkspaceOrderLineInput>(item.lines).map((line, lineIndex) => normalizeOrderLine(line, orderId, lineIndex));
    const warnings: string[] = [];
    if (lines.length === 0) warnings.push('order-lines-missing');
    if (lines.some(line => line.quantity <= 0 || line.unitPrice < 0)) warnings.push('order-line-invalid');
    const total = Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100;
    const status = warnings.length ? 'blocked' : normalizeOrderStatus(item.status);
    return {
      orderId,
      orderAlias: clean(item.orderAlias, 100) || orderId,
      channel: clean(item.channel, 80) || 'manual',
      status,
      locationId: clean(item.locationId, 80) || defaultLocationId,
      ...(clean(item.supplierAlias, 100) ? { supplierAlias: clean(item.supplierAlias, 100) } : {}),
      ...(clean(item.partnerAlias, 100) ? { partnerAlias: clean(item.partnerAlias, 100) } : {}),
      ...(validIsoOrUndefined(item.requestedShipAt) ? { requestedShipAt: validIsoOrUndefined(item.requestedShipAt) } : {}),
      ...(validIsoOrUndefined(item.dueAt) ? { dueAt: validIsoOrUndefined(item.dueAt) } : {}),
      priority: Math.round(numberInput(item.priority) || 1),
      ...(clean(item.tradingIntentRef, 100) ? { tradingIntentRef: clean(item.tradingIntentRef, 100) } : {}),
      ...(clean(item.financeIntentRef, 100) ? { financeIntentRef: clean(item.financeIntentRef, 100) } : {}),
      ...(clean(item.addressCommitment, 160) ? { addressCommitment: clean(item.addressCommitment, 160) } : {}),
      lines,
      total,
      currency: lines[0]?.currency ?? 'USD',
      warnings,
    };
  });
}

function openOrderDemandBySku(orders: readonly VeyWorkspaceOrder[]) {
  const demand = new Map<string, number>();
  for (const order of orders) {
    if (order.status === 'fulfilled' || order.status === 'invoiced' || order.status === 'paid' || order.status === 'blocked') continue;
    for (const line of order.lines) {
      demand.set(line.skuId, (demand.get(line.skuId) ?? 0) + line.quantity);
    }
  }
  return demand;
}

function normalizeInventory(input: unknown, orders: readonly VeyWorkspaceOrder[], defaultLocationId: string): VeyWorkspaceInventoryItem[] {
  const demand = openOrderDemandBySku(orders);
  return asArray<VeyWorkspaceInventoryInput>(input).map((item, index) => {
    const skuId = idFrom('SKU', item.skuId, `inventory:${index}`);
    const locationId = clean(item.locationId, 80) || defaultLocationId;
    const onHand = numberInput(item.onHand);
    const allocated = numberInput(item.allocated);
    const reorderPoint = numberInput(item.reorderPoint);
    const reorderQuantity = numberInput(item.reorderQuantity);
    const unitCost = money(item.unitCost);
    const openOrderDemand = demand.get(skuId) ?? 0;
    const available = Math.max(0, (Number.isFinite(onHand) ? onHand : 0) - (Number.isFinite(allocated) ? allocated : 0) - openOrderDemand);
    const normalizedReorderPoint = Number.isFinite(reorderPoint) ? reorderPoint : 0;
    const status = available <= 0 ? 'out-of-stock' : available <= normalizedReorderPoint ? 'low-stock' : 'healthy';
    return {
      skuId,
      locationId,
      onHand: Number.isFinite(onHand) ? onHand : 0,
      allocated: Number.isFinite(allocated) ? allocated : 0,
      openOrderDemand,
      available,
      reorderPoint: normalizedReorderPoint,
      reorderQuantity: Number.isFinite(reorderQuantity) && reorderQuantity > 0 ? reorderQuantity : Math.max(1, normalizedReorderPoint * 2),
      unitCost: Number.isFinite(unitCost) ? unitCost : 0,
      currency: normalizeCurrency(item.currency),
      inventoryValue: Number.isFinite(unitCost) && Number.isFinite(onHand) ? Math.round(unitCost * onHand * 100) / 100 : 0,
      status,
    };
  });
}

function normalizeShipments(input: unknown): VeyWorkspaceShipment[] {
  return asArray<VeyWorkspaceShipmentInput>(input).map((item, index) => {
    const shipmentId = idFrom('SHP', item.shipmentId, `shipment:${index}`);
    const carrierAlias = clean(item.carrierAlias, 100);
    const warnings: string[] = [];
    if (!carrierAlias) warnings.push('carrier-alias-missing');
    const cost = money(item.cost);
    const deliveredAt = validIsoOrUndefined(item.deliveredAt);
    const expectedDeliveredAt = validIsoOrUndefined(item.expectedDeliveredAt);
    const returnedAt = validIsoOrUndefined(item.returnedAt);
    if (expectedDeliveredAt && deliveredAt && Date.parse(deliveredAt) > Date.parse(expectedDeliveredAt)) warnings.push('shipment-delayed');
    if (returnedAt) warnings.push('shipment-returned');
    return {
      shipmentId,
      orderId: idFrom('ORD', item.orderId, `${shipmentId}:order`),
      carrierAlias: carrierAlias || 'carrier-pending',
      ...(clean(item.trackingAlias, 100) ? { trackingAlias: clean(item.trackingAlias, 100) } : {}),
      status: normalizeShipmentStatus(item.status),
      ...(validIsoOrUndefined(item.scheduledAt) ? { scheduledAt: validIsoOrUndefined(item.scheduledAt) } : {}),
      ...(expectedDeliveredAt ? { expectedDeliveredAt } : {}),
      ...(deliveredAt ? { deliveredAt } : {}),
      ...(returnedAt ? { returnedAt } : {}),
      cost: Number.isFinite(cost) ? cost : 0,
      currency: normalizeCurrency(item.currency),
      regionId: normalizeRegionId(item.regionId),
      ...(clean(item.deliveryCommitment, 160) ? { deliveryCommitment: clean(item.deliveryCommitment, 160) } : {}),
      ...(clean(item.deliveryGatewayShipmentRef, 120) ? { deliveryGatewayShipmentRef: clean(item.deliveryGatewayShipmentRef, 120) } : {}),
      ...(clean(item.tradeGatewayIntentRef, 120) ? { tradeGatewayIntentRef: clean(item.tradeGatewayIntentRef, 120) } : {}),
      ...(clean(item.playlistCommerceIntentRef, 120) ? { playlistCommerceIntentRef: clean(item.playlistCommerceIntentRef, 120) } : {}),
      ...(clean(item.returnReasonAlias, 100) ? { returnReasonAlias: clean(item.returnReasonAlias, 100) } : {}),
      warnings,
    };
  });
}

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function isDelayedShipment(shipment: VeyWorkspaceShipment) {
  return Boolean(
    shipment.warnings.includes('shipment-delayed')
    || (shipment.expectedDeliveredAt && shipment.deliveredAt && Date.parse(shipment.deliveredAt) > Date.parse(shipment.expectedDeliveredAt)),
  );
}

function isReturnedShipment(shipment: VeyWorkspaceShipment) {
  return Boolean(shipment.returnedAt || shipment.returnReasonAlias);
}

function buildOperationsPlan(shipments: readonly VeyWorkspaceShipment[]): VeyWorkspaceOperationsPlan {
  const totalShippingCost = Math.round(shipments.reduce((sum, shipment) => sum + shipment.cost, 0) * 100) / 100;
  const averageShippingCost = shipments.length ? Math.round((totalShippingCost / shipments.length) * 100) / 100 : 0;
  const highestCostShipment = shipments.reduce<VeyWorkspaceShipment | undefined>((highest, shipment) => (
    !highest || shipment.cost > highest.cost ? shipment : highest
  ), undefined);
  const delayedShipmentRefs = shipments.filter(isDelayedShipment).map(shipment => shipment.shipmentId);
  const returnShipmentRefs = shipments.filter(isReturnedShipment).map(shipment => shipment.shipmentId);
  const regions = uniqueStrings(shipments.map(shipment => shipment.regionId));
  const regionalQuality = regions.map((regionId) => {
    const regionalShipments = shipments.filter(shipment => shipment.regionId === regionId);
    const exceptions = regionalShipments.filter(shipment => shipment.status === 'exception' || shipment.status === 'blocked').length;
    const delayed = regionalShipments.filter(isDelayedShipment).length;
    const returns = regionalShipments.filter(isReturnedShipment).length;
    const totalCost = Math.round(regionalShipments.reduce((sum, shipment) => sum + shipment.cost, 0) * 100) / 100;
    const onTimeRate = regionalShipments.length ? Math.round(((regionalShipments.length - delayed) / regionalShipments.length) * 1000) / 1000 : 0;
    const returnRate = regionalShipments.length ? Math.round((returns / regionalShipments.length) * 1000) / 1000 : 0;
    const qualityPenalty = (exceptions * 25 + delayed * 15 + returns * 20) / Math.max(1, regionalShipments.length);
    const qualityScore = Math.max(0, Math.round(100 - qualityPenalty));
    const compoundIssue = (exceptions > 0 && returns > 0) || (delayed > 0 && returns > 0);
    return {
      regionId,
      shipments: regionalShipments.length,
      exceptions,
      delayed,
      returns,
      totalShippingCost: totalCost,
      averageShippingCost: regionalShipments.length ? Math.round((totalCost / regionalShipments.length) * 100) / 100 : 0,
      onTimeRate,
      returnRate,
      qualityScore,
      status: qualityScore >= 80 && exceptions === 0 && !compoundIssue ? 'healthy' as const : qualityScore >= 60 && !compoundIssue ? 'watch' as const : 'attention' as const,
    };
  }).sort((a, b) => a.qualityScore - b.qualityScore || b.shipments - a.shipments);
  const recommendedActions: string[] = [];
  if (averageShippingCost > 0) recommendedActions.push('review-carrier-cost-benchmark-by-region');
  if (delayedShipmentRefs.length) recommendedActions.push('recalibrate-delivery-promise-and-carrier-allocation');
  if (returnShipmentRefs.length) recommendedActions.push('inspect-return-reasons-and-merchant-policy');
  if (regionalQuality.some(region => region.status === 'attention')) recommendedActions.push('open-regional-quality-improvement-workstream');
  if (!recommendedActions.length) recommendedActions.push('continue-monitoring-b2b-operations-baseline');

  return {
    planningKind: 'b2b-operations-cost-delay-return-regional-quality',
    cost: {
      totalShippingCost,
      averageShippingCost,
      ...(highestCostShipment ? { highestCostShipmentRef: highestCostShipment.shipmentId } : {}),
    },
    delay: {
      delayedShipments: delayedShipmentRefs.length,
      delayedShipmentRefs,
    },
    returns: {
      returnShipments: returnShipmentRefs.length,
      returnShipmentRefs,
    },
    regionalQuality,
    ecosystemConnections: {
      deliveryGatewayShipmentRefs: uniqueStrings(shipments.map(shipment => shipment.deliveryGatewayShipmentRef)),
      tradeGatewayIntentRefs: uniqueStrings(shipments.map(shipment => shipment.tradeGatewayIntentRef)),
      playlistCommerceIntentRefs: uniqueStrings(shipments.map(shipment => shipment.playlistCommerceIntentRef)),
    },
    recommendedActions,
    privacy: {
      usesRawAddress: false,
      usesRecipientContact: false,
      visibleFields: [
        'shipmentId',
        'orderId',
        'carrierAlias',
        'status',
        'cost',
        'currency',
        'regionId',
        'deliveryGatewayShipmentRef',
        'tradeGatewayIntentRef',
        'playlistCommerceIntentRef',
      ],
    },
  };
}

function normalizeInvoices(input: unknown, generatedAt: string): VeyWorkspaceInvoice[] {
  return asArray<VeyWorkspaceInvoiceInput>(input).map((item, index) => {
    const invoiceId = idFrom('INV', item.invoiceId, `invoice:${index}`);
    const amountDue = money(item.amountDue);
    const amountPaid = money(item.amountPaid);
    const dueAt = validIsoOrUndefined(item.dueAt);
    let status = normalizeInvoiceStatus(item.status);
    const normalizedDue = Number.isFinite(amountDue) ? amountDue : 0;
    const normalizedPaid = Number.isFinite(amountPaid) ? amountPaid : 0;
    const balance = Math.max(0, Math.round((normalizedDue - normalizedPaid) * 100) / 100);
    if (status !== 'paid' && dueAt && Date.parse(dueAt) < Date.parse(generatedAt) && balance > 0) {
      status = 'overdue';
    }
    if (status === 'draft' && normalizedPaid > 0 && balance > 0) status = 'partially-paid';
    if (balance <= 0 && normalizedDue > 0) status = 'paid';
    return {
      invoiceId,
      orderId: idFrom('ORD', item.orderId, `${invoiceId}:order`),
      status,
      amountDue: normalizedDue,
      amountPaid: normalizedPaid,
      balance,
      currency: normalizeCurrency(item.currency),
      ...(dueAt ? { dueAt } : {}),
      ...(validIsoOrUndefined(item.sentAt) ? { sentAt: validIsoOrUndefined(item.sentAt) } : {}),
      ...(clean(item.financeIntentRef, 100) ? { financeIntentRef: clean(item.financeIntentRef, 100) } : {}),
      autoGenerated: false,
      warnings: status === 'overdue' ? ['invoice-overdue'] : [],
    };
  });
}

function generateMissingInvoices(
  orders: readonly VeyWorkspaceOrder[],
  invoices: readonly VeyWorkspaceInvoice[],
  generatedAt: string,
): VeyWorkspaceInvoice[] {
  const invoicedOrderIds = new Set(invoices.map(invoice => invoice.orderId));
  return orders
    .filter(order => order.total > 0 && !invoicedOrderIds.has(order.orderId) && order.status !== 'blocked')
    .map((order) => ({
      invoiceId: compactHash({ orderId: order.orderId, generatedAt }, 'INV').toUpperCase(),
      orderId: order.orderId,
      status: 'draft' as const,
      amountDue: order.total,
      amountPaid: 0,
      balance: order.total,
      currency: order.currency,
      financeIntentRef: order.financeIntentRef,
      autoGenerated: true,
      warnings: ['auto-generated-invoice-needs-review'],
    }));
}

function normalizeChannels(input: unknown): VeyWorkspaceCollaborationChannel[] {
  return asArray<VeyWorkspaceChannelInput>(input).map((item) => {
    const provider = normalizeProvider(item.provider);
    return {
      provider,
      channelAlias: clean(item.channelAlias, 120) || `${provider}-ops`,
      status: normalizeStatus(item.status),
      scopes: asArray<unknown>(item.scopes).map(scope => clean(scope, 60)).filter(Boolean),
      storesSecret: false,
      storesRawWebhookUrl: false,
    };
  });
}

function normalizeTasks(input: unknown): VeyWorkspaceTask[] {
  return asArray<VeyWorkspaceTaskInput>(input).map((item, index) => ({
    taskId: idFrom('TASK', item.taskId, `task:${index}:${clean(item.title)}`),
    title: clean(item.title, 120) || 'Untitled task',
    status: normalizeTaskStatus(item.status),
    ownerRole: clean(item.ownerRole, 80) || 'operations',
    ...(validIsoOrUndefined(item.dueAt) ? { dueAt: validIsoOrUndefined(item.dueAt) } : {}),
    ...(clean(item.relatedRef, 120) ? { relatedRef: clean(item.relatedRef, 120) } : {}),
  }));
}

function normalizeWorkflows(input: unknown): VeyWorkspaceWorkflow[] {
  return asArray<VeyWorkspaceWorkflowInput>(input).map((item, index) => ({
    workflowId: idFrom('WF', item.workflowId, `workflow:${index}:${clean(item.trigger)}:${clean(item.action)}`),
    trigger: clean(item.trigger, 100) || 'manual',
    action: clean(item.action, 100) || 'create-task',
    active: item.active !== false,
  }));
}

function normalizeRoles(input: unknown): VeyWorkspaceRole[] {
  const roles = asArray<VeyWorkspaceRoleInput>(input).map((item) => ({
    role: clean(item.role, 80) || 'viewer',
    seats: Math.max(0, Math.round(numberInput(item.seats))),
    permissions: asArray<unknown>(item.permissions).map(permission => clean(permission, 80)).filter(Boolean),
  }));
  return roles.length ? roles : [
    { role: 'admin', seats: 1, permissions: ['orders:write', 'inventory:write', 'invoices:write', 'settings:write'] },
    { role: 'operations', seats: 1, permissions: ['orders:read', 'shipments:write', 'inventory:read'] },
    { role: 'finance', seats: 1, permissions: ['invoices:write', 'receivables:read'] },
    { role: 'viewer', seats: 1, permissions: ['orders:read', 'reports:read'] },
  ];
}

function buildNotifications(input: {
  channels: readonly VeyWorkspaceCollaborationChannel[];
  orders: readonly VeyWorkspaceOrder[];
  inventory: readonly VeyWorkspaceInventoryItem[];
  shipments: readonly VeyWorkspaceShipment[];
  invoices: readonly VeyWorkspaceInvoice[];
  backupStale: boolean;
}): VeyWorkspaceNotification[] {
  const connected = input.channels.filter(channel => channel.status === 'connected');
  if (connected.length === 0) return [];
  const notifications: VeyWorkspaceNotification[] = [];
  const push = (
    eventType: VeyWorkspaceNotification['eventType'],
    severity: VeyWorkspaceNotification['severity'],
    summary: string,
    relatedRef: string,
  ) => {
    const channel = connected[notifications.length % connected.length];
    notifications.push({
      notificationId: compactHash({ eventType, summary, relatedRef, channel }, 'WSN'),
      provider: channel.provider,
      channelAlias: channel.channelAlias,
      eventType,
      severity,
      summary,
      relatedRef,
      redacted: true,
    });
  };

  input.orders.filter(order => order.status === 'blocked').forEach(order => {
    push('order-blocked', 'critical', `Order ${order.orderAlias} requires review`, order.orderId);
  });
  input.inventory.filter(item => item.status !== 'healthy').forEach(item => {
    push('inventory-low', item.status === 'out-of-stock' ? 'critical' : 'warning', `${item.skuId} is ${item.status}`, `${item.skuId}@${item.locationId}`);
  });
  input.shipments.filter(shipment => shipment.status === 'exception' || shipment.status === 'blocked').forEach(shipment => {
    push('shipment-exception', 'critical', `Shipment ${shipment.shipmentId} needs intervention`, shipment.shipmentId);
  });
  input.invoices.filter(invoice => invoice.status === 'overdue').forEach(invoice => {
    push('invoice-overdue', 'warning', `Invoice ${invoice.invoiceId} is overdue`, invoice.invoiceId);
  });
  if (input.backupStale) {
    push('backup-stale', 'warning', 'Workspace backup is stale or missing', 'backup-policy');
  }
  return notifications;
}

function buildRecommendations(input: {
  inventory: readonly VeyWorkspaceInventoryItem[];
  shipments: readonly VeyWorkspaceShipment[];
  invoices: readonly VeyWorkspaceInvoice[];
  locations: readonly VeyWorkspaceLocation[];
  operationsPlan: VeyWorkspaceOperationsPlan;
  backupStale: boolean;
}): VeyWorkspaceRecommendation[] {
  const recommendations: VeyWorkspaceRecommendation[] = [];
  for (const item of input.inventory) {
    if (item.status !== 'healthy') {
      recommendations.push({
        type: 'reorder',
        priority: item.status === 'out-of-stock' ? 'high' : 'medium',
        summary: `Create purchase request for ${item.reorderQuantity} units of ${item.skuId}`,
        relatedRef: `${item.skuId}@${item.locationId}`,
      });
      const donor = input.inventory.find(candidate => (
        candidate.skuId === item.skuId
        && candidate.locationId !== item.locationId
        && candidate.available > Math.max(candidate.reorderPoint * 2, item.reorderQuantity)
      ));
      if (donor && input.locations.length > 1) {
        recommendations.push({
          type: 'warehouse-transfer',
          priority: 'medium',
          summary: `Transfer ${item.skuId} from ${donor.locationId} to ${item.locationId}`,
          relatedRef: `${item.skuId}:${donor.locationId}->${item.locationId}`,
        });
      }
    }
  }
  input.shipments.filter(shipment => shipment.status === 'exception' || shipment.status === 'blocked').forEach(shipment => {
    recommendations.push({
      type: 'shipping-review',
      priority: 'high',
      summary: `Review carrier handoff for ${shipment.shipmentId}`,
      relatedRef: shipment.shipmentId,
    });
  });
  input.operationsPlan.regionalQuality.filter(region => region.status === 'attention').forEach(region => {
    recommendations.push({
      type: 'regional-quality-review',
      priority: 'high',
      summary: `Review delivery cost, delay, return, and exception posture for ${region.regionId}`,
      relatedRef: region.regionId,
    });
  });
  input.invoices.filter(invoice => invoice.status === 'overdue').forEach(invoice => {
    recommendations.push({
      type: 'invoice-follow-up',
      priority: 'medium',
      summary: `Follow up invoice ${invoice.invoiceId} with finance workflow`,
      relatedRef: invoice.invoiceId,
    });
  });
  if (input.backupStale) {
    recommendations.push({
      type: 'backup-review',
      priority: 'high',
      summary: 'Run encrypted backup and verify restore checkpoint',
      relatedRef: 'backup-policy',
    });
  }
  return recommendations;
}

function privacy(): VeyWorkspacePrivacy {
  return {
    rawAddressStored: false,
    rawContactStored: false,
    rawInvoiceBodyStored: false,
    rawContractBodyStored: false,
    privateKeyStored: false,
    bankAccountStored: false,
    cardPanStored: false,
    collaborationPayloadsRedacted: true,
    publicSurface: 'aliases-commitments-statuses-amounts-kpis-and-redacted-work-events-only',
  };
}

export function buildVeyWorkspace(input: VeyWorkspaceInput = {}): VeyWorkspaceHub {
  const generatedAt = validIsoOrDefault(input.generatedAt);
  const errors: string[] = [];
  const warnings: string[] = [
    'vey-workspace-is-a-b2b-operations-hub-not-a-raw-address-crm',
    'collaboration-notifications-must-use-redacted-aliases-and-commitments',
  ];

  if (hasForbiddenValue(input)) errors.push('vey-workspace-private-input-rejected');
  for (const key of FORBIDDEN_INPUT_KEYS) {
    if (clean(input[key])) errors.push(`${key}-not-allowed-in-vey-workspace`);
  }

  const locations = normalizeLocations(input.locations);
  const orders = normalizeOrders(input.orders, locations[0].locationId);
  const inventory = normalizeInventory(input.inventory, orders, locations[0].locationId);
  const shipments = normalizeShipments(input.shipments);
  const providedInvoices = normalizeInvoices(input.invoices, generatedAt);
  const invoices = input.autoGenerateInvoices === false
    ? providedInvoices
    : [...providedInvoices, ...generateMissingInvoices(orders, providedInvoices, generatedAt)];
  const collaborationChannels = normalizeChannels(input.collaborationChannels);
  const tasks = normalizeTasks(input.tasks);
  const workflows = normalizeWorkflows(input.workflows);
  const roles = normalizeRoles(input.roles);
  const retentionDays = Math.max(30, Math.round(numberInput(input.retentionDays) || 365));
  const lastBackupAt = validIsoOrUndefined(input.lastBackupAt);
  const backupStale = !lastBackupAt || Date.parse(generatedAt) - Date.parse(lastBackupAt) > 86_400_000 * 2;

  if (!input.auditLogEnabled) warnings.push('audit-log-disabled-or-unspecified');
  if (!input.backupEncrypted) warnings.push('encrypted-backup-disabled-or-unspecified');
  if (!input.gdprExportEnabled) warnings.push('gdpr-export-disabled-or-unspecified');
  if (!input.deletionWorkflowEnabled) warnings.push('deletion-workflow-disabled-or-unspecified');
  if (collaborationChannels.length === 0) warnings.push('collaboration-channel-missing');
  if (collaborationChannels.some(channel => channel.status === 'error')) warnings.push('collaboration-channel-error');

  const notifications = buildNotifications({
    channels: collaborationChannels,
    orders,
    inventory,
    shipments,
    invoices,
    backupStale,
  });
  const operationsPlan = buildOperationsPlan(shipments);
  const recommendations = buildRecommendations({
    inventory,
    shipments,
    invoices,
    locations,
    operationsPlan,
    backupStale,
  });
  const blockedOrders = orders.filter(order => order.status === 'blocked').length;
  const lowStockItems = inventory.filter(item => item.status !== 'healthy').length;
  const shipmentExceptions = shipments.filter(shipment => shipment.status === 'exception' || shipment.status === 'blocked').length;
  const overdueInvoices = invoices.filter(invoice => invoice.status === 'overdue').length;
  const status: VeyWorkspaceStatus = errors.length > 0
    ? 'blocked'
    : blockedOrders || lowStockItems || shipmentExceptions || overdueInvoices || backupStale || warnings.length > 2
      ? 'attention'
      : 'ready';

  return {
    modelVersion: VEY_WORKSPACE_VERSION,
    id: idFrom('WS', input.id, `${generatedAt}:${clean(input.organizationAlias)}`),
    concept: 'b2b-operations-workspace-not-a-raw-address-crm',
    generatedAt,
    organizationAlias: clean(input.organizationAlias, 100) || 'org-workspace',
    status,
    locations,
    orders,
    inventory,
    shipments,
    invoices,
    collaborationChannels,
    tasks,
    workflows,
    operationsPlan,
    notifications,
    recommendations,
    security: {
      roleBasedAccessControl: roles.length > 0,
      roles,
      auditLogEnabled: Boolean(input.auditLogEnabled),
      backupEncrypted: Boolean(input.backupEncrypted),
      ...(lastBackupAt ? { lastBackupAt } : {}),
      retentionDays,
      gdprExportEnabled: Boolean(input.gdprExportEnabled),
      deletionWorkflowEnabled: Boolean(input.deletionWorkflowEnabled),
    },
    kpis: {
      orders: orders.length,
      openOrders: orders.filter(order => order.status !== 'fulfilled' && order.status !== 'invoiced' && order.status !== 'paid' && order.status !== 'blocked').length,
      blockedOrders,
      inventoryValue: Math.round(inventory.reduce((sum, item) => sum + item.inventoryValue, 0) * 100) / 100,
      lowStockItems,
      shipmentExceptions,
      totalShippingCost: operationsPlan.cost.totalShippingCost,
      averageShippingCost: operationsPlan.cost.averageShippingCost,
      delayedShipments: operationsPlan.delay.delayedShipments,
      returnShipments: operationsPlan.returns.returnShipments,
      regionalQualityAttention: operationsPlan.regionalQuality.filter(region => region.status === 'attention').length,
      receivablesBalance: Math.round(invoices.reduce((sum, invoice) => sum + invoice.balance, 0) * 100) / 100,
      overdueInvoices,
      activeTasks: tasks.filter(task => task.status !== 'done').length,
      connectedCollaborationChannels: collaborationChannels.filter(channel => channel.status === 'connected').length,
    },
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
    privacy: privacy(),
  };
}

export function validateVeyWorkspace(workspace: VeyWorkspaceHub) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (workspace.modelVersion !== VEY_WORKSPACE_VERSION) errors.push('vey-workspace-version-mismatch');
  if (workspace.concept !== 'b2b-operations-workspace-not-a-raw-address-crm') errors.push('vey-workspace-concept-mismatch');
  if (workspace.privacy.rawAddressStored !== false) errors.push('vey-workspace-raw-address-stored');
  if (workspace.privacy.rawContactStored !== false) errors.push('vey-workspace-raw-contact-stored');
  if (workspace.privacy.rawInvoiceBodyStored !== false) errors.push('vey-workspace-raw-invoice-body-stored');
  if (workspace.privacy.privateKeyStored !== false) errors.push('vey-workspace-private-key-stored');
  if (workspace.privacy.collaborationPayloadsRedacted !== true) errors.push('vey-workspace-unredacted-collaboration-payloads');
  if (workspace.operationsPlan.privacy.usesRawAddress !== false) errors.push('vey-workspace-operations-uses-raw-address');
  if (workspace.operationsPlan.privacy.usesRecipientContact !== false) errors.push('vey-workspace-operations-uses-recipient-contact');
  if (workspace.notifications.some(notification => notification.redacted !== true)) errors.push('vey-workspace-notification-not-redacted');
  if (!workspace.security.auditLogEnabled) warnings.push('vey-workspace-audit-log-disabled');
  if (!workspace.security.backupEncrypted) warnings.push('vey-workspace-backup-not-encrypted');

  const publicText = [
    workspace.id,
    workspace.organizationAlias,
    ...workspace.locations.flatMap(location => [location.locationId, location.label]),
    ...workspace.orders.flatMap(order => [order.orderId, order.orderAlias, order.addressCommitment, order.supplierAlias, order.partnerAlias]),
    ...workspace.shipments.flatMap(shipment => [
      shipment.shipmentId,
      shipment.trackingAlias,
      shipment.deliveryCommitment,
      shipment.deliveryGatewayShipmentRef,
      shipment.tradeGatewayIntentRef,
      shipment.playlistCommerceIntentRef,
      shipment.regionId,
    ]),
    ...workspace.operationsPlan.regionalQuality.map(region => region.regionId),
    ...workspace.operationsPlan.ecosystemConnections.deliveryGatewayShipmentRefs,
    ...workspace.operationsPlan.ecosystemConnections.tradeGatewayIntentRefs,
    ...workspace.operationsPlan.ecosystemConnections.playlistCommerceIntentRefs,
    ...workspace.invoices.flatMap(invoice => [invoice.invoiceId, invoice.financeIntentRef]),
    ...workspace.notifications.flatMap(notification => [notification.summary, notification.relatedRef]),
    ...workspace.errors,
    ...workspace.warnings,
  ].filter(Boolean).join('\n');

  if (PRIVATE_VALUE_RE.test(publicText)) errors.push('vey-workspace-public-surface-contains-private-token');

  return {
    ok: errors.length === 0 && workspace.status !== 'blocked',
    errors,
    warnings,
    auditRef: compactHash({
      modelVersion: workspace.modelVersion,
      id: workspace.id,
      status: workspace.status,
      kpis: workspace.kpis,
      notifications: workspace.notifications,
    }, 'veyworkspace_audit'),
  };
}
