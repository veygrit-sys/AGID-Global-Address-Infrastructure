# @veygrit/address-login-nextjs

Minimal Next.js server helper skeleton for Veygrit ID / Address Login.

This package is intentionally server-focused. It validates redacted Address Login callback payloads and webhook events. It does not resolve raw addresses, does not decrypt carrier handoff references, and does not handle witness, private-key, proof-secret, or production credential material.

## Install

```bash
npm install @veygrit/address-login-nextjs
```

## Callback

```ts
import { parseAddressLoginCallback, verifyAddressLoginCallback } from "@veygrit/address-login-nextjs/server";

export function inspectCallbackUrl(url: string) {
  return parseAddressLoginCallback(url, {
    expectedState: "state_from_session",
    allowedIssuer: "https://login.veygrit.example",
  });
}

export async function POST(request: Request) {
  const result = await verifyAddressLoginCallback(request, {
    requiredClaims: ["deliverable", "not_revoked"],
    expectedState: "state_from_session",
    allowedIssuer: "https://login.veygrit.example",
  });

  return Response.json({
    subjectAlias: result.subjectAlias,
    publicClaims: result.publicClaims,
    nextAction: result.nextAction,
  });
}
```

## Route Handler

```ts
import { createAddressLoginRouteHandlers } from "@veygrit/address-login-nextjs/server";

const handlers = createAddressLoginRouteHandlers({
  requiredClaims: ["deliverable", "not_revoked", "freshness"],
  expectedState: "state_from_session",
  allowedIssuer: "https://login.veygrit.example",
  exchangeCode: async (code) => {
    // Exchange with the hosted service from your server only.
    // Return redacted result fields: aliases, claims, proof refs, and carrier handoff refs.
    return exchangeCodeForRedactedAddressLoginResult(code);
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
```

## Vey ID Core Server Exchange

Use the React SDK to start Google/Apple-only Vey ID login in the browser. The
browser should only receive the callback `authorizationCodeRef`. Exchange that
ref, the PKCE verifier, and wallet-side revocation requests on your server.

Runnable App Router examples are included in:

- `examples/app-router/vey-id/token/route.ts`
- `examples/app-router/vey-id/guest-checkout/route.ts`
- `examples/app-router/vey-id/guest-checkout/README.md`
- `examples/app-router/vey-id/revoke/route.ts`

Use the guest-checkout README with
`@veygrit/address-login-react/examples/checkout-guest-checkout/CheckoutGuestCheckout.tsx`.
The browser posts to `/api/veygrit/guest-checkout/handoff`; the hosted Veygrit
request stays in the App Router route.

```ts
import {
  createVeyIdGuestCheckoutHandoff,
  exchangeVeyIdAuthorizationCode,
  revokeVeyIdConnection,
} from "@veygrit/address-login-nextjs/server";

export async function exchangeOnServer() {
  return exchangeVeyIdAuthorizationCode(
    {
      authorizationCodeRef: "vey_auth_code_from_callback",
      clientId: "merchant_demo",
      redirectUri: "https://merchant.example/veygrit/callback",
      pkceVerifier: "pkce_verifier_from_server_session",
    },
    {
      serverAccessToken: process.env.VEYGRIT_SERVER_ACCESS_TOKEN!,
      transport: async ({ url, headers, payload }) => {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Vey ID token exchange failed.");
        return response.json();
      },
    },
  );
}

export async function createGuestCheckoutOrderRefs(tokenResult: {
  accessTokenRef: string;
  addressCredentialRef?: string;
  claims: { sub: string };
}) {
  return createVeyIdGuestCheckoutHandoff(
    {
      clientId: "merchant_demo",
      pairwiseSubjectAlias: tokenResult.claims.sub,
      walletConsentRef: "wallet_consent_from_consent_screen",
      addressCredentialRef: tokenResult.addressCredentialRef!,
      accessTokenRef: tokenResult.accessTokenRef,
      orderRef: "order_ref_from_merchant_server",
    },
    {
      serverAccessToken: process.env.VEYGRIT_SERVER_ACCESS_TOKEN!,
      transport: async ({ url, headers, payload }) => {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Vey ID guest checkout handoff failed.");
        return response.json();
      },
    },
  );
}

export async function unlinkFromWallet(pairwiseSubjectAlias: string) {
  return revokeVeyIdConnection(
    {
      clientId: "merchant_demo",
      pairwiseSubjectAlias,
      reason: "user_wallet_unlink",
    },
    {
      serverAccessToken: process.env.VEYGRIT_SERVER_ACCESS_TOKEN!,
      transport: async ({ url, headers, payload }) => {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Vey ID revocation failed.");
        return response.json();
      },
    },
  );
}
```

