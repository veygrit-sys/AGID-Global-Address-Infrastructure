# Verified Address Translation Theory

Last updated: 2026-06-02

## Purpose

Verified Address Translation Theory, or VATT, defines address translation as a
verified transformation of a structured location record, not as free text
sentence translation.

For AGID, the goal is not to produce a fluent paragraph. The goal is to produce
an address display that can survive postal lookup, map search, QR exchange,
SDK use, international shipping, and manual review.

VATT has one core sentence:

```text
Address translation is structure-preserving, evidence-scored rendering from a
canonical address graph into a domestic or international address form.
```

## Problem Statement

Normal machine translation treats text as language. Address translation must
treat text as evidence for geography.

An address contains:

- administrative hierarchy,
- postal routing,
- street or thoroughfare identity,
- building, parcel, unit, or landmark identity,
- local script and romanization conventions,
- country-specific ordering,
- territory and disputed-area rules,
- confidence from open-source and official evidence.

If a full address is translated as one sentence, the system can destroy the
order, over-translate proper names, invent administrative terms, or remove
postal routing data. VATT prevents that by parsing before translating and by
rendering after verification.

## Core Model

VATT represents an address as a canonical address graph.

```text
AddressText
  -> ParsedComponents
  -> CanonicalAddressGraph
  -> EvidenceEvaluation
  -> LocalePurposeRenderer
  -> VerifiedAddressDisplay
```

The canonical graph is language-neutral where possible and script-aware where
necessary.

```json
{
  "country": "JP",
  "territory": null,
  "coordinates": {
    "lat": 35.681236,
    "lon": 139.767125
  },
  "postal": {
    "code": "1006728",
    "confidence": 0.86
  },
  "admin": {
    "level1": "Tokyo",
    "level2": "Chiyoda-ku",
    "level3": null
  },
  "locality": {
    "primary": "Marunouchi",
    "aliases": ["Marunouchi 1-chome"]
  },
  "deliveryObject": {
    "building": "GranTokyo South Tower",
    "unit": null,
    "landmark": null
  },
  "sources": [
    "local-address-format-rules",
    "postal-api",
    "openstreetmap",
    "national-gis"
  ]
}
```

## Translation Contract

VATT translation must preserve these invariants.

1. **Identity preservation**
   The translated display must refer to the same place, not merely a similar
   phrase.

2. **Postal preservation**
   Postal codes, province/state routing, and delivery-critical fields must not
   be dropped or moved into ambiguous text.

3. **Order correctness**
   The rendered order must follow the target country and target purpose:
   domestic native, domestic English, or international shipping English.

4. **Script correctness**
   Native-script display must use the address scripts actually used in that
   country or territory. International English display may use romanization,
   conventional English names, or official English names depending on region.

5. **Evidence transparency**
   Every strong claim should be explainable by a source, rule, or confidence
   label.

6. **No silent invention**
   Unknown building names, postal codes, or administrative levels must not be
   guessed. The result should show partial confidence or manual-required state.

7. **Round-trip compatibility**
   Switching between a native tab and English tab should use the same canonical
   graph, not translate the already-rendered string again.

## Three-Layer Translation Model

Address translation is not ordinary sentence translation. It is a controlled
reconstruction of address structure for a specific operational purpose. VATT
therefore separates the task into three layers.

### 1. Semantic Layer

The system first extracts address elements without translating them:

```text
country
postal_code
admin_level1
admin_level2
locality
block_or_house_number
building
unit_or_floor
coordinate_or_agid
```

For a Japanese address such as `東京都渋谷区神南1-19-11`, the semantic layer
must preserve `東京都`, `渋谷区`, `神南`, and `1-19-11` as components. It must
not treat the whole string as prose.

### 2. Institutional Layer

The canonical components are then interpreted under the country or territory
address model:

```text
JP: prefecture -> city/ward -> town -> chome/block/lot -> building
US: street address -> city -> state -> ZIP
CN: province -> city -> district/county -> street/town -> building/unit
No-postal areas: AGID/coordinate -> admin context -> geographic feature
```

This layer is where postal-code rules, administrative boundaries, official
address metadata, open geographic evidence, and disputed-territory policies
are evaluated.

### 3. Output Layer

Finally, the same canonical graph is rendered for the requested purpose:

```text
international_shipping
domestic_delivery
ecommerce_form
identity_verification
map_search
zk_address_proof
```

The output layer may reorder components, romanize local names, add country
labels, or suppress fields for privacy. It must not invent missing postal
codes, buildings, or administrative levels.

## API Contract

A VATT API should accept ordinary text, structured fields, or both. The public
contract should make purpose explicit and return verification metadata, not
only the translated string.

Example request:

```json
{
  "input_address": "東京都渋谷区神南1-19-11",
  "input_language": "ja",
  "target_language": "en",
  "purpose": "international_shipping",
  "country_model": "JP",
  "output_format": "shipping_label"
}
```

Example response:

