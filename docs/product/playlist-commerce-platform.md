# Playlist Commerce Platform

Playlist Commerce is the commerce layer for Address Identity Network. It treats
shopping as a purpose-based playlist rather than a single product search.

Classification: commercial/private product. Public documentation, diagrams, and
safe integration fixtures may be shared, but the product itself is not part of
the AGID open-source release set.

The product principle is:

```text
Organize intent first, then connect discovery, consent, checkout, and delivery.
```

It is not just a favorite button. It is a way to manage what a person wants,
what they plan to buy together, who they want to send it to, where it should be
delivered, and whether travel or hotel delivery changes the delivery context.

Executable specification:

- `src/lib/playlistCommerceSpec.ts`
- `src/lib/playlistCommerceSpec.test.ts`
- `src/lib/playlistCommerceCheckout.ts`
- `src/lib/playlistCommerceCheckout.test.ts`
- `src/lib/playlistCommerceWebhook.ts`
- `src/lib/playlistCommerceWebhook.test.ts`
- `src/lib/playlistCommerceWebhookServer.ts`
- `src/lib/playlistCommerceWebhookServer.test.ts`
- `src/lib/playlistCommerceSdk.ts`
- `src/lib/playlistCommerceSdk.test.ts`
- `src/components/PlaylistCommerceWidgetScreen.tsx`
- `src/components/PlaylistCommerceWidgetScreen.test.ts`

Diagram and presentation preparation:

- `docs/product/playlist-commerce-diagrams.md`

## 1. Why It Exists

Traditional commerce starts from a merchant cart. Playlist Commerce starts from
user intent:

- wishlist
- gift list
- moving list
- new-life list
- travel-prep list
- monthly repeat list
- event list
- creator or review list
- hotel delivery list
- cross-border shopping list

This matters because the same item may need different identity, address,
delivery, travel, and customs behavior depending on why the user is buying it.

## 2. Relationship To Address Identity Network

Playlist Commerce sits above the identity and address layers:

```text
Playlist Commerce
  -> Identity Wallet
  -> Address Login
  -> Delivery Gateway
  -> Trade Gateway
```

Identity Wallet stores credentials, address aliases, travel data, consent
history, and proof bundles.

Address Login lets checkout happen without giving the merchant raw address data.

Delivery Gateway hands scoped delivery references to carriers after wallet
approval.

Trade Gateway adds cross-border review states, HS-code hints, and import/export
evidence references.

## 3. User Experience

The user can:

- save products from multiple merchants into one playlist
- compare products across brands
- create wishlists, gift lists, moving lists, trip lists, monthly lists, and event lists
- follow friend, influencer, review, and brand playlists
- approve checkout from Identity Wallet
- buy without entering an address repeatedly
- send gifts through recipient aliases
- ship to hotels through Travel Login
- reuse monthly or event playlists for one-tap purchase

The user should feel like they are organizing a plan, not filling another cart.

## 4. Developer Surfaces

The public SDK/API contract is intentionally small:

| Surface | Role |
| --- | --- |
| Playlist SDK | Create, render, edit, reorder, and save playlists. |
| Search API | Search products, brands, gift shops, and cross-border catalogs. |
| Product API | Resolve product and merchant references. |
| Share API | Create scoped playlist share links. |
| Save API | Save merchant products into playlists. |
| Recommendation API | Suggest playlists and complementary products. |
| Checkout API | Convert playlist items into checkout plans. |
| Identity Wallet SDK | Request purpose-bound wallet consent. |
| Address Login SDK | Request no-address checkout and carrier handoff claims. |
| Merchant Webhook | Send save, checkout alias, receipt, and aggregate analytics events. |

The Checkout API contract is deliberately alias-first. It accepts product
references, playlist references, purpose, disclosure mode, and wallet claim
requirements. It does not accept raw address, recipient phone, private key,
proof witness, passport, room number, or biometric material.

The SDK contract bundles the public Playlist SDK, Checkout API, and Merchant
Webhook test vectors. Its public methods are intentionally narrow:
`createPlaylist`, `saveProduct`, `sharePlaylist`, `searchProducts`,
`getRecommendations`, `listHistory`, `startCheckout`, `verifyWebhook`,
`listCapabilities`, and `buildTestVectors`.

## 4.1 Spotify-Like Discovery Home

Playlist Commerce should feel closer to a media discovery surface than a single
merchant cart. The first home model has three lanes:

- search results for products, playlists, and merchants
- recommendation shelves such as "Because you saved..." and "Continue your playlists"
- resumable history for searches, viewed playlists, viewed products, and saved products

