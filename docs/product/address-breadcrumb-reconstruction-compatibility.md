# Address Breadcrumb Reconstruction Compatibility

## Conclusion

Breadcrumb reconstruction is useful, but it is not universally optimal.

For AGID, a breadcrumb address should be treated as one canonical rendering of an
address graph, not as the address identity itself.

The safest model is:

```text
AGID cell / point / zone
  -> address graph node
  -> breadcrumb path
  -> locale and purpose renderer
```

This keeps AGID and conventional addresses compatible without claiming that every
place has one perfect administrative breadcrumb.

## Mathematical Model

Let:

- `G = (V, E)` be an address graph.
- `v in V` be the target address entity or delivery object.
- `B(v) = (v_0, ..., v_n)` be a parent path from a root country or territory
  node to `v`.
- `A` be an AGID spatial reference.
- `phi(A) -> P(V)` be the AGID-to-address-node relation.
- `rho(locale, purpose, B)` be a renderer that turns the breadcrumb into a
  human or machine address.

Breadcrumb reconstruction is optimal only when all of the following hold:

1. `B(v)` is a single acyclic path.
2. The path reaches the expected country or territory root.
3. `phi(A)` contains at least one node on `B(v)`.
4. The path contains the required components for the purpose, such as postal
   zone, municipality, street, building, or unit.
5. The renderer is sufficiently injective within the local delivery scope, so two
   different entities do not collapse to the same displayed address.
6. No stronger anchor, such as a reliable postal code, delivery zone, port,
   locker, or official building id, is required to avoid ambiguity.
7. There is no unresolved disputed, overlapping, or alternate parent claim.

If any of these conditions fail, the breadcrumb can still be compatible, but it
should not be called optimal.

## Decision Classes

| Decision | Meaning | Product behavior |
| --- | --- | --- |
| `optimal` | The breadcrumb is unique, complete, and AGID-compatible. | Render normally. |
| `compatible` | AGID and breadcrumb point to the same target, but another anchor is needed. | Render with fallback such as postal anchor, AGID primary, alias, or delivery-zone evidence. |
| `manual_required` | Single breadcrumb rendering would hide a claim conflict or missing evidence. | Require claim-policy rendering or human review. |
| `not_compatible` | The graph, AGID, country scope, or parent chain contradicts the target. | Do not issue a verified address result. |

## Why Breadcrumbs Are Not Always Optimal

The main counterexamples are:

- Countries where postal codes are stronger than street hierarchy.
- Places without street or building systems.
- Rural, desert, island, port, camp, sea, mountain, or temporary delivery points.
- Buildings with multiple entrances or multiple official names.
- Multilingual countries where the same path has multiple valid renderings.
- Disputed territories or overlapping administrative claims.
- Address systems where the delivery object is a locker, PUDO, berth, gate,
  campus, or POI rather than a residential parcel.

In these cases, AGID should preserve compatibility by adding evidence anchors,
not by forcing a false breadcrumb.

## AGID Compatibility Rule

AGID and address breadcrumbs are compatible when the AGID relation reaches the
same address graph chain:

```text
exists u in B(v) such that u in phi(A)
```

For product implementation, this means:

- the AGID must attach to at least one node in the reconstructed chain;
- the country or territory scope must not contradict the chain;
- every parent pointer must resolve;
- the chain must not contain cycles;
- disputed or alternate parentage must be rendered through an explicit claim
  policy, not hidden inside one normal breadcrumb.

## Implementation Hook

The executable compatibility guard lives in:

```text
src/lib/address/breadcrumbCompatibility.ts
```

It evaluates:

- `optimal`
- `compatible`
- `manual_required`
- `not_compatible`

and returns:

- `agidCompatible`
- `missingRequiredKinds`
- `requiredFallbacks`
- invariant results
- a confidence-like score

This makes the theory testable and keeps UI behavior consistent across Address
Registration, Postal Forge, country packs, disputed-region rendering, and
no-postal-code areas.
