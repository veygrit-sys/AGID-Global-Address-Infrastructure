# Vey ID Guest Checkout App Router Integration

This route is the merchant-owned server endpoint for the React checkout example:

- React example: `@veygrit/address-login-react/examples/checkout-guest-checkout/CheckoutGuestCheckout.tsx`
- Browser endpoint: `/api/veygrit/guest-checkout/handoff`
- Next.js route: `examples/app-router/vey-id/guest-checkout/route.ts`

## Flow

1. The browser renders `CheckoutGuestCheckout`.
2. `GuestCheckoutButton` uses `createGuestCheckoutHandoffHttpTransport()` to POST only to the same-origin merchant endpoint.
3. This App Router route reads refs from the request body.
4. The route calls `createVeyIdGuestCheckoutHandoff()` with `VEYGRIT_SERVER_ACCESS_TOKEN` on the server.
5. The response returns only order-safe refs such as `guestCheckoutAlias`, `walletConsentRef`, `addressCredentialRef`, and `carrierHandoffRef`.

## Boundary

- The browser does not call the hosted Veygrit API directly.
- The server token stays in the App Router route.
- The merchant keeps a guest order; no EC account or password is required.
- The handoff is reference-only and one-time-use.
- Private address/contact data, provider tokens, carrier credentials, keys, and proof material stay outside this package boundary.
- Hosted handoff failures return a redacted `502` body with `status: "blocked"` and `errorCode: "guest_checkout_handoff_failed"`.

## Minimal Wiring

```tsx
<CheckoutGuestCheckout
  publishableKey={process.env.NEXT_PUBLIC_VEYGRIT_KEY!}
  clientId="merchant_demo"
  pairwiseSubjectAlias={tokenResult.claims.sub}
  walletConsentRef="wallet_consent_ref_from_session"
  addressCredentialRef={tokenResult.addressCredentialRef}
  accessTokenRef={tokenResult.accessTokenRef}
  orderRef="guest_order_ref_from_merchant"
/>
```

Mount the route at `/api/veygrit/guest-checkout/handoff` and keep the hosted
Veygrit request in `route.ts`.
