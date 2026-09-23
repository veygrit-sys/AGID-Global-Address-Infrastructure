import { stableJson } from './redactedWorkflowCore';
import { sha256Hex } from './sha256';

export const OPERATIONS_VERSION = 'operations-v1';

export const OPERATIONS_WAREHOUSE_HANDLING_CLASSES = [
  'standard',
  'cold-chain',
  'hazmat',
  'high-value',
  'heavy',
  'fragile',
] as const;

export const OPERATIONS_PICKING_STRATEGIES = [
  'piece',
  'batch',
  'zone',
  'wave',
] as const;

export const OPERATIONS_TRANSPORT_VEHICLE_MODES = [
  'walk',
  'bicycle',
  'motorbike',
  'car',
  'van',
  'truck',
  'drone',
] as const;

export type OperationsWarehouseHandlingClass = typeof OPERATIONS_WAREHOUSE_HANDLING_CLASSES[number];
export type OperationsPickingStrategy = typeof OPERATIONS_PICKING_STRATEGIES[number];
export type OperationsTransportVehicleMode = typeof OPERATIONS_TRANSPORT_VEHICLE_MODES[number];
export type OperationsWarehouseOrderStatus = 'allocated' | 'partial' | 'short' | 'blocked';
export type OperationsPutawayStatus = 'assigned' | 'needs-review';
export type OperationsTransportShipmentStatus = 'assigned' | 'unassigned' | 'late-risk';
export type OperationsStatus = 'ready' | 'attention' | 'blocked';

export type OperationsCoordinate = {
  lat: number;
  lng: number;
};

export type OperationsWarehouseLocationInput = {
  locationId?: unknown;
  zone?: unknown;
  aisle?: unknown;
  bay?: unknown;
  capacityUnits?: unknown;
  currentUnits?: unknown;
  compatibleHandling?: unknown;
  temperatureClass?: unknown;
};

export type OperationsWarehouseLocation = {
  locationId: string;
  zone: string;
  aisle: string;
  bay: string;
  capacityUnits: number;
  currentUnits: number;
  availableCapacityUnits: number;
  compatibleHandling: OperationsWarehouseHandlingClass[];
  temperatureClass: string;
};

export type OperationsInventoryLotInput = {
  skuId?: unknown;
  lotId?: unknown;
  serialNumber?: unknown;
  locationId?: unknown;
  quantityOnHand?: unknown;
  allocatedQuantity?: unknown;
  receivedAt?: unknown;
  expiresAt?: unknown;
  reorderPoint?: unknown;
  unitWeightKg?: unknown;
  unitVolumeM3?: unknown;
  handlingClass?: unknown;
};

export type OperationsInventoryLot = {
  skuId: string;
  lotId: string;
  serialCommitment?: string;
  locationId: string;
  quantityOnHand: number;
  allocatedQuantity: number;
  availableQuantity: number;
  receivedAt: string;
  expiresAt?: string;
  reorderPoint: number;
  unitWeightKg: number;
  unitVolumeM3: number;
  handlingClass: OperationsWarehouseHandlingClass;
};

export type OperationsWarehouseOrderLineInput = {
  lineId?: unknown;
  skuId?: unknown;
  quantity?: unknown;
  handlingClass?: unknown;
  unitWeightKg?: unknown;
  unitVolumeM3?: unknown;
};

export type OperationsWarehouseOrderInput = {
  orderId?: unknown;
  priority?: unknown;
  dueAt?: unknown;
  lines?: unknown;
  destinationAgid?: unknown;
  destinationAddressCommitment?: unknown;
  destinationCoords?: Partial<OperationsCoordinate>;
  rawAddress?: unknown;
  recipient?: unknown;
  phone?: unknown;
};

export type OperationsWarehouseOrderLine = {
  lineId: string;
  skuId: string;
  quantity: number;
  handlingClass: OperationsWarehouseHandlingClass;
  unitWeightKg: number;
  unitVolumeM3: number;
};

export type OperationsWarehouseOrder = {
  orderId: string;
  priority: number;
  dueAt?: string;
  lines: OperationsWarehouseOrderLine[];
  destinationAgidTail?: string;
  destinationAddressCommitment?: string;
  destinationCoords?: OperationsCoordinate;
  blocked: boolean;
  warnings: string[];
};

export type OperationsReceivingLineInput = {
  receiptId?: unknown;
  skuId?: unknown;
  lotId?: unknown;
  quantity?: unknown;
  handlingClass?: unknown;
  temperatureClass?: unknown;
  receivedAt?: unknown;
};

export type OperationsPutawayTask = {
  receiptId: string;
  skuId: string;
  lotId: string;
  quantity: number;
  targetLocationId?: string;
  status: OperationsPutawayStatus;
  reason?: string;
};

export type OperationsWarehouseAllocation = {
  orderId: string;
  lineId: string;
  skuId: string;
  requestedQuantity: number;
  allocatedQuantity: number;
  shortageQuantity: number;
  allocations: Array<{
    lotId: string;
    locationId: string;
    quantity: number;
    expiresAt?: string;
  }>;
};

export type OperationsPickingTask = {
  taskId: string;
  strategy: OperationsPickingStrategy;
  orderId: string;
  lineId: string;
  skuId: string;
  lotId: string;
  locationId: string;
  zone: string;
  aisle: string;
  bay: string;
  quantity: number;
  sequence: number;
};

export type OperationsReplenishmentAlert = {
  skuId: string;
  locationId: string;
  availableQuantity: number;
  reorderPoint: number;
  action: 'replenish' | 'review';
};

