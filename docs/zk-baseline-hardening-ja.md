# ZK Baseline Hardening Plan

Last updated: 2026-06-18

この文書は、AGID/AOID の ZK 基礎を強化するための実装方針である。対応する機械可読モデルは `src/lib/zkBaselineHardening.ts` に置く。

## 結論

現時点の AGID/AOID の ZK 実装は、production-grade ZKP と言い切る段階ではない。正しい表現は、ZK-ready envelope、proof bundle compatibility、fixture circuit、public signal policy である。

したがって、次に強化すべきなのは「新しい回路を大量に増やすこと」ではなく、以下の 8 つの基礎ゲートである。

| 優先度 | 制御 | 目的 |
| --- | --- | --- |
| P0 | public signal allowlist | 住所・AGID・AOID・座標・witness が公開信号へ漏れないようにする。 |
| P0 | witness hygiene | witness と private input をログ・DB・公開payloadへ残さない。 |
| P0 | domain-separated nullifiers | nullifier が用途横断トラッカーにならないようにする。 |
| P0 | fixture / production separation | fixture circuit を本番プライバシー回路と誤認させない。 |
| P1 | proof bundle compatibility | 複数 proof の scope、challenge、validity、collision domain を揃える。 |
| P1 | managed prover boundary | managed proof server が public statement と commitment だけを受けるようにする。 |
| P1 | verifier and registry contracts | registry や L2 へ住所本体を置かず、root、commitment、nullifier、receipt に限定する。 |
| P2 | audit and release evidence | envelope / fixture / production / audited の段階を明確に出す。 |

## Public Signal Policy

公開してよい値:

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

公開してはいけない値:

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

未知の public signal は、許可でも禁止でもなく `review-required` として扱う。ZK は一度公開信号を設計すると後方互換性が重くなるため、曖昧な信号名を安易に追加しない。

## Production Blockers

次の状態では production ZK と呼ばない。

- fixture circuit を本番 privacy circuit として使っている。
- forbidden public signal が含まれている。
- unknown public signal が未レビューである。
- witness または private input を保存・ログ出力している。
- nullifier に domain separation がない。
- single-use nullifier の再利用を許している。
- registry または verifier が raw AGID/AOID/address を出している。
- circuit audit status なしで production-grade と書いている。

## 実装順序

1. `zkBaselineHardening` の policy と test を通す。
2. `verify:zk:circuit` で fixture circuit のビルド・witness 検証だけ確認する。
3. `zkProofCompatibility` と `zkProofBundleRegistry` で proof bundle の衝突を防ぐ。
4. `managedZkProofServer` で private material を拒否する。
5. production 回路を作るときは、Poseidon/MiMC など監査済み構成、または選定した ZK backend に合わせた標準 primitive を使う。
6. production-grade と書く前に、回路、verifier、witness hygiene、public signal leakage、nullifier replay、外部監査を通す。

## 推奨コマンド

```powershell
npm run verify:zk-baseline
npm run verify:zk:circuit
npm run verify:web3-zk-stack
npm run lint
```

## 書き方のルール

- TypeScript の proof object は、実 prover が proof を生成していない限り `ZK-ready envelope` と呼ぶ。
- `circuits/fixtures/` の回路は `tooling fixture` と呼び、production privacy circuit と呼ばない。
- ZK は「住所が現実に正しい」ことを保証しない。ZK が証明するのは、与えられた credential、root、commitment、predicate の関係である。
- 住所の真実性は issuer trust、official source、配送履歴、監査、revocation/freshness と組み合わせて扱う。

## OSSとして公開すべきもの

- public signal schema
- forbidden signal list
- circuit fixture
- self-host prover path
- proof compatibility tests
- proof bundle registry tests
- nullifier domain separation policy
- witness hygiene policy
- production blocker list

ここをOSSにすることで、AGID/AOIDのZK機能は「信じてください」ではなく「漏洩境界を検査できます」と説明できる。
