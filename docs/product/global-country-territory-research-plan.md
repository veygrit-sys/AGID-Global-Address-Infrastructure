# Global Country, Territory, and Disputed Area Research Plan

This plan defines how AGID researches every country, overseas territory,
autonomous territory, disputed area, polar area, and maritime/non-postal area
without mixing legal claims, operational delivery reality, and private address
material.

## Scope

AGID tracks these entity classes separately:

- `sovereign_state`: UN member states and widely used sovereign-state records.
- `associated_state`: self-governing states in free association or similar
  arrangements.
- `dependent_territory`: overseas territories, crown dependencies, external
  territories, special municipalities, and non-sovereign territories.
- `autonomous_region`: regions with address, language, postal, or administrative
  behavior that differs from the parent state.
- `disputed_area`: territories with competing claims or non-universal
  recognition.
- `special_political_area`: special administrative regions and areas with
  separate postal, customs, or address rules.
- `polar_area`: Antarctica, subantarctic islands, research stations, and polar
  territorial claims.
- `maritime_area`: seas, offshore platforms, ports, anchorages, islands without
  normal postal addressing, and marine handoff zones.
- `no_postal_code_area`: areas where AGID or coordinates are the primary
  identifier because postal codes are absent or insufficient.

## Source Priority

Use source tiers in this order:

1. ISO 3166 for country, dependency, and special geopolitical codes.
2. UN M49 for statistical country/area grouping and region/subregion placement.
3. National or territorial government sources for names, subdivisions, postal
   rules, and official open data.
4. Postal operators and public postal-code APIs for delivery behavior.
5. Natural Earth Admin 0 and disputed-area layers for de facto boundary and map
   unit bootstrapping.
6. OpenStreetMap, Overture, GeoNames, Wikidata, and local open-data projects for
   operational geography, aliases, buildings, and settlement names.
7. AGID manual review only when official or open sources are weak.

No single source is authoritative for every AGID purpose. The inventory must keep
source, claim, and operational delivery status as separate fields.

## Canonical Entity Record

Each researched entity should produce a small metadata record:

```json
{
  "agidEntityId": "agid-area-example",
  "iso2": "EX",
  "iso3": "EXA",
  "m49": "999",
  "name": "Example Area",
  "class": "dependent_territory",
  "parentSovereign": "Example State",
  "canonicalContinent": "oceania",
  "canonicalSubregion": "polynesia",
  "addressModel": "country_pack",
  "postalModel": "postal_code_available_weak_api",
  "languageTabs": ["local", "international_en"],
  "claimsPolicy": "none",
  "sources": [],
  "quality": {
    "admin": "partial",
    "postal": "partial",
    "geometry": "external",
    "addressFormat": "verified"
  }
}
```

## Research Passes

### Pass 1: Global Inventory

Create a master list from ISO 3166 and UN M49:

- Country or area code.
- Official English name.
- Local name when available.
- Parent sovereign when non-sovereign.
- UN region/subregion.
- AGID canonical continent/subregion.
- Entity class.

### Pass 2: Territory Expansion

Add territories that are operationally important for addresses:

- UK Crown Dependencies and Overseas Territories.
- French overseas departments, collectivities, and territories.
- Netherlands Caribbean entities.
- Danish Realm areas.
- Norwegian Arctic territories.
- US territories and freely associated states.
- Australian external territories.
- New Zealand Realm and associated states.
- Spanish and Portuguese islands/autonomous regions.
- Special administrative regions and customs/postal special areas.

### Pass 3: Disputed and Claim-Sensitive Areas

Track disputed territories separately from country packs:

- Claimants.
- Display policy.
- Default AGID policy.
- Japanese-claim rule for Japan-related disputes.
- De facto control source.
- Postal/delivery behavior.
- Geometry source and confidence.

### Pass 4: Postal and Address Classification

Classify every entity into:

- `postal_code_available_reliable_api`
- `postal_code_available_weak_api`
- `postal_code_format_only`
- `no_postal_code_strong_geo_oss`
- `no_postal_code_weak_geo_oss`
- `manual_required`

### Pass 5: Repository Split

Assign each entity to:

- Global index.
- Country pack repository.
- State/province/prefecture repository.
- Megacity repository.
- Territory pack repository.
- Disputed-area pack repository.
- Maritime/polar pack repository.
- External storage pack.

## Data Boundaries

GitHub may store:

- Entity metadata.
- Source references.
- Address format rules.
- Postal-code ranges and public administrative mappings.
- Redacted fixtures.
- Quality scores.
- Test vectors and conformance rules.

GitHub must not store:

- Raw personal addresses.
- Recipient names.
- Private delivery coordinates.
- Private keys, witnesses, nullifiers, proof secrets, or decrypted QR payloads.
- Bulk building polygons or massive search indexes.

## Output Files

Use these generated or curated outputs:

```text
data/global_entities/agid-global-entities.json
data/global_entities/agid-global-entity-sources.json
data/global_entities/agid-territory-claims.json
data/global_entities/agid-postal-model-classification.json
data/global_entities/agid-repository-placement.json
docs/product/global-country-territory-research-report.md
```

The app bundle should only load indexes and selected country packs. Heavy
geometry and search data should remain external and content-addressed.

## Verification Gates

Every global inventory update should pass:

- Schema validation.
- Duplicate code detection.
- Parent/child hierarchy validation.
- Source license validation.
- No raw address release scan.
- Claims-policy validation for disputed areas.
- Postal model classification coverage.
- Repository placement coverage.

## Immediate Next Step

Build a first `agid-global-entities.json` skeleton from existing AGID country,
territory, address-format, and region files. Then compare it against ISO 3166,
UN M49, Natural Earth Admin 0 map units, and project-specific disputed/polar/
maritime records.

## Repository Placement Generator

The first repository-placement seed is generated locally:

```bash
npm run generate:global-repo-placement
```

The generator reads the existing continent and region files, then writes:

```text
data/global_entities/agid-repository-placement.json
```

Current generator policy:

- Asia is first in rollout order.
- Europe, Africa, Americas, Oceania, and Antarctica follow.
- Caribbean and South America are merged into the Americas repository family.
- AM/AZ/GE are generated under Europe / Eastern Europe Caucasus, matching the
  AGID canonical Caucasus policy.
- Large countries such as CN, IN, ID, US, BR, RU, DE, and GB become country
  index repositories with child state/province/metro repositories.
- Antarctica is generated as a polar-area index with station, claim, and
  Southern Ocean child packs.

This is a seed manifest, not a claim of complete public release readiness. Each
generated placement still needs source-license review, no-raw-address scanning,
and country/territory maintainer review before a GitHub repository is created.
