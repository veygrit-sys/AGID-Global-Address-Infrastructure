# 住所写像論 日本語版 v1 第12章 検証ノート

対象: `docs/address-morphism-theory-ja-v1-master.md` 第12章「履歴グラフと住所保存則」

目的: 第12章のうち、Lean、実装テスト、PID lifecycle proof、PID発行監査、AMN解決エンベロープで確認できた主張を整理する。

## 0. 結論

第12章は、AMTの時間構造を定義する章として採用できる。

ただし、「住所保存則」という名前は強いので、本文では物理学的な絶対保存ではなく、次のように限定する必要がある。

> AMTにおける住所保存則とは、住所参照の変化を、削除や上書きではなく、履歴グラフ上の追加エッジ、分岐、統合、失効、訂正、対応不明として記録し、既に受理された履歴トレースを消さないという設計原理である。

検証済みの核は次である。

1. 住所履歴は現在値だけでは不十分である。
2. 住所履歴は有向グラフ \(G_H=(V_H,E_H)\) として扱える。
3. append-onlyな履歴拡張は、既存ノード、既存エッジ、既存トレースを保存する。
4. 分割履歴は、旧状態から新状態への単純関数では表せない。
5. PID履歴更新、PID merge、PID split は、実装上の公開証明として検証できる。
6. mergeではsource PIDのretireとlineage保存を確認する。
7. splitではsource PIDのretire、lineage保存、隠れた分割partitionの非重複を確認する。
8. 履歴root、秘密イベントID、秘密候補IDなどは公開証明から隠せる。
9. 未解決、失効、訂正、対応不明は失敗ではなく、履歴グラフの明示的状態として扱うべきである。

第12章で書いてはいけないのは、「住所は必ず消滅しない」「旧住所には必ず一意の現在住所が存在する」「PIDは永久に同じ実体を指す」という表現である。これらは反例が多く、Leanで証明できる範囲を超える。

## 1. 検証コマンド

| 種別 | コマンド | 結果 |
| --- | --- | --- |
| Lean core | `lean formal\AMTCore.lean` | pass |
| Lean extensions | `$env:LEAN_PATH='formal'; lean formal\AMTPaperExtensions.lean` | pass |
| GIS + Lean certificate | `npm run verify:gis:lean` | pass |
| 実装テスト | `npx tsx --test src\lib\pidLifecycleProof.test.ts src\lib\pidIssuanceAudit.test.ts src\lib\addressMorphism.test.ts src\lib\addressMorphismNetwork.test.ts src\lib\pidCollisionRisk.test.ts src\lib\addressCredentialFreshnessProof.test.ts src\lib\apiEndpoints.test.ts src\lib\openApiSpec.test.ts` | 55 tests pass |

## 2. 第12章の主張別判定

| 主張 | 判定 | 根拠 | 本文での扱い |
| --- | --- | --- | --- |
| 住所は現在値だけでは不十分 | 支持 | 履歴グラフ、実装のhistory update | 強く書ける |
| 住所履歴はグラフとして扱う | Leanで支持 | `LineageGraph` | 強く書ける |
| append-only更新は既存ノードを保存 | Leanで証明済み | `append_only_lineage_preserves_node` | 定理として書ける |
| append-only更新は既存エッジを保存 | Leanで証明済み | `append_only_lineage_preserves_edge` | 定理として書ける |
| append-only更新は有限トレースを保存 | Leanで証明済み | `append_only_lineage_preserves_trace` | 定理として書ける |
| 分割は単純関数で表せない | Leanで証明済み | `functional_transition_cannot_represent_split` | 反例兼定理として書ける |
| 旧住所から現住所へ常に一意写像できる | 反証される | split/merge/reassignment | 書いてはいけない |
| 住所保存則は絶対法則 | 不採用 | 記録喪失、災害、紛争、矛盾出典 | 運用公理に弱める |
| PID履歴更新は公開証明できる | 実装で支持 | `pidLifecycleProof.test.ts` | 応用実装として書ける |
| PID mergeはsource retireとlineage保存が必要 | 実装で支持 | `mergeSourcesRetired`, `lineagePreserved` | 強く書ける |
| PID splitはpartition非重複が必要 | 実装で支持 | `partitionsDisjoint` | 強く書ける |
| 履歴rootや秘密イベントを公開せず監査できる | 実装で支持 | `stripPrivatePidLifecycleProofMaterial` | 監査設計として書ける |

## 3. Leanで検証された履歴グラフモデル

### 3.1 LineageGraph

Leanでは、履歴グラフを最小限の構造として定義している。

```lean
structure LineageGraph (Node : Type u) where
  nodePresent : Node -> Prop
  edgePresent : Node -> Node -> Prop
```

これは本文の

\[
G_H=(V_H,E_H)
\]

に対応する。ここで \(V_H\) は住所状態、実体状態、PID状態、仮想住所状態などを含み、\(E_H\) は改称、継承、分割、統合、失効、再割当、訂正などを表す。

