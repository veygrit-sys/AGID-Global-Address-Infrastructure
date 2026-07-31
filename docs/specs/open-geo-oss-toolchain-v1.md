# AGID Open Geo OSS Toolchain v1

This contract introduces a local, capability-gated integration boundary for
GDAL, PROJ, PostGIS, osm2pgsql, libpostal, and Cosign. It is not a source
promotion mechanism.

## Profiles

| Profile | Required local capability | Additional release gate |
| --- | --- | --- |
| `source-backed-terrain` | GDAL 3.13.0+, PROJ 9.0.0+, working `proj.db` | source ledger, CRS, vertical datum, checksum |
| `versioned-spatial-index` | caller-owned PostGIS and local osm2pgsql | dataset license, scope, version, correction path |
| `local-multilingual-parser` | loopback-only libpostal sidecar | parser output is advisory, never postal proof |
| `signed-artifact-release` | Cosign | TUF metadata, reviewer quorum, monotonic release ledger |

## Commands

```
npm run verify:open-geo-toolchain
npm run verify:open-geo-toolchain:terrain
```

The default command reports missing tools without failing. A required profile
fails closed. The command only invokes fixed version or CRS metadata probes and
does not read source assets, connect to a database, call a libpostal endpoint,
or handle address material.

## Privacy and source boundary

`parseAddressWithLocalLibpostal` accepts only absolute loopback HTTP endpoints
without credentials. Remote, relative, and credential-bearing endpoints are
blocked before a fetch call. Existing legacy gateway behavior is preserved for
backward compatibility, but new integrations must use the local-only API.

For the server-side display pipeline, configure only a local sidecar:

```
npm run serve:libpostal-local
AGID_LIBPOSTAL_LOCAL_URL=http://127.0.0.1:8765/parse
AGID_LIBPOSTAL_LOCAL_ENABLED=true
```

`LIBPOSTAL_PARSE_URL` remains a compatibility fallback, but it is accepted
only when it is the same kind of credential-free loopback URL. Parser output
improves component extraction for country-specific rendering; it is advisory
and does not establish postal or delivery-point proof.

PostGIS preflight issues a fixed read-only query against `pg_extension`. A
caller owns the connection and credentials; AGID does not accept a DSN in this
contract. Tool availability never converts an OSS, official, or community
dataset into postal or delivery proof.
