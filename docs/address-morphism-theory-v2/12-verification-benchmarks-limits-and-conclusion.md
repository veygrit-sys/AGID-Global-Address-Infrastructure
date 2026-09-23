# 第12章 検証・ベンチマーク・限界・結論

## 12.0 互換ノート

本章は、現行29章構成における第21章「検証と再現性」、第23章「ベンチマークと比較」、第24章「ケーススタディ」、第25章「限界」、第26章「結論」を保存し、v2構成の第12章として再記述する。

第1章から第11章までは、住所写像論の対象、候補生成、同値類、安全解決、履歴、確率、非標準参照、プライバシー境界を定義した。本章は、それらがどこまで検証され、どこから先は未検証であり、どのように比較し、どの順序で研究と実装を進めるべきかを定義する。

本章の基本主張は次である。

- AMTは、検証可能な理論でなければならない。
- 論文中の主張は、定義、反例、fixture、テスト、ベンチマーク、非主張のいずれかへ接続されるべきである。
- ケーススタディは有用だが、世界全体の証明ではない。
- 商用住所検証APIとの比較は、同一条件・同一地域・同一データ権利・同一評価指標で行わなければならない。
- 「全世界対応」「完全解決」「ZK安全」「商用APIに勝つ」といった主張は、現時点では安全ではない。
- AMTは完成して終わる理論ではなく、地域・用途・データソース・失敗時挙動ごとに進化し続ける基礎理論である。

本章の中心式は次である。

\[
\operatorname{ClaimStatus}(c)
\in
\{
\operatorname{verified},
\operatorname{partial},
\operatorname{unverified},
\operatorname{blocked}
\}
\]

\[
\operatorname{Publishable}(c)=1
\Rightarrow
\operatorname{ClaimStatus}(c)\neq\operatorname{blocked}
\land
\operatorname{NonClaimAttached}(c)=1
\]

AMTは、自分がまだ証明していないことを明示できる理論であるべきである。

---

## 12.1 検証マップ

検証マップを次で定義する。

\[
\mathcal{V}
=
\{(c,a,t,r,n)\}
\]

ここで、

- \(c\): claim。
- \(a\): artifact。
- \(t\): test。
- \(r\): residual risk。
- \(n\): non-claim。

各主張は、少なくとも次のいずれかへ接続される。

```text
definition
formal proposition
counterexample
fixture
test
benchmark
case study
non-claim
residual risk
```

検証マップの目的は、論文を厚く見せることではない。読み手が「この主張はどこまで確認済みか」を追跡できるようにすることである。

---

## 12.2 主張状態

主張状態を次で定義する。

```text
verified
partial
unverified
blocked
```

意味は次である。

| state | meaning | publication behavior |
| --- | --- | --- |
| verified | 定義、fixture、テスト、または再現可能な評価がある | 主張可能 |
| partial | 一部地域、一部用途、一部データで確認済み | 範囲限定で主張 |
| unverified | 理論上の仮説、または検証計画段階 | 仮説として記述 |
| blocked | 誤解・危険・誇大・法的/倫理的問題がある | 主張禁止 |

形式化すると次である。

\[
\operatorname{Verified}(c)
\Rightarrow
\exists a,t:
\operatorname{Supports}(a,t,c)
\]

\[
\operatorname{Blocked}(c)
\Rightarrow
\operatorname{Publishable}(c)=0
\]

---

## 12.3 再現性要件

AMTの再現性要件は次である。

- 入力fixtureが公開または合成可能である。
- raw住所、recipient、秘密鍵、witnessを含まない。
- 出典版が明記される。
- 地域・用途・目的が明記される。
- 期待結果が明記される。
- 失敗時挙動が明記される。
- 非主張が明記される。
- 実行コマンドが明記される。

再現可能なfixtureを次で表す。

\[
F
=
(
\operatorname{id},
\operatorname{region},
\operatorname{purpose},
\operatorname{inputClass},
\operatorname{expectedState},
\operatorname{sourcePolicy},
\operatorname{nonClaims}
)
\]

---

## 12.4 ベンチマーク設計

AMTのベンチマークは、単一スコアでは不十分である。

評価領域は次である。

```text
normalization
candidate_generation
structural_equivalence
safe_resolution
history_graph
probabilistic_decision
cross_domain_reference
privacy_boundary
end_to_end_protocol
```

