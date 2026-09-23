# 住所写像論 日本語版 v1 第11章 検証ノート

対象: `docs/address-morphism-theory-ja-v1-master.md` 第11章「安全な解決とPID発行」

目的: 第11章のうち、Lean、実装テスト、PID衝突リスク検証、PID発行監査、AMN解決エンベロープで確認できた主張を整理する。

## 0. 結論

第11章は、AMTの実装可能性と安全性を結ぶ重要章として採用できる。

特に、次の主張は検証済みである。

1. 候補表示、解決判定、PID発行は別の操作である。
2. PID発行は、候補包含、スコア分離、品質、鮮度、リスクの条件を満たす場合にだけ許される。
3. PID発行が行われた場合、発行条件はLean上で復元可能である。
4. 発行されたPIDの対象は、候補集合に含まれていなければならない。
5. 発行許容条件が満たされない場合、解決器は発行せず `unresolved` へ落ちる。
6. 生の住所観測から直接PIDを作ると、非単射観測の下で衝突する。
7. 注入的PIDなら理論上の衝突は起きないが、有限長ハッシュPIDは衝突リスク予算で扱う必要がある。
8. 実装では、128ビットAMT PIDについて、発行量と許容リスクに基づく誕生日境界を検証している。
9. PID発行監査は、候補生成、クラスタリング、未解決ゲート、履歴更新、PID発行を通過したことを公開証明として残せる。
10. AMN解決エンベロープは、入力住所、生候補、生クラスタ、受取人、AOID、電話番号、正確な私的座標を公開せず、公開コミットメントとして扱う。

本文で注意すべき最大の点は、PIDを「世界の絶対真理」または「絶対に衝突しない識別子」と書かないことである。第11章では、PIDを「宣言されたAMT手続きとリスク予算の下で発行が許容された参照識別子」と定義するのが正確である。

## 1. 検証コマンド

| 種別 | コマンド | 結果 |
| --- | --- | --- |
| Lean core | `lean formal\AMTCore.lean` | pass |
| Lean extensions | `$env:LEAN_PATH='formal'; lean formal\AMTPaperExtensions.lean` | pass |
| GIS + Lean certificate | `npm run verify:gis:lean` | pass |
| 実装テスト | `npx tsx --test src\lib\addressMorphism.test.ts src\lib\pidCollisionRisk.test.ts src\lib\pidIssuanceAudit.test.ts src\lib\pidLifecycleProof.test.ts src\lib\addressMorphismNetwork.test.ts src\lib\qualityThresholdProof.test.ts src\lib\addressCredentialFreshnessProof.test.ts src\lib\apiEndpoints.test.ts src\lib\openApiSpec.test.ts` | 62 tests pass |

## 2. 第11章の主張別判定

| 主張 | 判定 | 根拠 | 本文での扱い |
| --- | --- | --- | --- |
| 候補表示とPID発行は別操作 | 支持 | `resolveAddressMorphism`, PID null tests | 強く書ける |
| PID発行は許容述語を必要とする | Leanで支持 | `IssueAdmissible` | 強く書ける |
| 許容条件を満たす発行は候補包含を保証する | Leanで証明済み | `issue_if_admissible_emits_candidate` | 定理として書ける |
| 発行条件は復元可能 | Leanで証明済み | `issue_if_admissible_requires_conditions` | 監査可能性として書ける |
| 許容条件がなければ発行しない | Leanで証明済み | `issue_if_not_admissible_abstains` | 強く書ける |
| スコアしきい値と候補間マージンが必要 | Leanで証明済み | `ScoreSelectable`, `tied_evidence_prevents_score_selection` | 強く書ける |
| 品質、鮮度、リスク条件が必要 | Leanで証明済み | `low_quality_prevents_issue`, `stale_freshness_prevents_issue`, `high_risk_prevents_issue` | 強く書ける |
| 直接文字列PIDは危険 | Leanで証明済み | `observation_based_pid_collides_on_same_observation` | 強く書ける |
| PIDは絶対無衝突 | 不採用 | 有限長ハッシュのため | 書いてはいけない |
| 128ビットPIDの衝突リスクは予算で検証可能 | 実装で支持 | `pidCollisionRisk.test.ts` | 条件付きで書く |
| PID監査証明は生住所を隠せる | 実装で支持 | `pidIssuanceAudit.test.ts` | 応用・監査設計として書く |
| AMNエンベロープは公開コミットメント化できる | 実装で支持 | `addressMorphismNetwork.test.ts` | 応用層として書く |

