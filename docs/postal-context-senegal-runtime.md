# Senegal Postal Context runtime

Status: M1_metadata. This release contains contracts, source policy, synthetic fixtures and runtime tests. It contains no current nationwide La Poste assignment rows, subscriber or BP-holder records, real civic addresses, personal data, production polygons, BaseGeo datasets, NICAD parcels, owners, occupants or buildings.

## Evidence flow

`five-digit text -> pinned La Poste observation or unverified -> delivery post office -> official catchment or no canonical geometry -> administrative context -> permitted civic address -> explicit address-linked building or reviewed NICAD relation -> SN AGID cell`

The [current La Poste locator](https://www.laposte.sn/services/code-postal-senegal/) can support a minimized dated code and nearest-office observation when its terms permit. The [UPU Senegal sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/senFr.pdf) documents a five-digit format before the delivery-office name and geographic and BP address structure as of February 2015. Neither source is treated as a bulk reusable national assignment table or postal catchment release.

## Address, BP and assignment status

The [La Poste BP service](https://www.laposte.sn/services/boite-postale/) defines a nominative box at a chosen post office and explicitly separates postal reception from the home address. Subscriber, holder and key records remain private. The [ARTP 2015 workshop report](https://artp.sn/sites/default/files/documents/rapport_synthese_atelier_adressage_version_finale.pdf) documents historical numbering and addressing gaps and a need for a single national system; it is not current completion or assignment evidence.

## Geometry, NICAD and buildings

No rights-cleared nationwide official postcode catchment release is bundled or identified. Office points, nearest distance, routing digits, administration, buffers, Voronoi cells and models remain non-canonical.

[ANAT BaseGeo](https://www.geosenegal.gouv.sn/-base-de-donnees-geographiques-.html) exposes multi-scale topography and selected city building datasets under a [contractual data-use licence](https://www.geosenegal.gouv.sn/conditions-d-utilisation.html) requiring recorded acceptance, attribution and downstream terms, with special approval for commercial derived products and termination obligations. [DGID NICAD](https://www.dgid.sn/wp-content/uploads/2023/02/NICAD.pdf) is a 16-character parcel identifier, not a postcode or building identifier. Exact building display requires a stable rights-cleared authoritative civic-address relation or reviewed parcel-building crosswalk.

## Realtime generation, models and compression

Realtime lookup may improve freshness for a minimized permitted observation when purpose, selected fields, observed time, terms and request-response digests are retained. Models may normalize, index, detect drift, prioritize review and generate uncertainty-bearing review surfaces. Simplification, quantization and PMTiles remain derived and must preserve licence obligations and measured error bounds.

## Privacy, Hugging Face and Cloudflare

[Law No. 2008-12](https://www.archives.sn/docs/codes/loi-protection-donnees-a-caractere-personnel) governs collection, processing, transmission, storage and use of identifying personal data and conditions transfers to third countries. Cloudflare and Hugging Face may hold only rights-cleared non-personal immutable artifacts. Recipient, subscriber, precise address, household, BP holder, parcel-person, owner, occupant, delivery and query data remains gated and Senegal-hosted or transferred only under an approved lawful basis. AGID stays an independent spatial index.
