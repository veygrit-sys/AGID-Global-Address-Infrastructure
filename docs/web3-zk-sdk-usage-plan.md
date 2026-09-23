# AGID/AOID Web3 and ZK SDK Usage Plan

This document defines how AGID/AOID should use `viem`, `wagmi`, `ethers.js`,
`web3.py`, `Web3j`, `Nethereum`, `Alloy`, `Circom`, and `snarkjs`.

The main rule is simple:

> Use `viem` as the canonical TypeScript chain client; keep wallet UI optional
> through `wagmi`; expose other language SDKs as generated adapters; implement
> real ZK with circuits and tooling outside the browser bundle.

## Mode Mapping

| Mode | ZK | Ethereum | SDKs |
| --- | --- | --- | --- |
| Mode 0: Local Only | No | No | none required |
| Mode 1: Local + Server Registry | No | No | optional `web3.py`, `Web3j`, `Nethereum` for external operators, not base runtime |
| Mode 2: ZK Only | Yes | No | `Circom`, `snarkjs` |
| Mode 3: Ethereum Registry Only | No | Yes | `viem`; optional `wagmi`, `ethers.js`, `web3.py`, `Web3j`, `Nethereum`, `Alloy` |
| Mode 4: Full ZK + Ethereum | Yes | Yes | `viem`, `Circom`, `snarkjs`; optional `wagmi`, `Alloy`, external SDK adapters |

## SDK Roles

| SDK | Role | Default dependency? | Use |
| --- | --- | --- | --- |
| `viem` | Canonical TypeScript RPC and ABI client | Yes | Server transaction submission, receipt checks, contract ABI calls |
| `wagmi` | React wallet UI | No | Optional operator/issuer wallet connection and chain switching |
| `ethers.js` | Compatibility adapter | No | Only for teams that already standardize on ethers |
| `web3.py` | Python external SDK | No | GIS notebooks, NGO batch jobs, postal-source pipelines, registry reads |
| `Web3j` | Java/JVM external SDK | No | Carrier, Android, warehouse, enterprise POS integration |
| `Nethereum` | .NET external SDK | No | Windows POS, kiosk, enterprise, government integration |
| `Alloy` | Rust chain client | No | High-throughput registry workers, relayers, batch anchoring |
| `Circom` | ZK circuit language | No | Nullifier, ownership, freshness, threshold, area-membership circuits |
| `snarkjs` | ZK tooling | No | Compile circuits, generate witnesses/proofs, export verifier contracts |

## Current Implementation Status

The repository now has a minimal implementation skeleton for the selected
stack:

| Layer | Implemented artifact | Status |
| --- | --- | --- |
| Frontend wallet UI | `src/lib/agidWalletConfig.ts` | Optional `wagmi` config for issuer/operator wallet screens |
| Canonical TS chain client | `src/server/ethereumRegistryClient.ts` | Existing `viem` submission and receipt client |
| Solidity registries | `contracts/AGIDIssuerRegistry.sol`, `contracts/AGIDRevocationFreshnessRegistry.sol`, `contracts/AGIDNullifierRegistry.sol`, `contracts/AGIDPaymentEscrow.sol` | OpenZeppelin-backed minimal registries matching the current viem ABI |
| Contract tooling | `foundry.toml` | Foundry/Anvil project wiring |
| ZK tooling | `circuits/README.md`, `circuits/fixtures/nullifier_linear_fixture.circom` | Circom/snarkjs wiring fixture only; not a production privacy circuit |
| Verification | `scripts/verify-web3-zk-stack.test.ts` | Structural tests for stack boundaries and artifact policy |

The `wagmi` dependency is present for wallet-gated screens, but it remains
outside Mode 0 and Mode 1 POS flows. `viem` remains the canonical TypeScript
client for signed registry submission.

## Actual Adoption Decision

The project should not install every SDK at once. The recommended adoption
state is:

