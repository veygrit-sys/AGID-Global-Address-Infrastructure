# Australia Postal Context runtime contract

Status: `M1 metadata and synthetic runtime conformance`

Australia joins AGID as a delivery-network-first country pack. The four-digit
postcode is preserved as a string, including leading zeroes. A syntactically
valid code does not prove a current Australia Post allocation, and no generic
postcode-to-polygon rule is safe for every delivery category.

## Authority layers

| Layer | Primary evidence | Runtime claim ceiling |
| --- | --- | --- |
| Postcode allocation and delivery class | Australia Post postcode data | Code, locality/state relation and delivery category; no polygon unless separately supplied |
| Postal address and DPID | Australia Post PAF or permitted validation receipt | Postal assignment/validation under contract; no building footprint |
| Public civic address | G-NAF | Address identity, lifecycle and point; no mail deliverability from G-NAF alone |
| Postal display surface | ABS ASGS Postal Area or a reviewed derived surface | Official-derived statistical approximation or derived geometry, never an Australia Post boundary |
| Administrative context | ABS ASGS and source-backed locality relations | State/territory, LGA and statistical context; cannot create or clip postcode assignment |
| Building | Licensed Geoscape Buildings | Exact building only through `building_address` or reviewed explicit crosswalk |
| Spatial index | AGID cover | Candidate selection and cache key only; final decision returns to source geometry |

Australia Post PAF is a licensed, monthly reference sourced from its address
systems. It can include physical and postal delivery records and stable postal
identifiers. Its rows are not bundled in this repository.

G-NAF is an open national address index with address points and stable
identifiers. Its EULA requires a permitted secondary source before using each
address to compile mail, and its postcode values may be based on locality-level
allocation. Therefore `G-NAF point -> postcode` supports address context but
does not independently prove Australia Post assignment or deliverability.

ABS Postal Areas allocate Mesh Blocks to approximate postcodes. They exclude
many non-street-delivery codes and can cross state boundaries. Each POA artifact
must pin the ASGS edition and remain `official-derived` and `noncanonical`.
Edition 3 remains the declared source until the scheduled Edition 4 POA product
is published, licensed, inspected and qualified; the runtime never switches by
mutable `latest`.

## Building resolution

The public resolution path is:

```text
coordinate
  -> reviewed address point candidate
  -> address identity
  -> postcode assignment evidence
  -> locality / administrative context
  -> explicit building_address relationship
  -> building footprint
  -> AGID cover
```

Containment, nearest footprint, shared locality, parcel overlay or AGID-cell
coincidence can rank candidates but cannot establish an exact address-to-
building relationship. Building names are published only when the specific
field and product licence permit it and the value is not sensitive. Resident,
owner, recipient, customer and occupancy data never enter the public graph.

## Delivery exceptions

- Delivery Area records may use a separately classified POA or derived surface.
- PO Box, GPO Box and Locked Bag records are non-areal routing/facility records.
- Parcel Locker and Parcel Collect are delivery endpoints, not residences.
- Large-volume receivers and specialist codes are organisation/routing records.
- A postcode crossing a state line is retained; state geometry does not clip it.
- `CX`, `CC` and `NF` are separate ISO packs even when an upstream AU dataset contains them.

## Runtime and release boundary

`AGID_POSTAL_CONTEXT_AU_DESCRIPTOR_PATH` and its SHA-256 pin configure the
active release; the matching LKG pair supplies fail-closed rollback. Public
geometry is returned only when explicitly requested. Synthetic fixtures use a
reserved non-production `0000` code and never prove an actual allocation or
production readiness.

The M1 seed contains no raw upstream row, real address, production geometry,
personal data or credential. M2 requires rights-cleared pinned snapshots,
source-specific artifact partitions, deterministic transforms and quality
reports. M3 additionally requires independent postal/address and coordinate
holdouts, topology checks, ambiguity accounting, privacy review and correction
SLAs. M4 requires two clean refreshes plus monitored rollback.
