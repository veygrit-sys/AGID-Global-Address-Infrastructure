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

### Decode

```bash
npm run agid -- decode <AGID> --json
```

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