export type OperationsWarehousePlanInput = {
  generatedAt?: unknown;
  pickingStrategy?: unknown;
  locations?: unknown;
  inventory?: unknown;
  orders?: unknown;
  receiving?: unknown;
  shippedUnitsLast30Days?: unknown;
  averageInventoryUnits?: unknown;
  completedPickLines?: unknown;
  pickLaborHours?: unknown;
};

export type OperationsWarehousePlan = {
  modelVersion: typeof OPERATIONS_VERSION;
  generatedAt: string;
  pickingStrategy: OperationsPickingStrategy;
  locations: OperationsWarehouseLocation[];
  inventory: OperationsInventoryLot[];
  orders: Array<{
    orderId: string;
    status: OperationsWarehouseOrderStatus;
    allocatedLines: number;
    totalLines: number;
    warnings: string[];
  }>;
  allocations: OperationsWarehouseAllocation[];
  pickingTasks: OperationsPickingTask[];
  putawayTasks: OperationsPutawayTask[];
  replenishmentAlerts: OperationsReplenishmentAlert[];
  shippingReadyOrders: OperationsWarehouseOrder[];
  metrics: {
    inventoryTurnoverRate: number;
    storageUtilization: number;
    orderFulfillmentAccuracy: number;
    pickingProductivityLinesPerHour: number;
  };
  warnings: string[];
  privacy: OperationsPrivacyBoundary;
};

export type OperationsTransportVehicleInput = {
  vehicleId?: unknown;
  mode?: unknown;
  available?: unknown;
  capacityWeightKg?: unknown;
  capacityVolumeM3?: unknown;
  currentLocation?: Partial<OperationsCoordinate>;
  compatibleHandling?: unknown;
  costPerKm?: unknown;
  driverId?: unknown;
};

export type OperationsTransportVehicle = {
  vehicleId: string;
  mode: OperationsTransportVehicleMode;
  available: boolean;
  capacityWeightKg: number;
  capacityVolumeM3: number;
  currentLocation?: OperationsCoordinate;
  compatibleHandling: OperationsWarehouseHandlingClass[];
  costPerKm: number;
  driverId?: string;
};

export type OperationsShipmentInput = {
  shipmentId?: unknown;
  orderId?: unknown;
  priority?: unknown;
  addressCommitment?: unknown;
  agid?: unknown;
  coords?: Partial<OperationsCoordinate>;
  weightKg?: unknown;
  volumeM3?: unknown;
  serviceMinutes?: unknown;
  timeWindowEnd?: unknown;
  requiredHandling?: unknown;
  rawAddress?: unknown;
  recipient?: unknown;
  phone?: unknown;
};

export type OperationsShipment = {
  shipmentId: string;
  orderId?: string;
  priority: number;
  addressCommitment?: string;
  agidTail?: string;
  coords?: OperationsCoordinate;
  weightKg: number;
  volumeM3: number;
  serviceMinutes: number;
  timeWindowEnd?: string;
  requiredHandling: OperationsWarehouseHandlingClass[];
  blocked: boolean;
  warnings: string[];
};

export type OperationsTransportEventInput = {
  shipmentId?: unknown;
  vehicleId?: unknown;
  status?: unknown;
  attempt?: unknown;
  plannedAt?: unknown;
  completedAt?: unknown;
  deadline?: unknown;
  cost?: unknown;
  distanceKm?: unknown;
};

export type OperationsTransportPlanInput = {
  generatedAt?: unknown;
  vehicles?: unknown;
  shipments?: unknown;
  events?: unknown;
};

export type OperationsRouteStop = {
  shipmentId: string;
  orderId?: string;
  addressCommitment?: string;
  agidTail?: string;
  eta: string;
  distanceKm: number;
  serviceMinutes: number;
  status: OperationsTransportShipmentStatus;
  warnings: string[];
};

export type OperationsRouteManifest = {
  routeId: string;
  vehicleId: string;
  mode: OperationsTransportVehicleMode;
  driverId?: string;
  stops: OperationsRouteStop[];
  totalWeightKg: number;
  totalVolumeM3: number;
  totalDistanceKm: number;
  estimatedCost: number;
  routeEfficiency: number;
  warnings: string[];
};

export type OperationsTransportPlan = {
  modelVersion: typeof OPERATIONS_VERSION;
  generatedAt: string;
  routes: OperationsRouteManifest[];
  unassignedShipments: Array<{
    shipmentId: string;
    reasons: string[];
  }>;
  metrics: {
    onTimeDeliveryRate: number;
    firstAttemptSuccessRate: number;
    routeEfficiency: number;
    deliveryCostPerOrder: number;
  };
  warnings: string[];
  privacy: OperationsPrivacyBoundary;
};

export type OperationsInput = {
  generatedAt?: unknown;
  warehouse?: OperationsWarehousePlanInput;
  transportation?: OperationsTransportPlanInput;
};

export type OperationsDashboard = {
  modelVersion: typeof OPERATIONS_VERSION;
  generatedAt: string;
  status: OperationsStatus;
  summary: string;
  warehouse: OperationsWarehousePlan;
  transportation: OperationsTransportPlan;
  kpis: {
    inventoryTurnoverRate: number;
    storageUtilization: number;
    orderFulfillmentAccuracy: number;
    pickingProductivityLinesPerHour: number;
    onTimeDeliveryRate: number;
    firstAttemptSuccessRate: number;
    routeEfficiency: number;
    deliveryCostPerOrder: number;
  };
  recommendedActions: string[];
  privacy: OperationsPrivacyBoundary;
};

