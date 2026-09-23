# 住所写像論 日本語版 v1 第19章 検証ノート

対象: 第19章「PIDと応用識別子の境界」

本ノートは、第19章で述べられている「PIDはAMT本体の出力であり、AGID/AOIDはAMTを利用する応用識別子である」という主張を、Lean形式化、PIDリスク評価、PID監査、AOID公開面の秘匿、AGID/AOIDガバナンス、QR、同期キュー実装に照らして検証したものである。

結論を先に述べると、第19章は強く採用してよい。ただし、本文では次の境界を徹底する必要がある。

> PIDは、住所文字列の別名ではなく、AMTの解決ゲートを通過した参照状態に対して発行される中核識別子である。AGIDとAOIDは、PIDを再定義するものではなく、公開地理参照、所有者管理、配送、QR、同期、委譲などの応用層に属する。

したがって、AGIDやAOIDの便利な登録機能を、AMT本体のPID発行規則そのものとして書いてはいけない。特に、未解決候補、低品質候補、生住所文字列、単一観測値から直接PIDを発行する設計は、第19章の安全な主張から外れる。

第19章の安全な中心文は次である。

> AMT本体論文では、PIDを、候補生成、クラスタ、unresolved判定、履歴整合性、品質、鮮度、リスク、監査可能性を通過した参照クラスの識別子として扱う。AGID/AOIDはAMTの応用識別子であり、その通信、登録、所有、QR、同期、委譲、暗号証明、買い物Agent連携、MCP連携の詳細は、AGID/AOID応用論文または住所写像論IIで扱う。

## 1. 検証結果の要約

| 観点 | 判定 | 理由 |
|---|---:|---|
| PIDをAMT本体の出力とする | 強く採用 | Leanと実装が、解決済み参照クラス、履歴、監査、衝突リスクをPID発行条件として扱う。 |
| PIDを生住所文字列のhashとみなす | 不採用 | Leanにより、同じ観測値から発行するPIDは衝突し得ることが示される。 |
| PID一意性は無条件に成立する | 不採用 | Leanでは、PID割当がinjectiveであるという条件のもとで一意性が成立する。 |
| PID発行には有限衝突リスク予算が必要 | 採用 | `verify:pid-risk` とテストが、128-bit PIDの発行量とリスク予算を検証する。 |
| 表記変更より参照クラスPIDが安定する | 採用 | Leanが、同一参照クラスの等価表現ではclass PIDが不変であることを示す。 |
| 用途別表示がPIDを自動変更する | 不採用 | Leanが、目的別レンダリングは参照クラスPIDを自動変更しないことを示す。 |
| AGID/AOIDはAMTを再定義しない | 強く採用 | 実装はAGID/AOIDを公開参照、所有者管理、同期、QR、暗号証明の応用層として扱う。 |
| AOIDを公開住所として扱う | 不採用 | 実装テストが、AOIDのrecipient、phone、room、coordinatesの公開漏洩を拒否する。 |

## 2. 実行した検証

| 検証 | コマンド | 結果 |
|---|---|---:|
| Lean中核 | `lean formal\AMTCore.lean` | 成功 |
| Lean拡張 | `$env:LEAN_PATH='formal'; lean formal\AMTPaperExtensions.lean` | 成功 |
| PID衝突リスク予算 | `npm run verify:pid-risk` | 成功 |
| PID/AGID/AOID関連実装テスト | `npx tsx --test ...` | 82 tests pass |

実装テストには次の主なファイルを含めた。

```text
src/lib/addressMorphism.test.ts
src/lib/pidCollisionRisk.test.ts
src/lib/pidIssuanceAudit.test.ts
src/lib/pidLifecycleProof.test.ts
src/lib/aoid.test.ts
src/lib/registeredAddressQr.test.ts
src/lib/syncQueue.test.ts
src/lib/agidAoidGovernance.test.ts
src/lib/agidSelection.test.ts
src/lib/agidSecurity.test.ts
src/lib/agidHttpClient.test.ts
src/lib/aoidOwnershipProof.test.ts
src/lib/regionMembershipProof.test.ts
src/lib/qualityThresholdProof.test.ts
```

