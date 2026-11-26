# AGID CLI

AGID CLI is the local command-line interface for public AGID operations. It is
intended for SDK checks, fixtures, documentation examples, CI validation,
operator debugging, and offline field testing.

The CLI is local-first and no-raw-address by default. It does not print address
bodies, AOID bodies, proof witnesses, proof codes, private recipient material, or
AGID-S plaintext.

## Run

From the repository:

```bash
npm run agid -- help
```

The development wrapper also works after dependencies are installed:

```bash
node bin/agid.mjs help
```

## Commands

### Encode

```bash
npm run agid -- encode --lat <latitude> --lon <longitude>
```

JSON output:

```bash
npm run agid -- encode --lat <latitude> --lon <longitude> --json --pretty
```

The default output is the 12-character ID. Select the 16-character
checksummed form with `--id-length 16` on `encode` or `batch encode`.

```bash
npm run agid -- encode --lat 35.681236 --lon 139.767125 --id-length 16 --json
```

The CLI accepts either width for decoding, validation, polygon output, and
local resolution. The 16-character form also accepts four groups of four
characters, such as `JP05-AV8T-JGHD-1MEQ`. The first 12 characters address
the same cell, and the final four carry a version and typing-error check.

### Decode

```bash
npm run agid -- decode <AGID> --json
```

### Geography

Assess a manually placed pin, a device fix with a reported accuracy in metres, or the complete cell of an issued ID.

```bash
npm run agid -- geography --lat -16.85 --lon 179.98 --json
npm run agid -- geography --lat 22.533333 --lon 114.0 --accuracy-meters 25 --json
npm run agid -- geography P304K5APK9JT124R --json
```

The result includes the footprint, map sources, surface and candidate administrative codes. `needs-confirmation` indicates that the footprint or evidence leaves a choice unresolved. `unassessed` means that the bundled detailed sources do not establish a result for that input. `deliveryRegion` is always null. Retain the recipient’s postal destination independently.

The optional `island` field reports a mapped address territory and, when known, its sovereign. Shared islands are evaluated at the pin. A Japanese-territorial-view result lists only JP, with the geographic group and official source. Other reviewed disputes use distinct claimant and administration fields. If the island is mapped but attribution is missing, `island.status` is `unresolved`; the result keeps the country list empty. See the [global island coverage](island-recognition.md) and [full-resolution lookup](high-resolution-island-pack.md).

### Validate

```bash
npm run agid -- validate <AGID> --json
```

### Resolve

Resolve a public AGID or coordinate pair locally:

```bash
npm run agid -- resolve <AGID> --json
npm run agid -- resolve "<latitude>,<longitude>" --json
```

The resolve summary intentionally omits raw address and AOID fields. It returns
status, input kind, public AGID summary, coordinates, safe actions, warnings,
and audit steps.

### Polygon

```bash
npm run agid -- polygon <AGID> --geojson --pretty
```

This prints the AGID cell as a GeoJSON feature.

### Batch

Batch mode reads JSONL or CSV and processes many `encode`, `decode`, or
`validate` records with one command.

JSONL encode input:

```jsonl
{"id":"sample-land","lat":"<latitude>","lon":"<longitude>"}
{"id":"sample-water","lat":"<latitude>","lon":"<longitude>"}
```

Run:

```bash
npm run agid -- batch encode --file sample.jsonl --input-format jsonl --json
```

CSV validate input:

```csv
row,agid
sample-1,<AGID>
sample-2,NOT_AN_AGID
```

Run:

```bash
npm run agid -- batch validate --file sample.csv --input-format csv --json
```

The batch JSON output contains `schemaVersion`, `cliVersion`, `command`,
`operation`, `inputFormat`, `total`, `ok`, `failed`, and per-record `results`.
Each record result also carries the same CLI schema fields so downstream tools
can consume partial success safely.

### Conformance

Run the local Resolver Conformance Tests and Address Test Vector Suite from the
CLI:

```bash
npm run agid -- conformance --json --pretty
npm run agid -- conformance --suite resolver --json
npm run agid -- conformance --suite address --json
```

This command is intended for SDK authors, package maintainers, and CI jobs. It
does not require a running server.

## Output Schema

JSON and GeoJSON outputs include:

```json
{
  "schemaVersion": "agid-cli-output-v0.1",
  "cliVersion": "agid-cli-v0.1",
  "command": "encode"
}
```

The schema version is intentionally independent from app or API versions. New
fields may be added, but existing public fields should remain stable within the
same schema version.

The `geography`, `encode`, `decode` and `polygon` commands can include `territorialTopology`.
Its `landform` describes the physical surface as mainland, island, or unknown. Its optional
`administration` describes the mapped enclave, counter-enclave, coastal exclave,
exclave, or enclaved state. A pin on Likoma Island can carry both an island landform
and a Malawian enclave. `sharedIslandCountryCodes` describes the whole island;
`regionCandidates` in a geography assessment describes the queried footprint.
Encoding uses the supplied pin. Decoding or inspecting a polygon assesses the whole
cell, which can cross a border even if the original pin was on one side.
[Coverage, uncertainty and sources](island-recognition.md)

## CI

```bash
npm run verify:agid-cli
```

## Privacy Boundary

Safe CLI outputs include:

- public AGID
- region name and code
- public cell center and bounds
- cell polygon
- resolver status
- local audit steps
- public action hints

Forbidden CLI outputs include:

- raw address body
- raw AOID body
- AGID-S plaintext
- production AGID-S ciphertext examples
- proof witness
- proof code
- private key or device secret
- recipient identity fields
- room or access details

[European and overseas frontier queries](europe-frontier-atlas.md)
