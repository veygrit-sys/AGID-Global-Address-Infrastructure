# 住所写像論 日本語版 v1 第5章 検証ノート

作成日: 2026-06-06

対象: `docs/address-morphism-theory-ja-v1-master.md` 第5章「形式的準備」

目的: 第5章で導入される世界状態、住所可能実体集合、表面表現集合、観測空間、文脈、候補生成、構造的非類似度、クラスタ、評価関数、解決結果型、履歴グラフ、PIDの記法が、Lean形式化、GIS検証、実装テストと整合しているか確認する。

## 1. 第5章の位置づけ

第5章は、AMT全体の型を揃える章である。第6章以降の不可能性定理、写像連鎖、候補生成、クラスタリング、評価関数、履歴グラフ、PID発行監査は、第5章の記号を前提にする。

この章で最も重要なのは、次の分離である。

| 分離すべき概念 | 理由 |
| --- | --- |
| 表面表現と実体 | 文字列、コード、座標は実体そのものではない。 |
| 観測と候補 | 観測から候補集合を生成するが、観測そのものは候補ではない。 |
| 候補表示とPID発行 | 候補提示は不確実性を含められるが、PID発行は長期参照を作る。 |
| 距離と非類似度 | AMTの \(D_{c,t}\) は対称性や三角不等式を満たすとは限らない。 |
| 解決と保留 | 安全な解決器は `resolved` 以外に `ambiguous`, `unresolved`, `rejected` を返す。 |
| PID一意性とハッシュ衝突リスク | 注入的PIDなら一意性を証明できるが、有限ビットPIDは衝突リスク分析が必要である。 |

## 2. 第5章の主張と検証状態

| 主張 | Claim ID | 判定 | 主な根拠 | 本文での扱い |
| --- | --- | --- | --- | --- |
| 世界状態 \(W_t\) は時刻依存である | CH05-C01 | 定義として採用 | 履歴・鮮度・GIS証明書 | 具体的データ構造ではなく状態スキーマとして置く。 |
| 住所可能実体集合 \(X_t\) は点集合ではない | CH05-C02 | 強く採用 | 第3章検証、自然地理テスト | 点、線、面、体積、社会的対象を含む。 |
| 表面表現集合 \(S_t\) と観測空間 \(Y_t\) は分ける | CH05-C03 | 強く採用 | 第4章検証 | 解析写像を追加するとより正確。 |
| 観測写像 \(O_t:X_t\to Y_t\) は一般に非単射 | CH05-C04 | Leanで支持 | `no_condition_free_perfect_resolver`, `normalization_collision_prevents_perfect_resolution` | 第6章の前提として強く採用。 |
| 文脈 \(c\) によって粒度と最適表現が変わる | CH05-C05 | Leanで支持 | `conflicting_context_optima_prevent_absolute_address` | 第14章の相対性へ接続。 |
| 候補生成は再現率を優先する | CH05-C06 | Leanで支持 | `missing_entity_refutes_candidate_completeness`, `missing_candidate_prevents_issue` | 候補欠落は後段で回復できない。 |
| \(D_{c,t}\) は通常の距離でなくてよい | CH05-C07 | Leanで支持 | `asymmetric_dissimilarity_not_symmetric` | 非類似度と呼ぶのが安全。 |
| 評価関数は真理ではなく選択規則である | CH05-C08 | Leanで支持 | `ScoreSelectable`, `score_selection_requires_threshold` | 閾値とマージンを明示する。 |
| 解決結果型は保留状態を含む | CH05-C09 | Leanで支持 | `ResolutionOutcome`, `Abstains` | `resolved` だけの関数にしない。 |
| 履歴は単純関数ではなくグラフで扱う | CH05-C10 | Leanで支持 | `LineageGraph`, `functional_transition_cannot_represent_split` | Address Lineageの基礎。 |
| PID発行には候補、評価、品質、鮮度、リスク条件が必要 | CH05-C11 | Leanと実装で支持 | `IssueAdmissible`, PID audit tests | 候補表示と明確に分ける。 |

## 3. 再実行した検証

