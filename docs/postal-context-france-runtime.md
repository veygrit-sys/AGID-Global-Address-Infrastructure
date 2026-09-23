# France Postal Context runtime

Status: `M2 runtime-ready / M1 France data`

AGID can load France independently alongside Japan, Singapore, the Netherlands,
and the United Kingdom. The FR policy adds five-digit normalization,
routing-locality-first semantics, derived postal surfaces, BAN address evidence,
BD TOPO building links, and synthetic conformance fixtures without copying the
shared resolver or API.

No nationwide production France pack is bundled. The lightweight contract is
in
[`data/postal_country_packs/fr/postal-context`](../data/postal_country_packs/fr/postal-context/README.md).

## 1. Postal code, commune, and address are different identities

AGID accepts five digits, applies NFKC, removes whitespace, and rejects hyphens.
`７５００１` becomes `75001`. Pattern validation does not prove that the code is
allocated, current, or deliverable.

La Poste's official open table provides the postal code, INSEE commune code,
commune name, delivery label, and optional line-five locality. It explicitly
does not provide postal-code boundaries. The canonical graph is therefore:

```text
five-digit postal code
  -> La Poste routing/locality assignment
  -> INSEE COG commune identity
  -> BAN public address point
  -> explicit BD TOPO address-to-building relation
```

One code can serve several communes and one commune can contain several codes.
Neither the first matching commune nor its centroid may select an address.

## 2. Independent authority layers

### La Poste

The Base officielle des codes postaux is the postal routing crosswalk. It is
published under Licence Ouverte 2.0. Commune contours or centroids distributed
with the product remain administrative context; they are not postal-code
geometry.

### Base Adresse Nationale

BAN is the address reference officially recognized by the French
administration. It stores address localizers as georeferenced points with
descriptive fields and identifiers and is available under Licence Ouverte.
Snapshots are preferred over live API receipts for reproducible releases. The
former `api-adresse.data.gouv.fr` service is deprecated in favor of the IGN
Géoplateforme geocoder, so runtime endpoints must be versioned instead of
hard-coded to the retired host.

### IGN BD TOPO

BD TOPO includes BAN address and address-link classes plus building geometry.
An explicit versioned link can raise a result to building level. A nearest
building match remains derived and cannot expose a building name as definitive.

### INSEE COG

COG supplies the annual administrative identity and history of communes,
departments, regions, delegated communes, and municipal arrondissements. It is
not postal assignment or address geometry.

Primary references:

- [La Poste official postal-code dataset](https://www.data.gouv.fr/datasets/base-officielle-des-codes-postaux)
- [BAN content and Licence Ouverte](https://adresse.data.gouv.fr/contenu-de-la-ban)
- [BAN governance and coverage](https://adresse.data.gouv.fr/decouvrir-la-BAN)
- [IGN Géoplateforme geocoder migration](https://adresse.data.gouv.fr/outils/api-doc/adresse)
- [IGN BD TOPO documentation](https://geoservices.ign.fr/documentation/donnees/vecteur/bdtopo)
- [INSEE Code officiel géographique](https://www.insee.fr/fr/information/2560452)
- [La Poste French addressing guide](https://www.laposte.fr/entreprise-collectivites/sites/default/files/tools-services/Guide_Courrier_Histo_FR_2026_HD_051225_0.pdf)

## 3. Mathematical generation and compression

For code `c`, let `A_c` be source-backed BAN address points. With a licensed clip
boundary `B`, a reproducible candidate surface is:

\[
R_c^{model} = B \cap \bigcup_{p \in A_c} V(p).
\]

This is useful for map lookup but remains `derived_geometry`. It must be tested
against held-out addresses and must retain holes, islands, split communes,
overlap, and temporal changes rather than silently forcing a complete planar
partition.

Preferred storage is:

1. La Poste code/locality/commune assignments and history.
2. COG identities and administrative crosswalks.
3. BAN address points, identifiers, position types, and certification.
4. BD TOPO explicit address-building links and footprints.
5. Optional versioned derived postal-code polygons.
6. AGID cell covers as candidate indexes, followed by original geometry checks.

## 4. CEDEX and special distribution

CEDEX, BP, CS, TSA, poste restante, and some organization codes are postal
routing constructs. A CEDEX code can resolve to an organization or public
facility only when independent address evidence exists; it never expands into
the surrounding neighborhood. Recipient, occupant, department, internal unit,
and delivery instructions remain outside public artifacts.

Upstream La Poste data may cover overseas territories and Monaco. An FR release
does not absorb those rows: each target is routed to its own ISO country pack.

## 5. Runtime and API

France has independent active and last-known-good pins:

```dotenv
AGID_POSTAL_CONTEXT_FR_DESCRIPTOR_PATH=C:\absolute\path\fr-descriptor.json
AGID_POSTAL_CONTEXT_FR_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
AGID_POSTAL_CONTEXT_FR_LKG_DESCRIPTOR_PATH=C:\absolute\path\fr-lkg-descriptor.json
AGID_POSTAL_CONTEXT_FR_LKG_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
```

The stable API accepts `countryCode: "FR"`:

```text
GET  /api/v1/postal/capabilities
GET  /api/v1/postal/releases/FR
POST /api/v1/postal/resolve
GET  /api/v1/postal/FR/75001
GET  /api/v1/postal/intersects?country=FR&bbox=...
```

Postal lookup omits geometry unless `geometry=geojson` is explicit. Returned
derived surfaces keep source and quality metadata and are never represented as
La Poste boundaries. Coordinate resolution reaches a building only through a
coherent address-point and explicit relationship path.

## 6. Remaining production work

The truthful capability is “France runtime and country contract ready;
nationwide production pack not complete.” The external `agid-postal-fr`
repository must still pin all source releases, build many-to-many crosswalks,
join BAN to BD TOPO without collapsing ambiguity, generate and evaluate derived
surfaces, handle CEDEX/special delivery and territory partitions, and pass
attribution, privacy, freshness, drift, rollback, and two-refresh gates.