export type OperationsPrivacyBoundary = {
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  rawRecipientStored: false;
  rawPhoneStored: false;
  rawInventorySerialPublic: false;
  publicSurface: 'operational-status-commitments-allocations-pick-tasks-route-manifests-and-kpis-only';
};

const DEFAULT_GENERATED_AT = '2026-06-18T00:00:00.000Z';
const DEFAULT_SERVICE_MINUTES = 6;
const DEFAULT_ROUTE_SPEED_KPH = 28;
const EARTH_RADIUS_KM = 6371;
const PRIVATE_VALUE_RE = /(\bAGID[-_A-Z0-9]*\b|\bAOID[-_A-Z0-9]*\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s().-]{7,}\d|\b-?\d{1,2}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,})/i;

const PRIVACY_BOUNDARY: OperationsPrivacyBoundary = {
  rawAddressStored: false,
  rawAgidStored: false,
  rawAoidStored: false,
  rawRecipientStored: false,
  rawPhoneStored: false,
  rawInventorySerialPublic: false,
  publicSurface: 'operational-status-commitments-allocations-pick-tasks-route-manifests-and-kpis-only',
};

function clean(value: unknown, maxLength = 160) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\u0000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function idFrom(prefix: string, value: unknown, seed: string) {
  const text = clean(value, 96);
  if (text && !PRIVATE_VALUE_RE.test(text)) return text;
  return `${prefix}-${sha256Hex(`${prefix}:${seed}:${text}`).slice(0, 14).toUpperCase()}`;
}

function commitment(value: unknown, domain: string, seed: string) {
  return `${domain}:${sha256Hex(`${OPERATIONS_VERSION}:${domain}:${seed}:${stableJson(value)}`).slice(0, 32)}`;
}

function number(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function positiveNumber(value: unknown, fallback: number) {
  return Math.max(0, number(value, fallback));
}

function integer(value: unknown, fallback: number) {
  return Math.max(0, Math.floor(number(value, fallback)));
}

function bool(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const text = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(text)) return true;
    if (['false', '0', 'no', 'off'].includes(text)) return false;
  }
  return fallback;
}

function iso(value: unknown, fallback = DEFAULT_GENERATED_AT) {
  const date = new Date(clean(value, 64) || fallback);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}

