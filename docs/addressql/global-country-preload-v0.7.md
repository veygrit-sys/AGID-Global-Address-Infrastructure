# AddressQL Global Country Preload v0.7

Status: executable preload contract

## Purpose

AddressQL should not wait for a live external API before it can render a
country-specific address form, decide whether a postal code is expected, or
choose a safe validation path.

Global Country Preload v0.7 makes this explicit:

```text
All supported countries and territories have a local AddressQL profile.
Each profile declares address-format coverage, validation readiness, postal
status, source policy, fallback strategy, and non-claims.
```

This is a preload layer, not a claim that every country has complete verified
address data.

## What Is Prelearned

For each country or territory, AddressQL preloads:

- country code;
- display name;
- address format coverage;
- native-language input availability;
- English input availability;
- language codes when known;
- required address components when known;
- regional hierarchy when known;
- postal status;
- postal format and regex availability;
- preferred postal source identifiers when cataloged;
- open-source source identifiers when declared;
- postal-equivalent fallback strategy;
- non-claims.

The first implementation is backed by:

```text
src/data/address_formats/**/*.json
src/lib/officialPostalSourceCatalog.ts
src/lib/addressQlGlobalCountryPreload.ts
```

## Readiness Classes

### Address Format Coverage

```text
native_and_english_preloaded
native_only_preloaded
english_only_preloaded
seed_profile_required
```

### Postal Status

```text
official_postal_code
no_postal_code
weak_or_partial_postal_code
carrier_specific_postal_code
postal_equivalent_required
```

### Validation Readiness

```text
format_only
metadata_gated
postal_equivalent_required
delivery_source_required
manual_review_required
```

## Query Semantics

`COUNTRY_ADDRESS_PROFILE(country)` should consult the preload profile first.

Expected behavior:

```sql
SELECT COUNTRY_ADDRESS_PROFILE('HK');
```

Result shape:

```json
{
  "country_code": "HK",
  "address_format_coverage": "native_and_english_preloaded",
  "postal_status": "no_postal_code",
  "validation_readiness": "postal_equivalent_required",
  "postal_equivalent_strategy": "Use AGID/admin/delivery regions and ADDRESS_WITHIN/DELIVERY_AVAILABLE; do not invent official postal codes.",
  "non_claims": [
    "A preloaded country profile is not proof of global address completeness.",
    "Postal validation is not proof of residence, identity, or carrier SLA.",
    "Postal-equivalent regions are operational fallbacks, not official postal codes."
  ]
}
```

`POSTAL_VALIDATE(country, postal_code, components)` must not invent a postal
code for a no-postal-code country.  It should return a refusal or a
postal-equivalent requirement:

```text
country with no postal system
        ↓
POSTAL_REQUIRED = false
        ↓
POSTAL_EQUIVALENT required for delivery validation
        ↓
ADDRESS_WITHIN / DELIVERY_AVAILABLE
```

## Address Login Use

Address Login can use the preload layer to choose input mode:

```text
country selector
        ↓
COUNTRY_ADDRESS_PROFILE
        ↓
native / English / dual-language form
        ↓
POSTAL_REQUIRED
        ↓
POSTAL_VALIDATE or POSTAL_EQUIVALENT
```

This lets Address Login support all countries and territories without requiring
a live postal API at input time.

## No-Postal-Code Countries

For countries and territories with no normal public postal-code use, AddressQL
must use operational alternatives:

```text
AGID region
administrative region
delivery area
landmark/POI graph
safe geofence
carrier service area
```

The important rule:

```text
Do not invent an official postal code.
```

## Weak Postal-Code Countries

For weak or partial postal systems, AddressQL should treat postal data as one
signal among several:

```text
postal syntax
administrative hierarchy
street/locality evidence
AGID cell or region
delivery source
source confidence
manual review state
```

The postal code can raise confidence, but it must not silently override stronger
administrative or spatial evidence.

## Mathematical Model

Let:

```text
C = set of country or territory codes
F_c = address format profile for country c
P_c = postal status profile for country c
S_c = source policy for country c
V_c = validation readiness state for country c
```

The preload map is:

```text
L : C -> (F_c, P_c, S_c, V_c)
```

The safety constraint is:

```text
forall c in C:
  L(c).non_claims != empty
```

For no-postal-code countries:

```text
P_c = no_postal_code
  => POSTAL_VALIDATE(c, x) must not return official_postal_code_valid
  => POSTAL_EQUIVALENT(c, purpose, source_version) is required for strict delivery validation
```

For weak postal-code countries:

```text
P_c = weak_or_partial_postal_code
  => postal evidence is advisory unless combined with admin/spatial/delivery evidence
```

## Verification

Executable checks:

```bash
npm run verify:addressql-global-preload
npm run verify:addressql
```

The tests assert that:

- the preload covers at least the ISO country/region baseline;
- every local address-format JSON profile is included;
- no-postal-code countries require postal-equivalent fallback;
- weak postal-code countries return warning readiness;
- official postal-code countries can reach `format_only` only when a
  postal regex and source policy exist;
- every profile declares non-claims.

## Non-Claims

Global Country Preload v0.7 does not claim:

- complete global address coverage;
- official postal-code authority for every country;
- proof of residence;
- proof of identity;
- carrier SLA;
- live source freshness;
- audited ZK proof support.

It is a local, source-versioned decision layer that lets AddressQL choose the
right validation path before touching any live source.
