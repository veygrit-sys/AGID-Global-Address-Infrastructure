# 未検証事項のうち実行可能なものの検証結果

作成日: 2026-06-07

## 目的

本レポートは、`docs/address-morphism-theory-unverified-items.md` に記載された未検証事項のうち、現行リポジトリ内で実行できる検証を実施し、論文に書ける主張と、まだ未検証として残すべき主張を分離するための記録である。

特に AOID 論文へ反映するため、AOID の識別子制約、公開/非公開境界、所有証明、重複登録防止、失効・鮮度、ZK-ready envelope、API/MCP/Polkadot 連携を重点的に確認した。

## 実行環境上の注意

通常の `npx` と `npm` は、グローバル npm の壊れたパスを参照して失敗した。

```text
Cannot find module 'C:\Users\kitau\AppData\Roaming\npm\node_modules\npm\bin\npx-cli.js'
Cannot find module 'C:\Users\kitau\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js'
```

そのため、テストはローカル依存の `node node_modules\tsx\dist\cli.mjs` 経由で実行した。これは検証対象の失敗ではなく、コマンド実行経路の問題である。

Lean は、サンドボックス側では既定 toolchain が見えず最初に失敗したが、実ユーザーの `C:\Users\kitau\.elan` を `ELAN_HOME` に指定し、Lean 4.30.0 で再実行した。

## 検証結果サマリ

| 検証領域 | 結果 | 論文で書けること |
| --- | --- | --- |
| AOID 形式・公開/非公開境界・所有証明・同期・proof bundle | 63 tests pass | AOID のローカル優先、公開参照化、暗号化同期要求、所有証明 envelope、nullifier 衝突検出、issuer trust、Polkadot public commitment は実装テストで支持される。 |
| 自然地理・住所検証・多言語検索・品質しきい値 | 49 tests pass | 自然地理表示、住所検証 policy、多言語検索展開、品質しきい値 proof-ready envelope はローカル実装で確認済み。 |
| API/MCP/OpenAPI/秘匿述語/重複防止/地域所属 | 83 tests pass | API、MCP、OpenAPI、ZK address/residence/delivery envelope、duplicate nullifier、region membership は公開面で秘密情報を出さない実装になっている。 |
| Lean AMTCore | pass | AMT 中核の抽象定理は Lean で形式検証できる。 |
| Lean AMTPaperExtensions | pass | 履歴、GIS certificate、proof bundle compatibility などの拡張定理は依存 `.olean` を与えれば形式検証できる。 |
| Lean GeneratedGisCertificate | pass | GIS warning budget の経験的結果を Lean 側の certificate として受け取る橋渡しは成立している。 |
| PID collision budget | pass | 128-bit bounded PID hash は、最大発行数 \(10^{12}\) に対し birthday upper bound \(1.4693679385263966 \times 10^{-15}\) で、設定リスク \(10^{-12}\) を下回る。 |
| GIS warning budget | pass | 351 features、0 errors、149 warnings、408 registered sources は現行 warning budget 内で検証済み。 |
| GIS strict validation | fail expected | strict warning zero は未達。0 errors だが 149 warnings が残るため、論文では strict global validation 済みとは書かない。 |
| postal source static verification | pass | 281 address format files、408 registered open-source ids、89 postal APIs、201 probe targets、static issue 0。live probe は無効。 |
| official postal source coverage | pass with caveat | `needs-official-source` は 0。だが country-specific official source が不足し global fallback に依存する地域が 109 ある。 |
| address coverage policy | pass | reliable postal API 43、weak postal API 176、no-postal strong geo 48、no-postal weak geo 14 に分類される。 |

## 実行した主なコマンド

