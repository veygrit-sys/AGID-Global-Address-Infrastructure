# Address Wallet Friend Delivery Integration

This guide connects the browser checkout SDK to the server-side Address Login
helper without exposing delivery secrets or recipient address material in the
browser.

## Package Roles

| Layer | Package | Example | Responsibility |
| --- | --- | --- | --- |
| Browser checkout | `@veygrit/address-login-react` | `sdk/veygrit-address-login-react/examples/checkout-friend-delivery/CheckoutFriendDelivery.tsx` | Let a signed-in purchaser choose an Address Wallet friend and submit a reference-only request to the merchant server. |
| Merchant server | `@veygrit/address-login-nextjs` | `sdk/veygrit-address-login-nextjs/examples/app-router/friend-delivery/request/route.ts` | Add server authorization, call the hosted request endpoint, and return the redacted request state to checkout. |
| Recipient approval | `@veygrit/address-login-nextjs` | `sdk/veygrit-address-login-nextjs/examples/app-router/friend-delivery/approval/route.ts` | Relay wallet approval refs to the hosted approval endpoint and receive carrier handoff refs. |
| Hosted service | Veygrit ID / Address Login | `POST /friend-delivery/requests`, `POST /friend-delivery/approvals` | Notify the recipient wallet, enforce consent, and issue approved delivery refs. |

## Checkout Flow

1. The purchaser is already signed in to the EC site through Address Wallet SSO.
2. Checkout renders `CheckoutFriendDelivery`.
3. The purchaser selects a friend alias, not an address.
4. React `useFriendDelivery()` builds a request payload with `purchaserSubjectAlias`, `friendAlias`, `cartRef`, claims, disclosure mode, and timestamp.
5. The browser sends that payload only to the merchant route, for example `/api/veygrit/friend-delivery/request`.
6. The Next.js route adds `VEYGRIT_SERVER_ACCESS_TOKEN` on the server and calls the hosted Friend Delivery request endpoint.
7. The hosted service notifies the recipient wallet.
8. After recipient approval, the server-side approval route exchanges refs for a carrier handoff or fulfillment release ref.

## Data Boundary

Browser-visible request payloads may contain:

- `purchaserSubjectAlias`
- `friendAlias`
- `cartRef`
- `requestedClaims`
- `disclosureMode`
- `requestedAt`

Server-only material:

- `VEYGRIT_SERVER_ACCESS_TOKEN`
- hosted API bearer authorization
- fulfillment policy decisions
- carrier handoff exchange

Forbidden in browser payloads, logs, examples, and public fixtures:

- raw address text
- address line fields
- recipient phone or private contact material
- proof witness
- private key
- proof secret
- production credential material

## Integration Contract

The browser SDK must not call the hosted Friend Delivery API directly with a
server token. It calls a merchant route. The merchant route must not echo
server tokens, raw address material, or carrier credentials back to the browser.

The preferred production path is `carrier_decryptable_preferred`: checkout sees
request and status refs, while the carrier or Delivery Gateway receives the
minimum execution material required for fulfillment.

`merchant_visible_legacy_label` is only for existing label systems that need
merchant-side address release after explicit recipient approval. That release
must be hidden from the purchaser UI, purpose-bound, retained narrowly, and
audited.

## Scenario-Driven Merchant Test

Hosted mock `/test-vectors` returns `scenarioVectors[]`. Each scenario contains
safe `steps` with only actor names and input/output refs. A merchant integration
test can turn those steps into a checklist:

```ts
import {
  buildFriendDeliveryMerchantIntegrationChecklist,
  runFriendDeliveryMerchantScenarioSmoke,
} from "../../src/lib/veygritHostedAddressLoginMock";

const checklist = buildFriendDeliveryMerchantIntegrationChecklist(fixtures);
const smoke = runFriendDeliveryMerchantScenarioSmoke(fixtures);

expect(checklist.steps.map(step => step.stepId)).toEqual([
  "checkout-select-friend",
  "server-create-request",
  "wallet-notify",
  "wallet-approve",
  "server-receive-handoff",
]);
expect(smoke.status).toBe("pass");
expect(smoke.carrierHandoffRef).toBe("handoff_ref_synthetic_friend_delivery_001");
```

The checklist points to the React checkout example and the Next.js request and
approval route examples, while keeping server tokens, carrier credentials, and
delivery material outside browser-visible payloads. The scenario smoke then
executes the hosted mock through request creation, recipient approval, and
carrier handoff refs so merchant adapters can fail fast before using a real
hosted environment.

## Non-Claims

- Friend Delivery is not proof of residence.
- Address Wallet SSO is not recipient approval.
- A friend alias is not a reusable shipping address.
- A successful request does not guarantee carrier acceptance or final delivery.
