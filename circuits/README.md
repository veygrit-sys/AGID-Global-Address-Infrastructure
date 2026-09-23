# AGID ZK Circuits

This folder is the ZK workspace for Address Morphism predicates.

The checked-in circuit under `fixtures/` is intentionally a compile/test fixture, not a production privacy circuit. It exists to verify repository wiring for Circom and snarkjs without pretending that a linear relation is cryptographically safe.

Production circuits must replace fixture arithmetic with audited SNARK-friendly commitments and nullifiers, such as a reviewed Poseidon/MiMC construction with explicit domain separation.

The implementation-facing hardening plan is documented in
`../docs/zk-baseline-hardening-ja.md` and enforced by
`../src/lib/zkBaselineHardening.ts`.

## Public Signal Policy

Allowed public signals:

- predicate identifier
- scope hash
- issuer root
- revocation root
- freshness root
- area root
- quality threshold
- nullifier hash
- proof expiry
- verifier key reference
- circuit id

Forbidden public signals:

- raw address text
- raw AGID
- raw AOID
- AGID-S ciphertext
- precise coordinates
- unit number
- phone number
- recipient name
- proof code
- holder secret
- credential secret
- witness
- private input
- full delivery history

## Initial Commands

```powershell
npm run verify:zk-baseline
npm run verify:zk:circuit
```

`verify:zk-baseline` checks the public signal allowlist, production blockers,
proof-bundle compatibility, managed prover boundaries, runtime policy, and the
fixture-circuit wrapper.

The verifier copies the circuit directory to a temporary workspace before
running the generated `generate_witness.js`. This avoids the repository-level
`"type": "module"` setting treating Circom's CommonJS witness generator as an
ES module.

To inspect generated artifacts while developing a new fixture:

```powershell
npm run verify:zk:circuit -- --keep
```

Generated witness, proving, and build artifacts must stay out of git.
