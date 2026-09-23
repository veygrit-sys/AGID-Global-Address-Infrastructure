# address-research: 住所情報工学の基礎研究

Status: research note for `dawnportinfo-design/address-research`

Date: 2026-07-03

このメモは、`dawnportinfo-design/address-research` の中心概念である **Address Information Engineering / 住所情報工学** を、研究分野として成立させるための基礎を整理する。既存 README は、住所情報工学を「住所を計算可能・検証可能・プライバシー配慮型・分散可能な情報インフラとして扱う傘概念」と定義している。本メモでは、その定義を公理、対象、演算、検証、非主張まで落とす。

## 1. 研究上の結論

住所情報工学は、住所を単なる `text field` として扱うのではなく、次の情報対象として扱う分野である。

```text
address = expression + referent + evidence + source + version + policy + proof boundary + operational use
```

したがって、住所情報工学の基礎命題は次のように置ける。

```text
住所は文字列ではなく、社会・地理・物流・証明・履歴をまたぐ情報オブジェクトである。
住所処理とは、表記をきれいにすることではなく、参照対象、証拠、公開境界、到達可能性、時間変化を安全に扱うことである。
```

この定義にすると、住所情報工学は `address-morphism-theory` だけでなく、`Address-Grid-ID`、`AddressQL`、`zk-address-predicates`、国別 gazetteer pack、配送API、Address Login、Wallet/VC までを統一できる。

## 2. 住所情報工学の基本対象

時刻またはデータ版を \(t\)、利用文脈を \(\chi\) とする。住所情報工学は少なくとも次の型を区別する。

| 記号 | 対象 | 説明 |
| --- | --- | --- |
| \(E_t\) | expression | 表層住所表現。文字列、郵便番号、施設名、地名、座標コード、検索語など。 |
| \(R_t\) | referent | 参照対象。建物、入口、部屋、道路、区画、港、ロッカー、自然地物、仮想地点など。 |
| \(I_t\) | identifier | AGID、PID、AOID、外部Place ID、郵便番号、行政コードなど。 |
| \(S_t\) | source | 行政、郵便、GIS、OSM、GeoNames、Wikidata、現場報告、履歴資料などの出典。 |
| \(Q_t\) | quality state | verified, partial, ambiguous, unresolved, disputed, deprecated など。 |
| \(L_t\) | lineage | 改名、分割、統合、廃止、後継、再割当の履歴グラフ。 |
| \(P_t\) | policy | 用途、公開範囲、権限、保持期間、証明境界、監査条件。 |
| \(C_t\) | computation | parse, normalize, match, geocode, route, prove, audit などの計算。 |

基礎的な型分離は次である。

```text
surface expression != referent != identifier != credential != proof != receipt
```

この分離が弱いと、正規化済み文字列を住所同一性と誤認したり、郵便番号を配送可能性と誤認したり、ZK proof を住所解決の正しさと誤認する。

## 3. 基礎公理

### A1. 型分離公理

住所文字列、参照対象、識別子、証明、配送受領、監査ログは異なる型である。同じDB行やJSONに入っていても、同じ意味対象ではない。

### A2. 文脈依存公理

住所情報の正しさは文脈 \(\chi\) に依存する。配送、本人確認、税務、地図検索、災害対応、ホテルチェックイン、越境ECでは、同じ入力から必要な出力が異なる。

### A3. 出典束縛公理

住所情報は出典 \(S_t\) なしに verified へ昇格しない。出典には、管轄、ライセンス、カバレッジ、鮮度、取得方法、加工履歴が必要である。

### A4. 時間変化公理

住所は時間変化する。住所情報工学は、valid time、transaction time、source version、lineage root、successor、predecessor を区別する。

### A5. 非単射公理

表層住所表現から参照対象への写像は、一般に単射ではない。複数の参照対象が同じ表記、同じ郵便番号、同じ建物名、同じ座標近傍を共有し得る。

### A6. 到達性分離公理

座標上近いこと、同じ建物に属すること、配送員が到達できること、受取人に届くことは別述語である。

### A7. 公開射影非可逆公理

公開可能な住所識別子や証明から、部屋番号、受取人、電話番号、秘密アクセス情報、ZK witness、private key を復元できてはならない。

### A8. 安全な非発行公理

住所情報システムは、`resolved` だけでなく `ambiguous`、`unresolved`、`manual_required`、`rejected`、`deprecated` を返せるべきである。

## 4. 中心写像

住所情報工学の処理は、単一の `normalize(address)` ではない。最低でも次の写像群に分解される。

