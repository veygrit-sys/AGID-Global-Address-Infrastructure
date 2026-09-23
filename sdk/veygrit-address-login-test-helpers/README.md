# Veygrit Address Login Test Helpers

Shared test-only helpers for Veygrit Address Login SDK conformance.

This directory is not a published runtime package. It exists so the React and
Next.js SDK tests can load the same synthetic callback and merchant-visible
redaction fixtures without copying fixture parsing logic into each SDK.

## Helper Surfaces

- `hostedCallbackValidationVectors.ts` loads hosted `callbackValidationVectors`
  and asserts accepted normalized callback params remain ref-only.
- `merchantVisibleRedactionFixtures.ts` adapts the Vey ID Core
  merchant-visible redaction fixture into React and Next.js test assertions.

## Safety Boundary

- Helpers load only synthetic fixtures from `docs/specs/fixtures`.
- Accepted callback params expose code, state, issuer, credential refs, proof
  refs, and carrier handoff refs only.
- Merchant-visible redaction displays reference fields and counts only.
- Keep raw address, recipient, witness, private-key, proof-secret, provider
  token, carrier credential, and production credential material out of these
  helpers.

## Verification

Run the helper boundary gate before relying on the shared fixtures in SDK
publication-safety checks:

```bash
npm run verify:veygrit-address-login-test-helpers
npm run verify:veygrit-address-login-packages
```

The package traceability preflight keeps this README, both helper modules, and
the helper verifier in the Address Login commit-candidate set. A pass is local
OSS-prep evidence only; it is not a published runtime package, hosted-service
readiness, production data, address truth, residence proof, carrier delivery
success, identity truth, or legal/financial advice.
