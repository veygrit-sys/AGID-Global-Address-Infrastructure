# Veygrit -ship incident response

## Severity and ownership

- **SEV-0:** confirmed Secret/label PII exposure, destructive data loss, or uncontrolled duplicate live-label purchase. Page incident commander and security immediately.
- **SEV-1:** live label creation unavailable, UPS/DHL systemic failure, webhook backlog risks SLA, or restore/PITR failure. Page primary on-call.
- **SEV-2:** degraded rating/tracking, isolated carrier errors, or non-paging operational defect. Create an incident during support hours.

For every incident assign an incident commander, operations lead, security/privacy lead when relevant, and communications owner. Use Request IDs and aggregate metric screenshots in the incident record. Do not paste addresses, labels, tracking numbers, authorization headers, signed URLs, connection strings, or customer bodies into chat/tickets.

## First 15 minutes

1. Acknowledge the page, name the incident, record UTC start time and affected carrier/operation.
2. Confirm the alert using carrier success ratio, latency, label failure ratio, webhook delay, and recent redacted error codes.
3. Contain impact: pause only the affected carrier/operation, preserve unaffected sandbox/rating paths, and stop automated retries if duplicate purchase is possible.
4. Preserve redacted evidence: Request IDs, deployment ID, dependency lock hash, audit events, job IDs, and carrier response codes. Never preserve raw payloads in the incident channel.
5. Start a 15-minute update cadence for SEV-0/1. Record every control change and approver.

## Secret or signed-label exposure

1. Disable the affected connection and revoke/rotate UPS or DHL credentials in the carrier console and cloud secret manager.
2. Invalidate application caches and signed URLs; disable label download issuance if blast radius is unknown.
3. Search structured logs and object access audit logs using time range and Request ID—never Secret value.
4. Run `npm run verify:preaudit-secrets`; scan Git history and build artifacts with the approved CI secret scanner.
5. Determine affected merchants/objects, preserve access audit evidence, and escalate regulatory/customer notification decisions to privacy/legal owners.
6. Re-enable only after rotation, least-privilege verification, new signed-URL tests, and two-person approval.

## Carrier failure

1. Split metrics by `carrier` and `operation`; confirm whether failure is auth, 429, timeout, validation, or 5xx.
2. For auth failures, pause that connection and refresh/rotate the token. Do not retry invalid credentials.
3. For 429/5xx/timeouts, keep bounded exponential backoff and respect `Retry-After`; do not widen retry budgets during an incident without approval.
4. Check UPS/DHL official service status and compare a single redacted sandbox probe.
5. Fail closed for label purchase. Rating may surface a carrier-unavailable result without fabricating a quote.

## Unknown label outcome

1. Stop automatic create retries for the idempotency key.
2. Reconcile by idempotency record, carrier shipment reference, package reference, and Request ID.
3. If carrier confirms creation, persist/recover label metadata and object without buying again. If carrier confirms absence, permit one controlled retry with the same idempotency policy.
4. If still unknown, send to the DLQ/manual queue. Never issue a second charge or label based only on a client timeout.

## Webhook delay

1. Compare acceptance delay, pending count, retry count, and DLQ count; verify worker heartbeat and database health.
2. Pause nonessential reconciliation jobs if they compete with webhook delivery.
3. Scale workers within configured concurrency and carrier/customer endpoint rate limits.
4. Replay only verified payload hashes from the durable queue. Preserve idempotency and delivery attempt history.

## Data loss or restore failure

1. Freeze writes if continued writes expand loss. Record the recovery point objective and last known good timestamp.
2. Restore into a new isolated target; never overwrite production during investigation.
3. Follow `veygrit-ship-observability-and-recovery.md`; verify row counts, constraints, shipment/package/label relationships, audit continuity, and synthetic PDF/ZPL retrieval.
4. Cut over only with incident commander, database owner, and security approval. Retain the old system read-only until reconciliation finishes.

## Observability failure

Treat missing logs/metrics as a release-safety failure. Check scrape authentication, deployment health, clock synchronization, and structured-log sink. Do not enable live labels while carrier success and label failure signals are blind.

## Recovery and closure

Require two-person approval to re-enable live-label purchase after SEV-0/1. Monitor for at least 30 minutes and one full worker reconciliation cycle. Within five business days publish a blameless postmortem with timeline, impact, root cause, detection gap, corrective owners/dates, and evidence that Secret/PII was excluded.
