# AOID Performance Check - 2026-06-07

## Summary

AOIDの中核処理は十分に軽い。9-16桁base32 ID、AGID内包アンカー、公開descriptor、QR redaction、同期payload化はいずれもサブミリ秒で、通常のUI・保存・QR表示・同期キュー用途ではボトルネックになりにくい。

性能上の主な重さは、AOID所有証明、住所credential、duplicate nullifierなどのWeb Crypto処理に寄っている。ただし現状の実装は実ZKP proverではなく、`proofCost: 'none'` のZK-ready commitment/signature層なので、重いZK証明生成のコストはまだ含まれていない。

今回、duplicate nullifierの登録済み照合で、`Set`を渡しても内部で`Array.from(...).includes(...)`に変換されるO(N)ボトルネックを確認した。`Set.has`を使う修正を入れ、10万件registryでもO(1)相当の速度に戻した。

## Scope

Checked areas:

- AOID ID generation and validation
- AOID record normalization and public redaction
- Public QR payload build/parse
- Encrypted sync envelope and sync queue payload
- Address credential issuance
- AOID ownership proof creation and verification
- Duplicate-prevention nullifier proof creation and verification

Important implementation references:

- `src/lib/aoid.ts`
- `src/lib/registeredAddressQr.ts`
- `src/lib/aoidOwnershipProof.ts`
- `src/lib/addressDuplicateNullifier.ts`
- `src/lib/addressCredential.ts`

## Benchmark Environment

- Runtime: Node.js `v24.14.0`
- Platform: Windows x64
- Command style: local `tsx` benchmark script through stdin
- Test command: `node node_modules\tsx\dist\cli.mjs --test ...`
- Lint command: `npm run lint`

The benchmark is a local engineering check, not a formal capacity test. It is useful for relative bottleneck detection and regression budgets.

## Main Benchmark Results

| Area | Operation | Iterations | Avg ms/op | p95 ms/op | Ops/sec |
|---|---:|---:|---:|---:|---:|
| ID | `generateAOID(linked AGID)` | 20,000 | 0.004582 | 0.007600 | 218,232 |
| ID | `generateAOID(unlinked)` | 20,000 | 0.004112 | 0.005300 | 243,201 |
| ID | `normalizeAOIDId(linked)` | 100,000 | 0.001257 | 0.001600 | 795,528 |
| ID | `isValidAOIDId` | 100,000 | 0.001089 | 0.001400 | 918,493 |
| Record | `normalizeAOIDRecord` | 50,000 | 0.006962 | 0.013600 | 143,639 |
| Record | `buildAOIDPublicDescriptor` | 50,000 | 0.006807 | 0.009500 | 146,908 |
| Privacy | `redactAOIDForPublicUse` | 50,000 | 0.007022 | 0.009500 | 142,406 |
| Sync | `buildAOIDEncryptedSyncEnvelope` | 50,000 | 0.008254 | 0.011900 | 121,150 |
| Sync | `buildAOIDSyncQueuePayload(envelope)` | 50,000 | 0.002335 | 0.002700 | 428,197 |
| Sync | `buildAOIDSyncQueuePayload(record)` | 50,000 | 0.008228 | 0.014100 | 121,534 |
| QR | `buildRegisteredAddressQrPayload(public)` | 20,000 | 0.038798 | 0.063500 | 25,774 |
| QR | `parseRegisteredAddressQrPayload(public)` | 20,000 | 0.018045 | 0.032200 | 55,417 |
| Credential | `issueAddressCredential` | 500 | 0.357240 | 0.575500 | 2,799 |
| Proof | `createAOIDOwnershipProof(owner key)` | 300 | 0.536515 | 0.941700 | 1,864 |
| Proof | `verifyAOIDOwnershipProof(owner key)` | 500 | 0.454167 | 0.836300 | 2,202 |
| Proof | `createAOIDOwnershipProof(credential)` | 500 | 0.429868 | 0.752600 | 2,326 |
| Proof | `verifyAOIDOwnershipProof(credential)` | 500 | 0.151533 | 0.263700 | 6,599 |
| Nullifier | `createDuplicateNullifierProof(full check)` | 500 | 0.458278 | 0.740000 | 2,182 |
| Nullifier | `verifyDuplicateNullifierProof(no registry)` | 100,000 | 0.009069 | 0.019600 | 110,267 |

