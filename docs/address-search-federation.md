# Address Search Federation

`Address Search Federation` is a local-first unified search layer for AGID/AOID.
It combines multilingual names, aliases, old place names, postal codes, AGIDs,
administrative hierarchy, and natural feature names into one explainable result set.

The design is inspired by Algolia-style search concepts such as typo tolerance,
synonyms, and result explanation, but AGID keeps the first implementation local and
open-source rather than dependent on a hosted search SaaS.

References:

- Algolia typo tolerance: https://www.algolia.com/doc/guides/managing-results/optimize-search-results/typo-tolerance
- Algolia synonyms: https://www.algolia.com/doc/guides/managing-results/optimize-search-results/adding-synonyms

## Problem

Address search is not only "string contains text." Real users search by:

- postal code
- AGID
- local-language name
- international English name
- transliteration
- old administrative name
- place alias
- river, lake, island, mountain, desert, heritage site, park, or building name
- partial text
- misspelled text

The result must also explain why it matched. This matters for address correction,
operator trust, POS workflows, and manual review.

## Core Idea

The index stores one normalized record per address/place candidate:

```text
record
  id
  kind
  sourceId
  sourcePriority
  countryCode
  languages
  names
  aliases
  oldNames
  postalCodes
  agids
  adminHierarchy
  naturalFeatures
```

Queries are resolved against multiple sub-indexes:

```text
query
  -> postal exact index
  -> AGID exact index
  -> token inverted index
  -> synonym expansion
  -> prefix match
  -> typo-tolerant match
  -> ranking and explanation
```

## Why Matched

Every result includes `reasons`.

Reason codes include:

- `postal-code-match`
- `agid-match`
- `exact-name-match`
- `localized-name-match`
- `administrative-match`
- `old-address-match`
- `alias-match`
- `natural-feature-match`
- `synonym-match`
- `prefix-match`
- `typo-tolerant-match`
- `language-preferred`
- `source-priority`

Example:

```ts
const results = searchAddressFederation(index, 'Edo Castle');
results[0].reasons;
// [{ code: 'old-address-match', label: 'Old or historical address matched', ... }]
```

This can be shown in the address registration UI as:

```text
旧住所一致: Edo Castle
```

## Ranking Principles

The ranking is intentionally conservative for address infrastructure:

1. Exact AGID and postal-code matches rank highest.
2. Canonical/localized names rank above aliases.
3. Administrative, old-name, alias, and natural-feature matches are explainable but lower.
4. Synonyms are useful but lower than exact name matches.
5. Typo tolerance is disabled for code-like tokens such as postal codes and AGIDs.
6. CJK queries use full tokens plus compact bigrams instead of western typo tolerance.
7. Source priority and preferred language add small boosts, not hard overrides.

This follows the spirit of Algolia's typo tolerance and synonym features while avoiding
dangerous overmatching in addresses.

## Natural Feature Coverage

`naturalFeatures` is meant to cover named:

- rivers
- waterfalls
- lakes
- ponds
- wetlands
- islands
- mountains
- deserts
- forests
- glaciers
- caves
- valleys
- ruins
- heritage sites
- parks

This makes searches such as "Nile", "Lake Victoria", "Sahara", or a local island name
able to return an AGID-relevant place candidate even where conventional street addresses
are weak.

## Public/Private Boundary

This module is for public reference data, user query strings, and commitment-safe
address/place records. It should not index:

- private recipient names
- phone numbers
- raw AOID private descriptors
- decrypted AGID-S payloads
- private delivery notes

For private records, index commitments or aliases only, then require `Address Access /
Address Auth` and `Address Consent Envelope` before revealing any protected data.

## Implementation

Code:

- `src/lib/addressSearchFederation.ts`
- `src/lib/addressSearchFederation.test.ts`

Main exports:

- `buildAddressSearchIndex`
- `searchAddressFederation`
- `explainAddressSearchResult`

Tested behavior:

- postal-code search
- AGID search
- old place-name search
- alias search
- natural-feature search
- multilingual and transliteration search
- typo-tolerant search
- synonym expansion
- CJK token search
