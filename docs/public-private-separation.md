# Phase 4: Public/Private Separation

Public/private separation is the boundary that prevents AGID/AOID applications from accidentally turning a privacy-preserving address system into a raw address publication system.

The canonical implementation is `public-private-separation-v1` in `src/lib/publicPrivateSeparation.ts`.

## Front-Door Defaults

Public/private separation exists to enforce three project-level defaults:

- **Ethereum optional:** public/private separation runs before any Ethereum, registry, ZK, webhook, Address DNS, or OpenAPI export. A workflow remains valid even when no public ledger is used.
- **Local-first:** private address material can remain device-local without public commitments in `local-only` mode; public commitments become necessary only when data leaves the local/private boundary.
- **No raw address by default:** raw addresses, raw AOID, recipient details, proof codes, AGID-S payloads, and precise coordinates must not cross into public payloads by accident.

## Rule

Every payload that can leave the user's device must be split before export:

```text
mixed payload
  -> public payload
  -> private payload
  -> commitments
  -> audit fingerprint
```

The public payload may contain:

- commitments
- hashes
- Merkle or freshness roots
- revocation roots
- issuer identifiers
- scope
- zone names
- service endpoints
- policy metadata
- non-sensitive quality or status metadata

The private payload may contain:

- raw street address
- raw AOID
- recipient name
- phone number
- room, unit, floor, access notes
- precise coordinates
- AGID-S ciphertext
- secret material

Private payloads are device-local or encrypted-vault material. They are not Address DNS, registry, OpenAPI, event-stream, public QR, or Ethereum payloads.

## AGID Rule

AGID is public by design in ordinary map and local workflows, but it is not always safe to publish.

Raw AGID should be commitment-only in:

- Address DNS
- server registry
- Ethereum registry
- ZK public inputs
- public event streams
- high-risk humanitarian, domestic violence, refugee, or censored contexts

Raw AGID may be exposed only when the caller explicitly allows it for trusted local/private surfaces.

## Salt Rule

If private fields are committed into a public payload, a salt is required. Unsalted commitments are rejected because address and AGID spaces can be guessed or enumerated.

```text
commitment = H(version, domain, path, salt, value)
```

The `domain` is required for purpose separation, for example:

- `address-dns:delivery`
- `registry:freshness`
- `shipping:recipient`
- `aid:event-2026-06`

## Output

The separation result contains:

- `publicPayload`: safe export payload
- `privatePayload`: local/encrypted storage payload
- `commitments`: public references to private leaves
- `classification`: field-by-field sensitivity report
- `blocked`: true when export cannot proceed
- `errors`: hard failures such as missing salt
- `warnings`: secret-local-only or raw AGID exposure warnings
- `auditFingerprint`: safe fingerprint of the separation decision

## Minimum Export Checks

Before writing to a public registry, Address DNS, OpenAPI response, event stream, or public QR:

1. Run `separatePublicPrivatePayload`.
2. Require `blocked === false`.
3. Persist or transmit only `publicPayload`.
4. Store `privatePayload` only locally or encrypted.
5. Run `validatePublicPayloadSeparation` as a final guard.

This phase is intentionally independent from ZK and Ethereum. It is required even in local-only and server-only modes because most privacy failures happen before cryptography is involved.
