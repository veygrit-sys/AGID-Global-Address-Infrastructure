import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildKitchenDisplay,
  buildTableDashboard,
  buildTableMenu,
  createTableOrder,
  createTableSession,
} from './table';

const MENU_ITEMS = [
  {
    itemId: 'coffee',
    categoryId: 'drinks',
    names: { en: 'Coffee', 'ja-JP': 'Kohi JP' },
    descriptions: { en: 'Hot coffee', 'ja-JP': 'Hot coffee JP' },
    price: 4,
    taxRate: 0.1,
    allergens: [],
    dietaryTags: ['vegetarian'],
    modifiers: [
      { modifierId: 'soy', names: { en: 'Soy milk', 'ja-JP': 'Soy milk JP' }, price: 0.5 },
      { modifierId: 'extra-shot', names: { en: 'Extra shot' }, price: 1, active: false },
    ],
  },
  {
    itemId: 'sandwich',
    categoryId: 'food',
    names: { en: 'Sandwich', 'ja-JP': 'Sandwich JP' },
    price: 8,
    taxRate: 0.1,
  },
];

const INVENTORY = [
  {
    itemId: 'coffee',
    locationId: 'store-1',
    stockQuantity: 2,
    reservedQuantity: 0,
    lowStockThreshold: 3,
    ecommerceQuantity: 1,
    ecommerceListed: true,
    lastSyncedAt: '2026-06-18T00:00:00.000Z',
  },
  {
    itemId: 'sandwich',
    locationId: 'store-1',
    stockQuantity: 0,
    reservedQuantity: 0,
    lowStockThreshold: 3,
    ecommerceListed: true,
  },
];

test('Table creates QR sessions and localized inventory-aware menus', () => {
  const session = createTableSession({
    tableId: 'table-12',
    locationId: 'store-1',
    qrToken: 'qr-session-token',
    guestCount: 3,
    language: 'ja-JP',
    openedAt: '2026-06-18T00:00:00.000Z',
    ttlSeconds: 600,
  });

  assert.equal(session.tableId, 'table-12');
  assert.equal(session.guestCount, 3);
  assert.equal(session.language, 'ja-JP');
  assert.equal(session.expiresAt, '2026-06-18T00:10:00.000Z');
  assert.equal(session.privacy.qrTokenStoredAsCommitment, true);

  const menu = buildTableMenu({
    language: session.language,
    locationId: session.locationId,
    categories: [
      { categoryId: 'drinks', names: { en: 'Drinks', 'ja-JP': 'Drinks JP' }, sortOrder: 2 },
      { categoryId: 'food', names: { en: 'Food', 'ja-JP': 'Food JP' }, sortOrder: 1 },
    ],
    items: MENU_ITEMS,
    inventory: INVENTORY,
    updatedAt: '2026-06-18T00:01:00.000Z',
  });

  const coffee = menu.items.find(item => item.itemId === 'coffee');
  const sandwich = menu.items.find(item => item.itemId === 'sandwich');

  assert.equal(menu.categories[0].categoryId, 'food');
  assert.equal(coffee?.displayName, 'Kohi JP');
  assert.equal(coffee?.availability, 'limited');
  assert.equal(coffee?.canOrder, true);
  assert.equal(sandwich?.availability, 'sold-out');
  assert.equal(sandwich?.canOrder, false);
});