```powershell
node node_modules\tsx\dist\cli.mjs --test src\lib\aoid.test.ts src\lib\aoidOwnershipProof.test.ts src\lib\registeredAddressQr.test.ts src\lib\syncQueue.test.ts src\lib\agidAoidGovernance.test.ts src\lib\credentialIssuerTrustRegistry.test.ts src\lib\revocationFreshnessRootAnchoring.test.ts src\lib\zkProofRuntime.test.ts src\lib\zkProofCompatibility.test.ts src\lib\zkProofBundleRegistry.test.ts src\lib\polkadotAdapter.test.ts src\lib\polkadotIntegration.test.ts src\server\routes\routeAudit.test.ts

node node_modules\tsx\dist\cli.mjs --test src\lib\searchQuery.test.ts src\lib\naturalAddress.test.ts src\lib\addressUtils.natural.test.ts src\lib\libpostalGateway.test.ts src\lib\addressVerificationPolicy.test.ts src\lib\addressVerificationEngine.test.ts src\lib\addressVerificationBenchmark.test.ts src\lib\qualityThresholdProof.test.ts src\data\postalSourceMetadata.test.ts

node node_modules\tsx\dist\cli.mjs --test src\server\routes\coreRoutes.test.ts src\lib\apiVersion.test.ts src\lib\apiEndpoints.test.ts src\lib\openApiSpec.test.ts src\lib\addressDuplicateNullifier.test.ts src\lib\addressCredentialFreshnessProof.test.ts src\lib\privateAddressPredicateProof.test.ts src\lib\regionMembershipProof.test.ts src\lib\agidZkAddressProofs.test.ts src\lib\addressIdentity.test.ts src\lib\privacyPolicy.test.ts src\lib\hybridArchitecture.test.ts

node node_modules\tsx\dist\cli.mjs scripts\verify-pid-collision-risk.ts
node node_modules\tsx\dist\cli.mjs scripts\verify-gis-warning-budget.ts
node node_modules\tsx\dist\cli.mjs scripts\verify-gis-data.ts --strict
node node_modules\tsx\dist\cli.mjs scripts\verify-postal-sources.ts
node node_modules\tsx\dist\cli.mjs scripts\report-official-postal-source-coverage.ts
node node_modules\tsx\dist\cli.mjs scripts\report-address-coverage-policy.ts
```

Lean は次のように検証した。

```powershell
$env:ELAN_HOME='C:\Users\kitau\.elan'
C:\Users\kitau\.elan\bin\lake.exe env lean formal\AMTCore.lean

C:\Users\kitau\.elan\bin\lean.exe -o tmp-lean\AMTCore.olean formal\AMTCore.lean
$env:LEAN_PATH='tmp-lean'
C:\Users\kitau\.elan\bin\lean.exe -o tmp-lean\AMTPaperExtensions.olean formal\AMTPaperExtensions.lean
C:\Users\kitau\.elan\bin\lean.exe formal\GeneratedGisCertificate.lean
```

## AOID 論文に安全に反映できる事項

### 1. AOID の形式制約

実装テストにより、AOID は 9 から 16 文字の曖昧性の少ない Base32 handle として扱われることが確認された。

確認済みの制約は次の通りである。

- 9 から 16 文字である。
- 使用可能文字は AGID hash alphabet と同じ不曖昧 Base32 である。
- linked AGID がある場合、AOID は AGID hash anchor を含まなければならない。
- 16 桁すべて同一文字の ID は拒否される。
- Base32 alphabet 上で連続 4 文字の昇順または降順 run は拒否される。
- 生成関数は 16 文字 AOID を生成し、linked AGID が与えられた場合は AGID hash anchor から始める。

したがって AOID 論文では、「AOID は AGID を内包し得る owner-managed private handle である」と書ける。ただし、「AOID そのものが住所の正しさや所有権を証明する」とは書かない。

### 2. 公開 AOID と私的 AOID の分離

公開 AOID descriptor は、受取人、電話番号、部屋番号、座標、配送指示を含まないことがテストで確認された。

公開 QR についても、public AOID QR は公開参照として parse されるが、所有者管理 AOID として登録されない。したがって、AOID 論文では次のように書ける。

```text
AOID has a public reference surface and a private owner surface. The public surface may expose an opaque handle and a linked AGID, while recipient, phone, unit, exact coordinates, and delivery instructions remain local or encrypted.
```

### 3. AOID 同期は local-first である

AOID cloud sync は、owner-device encrypted envelope、owner key id、device key id がない場合に拒否される。plain AOID record を同期キューに渡した場合は、公開 descriptor に落とされ、`requiresEncryptedPayload` が付く。

したがって AOID 論文では、クラウド保存を禁止する必要はなく、次の条件付きで許可する設計が妥当である。

- 初期状態は device-local。
- クラウド同期は明示的 opt-in を必要とする。
- 同期 payload は owner-device encrypted envelope でなければならない。
- 公開API、公開QR、公開MCP、チェーンには AOID plaintext を載せない。