```json
{
  "normalized": {
    "country": "Japan",
    "countryCode": "JP",
    "postalCode": "150-0041",
    "adminLevel1": "Tokyo",
    "adminLevel2": "Shibuya-ku",
    "locality": "Jinnan",
    "houseNumber": "1-19-11"
  },
  "formatted": [
    "1-19-11 Jinnan, Shibuya-ku",
    "Tokyo 150-0041",
    "Japan"
  ],
  "confidence": 0.97,
  "postalCodeMatch": "valid",
  "deliveryRisk": "low",
  "unverifiedFields": [],
  "warnings": []
}
```

Required response metadata:

- `confidence`: summary confidence for the rendered result.
- `warnings`: human/actionable warnings.
- `unverifiedFields`: fields that need evidence or user confirmation.
- `postalCodeMatch`: `valid`, `invalid`, `missing`, `unverified`, or
  `not_applicable`.
- `deliveryRisk`: `low`, `medium`, or `high`.

This contract is intentionally more conservative than a generic translation
API. It exposes uncertainty and prevents a fluent-looking but undeliverable
address from being treated as verified.

## Address Machine Translation

VATT defines address machine translation as a constrained pipeline:

```text
VATT(input, country, language, purpose)
  = render(
      validate(
        normalize(
          parse(input, country)
        )
      ),
      language,
      purpose
    )
```

The renderer is the final step, not the first step.

The Japanese companion note [Address Machine Translation Theory](./address-machine-translation-theory-ja.md)
expands this into a five-stage model:

```text
parse → normalize → verify → transform through AGID interlingua → render
```

That separation matters because AGID treats machine translation as a delivery,
form-fill, evidence, and privacy-preserving transformation problem rather than
as a fluent text-generation task.

### Direct Translation Is a Fallback Only

Direct free-text translation can be used only as weak assistance when:

- the address cannot be parsed,
- no postal or geographic evidence is available,
- the result is clearly labeled as manual-required or partial,
- no critical postal or administrative field is overwritten by the model.

For production-quality AGID display, direct translation should never be the
primary path.

## Rendering Purposes

VATT separates language from address purpose.

```text
domestic-native
  Address form used inside the country in a native or official address language.

domestic-english
  English-country domestic form, such as US, UK, CA, AU, NZ, and IE domestic
  address order.

international-shipping-english
  Cross-border English form optimized for carriers, customs forms, QR payloads,
  and foreign users.

geo-fallback
  AGID, coordinates, administrative area, and open geographic feature display
  used when postal systems are weak or absent.
```

Address language tabs should be built from address-use languages, not app UI
languages. A country with one address language and international English should
not expose unrelated app languages as address tabs.

## Source Layers

VATT uses sources as evidence layers.

Priority is contextual, but the default evidence order is:

```text
1. Official postal or national address API
2. National or regional GIS source
3. libaddressinput / OpenCage-style address format metadata
4. OpenStreetMap, OpenFreeMap, Overture, GeoNames, or equivalent open data
5. Postal-code open datasets
6. Script romanization and transliteration engines
7. Supplemental aliases and local dictionaries
8. Free-text machine translation fallback
```

No single source is treated as universal truth. The confidence score is stronger
when independent sources agree.

## Confidence Model

VATT should score the result by component, then summarize it.

```text
score =
  postal_match_weight
+ admin_boundary_weight
+ locality_match_weight
+ street_or_route_weight
+ building_or_landmark_weight
+ coordinate_agid_weight
+ script_romanization_weight
+ source_agreement_weight
- missing_required_field_penalty
- order_violation_penalty
- unsupported_language_penalty
- disputed_area_ambiguity_penalty
```

Recommended display classes:

```text
Verified
  Postal, administrative, and format evidence are strong enough for normal use.

Partial
  Some useful evidence exists, but required fields or source agreement are weak.

Geo Verified
  Postal evidence is unavailable or weak, but AGID, coordinates, admin hierarchy,
  and geographic evidence are coherent.

Manual Required
  The system can display a candidate, but the user must confirm essential data.

No Postal Code
  The selected country or territory does not use postal codes for the current
  address type, or the area has no usable postal-code system.
```

## Language and Region Families

VATT allows shared algorithms when languages have similar address morphology,
but country rules must still be allowed to override them.

### Sinosphere

China mainland, Taiwan, Hong Kong, and Macao must not be collapsed into one
Chinese address algorithm.

```text
CN: Simplified Chinese + Hanyu Pinyin + mainland administrative units
TW: Traditional Chinese + Taiwan conventional romanization + Hanyu Pinyin alias
HK: Traditional Chinese + Hong Kong English + Cantonese-derived place names
MO: Traditional Chinese + Portuguese place-name layer + English assistance
```

### Japanese

Japan should use Japanese address parsing, postal-code validation, and Hepburn
romanization for international English. Chome, ban, and go style components
should be preserved as address structure, not translated as ordinary words.

### Korean Peninsula

Korean address translation should use Revised Romanization as the default
international romanization model, with local administrative rules for South
Korea and North Korea kept separate.

### Arabic Script Areas

Arabic-script countries need a shared script layer, but not a single country
renderer. Gulf, Levant, North Africa, and mixed French-Arabic countries have
different postal and administrative behavior.

### Cyrillic and Russian-Sphere Areas

