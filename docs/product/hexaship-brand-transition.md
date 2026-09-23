# Hexaship Brand Transition

Version: hexaship-brand-transition-v0.1

Hexaship is the proposed primary brand for the address-native shipping
infrastructure layer previously called Skipship.

Positioning:

- Hexaship is the product-facing brand.
- Skipship remains the legacy developer alias during the compatibility window.
- The first migration goal is clarity, not a breaking rename.

Tagline:

One API, ID, and wallet layer for carrier-agnostic shipping infrastructure.

## Compatibility Policy

The migration must preserve existing developer contracts until an explicit v1
gate is ready.

- Keep `@skipship/js` exports available while introducing `@hexaship/js`.
- Keep `skipship-*` HTTP headers until an OpenAPI v1 compatibility document
  defines replacements.
- Keep existing `/v1/...` routes stable during the brand migration.
- Keep synthetic fixtures redacted and local-only.

## Migration Phases

1. Brand decision memo
   Adopt Hexaship as the public brand and treat Skipship as the legacy alias.

2. Dual-name contract window
   Document Hexaship names beside Skipship OpenAPI operation IDs, headers,
   routes, and fixtures.

3. SDK alias package
   Introduce `@hexaship/js` as an alias package that re-exports the existing
   client before renaming public symbols.

   Current executable artifact:

   - Package: `sdk/hexaship-js`
   - Fixture: `sdk/hexaship-js/fixtures/hexaship-alias-migration-v0.1.json`
- Verification: `npm run verify:hexaship-js`
- Package dry-run, install-smoke, TypeScript consumer, and fixture export gate: `npm run verify:hexaship-package`
- Migration gate: `npm run verify:hexaship-migration`
   - Type check: `npx tsc --noEmit -p sdk/hexaship-js/tsconfig.json`

   The fixture keeps `POST /v1/shipment-intents`, `POST /v1/delivery/rates`,
   `POST /v1/delivery/allocate`, `POST /v1/shipments`, and `skipship-*`
   idempotency headers unchanged while showing the `createSkipshipClient` to
   `createHexashipClient` import migration.

4. Docs migration
   Update product docs to lead with Hexaship while retaining Skipship references
   for search and compatibility.

5. Package migration
   Rename examples from `skipship.*` to `hexaship.*` only after alias adoption
   and verification pass.

## Blocked Moves

- Do not rename `skipship-idempotency-key`, webhook replay headers, or signature
  headers before OpenAPI v1 compatibility is published.
- Do not remove `@skipship/js` exports while Merchant Console, sandbox routes,
  or fixtures still import them.
- Do not claim trademark clearance, domain availability, global carrier support,
  or live carrier partnerships from the name change alone.
- Do not add production credentials, raw addresses, recipient contacts, proof
  witnesses, private keys, proof secrets, or carrier secrets to migration
  fixtures.

## SDK Migration Example

During the alias window, the same safe request may be used with either client
factory:

```ts
import { createSkipshipClient } from "@skipship/js";
import { createHexashipClient } from "@hexaship/js";

const skipship = createSkipshipClient(options);
const hexaship = createHexashipClient(options);

await skipship.createShipment(request);
await hexaship.createShipment(request);
```

The request must contain only references such as `recipientId`,
`addressFormVersion`, `parcelProfileRef`, `walletConsentRef`, and
`servicePreference`. `addressFormVersion` uses the `wallet_country_form_ref_...`
prefix in both legacy Skipship and Hexaship examples so EC integrations can
carry the user's familiar country-form version while server-side Hexaship
adapters map it to DHL/UPS label shapes later. Raw address text, recipient
contact material, carrier credentials, private keys, proof secrets, and proof
witnesses remain blocked before transport.

## Verification

Use the root migration gate before changing public names, package exports,
headers, or examples:

```bash
npm run verify:hexaship-migration
```

This runs the Hexaship alias SDK, legacy Skipship SDK, brand strategy, and
Delivery Gateway carrier API checks together.

## Non-Claims

- Hexaship is a brand transition plan, not a trademark clearance result.
- Hexaship naming does not imply carrier partnerships or global delivery
  coverage.
- Legacy Skipship APIs remain compatibility surfaces until explicit v1 migration
  gates pass.