各ベンチマークは、次の指標を持つ。

- recall。
- precision。
- abstention accuracy。
- manual review precision。
- false PID issuance rate。
- public signal leak score。
- source coverage。
- freshness。
- reproducibility。
- latency。
- failure-mode clarity。

AMTでは、必ず解を返すことを高評価にしない。危険な場合に abstain できることを評価する。

---

## 12.5 失敗時挙動ベンチマーク

住所システムの品質は、成功時だけでなく失敗時に現れる。

失敗時挙動を次で定義する。

\[
\operatorname{FailureBehavior}(x)
\in
\{
\operatorname{safe\_abstain},
\operatorname{manual\_review},
\operatorname{blocked},
\operatorname{unsafe\_accept},
\operatorname{silent\_misresolution}
\}
\]

安全なシステムは、候補不足、出典不足、低品質、対立、プライバシー漏えい時に unsafe_accept を返さない。

\[
\operatorname{UnsafeAcceptRate}
=
\frac{
|\{x:\operatorname{FailureBehavior}(x)=\operatorname{unsafe\_accept}\}|
}{
|X|
}
\]

AMTでは、UnsafeAcceptRate を主要な安全指標とする。

---

## 12.6 商用APIとの比較

Loqate、Experian、Melissa、Smarty、Google、Mapbox、HERE、TomTom、OpenStreetMap系ジオコーダなどと比較する場合、次を守る。

- 同一入力セット。
- 同一地域。
- 同一言語。
- 同一目的。
- 同一評価者。
- 同一ライセンス条件。
- 同一失敗時分類。
- raw住所を公開しない合成または許諾済みデータ。

比較結果は、勝利宣言ではなく条件付き評価として書く。

\[
\operatorname{Better}(A,B,D,M)
\]

は、「データセット \(D\)、指標 \(M\)、条件 \(C\) の下で A が B より良い」ことを表す。

\[
\operatorname{Better}(A,B,D,M)
\centernot\Rightarrow
\operatorname{GloballyBetter}(A,B)
\]

---

## 12.7 ケーススタディの扱い

ケーススタディは、理論の有用性を示す。しかし、一般定理ではない。

ケーススタディを次で定義する。

\[
\operatorname{CaseStudy}
=
(
\operatorname{region},
\operatorname{purpose},
\operatorname{dataSource},
\operatorname{fixtures},
\operatorname{result},
\operatorname{limits}
)
\]

ケーススタディから言えること。

- この地域・用途ではモデルが動いた。
- この失敗時挙動を確認した。
- このデータ出典ではこの品質だった。
- この未検証項が残った。

ケーススタディから言ってはいけないこと。

- 全世界で動く。
- 全住所に対して完全である。
- 全商用APIに勝つ。
- ZK安全性が暗号監査済みである。
- 候補生成が完全である。

---

## 12.8 S優先未検証項

現時点の最優先未検証項は次である。

| priority | item | safe wording |
| --- | --- | --- |
| S | 世界規模の候補生成完全性 | 候補生成の十分性を地域別に検証する |
| S | 多言語検索のリコール | 多言語展開はリコール層であり、同一性証明ではない |
| S | 自然地理・文化地理の世界カバレッジ | 対応可能な地物型を拡張中 |
| S | GIS strict validation | hard error 0 と strict warning 0 を分ける |
| S | 商用API同条件比較 | 評価条件別比較として扱う |
| S | 実ZK回路安全性 | ZK-ready と実回路監査を分ける |
| S | AGID/AOID本番セキュリティ | 脅威モデル、鍵管理、失効、公開/非公開境界が必要 |

これらは、論文の弱点ではなく、研究計画の正直な境界である。

---

## 12.9 地域・用途・データソース・失敗時挙動への分解

未検証項は、次の4軸に分解する。

\[
U
=
Region
\times
Purpose
\times
Source
\times
FailureBehavior
\]

例:

```text
Region: JP, KE, HK, AE, island states, disputed regions, oceans
Purpose: delivery, identity, postal-equivalent, ZK predicate, public PID
Source: official, OSM, gazetteer, community, carrier, synthetic
FailureBehavior: unresolved, manual_review, blocked, unsafe_accept
```

この分解により、「全世界で未検証」という大きすぎる問題を、実験可能な単位へ落とせる。

---

## 12.10 Publication Safety Gate

公開前に、各主張を次のゲートへ通す。

