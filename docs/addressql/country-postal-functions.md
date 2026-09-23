# AddressQL Country And Postal Functions

Status: research and function-design draft

AddressQL needs country functions because address behavior is country-scoped.
It also needs postal functions because postal-code systems vary widely: some
countries have strong official postal codes, some have weak or partial systems,
and some have no postal code for ordinary addressing.

It must support native language and English address workflows without treating
language choice as identity, nationality, or residence proof.

The design goal is:

```text
country -> address profile -> postal status -> validation or postal-equivalent fallback
```

## Country Functions

| function | phase | purpose |
| --- | --- | --- |
| `COUNTRY_RESOLVE(country_input, standard?, source_version?)` | MVP | Resolve localized name, ISO-like code, alias, or display text to a country reference. |
| `COUNTRY_ADDRESS_PROFILE(country, source_version?)` | MVP | Return address order, required components, local/English display policy, and postal status. |
| `COUNTRY_SUBDIVISIONS(country, level?, source_version?)` | v0.2 | Return administrative subdivision candidates for forms and validation. |
| `COUNTRY_LANGUAGES(country, purpose?, source_version?)` | v0.2 | Return native language, English, transliteration, and dual-display policy. |
| `COUNTRY_POSTAL_STATUS(country, source_version?)` | MVP | Return whether postal codes are official, weak, absent, carrier-specific, or fallback-required. |
| `COUNTRY_SOURCE_POLICY(country, purpose?, source_version?)` | MVP | Rank official, open, community, AGID, postal, and carrier sources for the country. |

### Non-claims

Country functions do not:

- adjudicate sovereignty;
- prove political recognition;
- prove full national data coverage;
- imply that every local language or local usage is represented;
- guarantee that official source data is complete, fresh, or free.

## Postal Functions

| function | phase | purpose |
| --- | --- | --- |
| `POSTAL_STATUS(country, source_version?)` | MVP | Country-level postal-system status for query planning. |
| `POSTAL_FORMAT(country, source_version?)` | MVP | Postal-code format, examples, and normalization rules. |
| `POSTAL_FORMAT_VALIDATE(postal_code, country, source_version?)` | MVP | Validate only syntax/format, without claiming the code exists. |
| `POSTAL_NORMALIZE(postal_code, country, source_version?)` | MVP | Normalize spacing, case, separators, and local format variants. |
| `POSTAL_PARSE(postal_text, country?, source_version?)` | v0.2 | Parse composite postal text into components. |
| `POSTAL_REQUIRED(address_or_components, country, purpose?, source_version?)` | MVP | Decide whether postal code is required for a purpose. |
| `POSTAL_EXISTS(postal_code, country, source_version?)` | MVP | Check whether the normalized code exists in the loaded source-version dataset. |
| `POSTAL_VALIDATE(address_or_components, postal_code, country, source_version?)` | MVP | Validate address/postal consistency under source version. |
| `POSTAL_LOOKUP(postal_code, country, source_version?)` | v0.2 | Return candidate regions for a postal code. |
| `POSTAL_AREA(postal_code, country, source_version?)` | v0.2 | Return source-versioned postal area references. |
| `POSTAL_EQUIVALENT(address_or_region, country, policy?, source_version?)` | MVP | Create a fallback operational region when postal code is absent or weak. |
| `POSTAL_SUGGEST(address_or_components, country, source_version?)` | v0.2 | Suggest likely postal codes or repairs without overwriting user intent. |

## Postal Status Classes

```text
official_postal_code
no_postal_code
weak_or_partial_postal_code
carrier_specific_postal_code
postal_equivalent_required
```

### official_postal_code

Recommended query plan:

```text
COUNTRY_POSTAL_STATUS
-> POSTAL_FORMAT
-> POSTAL_NORMALIZE
-> POSTAL_FORMAT_VALIDATE
-> POSTAL_EXISTS
-> POSTAL_VALIDATE
-> POSTAL_AREA
```

Fallback:

```text
POSTAL_SUGGEST
-> ADDRESS_WITHIN
```

### no_postal_code

Recommended query plan:

```text
COUNTRY_POSTAL_STATUS
-> POSTAL_REQUIRED
-> POSTAL_EQUIVALENT
-> ADDRESS_WITHIN
-> DELIVERY_AVAILABLE
```

Failure behavior:

```text
Do not invent an official postal code.
Return postal_equivalent_required or manual_review_required.
```

### weak_or_partial_postal_code

Recommended query plan:

```text
COUNTRY_POSTAL_STATUS
-> POSTAL_FORMAT_VALIDATE
-> POSTAL_EXISTS
-> POSTAL_VALIDATE
-> POSTAL_SUGGEST
-> ADDRESS_SCORE
-> ADDRESS_ISSUES
```

Failure behavior:

```text
Keep address as partial and require extra evidence rather than rejecting solely
by postal mismatch.
```

### carrier_specific_postal_code

Recommended query plan:

```text
COUNTRY_POSTAL_STATUS
-> DELIVERY_AREA
-> POSTAL_EQUIVALENT
-> DELIVERY_AVAILABLE
```

Non-claim:

```text
Carrier-specific postal areas are not universal public postal systems.
```

## Usage Workflows

### 1. Country selector

Use when a user types a country name, alias, or code.

```sql
SELECT COUNTRY_RESOLVE(:country_input, 'source-policy', :source_version);
```

Then:

```sql
SELECT COUNTRY_ADDRESS_PROFILE(:country, :source_version);
SELECT COUNTRY_LANGUAGES(:country, 'address_form', :source_version);
SELECT COUNTRY_SOURCE_POLICY(:country, 'validation', :source_version);
```

If ambiguous:

```text
Return ambiguous_country.  Do not guess.
```

### 2. Native language and English address form

Use for Address Login or global address forms.

```sql
SELECT COUNTRY_ADDRESS_PROFILE(:country, :source_version);
SELECT COUNTRY_LANGUAGES(:country, 'dual_form', :source_version);
SELECT ADDRESS_SCHEMA(:country, :schema_version);
```

The UI can choose:

```text
native-only
English-only
native + English
native input + English preview
```

Non-claim:

```text
Display language is not proof of nationality, residence, or identity.
```

### 3. Postal validation

```sql
WITH p AS (
  SELECT POSTAL_NORMALIZE(:postal_code, :country, :source_version) AS normalized
)
SELECT POSTAL_VALIDATE(:address_components, p.normalized, :country, :source_version)
FROM p;
```

If `POSTAL_FORMAT` passes but `POSTAL_VALIDATE` fails, do not overwrite the
address automatically.  Return a suggestion or manual-review state.

### 4. No-postal-code fallback

```sql
SELECT POSTAL_REQUIRED(:address_components, :country, 'delivery', :source_version);
SELECT POSTAL_EQUIVALENT(:address_region, :country, :policy, :source_version);
SELECT DELIVERY_AVAILABLE(:envelope, :carrier, :service_level, :source_version);
```

Important:

```text
POSTAL_EQUIVALENT creates an operational region for search, validation, or
delivery.  It is not an official postal code.
```

### 5. Weak postal-code country

```sql
SELECT COUNTRY_POSTAL_STATUS(:country, :source_version);
SELECT POSTAL_VALIDATE(:components, :postal_code, :country, :source_version);
SELECT POSTAL_SUGGEST(:components, :country, :source_version);
SELECT ADDRESS_SCORE(:components, 'delivery', :source_version);
SELECT ADDRESS_ISSUES(:components, 'delivery', :source_version);
```

Use postal data as one signal, not as the only rejection condition.

### 6. Country source policy

```sql
SELECT COUNTRY_SOURCE_POLICY(:country, 'address_login', :source_version);
```

The result should rank:

```text
official source
postal operator
open geodata
AGID country pack
carrier source
community verified source
manual review
```

Non-claim:

```text
Source policy ranks usable evidence; it is not political recognition or legal
advice.
```

## Function Output Sketches

### `CountryPostalStatus`

```json
{
  "country": "HK",
  "status": "no_postal_code",
  "requiredness": "not_required_for_delivery_form",
  "coverage": "none",
  "source_version": "source-2026-07",
  "warnings": ["use postal-equivalent or delivery area"]
}
```

### `PostalEquivalentRegion`

```json
{
  "region_ref": "agid-region:example",
  "policy": "delivery_fallback",
  "confidence": 0.82,
  "source_version": "source-2026-07",
  "non_claims": ["not an official postal code", "not proof of residence"]
}
```

### `CountryAddressProfile`

```json
{
  "country": "JP",
  "address_order": ["postal_code", "admin1", "locality", "district", "block", "building", "unit"],
  "required_components": ["admin1", "locality", "district"],
  "locales": ["ja", "en"],
  "postal_status": "official_postal_code",
  "source_version": "source-2026-07"
}
```

## Research Questions

1. When should a country profile be enough to render a form?
2. When is postal-code validation allowed to reject a user input?
3. How should AddressQL represent territories, disputed areas, autonomous
   regions, overseas territories, and special administrative regions?
4. How should postal-equivalent regions be generated for no-postal-code
   countries?
5. How can postal suggestions improve UX without silently changing user intent?
6. Which postal functions are index-safe and which require policy checks?

## Release Gates

- Every country function must be source-versioned.
- Every postal function must declare whether it works with no-postal-code
  countries.
- Examples must be synthetic or coarse metadata only.
- `POSTAL_EQUIVALENT` must clearly state that it is not an official postal code.
- Country functions must not adjudicate sovereignty or political recognition.