実装テストの結果は次である。

```text
tests 82
suites 1
pass 82
fail 0
duration_ms 1452.7099
```

PID衝突リスク検証の結果は次である。

```text
Hash bits: 128
Max issued: 1000000000000
Birthday upper bound: 1.4693679385263966e-15
Required bits: 119
Safety margin bits: 9
Budget: pass
```

## 3. Leanで確認できる部分

### 3.1 PID一意性はinjective assignmentに依存する

Lean定理:

```text
injective_pid_has_no_collision
distinct_entities_have_distinct_injective_pids
```

意味:

> PIDの衝突しない割当は、PID割当が参照対象に対してinjectiveである場合に成立する。

これは第19章の重要な制約である。本文では「PIDは絶対に衝突しない」と書くべきではない。安全な書き方は「AMTのPID発行規則は、参照クラス、ポリシー、監査、衝突リスク予算のもとで、衝突を避けるよう設計される」である。

### 3.2 生観測値から直接PIDを作ると衝突し得る

Lean定理:

```text
observation_based_pid_collides_on_same_observation
```

意味:

> 同じ観測値だけに依存してPIDを発行する場合、異なる対象が同じ観測値を共有すればPIDは衝突し得る。

これは、PIDを単なる住所文字列hash、郵便番号hash、AGID grid hashとして発行する危険を示す。第19章では、次の反例を入れると分かりやすい。

```text
同じ建物名、同じ郵便番号、同じ通り名を共有する二つの区画がある。
生住所文字列または粗い観測値だけでPIDを発行すると、
二つの異なる参照対象に同じPIDが割り当てられる可能性がある。
```

### 3.3 参照クラスに対するPIDは表記変更に強い

Lean定理:

```text
class_pid_invariant_under_ref_equivalence
```

意味:

> 住所表現が同じ参照クラスに属する場合、参照クラスに対して定義されたPIDは表記揺れによって変わらない。

これは第19章の肯定的な柱である。PIDは入力文字列の名前ではなく、AMTが構成した参照クラスの識別子として書くべきである。

### 3.4 用途別レンダリングはPIDを自動変更しない

Lean定理:

```text
relative_rendering_preserves_class_pid
```

意味:

> 配送、行政、不動産、表示言語などの用途に応じて住所表示が変わっても、同じ参照クラスを指すかぎり、参照クラスPIDは自動的には変わらない。

この結果は、第19章と第17章の接続になる。用途別に最適表示が変わることと、参照クラスの中核PIDが変わることは別問題である。

## 4. 実装で確認できる部分

### 4.1 PID発行監査

`pidIssuanceAudit.test.ts` は、候補生成、クラスタ、unresolvedゲート、履歴更新、PID発行を通過したことを監査エンベロープとして確認している。

確認された性質:

1. unresolved結果ではPID監査証明を発行しない。
2. history witnessなしではPID発行監査を証明しない。
3. 入力住所、postcode、private candidate ids、hidden history rootsを公開証明から除去する。
4. 改ざん署名を拒否する。
5. 同じhidden witnessとprivate audit saltではcommitmentが安定する。

これは第19章の「PIDは解決ゲート通過後の参照状態に対して発行される」という主張を実装面で補強する。

### 4.2 PID衝突リスク予算

`pidCollisionRisk.test.ts` と `npm run verify:pid-risk` は、128-bit PIDを1兆件発行する設定で、birthday upper boundがリスク予算内に収まることを確認している。

確認された性質:

1. 1兆件発行、128-bit、target risk 1e-12の設定は合格する。
2. 必要bitsは119であり、128-bitには9-bitの余裕がある。
3. 発行量が大きすぎる場合は予算違反になる。
4. 無効なリスク予算を拒否する。

本文では「暗号学的に絶対衝突しない」とは書かず、「有限発行量と明示されたリスク予算のもとで衝突リスクを評価する」と書くべきである。

### 4.3 AOIDの公開面と私的面の分離

`aoid.test.ts` と `registeredAddressQr.test.ts` は、AOIDを所有者管理の私的識別子として扱い、公開参照では個人情報を除去することを確認している。