### 3.2 append-only拡張

Leanの `LineageExtends` は、後続の履歴証拠が古い履歴を削除しないことを表す。

```lean
def LineageExtends {Node : Type u}
    (old new : LineageGraph Node) : Prop :=
  (forall node, old.nodePresent node -> new.nodePresent node) /\
  (forall source target,
    old.edgePresent source target -> new.edgePresent source target)
```

この定義は、住所保存則を絶対法則ではなく、履歴台帳の保存性として読むための中核である。

### 3.3 保存されるもの

| Lean定理 | 意味 |
| --- | --- |
| `append_only_lineage_preserves_node` | append-onlyな更新では、過去に存在したノードが新グラフにも存在する。 |
| `append_only_lineage_preserves_edge` | append-onlyな更新では、過去に存在したエッジが新グラフにも存在する。 |
| `append_only_lineage_preserves_trace` | 旧グラフで成立した有限履歴トレースは、新グラフでも成立する。 |

したがって、第12章の保存則は次のように形式化できる。

\[
G_H \preceq G'_H
\]

ならば、

\[
V_H \subseteq V'_H,\qquad E_H \subseteq E'_H
\]

であり、旧履歴上の有限トレースも新履歴で失われない。

## 4. 単純関数では分割を扱えない

第12章の重要な反例は、旧住所から新住所への関係を

\[
f:X_{\mathrm{old}}\to X_{\mathrm{new}}
\]

のような単一関数にしてしまうことの失敗である。

Leanでは次の形で証明されている。

```lean
def RepresentsSplit {Past Future : Type u}
    (transition : Past -> Future)
    (source : Past)
    (first second : Future) : Prop :=
  transition source = first /\
  transition source = second /\
  (first = second -> False)

theorem functional_transition_cannot_represent_split
    {Past Future : Type u}
    (transition : Past -> Future)
    (source : Past)
    (first second : Future) :
    ¬ RepresentsSplit transition source first second
```

意味は単純である。一つの旧状態が、二つの異なる未来状態へ分割される場合、通常の関数は同じ入力に二つの異なる出力を返せない。

したがって本文の

\[
L\subseteq X_{\mathrm{old}}\times X_{\mathrm{new}}
\]

または履歴グラフとして扱う、という判断は正しい。

## 5. 住所保存則の正しい射程

### 5.1 採用できる表現

採用できる。

> 住所保存則は、住所状態が単純に消えないという形ではなく、参照の変更が履歴グラフ上に記録されるべきだというAMTの設計原理である。

採用できる。

> append-onlyな履歴更新の下では、既に受理された住所状態、遷移、履歴トレースは削除されない。

採用できる。

> 対応不明も履歴情報である。

### 5.2 採用できない表現

採用しない。

> 住所は消滅しない。

理由: 記録喪失、非公式地名の消滅、災害、紛争、出典矛盾、再割当がある。

採用しない。

> 旧住所は必ず現在住所へ一意に写像できる。

理由: split/merge/reassignmentに反例がある。

採用しない。

> PIDは永久に同じ実体を指す。

理由: 建替え、分筆、合筆、誤発行訂正、社会的移転がある。

## 6. PID lifecycle proofで確認された履歴操作

実装の `pidLifecycleProof.ts` は、第12章のPID継承・訂正・merge/splitを公開監査可能な形にしている。

### 6.1 history-update

`pidLifecycleProof.test.ts` は、PID履歴更新について次を確認している。

| 確認項目 | 内容 |
| --- | --- |
| `operation.kind` | `history-update` |
| `primaryPid` | 更新対象PID |
| `previousSequence`, `nextSequence` | 履歴列番号 |
| `eventCount` | 追加イベント数 |
| `sequenceAdvancedByEventCount` | 履歴がイベント数だけ進んだ |
| `historyRootChanged` | 履歴rootが変化した |
| 秘密情報 | previous/next history root、hidden event idを公開しない |

これは、第12章の「履歴更新は上書きではなくイベント追加である」という主張に対応する。

### 6.2 merge

PID mergeでは、実装が次を確認している。

| 条件 | 意味 |
| --- | --- |
| `fromPids` | 統合されるsource PID群 |
| `intoPid` | 統合先PID |
| `allSourcePidsRetired` | source PIDがretireされる |
| `targetLineageIncludesSources` | 統合先lineageがsourceを含む |
| `conflictResolution` | same-place、manual-audit、delivery-evidenceなど |
| `lineagePreserved` | lineage保存が公開claimに入る |

したがって、mergeは単なるID置換ではない。sourceを残したまま同じ意味で使い続けると二重参照になるため、source retireとlineage保存が必要である。

### 6.3 split

PID splitでは、実装が次を確認している。