The discovery home is public-ref based. It may show `productRef`, `merchantRef`,
`playlistRef`, display title, recommendation reason, and resumable action. It
must not expose raw address, recipient phone, private notes, proof witness,
private key, or raw behavior log exports.

Users can browse stores and public playlists before checkout login. Vey ID / wallet login
is required only when they save private state, reuse a saved address, approve
delivery, or revoke store participation/address reuse.

Guest checkout is supported for EC conversion. An account is not required before checkout starts. The merchant receives a short-lived `guestCheckoutRef`,
checkout alias, and redacted status refs. The guest can optionally upgrade after
checkout by creating or opening Vey ID with Google/Apple only.

Guest checkout still requires Address Wallet consent before address reuse,
carrier handoff, or saved-address persistence. It is not a way to silently use a
saved address or bypass delivery approval.

## 4.2 Playlist Commerce is not EC Social Login

The two products share Vey ID, Address Wallet, Friends, QR, Delivery Gateway,
WooCommerce, Shopify, and SDK rails, but they answer different questions.

| Item | Playlist Commerce | EC Social Login |
| --- | --- | --- |
| Product question | which EC to use | how to buy at that EC |
| Purpose | discover and manage EC stores | login and address autofill at an EC |
| Primary actor | stores and products | user and account |
| Start point | Veygrit app | merchant EC site |
| Install target | Veygrit app Store surface | Shopify, WooCommerce, or custom EC |
| Login button to shop | not required | required for wallet address reuse |
| Main action | choose a store, save products, manage My Stores | Continue with Veygrit, approve Address Wallet reuse |

Playlist Commerce can reuse the user's Address Wallet address through the
wallet-side consent sheet, but the user must be able to browse stores, choose a
store, and start shopping without pressing a login button. EC Social Login is
different: once the user is on a merchant EC site and wants saved-address reuse
or address autofill, the EC shows `Continue with Veygrit`.

This keeps the Stripe-like delivery plan clean:

- enable Playlist Commerce when the merchant wants Veygrit discovery and store
  management
- enable EC Social Login when the merchant wants checkout login and address
  autofill on its own EC site
- enable both when the merchant wants Veygrit discovery traffic and EC-side
  Address Login conversion

Merchant webhook route contract:

| Field | Contract |
| --- | --- |
| Route | `POST /webhooks/playlist-commerce` |
| Accepted topics | `checkout.alias_created`, `delivery.receipt_created`, `analytics.aggregate_ready` |
| Success | `202` with `eventId`, `topic`, `keyId`, `keyStatus`, `resultRef`, `errors`, `nonClaims` |
| Client/verification failures | `400`, `401`, `404`, `405` with redacted operational errors |
| Required controls | HMAC-SHA256, constant-time compare, timestamp replay window, keyring status, event-id idempotency, topic allowlist |
| Never returned | `payload`, `playlistRef`, `productRef`, `orderAlias`, `receiptRef`, raw address, recipient phone, proof witness, private key, biometric template |

Merchant Console can surface a local-only synthetic signed ping using
`evt_pc_synthetic_ping_001`, `checkout.alias_created`, and
`pc_ping_key_active`. The ping is expected to return `202` once and `401` on
replay, and is verified through `npm run verify:playlist-commerce` without
production traffic or production webhook secrets.

The executable server-side preflight helper is
`runPlaylistCommerceWebhookPreflight()`. It returns a redacted report with
`passed`, `checks`, `responseSummary`, `blockedMaterial`, and `nonClaims`. The
report intentionally omits the HMAC secret, raw signed request body, subject
alias, order alias, raw address, proof witness, private key, biometric template,
and production webhook secret. Passing this preflight does not claim payment
settlement, carrier delivery, merchant identity verification, or proof
generation.

The first read-only product surface is available at `/playlist-commerce`. It
renders the SDK method surface, no-address checkout fixture, webhook lifecycle,
and merchant visibility boundary without collecting real address or recipient
data.

All public surfaces forbid raw address and private proof material by default.

## 5. Merchant Value

Merchants can receive:

- playlist-attributed traffic
- product save events
- checkout aliases
- delivery receipt references
- aggregate save count
- aggregate purchase rate
- ranking and trend signals

Merchants should not receive:

- raw address data
- recipient phone numbers
- private playlist notes
- proof witnesses
- private keys
- biometric templates
- private social graph edges

## 5.1 Merchant Participation And Vey ID Address Wallet Login

Merchants choose whether to appear in Playlist Commerce.

