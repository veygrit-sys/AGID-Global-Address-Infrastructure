# Japan: real-source, scoped M2 runtime experiment

## What is implemented

The Japan builder consumes the pinned Japan Post **ordinary UTF-8 assignment
file**, validates the national intake, and produces a deterministic Postal
Context graph and descriptor for explicitly selected JIS municipality codes.
It uses AGID's existing pinned loader, environment configuration and v1 API;
there is no separate demo-only address resolver.

The 2026-08-28 run validates 124,513 national source rows / 120,682 distinct
postcodes. Its first runtime scope is **Chiyoda, code 13101: 485 rows and 485
postcodes**. All 485 are checked against the source, without sampled success
being presented as complete testing. One fallback row stops at municipality;
54 ordinary and 430 qualified labels remain source postal context.

This is **not national runtime coverage, a live service, or a completed M2
country release**. Japan's repository manifest remains `M1_metadata` until
the approved external source snapshots/artifacts and rights evidence are
published and independently verified. `M2_experimental` in a generated
descriptor is a loader opt-in category, not proof of country completion.

## Source and address semantics

- [Japan Post UTF-8 ordinary postcode file](https://www.post.japanpost.jp/service/search/zipcode/download/utf-zip.html)
- [Field definitions and postcode-data reuse notice](https://www.post.japanpost.jp/service/search/zipcode/download/readme.html)
- [Pinned national intake report](../reports/postal-context-m2/jp-intake-2026-08-28.json)
- [Real-source runtime validation report](../reports/postal-context-m2/jp-chiyoda-runtime-2026-08-28.json)

The source is postal-operator assignment evidence, not geometry evidence.
Preserve the exact label, municipal reference, source row number, exception
classification and flags. The separate `assignments.jsonl` artifact retains
those fields; the runtime graph links source labels but is not an ABR town
crosswalk or a legal administrative-boundary dataset. A label containing a
building/floor name stays a qualified source label: it does not create a
verified building identity, civic number, entrance or unit relationship.

Fallback and no-town designators never become locality nodes. Multiple-town
assignments retain separate alternatives. A scope is rejected when one of
its postcodes also occurs outside the selected municipalities: expand the
selection rather than silently returning an incomplete set of alternatives.
The ordinary file does not include the separately published business-specific
assignment file.

There are **zero postal polygons, address points, building links or AGID
spatial covers**. Postal lookup returns context, while coordinate resolution
returns `no_match` / `none`. The resolve API may still return an independent
AGID coordinate cell with `canonicalPostalGeometry: false`. That cell is not
postal evidence. No proximity-based address inference is performed.

## Time is deliberately observation-only

Japan Post's row fields do not provide an effective date for every assignment.
The experimental release is evaluated only at its recorded observation:

```text
validAt   = 2026-08-28T00:58:13.580Z
validTime = [2026-08-28T00:58:13.580Z, 2026-08-28T00:58:13.581Z)
knownTime = [2026-08-28T00:58:13.580Z, infinity)
```

The one-millisecond interval is an explicit snapshot adapter for the existing
runtime contract, not an asserted real-world assignment lifetime. Omitting
`validAt` or requesting another instant will normally yield `no_match`.
Do not remove that restriction to advertise a live service. A future live
release needs an explicit refresh/effective-time policy and review.

## Generate and verify

Use an isolated AGID checkout and install the locked dependencies. Source
artifacts belong under ignored `.agid-runtime/` or an approved external data
directory, never AGID Git. Existing output directories and report files are
not overwritten. Use new names for a new run.

```text
npm run verify:postal-context-m2
npm run build:postal-context-jp-m2 -- --intake reports/postal-context-m2/jp-intake-2026-08-28.json --municipality 13101 --output .agid-runtime/jp-m2 --report reports/postal-context-m2/<new-run>.json
```

The online build verifies the official release date, reuse notice, exact
reference-page hashes, ZIP, CSV and normalized national-row hashes. If the
publisher updates any pinned source, stop and review a new intake; do not
silently switch versions. Offline replay uses a previously retained ZIP and
trusted intake receipt and does not claim a fresh terms review:

```text
npm run build:postal-context-jp-m2 -- --intake reports/postal-context-m2/jp-intake-2026-08-28.json --municipality 13101 --archive .agid-runtime/jp-m2/japan-post-utf-ken-all.zip --output .agid-runtime/jp-m2-replay --report .agid-runtime/jp-m2-replay-report.json
```

The builder tests the pinned loader and every selected postcode, unsupported
scope/time/knowledge, required experimental opt-in, descriptor and same-size
artifact tampering, actual `/api/v1/postal` HTTP lookup/resolve/intersection,
independent AGID behavior and private/no-store responses. Synthetic fixtures
test ambiguity, source exceptions and negative cases; they never substitute
for the separately reported real-source run.

Generated pack files are `descriptor.json`, `graph.json`, `geometry.json`,
`scope.json`, `source-evidence.json`, `assignments.jsonl`, the source ZIP and
the original intake receipt. The descriptor pins graph/geometry; the graph
manifest also pins the sidecars and source ZIP. The validation report contains
counts/hashes only. Preserve the source ZIP and receipt at an approved durable
location before claiming reproducibility after Japan Post updates its URL.

## Connect to AGID

Mount the complete reviewed pack outside the application repository. Configure
the descriptor path and the **exact digest from the validated report**:

```text
AGID_POSTAL_CONTEXT_JP_DESCRIPTOR_PATH=/mounted/jp/descriptor.json
AGID_POSTAL_CONTEXT_JP_DESCRIPTOR_DIGEST=sha256:<reviewed-descriptor-digest>
AGID_POSTAL_CONTEXT_ALLOW_EXPERIMENTAL=true
```

Do not enable `AGID_POSTAL_CONTEXT_ALLOW_SYNTHETIC` for this real-source pack.
This setting is for a controlled experiment, not production deployment approval.
For example, on the pinned observation only:

```text
GET /api/v1/postal/JP/102-0072?validAt=2026-08-28T00%3A58%3A13.580Z&geometry=geojson
```

The API's normalized Japanese display code has a hyphen; the source and graph
retain the seven-digit code as a string. No root `.env` or production settings
are changed by the builder.

## Publication gate and next step

The intended separate country repository is `veygrit-sys/agid-postal-jp`.
Creating that public repository requires user approval; no repository or
public data destination is created by this implementation. Do not add raw
source rows to `Address-Grid-ID` as a workaround. The short reuse notice in
source evidence covers postcode data only, not republication of the full
Japan Post website or independently licensed address/geometry sources.

After approval: publish the reviewed source snapshot, lineage/rights evidence
and immutable pack; retrieve the remote artifacts and verify every digest;
replay from the retained snapshot; then evaluate Japan's native experimental
M2 criterion. ABR links, geometry, house numbers, buildings, nationwide
partitioning and a live deployment remain distinct later work.
