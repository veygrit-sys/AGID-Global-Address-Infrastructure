import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildOperationsDashboard,
  planTransportationExecution,
  planWarehouseExecution,
} from './operations';

const generatedAt = '2026-06-18T09:00:00.000Z';

const locations = [
  {
    locationId: 'A-01-01',
    zone: 'A',
    aisle: '01',
    bay: '01',
    capacityUnits: 100,
    currentUnits: 70,
    compatibleHandling: ['standard', 'cold-chain'],
    temperatureClass: 'cold',
  },
  {
    locationId: 'B-02-01',
    zone: 'B',
    aisle: '02',
    bay: '01',
    capacityUnits: 100,
    currentUnits: 30,
    compatibleHandling: ['standard', 'heavy'],
    temperatureClass: 'ambient',
  },
];

const inventory = [
  {
    skuId: 'SKU-MILK',
    lotId: 'LOT-LATE',
    locationId: 'A-01-01',
    quantityOnHand: 20,
    allocatedQuantity: 0,
    receivedAt: '2026-06-01T00:00:00.000Z',
    expiresAt: '2026-07-10T00:00:00.000Z',
    reorderPoint: 5,
    unitWeightKg: 1,
    unitVolumeM3: 0.002,
    handlingClass: 'cold-chain',
  },
  {
    skuId: 'SKU-MILK',
    lotId: 'LOT-EARLY',
    locationId: 'A-01-01',
    quantityOnHand: 8,
    allocatedQuantity: 0,
    receivedAt: '2026-06-02T00:00:00.000Z',
    expiresAt: '2026-06-30T00:00:00.000Z',
    reorderPoint: 5,
    unitWeightKg: 1,
    unitVolumeM3: 0.002,
    handlingClass: 'cold-chain',
  },
  {
    skuId: 'SKU-BOX',
    lotId: 'LOT-BOX',
    locationId: 'B-02-01',
    quantityOnHand: 10,
    allocatedQuantity: 0,
    receivedAt: '2026-05-10T00:00:00.000Z',
    reorderPoint: 3,
    unitWeightKg: 3,
    unitVolumeM3: 0.02,
    handlingClass: 'standard',
  },
];

const orders = [
  {
    orderId: 'ORDER-COLD',
    priority: 5,
    dueAt: '2026-06-18T12:00:00.000Z',
    destinationAddressCommitment: 'addr:tokyo-cold',
    destinationAgid: 'ML01R1A0ZTR4',
    destinationCoords: { lat: 35.6812, lng: 139.7671 },
    lines: [
      {
        lineId: 'L1',
        skuId: 'SKU-MILK',
        quantity: 10,
        handlingClass: 'cold-chain',
        unitWeightKg: 1,
        unitVolumeM3: 0.002,
      },
    ],
  },
  {
    orderId: 'ORDER-BOX',
    priority: 2,
    dueAt: '2026-06-18T14:00:00.000Z',
    destinationAddressCommitment: 'addr:tokyo-box',
    destinationCoords: { lat: 35.69, lng: 139.78 },
    lines: [
      {
        lineId: 'L2',
        skuId: 'SKU-BOX',
        quantity: 4,
        handlingClass: 'standard',
        unitWeightKg: 3,
        unitVolumeM3: 0.02,
      },
    ],
  },
];

test('warehouse execution allocates FEFO lots, creates pick tasks, putaway tasks, and KPIs', () => {
  const plan = planWarehouseExecution({
    generatedAt,
    pickingStrategy: 'zone',
    locations,
    inventory,
    orders,
    receiving: [
      {
        receiptId: 'RCV-COLD',
        skuId: 'SKU-MILK',
        lotId: 'LOT-NEW',
        quantity: 5,
        handlingClass: 'cold-chain',
        temperatureClass: 'cold',
      },
    ],
    shippedUnitsLast30Days: 120,
    averageInventoryUnits: 60,
    completedPickLines: 40,
    pickLaborHours: 2,
  });

  const milkAllocation = plan.allocations.find(allocation => allocation.orderId === 'ORDER-COLD');
  assert.equal(plan.orders.find(order => order.orderId === 'ORDER-COLD')?.status, 'allocated');
  assert.equal(milkAllocation?.allocatedQuantity, 10);
  assert.equal(milkAllocation?.allocations[0].lotId, 'LOT-EARLY');
  assert.equal(milkAllocation?.allocations[1].lotId, 'LOT-LATE');
  assert.equal(plan.pickingTasks[0].strategy, 'zone');
  assert.equal(plan.putawayTasks[0].targetLocationId, 'A-01-01');
  assert.equal(plan.metrics.inventoryTurnoverRate, 2);
  assert.equal(plan.metrics.storageUtilization, 0.5);
  assert.equal(plan.metrics.orderFulfillmentAccuracy, 1);
  assert.equal(plan.metrics.pickingProductivityLinesPerHour, 20);
  assert.equal(plan.privacy.rawAddressStored, false);
  assert.equal(plan.privacy.rawInventorySerialPublic, false);
});

