# AddressQL Postal Operations v1

Status: P2 executable operations contract

This contract turns source freshness, adapter expiry, correction latency, and
country promotion state into one deterministic report. It accepts source
metadata and aggregate-safe correction timestamps only. It does not fetch or
transmit addresses and does not send traffic to postal or carrier systems.

## Periodic CLI

Run the monitor from a scheduler at or before `monitorIntervalHours`:

```bash
npm run monitor:addressql-postal-operations -- \
  --input docs/specs/fixtures/addressql-postal-operations-input-v1.json \
  --output .agid-runtime/postal-operations-report.json \
  --now 2026-07-27T00:00:00Z \
  --fail-on-action
```

On later runs, pass the prior output back to detect source-version and
correction-route changes:

```bash
npm run monitor:addressql-postal-operations -- \
  --input postal-operations-input.json \
  --previous .agid-runtime/postal-operations-report.json \
  --output .agid-runtime/postal-operations-report.json \
  --fail-on-action
```

The CLI reads the previous report before atomically replacing the output.
Without `--fail-on-action`, a valid report exits zero even when it contains an
operational action. With the flag, expired or invalid sources, breached SLA,
`demotion_required`, and `blocked` exit nonzero for CI or scheduler alerting.

## Source states

| State | Meaning | Activation effect |
| --- | --- | --- |
| `active` | fixed version, valid HTTPS metadata, current check, unexpired independently attested adapter | eligible for promotion evidence |
| `check_due` | periodic metadata review is due but the signed validity window remains open | no new promotion; current runtime remains active until hard expiry |
| `review_required` | version or correction route changed since the previous report | no new promotion until review |
| `expired` | `validUntil` reached | adapter automatically disabled; country demotion may be required |
| `invalid` | malformed scope, URL, digest, identifier, or time window | adapter disabled |

`conformance` and unverified adapters are also disabled from live
recommendations. Separately, the runtime registry rechecks `validUntil` during
every capability lookup and evaluation. A server restart is not required for
an adapter to expire.

## Correction SLA

Correction input contains only:

- a non-reversible `sha256:` correction reference;
- country and source technical IDs;
- receipt timestamp;
- publication timestamp or `null`.

The output discards correction references and emits counts, open count,
within-target count, breach count, p50, p95, maximum publication latency, and
oldest open age. Open corrections older than the target count as breaches.
No correction text, raw address, recipient, coordinate, or query log is
accepted.

## Country actions

The report compares current applied L2-L4 state with operational and
promotion-eligible evidence:

- `promotion_candidate`: a higher level has active evidence and measured SLA;
- `demotion_required`: current capability exceeds unexpired evidence or SLA
  is breached;
- `review_required`: check, version, or correction-route review is pending;
- `hold`: current level remains supported;
- `blocked`: no level can be recommended.

These are review actions, not state mutations. The CLI never promotes a
country or edits a runtime configuration. L5 delivery-point activation remains
under the separate signed carrier contract.

## Schemas

- `docs/specs/schemas/addressql-postal-operations-input-v1.schema.json`
- `docs/specs/schemas/addressql-postal-operations-report-v1.schema.json`
- `docs/specs/fixtures/addressql-postal-operations-input-v1.json`

The report includes a deterministic SHA-256 digest for tamper detection. A
deployment may place the resulting digest under the independent release
quorum, but this contract does not claim that an unsigned local report is
independently attested.

## Non-claims

- HTTPS URL syntax is not proof that a remote correction endpoint is live.
- Aggregate correction latency is not a carrier delivery SLA.
- A promotion candidate is not an enabled country capability.
- Postal-source readiness is not address existence, deliverability, identity,
  or residence proof.