| 写像 | 型 | 意味 |
| --- | --- | --- |
| parse | \(E_t \to Structure_t\) | 表層表現を構造化する。 |
| normalize | \(Structure_t \to N_t\) | 表記揺れを減らす。 |
| candidate | \(E_t \to \mathcal P_{fin}(R_t)\) | 参照候補を有限に出す。 |
| resolve | \(E_t \times S_t \times P_t \rightharpoonup Outcome(R_t)\) | 証拠とポリシーに基づき解決する。 |
| render | \(R_t \times purpose \to E_t\) | 用途別に表示する。 |
| index | \(R_t \to K_t\) | 検索・空間・郵便・ID索引へ写す。 |
| prove | \(R_t \times Predicate \to Proof_t\) | 住所を直接出さず述語を証明する。 |
| audit | \(Operation_t \to Receipt_t\) | 操作を監査可能な受領へ変換する。 |

重要な非可換性:

\[
resolve(normalize(e)) \ne normalize(resolve(e))
\]

正規化は候補探索を助けるが、参照対象の正しさを保証しない。

## 5. 8レイヤーの再定義

`address-research` の既存 README は住所情報工学を8レイヤーに分けている。研究上は、各レイヤーに「入力、出力、失敗状態、非主張」を付けると強くなる。

| レイヤー | 入力 | 出力 | 失敗状態 | 非主張 |
| --- | --- | --- | --- | --- |
| 数学・情報理論 | expression/referent/source | 集合、関係、同値、エントロピー | 非単射、過圧縮 | 数学モデルは世界完全性を証明しない |
| データモデル | source/schema/policy | typed address object | 型混同、スキーマ欠落 | 共通スキーマは全住所の完全表現ではない |
| 空間理論 | geometry/boundary/region | spatial relation | 境界不明、投影損失 | 座標一致は住所同一性ではない |
| 時間理論 | events/source versions | lineage graph | 履歴欠落、再割当衝突 | 新旧住所対応は常に単一ではない |
| 品質理論 | candidates/evidence | quality state | ambiguous, disputed | score は真実証明ではない |
| 計算理論 | indexes/queries/models | search/match/proof cost | 計算不能、近似誤差 | 便利な検索は verified ではない |
| 分散基盤 | replicas/updates/claims | freshness/conflict state | split brain, stale source | global consensus は常に必要ではない |
| 渋滞・性能 | queues/load/bottleneck | delay/throughput/risk | queue overflow, degraded mode | 最短距離は最短時間ではない |

## 6. 既存標準との関係

住所情報工学は既存標準を置き換えない。標準を写像の部品として使い、標準が扱わない境界を補う。

### ISO 19160

ISO 19160-1 は住所情報の概念モデルを扱い、ライフサイクル、メタデータ、別名も含む。住所情報工学では、ISO 19160 を `address conceptual model` として使い、AMT の referent/evidence/history と接続する。

研究課題:

- ISO 19160 の address component と AMT の expression/referent/source を対応させる。
- alias と lineage を、単なる別名ではなく時間つき関係として扱う。

### UPU S42 / ISO 19160-4

UPU S42 は国際郵便住所の要素と国別テンプレートを扱う。住所情報工学では、S42 を `rendering and component template layer` として扱う。

研究課題:

- `postal-format-valid` と `referent-resolved` を分離する。
- 国別テンプレートを AddressQL/SDK のレンダリング仕様へ変換する。

### OGC GeoSPARQL

GeoSPARQL は RDF 上の地物・幾何・空間関係・SPARQL拡張を扱う。住所情報工学では、空間関係と地物語彙を source/evidence として取り込む。

研究課題:

- `feature`, `geometry`, `addressable referent` を分離する。
- temporality が標準本体だけでは不足するため、lineage graph と組み合わせる。

### W3C VC / DID

VC は issuer-holder-verifier の credential 交換モデルを提供し、DID は分散識別子の構文と解決モデルを提供する。住所情報工学では、これらを住所そのものではなく、住所由来の claim/proof/verification layer として扱う。

研究課題:

- `address credential` は raw address を含まない proof-only mode を持つ。
- ZK proof は住所解決を修復しない、という non-repair boundary を明記する。

## 7. 住所情報工学の最小研究体系

### 7.1 Address Object Model

```text
AddressObject {
  expressionSet
  referentSet
  identifierSet
  evidenceBundle
  sourceState
  qualityState
  lineage
  disclosurePolicy
  proofBoundary
}
```

### 7.2 Evidence Bundle Calculus

\[
EvidenceBundle =
\{(source, claim, time, jurisdiction, license, coverage, confidence)\}
\]

採用条件:

