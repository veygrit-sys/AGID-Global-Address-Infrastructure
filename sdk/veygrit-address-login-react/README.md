# @veygrit/address-login-react

Minimal React SDK skeleton for Veygrit ID / Address Login.

This package is a drop-in address-consent layer for existing authentication stacks such as Clerk, Auth0, Auth.js, Firebase Auth, or in-house login. It does not replace account login and does not expose raw address, recipient, witness, private-key, or proof-secret material to merchants.

## Install

```bash
npm install @veygrit/address-login-react
```

## Quickstart

```tsx
import { AddressLoginButton, VeygritProvider } from "@veygrit/address-login-react";

export function CheckoutAddress() {
  return (
    <VeygritProvider publishableKey={process.env.NEXT_PUBLIC_VEYGRIT_KEY}>
      <AddressLoginButton
        purpose="shipping"
        disclosureMode="carrier_decryptable"
        requestedClaims={["deliverable", "not_revoked", "freshness"]}
        carrierId="carrier_demo"
      />
    </VeygritProvider>
  );
}
```

## Headless Hook

```tsx
import { useAddressLogin } from "@veygrit/address-login-react";

export function CustomButton() {
  const addressLogin = useAddressLogin({
    purpose: "shipping",
    disclosureMode: "proof_only",
    requestedClaims: ["deliverable", "not_revoked"],
    redirectMode: "manual",
  });

  return <button onClick={() => addressLogin.startAddressLogin()}>Use saved address</button>;
}
```

## Vey ID Core Login

Use Vey ID Core when the EC site needs account login first. Account creation is
Google / Apple only, and the merchant receives a pairwise identity plus refs.
Use Address Login after this step when the buyer wants to reuse Address Wallet
address data.

```tsx
import {
  buildVeyIdAuthorizeUrl,
  buildVeyIdTokenUrl,
  createVeyIdAuthorizeRequest,
  createVeyIdTokenRequestPayload,
  parseVeyIdCallback,
} from "@veygrit/address-login-react";

const authorizeRequest = createVeyIdAuthorizeRequest(
  {
    publishableKey: "pk_test_veygrit",
    redirectUri: "https://merchant.example/veygrit/callback",
  },
  {
    codeChallenge: "pkce_challenge_from_your_server",
    origin: "https://merchant.example",
  },
);

window.location.assign(buildVeyIdAuthorizeUrl(authorizeRequest));

const callback = parseVeyIdCallback(window.location.href, {
  expectedState: authorizeRequest.state,
  allowedIssuer: "https://id.veygrit.example",
});

if (callback.status === "authorized") {
  const tokenUrl = buildVeyIdTokenUrl("https://login.veygrit.example");
  const tokenPayload = createVeyIdTokenRequestPayload({
    authorizationCodeRef: callback.authorizationCodeRef,
    clientId: "merchant_demo",
    redirectUri: "https://merchant.example/veygrit/callback",
    pkceVerifier: "pkce_verifier_from_your_server",
  });

  await fetch(tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(tokenPayload),
  });
}
```

For wallet-side unlinking, build a reference-only revocation payload with
`createVeyIdConnectionRevocationPayload()` and send it to
`buildVeyIdConnectionRevocationUrl()`. The payload carries `pairwiseSubjectAlias`
and optional `walletConsentRef`; it does not carry raw address text, Google or
Apple tokens, provider raw profile, proof secrets, carrier API keys, or
production credentials.

## Guest Checkout Handoff

Use this when an EC checkout should let a buyer reuse Address Wallet without
creating a merchant account or typing an address. The merchant still keeps its
own guest order, while Veygrit returns refs for the wallet consent, address
credential, and carrier handoff.

```tsx
import {
  GuestCheckoutButton,
  createGuestCheckoutHandoffHttpTransport,
  createVeyIdGuestCheckoutHandoffPayload,
} from "@veygrit/address-login-react";

const payload = createVeyIdGuestCheckoutHandoffPayload({
  clientId: "merchant_demo",
  pairwiseSubjectAlias: "pairwise_sub_123",
  walletConsentRef: "consent_ref_456",
  addressCredentialRef: "addr_cred_ref_789",
  accessTokenRef: "access_token_ref_from_server",
  orderRef: "guest_order_ref_001",
});

<GuestCheckoutButton
  input={payload}
  transport={createGuestCheckoutHandoffHttpTransport({
    endpoint: "/api/veygrit/guest-checkout/handoff",
  })}
  onGuestCheckoutReady={result => {
    console.log(result.guestCheckoutAlias, result.carrierHandoffRef);
  }}
  onGuestCheckoutBlocked={result => {
    console.log(result.nextAction, result.errorCode);
  }}
/>;
```

The checkout-side example in
`examples/checkout-guest-checkout/CheckoutGuestCheckout.tsx` sends the handoff
payload to your own Next.js route, for example
`sdk/veygrit-address-login-nextjs/examples/app-router/vey-id/guest-checkout/route.ts`.
Keep server authorization off the browser. The React SDK only builds and checks
reference-only payloads; it does not expose raw address, phone, carrier
credentials, provider tokens, private keys, or proof secrets.
`createGuestCheckoutHandoffHttpTransport()` accepts only same-origin relative
endpoints so examples do not post directly to the hosted Veygrit API.
If the merchant route returns a redacted `502` blocked response, the transport
returns that blocked result so UI can show repair/retry state without exposing
raw failure details.
`GuestCheckoutButton` exposes `onGuestCheckoutBlocked()` for that UI path.

## Merchant-Visible Redaction Display