```text
claim has scope
claim has source
claim has fixture or proof
claim has non-claim
claim has residual risk
claim avoids universal wording unless proven
claim does not expose raw address
claim does not imply sovereignty
claim does not overstate ZK safety
```

危険な表現は次である。

- 完全に全世界対応。
- すべての住所を解決。
- 商用API不要。
- 世界初。
- ZKで完全安全。
- 住所を完全匿名化。
- 係争地域を確定。
- 郵便番号なし地域を完全解決。

安全な表現は次である。

- 対象地域で検証済み。
- 候補生成の十分性を仮定。
- failure behavior を記録。
- ZK-ready。
- 実回路監査は未完了。
- 中立的な地域識別子。
- 商用API比較は同一条件で計画。

---

## 12.11 OSS readiness

OSSとして公開できる状態は、次を満たす必要がある。

- READMEが目的と非主張を説明している。
- LICENSEがある。
- DATA_LICENSESがある。
- raw住所を含まない。
- fixtureが合成または公開許諾済みである。
- テストがある。
- CIまたはローカル検証コマンドがある。
- セキュリティ境界が書かれている。
- commercial/private boundary が分かれている。
- issue template がある。
- contribution policy がある。

AMTでは、理論文書だけではなく、実行可能なモデル、反例、fixture、検証コマンドがOSS readinessを上げる。

---

## 12.12 Grant readiness

Ethereum Foundation、Protocol Labs、NLnet、Mozilla、Internet Society、UNICEF Venture Fund などへ見せるには、次が必要である。

- 一つの強いend-to-end demo。
- no-postcode region での postal-equivalent validation。
- AMT -> interop contract -> ZK predicate -> validation の同一fixture。
- threat model。
- circuit-readiness matrix。
- non-claims。
- reproducible tests。
- privacy-preserving fixture。
- governance and abuse boundary。
- roadmap with measurable milestones。

強いデモの例:

```text
postal-code-less region
  -> AGID area
  -> postal-equivalent zone
  -> validation decision
  -> AMT envelope
  -> proof-ready predicate
  -> no raw address disclosure
```

---

## 12.13 ベンチマーク・コーパス

合成コーパスは、raw住所を扱わずに検証するために重要である。

必要なコーパス種別:

- 正常住所。
- 表記ゆれ。
- 多言語。
- 旧地名。
- 郵便番号なし地域。
- 郵便番号弱い地域。
- 島しょ部。
- ロッカー・PUDO。
- 高層階。
- 港湾。
- 海域。
- 文化地理。
- 災害避難所。
- 係争・中立ラベル。
- ZK proof-only。
- public signal leak。
- unsafe accept。

コーパスは、成功例だけではなく、失敗例と反例を含むべきである。

---

## 12.14 検証済みモデル一覧

現時点で実行可能モデルに変換されたv2章は次である。

```text
3  住所対象と登録可能実体
4  公理・記法・安全な棄却
5  候補生成と出典政策
6  構造距離と住所同値類
7  有限推定と安全解決
8  履歴グラフ、PID保存、社会的連続性
9  確率、品質、エントロピー、意思決定
10 自然地理・文化地理・垂直参照・クロスドメイン参照
11 プロトコル・プライバシー・ガバナンス・悪用境界
12 検証・ベンチマーク・限界・結論
```

第1章と第2章は導入・関連研究の性格が強いため、直接の数理モデルよりも、用語、主張、非主張、関連研究マトリクス、評価導入として検証される。

---

## 12.15 限界

AMTの限界は次である。

### 世界規模完全性

全世界の全住所、全建物内区画、全自然地理、全文化地理、全臨時拠点を候補生成できることは未証明である。

### 出典依存性

AMTは出典を使う。出典が欠ける地域では、unresolved、manual_review、limited が増える。

### 政策依存性

係争地域、プライバシー境界、公開PID、緊急時開示は政策依存である。

### ZK実装

ZK-readyな仕様と、監査済み実ZK回路は異なる。

### 商用比較

商用APIとの厳密比較は、同一条件のベンチマークが必要である。

### データ権利

住所データ、郵便番号、行政区画、POI、建物データには権利がある。OSSではライセンス境界が重要である。

---

## 12.16 反例

### 反例12.1 ケーススタディは世界証明ではない

\[
\operatorname{CaseStudy}(r)=\operatorname{success}
\centernot\Rightarrow
\operatorname{GlobalValidity}=1
\]