| 条件 | 意味 |
| --- | --- |
| `sourcePid` | 分割元PID |
| `targetPids` | 分割後PID群 |
| `sourcePidRetired` | 分割元PIDをretireする |
| `targetLineageIncludesSource` | target lineageがsourceを含む |
| `partitions` | targetごとの秘密候補集合 |
| `partitionsDisjoint` | hidden partitionが重複しない |

特に `rejects split proofs with overlapping hidden partitions` は、同じ秘密候補を複数targetへ割り当てる不正なsplitを拒否する。

これは、第12章の「分割は候補集合または履歴説明を返すべきである」という本文を実装側で補強する。

## 7. 監査と秘匿

第12章はZKP論文ではないが、履歴監査の公開範囲は整理しておく必要がある。

`pidLifecycleProof.test.ts` は、公開証明から次が漏れないことを確認している。

| 非公開にできる情報 | テスト上の確認 |
| --- | --- |
| previous history root | 公開envelopeに含まれない |
| next history root | 公開envelopeに含まれない |
| hidden event id | 公開envelopeに含まれない |
| hidden source history root | merge公開証明に含まれない |
| hidden target history root | merge公開証明に含まれない |
| hidden candidate id | split公開証明に含まれない |
| private lifecycle salt | strip後に含まれない |
| local cache key | strip後に含まれない |

一方で、公開されるものは次である。

| 公開される情報 | 目的 |
| --- | --- |
| operation kind | history-update/merge/splitの区別 |
| primary PID | 対象PID |
| source/target PID | merge/splitの公開lineage |
| sequence | 履歴が進んだこと |
| event count | 追加イベント数 |
| policy gates | retire、lineage保存、partition非重複 |
| commitments | 秘密 witness へのコミットメント |
| issuer | 誰が証明を発行したか |

したがって、第12章では「履歴を監査できる」と書ける。ただし「すべての履歴内容を公開する」とは書かない方がよい。

## 8. 対応不明の重要性

本文の「対応不明も履歴情報である」は強く採用すべきである。

AMTでは、未知状態は単なる欠落ではなく、次のような明示的状態として扱う。

| 状態 | 意味 |
| --- | --- |
| `unknown_successor` | 後継が不明 |
| `retired` | 状態が失効した |
| `superseded_by` | 新状態または新PIDに置換された |
| `corrected_to` | 過去の誤りが訂正された |
| `reassigned` | 同じ名称や番号が別実体へ再割当された |
| `virtualized_as` | 災害・運用上の仮想住所に写像された |

これにより、「情報がない」と「対応関係が不明だと確認されている」を分けられる。

## 9. 第12章に追加できる命題

### 命題12.1 履歴ノード保存命題

append-onlyな履歴拡張では、旧履歴グラフで存在した住所状態は、新履歴グラフでも存在する。

根拠:

```text
append_only_lineage_preserves_node
```

### 命題12.2 履歴エッジ保存命題

append-onlyな履歴拡張では、旧履歴グラフで存在した遷移エッジは、新履歴グラフでも存在する。

根拠:

```text
append_only_lineage_preserves_edge
```

### 命題12.3 履歴トレース保存命題

append-onlyな履歴拡張では、旧履歴グラフ上の有限トレースは、新履歴グラフでも有効である。

根拠:

```text
append_only_lineage_preserves_trace
```

### 命題12.4 分割非関数性命題

旧住所状態が二つ以上の異なる未来状態へ分割される場合、その遷移は単一関数では表せない。

根拠:

```text
functional_transition_cannot_represent_split
```

### 命題12.5 PID merge/split監査命題

PID merge/splitは、source retire、lineage保存、partition非重複を公開条件として検証できる。

根拠:

```text
pidLifecycleProof.test.ts
```

## 10. 反例

| 反例 | 何を壊すか | AMT上の扱い |
| --- | --- | --- |
| 旧町名が複数の新町名へ分かれる | 一意写像 | `split_into` |
| 複数区画が再開発で一つになる | 単純なPID継続 | `merged_into` |
| 建物名が別の場所で再利用される | 名称だけの同一性 | `reassigned` |
| 会社が移転する | 物理同一性と社会的同一性の混同 | `relocated_to` |
| 災害で通常住所が使えなくなる | 現在住所だけの参照 | `virtualized_as` |
| 旧データが誤っていた | 削除だけの履歴管理 | `corrected_to` |
| 後継関係が資料不足で不明 | 完全保存 | `unknown_successor` |

## 11. 第12章の最終判断

第12章は採用できる。ただし、保存則の表現は慎重にするべきである。

最終的な立場は次でよい。

> 住所は現在値ではなく、時間的に更新される参照グラフである。AMTの住所保存則は、住所が物理的に消滅しないという主張ではなく、受理済みの住所状態、遷移、履歴トレースをappend-onlyな履歴グラフで保持し、分割、統合、失効、訂正、対応不明を明示的に記録するという設計原理である。

この形なら、Lean検証、実装テスト、PID lifecycle proof と整合する。
