# Phase 5: Federated Resolver

The Federated Resolver lets AGID/AOID software resolve address references without trusting a single central server. It queries multiple privacy-safe resolver sources, checks their freshness and payload safety, and forms a consensus result.

The canonical implementation is `agid-federated-resolver-v1` in `src/lib/federatedResolver.ts`.

## Architecture

```text
mixed private/local payload
  -> Phase 4 public/private separation
  -> public federated request
  -> resolver source A
  -> resolver source B
  -> resolver source C
  -> source validation
  -> weighted consensus
  -> resolved / partial / conflict / unresolved / blocked
```

The resolver never sends raw street addresses, raw AOIDs, precise coordinates, recipient identity, room numbers, phone numbers, or high-risk raw AGIDs to federation sources.

## Source Types

Supported source kinds:

- `local-cache`
- `address-dns`
- `registry-api`
- `partner-resolver`
- `official-source`
- `manual-review`

Each source has:

- `sourceId`
- `sourceKind`
- `trustScore`
- optional timeout
- `resolve(request)` function

The request contains only:

- public payload
- commitments
- domain
- query id
- separation audit fingerprint

## Consensus

The resolver groups source results by target key. A target key may be:

- address-reference commitment
- AGID commitment
- AOID commitment
- PID or PID commitment
- Address DNS record target

Consensus considers:

- agreement count
- source trust score
- source confidence
- quorum
- timeout or error state
- stale/expired result
- Address DNS record validation
- public payload leakage check

## Result States

| State | Meaning |
| --- | --- |
| `resolved` | quorum met, confidence high, no meaningful conflict |
| `partial` | some evidence exists, but quorum/confidence/conflict conditions require review |
| `conflict` | trusted sources disagree with comparable strength |
| `unresolved` | no usable public source result |
| `blocked` | request could not be sent because public/private separation failed |

## Privacy Gate

The Federated Resolver always runs Phase 4 first:

```text
separatePublicPrivatePayload(...)
validatePublicPayloadSeparation(publicPayload)
```

If a source response leaks private material, that source is marked `error` and excluded from consensus.

## Operational Guidance

Use `resolved` for normal automated workflows. Use `partial` for POS operator review. Use `conflict` for registry dispute handling. Use `unresolved` when more evidence is needed. Use `blocked` as a hard privacy stop.

In high-risk contexts, combine this phase with:

- short TTLs
- Address DNS freshness roots
- revocation roots
- AGID-S instead of raw AGID
- local/private storage for precise address material
- manual review for conflicting sources
