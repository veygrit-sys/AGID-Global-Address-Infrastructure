# 住所写像論 日本語版 v1 付録構成・書き方見直し

作成日: 2026-06-07

対象:

- `docs/address-morphism-theory-ja-v1-appendices.md`
- `docs/address-morphism-theory-ja-v1-master.md` の付録A-G
- `docs/chapter-verification/address-morphism-theory-ja-v1-appendix-*.md`
- `docs/chapter-verification/address-morphism-theory-ja-v1-appendix-h-mathematical-catalog.md`

## 1. 結論

現行の付録は素材としては有用である。ただし、最終論文の付録としては、次の3種類が混ざっている。

| 種類 | 例 | 最終論文での扱い |
| --- | --- | --- |
| 論文付録として残すべきもの | 記法、反例、検証マップ、数理モデル総覧、用語集、可換図式 | 本文末尾に残す |
| 編集用メモとして分離すべきもの | 英語国際論文版への変換規則、PDF化方針、後続作業メモ | `editorial` または `draft-notes` に移す |
| 応用論文へ分離すべきもの | AGID/AOID詳細、ZKP詳細、MCP、Polkadot、買い物Agent | AMT本体では短く境界だけ書く |

最終版では、付録を「読者が参照する付録」と「著者が使う編集ノート」に分けるのがよい。

## 2. 現行付録の主な問題

### 2.1 付録Bと付録Hが重複している

現行の付録Bは、定義・命題・補題・定理・系一覧である。一方、付録Hも数理モデル・公理・定義・命題・補題・定理・系総覧である。

このままだと、読者は「BとHのどちらが正式な数理カタログか」を判断しにくい。

推奨:

- 付録Bは短い「主張索引」にする。
- 付録Hを正式な「数理モデル・証明責任カタログ」にする。

### 2.2 付録Fは最終論文向けではない

「英語国際論文版への変換規則」は実務上重要だが、最終論文に載せると、読者に「これは完成論文ではなく編集途中の文書」と見えやすい。

推奨:

- 最終論文からは外す。
- 別紙 `author-editing-notes` として残す。
- 英語版への変換方針は、本文の `Limitations and companion papers` に1段落だけ置く。

### 2.3 付録Dの「可」「不要」「部分可」が曖昧

検証マップで「Lean 可」「GIS 不要」などと書くと、検証済みなのか、検証可能なのか、不要なのかが曖昧になる。

推奨:

```text
proved-in-lean
formalizable
implementation-tested
gis-supported
data-source-supported
security-reviewed
conceptual
unverified
out-of-scope
```

のような検証ラベルに統一する。

### 2.4 反例集が強いが、対応する定理との紐づきが弱い

付録Cの反例集は非常に重要である。住所写像論が「完全解決器」ではなく「安全な保留を持つ理論」であることを最もよく説明できる。

ただし、反例ごとに次を明示した方がよい。

```text
反例
壊す素朴な主張
AMTの応答
対応するLean/実装/GIS検証
本文の参照章
```

### 2.5 AGID/AOID/ZKPが付録に入りすぎる危険

AGID、AOID、ZKPは重要だが、AMT本体論文の付録で詳細化しすぎると、論文の主題がぼやける。

推奨:

- AMT本体では、AGID/AOID/ZKPを「応用層」として短く扱う。
- 詳細仕様は別論文へ分ける。
- 付録では「境界表」だけ置く。

## 3. 推奨する最終付録構成

最終論文では、次の構成が最も読みやすい。

