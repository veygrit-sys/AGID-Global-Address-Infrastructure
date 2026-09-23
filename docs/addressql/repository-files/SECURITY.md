# AddressQL Security Policy

AddressQL handles address-adjacent data models.  Treat privacy boundaries as a
security issue, not only a documentation issue.

## Reporting A Vulnerability

Please report suspected vulnerabilities privately to the repository maintainers.
Do not open a public issue containing exploit details, private address data,
recipient data, proof witnesses, private keys, proof secrets, or production
credentials.

## In Scope

- raw address leakage in public fixtures;
- proof witness or private-key exposure;
- unsafe hash behavior presented as privacy protection;
- missing non-claim boundaries that could mislead implementers;
- adapter behavior that silently sends production traffic;
- source-version or determinism bugs that affect replay safety;
- proof verifier hooks that claim cryptographic verification without an
  external audited verifier.

## Out Of Scope

- requests for live postal data;
- requests to verify a real person's residence;
- production carrier SLA claims;
- political recognition disputes;
- vulnerabilities caused by third-party deployments that changed AddressQL
  safety defaults.

## Security Rules For Contributors

```text
Do not commit raw private address material.
Do not commit recipient names, phone numbers, or emails.
Do not commit proof witnesses, private keys, salts, or proof secrets.
Do not commit live API credentials or production carrier responses.
Do not market ADDRESS_HASH as privacy protection.
```

## Supported Security Baseline

The first public release supports:

- synthetic fixtures only;
- source-versioned decision support;
- non-claim tests;
- proof input schema checks;
- verifier hook boundaries;
- unsafe hash warnings.

It does not support:

- audited ZK circuits;
- production key management;
- legal proof of residence;
- global address completeness.
