# Cisco-Inspired Network Assurance for AGID/AOID

This document defines a Cisco-inspired feature layer for AGID/AOID POS, resolver, and registry operations. It does not embed a Cisco product dependency. Instead, it imports the useful operating ideas: zero-trust access, device posture, secure connectivity, signed route discovery, network assurance, segmentation, observability, and incident response.

## Purpose

AGID/AOID systems can work in local-only, server-registry, edge-resolver, and enterprise-managed modes. The risk is different in each mode:

- Local-only POS needs speed, offline resilience, and safe deferred sync.
- Server registry mode needs freshness, revocation, and scoped API access.
- Edge resolver mode needs signed route advertisements and healthy fallback paths.
- Enterprise-managed mode needs staff identity, device posture, MFA, and incident response.

The Cisco-inspired layer gives the POS and backend a single posture result:

- `ready`: continue normal operations.
- `monitor`: continue, but keep warnings visible.
- `restricted`: allow only lower-risk actions or supervisor-reviewed workflows.
- `blocked`: stop handoff or registry operation until remediated.

## Implemented Module

Source:

- `src/lib/ciscoInspiredNetworkAssurance.ts`

Tests:

- `src/lib/ciscoInspiredNetworkAssurance.test.ts`

Core function:

```ts
buildCiscoInspiredNetworkAssurance(input)
```

Validation:

```ts
validateCiscoInspiredNetworkAssurance(report)
```

## Capabilities

The module exposes these capability labels:

- `zero-trust-access`
- `device-posture`
- `secure-connect`
- `edge-resolver`
- `network-assurance`
- `segmentation`
- `dns-security`
- `incident-response`
- `observability`

## Checks

The report evaluates:

- Network reachability and local fallback.
- Latency, packet loss, and jitter budgets.
- TLS or local-only transport handling.
- Signed or pinned resolver discovery.
- Secure tunnel / pinned endpoint readiness.
- Captive portal and proxy inspection signals.
- Device root/jailbreak and malware signals.
- Device attestation or managed-device status.
- OS patch age, terminal key age, and clock skew.
- Resolver endpoint count, signed route ads, freshness, and edge health.
- Staff role, MFA, scope binding, and API key scoping.
- Metadata-only telemetry.
- Coarse location telemetry in high-risk workflows.
- Failed proof spikes, lookup abuse, and policy violations.

## Privacy Boundary

Network assurance must never become a new surveillance channel. The public projection and telemetry are explicitly metadata-only:

- No raw address.
- No raw AGID.
- No raw AOID.
- No raw IP address.
- No raw device fingerprint.
- No precise location telemetry in high-risk mode.

If raw address, AGID, or AOID telemetry is declared, the posture becomes `blocked`.

## POS Usage

The POS terminal can use the report to:

- Show a Network workspace next to Registry, Devices, and Audit.
- Block high-risk handoff when device or route trust is broken.
- Prefer local-only or deferred sync when the network is degraded.
- Require supervisor or MFA when high-risk warnings exist.
- Keep resolver route signing and freshness visible to operators.

## What This Does Not Do

This feature does not:

- Send data to Cisco.
- Require Cisco hardware.
- Store private addresses.
- Replace Address Radar, Address Access/Auth, or AGID-S.

It complements those layers by checking whether the network, terminal, resolver route, and operator context are safe enough for the requested POS workflow.

## Recommended Next Extensions

- Add endpoint-specific latency probes for configured resolver adapters.
- Feed device attestation from native POS shells or MDM integrations.
- Export redacted posture events to the audit report.
- Use the posture result as an input to Address Radar and LabelIntent decisions.
- Add admin policy profiles for store, warehouse, disaster field, and enterprise deployments.
