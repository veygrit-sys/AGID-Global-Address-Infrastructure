# AGID Six-Workspace Split

AGID uses six local npm workspaces while the root repository remains the thin
integration and compatibility layer.

| Workspace | Ownership |
| --- | --- |
| `@agid/contracts` | Versioned contracts, schemas, and conformance gates |
| `@agid/core` | AGID encoding, grid geometry, neighborhood, and building references |
| `@agid/country-data` | Country formats, source evidence, quality gates, and child-pack inputs |
| `@agid/addressql` | AddressQL API, adapters, multilingual policy, and SDK surface |
| `@agid/topography` | Topographic source policy, export planning, and serializers |
| `@agid/studio` | React application shell and integration surfaces |

## Dependency Direction

```text
contracts
  -> core
    -> country-data
      -> addressql
    -> topography
addressql + core + country-data + topography
  -> studio
```

Dependencies may point only toward a lower layer. AddressQL and topography must
not depend on each other. Studio is the only workspace allowed to own React
runtime dependencies.

## Compatibility Migration

All six packages begin as private compatibility bridges. Existing root imports
remain valid while package consumers adopt the new entrypoints. A legacy module
may move into its owning workspace only after:

1. its public exports have contract or snapshot coverage;
2. old root imports re-export the workspace implementation;
3. package and root consumer tests pass together;
4. generated SDK and OpenAPI changes are checked;
5. the move introduces no raw address, recipient, credential, or secret data.

Country child repositories remain generated outputs rather than permanent npm
workspaces. Heavy geometry and source snapshots remain external and are linked
by version, digest, rights, scope, attribution, freshness, and correction
metadata.