### 反例12.2 hard error 0 は strict warning 0 ではない

\[
\operatorname{HardError}=0
\centernot\Rightarrow
\operatorname{StrictWarning}=0
\]

### 反例12.3 OSS fixture成功は実データ成功ではない

\[
\operatorname{SyntheticFixturePass}=1
\centernot\Rightarrow
\operatorname{RealWorldPass}=1
\]

### 反例12.4 ZK-ready は監査済みZKではない

\[
\operatorname{ZKReady}=1
\centernot\Rightarrow
\operatorname{AuditedCircuit}=1
\]

### 反例12.5 商用API比較計画は勝利宣言ではない

\[
\operatorname{ComparisonPlan}=1
\centernot\Rightarrow
\operatorname{CommercialWinner}=1
\]

---

## 12.17 命題と定理

**命題12.1 検証可能性要件。**  
公開主張は、定義、証明、反例、fixture、テスト、ベンチマーク、非主張の少なくとも一つに接続されるべきである。

\[
\operatorname{Publishable}(c)=1
\Rightarrow
\exists a:
\operatorname{SupportsOrBounds}(a,c)
\]

**命題12.2 ケーススタディの非普遍性。**

\[
\operatorname{CaseStudySuccess}(c)
\centernot\Rightarrow
\operatorname{UniversalClaim}(c)
\]

**命題12.3 未検証項の分解可能性。**

\[
U
=
Region
\times
Purpose
\times
Source
\times
FailureBehavior
\]

**定理12.1 誇大主張ブロック定理。**  
主張が universal wording を含み、その範囲を支える検証マップを持たない場合、その主張は blocked である。

\[
\operatorname{UniversalWording}(c)=1
\land
\operatorname{GlobalEvidence}(c)=0
\Rightarrow
\operatorname{ClaimStatus}(c)=\operatorname{blocked}
\]

**定理12.2 安全比較定理。**  
商用APIまたは既存手法との比較は、同一データ、同一指標、同一目的、同一失敗時分類がある場合にのみ安全な比較主張となる。

\[
\operatorname{FairComparison}(A,B)=1
\Rightarrow
D_A=D_B
\land
M_A=M_B
\land
P_A=P_B
\land
F_A=F_B
\]

**定理12.3 未検証誠実性定理。**  
未検証項を明示することは、理論の否定ではなく、検証可能性の条件である。

\[
\operatorname{UnverifiedDeclared}(u)=1
\Rightarrow
\operatorname{PublicationSafetyIncreases}
\]

---

## 12.18 実装アルゴリズム

公開前の主張検査は次である。

```text
1. claim を抽出する
2. scope を確認する
3. supporting artifacts を確認する
4. tests / fixtures / benchmark を確認する
5. universal wording を検出する
6. raw address, witness, secret が含まれないか確認する
7. non-claim があるか確認する
8. residual risk を記録する
9. verified / partial / unverified / blocked を返す
```

擬似コードは次である。

```text
evaluateClaim(claim):
  if containsUnsafeUniversalWording(claim) and not hasGlobalEvidence(claim):
    return blocked

  if containsRawAddressOrSecret(claim.artifacts):
    return blocked

  if hasRunnableTest(claim) and hasNonClaim(claim):
    return verified

  if hasBoundedCaseStudy(claim) and hasScope(claim):
    return partial

  return unverified
```

---

## 12.19 実装フック

本章に対応する実装・検証フックは次である。

- verification map validator
- claim status classifier
- benchmark readiness scorer
- unsafe universal wording detector
- non-claim requirement gate
- raw address fixture blocker
- fair comparison gate
- S-priority risk register
- case study boundary checker
- publication safety gate

最低限のfixtureは次である。

| fixture | expected result | purpose |
| --- | --- | --- |
| verified-claim-with-test | verified | 検証済み主張 |
| case-study-only | partial | ケーススタディ境界 |
| global-completeness-claim | blocked | 誇大主張 |
| zk-ready-claim | partial | ZK-ready境界 |
| audited-zk-claim-without-audit | blocked | 暗号監査境界 |
| commercial-comparison-plan | unverified | 比較計画 |
| fair-comparison-fixture | verified | 同一条件比較 |
| raw-address-fixture | blocked | privacy |

---

## 12.20 後半章の弱点監査

