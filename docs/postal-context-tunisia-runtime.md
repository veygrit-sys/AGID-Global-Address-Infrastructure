# Tunisia Postal Context runtime

Status: M1_metadata. This release contains contracts, source policy, synthetic fixtures and runtime/API tests. It contains no current nationwide La Poste assignment mirror, real addresses, personal data, production polygons, administrative boundaries, cadastral records, owners, occupants or buildings.

## Evidence flow

`four-digit text -> current La Poste assignment observation -> delivery office/centre/locality -> official geometry or no canonical polygon -> governorate/delegation/commune context -> explicit civic address -> explicit address-linked building -> independent TN AGID cell`

The [current La Poste Tunisienne search](https://www.poste.tn/codes.php) is queried by governorate, delegation and locality. A permitted result may validate a minimized dated assignment observation. The search UI is not treated as an unrestricted bulk API, complete reusable registry, delivery-catchment release or geometry source.

The [UPU Tunisia addressing sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/tunEn.pdf) is dated April 2014. It places four digits before the delivery office, delivery centre or locality and separates entrance, staircase, building and letter-box details. It supplies format semantics, not current assignments or public address rows.

## Polygon gate

No verified reusable nationwide La Poste postcode-polygon release is bundled. Post-office points, nearest-office selection, governorate or delegation boundaries, locality labels, buffers, Voronoi cells, routes, OSM features, model output and AGID cells are not official postcode polygons.

The national portal's [delegation GeoJSON resource](https://catalog.data.gov.tn/fr/dataset/a04051fe-0b5c-4ff1-bc7d-59dfc2732866/resource/01b6fc4a-e490-451c-b932-96e63b4aa7e6) was updated 11 March 2025 but says licence not specified, so it is metadata-only here. The [governorate GeoJSON resource](https://catalog.data.gov.tn/fr/dataset/49344be7-06aa-45f9-bc5d-4a1d37b42f06/resource/492e157e-a8a8-4741-b2e9-c059ddacfc93) states CC BY and was updated 7 March 2025; even after exact attribution and digest are pinned, it remains coarse administrative context.

An administrative boundary can become a derived review surface only after the current La Poste assignment, stable locality and administrative identities, exact rights-cleared boundary edition, CRS transformation, topology, exclusions, uncertainty and input/output digests are pinned. Only geometry explicitly authorized by La Poste for the same assignment and time can be canonical.

## Address and building display

UPU structure allows building-level components to be displayed, but it does not provide exact building records. Exact building resolution requires a stable rights-cleared civic-address identifier and an explicit authoritative address-to-building relation with validity and digest.

The [OTC cadastral geoportal](https://www.otc.nat.tn/geoportail) is a separate parcel/title domain. Parcel containment, an address string, nearest OSM footprint or model score may rank a review candidate but cannot create a building link or owner/occupant publication right. OSM stays in a separately attributed ODbL partition.

## Realtime generation, models and compression

Realtime La Poste lookup can improve freshness only for a minimized permitted observation with timeout, rate, provenance, selected fields, observed/effective time, response digest and cache policy. Models may normalize Arabic/French names, detect crosswalk drift and produce uncertainty-bearing non-canonical review surfaces. They cannot manufacture an official assignment, boundary, civic address or building relation.

Rights-cleared polygons may be simplified, quantized and packaged as PMTiles after topology and maximum-error tests. The compressed artifact retains source rights, edition, transformation chain, uncertainty and digest; compression never upgrades authority.

## Privacy, Cloudflare and Hugging Face

[Organic Law No. 2004-63](https://www.inpdp.tn/ressources/loi_2004.pdf) governs identifiable-person data and Articles 50-52 regulate foreign transfers. The [current La Poste charter](https://www.poste.tn/page.php?code_menu=155) identifies postal address and geolocation among controlled categories and describes minimisation, retention, security and foreign-transfer authorization.

Cloudflare and Hugging Face may hold only rights-cleared non-personal immutable artifacts. Precise private addresses, residents, owners, occupants, deliveries, credentials and sensitive queries remain in approved controlled infrastructure after applicable Tunisian legal and INPDP review. AGID stays an independent spatial index.