### 4. AOID ownership proof は ZK-ready である

AOID owner key possession、registered AOID address credential possession、combined owner key and credential possession は、住所本文や AOID 本文や秘密鍵を公開せずに envelope として検証できる。

ただし、現段階では `proofHint.zkpGenerated = false` であり、本物の ZK 回路ではない。したがって論文では次の境界が必要である。

```text
The current AOID ownership proof is a proof-ready envelope and audit model. It is not yet a complete zero-knowledge proof system until the relation is implemented in an audited circuit backend.
```

### 5. Duplicate nullifier は実装テストで支持される

同一 hidden address、同一 AOID、同一 region では同じ nullifier になり、住所、AOID、region が変わると nullifier が変わることがテストで確認された。

また、registry は nullifier のみで duplicate registration を検出できる。

論文では、「同一登録の二重利用を公開住所なしで検出するための nullifier model」は実装で支持されると書ける。ただし、暗号回路内の domain separation と unlinkability は外部監査が必要である。

### 6. 失効・鮮度 root は公開可能な anchor として検証済み

revocation/freshness root anchoring は、credential body や revoked handle を公開せず、公開 root と proof envelope により検証できる。stale freshness window、revocation root mismatch、tampered signature は拒否される。

論文では「失効・鮮度は AOID credential の必須安全条件」として書ける。

### 7. API/MCP/OpenAPI は public commitment surface として検証済み

OpenAPI は AOID を private layer として記述し、MCP endpoint は public proof、commitment、registry root、non-private integration metadata のみを受け付ける。private argument material は拒否され、値を漏らさない。

したがって AOID 論文では、買い物 Agent や MCP との連携は、AOID plaintext を直接渡すのではなく、公開 proof bundle と encrypted owner channel の二層で扱うべきと書ける。

## まだ未検証として残すべき事項

| 項目 | 今回の状態 | 安全な書き方 |
| --- | --- | --- |
| 本物の ZK 回路の zero-knowledge / soundness | 未検証 | 現状は proof-ready envelope。Circom、Noir、Rust backend などで回路化し、外部監査が必要。 |
| AOID による実配送成功率 | 未検証 | 実配送ログ、配送会社データ、誤配率、返品率、ユーザー同意データが必要。 |
| 全世界の多言語住所 recall | 部分検証 | ローカル検索展開テストは通過。世界規模 benchmark は未実施。 |
| 自然地理・文化地物の全世界 coverage | 部分検証 | 地物型別の表示・処理はテスト済み。全世界の全名称を認識済みとは書かない。 |
| GIS strict global validation | 未達 | hard error 0 と warning budget pass は確認済み。strict warning zero は未完了。 |
| 商用住所検証 API への全面勝利 | 未検証 | 同一入力、同一国、同一粒度、同一評価指標で比較する必要がある。 |
| country-specific official postal source の完全性 | 部分未検証 | `needs-official-source` は 0 だが、109 地域は country-specific official source ではなく global fallback に依存する。 |

## 論文上の推奨表現

AOID 論文では、次の表現が安全である。

```text
AOID is an owner-managed private address identifier linked to public AGID context but separated from public geographic identity. Its public surface is limited to opaque handles, linked AGID anchors, commitments, and proof metadata. Recipient names, phone numbers, unit numbers, exact private coordinates, delivery instructions, owner keys, and credential salts are kept local or encrypted.
```

避けるべき表現は次である。

```text
AOID proves the real address.
AOID is a complete ZK proof system.
AOID can be safely published as plaintext.
AOID guarantees delivery success.
AOID can replace all postal and commercial delivery validation.
```

## 結論

今回、未検証事項のうちローカルで実行できるものはかなり検証できた。

AOID について強く書けるのは、owner-managed private identifier、AGID-linked anchor、public/private surface separation、encrypted sync gate、ownership proof envelope、duplicate nullifier、freshness/revocation root、public API/MCP commitment surface である。

一方で、ZK 回路そのもの、実配送成功、世界規模 coverage、商用 API 比較、strict GIS warning zero は未検証として残すべきである。したがって AOID 論文は、「完全な暗号住所証明が完成した」という論文ではなく、「AOID を安全に公開参照、所有者秘密、暗号化同期、proof-ready envelope へ分離する応用理論と実装仕様」として書くのが最も強い。