| 付録 | 題名 | 役割 |
| --- | --- | --- |
| Appendix A | Notation and Conventions | 記号、添字、状態、文脈、検証ラベルの一覧 |
| Appendix B | Claim Index and Verification Status | 本文中の定義・命題・定理の索引。詳細証明ではなく、Claim IDと検証状態を示す |
| Appendix C | Counterexamples and Failure Modes | 反例集。完全解決不能性と非発行状態の必要性を支える |
| Appendix D | Verification and Reproducibility Map | Lean、GIS、実装テスト、郵便ソース、セキュリティレビューの対応表 |
| Appendix E | Source and Data Policy | 公式ソース、OSM/NASA等、郵便API、ライセンス、鮮度、品質の扱い |
| Appendix F | Glossary | 用語集。AMT本体、検証、応用層を分ける |
| Appendix G | Diagrams and Commutative Schemes | AMT写像連鎖、非単射観測、PID発行、履歴グラフ、文脈相対性 |
| Appendix H | Mathematical Catalogue | 数理モデル、公理、定義、補題、命題、定理、系、証明責任の詳細 |
| Appendix I | Separated Companion Topics | AGID/AOID/ZKP/MCP/Polkadot等を本体から分離する対応表 |

現行の付録F「英語国際論文版への変換規則」は、上表には入れない。これは読者向け付録ではなく、著者向け編集ノートとして保存する。

## 4. 各付録の書き方

### 4.1 Appendix A: Notation and Conventions

Appendix Aは短くする。本文を読むための辞書であり、証明や検証ログを置かない。

推奨構成:

1. 時点、文脈、世界状態。
2. 実体、表現、観測。
3. 候補、クラスタ、評価、解決結果。
4. 履歴、PID、監査。
5. 検証ラベル。

書き方例:

```text
The symbol \(X_t\) denotes the set of addressable entities available under the
world state at time \(t\). It is source-bound: the notation does not assert that
all real-world entities are known to the system.
```

日本語版では次のように書く。

```text
\(X_t\) は時点 \(t\) の住所可能実体集合を表す。ただし、これはシステムが全世界の実体を完全に知っていることを意味しない。出典に登録され、検証範囲に入った実体集合として扱う。
```

### 4.2 Appendix B: Claim Index and Verification Status

Appendix Bは、本文中の主張の索引にする。証明本文はHへ送る。

各行は次の形にする。

| Claim ID | 種別 | 名称 | 本文位置 | 検証状態 | 根拠 |
| --- | --- | --- | --- | --- | --- |
| AMT-T06-01 | Theorem | 住所参照不可能性定理 | 第6章 | proved-in-lean | `no_condition_free_perfect_resolver` |
| AMT-L08-01 | Lemma | 候補欠落補題 | 第8章 | proved-in-lean, implementation-tested | `missing_entity_refutes_candidate_completeness` |
| AMT-P17-01 | Proposition | 品質しきい値非発行命題 | 第17章 | proved-in-lean, implementation-tested | `low_quality_prevents_issue` |

この形式にすると、査読者が「どの主張がどの根拠で支えられているか」を一目で追える。

### 4.3 Appendix C: Counterexamples and Failure Modes

反例集は、現在の付録の中で最も説得力がある。表を増やして、反例を定理に接続する。

推奨表:

| 反例 | 壊す素朴な主張 | AMTの応答 | 対応する根拠 |
| --- | --- | --- | --- |
| 同名ビル | 建物名だけで一意に解決できる | ambiguousまたは追加証拠要求 | 正規化衝突補題、非単射観測補題 |
| 同一郵便番号内の多数住宅 | 郵便番号だけで住戸を特定できる | 郵便番号を候補生成証拠に留める | 郵便番号衝突系 |
| 垂直衝突 | 2D座標だけで住所実体を特定できる | 垂直参照と入口粒度を追加 | 射影損失補題 |
| 旧住所の分裂 | 旧住所は必ず一つの新住所へ写る | 履歴グラフでsplit/merge/unknownを保持 | 関数的履歴遷移の限界 |

### 4.4 Appendix D: Verification and Reproducibility Map

Appendix Dは、検証方法の役割分担を見せる。ここでは「できる/できない」ではなく、「何を検証したか」を書く。

推奨表:

| 主張種別 | Lean | GIS | 実装テスト | データ検証 | セキュリティ |
| --- | --- | --- | --- | --- | --- |
| 抽象的不可能性 | proved | not applicable | regression tests | not applicable | not applicable |
| 自然地理参照 | model only | source-bound validation | rendering/search tests | source registry | abuse review |
| PID発行ゲート | proved | not applicable | audit tests | source freshness | private data review |
| ZK関連 | semantic separation only | not applicable | envelope tests | issuer/freshness | circuit audit required |

実行コマンドやログは、本文中に長く置かず、Dの末尾にまとめる。

### 4.5 Appendix E: Source and Data Policy

現行にはデータ・ソース方針が散っている。住所理論では出典範囲が非常に重要なので、独立付録にする価値がある。

内容:

1. 公式郵便・行政ソース。
2. OSM等のオープンデータ。
3. NASA等の自然地理データ。
4. 配送会社API。
5. ライセンス。
6. 鮮度。
7. 出典不足時の `unresolved`。

注意:

```text
Source coverage is not world truth. A source-bound AMT claim only ranges over
registered, licensed, and validated source material.
```

### 4.6 Appendix F: Glossary

用語集は最終論文に残す。ただし、1つの巨大表ではなく分類する。

推奨分類:

1. AMT中核概念。
2. 写像と処理。
3. 解決状態。
4. 出典と品質。
5. 履歴とPID。
6. 自然地理と文化地理。
7. 応用層。

AGID/AOID/ZKPは「応用層」と明記する。

### 4.7 Appendix G: Diagrams and Commutative Schemes

可換図式は、証明ではなく読者補助として扱う。図式ごとに、次を添える。

```text
Purpose:
What this diagram explains:
What this diagram does not prove:
Related chapter:
```

例:

```text
This diagram explains the AMT processing chain. It does not prove that the
candidate generator is complete.
```

### 4.8 Appendix H: Mathematical Catalogue

Appendix Hは最重要付録に昇格させる。現在の `chapter-verification` 下のHは、最終論文へ統合する価値が高い。

Hの構成:

1. 検証状態分類。
2. 基本記号。
3. 数理モデル。
4. 公理。
5. 定義。
6. 補題。
7. 命題。
8. 定理。
9. 系。
10. 反例との対応。
11. Lean名との対応。
12. 未形式化の証明責任。

重要:

- 「公理」はLeanの未証明公理ではなく、論文上のモデル化前提であると明記する。
- 形式証明済みと概念整理を混ぜない。
- すべての定理に「成立条件」を付ける。

### 4.9 Appendix I: Separated Companion Topics

AGID/AOID/ZKP/MCP/Polkadotを完全に消す必要はない。ただし、AMT本体の付録では分離表だけ置く。

| トピック | AMT本体で扱う範囲 | 別論文で扱う範囲 |
| --- | --- | --- |
| AGID | 公開地理参照を消費する意味論 | 桁数、base32、通信、登録、SDK |
| AOID | 私的操作住所の意味論的境界 | 所有、委譲、QR、秘密鍵、配送権限 |
| ZKP | 住所述語の意味論 | 回路、nullifier、credential、proof bundle |
| MCP | 外部Agentが使う入力/出力契約の考え方 | 実API、ツール仕様、権限モデル |
| Polkadot | public root/anchorの意味論的可能性 | on-chain設計、コスト、ガバナンス |

## 5. 最終論文に残すべき付録と外すべき付録

| 現行 | 判定 | 理由 |
| --- | --- | --- |
| 付録A 中核記法 | 残す | 読者に必要 |
| 付録B 一覧 | 残すが短縮 | 詳細はHへ移す |
| 付録C 反例集 | 強化して残す | 理論の説得力を上げる |
| 付録D 検証マップ | 強化して残す | 検証状態の透明性を上げる |
| 付録E 用語集 | 残す | 長い論文では必須 |
| 付録F 英語版変換規則 | 最終論文から外す | 編集ノートであり読者向け付録ではない |
| 付録G 可換図式 | 残す | 視覚的理解に有用 |
| 付録H 数理総覧 | 昇格して残す | 最も重要な正式カタログ |

