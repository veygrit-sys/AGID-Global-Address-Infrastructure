# Tanzania Postal Context runtime

Status: M1_metadata. This release contains contracts, source policy, synthetic fixtures and runtime/API tests. It contains no current nationwide TCRA assignment mirror, applicants, residents, real civic addresses, personal data, production polygons, NBS/OCGS boundaries, NaPA rows, parcels, owners, occupants or buildings.

## Evidence flow

\`five-digit text -> typed TCRA category -> current assigned object -> official geometry or no canonical polygon -> region/district/ward-or-shehia context -> explicit LGA/NaPA civic address -> explicit address-linked building -> independent TZ AGID cell\`

The [current TCRA lookup](https://www.tcra.go.tz/services/postcodes) exposes region, district, “postcode for” text and five-digit values. The [current guidebook catalog](https://tcra.go.tz/publications/guidebooks) lists the National Postcode Allocation Plan, July 2026. A permitted lookup result may validate a minimized dated observation; neither page is treated as an unrestricted bulk database or a geometry release.

## Categories and assignment status

The [TCRA National Addressing and Postcode service](https://address.tcra.go.tz/services/postcode) describes six mainland zones plus Zanzibar and five categories: administrative areas, post offices, big mailers, landmarks and temporary events. Only the administrative category is inherently associated with a ward delivery area. A landmark may be an area or point, while a post office, big mailer or time-limited event is not forced into a polygon.

The allocation plan distinguishes allocated, assigned and reserved values. AGID therefore validates syntax separately from current assignment, category and validity. A valid five-digit string is never promoted from its digits alone.

## Polygon gate

The [NBS 2022 ward/shehia metadata](https://microdata.nbs.go.tz/index.php/catalog/49) describes v0.1 polygon features in GCS Arc 1960 and warns that the data continue to improve. Its terms limit use to statistical/scientific research and prohibit redistribution or sale without written agreement. No NBS boundary is bundled.

An administrative postcode can receive a derived review surface only when all of the following are pinned:

1. current TCRA \`administrative_area\` assignment and validity;
2. exact ward or shehia stable identity and Mainland/Zanzibar custodian;
3. exact rights-cleared NBS or OCGS boundary edition and written redistribution permission;
4. CRS/axis order/transformation, input and output digests, topology, exclusions and uncertainty.

Only geometry explicitly authorized by TCRA for the same assignment and time can be canonical. Ward-name matching, centroids, buffers, Voronoi cells, routes, OSM and model output stay derived.

## Address and building display

TCRA address guidance separates house number, street, locality, postcode, ward, district and region. P.O. Box is a separate delivery object. LGAs allocate and register residential addresses and house numbers, and NaPA supplies the national physical-addressing system context. Exact building display requires a stable rights-cleared LGA/NaPA address identifier and an explicit authoritative address-to-building relation. Postcode containment, ward containment, nearest footprint, parcel overlap or a model score cannot create that link.

The [2018 Postal Regulations](https://www.tcra.go.tz/download/sw-1619086897-The%20Electronic%20and%20Postal%20Communications%20%28Postal%29%20Regulations%2C%202018.pdf) place the national address database and address/postcode map under TCRA and make TCRA the sole disseminator of address files. Public postcode lookup is not an address-file redistribution licence.

## Realtime generation, models and compression

Realtime TCRA lookup can improve freshness only for a minimized permitted observation with purpose, category, selected fields, observed/effective time, response digest and cache policy. Models can normalize names, detect crosswalk drift, rank review candidates and generate uncertainty-bearing non-canonical surfaces. They cannot manufacture an official assignment, category, ward identity or building relation.

Rights-cleared polygons may be simplified, quantized and packaged as PMTiles after topology and maximum-error tests. The compressed artifact retains source rights, edition, transformation chain and digest; compression never upgrades authority.

## Privacy, Cloudflare and Hugging Face

The [Personal Data Protection Act](https://www.pdpc.go.tz/media/media/THE_PERSONAL_DATA_PROTECTION_ACT.pdf) treats address information as personal data. The [PDPC March 2026 notice](https://www.pdpc.go.tz/media/media/PUBLIC_NOTICE_MARCH_2026.pdf) states that full enforcement began on 9 April 2026. Cloudflare and Hugging Face may hold only rights-cleared non-personal immutable artifacts. Precise addresses, residents, owners, occupants, deliveries, credentials and sensitive queries remain in approved controlled infrastructure under a lawful purpose. AGID stays an independent spatial index.