test('Table order calculation redacts private notes and emits POS/KDS records', () => {
  const session = createTableSession({
    sessionId: 'sess-1',
    tableId: 'table-12',
    locationId: 'store-1',
    language: 'en',
    openedAt: '2026-06-18T00:00:00.000Z',
  });
  const menu = buildTableMenu({
    language: 'en',
    locationId: 'store-1',
    categories: [{ categoryId: 'drinks', names: { en: 'Drinks' } }],
    items: MENU_ITEMS,
    inventory: INVENTORY,
    updatedAt: '2026-06-18T00:01:00.000Z',
  });

  const order = createTableOrder({
    orderId: 'order-1',
    session,
    menu,
    cartLines: [
      {
        lineId: 'line-1',
        itemId: 'coffee',
        quantity: 2,
        modifierIds: ['soy'],
        specialInstructions: 'call +1 202 555 0199 when ready',
      },
      {
        lineId: 'line-2',
        itemId: 'sandwich',
        quantity: 1,
      },
    ],
    serviceChargeRate: 0.05,
    paymentStatus: 'authorized',
    submittedAt: '2026-06-18T00:02:00.000Z',
    posEndpointRef: 'pos-main',
  });

  assert.equal(order.status, 'submitted');
  assert.equal(order.paymentStatus, 'authorized');
  assert.equal(order.subtotal, 9);
  assert.equal(order.taxTotal, 0.9);
  assert.equal(order.serviceCharge, 0.45);
  assert.equal(order.total, 10.35);
  assert.equal(order.posSync.status, 'pending');
  assert.equal(order.kdsTicket.lines.length, 1);
  assert.equal(order.kdsTicket.lines[0].specialInstructions, 'redacted-private-instruction');
  assert.equal(order.privacy.specialInstructionsPrivateMaterialRedacted, true);
  assert.ok(order.warnings.includes('order-has-unavailable-lines'));
  assert.ok(order.warnings.includes('private-material-redacted'));
  assert.equal(JSON.stringify(order).includes('+1 202'), false);
});

test('Kitchen display sorts by priority and elapsed time', () => {
  const early = createTableOrder({
    orderId: 'order-early',
    session: { sessionId: 'sess-a', tableId: 'table-1', locationId: 'store-1', language: 'en' },
    menuItems: MENU_ITEMS,
    inventory: INVENTORY,
    cartLines: [{ itemId: 'coffee', quantity: 1 }],
    priority: 1,
    submittedAt: '2026-06-18T00:00:00.000Z',
  });
  const urgent = createTableOrder({
    orderId: 'order-urgent',
    session: { sessionId: 'sess-b', tableId: 'table-2', locationId: 'store-1', language: 'en' },
    menuItems: MENU_ITEMS,
    inventory: INVENTORY,
    cartLines: [{ itemId: 'coffee', quantity: 1 }],
    priority: 5,
    submittedAt: '2026-06-18T00:10:00.000Z',
  });

  const display = buildKitchenDisplay({
    orders: [early, urgent],
    now: '2026-06-18T00:20:00.000Z',
    statuses: ['new'],
  });

  assert.equal(display.tickets.length, 2);
  assert.equal(display.tickets[0].orderId, 'order-urgent');
  assert.equal(display.summary.new, 2);
  assert.equal(display.summary.urgent, 2);
  assert.equal(display.tickets.find(ticket => ticket.orderId === 'order-early')?.elapsedMinutes, 20);
});

test('Dashboard tracks operations metrics without requiring personal data', () => {
  const session = createTableSession({
    sessionId: 'sess-1',
    tableId: 'table-12',
    locationId: 'store-1',
    status: 'needs-staff',
    openedAt: '2026-06-18T00:00:00.000Z',
  });
  const paidOrder = createTableOrder({
    orderId: 'order-paid',
    session,
    menuItems: MENU_ITEMS,
    inventory: INVENTORY,
    cartLines: [{ itemId: 'coffee', quantity: 1 }],
    paymentStatus: 'paid',
    posSyncStatus: 'synced',
    submittedAt: '2026-06-18T00:02:00.000Z',
  });
  const offlineOrder = createTableOrder({
    orderId: 'order-offline',
    session,
    menuItems: MENU_ITEMS,
    inventory: INVENTORY,
    cartLines: [{ itemId: 'coffee', quantity: 1 }],
    offline: true,
    submittedAt: '2026-06-18T00:03:00.000Z',
  });

  const dashboard = buildTableDashboard({
    sessions: [session],
    orders: [paidOrder, offlineOrder],
    inventory: INVENTORY,
    locations: ['store-1'],
    now: '2026-06-18T00:30:00.000Z',
  });

  assert.equal(dashboard.metrics.activeSessions, 1);
  assert.equal(dashboard.metrics.openOrders, 2);
  assert.equal(dashboard.metrics.pendingPosSync, 1);
  assert.equal(dashboard.metrics.lowStockItems, 2);
  assert.equal(dashboard.metrics.ecommerceSellableItems, 1);
  assert.equal(dashboard.metrics.revenue, 4.4);
  assert.equal(dashboard.privacy.customerPersonalDataRequired, false);
  assert.ok(dashboard.recommendedActions.includes('review-pos-sync-queue'));
  assert.ok(dashboard.recommendedActions.includes('dispatch-floor-staff'));
});
