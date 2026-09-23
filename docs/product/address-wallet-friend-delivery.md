# Address Wallet Friend Delivery

Address Wallet Friend Delivery is an SSO-aware checkout pattern where the
purchaser signs in to an EC site with Address Wallet, chooses a wallet friend
as the destination, and lets the recipient approve which saved address may be
used for that order. The purchaser does not need to ask for, type, see, or
store the recipient's address.

日本語では、配送先を「住所」ではなく「Address Walletの友達」として選ぶ
ギフト配送/代理配送の設計である。購入者は相手の住所を知らず、受取人は
配送ごとに住所利用を承認する。

## Core Flow

1. Purchaser signs in to the EC site with Address Wallet.
2. Purchaser adds products to the cart.
3. Checkout shows "Address Wallet friends" as a destination option.
4. Purchaser chooses a friend alias.
5. Merchant creates a friend delivery request with order alias, item summary,
   purpose, expiry, and requested disclosure mode.
6. Recipient receives a wallet push notification.
7. Recipient reviews the item and requester, selects an address, and approves.
8. Address Wallet releases only the approved delivery material.
9. Merchant creates a carrier handoff or legacy label according to policy.
10. Recipient can review disclosure history in Wallet.

## SSO Rule

If the purchaser already has a fresh Address Wallet session, checkout must not
force another Wallet login. Re-authentication is only required when the wallet
session expired, risk step-up is required, item or amount policy changes, or
device binding no longer matches.

## Disclosure Modes

`carrier_decryptable_preferred` is the preferred mode. The merchant receives
refs such as `carrierHandoffRef`, `deliveryReceiptRef`, and deliverability
claims while Delivery Gateway or an authorized carrier receives the minimum
execution material.

`merchant_visible_legacy_label` is an elevated compatibility mode for ECs,
warehouses, or label systems that still require a full shipping address after
explicit recipient approval. It can return a `shippingAddressReleaseRef` to
the merchant fulfillment boundary, but the purchaser UI must still hide the
recipient address.

## Privacy Boundary

- 購入者には住所を表示しない。
- Recipient approval is mandatory before address release or carrier handoff.
- Push notifications must not contain raw address or recipient phone.
- Recipient approval for one order is not reusable marketing consent.
- Merchant-visible address release requires purpose binding, audit, narrow
  retention, and a fulfillment-only role.

## API Surfaces

- `GET /v1/wallet/friends`
- `POST /v1/wallet/friend-delivery/requests`
- `POST /v1/wallet/friend-delivery/approvals`
- `POST /v1/wallet/friend-delivery/releases`

All surfaces use aliases, refs, consent envelopes, and receipt refs. Public
fixtures must not include raw address, recipient phone, private key, proof
witness, or raw label payload.

## Non-Claims

- Address Wallet friendship is not proof of residence.
- SSO freshness is not a substitute for recipient-side approval.
- Friend delivery does not guarantee carrier acceptance or final delivery.
- Recipient approval for delivery is not reusable marketing consent.