## 3. Leanで検証された発行許容モデル

### 3.1 スコア選択条件

Leanでは、低いエネルギーをよい候補として扱い、最良候補がしきい値以下で、かつ第二候補から十分に離れていることを要求する。

```lean
def ScoreSelectable
    (bestEnergy secondEnergy threshold margin : Nat) : Prop :=
  bestEnergy <= threshold /\ bestEnergy + margin <= secondEnergy
```

対応する命題:

| Lean定理 | 意味 |
| --- | --- |
| `score_selection_requires_threshold` | 最良候補のエネルギーがしきい値を超えると選択不可。 |
| `tied_evidence_prevents_score_selection` | 第二候補との差が小さいと選択不可。 |
| `score_selection_conditions_are_recoverable` | 選択可能なら、しきい値条件とマージン条件を復元できる。 |

本文の `ClusterUnique` と `E(k_2)-E(k^\*) >= m` は、このLeanモデルに対応する。

### 3.2 PID発行許容述語

Leanの `IssueAdmissible` は、候補包含、スコア、品質、鮮度、リスクを発行条件としてまとめる。

```lean
def IssueAdmissible
    (candidates : List Entity)
    (entity : Entity)
    (bestEnergy secondEnergy energyThreshold margin : Nat)
    (qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit : Nat) :
    Prop :=
  entity ∈ candidates /\
  ScoreSelectable bestEnergy secondEnergy energyThreshold margin /\
  qualityThreshold <= qualityScore /\
  freshnessAge <= freshnessLimit /\
  riskScore <= riskLimit
```

第11章本文の `Admissible` は、この定義をより実務的に拡張したものとみなせる。

| 本文の条件 | Lean対応 |
| --- | --- |
| `CoverageOK` | `entity ∈ candidates` |
| `ClusterUnique` | `ScoreSelectable` |
| `QualityOK` | `qualityThreshold <= qualityScore` |
| `Fresh` | `freshnessAge <= freshnessLimit` |
| `RiskOK` | `riskScore <= riskLimit` |
| `HistoryOK` | 実装のPID lifecycle / history update tests |
| `AuditReady` | `issue_if_admissible_requires_conditions`, PID audit tests |

### 3.3 発行時に条件が復元できる

`issue_if_admissible_requires_conditions` は、発行が起きたなら、発行許容条件が存在し、出力が選択実体と一致することを返す。

これは第11章の監査可能性の数理的中核である。

### 3.4 発行された実体は候補集合に含まれる

`issue_if_admissible_emits_candidate` は、発行された実体が候補集合に含まれることを保証する。

これは、PID発行が候補生成を飛ばして行われてはならないことを示す。

### 3.5 許容条件がなければ発行しない

`issue_if_not_admissible_abstains` は、許容条件が満たされなければ `unresolved` として停止することを示す。

さらに、次の定理群が発行不可条件を個別に支える。

| Lean定理 | 第11章での意味 |
| --- | --- |
| `missing_candidate_prevents_issue` | 候補欠落では発行しない。 |
| `high_energy_prevents_issue` | 最良候補が弱ければ発行しない。 |
| `low_margin_prevents_issue` | 候補間マージン不足なら発行しない。 |
| `low_quality_prevents_issue` | 品質不足なら発行しない。 |
| `stale_freshness_prevents_issue` | 鮮度不足なら発行しない。 |
| `high_risk_prevents_issue` | リスク過大なら発行しない。 |