Russian, Belarusian, Ukrainian, Kazakh, Kyrgyz, Tajik, Mongolian Cyrillic, and
other Cyrillic-script systems can share transliteration mechanics, but country
postal order and local administrative names should remain country-specific.

### Romance Language Areas

Spanish, Portuguese, French, and Italian address systems can share many street,
number, locality, postal, province, and country rendering concepts. Country and
territory overrides are still necessary for overseas territories, autonomous
regions, and local postal formats.

### Germanic Language Areas

German, Dutch, Danish, Norwegian, Swedish, Icelandic, and English address
systems can share Latin-script parsing concepts, but postal order and compound
street naming rules differ.

### Indic and South Asian Areas

India, Pakistan, Bangladesh, Nepal, Sri Lanka, Bhutan, Maldives, and Afghanistan
need script-aware parsing plus English delivery rendering. Local-language
tokens should be normalized through postal, administrative, and geographic
evidence before translation.

### Austronesian and Southeast Asian Areas

Malay, Indonesian, Filipino, Vietnamese, Thai, Khmer, Lao, Burmese, and related
systems need a mixture of local-script handling, Roman-script local names, and
English delivery rendering. Shared algorithms can parse delivery objects and
postal patterns, while country modules own ordering and labels.

## Disputed Areas, Territories, and Special Geography

VATT treats jurisdiction as a rendering policy and evidence problem.

For disputed areas:

- store coordinates and AGID as neutral anchors,
- store claimant-specific renderings separately,
- show the configured claimant order without pretending the order proves legal
  truth,
- allow a user-visible alternate rendering when product policy permits it,
- never merge incompatible country formats into one ambiguous display.

For seas, mountains, water bodies, deserts, forests, and remote natural areas:

- use AGID and coordinates as primary identity,
- use open geographic feature names as evidence,
- show the nearest administrative area only as context,
- avoid creating fake postal addresses.

For overseas territories and autonomous regions:

- keep the country or parent jurisdiction relation,
- keep the territory's own postal and language rules,
- render international English with territory identity visible.

## Algorithmic Stages

### 1. Parse

Split input into address candidates:

```text
recipient
organization
building
unit
house_number
street
block
locality
admin_level
postal_code
country_or_territory
natural_feature
coordinate_or_agid
```

### 2. Normalize

Convert equivalent tokens into canonical components:

```text
postcode variants -> postal.code
prefecture/state/province -> admin.level1
ward/district/commune -> admin.level2 or admin.level3
building aliases -> deliveryObject.building.aliases
```

### 3. Verify

Check components against open and official evidence:

```text
postal format
postal lookup
admin boundary
coordinate containment
building/place-name lookup
territory/disputed-area polygon
```

### 4. Transform

Apply country and script transforms:

```text
romanization
transliteration
conventional-name replacement
administrative-label conversion
street-number reorder
country-name append/remove
```

### 5. Render

Generate the target display from the canonical graph:

```text
native tab -> domestic-native renderer
English tab -> international-shipping-english renderer
English-country native tab -> domestic-english renderer
```

### 6. Explain

Return a compact explanation:

```text
label
score
missing fields
source labels
warnings
manual confirmation hints
```

## Evaluation

VATT quality should be tested with these checks.

1. **Round-trip tab test**
   Enter native address, switch to English, switch back, and confirm the
   canonical graph does not lose components.

2. **Postal autofill test**
   Enter postal code and confirm admin/locality candidates are filled only when
   source confidence is high enough.

3. **No-postal test**
   Confirm countries without postal codes do not show fake postal validation.

4. **Multilingual-country test**
   Confirm only address-use languages appear as address tabs.

5. **Romanization test**
   Confirm country-specific romanization is used instead of generic translation.

6. **Building-name test**
   Confirm local building names can become international English when evidence
   exists, and remain manual-required when evidence is weak.

7. **Disputed-area test**
   Confirm claimant renderings are separated and source policy is visible.

8. **Natural-feature test**
   Confirm sea, mountain, island, and waterfront locations use geo-fallback
   rather than invented postal addresses.

## Implementation Mapping

The theory maps naturally to AGID implementation layers.

```text
address_formats JSON
  Country, territory, postal, language, and rendering metadata.

addressCoveragePolicy
  Postal/geo coverage class and fallback behavior.

addressValidation
  Required fields, postal checks, confidence labels, and warnings.

addressMorphism
  Structure-preserving transforms between native, canonical, and English forms.

verifiedAddressTranslation
  VATT execution pipeline that parses, normalizes, verifies, and renders one
  native display plus international-shipping English from the same canonical
  graph.

transliteration
  Script and romanization transforms.

GeocodingService / source services
  Postal, OSM, Overture, national GIS, and building-name evidence.

Address Registration UI
  Native address tabs, international English tab, postal fields, confidence
  labels, and QR-ready canonical payloads.
```

## Practical Rule

When a translation choice is uncertain, VATT chooses the safer address behavior:

```text
Do not guess.
Keep the original component.
Show confidence.
Ask for confirmation only where needed.
Use AGID and coordinates as the fallback identity.
```

This makes address translation more conservative than normal machine
translation, but much more useful for delivery, registration, navigation, and
SDK integration.
