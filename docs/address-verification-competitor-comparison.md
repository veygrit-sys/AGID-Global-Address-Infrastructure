# Address verification competitor comparison

This note compares the current AGID address verification engine with major address
validation products. It is for internal planning only; these scores must not be
shown to end users.

## Current AGID baseline

- Address-format JSON coverage in this repository: 281 countries, territories,
  or special regions.
- Explicit AGID address verification target policies: 22 regions.
- Current strength: open-source auditability, local-first privacy, natural
  feature context, and explainable evidence trails.
- Current weakness: commercial delivery-point validation, suite/apartment
  correction, and authoritative postal reference depth outside the explicit
  target policies.

## Competitor posture

| Product | What it is strong at | Where AGID can differ |
| --- | --- | --- |
| Google Address Validation API | Postal validation, geocoding, metadata, and Google Maps/Places integration in supported regions. The official coverage table is much smaller than the 240+ country commercial vendors and notes that quality varies by country. | AGID can cover natural features and local-first audit paths that a postal-address schema does not model. |
| GBG Loqate Verify | Country-by-country verification/geocode depth with L1-L5 levels, including delivery-point depth in strong countries. | AGID can be more reproducible and inspectable because its rules and evidence can be open. |
| Melissa Global Address Verification | 240+ country correction, standardization, geocoding, autocomplete, transliteration, and a CASS-certified US path. | AGID can avoid mandatory third-party API calls and preserve audit-friendly open rules. |
| Experian Address Validation | 245 country real-time/bulk validation, authoritative postal sources, fuzzy matching, transliteration, enrichment, and uptime guarantees. | AGID can target open-source reproducibility and public benchmark evidence instead of closed scoring. |
| Smarty International Street Address API | Shipping-address validation, component output, precision metadata, and strong dedicated US products. | AGID can combine postal validation with AGID/AOID registration and natural geography identity. |
| Nominatim + libpostal style stack | Open geocoding, parsing, self-hosting, and broad OSM place search. | AGID can add country policies, postal evidence scoring, audit decisions, and address registration semantics on top of open geodata. |

## Internal score interpretation

Use `src/lib/addressVerificationBenchmark.ts` as the machine-readable model.
The score is a weighted heuristic across global postal coverage, delivery-point
depth, authoritative postal evidence, correction, fuzzy matching, geocoding,
autocomplete, language/script handling, natural-feature context, auditability,
privacy/local-first behavior, and cost control.

The current expected result is:

- Commercial products should outrank AGID on delivery-point and authoritative
  postal validation.
- AGID should outrank commercial products on open-source auditability,
  local-first privacy, cost control, and named natural-feature context.
- AGID should not claim parity with Loqate, Melissa, Experian, Smarty, or
  Google until it has a country-stratified gold corpus and authoritative
  delivery-point datasets for the target markets.

## Path to paid-API quality

1. Build a gold benchmark corpus per priority country: valid, invalid,
   incomplete, rural, urban, island, remote, multilingual, and postal-code-only
   cases.
2. Add provider adapters for optional A/B evaluation: AGID local, Google,
   Smarty, Loqate, Melissa, Experian, and Nominatim/self-host.
3. Measure component precision/recall, deliverability false positives,
   correction accuracy, geocode precision, latency, cost, and auditability.
4. Promote countries into quality tiers only when the benchmark proves stable:
   official delivery-point evidence, strong postal-code evidence, geodata-only
   partial evidence, or manual/unresolved.
5. Prioritize authoritative data acquisition for US, JP, GB, CA, AU, NZ, NL,
   FR, DE, BR, SG, HK, and AE before claiming commercial-grade coverage.

## Sources checked

- Google Address Validation coverage:
  https://developers.google.com/maps/documentation/address-validation/coverage
- Google `validateAddress` reference:
  https://developers.google.com/maps/documentation/address-validation/reference/rest/v1/TopLevel/validateAddress
- GBG Loqate country data coverage:
  https://docs.loqate.com/data-coverage/introduction
- Melissa Global Address Verification datasheet:
  https://www.melissa.com/hubfs/resources/data-sheet-global-address-verification.pdf
- Experian Address Validation introduction:
  https://docs.experianaperture.io/address-validation/experian-address-validation/overview/introduction/
- Smarty International Street Address API:
  https://www.smarty.com/docs/apis/international-street-api/reference
- Nominatim API documentation:
  https://nominatim.org/release-docs/develop/api/Overview/
