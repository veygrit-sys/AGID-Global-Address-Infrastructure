# Vey ID Core API v0.1

Vey ID Core is the merchant-facing identity contract for adding `Continue with
Veygrit` to EC sites while keeping Address Wallet data reference-first.

This profile fixes the MVP boundary:

- account creation is Google / Apple only;
- merchant identity is `pairwiseSubjectAlias`, not a global user id;
- PKCE is required for authorization code exchange;
- merchants receive refs such as `authorizationCodeRef`, `accessTokenRef`,
  `idTokenRef`, and `addressCredentialRef`;
- EC guest checkout uses `guestCheckoutAlias`, `walletConsentRef`,
  `addressCredentialRef`, and `carrierHandoffRef` without requiring merchant
  account creation or an EC password;
- guest checkout handoff is explicitly bound to the
  `merchant-visible-redaction` privacy boundary, so merchant-visible evidence
  stays limited to refs and required blocked material stays named;
- the fixture also pins the React SDK display helper
  `createMerchantVisibleRedactionDisplayModel()` and its package-visible
  example, so UI and SDK consumers render only approved refs plus blocked-class
  and non-claim counts;
- wallet-side revocation returns deletion refs for merchant cleanup;
- raw address, recipient contact, provider tokens, proof secrets, private keys,
  carrier keys, and production credentials are not accepted by fixtures or public
  examples.

Normative files:

- OpenAPI: `docs/specs/veygrit-id-core.openapi.yaml`
- Fixture: `docs/specs/fixtures/veygrit-id-core-v0.1.json`
- Fixture schema: `docs/specs/schemas/veygrit-id-core-fixture-v0.1.schema.json`
- Verifier: `npm run verify:veygrit-id-core-openapi`
- Privacy boundary source:
  `src/lib/veyIdAddressWalletFoundation.ts#privacyThreatBoundaryGates`

Non-claims:

- Vey ID login is not proof of residence.
- Vey ID does not make an EC a carrier or payment processor.
- The local fixture is not a production Google, Apple, carrier, or Veygrit API
  call.
- Address Wallet reuse remains consent-bound and revocable from the wallet side.
