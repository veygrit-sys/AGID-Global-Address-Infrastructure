# 住所写像論 日本語版 v1 第10章 追加・編集差分案

対象: `docs/address-morphism-theory-ja-v1-master.md` 第10章

目的: 第10章「未解決状態の理論」を、検証済みのLean命題、実装挙動、PID発行監査に合わせて強化する。

## 1. 編集方針

第10章では、次の考え方を明確にする。

```text
未解決 = 失敗
```

ではなく、

```text
未解決 = 誤発行を避ける安全な停止
```

である。

この章は、第6章の不可能性定理、第8章の候補生成、第9章のクラスタ、第11章のPID発行を接続する安全ゲートの章として書く。

## 2. 章冒頭に追加する定義整理

10.1の直後に、次を追加するとよい。

> AMTにおける未解決状態は、単なる例外処理ではない。住所観測が非単射であり、候補生成、クラスタリング、履歴対応、品質評価、鮮度確認、リスク評価のいずれかに不十分性が残る場合、解決器は一点の実体を返すべきではない。このとき `ambiguous`、`unresolved`、`rejected` は、誤ったPID発行を防ぐための正式な出力である。

## 3. 10.2 の状態表を修正する

現在の表は良いが、`conditional` の位置付けを少し弱める。

修正後:

| 状態 | 意味 | PID発行 | 検証上の位置付け |
| --- | --- | --- | --- |
| `resolved(x)` | 証拠が一意の許容実体 \(x\) を支持する | 追加ゲート通過時のみ可 | 基本状態 |
| `ambiguous` | 複数の候補クラスタが残り、十分に分離できない | 不可 | Leanで検証済み |
| `unresolved` | 候補、証拠、品質、鮮度、粒度、履歴、文脈が不足する | 不可 | Leanで検証済み |
| `rejected` | 入力、出典、ポリシー、信頼条件に違反する | 不可 | Leanで検証済み |
| `conditional` | 追加情報があれば解決可能な補助状態 | 条件充足後のみ可 | UI/API上の追加状態 |

追加本文:

> `conditional` は、実装やUIにとって重要な状態である。ただし、数理的な基本停止状態としては、`ambiguous`、`unresolved`、`rejected` に還元して扱える。たとえば、部屋番号が不足している場合は、利用者に追加情報を要求するUI上の `conditional` であるが、PID発行規則上は `resolved + admissible` を満たすまで非発行である。

## 4. 10.3 ambiguous を強化する

現在の本文に次を追加する。

> `ambiguous` は、候補生成の失敗ではない。むしろ、候補生成が広く働いた結果、複数の有力候補が残っている状態である。重要なのは候補数そのものではなく、最良候補と第二候補を分離する証拠が十分かどうかである。

数理表現:

\[
\operatorname{Ambiguous}(o)
\quad\Longleftarrow\quad
\exists x,y \in C(o),\ x \neq y,\
\Delta E(x,y) < \mu
\]

ここで、\(C(o)\) は観測 \(o\) から生成された候補集合、\(\Delta E(x,y)\) は候補間の評価差、\(\mu\) は曖昧性マージンである。

注意:

> この式は十分条件であり、完全な定義ではない。実装では確率、エントロピー、文脈、品質、出典衝突も併用する。

## 5. 10.4 unresolved を強化する

理由コードの前に、次を追加する。

> `unresolved` は、候補がゼロの状態に限られない。候補が存在しても、その候補を安全に採用するための証拠が不足していれば `unresolved` である。したがって、`unresolved` は「何も知らない」ではなく、「現在の証拠ではPID発行に十分でない」という判定である。

数理表現:

\[
\operatorname{Unresolved}(o)
\quad\Longleftarrow\quad
C(o)=\varnothing
\ \lor\
E(x^\*) > \theta
\ \lor\
Q(x^\*) < q
\ \lor\
F(x^\*) < f
\ \lor\
R(x^\*) > r
\]

ここで、\(x^\*\) は暫定最良候補、\(E\) はエネルギー、\(Q\) は品質、\(F\) は鮮度、\(R\) はリスクである。