## Registry Scaling Finding

Large duplicate nullifier registries exposed the only clear implementation bottleneck.

Before the fix, a `Set` with 100,001 entries was converted to an array for each verification. After the fix, `Set.has` is used directly.

| Case | Iterations | Avg ms/op | Ops/sec | Result |
|---|---:|---:|---:|---|
| No registry | 20,000 | 0.0099 | 100,989 | Baseline |
| Array registry, 100,001 entries | 200 | 0.0981 | 10,197 | Still O(N), acceptable only for small arrays |
| Set registry, 100,001 entries | 20,000 | 0.0085 | 117,500 | Fixed, O(1)-like lookup |

Recommendation: high-throughput duplicate prevention must pass a `Set<string>` or an indexed store, not a large array.

## Performance Assessment

| Layer | Rating | Reason |
|---|---|---|
| AOID ID generation and validation | A | Bounded 9-16 char processing, very fast random generation, no material bottleneck. |
| AOID public descriptor and privacy redaction | A | Sub-0.01 ms average for current object size. Safe for UI, QR, sync queue, and API response shaping. |
| QR build/parse | A- | Public QR generation is heavier than ID operations but still fast enough. Cost is JSON serialization plus URI encoding. |
| Encrypted sync envelope | A | Envelope validation and redacted queue shaping are lightweight. Actual encryption is intentionally external to this helper. |
| Address credential and AOID ownership proof | B+ | Web Crypto HMAC/ECDSA dominates. Current throughput is fine for online verification, but bulk issuance should cache keys and batch work. |
| Duplicate nullifier verification | A after fix | Set lookup now scales. Large array registries remain avoidable O(N). |

Overall: AOID is performant enough for the current app, local-first QR workflows, encrypted sync metadata, and proof-ready address credential flows. The system is not yet benchmarked for real ZKP prover workloads.

## Complexity Notes

- `normalizeAOIDId` and `isValidAOIDId` are effectively O(1) because AOID length is capped at 16.
- Reserved-pattern checks are bounded by 16 characters, so 16 same-character and 4-character sequential-run checks are negligible.
- `normalizeAOIDRecord`, descriptor generation, and redaction are proportional to the small registered-address object size.
- Public QR build/parse is proportional to serialized payload size.
- Ownership proof creation and verification are dominated by SHA-256/HMAC/ECDSA import/sign/verify.
- Duplicate nullifier creation is dominated by address canonicalization, credential verification, SHA-256, and HMAC.
- Duplicate nullifier registry lookup is O(1) with `Set`, O(N) with arrays or general iterables.

## Changes Made During This Check

- Added `includesRegisteredNullifier` in `src/lib/addressDuplicateNullifier.ts`.
- Replaced `Array.from(options.registeredNullifiers).includes(proof.nullifier)` with direct lookup/iteration.
- Added a regression test for duplicate detection across `Set`, `Array`, and custom iterable registries in `src/lib/addressDuplicateNullifier.test.ts`.

## Verification

AOID-related regression tests:

```text
tests 51
pass 51
fail 0
duration_ms 824.4145
```

Static TypeScript check:

```text
npm run lint
tsc --noEmit
pass
```

## Remaining Improvement Candidates

1. Add a reusable AOID benchmark script with budget thresholds.
2. Cache imported Web Crypto keys for high-throughput AOID ownership proof verification.
3. Prefer `ReadonlySet<string>` or indexed storage for production nullifier registries.
4. Cache public AOID descriptors where the same AOID is rendered repeatedly.
5. Keep the AOID core in TypeScript for now; move only future real ZKP proving/circuit execution to Rust/WASM or a dedicated prover service.
6. Measure real ZKP prover cost separately once circuits exist, because current proof modules are commitment/signature proofs rather than full zero-knowledge circuits.
