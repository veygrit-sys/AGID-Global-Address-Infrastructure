# AGID Standard and Conformance

Last updated: 2026-07-26

AGID must be readable as an independent standard, not only as a web application. The application is one reference implementation. The standard surface is the set of artifacts that another team can use to implement AGID in an SDK, server, embedded device, GIS workflow, logistics tool, or offline application.

## Canonical Artifacts

| Artifact | Purpose |
| --- | --- |
| `sdk/agid-spec/agid-spec.json` | Normative, language-neutral definition of the AGID core: precision, projection assumptions, string format, public API names, and test-vector references. |
| `sdk/agid-spec/test-vectors.json` | Conformance vectors for `encode`, `decode`, and `cellBounds`. These vectors are the minimum parity gate for SDK distribution. |
| `sdk/agid-spec/README.md` | Human-readable explanation of what the spec includes and what remains outside the standard. |
| `src/lib/openApiSpec.ts` and `/api/v1/openapi.json` | OpenAPI 3.1 integration contract for server-backed AGID workflows. |
| `docs/data-licenses.md` | Data-license and attribution policy for open-source, government, postal, and geographic evidence layers. |
| `docs/agid-security.md` | Public-layer security policy for AGID format validation, QR boundaries, and open-source release integrity. |
| `docs/agid-address-neighborhood-and-subpremise-v0.1.md` | Eight-neighbor matching, public building identity, private sub-premise separation, and the synthetic regression benchmark. |

## Conformance Levels

### Core SDK Conformance

An SDK is core-conformant when it can pass the shared parity vectors for:

- `encode`
- `decode`
- `cellBounds`

`cellPolygon` is recommended for map/GIS clients, but `encode`, `decode`, and `cellBounds` are the formal parity minimum before release.

The neighborhood extension is conformant when it reports same, edge-adjacent,
corner-adjacent, separate, and invalid relations; crosses cubed-sphere face
boundaries by reprojection; and treats proximity only as an area candidate.
Existing SDKs remain core-conformant without this extension until neighborhood
vectors become part of the cross-language parity minimum.

### API Conformance

A server or hosted AGID deployment is API-conformant when:

- `/api/v1/openapi.json` exposes the current OpenAPI contract.
- Versioned routes live under `/api/v1`.
- Legacy `/api` paths are treated only as compatibility aliases.
- The OpenAPI document exposes the AGID standard extension metadata.

### Data Conformance

An address, postal, or geography source pack is data-conformant when:

- each source has a stable URL,
- each source has a source type or provider kind,
- each source has license or terms metadata,
- third-party data keeps its own attribution and licensing boundary,
- weak or unavailable source coverage is represented as lower confidence, not hidden certainty.

### App Conformance

The web app is conformant when it uses the standard artifacts rather than inventing incompatible behavior in UI code. UI details, theme choices, panels, and user flows are implementation details. They must not redefine the AGID core contract.

### Security Conformance

An AGID implementation is security-conformant when:

- it rejects non-canonical AGID strings,
- it rejects Base32 hash values outside the 45-bit packed AGID range,
- it rejects face values outside `0..5`,
- public AGID QR parsing re-sanitizes private fields,
- OpenAPI exposes `x-agid-security`,
- release artifacts publish checksums or detached signatures,
- private AOID contents are excluded from public data packs, SDK vectors, and examples.

## Standard Boundary

The AGID standard includes:

- deterministic coordinate-to-ID behavior,
- ID string format and prefix rules,
- decode behavior,
- cell bounds and recommended polygon shape,
- 21-bit-per-axis eight-neighbor cell relations,
- public `AGID + buildingId` reference semantics,
- public address, building, road, bridge, park, water, natural-feature, heritage, landmark, and place-evidence rules,
- SDK parity vectors,
- OpenAPI v1 integration contract,
- data-license policy for source-backed evidence.

The AGID standard does not include:

- private AOID recipient data,
- room, unit, floor, entrance, phone, private access, or delivery-instruction contents,
- UI layout or styling,
- uptime guarantees for external APIs,
- a promise that every postal authority or carrier can verify every result.

## Release Gate

Before a formal SDK, API, or data-pack release:

1. Update `sdk/agid-spec/agid-spec.json` if the core contract changes.
2. Update `sdk/agid-spec/test-vectors.json` when vector expectations change.
3. Run parity tests for generated SDKs.
4. Run `npm run verify:agid-address-matching` and `npm run benchmark:agid-address-normalization`.
5. Confirm `/api/v1/openapi.json` still describes the public integration surface.
6. Confirm source metadata includes URL, kind, and license or terms.
7. Run AGID security tests and confirm public QR payloads cannot reintroduce recipient, phone, unit, room, access, delivery, owner-key, device-key, or encrypted AOID fields.
8. Publish checksums or detached signatures for the spec, vectors, OpenAPI artifact, SDK packages, and public data packs.
9. Document any non-conforming or partial areas as confidence limitations.

## Relationship to AGID and AOID

AGID is the public location, address, building, and public map-feature layer. AOID is the private owner-controlled delivery layer. The standard governs AGID core behavior, public address/building/map-feature evidence, and public integration contracts. AOID data belongs to the owner and must remain outside public AGID source packs and public parity vectors.