追加する理由コード:

| 理由コード | 意味 |
| --- | --- |
| `no_candidates` | 候補が存在しない。 |
| `weak_evidence` | 候補はあるが証拠が弱い。 |
| `high_energy` | 最良候補のエネルギーが高すぎる。 |
| `near_tie` | 最良候補と第二候補の差が小さい。 |
| `low_quality` | 内部品質スコアがしきい値未満である。 |
| `stale_evidence` | 出典またはcredentialが古い。 |
| `risk_exceeds_budget` | 衝突、誤解決、漏洩などのリスクが予算を超える。 |
| `granularity_missing` | 部屋、階、入口、区画などの粒度が不足する。 |
| `history_uncertain` | 旧住所、新住所、分割、統合の履歴対応が不明である。 |
| `natural_boundary_uncertain` | 川、湖、山、島、砂漠など自然地物の境界が不安定である。 |

## 6. 10.5 rejected を unresolved と明確に分ける

現在の本文に次の表を追加する。

| 状態 | 原因 | 追加証拠で解決可能か | 例 |
| --- | --- | --- | --- |
| `unresolved` | 証拠不足 | 可能な場合が多い | 出典不足、部屋番号不足、履歴未確認 |
| `ambiguous` | 候補衝突 | 可能な場合が多い | 同名地名、同名建物、複数候補 |
| `rejected` | 処理禁止 | 原則として不可 | ライセンス違反、危険入力、ポリシー違反、形式破壊 |

追加本文:

> `rejected` は、将来の証拠追加を待つ状態ではない。処理すべきでない入力、使用すべきでない出典、または規約・法令・安全方針に反する要求を明示的に止める状態である。

## 7. 10.6 conditional の修正

`conditional` は基本状態と書きすぎない方がよい。

修正文:

> `conditional` は、AMTの実装・UI・APIにおいて有用な補助状態である。これは、追加情報を要求できる `unresolved` または `ambiguous` の説明付き表現とみなせる。たとえば「建物までは解決したが部屋番号が不足している」「湖は特定できたが岸・地点・用途が不足している」「旧住所は候補に対応するが分割履歴が未確認である」といった場合、システムは単に `unresolved` と返すのではなく、必要な追加条件を明示できる。

数理表現:

\[
\operatorname{Conditional}(o)
=
(\operatorname{BaseOutcome}(o),\ \operatorname{RequiredEvidence}(o))
\]

ここで、\(\operatorname{BaseOutcome}(o)\) は `ambiguous`、`unresolved`、`rejected` のいずれかであり、\(\operatorname{RequiredEvidence}(o)\) は追加で必要な情報集合である。

## 8. 状態遷移の表現を強化する

現在の遷移図に、理由を付ける。

```text
unresolved  -> ambiguous    候補が追加されたが複数候補が残る
unresolved  -> resolved     十分な証拠が追加される
ambiguous   -> resolved     追加文脈により候補が分離される
conditional -> resolved     必要条件が満たされる
conditional -> unresolved   必要証拠が得られない
resolved    -> unresolved   後発の矛盾、失効、履歴不明が見つかる
resolved    -> rejected     使用禁止データ、危険入力、ポリシー違反が判明する
resolved    -> superseded   行政変更、建物変更、PID merge/split により置換される
```

追加本文:

> 解決状態は、永久に固定された真理ではない。AMTにおける解決結果は、時刻、出典、履歴、品質、文脈、リスク予算に依存する。そのため、一度 `resolved` になった対象でも、新しい矛盾、失効、行政変更、建物変更、merge/split により `unresolved`、`rejected`、または `superseded` へ遷移し得る。

## 9. 10.8 非発行安全性命題をLean対応にする

章末の命題を、次のように拡張する。

### 命題10.1 非解決状態の非発行性

`ambiguous`、`unresolved`、`rejected` は、任意の実体を解決済みとして返さない。

形式:

