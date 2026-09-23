# Address Platform Blueprint

This note records how AGID/AOID absorbs product ideas from mapping, identity, verification, developer-platform, edge, and enrichment services without making the OSS core depend on paid or proprietary APIs.

## Core Position

AGID is not a Google Maps clone, an identity provider, or a cryptocurrency-first project. The target is an open address infrastructure SDK that connects address display, validation, delivery eligibility, issuer trust, privacy-preserving proof, POS handoff, and audit.

The core rule is:

- AGID/AOID local resolver, validation logic, SDK, CLI, test vectors, and POS basic flow stay open and local-first.
- Proprietary services can inspire UX and optional adapter boundaries, but must not become mandatory for the core resolver.
- Personal address data, AOID private descriptors, AGID-S payloads, recipient names, phone numbers, and room numbers are never sent to optional enrichment/geocoding adapters by default.

## Adopted Inspiration Map

| Reference | AGID/AOID absorption target | Adoption policy |
| --- | --- | --- |
| Google Maps Platform | AGID Place Record, Address Validation Pipeline, place/address confidence | Reference only |
| HERE Technologies | Global address search, reverse geocoding, POI and delivery-point completion | Optional adapter |
| TomTom | Machine geocoding, typo-tolerant lookup, entry-point accuracy | Optional adapter |
| Mapbox | Forward/reverse geocoding, Search Box-like search UX, language-aware results, feature types, routable points | Optional adapter |
| Overture Maps | Open data basis for addresses, buildings, places, divisions, transportation | OSS data source |
| Okta | Address Identity, issuer trust, staff/device/admin permissions, policy-driven access | Reference only |
| Persona | Address verification flow, review console, manual review, audit-friendly UX | Reference only |
| World ID | Non-duplicate credential and ZK membership ideas, not biometric identity | Reference only |
| Vercel | SDK, CLI, docs, templates, launch checklist, developer experience | Reference only |
| Cloudflare | Edge resolver, local-first fallback, cache and rate-limit policy | Reference only |
| Clearbit | Public/business enrichment, company/destination metadata patterns | Reference only |
| OpenCorporates | Company address, business sites, issuer/carrier verification evidence | Optional adapter |

## Feature Blueprint

### AGID Place Record

Standard public place records attached to AGID. These cover place/building/entrance/POI/natural-feature/delivery-point metadata. They must not include AOID private descriptors, room numbers, recipient names, or phone numbers.

Immediate implementation target:

- Add a public JSON schema for `place`, `building`, `entrance`, `poi`, `natural`, and `delivery_point`.
- Keep precise entrances and private unit details outside public records unless a scoped AOID permission allows disclosure.

### Address Validation Pipeline

Unifies postal-code lookup, country address rules, AGID reverse geocoding, place/natural-feature hints, delivery feasibility, and user correction feedback into a single internal quality decision.

The user-facing result should stay operational:

- `verified`
- `partial`
- `needs_review`
- `restricted`
- `unresolved`

Raw scores stay internal. POS and checkout should show the next action, not a confusing score.

### Address Identity

Address Identity is a policy layer for AOID credentials, issuer trust, passkeys, staff/device/admin roles, and recipient proof. It is not a biometric identity system.

The safe interpretation is:

- prove address-related authority, residence attribute, delivery eligibility, or staff permission;
- avoid fixed public AOID reuse across organizations;
- use domain separation, purpose scopes, short-lived aliases, and nullifiers.

### Address Enrichment

Enrichment starts with public/business data, public place data, issuer metadata, carrier metadata, building entrances, delivery memos, and organization addresses.

Personal address enrichment is high-risk and must be opt-in, redacted, and purpose-scoped. Public company enrichment must not be treated as proof of a person's residence.

### Address Developer Platform

The developer platform should package AGID/AOID as an easy-to-adopt infrastructure layer:

- SDK and CLI
- OpenAPI
- test vectors
- starter templates
- Address Element
- POS Terminal
- webhooks
- dashboard
- launch checklist