When your checkout receives the Vey ID demo EC
`merchantVisibleRedactionAffordance`, use
`createMerchantVisibleRedactionDisplayModel()` before rendering it. The helper
accepts the approved field refs separately, validates that every displayed ref
is listed by the affordance, and returns counts for blocked classes and
non-claims instead of copying blocked material names into the UI.

```tsx
import {
  createMerchantVisibleRedactionDisplayModel,
  type VeyIdMerchantVisibleRedactionAffordance,
} from "@veygrit/address-login-react";

export function MerchantRedactionSummary({
  affordance,
}: {
  affordance: VeyIdMerchantVisibleRedactionAffordance;
}) {
  const display = createMerchantVisibleRedactionDisplayModel(affordance, {
    pairwiseSubjectAlias: "pairwise_synthetic_001",
    guestCheckoutAlias: "guest_checkout_alias_synthetic_001",
    walletConsentRef: "consent_synthetic_001",
    addressCredentialRef: "addr_cred_synthetic_001",
    carrierHandoffRef: "carrier_handoff_synthetic_001",
  });

  return (
    <section>
      <strong>{display.boundaryGateId}</strong>
      {display.rows.map(row => (
        <p key={row.field}>{row.ref ?? "pending_wallet_consent"}</p>
      ))}
      <small>{display.blockedClassCount} blocked classes</small>
    </section>
  );
}
```

The package-visible example lives at
`examples/merchant-visible-redaction/MerchantVisibleRedactionCard.tsx`.

## Callback Handling

```tsx
import { parseAddressLoginCallback } from "@veygrit/address-login-react";

export function handleAddressLoginCallback(callbackUrl: string, expectedState: string) {
  const result = parseAddressLoginCallback(callbackUrl, {
    expectedState,
    allowedIssuer: "https://login.veygrit.example",
  });

  if (result.status === "error") {
    throw new Error(result.errorDescription ?? result.error);
  }

  return {
    code: result.code,
    sessionRef: result.sessionRef,
    credentialRef: result.credentialRef,
    proofRef: result.proofRef,
    handoffRef: result.handoffRef,
  };
}
```

## Friend Delivery Helpers

```tsx
import {
  buildFriendDeliveryRequestUrl,
  createFriendDeliveryRequestPayload,
  useFriendDelivery,
} from "@veygrit/address-login-react";

const url = buildFriendDeliveryRequestUrl("https://login.veygrit.example/api/veygrit/address-login");
const payload = createFriendDeliveryRequestPayload({
  purchaserSubjectAlias: "pairwise_sub_123",
  friendAlias: "friend_alias_456",
  cartRef: "cart_ref_789",
});

await fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
});
```

Friend Delivery helpers build reference-only payloads for `POST /friend-delivery/requests` and `POST /friend-delivery/approvals`. They do not carry destination address text, recipient contact data, witnesses, private keys, or proof secrets.

The checkout-side example in `examples/checkout-friend-delivery/CheckoutFriendDelivery.tsx` sends the request payload to your own Next.js route, for example `sdk/veygrit-address-login-nextjs/examples/app-router/friend-delivery/request/route.ts`. Keep server access tokens in that route, not in the browser bundle.

For React state, use `useFriendDelivery()` with your own transport functions:

```tsx
const friendDelivery = useFriendDelivery({
  apiBaseUrl: "https://login.veygrit.example/api/veygrit/address-login",
  requestTransport: ({ url, payload }) => fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }).then(response => response.json()),
  approvalTransport: ({ url, payload }) => fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }).then(response => response.json()),
});
```

The hook tracks `idle`, `requesting`, `notified`, `approving`, `approved`, and `error` states. The SDK does not ship production secrets; your server or hosted session layer must attach authorization.

## Package Publication Gate

Before publishing or splitting this package into a dedicated repository, run:

```bash
npm run verify:veygrit-address-login-test-helpers
npm run verify:veygrit-address-login-react
npm run verify:veygrit-address-login-react-package
npm run verify:veygrit-address-login-packages
```

Verification order:

1. Run the shared test-helper boundary gate for callback vectors and merchant-visible
   redaction fixtures.
2. Run the package-specific gate for local build, tests, examples, and public API.
3. Run the package publication-safety gate for built entrypoints, npm pack
   contents, README non-claims, examples, and files allowlist.
4. Run the cross-package traceability preflight to confirm the manifest, README
   gates, commit candidates, and secret-pattern checks still agree.
5. Treat a pass as local OSS-prep evidence only; it is not a publishing,
   hosted-service, or production readiness claim.

The cross-package publication map is `../veygrit-address-login-packages.manifest.json`.
It records this package's runtime, examples, public surfaces, verify command, and
privacy controls. The manifest is local OSS-prep evidence and does not claim
production readiness.

## Safety Boundary

- The SDK builds a hosted wallet authorization URL.
- Vey ID Core helpers build Google/Apple-only login, PKCE token exchange, and
  wallet-side revocation payloads with refs only.
- Guest Checkout Handoff helpers build EC guest-order handoffs with refs only;
  merchants do not receive raw address or phone fields.
- The browser transport helper posts to a merchant route, not directly to Veygrit.
- Redacted `blocked` handoff responses are handled as state, not raw exceptions.
- Guest checkout UI can render blocked next actions without account creation.
- Friend Delivery helpers build request and approval payloads with aliases, refs, claims, and timestamps only.
- Merchant callbacks should receive aliases, claims, proof references, and carrier handoff references only.
- Callback parsing rejects raw address, recipient, witness, private-key, or proof-secret parameters.
- A publishable key must not authorize carrier decryption.
- This package intentionally has no raw address fields in its public request types.