test('warehouse execution flags shortages and replenishment needs', () => {
  const plan = planWarehouseExecution({
    generatedAt,
    locations,
    inventory,
    orders: [
      {
        orderId: 'ORDER-SHORT',
        lines: [{ skuId: 'SKU-BOX', quantity: 99, handlingClass: 'standard' }],
      },
    ],
  });

  assert.equal(plan.orders[0].status, 'partial');
  assert.equal(plan.allocations[0].shortageQuantity, 89);
  assert.ok(plan.warnings.includes('warehouse-allocation-shortage'));
  assert.ok(plan.replenishmentAlerts.some(alert => alert.skuId === 'SKU-BOX'));
});

test('warehouse execution blocks raw private order material', () => {
  const plan = planWarehouseExecution({
    generatedAt,
    locations,
    inventory,
    orders: [
      {
        orderId: 'ORDER-PRIVATE',
        rawAddress: '35.681236, 139.767125',
        phone: '+81-90-1234-5678',
        lines: [{ skuId: 'SKU-MILK', quantity: 1, handlingClass: 'cold-chain' }],
      },
    ],
  });

  assert.equal(plan.orders[0].status, 'blocked');
  assert.ok(plan.warnings.includes('warehouse-order-private-material-rejected'));
  assert.equal(plan.privacy.rawRecipientStored, false);
});

test('transportation execution assigns shipments by capacity, handling, and time window', () => {
  const plan = planTransportationExecution({
    generatedAt,
    vehicles: [
      {
        vehicleId: 'VAN-COLD',
        mode: 'van',
        available: true,
        capacityWeightKg: 50,
        capacityVolumeM3: 2,
        currentLocation: { lat: 35.68, lng: 139.76 },
        compatibleHandling: ['standard', 'cold-chain'],
        costPerKm: 2,
        driverId: 'DRV-COLD',
      },
    ],
    shipments: [
      {
        shipmentId: 'SHIP-COLD',
        orderId: 'ORDER-COLD',
        addressCommitment: 'addr:tokyo-cold',
        agid: 'ML01R1A0ZTR4',
        coords: { lat: 35.6812, lng: 139.7671 },
        weightKg: 10,
        volumeM3: 0.02,
        requiredHandling: ['cold-chain'],
        timeWindowEnd: '2026-06-18T10:00:00.000Z',
      },
      {
        shipmentId: 'SHIP-TOO-HEAVY',
        coords: { lat: 35.7, lng: 139.8 },
        weightKg: 999,
        requiredHandling: ['standard'],
      },
    ],
    events: [
      {
        shipmentId: 'SHIP-COLD',
        vehicleId: 'VAN-COLD',
        status: 'completed',
        attempt: 1,
        completedAt: '2026-06-18T09:40:00.000Z',
        deadline: '2026-06-18T10:00:00.000Z',
      },
    ],
  });

  assert.equal(plan.routes.length, 1);
  assert.equal(plan.routes[0].vehicleId, 'VAN-COLD');
  assert.equal(plan.routes[0].stops[0].shipmentId, 'SHIP-COLD');
  assert.equal(plan.unassignedShipments[0].shipmentId, 'SHIP-TOO-HEAVY');
  assert.equal(plan.metrics.onTimeDeliveryRate, 1);
  assert.equal(plan.metrics.firstAttemptSuccessRate, 1);
  assert.ok(plan.metrics.deliveryCostPerOrder > 0);
  assert.equal(plan.privacy.rawAgidStored, false);
});

test('integrated dashboard derives shipments from allocated warehouse orders', () => {
  const dashboard = buildOperationsDashboard({
    generatedAt,
    warehouse: {
      generatedAt,
      locations,
      inventory,
      orders,
      completedPickLines: 60,
      pickLaborHours: 2,
    },
    transportation: {
      generatedAt,
      vehicles: [
        {
          vehicleId: 'VAN-1',
          mode: 'van',
          capacityWeightKg: 200,
          capacityVolumeM3: 6,
          currentLocation: { lat: 35.67, lng: 139.75 },
          compatibleHandling: ['standard', 'cold-chain'],
          costPerKm: 1.5,
        },
      ],
      events: [
        {
          shipmentId: 'shipment:ORDER-COLD',
          status: 'completed',
          attempt: 1,
          completedAt: '2026-06-18T11:00:00.000Z',
          deadline: '2026-06-18T12:00:00.000Z',
        },
      ],
    },
  });

  assert.equal(dashboard.status, 'attention');
  assert.equal(dashboard.transportation.routes[0].stops.length, 2);
  assert.equal(dashboard.kpis.orderFulfillmentAccuracy, 1);
  assert.equal(dashboard.kpis.pickingProductivityLinesPerHour, 30);
  assert.ok(dashboard.recommendedActions.includes('review-replenishment-alerts-before-next-wave'));
  assert.equal(dashboard.privacy.rawAddressStored, false);
});