The first-run path should support Local Only mode without Ethereum or ZK, then allow Server Registry, ZK, Ethereum Registry, and Full ZK + Ethereum modes when the use case needs them.

### Address Review Console

The review console is the Persona-like manual review and audit surface for addresses:

- review queue
- rejection and needs-review reasons
- redacted evidence timeline
- staff action log
- Address Radar signal
- carrier and recipient receipt review
- dispute and merge/split review

Reviewers should see redacted information by default. Raw address access requires role, purpose, and audit reason.

### Address Search Federation

Search federation normalizes multilingual place names, POIs, roads, entrances, natural features, and postal-code results from multiple sources into AGID candidates.

Priority order should favor fully free and open paths:

1. local AGID index
2. official postal/open government data
3. OpenAddresses / Overture / OSM-derived self-hosted indexes where licensing allows
4. optional proprietary adapters only when explicitly configured

### Edge Address Resolver

The resolver remains local-first, then delegates only when necessary:

1. local cache and local resolver
2. server registry
3. federated resolver
4. optional edge deployment

Responses should carry TTL, ETag/cache status, confidence, restriction state, and high-risk mode flags.

### ZK Credential Uniqueness

World ID inspires the uniqueness and proof-of-membership pattern, but AGID should not adopt biometric identity. The AGID version proves only address-related predicates:

- valid AOID credential
- residence or region membership
- delivery eligibility
- duplicate-prevention nullifier
- freshness/revocation status

ZK does not prove the real-world truth of an address by itself. It must be combined with issuer trust, revocation, freshness, and audit receipts.

## Safety Rules

- Do not make paid geocoding APIs required for the open core.
- Do not send private AOID details or AGID-S payloads to enrichment/search providers by default.
- Do not display internal quality scores to end users.
- Do not treat company enrichment as personal residence proof.
- Do not turn AOID into a fixed cross-service public identifier.
- Do not claim ZK proves address truth without issuer and evidence checks.
- Do not cache precise high-risk AGID data at the edge indefinitely.

## Implementation Phases

### Phase 1: Blueprint and Schema

- Keep `src/lib/addressPlatformBlueprint.ts` as the adopted design catalog.
- Add AGID Place Record schema.
- Define Address Validation Pipeline evidence shape.

### Phase 2: Local OSS Core

- Prefer local resolver, official postal sources, Overture/OpenAddresses/OSM-derived indexes where licenses allow.
- Keep paid/proprietary adapters disabled by default.
- Add test vectors for place record, validation evidence, and language rendering.

### Phase 3: Product Surfaces

- Add Address Review Console views.
- Improve Address Developer Platform docs and templates.
- Connect POS, Address Element, and dashboard to the same validation and identity policies.

### Phase 4: Optional Adapters

- Add optional adapters for HERE, TomTom, Mapbox, and OpenCorporates behind explicit config.
- Require redaction, purpose scopes, request logging, and privacy review before enabling.

## References

- [Google Maps Platform documentation](https://developers.google.com/maps/documentation)
- [HERE Geocoding and Search API v7](https://docs.here.com/geocoding-and-search/docs/introduction-to-here-geocoding-search-api-v7)
- [TomTom Geocoding API](https://developer.tomtom.com/geocoding-api/documentation/product-information/introduction)
- [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/)
- [Mapbox Search Box API](https://docs.mapbox.com/api/search/search-box/)
- [Overture Maps documentation](https://docs.overturemaps.org/)
- [Okta Identity Engine overview](https://developer.okta.com/docs/concepts/oie-intro/)
- [Persona documentation](https://docs.withpersona.com/getting-started)
- [World Developer Docs](https://docs.world.org/)
- [Vercel documentation](https://vercel.com/docs)
- [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
- [Clearbit API support documentation](https://help.clearbit.com/hc/en-us/categories/360000913214-APIs)
- [OpenCorporates API Reference](https://api.opencorporates.com/documentation/API-Reference)