## 4. PIDと衝突リスク

### 4.1 注入的PIDモデル

Leanでは、PID関数が注入的なら、同じPIDから同じ実体が導ける。

```lean
theorem injective_pid_has_no_collision
```

また、異なる実体には同じPIDが付かない。

```lean
theorem distinct_entities_have_distinct_injective_pids
```

ただしこれは理想モデルである。

### 4.2 有限長ハッシュPID

実装の `buildAddressPid` は、正規化されたcanonical情報から `AMT-` 接頭辞付きの128ビット相当PIDを作る。

実装テストでは、次を確認している。

| 条件 | 結果 |
| --- | --- |
| 1兆件発行、許容衝突リスク `1e-12` | pass |
| 1000兆件発行、許容衝突リスク `1e-12` | fail |
| 1兆件、`1e-12` に必要なビット数 | 119ビット |
| 128ビット | 1兆件では予算内 |
| 96ビット | 1兆件では予算超過 |

したがって本文では、次のように書くべきである。

> PIDは有限長識別子であるため、絶対無衝突とは主張しない。PID安全性は、発行量、ビット長、許容衝突確率に基づくリスク予算として管理する。

### 4.3 意味論上の衝突

第11章本文の重要な指摘は正しい。

PIDビット列が衝突しなくても、誤ったクラスタへPIDを発行すれば、意味論上の衝突が起きる。

そのため、PID安全性は二層で扱う。

| 層 | 危険 | 対策 |
| --- | --- | --- |
| ビット列衝突 | 有限長ハッシュの誕生日衝突 | ビット長、発行量、衝突リスク予算 |
| 意味論上の誤発行 | 誤クラスタ、旧住所誤対応、弱証拠 | AMT発行ゲート、履歴、品質、監査 |

## 5. 直接住所PIDの危険

Leanの `observation_based_pid_collides_on_same_observation` は、同じ観測を持つ異なる実体に対して、観測だけからPIDを作れば同じPIDになることを示す。

これは第11章に必ず入れるべき警告である。

```text
同じ住所文字列 -> 同じPID
```

としてしまうと、次のケースで危険である。

| 例 | 危険 |
| --- | --- |
| 同名建物 | 別建物を同一PIDにする。 |
| 同名地名 | 別地域を同一PIDにする。 |
| 建物の階・部屋違い | 垂直参照を失う。 |
| 旧住所の分割 | 複数現在住所を一つへ潰す。 |
| 正規化衝突 | 異なる表記が同じ正規形になる。 |

したがって、PIDは住所文字列から直接作るのではなく、候補生成、クラスタリング、未解決ゲート、履歴、品質、鮮度、リスク、監査を通った参照から発行する必要がある。

## 6. 実装で確認できるPID発行

### 6.1 `resolveAddressMorphism`

実装では、`resolveAddressMorphism` が `verified` または `partial` のときだけPIDを返す。

```ts
pid: status.status === 'verified' || status.status === 'partial'
  ? selected?.pid ?? null
  : null
```

近接タイや弱証拠ではPIDが `null` になる。

### 6.2 PID発行監査

`pidIssuanceAudit.test.ts` は、PID発行監査証明が次のステップを含むことを確認している。

1. candidate-generation
2. clustering
3. unresolved-gate
4. history-update
5. pid-issuance

また、公開証明から次の秘密情報が漏れないことを確認している。

| 隠す情報 | テスト上の確認 |
| --- | --- |
| 入力住所本文 | `Tokyo Station`, `Marunouchi` が公開証明に含まれない |
| 郵便番号 | `1000005` が公開証明に含まれない |
| 履歴root | private history root が含まれない |
| 候補ID | private candidate id が含まれない |
| local cache key | 公開証明から除去される |

