# Table

Table is the AGID tablet ordering and restaurant POS integration layer. It is
designed for restaurants and cafes that need QR ordering, menu synchronization,
kitchen display workflows, inventory-aware checkout, and real-time POS handoff
without mixing customer personal data into the table-ordering core.

## Scope

Table covers dine-in ordering and restaurant floor operations:

- QR session start from a table code.
- Tablet and smartphone menu browsing.
- Multilingual menu names and descriptions.
- Inventory-aware item availability.
- Cart, modifiers, item notes, tax, service charge, and order confirmation.
- Kitchen Display System (KDS) ticket generation.
- POS synchronization payload commitments.
- Staff assistance requests and table session state.
- Admin dashboard metrics for active sessions, orders, KDS queue, revenue,
  low-stock items, ecommerce-ready stock, and POS sync issues.

Table is not the same as the delivery POS terminal. The delivery POS terminal
handles AGID-S, AOID credentials, recipient proof, carrier scans, waybills, and
handoff receipts. Table can hand orders to that system when a restaurant order
becomes pickup, dispatch, or delivery.

## Core Model

The TypeScript core is implemented in `src/lib/table.ts`.

### TableSession

`TableSession` represents a QR-started table session.

Important fields:

- `sessionId`: Stable session reference.
- `tableId`: Restaurant table reference.
- `locationId`: Store or branch reference.
- `qrSessionRef`: Commitment to the QR token. The raw token is not stored.
- `guestCount`: Party size.
- `language`: Active menu language.
- `status`: `open`, `needs-staff`, `checkout`, `closed`, or `expired`.
- `expiresAt`: QR session TTL boundary.

### TableMenu

`TableMenu` combines localized menu content with inventory snapshots.

Important behavior:

- Exact language match is preferred.
- Base language match is used as fallback.
- English is the next fallback.
- Items are marked `available`, `limited`, `sold-out`, or `hidden`.
- Sold-out and hidden items cannot be ordered.
- Inventory and ecommerce quantities are separated.

### TableOrder

`TableOrder` converts a table cart into an auditable restaurant order.

It produces:

- Line-level status: `accepted`, `needs-review`, or `unavailable`.
- Subtotal, tax total, service charge, and total.
- POS sync commitment, not raw payment data.
- KDS ticket lines.
- Inventory reservation commitments.
- Privacy warnings when private material appears in free-text notes.

### TableKitchenDisplay

`TableKitchenDisplay` sorts KDS tickets by priority and elapsed time.

It supports:

- Station filtering.
- Status filtering.
- Urgent ticket counting.
- Elapsed time calculation.

### TableAdminDashboard

`TableAdminDashboard` aggregates operational signals:

- Active table sessions.
- Open orders.
- KDS queue length.
- Paid or authorized revenue.
- Average ticket value.
- Low-stock and sold-out items.
- Ecommerce sellable items.
- Pending, failed, or offline POS sync count.
- Staff assistance requests.

## Privacy Boundary

Table must not store:

- Raw customer name.
- Phone number.
- Address.
- Payment credentials.
- Raw QR token.

The core redacts private-looking free text in special instructions and stores
commitments for QR and POS payload handoff. This is intentional: restaurant
ordering should remain operational data unless a separate delivery, identity, or
receipt proof flow explicitly requires stronger identity handling.

## Integration Points

Table can connect to the rest of AGID through these boundaries:

- POS terminal: order acceptance, payment state, receipt issue, refund state.
- Operations: inventory, picking, packing, dispatch, route planning.
- Delivery POS: pickup QR, recipient proof, carrier scan, handoff receipt.
- Address Intent: delivery or return orders that require address validation.
- Address Webhooks: order submitted, KDS ready, POS synced, pickup prepared.
- Address Dashboard: admin metrics, audit logs, review queue.

## Frontend Screens To Build

Customer tablet:

- QR session loading screen.
- Menu category screen.
- Item detail with image, allergens, dietary tags, modifiers, and availability.
- Cart and checkout screen.
- Order confirmation and call-staff screen.

Kitchen:

- KDS queue by station.
- Urgent/elapsed-time view.
- One-tap status update.
- Special-instruction highlight.

Manager:

- Active table map.
- Live orders.
- POS sync queue.
- Inventory warnings.
- Revenue and performance metrics.
- Multi-location selector.

## Verification

Current automated checks:

- QR session and language-aware menu behavior.
- Inventory availability and ecommerce quantity separation.
- Order totals, POS commitment, KDS ticket generation, and privacy redaction.
- KDS priority and elapsed-time sorting.
- Admin dashboard metrics.

Run:

```bash
npx tsx --test src/lib/table.test.ts
npm run lint
```