第8章から第12章は、AMTの応用可能性を広げる部分である。しかし、この後半部は同時に、主張が広がりすぎる危険を持つ。したがって、後半章は、理論的魅力ではなく、弱点監査によって補強されなければならない。

後半章の弱点を次の五つに分ける。

\[
W=
\{
W_H,W_P,W_X,W_G,W_B
\}
\]

| weakness | chapter | meaning |
| --- | ---: | --- |
| \(W_H\) | 8 | 履歴保存がPID固定と誤読される |
| \(W_P\) | 9 | 確率・品質が真理と誤読される |
| \(W_X\) | 10 | 非標準参照が例外集に見える |
| \(W_G\) | 11 | ZK/VC/DID/APIが責任境界なしに混ざる |
| \(W_B\) | 12 | ベンチマーク計画が勝利宣言に見える |

補強条件を次で定義する。

\[
\operatorname{Reinforced}(ch)
\iff
\operatorname{Invariant}(ch)
\land
\operatorname{FailureMode}(ch)
\land
\operatorname{Counterexample}(ch)
\land
\operatorname{FixtureHook}(ch)
\land
\operatorname{NonClaim}(ch)
\]

各後半章は、次を満たすべきである。

| chapter | invariant | failure mode | counterexample | fixture hook | non-claim |
| ---: | --- | --- | --- | --- | --- |
| 8 | lineage preserved | silent PID reuse | delivery success is not residence | split/merge/relocation | PID is not eternal |
| 9 | unsafe accept minimized | high posterior but unsafe | low entropy without true candidate | posterior/entropy/loss | probability is not truth |
| 10 | boundary purpose scoped | fuzzy or stale boundary | coordinate is not identity | sea/island/vertical/emergency | cross-domain is not ownership |
| 11 | least disclosure | raw address over-collection | ZK cannot repair AMT | envelope/policy/audit | proof is not resolution |
| 12 | publication safety | unverified universal claim | case study is not global proof | claim/benchmark gate | benchmark is not victory |

この監査の目的は、論文を弱く見せることではない。逆である。AMTの強さは、強い主張と安全な非主張を同時に持つ点にある。

オープンソース、助成金、標準化、商用導入の観点では、次の順で成熟度を上げる。

```text
written claim
  -> formal definition
  -> executable fixture
  -> failure-mode test
  -> benchmark corpus
  -> independent comparison
  -> audited implementation
```

第8章から第12章の補強後の読者契約は次である。

```text
We do not ask the reader to trust AMT because it is broad.
We ask the reader to inspect AMT because each broad claim has
an invariant, a failure mode, a counterexample, a fixture hook,
and a non-claim.
```

---

## 12.21 結論

住所写像論は、住所を文字列、座標、郵便番号、行政階層、地図点、配送先、本人確認情報のどれか一つへ還元しない。住所を、社会的・空間的・歴史的・計算的・制度的制約を持つ参照対象として扱う。

本論文の再構成により、AMT v2は次の12章に整理された。

```text
1  登録困難性
2  住所参照の本質
3  住所対象
4  公理と安全棄却
5  候補生成
6  構造距離
7  安全解決
8  履歴グラフ
9  確率・品質・エントロピー
10 クロスドメイン参照
11 プロトコル・プライバシー境界
12 検証・限界・結論
```

AMTの中核は次である。

```text
address expression
  -> candidate generation
  -> structural equivalence
  -> safe resolution
  -> history-preserving identifier
  -> purpose-scoped proof or communication
  -> audited, revocable, least-disclosure use
```

本論文の最終的な非主張は重要である。

AMTは、全世界の全住所をすでに完全解決できるとは主張しない。  
AMTは、ZKだけで住所問題を解決できるとは主張しない。  
AMTは、商用住所検証APIに無条件で勝つとは主張しない。  
AMTは、政治的主張や所有権判断を行うとは主張しない。  
AMTは、住所を公開する理論ではなく、住所参照を必要最小限に使う理論である。

結論として、住所写像論は完成して閉じる理論ではない。住所制度、地理情報、物流、暗号、プライバシー、行政、災害、AI、デジタルツインの変化に合わせて進化し続ける基礎理論である。

その価値は、すべてを即座に解けることではない。何を解けるか、何をまだ解けないか、どこで止まるべきか、どう検証すべきかを、数学的・実装的・社会的に明示できる点にある。