\[
s \in \{\mathrm{ambiguous},\mathrm{unresolved},\mathrm{rejected}\}
\Rightarrow
\neg \mathrm{ResolvesEntity}(x,s)
\]

検証対応:

```text
ambiguous_resolves_no_entity
unresolved_resolves_no_entity
rejected_resolves_no_entity
```

### 命題10.2 偽実体非発行性

`ambiguous`、`unresolved`、`rejected` は、偽の実体を発行しない。

形式:

\[
s \in \{\mathrm{ambiguous},\mathrm{unresolved},\mathrm{rejected}\}
\Rightarrow
\neg \mathrm{EmitsFalseEntity}(x,s)
\]

検証対応:

```text
ambiguous_emits_no_false_entity
unresolved_emits_no_false_entity
rejected_emits_no_false_entity
```

### 命題10.3 許容条件不足による停止

候補包含、スコア分離、品質、鮮度、リスクのいずれかが不足する場合、PID発行は許容されない。

形式:

\[
\neg \operatorname{IssueAdmissible}(C,x)
\Rightarrow
\operatorname{Outcome}(C,x)=\mathrm{unresolved}
\]

検証対応:

```text
issue_if_not_admissible_abstains
missing_candidate_prevents_issue
high_energy_prevents_issue
low_margin_prevents_issue
low_quality_prevents_issue
stale_freshness_prevents_issue
high_risk_prevents_issue
```

## 10. 本文で避けるべき表現

| 避ける表現 | 理由 | 修正文 |
| --- | --- | --- |
| 未解決は失敗である | AMTでは安全出力 | 未解決は安全な停止である。 |
| 候補が一つなら解決済み | 弱証拠の場合がある | 候補、証拠、品質、鮮度、リスクを満たす必要がある。 |
| ambiguous は候補生成失敗 | むしろ候補生成が広く働いた可能性 | ambiguous は複数候補が残る状態である。 |
| conditional はLeanで証明済み基本状態 | 現在のLean型には未導入 | conditional はUI/API上の補助状態である。 |
| resolved はPID発行可能 | 第11章の許容述語が必要 | resolved でも許容ゲート通過時のみPID発行可能。 |
| rejected は未解決の一種 | 拒否と証拠不足は異なる | rejected は処理禁止状態である。 |

## 11. 第10章の推奨構成

第10章は、最終的に次の構成にするとよい。

1. 未解決は失敗ではない
2. 解決結果の基本型
3. `ambiguous`: 複数候補と残差不確実性
4. `unresolved`: 証拠不足と非発行
5. `rejected`: 処理禁止状態
6. `conditional`: 追加情報要求状態
7. 状態遷移と履歴グラフ
8. 理由コードと監査ログ
9. PID発行ゲートとの接続
10. 非発行安全性命題
11. 反例
12. まとめ

## 12. 章末に入れるまとめ文

第10章の末尾に、次を入れるとよい。

> AMTの解決器は、常に一点の住所実体を返す装置ではない。観測が非単射であり、候補が欠落し、証拠が弱く、候補間の差が小さく、品質・鮮度・リスク条件が不足する場合、正しい動作は `ambiguous`、`unresolved`、または `rejected` として停止することである。これらの停止状態を正式な型として持つことにより、AMTは誤ったPID発行、誤配送、誤監査、誤った同一性固定を避けることができる。

## 13. 採用優先度

| 変更 | 優先度 |
| --- | --- |
| `conditional` を補助状態に修正 | 最優先 |
| `ambiguous` と `unresolved` の数理条件を追加 | 高 |
| Lean対応命題10.1-10.3を追加 | 高 |
| 理由コードを監査ログと接続 | 高 |
| 状態遷移に理由を付ける | 中 |
| 反例表を追加 | 中 |

## 14. 最終判断

第10章は、住所写像論の信頼性を決める中心章である。本文の方向性は正しい。修正すべき点は、`conditional` を検証済み基本型として扱わず、UI/API上の補助状態として整理することだけである。

この修正を入れれば、第10章はLean検証、実装テスト、PID監査モデルと整合する。
