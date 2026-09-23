# Veygrit Address Wallet App

Veygrit is the Address Wallet OS for Vey ID, Address Wallet reuse, Friends delivery, Store discovery, and merchant delivery integration.

## App Structure

```text
Home
Friends
Store
  Topics
  Discover
  My Stores
My Page
```

Home is the daily address dashboard:

- My Address: primary address refs only.
- Spare Address: family, work, hotel, warehouse, and temporary address refs.
- QR: store counter, EC login, parcel receipt, and address share refs.
- Recent Deliveries: shipment and tracking aliases.
- Recent Stores: connected store refs.

Friends never exposes address text. Friends can see only display name, icon ref, Vey ID, and trust state. Delivery selection happens through wallet-scoped permission.

Store is the Playlist Commerce surface. Topics handles ranked or editorial shelves. Discover stays fixed to 32 genres. My Stores handles wallet-side revocation for connected EC stores.

My Page stays small: Profile, Payment Methods, Notifications, Help, and Settings.

## Identity Rule

Account creation uses Google or Apple only. Password signup and email/password signup are disabled for the Veygrit app model.

Vey ID is the identity layer merchants can install. Vey ID reuses Address Wallet address refs and returns merchant-safe references instead of raw address text.

## Commerce Boundaries

| Surface | Start point | Install target | Browse without login | Checkout login | Main role |
|---|---|---|---:|---:|---|
| Playlist Commerce | Veygrit app | Veygrit app | Yes | Optional | Discover and manage stores |
| EC Social Login | EC site | EC site | Yes | Required | Login and address reuse |
| Delivery Gateway | Merchant Console | Merchant backend | Yes | Required | One integration for multiple carriers |

## Guest Checkout Boundary

Veygrit supports guest-first commerce. A buyer can browse Playlist Commerce, select a store, and start checkout without creating a Veygrit account. Address reuse still requires wallet consent.

Merchant-safe guest outputs:

- `guestCheckoutRef`
- `checkoutAlias`
- `walletConsentRef`
- `carrierHandoffRef`
- `trackingAlias`

Blocked guest actions:

- Save address without account
- Persist raw address
- View friend address
- Bypass wallet consent
- Receive provider token

## Address Entry

Users enter addresses through familiar country address forms. P/O/BOX is supported where the country form allows it. UPS/DHL-specific label shapes are generated server-side at label creation time.

## Merchant Visible Refs

```json
{
  "recipientId": "ship_recipient_xxx",
  "shipmentRef": "ship_xxx",
  "labelRef": "label_xxx",
  "trackingAlias": "track_xxx",
  "storeRef": "store_xxx",
  "connectionRef": "conn_xxx"
}
```

## Hidden Material

- Raw address text
- Phone number
- Provider token
- Carrier credentials
- Raw carrier payload
- Private delivery note
- Proof secret

## Non-Claims

- This app model does not send production DHL or UPS traffic.
- This app model does not store carrier credentials in the browser.
- This app model does not expose raw recipient address text to merchants or friends.
