# Lithuania Postal Context contract seed

This directory is the M1 metadata seed for the future `agid-postal-lt`
country repository. It contains no Lietuvos paštas results, Registrų centras
rows, NTR building boundaries, real addresses, or production postal geometry.

The authority chain is deliberately split:

- Lietuvos paštas supplies postcode and address-membership evidence.
- The Registrų centras Address Register supplies civic-address identity,
  hierarchy, lifecycle, and point geometry.
- Registrų centras NTR open data supplies registered building boundaries.
- Address Register administrative and settlement geometry supplies context.
- AGID supplies the spatial index and cell relation, never postal assignment.

`LT-NNNNN` is not assumed to be an area. A lookup can describe address,
post-office, municipality, organization, or delivery-endpoint membership. Any
generated surface is therefore `derived`, noncanonical, versioned, and
reproducible from an explicit complete membership set.

An address reaches building level only through a stable registry identifier
relation or reviewed crosswalk. Containment and nearest-footprint matches remain
candidates. Public outputs exclude recipients, residents, owners, tenants,
private-unit occupants, credentials, and protected registry subjects.

The synthetic fixtures test runtime behavior only and cannot promote a real
release. See `repository-manifest.json` and `source-profile.json` for gates.
