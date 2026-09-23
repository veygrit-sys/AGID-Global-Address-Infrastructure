# Veygrit Screen Transition Map

This note is the product-facing map for Veygrit Address Wallet navigation. It is
kept narrow: screens, button destinations, and privacy boundaries only.

## Side Menu

```mermaid
flowchart TD
  Home["Home"]
  Friends["Friends"]
  Store["Store"]
  MyPage["My Page"]
  Topics["Topics"]
  Discover["Discover"]
  MyStores["My Stores"]

  Home --> Friends
  Home --> Store
  Home --> MyPage
  Store --> Topics
  Store --> Discover
  Store --> MyStores
```

## Primary Button Destinations

```mermaid
flowchart LR
  Commerce["Commerce entry points"]
  Playlist["Playlist Commerce"]
  EcLogin["EC Social Login"]
  Delivery["Delivery Gateway"]
  Store["/veygrit#store"]
  VeyIdConsole["/merchant-console#vey-id"]
  DeliveryConsole["/merchant-console#delivery-gateway"]

  Commerce --> Playlist --> Store
  Commerce --> EcLogin --> VeyIdConsole
  Commerce --> Delivery --> DeliveryConsole
```

## QR Actions

```mermaid
flowchart TD
  Home["Home"]
  Counter["Store counter"]
  EcLogin["EC login"]
  Parcel["Parcel receipt"]
  Share["Address share"]

  Home --> Counter
  Home --> EcLogin
  Home --> Parcel
  Home --> Share
```

## Product Boundary

| Action | Destination | Login before action | Address Wallet consent |
| --- | --- | --- | --- |
| Open Store | `/veygrit#store` | No | Required before address reuse |
| Install Vey ID | `/merchant-console#vey-id` | Yes, before checkout | Required |
| Configure gateway | `/merchant-console#delivery-gateway` | Yes, before checkout | Required |

Blocked transitions:

- Playlist Commerce must not become EC Social Login without user action.
- Address share QR must not export private address material.
- Friend selection must not reveal a friend's address.
- Guest checkout must not save a wallet address without consent.
- Merchant Console must not deploy or send production traffic without explicit approval.

Verification:

```text
npm run verify:veygrit-transition-map
npm run verify:veygrit-app
```

`verify:veygrit-app` includes the transition map test so the rendered Veygrit
buttons cannot drift from this product map unnoticed.
