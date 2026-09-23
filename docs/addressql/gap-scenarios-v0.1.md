# AddressQL Gap Scenarios v0.1

AddressQL is the address validation, normalization, postal, country, geospatial,
and proof-shape layer. It is not the whole shipping, wallet, carrier, evidence,
or settlement system.

This note defines situations where AddressQL must return a bounded result,
`unresolved`, or "requires another layer" instead of overclaiming.

## Principle

AddressQL should answer:

```text
What can be concluded from this source-versioned address data?
```

AddressQL should not silently answer:

```text
Does the recipient consent?
Can this carrier perform the service?
Is this legally shippable?
Will this arrive fastest?
Was the invoice settled?
```

Those require Wallet, Carrier Connect, legal policy, realtime operations,
Evidence Vault, or Settlement Ledger.

## Gap Matrix

| Scenario | Safe AddressQL behavior | Missing layer |
| --- | --- | --- |
| Official source missing or not licensed | `requires-source` | official source catalog, manual ops |
| Friend delivery before recipient approval | `requires-wallet-approval` | Address Wallet, Evidence Vault |
| Carrier feature not supported in selected market | `requires-carrier-adapter` | Carrier Connect, Merchant Console |
| Fastest / cheapest live ranking | `requires-real-time-signal` | realtime mobility, carrier connect, risk |
| Merchant must not see recipient raw address | `requires-commercial-layer` | Address Wallet, Carrier Connect |
| Recipient address changes after order | `requires-wallet-approval` | Address Wallet, evidence |
| Restricted building or private access note | `requires-human-review` | Carrier Connect, manual ops |
| Legal, sanctions, customs, age-gated goods | `requires-legal-policy` | legal policy engine |
| Address proof or KYC overclaim | `requires-legal-policy` | wallet, legal policy, evidence |
| Label billing, adjustment, refund, invoice | `requires-commercial-layer` | settlement ledger |

## Research Finding

The most important missing capability is not another SQL function. It is the
boundary between SQL and the operational layers:

```text
AddressQL -> can validate and explain source-versioned address facts.
Address Wallet -> can grant consent and selected-address authorization.
Carrier Connect -> can verify carrier feature availability and create labels.
Realtime Mobility -> can rank fastest/cheapest under current signals.
Evidence Vault -> can retain redacted receipts and audit trails.
Settlement Ledger -> can reconcile charges, refunds, disputes, and invoices.
Legal Policy Engine -> can decide customs, sanctions, tax, age, or public-sector constraints.
```

## Non-Claims

- Missing from a fixture or source pack is not proof that a place does not exist.
- Address Wallet friendship, login, or social graph membership is not delivery consent or residence proof.
- A normalized AddressQL function does not guarantee carrier feature availability.
- Fastest, cheapest, or ETA output is an estimate, not a carrier SLA guarantee.
- Masking or hashing an address is not sufficient anonymous shipping.
- Country or postal validation is not customs, sanctions, tax, or legal compliance approval.
- ZK-ready, postal-valid, or wallet-authenticated does not mean legally KYC-verified.
- Label creation is not final settlement, proof of delivery, or dispute resolution.

## Next Implementation Move

The next executable artifact should be:

```text
ShipmentIntent / RateQuote / CarrierAllocation schemas
```

These schemas sit above AddressQL. They let Skipship represent cases where
AddressQL has done its job, but shipping still requires wallet approval,
carrier capability, legal policy, live ranking, or settlement.
