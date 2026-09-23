# US State Repository Packs

This document records the local AGID repository packs for all 50 United States states.
Each pack can be promoted to a GitHub repository under `dawnportinfo-design` after
review. The packs are intentionally metadata-first: they provide geography and gazetteer
seeds without bundling raw address, USPS restricted, proof-secret, or recipient data.

## Summary

- Version: us-state-repository-pack-v0.1
- State repositories: 50
- Geodata seeds: 50
- Gazetteer place seeds: 273
- Output root: `data/open_geo_repositories/us-state-repositories`

## Repository List

- `agid-us-alabama` - Alabama (AL)
- `agid-us-alaska` - Alaska (AK)
- `agid-us-arizona` - Arizona (AZ)
- `agid-us-arkansas` - Arkansas (AR)
- `agid-us-california` - California (CA)
- `agid-us-colorado` - Colorado (CO)
- `agid-us-connecticut` - Connecticut (CT)
- `agid-us-delaware` - Delaware (DE)
- `agid-us-florida` - Florida (FL)
- `agid-us-georgia` - Georgia (GA)
- `agid-us-hawaii` - Hawaii (HI)
- `agid-us-idaho` - Idaho (ID)
- `agid-us-illinois` - Illinois (IL)
- `agid-us-indiana` - Indiana (IN)
- `agid-us-iowa` - Iowa (IA)
- `agid-us-kansas` - Kansas (KS)
- `agid-us-kentucky` - Kentucky (KY)
- `agid-us-louisiana` - Louisiana (LA)
- `agid-us-maine` - Maine (ME)
- `agid-us-maryland` - Maryland (MD)
- `agid-us-massachusetts` - Massachusetts (MA)
- `agid-us-michigan` - Michigan (MI)
- `agid-us-minnesota` - Minnesota (MN)
- `agid-us-mississippi` - Mississippi (MS)
- `agid-us-missouri` - Missouri (MO)
- `agid-us-montana` - Montana (MT)
- `agid-us-nebraska` - Nebraska (NE)
- `agid-us-nevada` - Nevada (NV)
- `agid-us-new-hampshire` - New Hampshire (NH)
- `agid-us-new-jersey` - New Jersey (NJ)
- `agid-us-new-mexico` - New Mexico (NM)
- `agid-us-new-york` - New York (NY)
- `agid-us-north-carolina` - North Carolina (NC)
- `agid-us-north-dakota` - North Dakota (ND)
- `agid-us-ohio` - Ohio (OH)
- `agid-us-oklahoma` - Oklahoma (OK)
- `agid-us-oregon` - Oregon (OR)
- `agid-us-pennsylvania` - Pennsylvania (PA)
- `agid-us-rhode-island` - Rhode Island (RI)
- `agid-us-south-carolina` - South Carolina (SC)
- `agid-us-south-dakota` - South Dakota (SD)
- `agid-us-tennessee` - Tennessee (TN)
- `agid-us-texas` - Texas (TX)
- `agid-us-utah` - Utah (UT)
- `agid-us-vermont` - Vermont (VT)
- `agid-us-virginia` - Virginia (VA)
- `agid-us-washington` - Washington (WA)
- `agid-us-west-virginia` - West Virginia (WV)
- `agid-us-wisconsin` - Wisconsin (WI)
- `agid-us-wyoming` - Wyoming (WY)

## Shared Source Policy

- us-census-tiger-line: U.S. Census Bureau TIGER/Line and TIGERweb geography products (metadata-link-only, public-government-review-current-terms)
- us-census-geocoder: U.S. Census Geocoding Services API (not-bundled, public-government-review-current-terms)
- usps-web-tools: USPS Addresses and ZIP lookup APIs (not-bundled, restricted-api-do-not-bundle)
- usgs-gnis: U.S. Geological Survey Geographic Names Information System (metadata-link-only, public-government-review-current-terms)
- openstreetmap: OpenStreetMap (metadata-link-only, open-license-review-required)

## Release Boundary

These packs are suitable as open-source state repository starters only after a human
review confirms current source terms. They are not complete address datasets and do not
claim deliverability, ZIP validity, legal boundary precision, or USPS delivery-point
coverage.