These helpers require an explicit `transport` function. Local tests therefore do
not send production traffic accidentally. Public payloads carry
`authorizationCodeRef`, `pairwiseSubjectAlias`, `walletConsentRef`, token refs,
`guestCheckoutAlias`, `addressCredentialRef`, `carrierHandoffRef`, and deletion
refs only. Guest checkout does not require an EC account or password, but it
still requires Veygrit wallet login and address consent. The helpers reject raw
address, recipient, provider token, provider raw profile, witness, private-key,
proof-secret, carrier-key, or production-credential material before transport is
called.

## Friend Delivery Server Helpers

Use these helpers behind your merchant server route when a signed-in shopper chooses an Address Wallet friend at checkout. The React SDK builds the user experience; the Next.js helper keeps the hosted API call on the server and passes only aliases, refs, claims, and carrier handoff refs.

Runnable App Router examples are included in:

- `examples/app-router/friend-delivery/request/route.ts`
- `examples/app-router/friend-delivery/approval/route.ts`

```ts
import { requestFriendDelivery, approveFriendDelivery } from "@veygrit/address-login-nextjs/server";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await requestFriendDelivery(
    {
      purchaserSubjectAlias: body.purchaserSubjectAlias,
      friendAlias: body.friendAlias,
      cartRef: body.cartRef,
    },
    {
      serverAccessToken: process.env.VEYGRIT_SERVER_ACCESS_TOKEN!,
      transport: async ({ url, headers, payload }) => {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Friend Delivery request failed.");
        return response.json();
      },
    },
  );

  return Response.json(result);
}

export async function approveFromWebhook() {
  return approveFriendDelivery(
    {
      friendDeliveryRequestRef: "fdr_ref_from_event",
      approvalRef: "approval_ref_from_event",
      selectedAddressRef: "addr_ref_from_wallet",
      consentEnvelopeRef: "consent_ref_from_wallet",
    },
    {
      serverAccessToken: process.env.VEYGRIT_SERVER_ACCESS_TOKEN!,
      transport: async ({ url, headers, payload }) => {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Friend Delivery approval failed.");
        return response.json();
      },
    },
  );
}
```

The helper requires an explicit `transport` function so tests and local mocks never send production traffic by accident. Payload builders reject suspicious raw address, recipient, witness, private-key, or proof-secret material before transport is called.

## Package Publication Gate

Before publishing or splitting this package into a dedicated repository, run:

```bash
npm run verify:veygrit-address-login-test-helpers
npm run verify:veygrit-address-login-nextjs
npm run verify:veygrit-address-login-nextjs-package
npm run verify:veygrit-address-login-packages
```

Verification order:

1. Run the shared test-helper boundary gate for callback vectors and merchant-visible
   redaction fixtures.
2. Run the package-specific gate for local build, tests, examples, and public API.
3. Run the package publication-safety gate for the built root and server entrypoint,
   `npm pack` dry-run contents, README non-claims, examples, and files allowlist.
4. Run the cross-package traceability preflight to confirm the manifest, README
   gates, commit candidates, and secret-pattern checks still agree.
5. Treat a pass as local OSS-prep evidence only; it is not a publishing,
   hosted-service, or production readiness claim.

The cross-package publication map is `../veygrit-address-login-packages.manifest.json`.
It records this package's runtime, examples, public surfaces, verify command, and
privacy controls. The manifest is local OSS-prep evidence and does not claim
production readiness.

## Safety Boundary

- Merchant callbacks must contain aliases, public claims, proof references, and carrier handoff references only.
- Vey ID Core token exchange and wallet-side revocation must run on the server,
  with PKCE verifier and server access token outside the browser bundle.
- Callback parsing rejects suspicious raw address, recipient, witness, private-key, or proof-secret query/form fields before code exchange.
- Webhooks can use the built-in HMAC helper or a caller-supplied verifier. Production signing secrets stay in your server environment.

## Webhook HMAC

```ts
import { verifyVeygritWebhook } from "@veygrit/address-login-nextjs/server";

const seenWebhookEvents = new Set<string>(); // Replace with Redis, Postgres, or another durable store in production.

export async function POST(request: Request) {
  const event = await verifyVeygritWebhook(request, {
    hmac: {
      signingSecret: process.env.VEYGRIT_WEBHOOK_SIGNING_SECRET!,
      toleranceSeconds: 300,
    },
    eventIdStore: {
      has: (eventId) => seenWebhookEvents.has(eventId),
      add: (eventId) => {
        seenWebhookEvents.add(eventId);
      },
    },
  });

  return Response.json({
    eventId: event.id,
    eventType: event.type,
  });
}
```

The signed payload is `timestamp.payloadText`; the SDK reads `x-veygrit-signature` and `x-veygrit-timestamp` by default. Failed HMAC checks stop processing before callback or carrier handoff work.
When `eventIdStore` is provided, duplicate webhook `event.id` values are rejected after signature verification and before merchant-side side effects.