| 検証 | コマンド | 結果 | 第5章への意味 |
| --- | --- | --- | --- |
| Lean中核形式化 | `lean formal\AMTCore.lean` | pass | 解決結果型、候補健全性、評価選択、PID発行ゲート、非単射観測、非対称非類似度、PID衝突条件が通る。 |
| Lean拡張形式化 | `$env:LEAN_PATH='formal'; lean formal\AMTPaperExtensions.lean` | pass | 履歴グラフ、参照保存的改名、GIS証明書、ソース検証、証明束ポリシーが通る。 |
| GIS Lean証明書 | `npm run verify:gis:lean` | pass | GIS検証結果をLean証明書として受理できる。 |
| 第5章関連の実装テスト | `npx tsx --test ...` | pass, 58 tests | AMT候補解決、自然・郵便ソース、PID衝突リスク、PID監査、履歴merge/split、品質、鮮度、住所検証が通る。 |

実装テストには、`addressMorphism.test.ts`, `addressMorphismSources.test.ts`, `pidCollisionRisk.test.ts`, `pidIssuanceAudit.test.ts`, `pidLifecycleProof.test.ts`, `addressTabQuality.test.ts`, `addressCredentialFreshnessProof.test.ts`, `addressVerificationEngine.test.ts` を含めた。

## 4. Leanで支えられる形式的部品

| Lean名 | 内容 | 第5章への接続 |
| --- | --- | --- |
| `ResolutionOutcome` | `resolved`, `ambiguous`, `unresolved`, `rejected` を同じ型で扱う。 | 解決結果型 \(\mathcal{R}(X_t)\) の形式的核。 |
| `Abstains` | 保留状態が実体を発行しないことを表す。 | 安全な未解決処理。 |
| `ResolvesEntity` | 出力が特定実体を解決する条件。 | resolvedの意味を明確化。 |
| `CandidateComplete` | 真候補が候補集合に含まれる条件。 | 候補生成の再現率原則。 |
| `CandidateSound` | 解決結果が候補集合由来である条件。 | 候補外発行の禁止。 |
| `OutcomeCandidateSound` | `ResolutionOutcome` でも候補健全性を定義する。 | 保留型つき解決器の健全性。 |
| `ScoreSelectable` | 閾値とマージンを満たす場合だけ選択可能。 | 評価関数 \(E_{c,t}\) の安全条件。 |
| `IssueAdmissible` | 候補所属、評価、品質、鮮度、リスクをまとめた発行条件。 | PID発行ゲート。 |
| `issueIfAdmissible` | 条件を満たす場合だけ発行し、そうでなければ未解決を返す。 | 候補表示とPID発行の分離。 |
| `asymmetric_dissimilarity_not_symmetric` | 非対称な非類似度は対称距離として扱えない。 | \(D_{c,t}\) を距離ではなく非類似度と呼ぶ根拠。 |
| `LineageGraph` | 履歴グラフの構造。 | \(G_H=(V_H,E_H)\) の補強。 |
| `append_only_lineage_preserves_node` | append-onlyな履歴拡張では既存ノードが保たれる。 | 履歴保存則。 |
| `injective_pid_has_no_collision` | 注入的PID割当なら衝突しない。 | PID一意性の条件付き定理。 |
| `observation_based_pid_collides_on_same_observation` | 観測だけに基づくPIDは同一観測で衝突する。 | 表面表現や観測から直接PIDを作らない根拠。 |

## 5. 主張別検証

## 5.1 CH05-C01 世界状態 \(W_t\)

本文の \(W_t\) は、住所可能実体、名称、行政規則、郵便規則、配送制約、地図データ、自然地理データ、歴史データ、権威レコード、履歴遷移を含む状態として置かれている。この方向は有効である。

ただし、\(W_t\) を完全な実世界そのものと読ませると強すぎる。検証可能なのは、AMTが参照する登録済みデータ、出典、履歴、ルール、証明書の状態である。本文では次の限定が必要である。

> \(W_t\) は世界そのものではなく、時刻 \(t\) にAMTが参照可能な住所意味論的状態である。

この限定により、未登録データや未知の行政変更を無理に含めた完全世界モデルにならない。

## 5.2 CH05-C02 住所可能実体集合 \(X_t\)