\[
Admissible(e,\chi,t)
\iff
license(e) \land fresh(e,t) \land covers(e,\chi) \land trusted(e,\chi)
\]

### 7.3 Address Quality Lattice

品質状態は単純な真偽ではなく半順序で扱う。

```text
verified
  > partial
  > manual_required
  > ambiguous
  > unresolved
```

ただし、`disputed` と `deprecated` は単純な上下ではなく横断状態として扱う。

### 7.4 Privacy Projection

私的住所対象を \(A^{private}\)、公開住所対象を \(A^{public}\) とする。

\[
\pi: A^{private} \to A^{public}
\]

安全条件:

\[
\nexists g \quad g(\pi(a)) = a
\]

公開識別子は、私的住所情報へ戻れない抽象化レイヤーであるべきである。

### 7.5 Reachability Predicate

\[
Reachable(a, actor, mode, time, constraint)
\]

これは配送、徒歩、車両、ドローン、災害支援、施設受付で異なる。住所情報工学は、住所を単なる地理点ではなく、到達可能性つき参照として扱う。

## 8. address-research に足すべき成果物

`address-research` の現状は、taxonomy と research map が強い。一方で、深さを出すには次の成果物が必要である。

| 優先 | 成果物 | 目的 |
| --- | --- | --- |
| P0 | `address-information-engineering-foundations.md` | 公理、対象、演算、非主張を定義する。 |
| P0 | `src/addressInformationEngineeringFoundations.js` | 公理/写像/非主張の machine-readable registry。 |
| P0 | `tests/addressInformationEngineeringFoundations.test.js` | 型分離、8レイヤー、非主張の検証。 |
| P1 | `standards-compatibility.md` | ISO/UPU/GeoSPARQL/VC/DID との対応表。 |
| P1 | `synthetic-address-object-fixture.json` | raw address free な共通fixture。 |
| P1 | `address-quality-lattice.md` | verified/partial/ambiguous/disputed/deprecated の順序と失敗状態。 |
| P2 | `reachability-calculus.md` | 配送・施設・災害対応向けの到達可能性モデル。 |
| P2 | `privacy-projection.md` | 公開射影と非可逆性の形式化。 |

AGID 側の現在の実行可能ゲートは `npm run verify:address-information-engineering-foundations` である。
`address-research` 側へ移す場合のファイル対応と受け入れ条件は
`docs/research/address-information-engineering-foundations-porting.md` に分離する。

## 9. 研究として強く書けること

- 住所情報工学は、住所を `expression`, `referent`, `identifier`, `evidence`, `proof`, `receipt` に分離する。
- 住所の正しさは文脈依存であり、単一の universal validation は存在しない。
- 正規化、郵便テンプレート、geocoder、座標コード、ZK proof は、住所解決の部品であり、単独で住所真実を証明しない。
- 住所情報は時間変化するため、履歴グラフと版管理が基礎対象になる。
- 住所の公開識別子は、個人住所情報へ戻れない抽象化レイヤーであるべきである。
- 配送実務では、位置よりも到達性、受付、制約、待ち行列、handoff point が重要になる。

## 10. 弱めて書くべきこと

- 全世界の住所形式を完全に表現できるとは言わない。
- 公式/OSM/GeoNames/Wikidata/行政区画/島/POI/旧地名の完全カバレッジを主張しない。
- geocoder の1位候補を verified address としない。
- 郵便番号一致を同一住所や配送可能性の証明にしない。
- ZK proof が住所解決の誤りを修復すると言わない。
- 分散IDやブロックチェーンを必須基盤にしない。

## 11. 参照した一次情報

- ISO TC 211 Addressing overview: <https://committee.iso.org/sites/tc211/home/standards-in-action/addressing.html>
- ISO 19160-1 project page: <https://committee.iso.org/sites/tc211/home/projects/projects---complete-list/iso-19160-1.html>
- ISO 19160-4 project page: <https://committee.iso.org/sites/tc211/home/projects/projects---complete-list/iso-19160-4.html>
- UPU Addressing Solutions / S42: <https://www.upu.int/en/postal-solutions/programmes-services/addressing-solutions>
- Address.post S42 overview: <https://www.address.post/home/Addressstandard>
- OGC GeoSPARQL standard: <https://www.ogc.org/standards/geosparql/>
- OGC GeoSPARQL 1.1 specification: <https://docs.ogc.org/is/22-047r1/22-047r1.html>
- W3C Verifiable Credentials Data Model v2.0: <https://www.w3.org/TR/vc-data-model-2.0/>
- W3C DID Core: <https://www.w3.org/TR/did-core/>