これは、第11章の監査可能性が「秘密情報の公開」ではなく「コミットメントによる手続き検証」であることを支える。

### 6.3 unresolved ではPID監査証明を作らない

`pidIssuanceAudit.test.ts` では、`unresolved` の結果に対してPID発行監査証明を作ろうとすると拒否される。

これは第10章と第11章の接続点である。

## 7. AMN解決エンベロープ

`addressMorphismNetwork.test.ts` は、AMN解決エンベロープが、AMT解決結果から公開可能な証明面を作ることを確認している。

確認されている公開識別子:

| 識別子 | 形式 |
| --- | --- |
| PID | `AMT-[0-9A-F]{32}` |
| RPID | `RPID-[0-9A-F]{32}` |
| DPID | `DPID-[0-9A-F]{32}` |

確認されている秘匿対象:

1. input-address
2. raw-candidates
3. raw-clusters
4. recipient
5. aoid
6. phone
7. exact-private-coordinates

本文では、AMNやRPID/DPIDは応用層として扱い、AMT本体はPID発行ゲートまでに限定するのがよい。

## 8. 反例と注意点

| 反例 | 危険 | 本文での対策 |
| --- | --- | --- |
| 候補表示されたものにPIDを発行する | 検索候補を権威化する | 候補表示、解決、PID発行を分ける。 |
| `resolved` だけでPIDを発行する | 品質・鮮度・リスク不足 | `Admissible` を必須にする。 |
| 生住所文字列からPIDを作る | 非単射観測で衝突 | 候補・クラスタ・履歴・監査後に発行する。 |
| PIDは絶対衝突しないと書く | 有限長ハッシュに反する | 衝突リスク予算として管理する。 |
| PIDビット列だけを安全とみなす | 意味論上の誤発行を見落とす | AMT発行ゲートを必要にする。 |
| 監査のために住所本文を公開する | プライバシー侵害 | コミットメントと最小公開にする。 |
| 応用識別子をAMT本体に混ぜる | 理論が肥大化する | AMT本体とAGID/AOID/AMN応用を分ける。 |

## 9. 第11章へ追加できる命題

### 命題11.1 発行条件復元命題

PID発行が行われたなら、発行許容条件が存在し、出力は選択実体に一致する。

根拠:

```text
issue_if_admissible_requires_conditions
```

### 命題11.2 候補包含発行命題

PID発行された実体は、候補集合に含まれる。

根拠:

```text
issue_if_admissible_emits_candidate
```

### 命題11.3 非許容停止命題

発行許容条件が満たされない場合、解決器は発行せず `unresolved` へ落ちる。

根拠:

```text
issue_if_not_admissible_abstains
```

### 命題11.4 直接観測PID衝突命題

二つの実体が同じ観測を持つなら、観測だけから作ったPIDは同じになる。

根拠:

```text
observation_based_pid_collides_on_same_observation
```

### 命題11.5 注入的PID無衝突命題

PID割当が注入的であるなら、同じPIDを持つ実体は同一である。

根拠:

```text
injective_pid_has_no_collision
distinct_entities_have_distinct_injective_pids
```

ただし、有限長ハッシュPIDでは、この命題はそのまま実装保証にならない。実装では衝突リスク予算を別途確認する。

## 10. 総合評価

第11章は、AMTの中核実装を説明する章として非常に重要である。

採用判定:

| 項目 | 評価 |
| --- | --- |
| 数理的根拠 | 強い |
| Lean検証 | 強い |
| 実装対応 | 強い |
| 監査モデルとの接続 | 強い |
| 修正が必要な点 | PIDを絶対無衝突・絶対真理と書かない |

最終評価:

> 第11章は採用できる。本文では、PIDを「条件付きで発行が許容された参照識別子」と定義し、候補表示、解決判定、PID発行、監査証明、応用識別子を明確に分けるべきである。
