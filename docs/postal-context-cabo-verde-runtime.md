# Cabo Verde Postal Context runtime

Status: M1_metadata. This release contains contracts, source policy, synthetic fixtures and runtime tests. It contains no current Correios assignment rows, real addresses, CIP accounts, personal data, production polygons, IDE-CV datasets, cadastral records, parcel features or buildings.

The 2026-09-03 evidence audit and real-app result are recorded in [the country M2 review](postal-context-cabo-verde-m2.md). That review confirms the current four-digit system but keeps M2 blocked because no complete rights-cleared assignment denominator or postal Polygon/MultiPolygon artifact was identified.

## Evidence flow

`four-digit postcode text -> pinned Correios assignment observation -> official surface or no canonical geometry -> island/municipality/parish/locality context -> permitted CIP or civic address -> explicit address-linked building or parcel -> CV AGID cell`

The [Correios FAQ](https://correios.cv/faq) describes a four-digit postcode followed by the locality or zone. The dated [UPU Cabo Verde sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/CPVEn.pdf) describes island, commune, commune-district and post-office digit positions, while the [UPU August 2026 length table](https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf) lists Cabo Verde as four digits. These facts establish format context, not a current complete assignment database.

## Postcode, extended contact identifier and CIP

The Correios [contact page](https://www.correios.cv/contactos) publishes `NNNN-NNN` branch values under a postal-code label. Separately, the [CIP portal](https://www.correios.cv/cip) describes a numeric identifier for a person or company that becomes its postal domicile and is associated with a georeference. No public operator schema found here explicitly maps the four-digit postcode, the branch contact value and CIP into one identifier.

AGID therefore stores them as separate typed objects. The postcode normalizer accepts only four digits. It never appends a suffix, strips a contact value to four digits, guesses a CIP or exposes authenticated CIP data as a public postcode.

## Address, geometry and building gates

The [IDE-CV platform](https://ingt.gov.cv/ingt/Servi%C3%A7os/idecv/) provides metadata, viewers and geoservices. The official [administrative FeatureServer](https://ingtgeo.gov.cv/arcgisingt/rest/services/SDI/Divisao_Administrativa_CaboVerde/FeatureServer) describes 2010 cartography at 1:5000 for islands, municipalities, parishes, zones, cities, towns, places and neighbourhoods. These are administrative and toponymic layers, not postcode polygons.

No rights-cleared nationwide official postcode polygon release is bundled or identified. Administrative boundaries, cadastral parcels, CIP georeferences, branch points, buffers, Voronoi cells, routes and learned surfaces do not become official postal geometry.

An exact building is returned only when a permitted artifact supplies a stable explicit CIP-to-address-to-building or cadastral relation. Postcode, extended identifier syntax, CIP syntax, address text, coordinate containment, polygon overlap, nearest building and model score produce candidates only. The runtime fixture demonstrates this gate with synthetic evidence and cannot be promoted.

## Realtime generation, mathematical models and compression

Realtime lookup can improve freshness for a minimized permitted observation when purpose, terms, selected fields, observed time, source version and request-response digests are retained. Timeout, empty output or blocked access is unknown. A model can normalize, index, detect drift, prioritize review and generate an uncertainty-bearing review surface. Geometry simplification, quantization, PMTiles and bounded-error compression are allowed for permitted data, but modified surfaces remain derived and non-canonical.

## Rights, privacy, Hugging Face and Cloudflare

Correios pages carry an all-rights-reserved notice. UPU publication access does not grant database republication. IDE-CV catalog visibility and ArcGIS Query access do not grant blanket reuse; every resource needs its exact owner, licence, access class, version, CRS and digests. OSM remains in a separate attributed ODbL partition.

CIP can identify a person or company postal domicile and connect it with a georeference. CIP, account, precise address, parcel, owner, title and query-log data remain private, purpose-limited and access-controlled unless an exact lawful publication basis exists.

Only rights-cleared, versioned Parquet, GeoParquet or PMTiles shards may be stored on Hugging Face, with a pinned Hub commit and verified digests. Cloudflare Workers can serve metadata and permitted indexes, while R2 can hold immutable permitted shards. Restricted records remain gated or external. AGID remains an independent spatial index and is never relabelled as canonical Cabo Verde postal or administrative geometry.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_CV_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_CV_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_CV_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_CV_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=CV` or `/api/postal/CV/{postcode}`. Geometry is opt-in and retains official-versus-derived provenance.