If a merchant opts in, the store can be listed in a public no-login directory.
Users may choose the store before they sign in. Login is only required when the
user asks Address Wallet to reuse a saved address, approve delivery, or bind a
store preference to their wallet.

Merchant-visible participation refs:

- `merchantRef`
- `storeRef`
- `playlistParticipationRef`
- `storePreferenceAlias`

Public store directory fields:

- `merchantRef`
- `storeDisplayName`
- `categoryTags`
- `shippingCountryCodes`
- `playlistEnabled`

Wallet-controlled revoke actions:

- `unlink_store`
- `revoke_address_reuse`
- `revoke_friend_delivery`
- `clear_store_preference`

Vey ID can be embedded by EC sites as the account and address-entry delegate.
Account creation is Google/Apple only in the MVP. A user can reuse an address
already saved in Address Wallet across participating merchants, but reuse remains
purpose-bound and consent-bound. The merchant receives safe references such as
`pairwiseSubjectAlias`, `recipientId`, `addressCredentialRef`, `walletConsentRef`,
and `deliverabilityClaim`.

### Guest Checkout

For EC stores, Veygrit should support a guest-first checkout path:

- the user can start checkout without creating a Vey ID account
- the EC receives `guestCheckoutRef`, `checkoutAlias`, `walletConsentRef`, and
  delivery status refs only
- the wallet still asks for explicit consent before Address Wallet reuse or
  carrier handoff
- after checkout, the user can optionally save the flow into Vey ID through
  Google/Apple only

Guest checkout must not allow:

- saving an address without a wallet account and explicit consent
- persisting raw address in merchant logs
- creating a wallet account with email/password or phone-only signup
- friend delivery without recipient approval

The merchant must not receive:

- raw address
- recipient phone
- saved address body
- proof secret
- private key
- wallet private notes

This is not silent address sharing. Store discovery can be no-login, but address
reuse requires Vey ID / wallet consent and can be revoked from the wallet side.

## 6. No-Address Checkout Flow

The core flow is:

```text
User creates playlist
  -> platform searches merchants and brands
  -> user saves product
  -> Identity Wallet approves checkout purpose
  -> Address Login returns subject alias and deliverability claim
  -> merchant receives order alias
  -> Delivery Gateway gives carrier a scoped handoff reference
  -> merchant receives delivery receipt and aggregate attribution
```

The merchant sees the order alias, items, payment status, deliverability status,
and receipt reference. The carrier sees a scoped delivery handoff reference when
delivery execution is approved. The platform sees playlist and aggregate
analytics metadata.

## 7. Travel And Hotel Delivery

Travel-prep playlists connect product planning with Travel Login:

```text
Travel playlist
  -> Travel Login consent
  -> hotel alias and arrival window
  -> carrier handoff
```

The merchant should not see passport data, room number, or raw hotel delivery
address. The carrier receives only the delivery reference needed for execution.

## 8. Analytics Boundary

Allowed merchant analytics:

- save count
- purchase rate
- playlist rank
- category trend
- merchant/product attribution

Forbidden analytics fields:

- raw address
- recipient identity
- recipient phone
- private social graph edges
- private playlist notes
- proof witness
- fine-grained location unless separately consented

## 9. Non-Claims

Playlist Commerce does not claim to be:

- a full marketplace
- a payment processor
- merchant-of-record
- order-management system
- inventory system
- price or availability guarantee
- final customs or tax decision engine
- raw address storage system

Those can be connected later as separate, reviewed adapters, but they are not
part of the default commercial integration contract.

## 10. Minimum MVP

The first credible MVP is:

1. Playlist SDK
2. Search API with product references
3. Save API
4. Share API
5. Checkout API
6. Identity Wallet consent
7. Address Login no-address checkout
8. Delivery Gateway carrier handoff reference
9. Merchant aggregate analytics
10. Webhook test vectors

This creates a working line from discovery to delivery without making the
merchant store raw address data.

## 11. Verification

Run:

```bash
npm run verify:playlist-commerce
```

The tests check:

- requested API surfaces exist
- no public API allows raw address data
- no public API allows private proof material
- merchant webhook route statuses, controls, idempotency, and redacted responses are fixed
- no-address checkout links wallet consent, Address Login, checkout alias, and carrier handoff
- merchant analytics remain aggregate
- non-claims prevent overclaiming as a marketplace, payment processor, or raw-address store

## 12. Next Work

The next useful implementation slice is one of:

- React screen for Playlist Commerce planning and merchant preview
- SDK request/response schemas
- webhook fixture corpus
- Address Login checkout adapter fixture
- merchant analytics dashboard mock
- gift-delivery abuse review state machine
