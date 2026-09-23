# Address DNS Record Format

Address DNS is a DNS-like public resolution layer for AGID/AOID systems. It does not publish raw addresses, raw AGIDs, raw AOIDs, precise coordinates, recipient identity, phone numbers, or room-level private data. It publishes only public names, commitments, roots, issuer identifiers, service endpoints, and integrity hashes.

The canonical implementation is `address-dns-record-v1` in `src/lib/addressDnsRecord.ts`.

## Purpose

Address DNS answers questions such as:

- Which public commitment represents this address reference?
- Which issuer, freshness root, or revocation root should a verifier check?
- Which public service endpoint should a resolver call?
- Which zone snapshot root should be audited?

It must not answer:

- What is the actual street address?
- What is the exact AGID or AOID?
- Who is the recipient?
- What are the precise coordinates?

## Canonical Record

```json
{
  "version": "address-dns-record-v1",
  "recordId": "ADNS-517669861C1D15040782F8BE",
  "recordHash": "517669861c1d15040782f8be3b45c14ab766c06e92485f6ea978c3eb6bf93459",
  "commitmentAlgorithm": "sha256-address-dns-record-v1",
  "ownerName": "pickup.store.example.agid",
  "zone": "example.agid",
  "type": "ADR",
  "class": "AGID",
  "targetKind": "address-reference-commitment",
  "target": {
    "addressReferenceCommitment": "0xaddressref"
  },
  "ttlSeconds": 300,
  "issuerId": "issuer-example",
  "freshnessRoot": "0xfresh",
  "revocationRoot": "0xrevoke",
  "scope": "delivery",
  "issuedAt": "2026-06-17T00:00:00.000Z",
  "expiresAt": "2026-06-17T00:10:00.000Z",
  "privacy": {
    "rawAddressStored": false,
    "rawAgidStored": false,
    "rawAoidStored": false,
    "rawCoordinatesStored": false,
    "recipientIdentityStored": false
  }
}
```

## Record Types

| Type | Meaning |
| --- | --- |
| `ADR` | Public address-reference commitment or AMT envelope pointer. |
| `AGIDREF` | Public commitment to an AGID, not the raw AGID. |
| `AOIDREF` | Public commitment to an AOID, not the raw AOID. |
| `PID` | Public PID or PID commitment. Prefer commitments in privacy-sensitive contexts. |
| `SRV` | HTTPS or `/.well-known/` resolver/service endpoint. |
| `TXT` | Public metadata hash. |
| `POLICY` | Public policy hash for resolver behavior. |

## Target Kinds

| Target kind | Required target field |
| --- | --- |
| `address-reference-commitment` | `addressReferenceCommitment` |
| `agid-commitment` | `agidCommitment` |
| `aoid-commitment` | `aoidCommitment` |
| `pid` | `pid` |
| `pid-commitment` | `pidCommitment` |
| `amn-envelope` | `amnEnvelopeId` |
| `service-endpoint` | `serviceEndpoint` |
| `policy` | `policyHash` |

## Zone Line

The compact DNS-like representation is:

```text
<ownerName> <ttl> IN ADNS <version> <type> <class> <targetKind> id=<recordId> hash=<recordHash> target=<public-target> issuer=<issuerId> freshness=<root> revocation=<root> exp=<iso-time>
```

Example:

```text
pickup.store.example.agid 300 IN ADNS address-dns-record-v1 ADR AGID address-reference-commitment id=ADNS-517669861C1D15040782F8BE hash=517669861c1d15040782f8be3b45c14ab766c06e92485f6ea978c3eb6bf93459 target=0xaddressref issuer=issuer-example freshness=0xfresh revocation=0xrevoke exp=2026-06-17T00:10:00.000Z
```

## Validation Rules

An Address DNS resolver should reject a record when:

- `ownerName` or `zone` is not DNS-compatible.
- The canonical `recordHash` does not match the record payload.
- The `recordId` is not derived from the canonical `recordHash`.
- The required target field for `targetKind` is missing.
- A service endpoint is neither HTTPS nor a `/.well-known/` relative endpoint.
- The record has expired.
- Required freshness, revocation, or signature metadata is absent for the selected trust mode.
- Raw address, raw AGID, raw AOID, coordinates, recipient identity, phone, email, room, or unit data is present.

For high-risk contexts such as humanitarian aid, domestic violence protection, refugee support, or censored environments, the TTL should be at most 900 seconds and the record should include freshness and revocation roots.

## Snapshot Root

A zone snapshot is the stable hash of:

```json
{
  "version": "address-dns-record-v1",
  "zone": "example.agid",
  "recordHashes": ["..."]
}
```

The snapshot root lets a resolver or registry publish an auditable Address DNS state without publishing raw addresses or exact locations.
