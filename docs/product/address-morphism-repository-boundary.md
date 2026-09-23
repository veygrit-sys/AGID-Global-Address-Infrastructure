# Address Morphism Theory Repository Boundary

Address Morphism Theory (AMT) is being split into an independent repository:

`../address-morphism-theory`

## Canonical Ownership

The independent AMT repository owns:

- AMT I and AMT II manuscripts.
- Japanese and English paper drafts.
- Claim maps, verification notes, and expression audits.
- Local PDF build scripts for AMT publications.

AGID owns:

- AGID/AOID resolver implementation.
- Address registration, QR, POS, field, hotel, and map workflows.
- SDKs, conformance vectors, OpenAPI, and operational release gates.
- Product and protocol documentation that links to AMT.

## AGID Compatibility Rule

Do not delete existing `docs/address-morphism-*` files from AGID until:

1. The independent AMT repository is pushed to GitHub.
2. AGID research and developer pages link to that repository.
3. Release scripts no longer depend on AGID-local AMT manuscript paths.
4. Old AGID paths are replaced by redirects, index stubs, or archived snapshots.

## Privacy Rule

AMT materials may discuss private address theory, witnesses, nullifiers, and
private keys as concepts, but must not contain real raw addresses, recipients,
witness files, private keys, or proof material.

## Next Migration Step

After the independent repository is published, update AGID links from local paper
paths to the public AMT repository and keep AGID-local files as compatibility
snapshots until a release notes entry announces the move.