## 6. 付録の文体ルール

### 6.1 避ける表現

| 避ける表現 | 理由 |
| --- | --- |
| 「後続で形式化」 | 曖昧。いつ、何が未検証か不明 |
| 「可」 | 検証済み、可能、不要の区別が崩れる |
| 「すべての住所」 | 無条件完全性を示唆する |
| 「商用APIに負けない」 | 評価条件なしでは過大主張 |
| 「ZKPで住所の真実性を証明」 | ZKPは述語証明であり、住所真実性は出典・issuer・AMTに依存 |

### 6.2 推奨表現

| 推奨表現 | 意味 |
| --- | --- |
| 「Leanで形式化済み」 | 抽象モデル上の証明 |
| 「実装テストで支持」 | 実装挙動の検証 |
| 「GIS出典により支持」 | 地理データ範囲内の検証 |
| 「出典範囲に限定」 | 世界完全性を主張しない |
| 「未検証のため予想として扱う」 | 過大主張を避ける |
| 「別論文で扱う」 | 本体の責任範囲を守る |

## 7. 具体的な書き換え方針

### 7.1 付録B冒頭の推奨文

```text
本付録は、本文中の主張を番号、本文位置、検証状態、根拠へ対応させる索引である。ここに掲載された項目は、すべてが同じ強度で検証されているわけではない。Leanで形式化済みの抽象定理、実装テストで支持されるシステム性質、GISまたはデータ出典で支持される経験的主張、概念整理として残す仮説、今後検証すべき主張を区別する。
```

### 7.2 付録C冒頭の推奨文

```text
本付録の反例は、住所写像論が無条件完全住所解決器を主張しない理由を示す。反例は単なる例示ではなく、非単射観測、候補欠落、射影損失、履歴分裂、文脈衝突、出典不足といった抽象構造へ対応する。
```

### 7.3 付録D冒頭の推奨文

```text
本付録は、住所写像論の主張を検証方法へ対応させる。Leanは抽象命題を、GISは地理出典と空間関係を、実装テストはパイプライン挙動を、郵便ソース検証は国別住所データの登録状態を、セキュリティレビューは漏洩と悪用可能性を扱う。これらは互いに代替しない。
```

### 7.4 付録H冒頭の推奨文

```text
本付録は、住所写像論の数理モデル、モデル化前提、定義、補題、命題、定理、系を集約する。ここでいう公理は、Leanに無証明で導入された公理ではなく、論文上のモデル化前提である。各項目には、対応する本文章、検証状態、成立条件、反例または限界を付す。
```

## 8. 推奨する編集順

1. 付録Hを最終付録へ昇格させる。
2. 付録Bを短い索引へ縮小し、詳細をHへ参照させる。
3. 付録Fを最終論文から外し、編集ノートへ移す。
4. 付録Cを「反例、壊す主張、AMT応答、根拠」の表に作り直す。
5. 付録Dの検証ラベルを統一する。
6. 付録Eを「Source and Data Policy」に変更し、現行用語集はFへ移す。
7. 付録Gの図式ごとに「何を証明しないか」を付ける。
8. 付録Iとして、AGID/AOID/ZKP等の分離表を置く。

## 9. 最終構成案

```text
Appendix A. Notation and Conventions
Appendix B. Claim Index and Verification Status
Appendix C. Counterexamples and Failure Modes
Appendix D. Verification and Reproducibility Map
Appendix E. Source and Data Policy
Appendix F. Glossary
Appendix G. Diagrams and Commutative Schemes
Appendix H. Mathematical Catalogue
Appendix I. Companion Papers and Separated Application Layers
```

この構成にすると、住所写像論本体の責任範囲が明確になる。本文は理論と主張を読みやすく述べ、付録は記法、反例、検証、数理詳細、用語を支える。AGID/AOID/ZKPは消さずに、応用層として正しい場所へ逃がせる。