確認された性質:

1. AOIDはowner-managed、local-first、private recordとして正規化される。
2. 不正なAOID idは拒否される。
3. unsafe cloud flagsはdowngradeされる。
4. public AOID descriptorはrecipient、phone、room、coordinatesを公開しない。
5. public AOID QRはpublic referenceとしてparseされ、owner AOIDには昇格しない。
6. malformed AOID QR payloadsはlocal registration前に拒否される。

これは第19章の「AOIDはAMT本体のPIDではなく、所有者管理や配送操作の応用識別子である」という主張を支える。

### 4.4 AGID/AOIDガバナンス

`agidAoidGovernance.test.ts` は、AGID public surfaceが私的登録住所フィールドを拒否し、AOID public communicationがpublic referenceだけを許可することを確認している。

確認された性質:

1. AGID public APIはrecipientやphoneを含むprivate registered-address fieldsを拒否する。
2. AGID private QRはlocal/private QRとして監査警告付きで許可される。
3. AOID public communicationは平文のprivate AOIDを拒否する。
4. AOID encrypted syncはowner-device envelopeを要求する。
5. audit metadataはprivate recipient、room、phone、ciphertextを露出しない。

第19章では、AGID/AOIDの通信や同期の詳細を本体論文に入れすぎず、「応用識別子の安全境界」として要約するのがよい。

### 4.5 同期キューとhybrid policy

`syncQueue.test.ts` は、AGID、registered address、AOIDの同期ポリシーの違いを確認している。

確認された性質:

1. saved AGIDはcentralRoleがnone、identityLayerがAGIDである。
2. registered addressはoptional-private-syncとして扱われる。
3. AOIDはidentityLayerがAOIDであり、owner-only fieldsをnetwork flush前にredactする。
4. AOID encrypted sync targetは暗号化envelopeのみ受理する。
5. malformed encrypted envelopesは送信されない。

これは、第19章の「公開情報と私的情報の分離」を実装面で補強する。

## 5. 採用すべき命題

### 命題19.1 PID発行ゲート命題

> PIDは、候補生成、クラスタ、unresolved判定、履歴整合性、品質、鮮度、リスク、監査可能性を満たした参照状態に対して発行される。未解決候補、生住所文字列、単一観測値だけからPIDを発行してはならない。

Lean対応:

```text
observation_based_pid_collides_on_same_observation
```

実装対応:

```text
pidIssuanceAudit.test.ts
pidCollisionRisk.test.ts
```

### 命題19.2 PID条件付き一意性命題

> PIDの衝突しない割当は、参照対象に対してPID割当がinjectiveであるという条件のもとで成立する。

Lean対応:

```text
injective_pid_has_no_collision
distinct_entities_have_distinct_injective_pids
```

### 命題19.3 参照クラスPID安定性命題

> 住所表現が同じ参照クラスへ写像される場合、参照クラスに対して発行されたPIDは表記揺れや用途別表示によって自動的には変化しない。

Lean対応:

```text
class_pid_invariant_under_ref_equivalence
relative_rendering_preserves_class_pid
```

### 命題19.4 応用識別子非再定義命題

> AGID/AOIDは、AMT本体の参照意味論を再定義するものではない。AGID/AOIDは、AMT出力を使って公開地理参照、所有者管理、配送、QR、同期、委譲、暗号証明などを行う応用識別子である。

実装対応:

```text
agidAoidGovernance.test.ts
registeredAddressQr.test.ts
syncQueue.test.ts
aoid.test.ts
```

### 命題19.5 公開私的分離命題

> AGID/AOIDを応用識別子として使う場合、公開面では公開参照だけを出し、recipient、phone、room、詳細座標、所有者権限、暗号秘密素材を露出してはならない。

実装対応:

```text
aoid.test.ts
registeredAddressQr.test.ts
agidAoidGovernance.test.ts
syncQueue.test.ts
```

## 6. 反例と修正方針

### 6.1 生住所hash PIDの反例

反例:

```text
PID = hash(rawAddressString)
```

問題:

