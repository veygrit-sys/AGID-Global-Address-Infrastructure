# Open-source address stack

Last reviewed: 2026-09-24

AGID keeps address software, hosted services, and external datasets as separate
trust and license boundaries. A project appearing in this list does not make
its imported data redistributable and does not promote a source to official
postal evidence.

## Current stack

| Project | AGID role | Status | Software license | Data boundary |
| --- | --- | --- | --- | --- |
| [libpostal](https://github.com/openvenues/libpostal) | Offline multilingual address parsing and normalization through the loopback-only sidecar | Integrated, opt-in | MIT | Record model and training-data provenance separately |
| [Photon](https://github.com/komoot/photon) | Search-as-you-type and route place lookup; set 'AGID_PHOTON_SEARCH_URL' for a controlled self-hosted endpoint | Integrated | Apache-2.0 | OSM-derived indexes retain ODbL attribution and obligations |
| [Pelias](https://github.com/pelias/pelias) | Full self-hosted forward/reverse geocoder over multiple importers | Optional addition | MIT | Preserve the license and attribution of each imported source |
| [Overture Addresses](https://docs.overturemaps.org/guides/addresses/) | Versioned address-point corpus for validation and conflation | License-gated candidate | Dataset; source-specific terms | Pin release and source metadata; alpha address IDs are not AGID identifiers |

## Gap decision

The client already uses Photon-compatible search and AGID already has a local
libpostal gateway, so adding duplicate JavaScript packages would not improve
coverage. The remaining operational gap is a fully self-hosted geocoder that
can combine OSM, OpenAddresses, Who's On First, GeoNames, and controlled local
imports. Pelias is therefore registered as the recommended optional addition,
not enabled by default.

Overture Addresses is useful as a source corpus, but it remains an alpha theme
with source-specific licensing. AGID may reference it for evaluation only
until a source manifest records release version, attribution, redistribution
status, transformed fields, and confidence notes.

## Adoption gates

1. Keep raw addresses local by default; use loopback or explicitly configured
   self-hosted endpoints for private workflows.
2. Pin software and dataset versions independently.
3. Record attribution and license per imported source.
4. Run correction and provenance checks before promoting data.
5. Never reinterpret an upstream address identifier as a stable AGID.

The Photon endpoint policy accepts HTTPS services and loopback HTTP only. URL
credentials, fragments, and preconfigured query strings are rejected.
