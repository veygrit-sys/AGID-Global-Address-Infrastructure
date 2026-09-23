# AddressQL Multilingual Quality v0.1

Status: P3 executable quality-gate index

AddressQL separates layout support from transliteration and verified
place-name translation. A country profile can format a domestic or
international label without proving that a translated place name is correct.

## Levels

| level | capability | activation evidence |
| --- | --- | --- |
| M0 | country language profile | declared BCP 47 language codes |
| M1 | native-language format | country-owned native template |
| M2 | international English format | country-owned international template |
| M3 | source-gated transliteration | language and script policy, approved aliases, synthetic holdout, independent signature, and runtime adapter |
| M4 | verified place-name translation | approved source identity, version, rights, scope, correction route, aliases, contextual holdout, independent signature, and runtime adapter |

`enabled`, `review_candidate`, `blocked`, and `not_applicable` are distinct
states. A review candidate must not be used as an automatic delivery-label
transformation.

## Current Coverage

The v0.1 index evaluates all 276 country and neutral-scope profiles:

- 271 have M1 native-format templates;
- 271 have M2 international-English-format templates;
- 218 are M3 transliteration review candidates;
- JP, CN, TW, HK, MO, and SG are M4 review candidates because contextual
  Japanese or regional Chinese place-name engines exist;
- zero profiles enable automatic place-name translation.

The five non-addressable profiles retain M0 language metadata without
inventing a postal layout.

## Metadata-Only Assessment

The practical API exposes:

```text
GET  /v1/multilingual
GET  /v1/countries/{countryCode}/languages
POST /v1/multilingual/assess
```

The assessment accepts only country code, source language, target language,
purpose, and an optional technical request identifier. It does not accept,
store, log, or translate address text.

Same-language identity normalization may be marked `ready`. A supported
native-to-English or English-to-native route remains `review_required` until
country evidence satisfies M3 and M4. Undeclared language routes fail closed.

## Japanese And Chinese Context

Japanese contextual-reading and Chinese regional place-name engines are
evidence-bearing adapters, not proof of correct output. They preserve the
ability to distinguish:

- Japanese readings that vary by administrative context;
- simplified and traditional Chinese scripts;
- mainland, Taiwan, Hong Kong, Macao, and Singapore regional conventions.

Promotion still requires source-backed aliases, country-specific synthetic
holdouts, an independently signed report, and a reviewed runtime adapter.

Official-name ranking is now an executable shared contract. Its versioned
catalog pins source versions and per-place alias digests, while aggregate
holdouts report country and administrative-hierarchy accuracy. Official aliases
and official romanizations outrank generated transliteration. Missing context
for same-script names produces a safe deferral instead of a guessed reading.

See [Official Place-Name Ranking v1](official-place-name-ranking-v1.md).

## Verification

```bash
npm run verify:addressql-multilingual-quality
npm run verify:addressql-place-names
npm run verify:addressql-api
npm run verify:addressql
```

Tests use language metadata and synthetic assertions only. They do not contain
private locations, people, precise coordinates, credentials, or production
traffic.

## Non-Claims

- A native template does not prove transliteration quality.
- An English template does not prove place-name translation quality.
- Adapter availability does not prove official spelling, reading, or delivery.
- P3 does not claim parity with commercial address-validation providers.