\(X_t\) を単なる座標点集合ではないとする本文は、第3章検証と整合する。道路、橋、川、湖、島、山、砂漠、湿地、遺跡、行政区域、配送ロッカー、仮想住所などを含める方針はよい。

ただし、\(X_t = \{x \mid x \text{ is addressable at time } t\}\) は美しいが、実装上は「登録または推定可能な住所可能実体」と「理論上存在する住所可能実体」を分けるべきである。候補生成器が知らない実体は、後段では回復できない。

推奨:

\[
X_t^{world} \quad \text{and} \quad X_t^{known} \subseteq X_t^{world}
\]

ここで \(X_t^{known}\) はAMTが時刻 \(t\) に扱える登録済みまたは推定可能な実体集合である。

## 5.3 CH05-C03 表面表現集合と観測空間

本文は \(S_t\) と \(Y_t\) を分けており、これは第4章と整合する。一方で、現在の本文では住所可能実体から観測への写像 \(O_t:X_t\to Y_t\) が置かれている。

これは第6章の非単射定理には便利だが、現実には一つの実体が複数の表面表現や観測を持つ。したがって、本文では関数版と関係版を併記すると安全である。

推奨:

\[
Obs_t \subseteq X_t \times Y_t
\]

または

\[
O_t : X_t \to 2^{Y_t}
\]

必要に応じて、証明を簡単にするための縮約モデルとして \(O_t:X_t\to Y_t\) を使う、と明記する。

## 5.4 CH05-C05 文脈

文脈 \(c\in C\) を明示する方針は強く採用できる。配送、消防、行政、登記、観光、自然地理検索、災害支援、ロボット配送では、同じ表面住所でも必要な粒度が異なる。

Leanの `conflicting_context_optima_prevent_absolute_address` は、衝突する文脈に対して絶対的に最適な住所表現が存在しないことを支える。第5章では、\(R_{c,t}\), \(\Gamma_{c,t}\), \(D_{c,t}\), \(E_{c,t}\) のように文脈を添字に入れる方針を採用してよい。

## 5.5 CH05-C06 候補生成写像

本文の \(\Gamma_{c,t}:S_t\to 2^{X_t}\) は分かりやすい。ただし、第4章の整理に合わせるなら、表面表現を一度観測へ変換した後に候補生成するとより正確である。

推奨:

\[
\alpha_t:S_t\to Y_t
\]

\[
\Gamma_{c,t}:Y_t\to \mathcal{P}_{fin}(X_t^{known})
\]

ここで \(\mathcal{P}_{fin}\) は有限候補集合を表す。実装上の候補集合は有限であり、Leanでもリストとして扱われているためである。

候補生成の再現率原則は強く採用できる。Leanの `missing_entity_refutes_candidate_completeness` と `missing_candidate_prevents_issue` は、真候補が候補集合に含まれない場合、後段で正しく発行できないことを支える。

## 5.6 CH05-C07 構造的非類似度

\(D_{c,t}:X_t\times X_t\to\mathbb{R}_{\geq 0}\) を通常距離ではなく構造的非類似度と呼ぶ方針は正しい。建物から部屋への詳細化と、部屋から建物への一般化は同じ意味を持たない。旧住所から新住所への対応も方向性を持つ。

Leanの `asymmetric_dissimilarity_not_symmetric` は、この境界を支える。本文では「距離」という語を使う場合も、数学的距離空間の公理を仮定しないと明記する。

## 5.7 CH05-C08 評価関数

評価関数 \(E_{c,t}:K\to\mathbb{R}\) は、真理ではなく証拠に基づく選択規則である。この本文は正しい。Leanの `ScoreSelectable` は、単に最高スコアを選ぶのではなく、閾値と二番手との差、つまりマージンが必要であることを表す。

本文では、次のように足すと強い。

> 評価関数は、最大値を返すだけでは十分でない。最良候補が閾値を満たし、かつ次点候補との分離マージンが十分である場合にのみ選択可能である。

## 5.8 CH05-C09 解決結果型

本文の

\[
\mathcal{R}(X_t)=\{\mathrm{resolved}(x)\mid x\in X_t\}\cup\{\mathrm{ambiguous},\mathrm{unresolved},\mathrm{rejected}\}
\]

はLeanの `ResolutionOutcome` とよく対応する。これは強く採用できる。

