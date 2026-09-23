# @agid/contracts

Versioned AGID constants, schemas, capability contracts, and conformance gates.

Postal Context Graph node, assertion, release-manifest, and resolution-result
contracts live here so country data repositories can evolve independently from
the AGID application while preserving a pinned interoperability boundary.

This workspace is a private compatibility bridge while the implementation is
migrated from the legacy root paths. It must remain dependency-free and must
not contain raw addresses, recipient data, credentials, or production secrets.