| Item | Decision | Reason |
| --- | --- | --- |
| `viem` | Already installed; keep | Canonical TypeScript Ethereum client already used by the server registry client |
| OpenZeppelin Contracts | Introduce next | Safer registry contracts for access control, pausing, and standard Solidity patterns |
| Foundry | Introduce next | Contract compile/test/fuzz/gas workflow for registries and verifiers |
| Anvil | Introduce next | Local chain for viem receipt and registry integration tests |
| `wagmi` | Installed for optional wallet UI | Useful only for issuer/operator wallet screens |
| `@tanstack/react-query` | Installed with `wagmi` | Do not add solely for POS or map state |
| `Circom` | Circuit folder added; compiler may be installed per developer environment | Needed for real private predicate circuits |
| `snarkjs` | Installed for proof tooling | Needed for witness/proof/verifier/test-vector tooling |
| `Alloy` | Add when Rust relayer starts | High-throughput registry worker path |
| `web3.py` | External SDK/example | Useful for GIS/NGO/batch jobs, not app runtime |
| `Web3j` | External SDK/example | Carrier/JVM/Android enterprise integration |
| `Nethereum` | External SDK/example | Windows POS and .NET enterprise integration |
| `ethers.js` | Avoid for now | Would duplicate viem unless a partner requires it |
| Hardhat | Avoid for now | Foundry + Anvil gives a cleaner default contract workflow |

This means the next practical dependency work should be contract tooling, not
more frontend wallet libraries.

## Other Tools Worth Considering

| Tool | Use | Timing |
| --- | --- | --- |
| `abitype` | ABI type generation and adapter consistency | When ABI generation becomes automatic |
| Poseidon hash library | SNARK-friendly commitments/nullifiers | Research before circuit selection |
| Noir | Alternative ZK circuit language | Compare against Circom on one small nullifier circuit |
| Halo2 | High-control audited circuits | Later, only if the team can support Rust cryptography audits |
| RISC Zero / SP1 | zkVM for larger Rust predicate execution | Later, if full AMT audit proofs are too large for Circom |

## Why `viem` Is Canonical

The repository already uses `viem` in `AgidEthereumRegistryClient` for:

- ABI definitions;
- address and hex validation;
- wallet signing;
- `writeContract`;
- transaction receipt confirmation.

That should remain the primary TypeScript path. Adding `ethers.js` as another
equal implementation would increase maintenance cost unless a partner requires
it. If `ethers.js` is added, it should be generated from the same ABI constants
and must use the same public-field allowlist.

## Wallet UI

Use `wagmi` only for UI surfaces where an operator or issuer explicitly connects
a wallet.

Do not require `wagmi` for:

- Mode 0 local-only POS;
- Mode 1 server registry;
- AGID-S QR/NFC local decryption;
- address rendering or lookup.

Wallet prompts must show the public transaction purpose and must never ask users
to sign raw addresses, AOIDs, AGID-S payloads, delivery histories, or decrypted
private material.

## External SDKs

`web3.py`, `Web3j`, and `Nethereum` are not base app dependencies. They are
integration targets for external operators.

Recommended packaging:

- publish generated ABI files;
- publish typed wrapper examples;
- keep private address preparation local to the operator;
- submit only commitments, nullifiers, roots, issuer status, and payment records.

## Rust and Alloy

Use `Alloy` when the TypeScript server client becomes a bottleneck or when a
relayer needs stronger deterministic runtime behavior.

Good Alloy candidates:

- batch revocation/freshness root anchoring;
- nullifier relayers;
- payment escrow release workers;
- high-volume receipt monitoring;
- bridge services that also use Rust/WASM AGID predicates.

## Circom and snarkjs

Circom and snarkjs should not be mixed into ordinary address display or POS UI.
They belong to Mode 2 and Mode 4 proof workflows.

First circuits should be small and auditable:

1. AOID ownership proof.
2. Duplicate-prevention nullifier proof.
3. Credential freshness and revocation membership proof.
4. Quality threshold proof.
5. Coarse area-membership proof.

Avoid putting the full address-resolution algorithm into an early ZK circuit.
AMT can generate public predicate inputs and commitments; the circuit should
prove a narrow relation over those inputs.

