# Place Search Language Design

Last updated: 2026-06-03

AGID place search uses a search-only language layer. This layer improves geocoder recall for place names written in many scripts, but it does not change the app UI language and does not change address-language tabs.

## Separation

| Layer | Purpose | Source |
| --- | --- | --- |
| Place search language | Find a place name in as many languages/scripts as possible | Search query text |
| App language | Render menus, labels, help, and settings | App setting |
| Address language | Render an address for a country, domestic use, or international shipping | Address format and address tab policy |

Place search language is temporary provider context. It is not a user preference, not saved as an address field, and not used to decide which address tabs exist.

## Provider Behavior

Search builds a `PlaceSearchLanguageProfile` from the query:

- detects scripts such as Latin, Han, Kana, Hangul, Cyrillic, Arabic, Devanagari, Thai, Greek, and others,
- creates query variants using native text, known aliases, romanized/English aliases, typo repair, and accent folding,
- sends `accept_language` to OSM/Nominatim search as a search-only provider hint,
- retries Photon route-search suggestions with expanded query variants when the original query returns no features.

## Boundary

The search layer can influence:

- provider language hints,
- query expansion,
- result ranking,
- local `name:*` matching.

The search layer must not influence:

- app UI language,
- address-language tab availability,
- AOID private address contents,
- stored registered-address language preferences.
