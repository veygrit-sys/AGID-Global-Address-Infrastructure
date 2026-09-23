# Ukraine Postal Context runtime

The Ukraine pack connects five-digit Ukrposhta routing evidence to official
address and building identities without treating a postcode, office, route,
outage, or administrative unit as a postal polygon.

```text
Ukrposhta postcode / address / office evidence
  -> current assignment assertion
  -> separately time-stamped service status
  -> rights-cleared address membership
  -> explicitly derived surface + uncertainty
  -> Unified State Address Register identity
  -> explicit Register of Buildings / NSDI crosswalk
  -> UA AGID cell relation
```

## Five digits are routing evidence

The runtime canonicalizes Unicode digits to exactly five ASCII digits and
preserves leading zeroes. Ukrposhta's official directories and lookup are the
assignment authority. The UPU Ukraine guide proves syntax, address placement,
and code-component semantics only. A structurally valid value, code prefix,
post-office point, delivery zone, or KATOTTG unit is not an official full-code
polygon.

Ukrposhta open data is ingested only from a pinned resource with its dataset
terms, schema, update time, address or office scope, and digest. Public search
and API access are reviewed separately for automation, credentials, rate
limits, retention, caching, and redistribution.

## Operational state is temporal, not territorial

Office availability, `AVAILBLE`, `LOCK_CODE`, replacement-office, closure, and
route data answer a time-specific operational question. They do not erase a
postal assignment, create a permanent perimeter, prove future deliverability,
or determine sovereignty. A response therefore keeps assignment, service
status, geometry, and territorial classification as separate assertions.

## Address and building precision

The Unified State Address Register is the preferred government address
identity when a provider-approved public interface or release is available.
The Register of Buildings and Structures and competent NSDI layers are separate
building authorities. Exact building output requires a common authoritative
identifier or a reviewed explicit crosswalk. An address point, cadastral
parcel, footprint, containment result, or nearest feature is only a candidate.

The NSDI catalog names addresses, buildings and structures, administrative
units, communities, settlements, streets, and geographic names as base data.
National-geoportal access is restricted during martial law, and its site-level
license notice does not override a layer's holder, security restriction, or
dataset-specific terms. AGID does not bypass those restrictions.

## Territory and security guardrails

Ukraine country identity and disputed-feature classification use a separately
pinned boundary authority, territorial policy, coverage, and vintage. Postal
availability, missing service, replacement routing, language, operator, current
control, occupation, or proximity cannot relabel a feature, decide sovereignty,
or manufacture a legal boundary.

Public artifacts exclude recipients, residents, owners, rightsholders,
occupants, phones, credentials, protected register attributes, military or
security-sensitive sites, and restricted geodata.

## Runtime state

The committed country seed is `M1_metadata`: it contains contracts and
non-production synthetic fixtures, but no upstream rows, real addresses,
personal data, or production geometry. Until a separately released M2+
descriptor passes integrity, rights, access, freshness, security, territorial,
topology, ambiguity, privacy, and correction gates, Ukraine remains
`unconfigured`; synthetic packs are tests only.