ただし、後続章との整合を考えると、`resolved(x)` よりも `resolved(ref)` または `resolved(k)` と書ける場合がある。PIDは個別候補 \(x\) ではなく、クラスタまたは参照クラスに対して発行されることがあるからである。

推奨:

\[
\mathcal{R}(A)=\{\mathrm{resolved}(a)\mid a\in A\}\cup\{\mathrm{ambiguous},\mathrm{unresolved},\mathrm{rejected}\}
\]

ここで \(A\) は用途に応じて候補実体、クラスタ、参照クラスのいずれにもできる抽象型である。

## 5.9 CH05-C10 履歴グラフ

履歴を有向グラフ \(G_H=(V_H,E_H)\) として扱う方針は強く採用できる。Lean拡張の `LineageGraph` と append-only 系補題は、履歴拡張により既存ノードや辺が保存されることを支える。

ただし、履歴グラフは常にappend-onlyとは限らない。訂正、失効、削除要求、秘匿化、法的抹消が必要な場合がある。論文本体では、監査可能な公開履歴と、秘匿・訂正可能な運用履歴を区別すると安全である。

## 5.10 CH05-C11 PID

PIDを入力表面表現ではなく、AMTの解決ゲートを通過した参照に対して発行する方針は強く採用できる。Leanの `IssueAdmissible` は、PID発行に候補所属、評価条件、品質、鮮度、リスクが必要であることを表す。

一方で、PIDの一意性は注意が必要である。Leanの `injective_pid_has_no_collision` は、PID割当が注入的である場合の定理である。現在の実装のようにSHA-256上位128ビットなど有限ビットハッシュを使う場合、数学的な完全無衝突ではなく、衝突リスクの上界評価になる。

本文では次のように書くのが安全である。

> PIDが注入的割当として定義される抽象モデルでは、異なる参照対象が同じPIDを持たないことを証明できる。有限ビットのハッシュベースPIDでは、無衝突性は絶対定理ではなく、発行数とビット長に基づく衝突リスク評価として扱う。

## 6. 弱めるべき表現

| 危険な表現 | 安全な表現 |
| --- | --- |
| \(W_t\) は現実世界全体である | \(W_t\) はAMTが参照可能な住所意味論的状態である。 |
| \(X_t\) は全住所可能実体の完全集合である | \(X_t^{known}\) は登録済みまたは推定可能な実体集合である。 |
| 観測写像は常に関数である | 実務上は観測関係または集合値写像であり、関数版は縮約モデルである。 |
| 候補生成は正確さが最重要である | 初段では真候補を落とさない再現率が重要である。 |
| \(D_{c,t}\) は距離である | \(D_{c,t}\) は非類似度であり、距離公理を仮定しない。 |
| 評価関数最大の候補を常に選ぶ | 閾値、マージン、品質、鮮度、リスクを満たす場合だけ選ぶ。 |
| 解決器は常に住所を返す | 安全な解決器は曖昧、未解決、拒否を返せる。 |
| PIDは住所文字列のハッシュである | PIDは参照クラスまたは発行対象のゲート通過後に発行される。 |
| ハッシュPIDは絶対に衝突しない | 有限ビットPIDは衝突リスク分析で扱う。 |

## 7. 最終判定

第5章は、AMT全体の形式的基礎として採用できる。現在の構成は良いが、後続章の厳密性を上げるには、次の修正が重要である。

1. `W_t` を「現実世界そのもの」ではなく「AMTが参照可能な住所意味論的状態」と定義する。
2. `X_t_world` と `X_t_known` を分ける。
3. `S_t`, `Y_t`, `Obs_t`, `alpha_t`, `Gamma_{c,t}` を分ける。
4. 候補生成の出力は有限候補集合として扱う。
5. `D_{c,t}` は距離ではなく非類似度と明記する。
6. 評価関数は真理ではなく、閾値とマージンを持つ選択規則とする。
7. 解決結果型には `ambiguous`, `unresolved`, `rejected` を必ず含める。
8. PID一意性は注入モデルと有限ビットリスクモデルを分ける。

この整理により、第5章は単なる記法章ではなく、第6章以降の定理、実装、GIS検証、PID監査を正確に接続する基礎章になる。