1. 表記揺れに弱い。
2. 同じ表記が複数対象を指す場合に衝突する。
3. 履歴、品質、鮮度、監査を含まない。
4. 住所文字列の辞書攻撃を誘発する可能性がある。

修正:

```text
PID = issue(referenceClass, policyVersion, auditEnvelope, riskBudget)
```

### 6.2 未解決候補へのAGID/AOID登録の反例

反例:

```text
unresolved candidate
  -> QR issued
  -> AOID registered
  -> treated as verified PID
```

問題:

未解決候補に応用識別子を付けること自体は、仮登録やローカル保存としては可能である。しかし、それをAMT本体のverified PIDとして扱うと、unresolvedゲートが無効化される。

修正:

```text
unresolved candidate
  -> provisional/local application record
  -> no core PID issuance
  -> revalidation required
```

### 6.3 AOID公開漏洩の反例

反例:

```text
AOID public payload includes recipient, phone, room, lat, lon
```

問題:

AOIDは所有者管理や配送操作に使えるが、公開参照としてそのまま個人住所情報を出すと、住所秘匿、配送秘匿、所有権秘匿の前提が壊れる。

修正:

```text
AOID public payload = publicHandle + linked public AGID reference + audit metadata
AOID private payload = local or encrypted owner-device envelope
```

### 6.4 AGID gridをPIDと同一視する反例

反例:

```text
AGID cell = unique address entity
```

問題:

同じgrid cell内に複数の建物、階、部屋、店舗、ロッカー、私書箱、地下区画が存在する場合、AGID cellは唯一の住所実体を表さない。

修正:

```text
AGID = public geospatial or geo-semantic reference
PID = AMT resolved reference-class identifier
AOID = owner-managed operation identifier
```

## 7. 本文で避けるべき表現

| 避ける表現 | 理由 | 修正文 |
|---|---|---|
| PIDは住所のhashである | 生住所hashは衝突、辞書攻撃、履歴欠落の危険がある | PIDはAMTの参照状態に対して発行される |
| PIDは絶対に衝突しない | Lean上はinjective条件が必要で、実装上は有限リスク予算が必要 | PIDはinjective割当と衝突リスク予算のもとで管理される |
| AGIDが住所そのものである | AGIDは公開地理参照であり、部屋、所有、配送、履歴を全て表すわけではない | AGIDはAMT応用層の公開地理参照である |
| AOIDは公開住所IDである | AOIDは所有者管理、配送、委譲、私的同期を含む | AOIDは所有者管理の応用識別子である |
| AGID/AOIDの通信機能をAMT本体で証明した | 実装・応用・暗号層の話であり、本体理論とは別 | 詳細はAGID/AOID応用論文で扱う |

## 8. 限界

第19章で検証できるのは、PIDと応用識別子の設計境界である。次の点は、第19章単独では完全には検証できない。

1. AGID/AOID応用論文での全API仕様。
2. MCP、買い物Agent、Polkadot、ZK proof bundle registryとの完全統合。
3. AOID所有権移転、相続、委譲の法的・運用的妥当性。
4. 世界全域でのAGID品質保証。
5. 本格ZK回路のsoundness、zero-knowledge性、setup安全性。

これらは、AMT本体論文ではなく、応用論文または別検証ノートへ送るべきである。

## 9. 最終評価

第19章は、住所写像論の構成上かなり重要である。理由は、PID、AGID、AOIDを同じものとして書くと、理論の中核が崩れるからである。

最終的な採用方針は次である。

1. PIDはAMT本体の中核出力として残す。
2. PIDは生住所文字列の別名ではなく、参照クラス、履歴、品質、監査、リスク予算を通過した識別子として書く。
3. AGIDは公開地理参照または公開geo-semantic referenceとして扱う。
4. AOIDは所有者管理、配送、委譲、暗号証明、同期の応用識別子として扱う。
5. AGID/AOIDの通信、登録、監査、暗号証明、API、MCP、買い物Agent連携は別論文へ分離する。

この修正により、第19章は、AMT本体論文、AGID/AOID応用論文、住所写像論IIの三者を混線させないための境界章として機能する。
