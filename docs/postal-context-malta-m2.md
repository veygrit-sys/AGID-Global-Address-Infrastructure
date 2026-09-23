# Malta Postal Context M2 review

Observed: 2026-08-30T19:32:32.164Z

Base: 0fe21c7ee12b670aa4a44fa5a95fa7cd323115f6

Outcome: blocked at M1; M2 is not achieved

## Executive summary

MaltaPost's current public finder is useful, current assignment evidence, but
it is not a postcode-area publication. Its deployed bundle exposes a version
v1 API with a 50-result search limit. Anonymous audit requests returned 89
towns, 116 Il-Ħamrun streets and three address records for the operator's
published HMR 2042 example. The response contract contains address components
and postCode, but no geometry field, coordinates, Polygon or MultiPolygon.

The current OAR locality register contains 85 data rows and four columns:
locality, local council and Maltese/English region names. It contains neither a
postcode nor geometry column. OAR street/locality identity, Planning Authority
buildings, statistical/administrative geography and any cadastral context are
separate authorities; none may substitute for MaltaPost postal membership.

MaltaPost's website rights text permits unaltered reproduction only for
personal, non-commercial use or internal circulation. This review found no
dataset-specific permission for AGID bulk processing, derivation, public
serving or redistribution. The Government catalogue endpoints returned HTTP
403 during the run; that is recorded as availability failure, not proof of
dataset nonexistence.

The country therefore remains blocked. No real MT area artifact exists to load
through the API or display as a fitted translucent map area, and no browser E2E
claim is made.

## Country-specific M2 gate

M2_current_malta_postcode_area_visualization requires all of the following:

1. A current, complete and rights-cleared MaltaPost AAA NNNN assignment
   denominator covering ordinary address ranges and delivery groups plus P.O.
   boxes, poste restante, organizations, facilities, special/non-geographic
   endpoints and historical/transition classes.
2. Real postcode Polygon/MultiPolygon geometry from an authoritative release,
   or a derived surface based only on an expressly authorized complete current
   postcode-membership denominator, with noncanonical status and limitations
   preserved.
3. Pinned edition or retrieval basis, effective date, terms, attribution, byte
   length, SHA-256, coverage, exceptions, reproducible transformation and an
   approved immutable artifact.
4. The real MT API/application path: normalize AAA NNNN, validate geometry,
   fit the map, render a translucent fill and clear outline, and display
   selected code, geometry kind, official/derived/virtual classification,
   source, reference date and confidence.
5. Explicit loading, no-match, multiple-result, API-failure and invalid-
   geometry states, plus clear and re-search behavior.

Finder address rows, prefixes, OAR localities/streets, address points, building
footprints, administrative/statistical/cadastral areas, buffers, hulls,
Voronoi/raster cells and synthetic fixtures are prohibited M2 substitutes.

## Reproducible evidence

Run:

    node scripts/inspect-postal-context-mt-sources.mjs --source-dir <temporary-source-directory>

The inspector byte/SHA-256 binds twelve current official bodies, confirms the
deployed API base/version/maxResult and six endpoint names, profiles the current
town/street/example-search arrays, parses the OAR locality table and counts
geometry/postcode tokens. Raw official pages and API responses remain outside
Git.

| Evidence | Current result | M2 meaning |
| --- | ---: | --- |
| MaltaPost towns | 89 unique IDs | lookup vocabulary, not areas |
| Il-Ħamrun streets | 116 unique IDs | street lookup, not postal membership polygons |
| HMR 2042 sample | 3 records / 1 code | individual assignment evidence only |
| Finder/API Polygon or MultiPolygon | 0 | no operator area |
| OAR locality rows | 85 | non-postal context |
| OAR postcode/geometry columns | 0 / 0 | cannot derive postal areas |
| Rights-cleared derived areas | 0 | no eligible derivation basis |
| Production-eligible records | 0 | no MT M2 artifact |

The exact body list and hashes are recorded in
reports/postal-context-m2/mt-source-review-2026-08-30.json. The HMR 2042 raw
response was used only for a field/count audit; address values are neither
reported nor committed.

## Data-quality assessment

- Completeness: critical failure. A three-record example and town/street
  vocabularies do not document the national ordinary-plus-exception
  denominator.
- Validity: the sampled code is canonical AAA NNNN, but there is no polygon on
  which closure, topology, coordinate range or territory checks can run.
- Timeliness: the interfaces were current at the observation time, but the app
  is unversioned; only its internal API contract reports v1.
- Uniqueness: the sampled town and Il-Ħamrun street identifiers were unique.
  This does not establish national postcode coverage.
- Integrity: postal assignment, address/location identity, buildings,
  administration/statistics/cadastre and AGID containment remain separate.

## Rights and authority boundary

The audit used anonymous public GET requests only. It did not register,
authenticate, contact a provider, accept terms or a contract, pay, query
protected address/building/cadastral/land rows, create a repository or
publication destination, publish or deploy.

The observed website copyright permission does not authorize the intended AGID
public-serving workflow. This is a conservative engineering gate, not a legal
opinion. Dataset-specific permission or a separately open licensed release is
required before processing or publication.

## Application status

The shared AGID path already rejects non-Polygon/MultiPolygon data and its tests
cover translucent fill, visible outline, fitting, clearing, re-search and error
states. Those shared capabilities do not prove Malta.

For MT:

- real country runtime: not verified;
- real postal API geometry: not verified;
- real map fit and translucent area: not verified;
- browser E2E: not run because no eligible real area exists.

Rendering OAR localities, address responses, building footprints or generated
proxy cells would manufacture postal meaning, so no browser scene was staged.

## Blocker and next check

M2 can resume only after an unrestricted current authoritative MaltaPost
boundary release appears, or after an expressly authorized complete current
membership denominator and approved derivation basis are obtained. The future
artifact must preserve non-area endpoints and pass real MT normalization,
loader, API, geometry validity, map fit, translucent fill, outline, provenance,
clear and re-search checks.

Do not retry before 2026-09-06T19:32:32.164Z while pending countries remain,
unless an unrestricted current release appears. Provider contact, registration,
authentication, contract/terms acceptance, payment, a new destination,
publication or deployment requires explicit approval.

No chart is included: the exact audit table communicates the decisive zero-area,
rights and denominator result more accurately.