## Privacy Boundaries

Never place these on-chain or in public proof metadata:

- raw address;
- raw AGID where location disclosure is not intended;
- raw AOID;
- AGID-S ciphertext;
- room number, building-unit details, phone number, or recipient name;
- detailed delivery history;
- witness files or witness logs.

Allowed public material:

- issuer ID and issuer status;
- commitment hashes;
- revocation and freshness roots;
- nullifier hash;
- scope;
- proof type;
- verifier metadata;
- payment status.

The Japanese companion model
[`zk-address-eligibility-model-ja.md`](./zk-address-eligibility-model-ja.md)
defines this boundary as ZK-AEM, or the Zero-Knowledge Address Eligibility
Model. Its most important production rule is stricter than "hash the address":
do not place raw addresses, precise coordinates, full postal codes, room or
building data, recipient identity, or simple unsalted address hashes on-chain.
Use salted commitments, revocation/freshness roots, nullifiers, issuer IDs,
rule IDs, and short-lived proof metadata instead.

## Implementation Order

1. Keep the current `viem` registry client as the canonical server client.
2. Add `contracts/` with OpenZeppelin-based registries.
3. Add Foundry + Anvil tests for issuer registration, revocation root anchoring,
   nullifier duplicate rejection, and no-raw-address event policy.
4. Add generated ABI artifacts as the single source for all adapters.
5. Add optional `wagmi` only to wallet-specific UI screens.
6. Add `web3.py`, `Web3j`, and `Nethereum` examples as external SDK packages.
7. Move high-volume relayers to Rust + Alloy when throughput requires it.
8. Build Circom circuits and snarkjs test vectors for the smallest proof
   predicates first.
9. Export Solidity verifier contracts only after witness leakage, scope,
   nullifier, and replay tests pass.

## ZK Address Eligibility MVP Order

Use the ZK-AEM sequence before attempting a full private checkout:

1. `ZK Region Proof`: prove country, region, or coarse delivery zone without
   revealing the address.
2. `ZK Delivery Eligibility API`: prove that a hidden address is inside an
   allowed carrier or merchant delivery-zone root.
3. `ZK Anonymous Shipping`: bind the same hidden address commitment to an
   encrypted carrier payload, so the merchant sees eligibility and receipts
   while the carrier receives only the scoped address material required for
   delivery.

The first production predicate should be narrow:

```text
C_A = H(A, s)
∧ Cred_A = Sig_I(C_A, E, t_exp)
∧ t_now < t_exp
∧ z(A) ∈ Z_allowed
∧ P_rule(A) = 1
∧ N = H(secret, rule_id)
```

Do not put the full AMT resolver, address translator, or geocoder inside the
first circuit. Let AMT/AGID create a signed or committed interlingua envelope,
then prove a small predicate over that envelope.

## First Concrete Uses

### Mode 3: Ethereum Registry Only

Use `viem` now.

1. Build a tx plan from the existing Mode 3 store.
2. Submit it with `AgidEthereumRegistryClient`.
3. Wait for a receipt.
4. Store only the receipt summary and public registry metadata.

Add OpenZeppelin + Foundry + Anvil before claiming production readiness.

### Mode 4: Full ZK + Ethereum

Use `Circom` and `snarkjs` only after one small relation is fixed.

Recommended first relation:

```text
private:
  holderSecret
  scopeSecret

public:
  scope
  nullifierHash

constraint:
  nullifierHash == H(holderSecret, scopeSecret, scope)
```

Do not begin with a full address-resolution proof. Start with nullifier and
freshness proofs because they are smaller, easier to audit, and directly useful.

### POS / Retail

Do not require Ethereum or ZK libraries for ordinary POS operation.

POS should continue to run:

- Mode 0 for local QR/NFC scan, AGID-S decrypt, and handoff decision;
- Mode 1 for server registry checks;
- optional Mode 3/4 only when the operator explicitly enables registry or proof
  checks.