function optionalIso(value: unknown) {
  const text = clean(value, 64);
  if (!text) return undefined;
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

function arrayOfText(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(item => clean(item)).filter(Boolean);
  const text = clean(value);
  return text ? [text] : [];
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function normalizeHandling(value: unknown): OperationsWarehouseHandlingClass {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  return (OPERATIONS_WAREHOUSE_HANDLING_CLASSES as readonly string[]).includes(text)
    ? text as OperationsWarehouseHandlingClass
    : 'standard';
}

function normalizeHandlingList(value: unknown, fallback: OperationsWarehouseHandlingClass[] = [...OPERATIONS_WAREHOUSE_HANDLING_CLASSES]) {
  const values = arrayOfText(value)
    .map(normalizeHandling)
    .filter(Boolean);
  return unique(values.length ? values : fallback);
}

function normalizePickingStrategy(value: unknown): OperationsPickingStrategy {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  return (OPERATIONS_PICKING_STRATEGIES as readonly string[]).includes(text) ? text as OperationsPickingStrategy : 'batch';
}

function normalizeVehicleMode(value: unknown): OperationsTransportVehicleMode {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  return (OPERATIONS_TRANSPORT_VEHICLE_MODES as readonly string[]).includes(text) ? text as OperationsTransportVehicleMode : 'van';
}

function coordinate(value: Partial<OperationsCoordinate> | undefined): OperationsCoordinate | undefined {
  const lat = Number(value?.lat);
  const lng = Number(value?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;
  return { lat, lng };
}

function distanceKm(a?: OperationsCoordinate, b?: OperationsCoordinate) {
  if (!a || !b) return 0;
  const toRad = (degrees: number) => degrees * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function addMinutes(at: string, minutes: number) {
  return new Date(Date.parse(at) + Math.ceil(minutes) * 60_000).toISOString();
}

function containsPrivateMaterial(...values: unknown[]) {
  return values.some(value => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'object') return containsPrivateMaterial(JSON.stringify(value));
    return PRIVATE_VALUE_RE.test(clean(value, 1000));
  });
}

function normalizeLocation(input: OperationsWarehouseLocationInput, index: number): OperationsWarehouseLocation {
  const capacityUnits = integer(input.capacityUnits, 100);
  const currentUnits = Math.min(capacityUnits, integer(input.currentUnits, 0));
  return {
    locationId: idFrom('LOC', input.locationId, `${index}:location`),
    zone: clean(input.zone, 40) || 'A',
    aisle: clean(input.aisle, 20) || String(index + 1).padStart(2, '0'),
    bay: clean(input.bay, 20) || '01',
    capacityUnits,
    currentUnits,
    availableCapacityUnits: Math.max(0, capacityUnits - currentUnits),
    compatibleHandling: normalizeHandlingList(input.compatibleHandling),
    temperatureClass: clean(input.temperatureClass, 40) || 'ambient',
  };
}

function normalizeInventoryLot(input: OperationsInventoryLotInput, index: number): OperationsInventoryLot {
  const quantityOnHand = integer(input.quantityOnHand, 0);
  const allocatedQuantity = Math.min(quantityOnHand, integer(input.allocatedQuantity, 0));
  const lotId = idFrom('LOT', input.lotId, `${index}:${clean(input.skuId)}`);
  const serial = clean(input.serialNumber, 128);
  return {
    skuId: idFrom('SKU', input.skuId, `${index}:sku`),
    lotId,
    serialCommitment: serial ? commitment(serial, 'serial', lotId) : undefined,
    locationId: idFrom('LOC', input.locationId, `${index}:inventory-location`),
    quantityOnHand,
    allocatedQuantity,
    availableQuantity: Math.max(0, quantityOnHand - allocatedQuantity),
    receivedAt: iso(input.receivedAt),
    expiresAt: optionalIso(input.expiresAt),
    reorderPoint: integer(input.reorderPoint, 0),
    unitWeightKg: positiveNumber(input.unitWeightKg, 1),
    unitVolumeM3: positiveNumber(input.unitVolumeM3, 0.01),
    handlingClass: normalizeHandling(input.handlingClass),
  };
}

function normalizeOrderLine(input: OperationsWarehouseOrderLineInput, index: number, orderId: string): OperationsWarehouseOrderLine {
  const skuId = idFrom('SKU', input.skuId, `${orderId}:${index}:sku`);
  return {
    lineId: idFrom('LINE', input.lineId, `${orderId}:${index}:${skuId}`),
    skuId,
    quantity: Math.max(1, integer(input.quantity, 1)),
    handlingClass: normalizeHandling(input.handlingClass),
    unitWeightKg: positiveNumber(input.unitWeightKg, 1),
    unitVolumeM3: positiveNumber(input.unitVolumeM3, 0.01),
  };
}

function normalizeOrder(input: OperationsWarehouseOrderInput, index: number): OperationsWarehouseOrder {
  const orderId = idFrom('ORD', input.orderId, `${index}:order`);
  const warnings: string[] = [];
  const blocked = containsPrivateMaterial(input.rawAddress, input.recipient, input.phone);
  if (blocked) warnings.push('private-order-material-rejected');
  const linesInput = Array.isArray(input.lines) ? input.lines as OperationsWarehouseOrderLineInput[] : [];
  const lines = linesInput.length
    ? linesInput.map((line, lineIndex) => normalizeOrderLine(line, lineIndex, orderId))
    : [normalizeOrderLine({}, 0, orderId)];
  const destinationAgid = clean(input.destinationAgid, 80);
  return {
    orderId,
    priority: Math.max(0, Math.min(10, integer(input.priority, 1))),
    dueAt: optionalIso(input.dueAt),
    lines,
    destinationAgidTail: destinationAgid ? destinationAgid.slice(-6) : undefined,
    destinationAddressCommitment: clean(input.destinationAddressCommitment, 160) || undefined,
    destinationCoords: coordinate(input.destinationCoords),
    blocked,
    warnings,
  };
}

function normalizeReceivingLine(input: OperationsReceivingLineInput, index: number) {
  return {
    receiptId: idFrom('RCV', input.receiptId, `${index}:receipt`),
    skuId: idFrom('SKU', input.skuId, `${index}:receipt-sku`),
    lotId: idFrom('LOT', input.lotId, `${index}:receipt-lot`),
    quantity: integer(input.quantity, 0),
    handlingClass: normalizeHandling(input.handlingClass),
    temperatureClass: clean(input.temperatureClass, 40) || 'ambient',
    receivedAt: iso(input.receivedAt),
  };
}

function sortLotsForAllocation(lots: OperationsInventoryLot[]) {
  return [...lots].sort((a, b) => {
    const aExpiry = a.expiresAt ? Date.parse(a.expiresAt) : Number.MAX_SAFE_INTEGER;
    const bExpiry = b.expiresAt ? Date.parse(b.expiresAt) : Number.MAX_SAFE_INTEGER;
    if (aExpiry !== bExpiry) return aExpiry - bExpiry;
    return Date.parse(a.receivedAt) - Date.parse(b.receivedAt);
  });
}

function choosePickingStrategy(strategy: OperationsPickingStrategy, orders: OperationsWarehouseOrder[], taskZone: string) {
  if (strategy === 'zone' && taskZone) return 'zone';
  if (strategy === 'wave') return 'wave';
  if (strategy === 'piece' || orders.length <= 1) return 'piece';
  return 'batch';
}

function buildPutawayTasks(receiving: ReturnType<typeof normalizeReceivingLine>[], locations: OperationsWarehouseLocation[]): OperationsPutawayTask[] {
  const mutableLocations = locations.map(location => ({ ...location }));
  return receiving.map((line) => {
    const target = mutableLocations.find(location => (
      location.availableCapacityUnits >= line.quantity
      && location.temperatureClass === line.temperatureClass
      && location.compatibleHandling.includes(line.handlingClass)
    ));
    if (!target || line.quantity <= 0) {
      return {
        receiptId: line.receiptId,
        skuId: line.skuId,
        lotId: line.lotId,
        quantity: line.quantity,
        status: 'needs-review',
        reason: line.quantity <= 0 ? 'empty-receipt' : 'no-compatible-location-capacity',
      };
    }
    target.availableCapacityUnits -= line.quantity;
    target.currentUnits += line.quantity;
    return {
      receiptId: line.receiptId,
      skuId: line.skuId,
      lotId: line.lotId,
      quantity: line.quantity,
      targetLocationId: target.locationId,
      status: 'assigned',
    };
  });
}

function roundRate(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function planWarehouseExecution(input: OperationsWarehousePlanInput = {}): OperationsWarehousePlan {
  const generatedAt = iso(input.generatedAt);
  const pickingStrategy = normalizePickingStrategy(input.pickingStrategy);
  const locations = (Array.isArray(input.locations) ? input.locations as OperationsWarehouseLocationInput[] : []).map(normalizeLocation);
  const inventory = (Array.isArray(input.inventory) ? input.inventory as OperationsInventoryLotInput[] : []).map(normalizeInventoryLot);
  const orders = (Array.isArray(input.orders) ? input.orders as OperationsWarehouseOrderInput[] : []).map(normalizeOrder);
  const receiving = (Array.isArray(input.receiving) ? input.receiving as OperationsReceivingLineInput[] : []).map(normalizeReceivingLine);
  const mutableAvailability = new Map(inventory.map(lot => [lot.lotId, lot.availableQuantity]));
  const allocations: OperationsWarehouseAllocation[] = [];
  const orderSummaries: OperationsWarehousePlan['orders'] = [];
  const pickingTasks: OperationsPickingTask[] = [];
  const warnings: string[] = [];

  const sortedOrders = [...orders].sort((a, b) => {
    const dueA = a.dueAt ? Date.parse(a.dueAt) : Number.MAX_SAFE_INTEGER;
    const dueB = b.dueAt ? Date.parse(b.dueAt) : Number.MAX_SAFE_INTEGER;
    if (dueA !== dueB) return dueA - dueB;
    return b.priority - a.priority;
  });

  for (const order of sortedOrders) {
    let allocatedLines = 0;
    let allocatedQuantityTotal = 0;
    const orderWarnings = [...order.warnings];
    for (const line of order.lines) {
      let remaining = line.quantity;
      const lineAllocations: OperationsWarehouseAllocation['allocations'] = [];
      const candidateLots = sortLotsForAllocation(inventory.filter(lot => (
        lot.skuId === line.skuId
        && lot.handlingClass === line.handlingClass
        && (mutableAvailability.get(lot.lotId) ?? 0) > 0
      )));
      for (const lot of candidateLots) {
        const available = mutableAvailability.get(lot.lotId) ?? 0;
        const quantity = Math.min(available, remaining);
        if (quantity <= 0) continue;
        mutableAvailability.set(lot.lotId, available - quantity);
        remaining -= quantity;
        lineAllocations.push({
          lotId: lot.lotId,
          locationId: lot.locationId,
          quantity,
          expiresAt: lot.expiresAt,
        });
        if (remaining <= 0) break;
      }
      const allocatedQuantity = line.quantity - remaining;
      allocatedQuantityTotal += allocatedQuantity;
      if (remaining === 0) allocatedLines += 1;
      if (remaining > 0) orderWarnings.push(`${line.skuId}:shortage:${remaining}`);
      allocations.push({
        orderId: order.orderId,
        lineId: line.lineId,
        skuId: line.skuId,
        requestedQuantity: line.quantity,
        allocatedQuantity,
        shortageQuantity: remaining,
        allocations: lineAllocations,
      });
    }
    const status: OperationsWarehouseOrderStatus = order.blocked
      ? 'blocked'
      : allocatedLines === order.lines.length
        ? 'allocated'
        : allocatedQuantityTotal > 0
          ? 'partial'
          : 'short';
    orderSummaries.push({
      orderId: order.orderId,
      status,
      allocatedLines,
      totalLines: order.lines.length,
      warnings: unique(orderWarnings),
    });
  }

  let sequence = 1;
  const locationMap = new Map(locations.map(location => [location.locationId, location]));
  allocations
    .filter(allocation => allocation.allocatedQuantity > 0)
    .flatMap(allocation => allocation.allocations.map(lotAllocation => ({ allocation, lotAllocation })))
    .sort((a, b) => {
      const left = locationMap.get(a.lotAllocation.locationId);
      const right = locationMap.get(b.lotAllocation.locationId);
      return `${left?.zone ?? ''}:${left?.aisle ?? ''}:${left?.bay ?? ''}`.localeCompare(`${right?.zone ?? ''}:${right?.aisle ?? ''}:${right?.bay ?? ''}`);
    })
    .forEach(({ allocation, lotAllocation }) => {
      const location = locationMap.get(lotAllocation.locationId);
      const strategy = choosePickingStrategy(pickingStrategy, orders, location?.zone ?? '');
      pickingTasks.push({
        taskId: idFrom('PICK', undefined, `${allocation.orderId}:${allocation.lineId}:${lotAllocation.lotId}:${sequence}`),
        strategy,
        orderId: allocation.orderId,
        lineId: allocation.lineId,
        skuId: allocation.skuId,
        lotId: lotAllocation.lotId,
        locationId: lotAllocation.locationId,
        zone: location?.zone ?? 'unknown',
        aisle: location?.aisle ?? 'unknown',
        bay: location?.bay ?? 'unknown',
        quantity: lotAllocation.quantity,
        sequence,
      });
      sequence += 1;
    });

  const replenishmentAlerts = inventory
    .map((lot): OperationsReplenishmentAlert | null => {
      const availableQuantity = mutableAvailability.get(lot.lotId) ?? lot.availableQuantity;
      if (lot.reorderPoint <= 0 || availableQuantity > lot.reorderPoint) return null;
      return {
        skuId: lot.skuId,
        locationId: lot.locationId,
        availableQuantity,
        reorderPoint: lot.reorderPoint,
        action: availableQuantity === 0 ? 'replenish' : 'review',
      };
    })
    .filter((alert): alert is OperationsReplenishmentAlert => Boolean(alert));

  const putawayTasks = buildPutawayTasks(receiving, locations);
  const shippingReadyOrders = sortedOrders.filter(order => orderSummaries.find(summary => summary.orderId === order.orderId)?.status === 'allocated');
  const totalLines = orderSummaries.reduce((sum, order) => sum + order.totalLines, 0);
  const allocatedLineCount = orderSummaries.reduce((sum, order) => sum + order.allocatedLines, 0);
  const totalCapacity = locations.reduce((sum, location) => sum + location.capacityUnits, 0);
  const totalCurrent = locations.reduce((sum, location) => sum + location.currentUnits, 0);
  const averageInventoryUnits = positiveNumber(input.averageInventoryUnits, inventory.reduce((sum, lot) => sum + lot.quantityOnHand, 0));
  const shippedUnits = positiveNumber(input.shippedUnitsLast30Days, 0);
  const completedPickLines = positiveNumber(input.completedPickLines, pickingTasks.length);
  const pickLaborHours = positiveNumber(input.pickLaborHours, completedPickLines > 0 ? 1 : 0);

  if (orderSummaries.some(order => order.status === 'short' || order.status === 'partial')) warnings.push('warehouse-allocation-shortage');
  if (orderSummaries.some(order => order.status === 'blocked')) warnings.push('warehouse-order-private-material-rejected');
  if (putawayTasks.some(task => task.status === 'needs-review')) warnings.push('putaway-needs-review');
  if (replenishmentAlerts.length) warnings.push('replenishment-alerts-open');

  return {
    modelVersion: OPERATIONS_VERSION,
    generatedAt,
    pickingStrategy,
    locations,
    inventory,
    orders: orderSummaries,
    allocations,
    pickingTasks,
    putawayTasks,
    replenishmentAlerts,
    shippingReadyOrders,
    metrics: {
      inventoryTurnoverRate: averageInventoryUnits > 0 ? roundRate(shippedUnits / averageInventoryUnits) : 0,
      storageUtilization: totalCapacity > 0 ? roundRate(totalCurrent / totalCapacity) : 0,
      orderFulfillmentAccuracy: totalLines > 0 ? roundRate(allocatedLineCount / totalLines) : 0,
      pickingProductivityLinesPerHour: pickLaborHours > 0 ? Math.round((completedPickLines / pickLaborHours) * 10) / 10 : 0,
    },
    warnings: unique(warnings),
    privacy: PRIVACY_BOUNDARY,
  };
}

function normalizeVehicle(input: OperationsTransportVehicleInput, index: number): OperationsTransportVehicle {
  return {
    vehicleId: idFrom('VEH', input.vehicleId, `${index}:vehicle`),
    mode: normalizeVehicleMode(input.mode),
    available: bool(input.available, true),
    capacityWeightKg: positiveNumber(input.capacityWeightKg, 500),
    capacityVolumeM3: positiveNumber(input.capacityVolumeM3, 3),
    currentLocation: coordinate(input.currentLocation),
    compatibleHandling: normalizeHandlingList(input.compatibleHandling),
    costPerKm: positiveNumber(input.costPerKm, 1.2),
    driverId: clean(input.driverId, 96) || undefined,
  };
}

function normalizeShipment(input: OperationsShipmentInput, index: number): OperationsShipment {
  const shipmentId = idFrom('SHP', input.shipmentId, `${index}:shipment`);
  const rawBlocked = containsPrivateMaterial(input.rawAddress, input.recipient, input.phone);
  const warnings = rawBlocked ? ['private-shipment-material-rejected'] : [];
  const agid = clean(input.agid, 80);
  return {
    shipmentId,
    orderId: clean(input.orderId, 96) || undefined,
    priority: Math.max(0, Math.min(10, integer(input.priority, 1))),
    addressCommitment: clean(input.addressCommitment, 160) || undefined,
    agidTail: agid ? agid.slice(-6) : undefined,
    coords: coordinate(input.coords),
    weightKg: positiveNumber(input.weightKg, 1),
    volumeM3: positiveNumber(input.volumeM3, 0.01),
    serviceMinutes: positiveNumber(input.serviceMinutes, DEFAULT_SERVICE_MINUTES),
    timeWindowEnd: optionalIso(input.timeWindowEnd),
    requiredHandling: normalizeHandlingList(input.requiredHandling, ['standard']),
    blocked: rawBlocked,
    warnings,
  };
}

function deriveShipmentsFromWarehouse(warehouse: OperationsWarehousePlan): OperationsShipmentInput[] {
  return warehouse.shippingReadyOrders.map((order) => {
    const weightKg = order.lines.reduce((sum, line) => sum + line.quantity * line.unitWeightKg, 0);
    const volumeM3 = order.lines.reduce((sum, line) => sum + line.quantity * line.unitVolumeM3, 0);
    return {
      shipmentId: `shipment:${order.orderId}`,
      orderId: order.orderId,
      priority: order.priority,
      addressCommitment: order.destinationAddressCommitment,
      agid: order.destinationAgidTail,
      coords: order.destinationCoords,
      weightKg,
      volumeM3,
      timeWindowEnd: order.dueAt,
      requiredHandling: unique(order.lines.map(line => line.handlingClass)),
    };
  });
}

function travelMinutes(km: number, mode: OperationsTransportVehicleMode) {
  const speed = mode === 'walk'
    ? 5
    : mode === 'bicycle'
      ? 14
      : mode === 'drone'
        ? 45
        : mode === 'truck'
          ? 24
          : DEFAULT_ROUTE_SPEED_KPH;
  return km > 0 ? Math.max(1, Math.ceil((km / speed) * 60)) : 0;
}

function routeCandidateScore(vehicle: OperationsTransportVehicle, shipment: OperationsShipment, currentLoad: { weight: number; volume: number }, distance: number, nowMs: number) {
  if (!vehicle.available) return -500;
  if (shipment.blocked) return -500;
  if (!shipment.coords || !vehicle.currentLocation) return -250;
  if (currentLoad.weight + shipment.weightKg > vehicle.capacityWeightKg) return -200;
  if (currentLoad.volume + shipment.volumeM3 > vehicle.capacityVolumeM3) return -200;
  const missingHandling = shipment.requiredHandling.filter(item => !vehicle.compatibleHandling.includes(item));
  if (missingHandling.length) return -180 - missingHandling.length * 10;
  let score = 100 - distance * 2 + shipment.priority * 5;
  if (shipment.timeWindowEnd) {
    const eta = nowMs + travelMinutes(distance, vehicle.mode) * 60_000;
    if (eta > Date.parse(shipment.timeWindowEnd)) score -= 45;
  }
  return Math.round(score);
}

function eventStatus(event: OperationsTransportEventInput) {
  const text = clean(event.status).toLowerCase().replace(/_/g, '-');
  if (['failed', 'attempted', 'cancelled'].includes(text)) return text;
  return 'completed';
}

function transportMetrics(routes: OperationsRouteManifest[], events: OperationsTransportEventInput[]) {
  const completedEvents = events.filter(event => eventStatus(event) === 'completed');
  const attemptedEvents = events.filter(event => eventStatus(event) === 'attempted' || eventStatus(event) === 'failed' || eventStatus(event) === 'completed');
  const late = completedEvents.filter((event) => {
    const completedAt = optionalIso(event.completedAt);
    const deadline = optionalIso(event.deadline);
    return completedAt && deadline && Date.parse(completedAt) > Date.parse(deadline);
  }).length;
  const firstAttemptSuccesses = completedEvents.filter(event => integer(event.attempt, 1) <= 1).length;
  const routeCount = routes.length;
  const assignedOrders = routes.reduce((sum, route) => sum + route.stops.length, 0);
  const totalCost = routes.reduce((sum, route) => sum + route.estimatedCost, 0);
  return {
    onTimeDeliveryRate: completedEvents.length ? roundRate((completedEvents.length - late) / completedEvents.length) : 0,
    firstAttemptSuccessRate: attemptedEvents.length ? roundRate(firstAttemptSuccesses / attemptedEvents.length) : 0,
    routeEfficiency: routeCount ? roundRate(routes.reduce((sum, route) => sum + route.routeEfficiency, 0) / routeCount) : 0,
    deliveryCostPerOrder: assignedOrders ? Math.round((totalCost / assignedOrders) * 100) / 100 : 0,
  };
}

export function planTransportationExecution(input: OperationsTransportPlanInput = {}): OperationsTransportPlan {
  const generatedAt = iso(input.generatedAt);
  const vehicles = (Array.isArray(input.vehicles) ? input.vehicles as OperationsTransportVehicleInput[] : []).map(normalizeVehicle);
  const shipments = (Array.isArray(input.shipments) ? input.shipments as OperationsShipmentInput[] : []).map(normalizeShipment);
  const events = Array.isArray(input.events) ? input.events as OperationsTransportEventInput[] : [];
  const mutable = new Map(vehicles.map(vehicle => [vehicle.vehicleId, {
    vehicle,
    cursor: vehicle.currentLocation,
    timeMs: Date.parse(generatedAt),
    weight: 0,
    volume: 0,
    distance: 0,
    idealDistance: 0,
    stops: [] as OperationsRouteStop[],
    warnings: [] as string[],
  }]));
  const unassignedShipments: OperationsTransportPlan['unassignedShipments'] = [];
  const sortedShipments = [...shipments].sort((a, b) => {
    const aDeadline = a.timeWindowEnd ? Date.parse(a.timeWindowEnd) : Number.MAX_SAFE_INTEGER;
    const bDeadline = b.timeWindowEnd ? Date.parse(b.timeWindowEnd) : Number.MAX_SAFE_INTEGER;
    if (aDeadline !== bDeadline) return aDeadline - bDeadline;
    return b.priority - a.priority;
  });

  for (const shipment of sortedShipments) {
    const candidates = [...mutable.values()].map((state) => {
      const km = distanceKm(state.cursor, shipment.coords);
      return {
        state,
        km,
        score: routeCandidateScore(state.vehicle, shipment, state, km, state.timeMs),
      };
    }).sort((a, b) => b.score - a.score);
    const selected = candidates.find(candidate => candidate.score >= 0);
    if (!selected) {
      const top = candidates[0];
      const reasons = shipment.blocked
        ? ['private-shipment-material-rejected']
        : !shipment.coords
          ? ['missing-shipment-coordinates']
          : !top
            ? ['no-vehicle']
            : [`best-score:${top.score}`];
      unassignedShipments.push({ shipmentId: shipment.shipmentId, reasons });
      continue;
    }

    const travel = travelMinutes(selected.km, selected.state.vehicle.mode);
    const eta = addMinutes(new Date(selected.state.timeMs).toISOString(), travel);
    const warnings = [...shipment.warnings];
    let status: OperationsTransportShipmentStatus = 'assigned';
    if (shipment.timeWindowEnd && Date.parse(eta) > Date.parse(shipment.timeWindowEnd)) {
      warnings.push('eta-after-time-window');
      status = 'late-risk';
    }
    selected.state.stops.push({
      shipmentId: shipment.shipmentId,
      orderId: shipment.orderId,
      addressCommitment: shipment.addressCommitment,
      agidTail: shipment.agidTail,
      eta,
      distanceKm: Math.round(selected.km * 100) / 100,
      serviceMinutes: shipment.serviceMinutes,
      status,
      warnings: unique(warnings),
    });
    selected.state.cursor = shipment.coords;
    selected.state.timeMs = Date.parse(eta) + shipment.serviceMinutes * 60_000;
    selected.state.weight += shipment.weightKg;
    selected.state.volume += shipment.volumeM3;
    selected.state.distance += selected.km;
    selected.state.idealDistance = Math.max(selected.state.idealDistance, distanceKm(selected.state.vehicle.currentLocation, shipment.coords));
    selected.state.warnings.push(...warnings);
  }

  const routes = [...mutable.values()].filter(state => state.stops.length > 0).map((state) => {
    const routeEfficiency = state.distance > 0 ? Math.min(1, state.idealDistance / state.distance) : 1;
    const estimatedCost = state.distance * state.vehicle.costPerKm;
    return {
      routeId: idFrom('ROUTE', undefined, `${state.vehicle.vehicleId}:${generatedAt}:${state.stops.map(stop => stop.shipmentId).join(':')}`),
      vehicleId: state.vehicle.vehicleId,
      mode: state.vehicle.mode,
      driverId: state.vehicle.driverId,
      stops: state.stops,
      totalWeightKg: Math.round(state.weight * 100) / 100,
      totalVolumeM3: Math.round(state.volume * 1000) / 1000,
      totalDistanceKm: Math.round(state.distance * 100) / 100,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      routeEfficiency: roundRate(routeEfficiency),
      warnings: unique(state.warnings),
    };
  });
  const metrics = transportMetrics(routes, events);
  const warnings = unique([
    ...(unassignedShipments.length ? ['transportation-unassigned-shipments'] : []),
    ...(routes.some(route => route.warnings.includes('eta-after-time-window')) ? ['transportation-late-risk'] : []),
  ]);
  return {
    modelVersion: OPERATIONS_VERSION,
    generatedAt,
    routes,
    unassignedShipments,
    metrics,
    warnings,
    privacy: PRIVACY_BOUNDARY,
  };
}

export function buildOperationsDashboard(input: OperationsInput = {}): OperationsDashboard {
  const generatedAt = iso(input.generatedAt);
  const warehouse = planWarehouseExecution({
    ...(input.warehouse ?? {}),
    generatedAt: input.warehouse?.generatedAt ?? generatedAt,
  });
  const explicitShipments = Array.isArray(input.transportation?.shipments) ? input.transportation?.shipments : undefined;
  const transportation = planTransportationExecution({
    ...(input.transportation ?? {}),
    generatedAt: input.transportation?.generatedAt ?? generatedAt,
    shipments: explicitShipments ?? deriveShipmentsFromWarehouse(warehouse),
  });
  const recommendedActions = unique([
    ...(warehouse.warnings.includes('warehouse-allocation-shortage') ? ['review-shortages-and-replenishment-policy'] : []),
    ...(warehouse.warnings.includes('replenishment-alerts-open') ? ['review-replenishment-alerts-before-next-wave'] : []),
    ...(warehouse.warnings.includes('putaway-needs-review') ? ['review-putaway-location-capacity'] : []),
    ...(transportation.warnings.includes('transportation-unassigned-shipments') ? ['review-vehicle-capacity-handling-and-geocoding'] : []),
    ...(transportation.warnings.includes('transportation-late-risk') ? ['recalculate-routes-or-adjust-time-windows'] : []),
    ...(warehouse.metrics.pickingProductivityLinesPerHour > 0 && warehouse.metrics.pickingProductivityLinesPerHour < 20 ? ['inspect-picking-path-and-station-staffing'] : []),
  ]);
  if (!recommendedActions.length) recommendedActions.push('continue-monitoring-wms-tms-flow');
  const blocked = warehouse.orders.some(order => order.status === 'blocked') || transportation.unassignedShipments.some(item => item.reasons.includes('private-shipment-material-rejected'));
  const status: OperationsStatus = blocked
    ? 'blocked'
    : warehouse.warnings.length || transportation.warnings.length
      ? 'attention'
      : 'ready';
  return {
    modelVersion: OPERATIONS_VERSION,
    generatedAt,
    status,
    summary: status === 'ready'
      ? 'Warehouse allocation, picking, putaway, and transportation execution are ready.'
      : status === 'blocked'
        ? 'Private material or blocked operational records must be removed before execution.'
        : 'Review WMS/TMS shortages, putaway, route, or KPI warnings before scaling.',
    warehouse,
    transportation,
    kpis: {
      inventoryTurnoverRate: warehouse.metrics.inventoryTurnoverRate,
      storageUtilization: warehouse.metrics.storageUtilization,
      orderFulfillmentAccuracy: warehouse.metrics.orderFulfillmentAccuracy,
      pickingProductivityLinesPerHour: warehouse.metrics.pickingProductivityLinesPerHour,
      onTimeDeliveryRate: transportation.metrics.onTimeDeliveryRate,
      firstAttemptSuccessRate: transportation.metrics.firstAttemptSuccessRate,
      routeEfficiency: transportation.metrics.routeEfficiency,
      deliveryCostPerOrder: transportation.metrics.deliveryCostPerOrder,
    },
    recommendedActions,
    privacy: PRIVACY_BOUNDARY,
  };
}
