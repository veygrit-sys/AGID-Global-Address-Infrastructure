# 住所写像論 研究アジェンダ 2026-07-03

Status: research note

このメモは、住所写像論 (Address Morphism Theory; AMT) を、既存の住所標準、GIS、郵便、検索、配送、ID/証明プロトコルと接続するための研究整理である。結論として、AMT は「住所正規化理論」だけではなく、住所を **参照、証拠、履歴、到達性、公開射影、証明可能述語** として扱う部分写像理論として位置づけるのが最も強い。

## 1. 研究結論

AMT の中心命題は次でよい。

```text
住所は文字列ではなく、文脈に束縛された参照オブジェクトである。
住所解決は全域関数ではなく、証拠・履歴・目的・公開境界を持つ部分写像である。
```

形式的には、時刻または版を `t`、文脈を `chi` として、住所解決器は次のような部分写像である。

\[
F_{\chi,t}: S_t \times \Sigma_t \times L_t \times P_t
\rightharpoonup
\mathrm{Outcome}_{\chi,t}(X_t)
\]

ここで、

- \(S_t\): 表層住所表現。文字列、郵便番号、施設名、AGID、Plus Code、検索語など。
- \(X_t\): 住所可能実体。土地、建物、入口、部屋、港、ロッカー、道路、自然地物、仮想地点など。
- \(\Sigma_t\): 出典束。行政、郵便、GIS、OSM、GeoNames、Wikidata、現場報告、履歴資料など。
- \(L_t\): 履歴グラフ。改名、分割、統合、廃止、後継、再割当など。
- \(P_t\): ポリシー。用途、公開範囲、品質しきい値、失効、監査、権限など。
- \(\mathrm{Outcome}\): `resolved | ambiguous | unresolved | rejected` の直和型。

この定義により、AMT は既存研究に対して次の差分を持つ。

| 領域 | 既存の主対象 | AMT が足す対象 |
| --- | --- | --- |
| 郵便標準 | 住所要素、国別テンプレート、レンダリング | 参照対象、非一意性、履歴、PID発行境界 |
| GIS | 位置、幾何、空間関係、地物 | 住所として使える参照、到達可能性、公開射影 |
| geocoder | 文字列検索、逆ジオコーディング | 証拠束、棄却、非主張、監査可能な解決 |
| entity resolution | 同一性推定、重複排除 | 用途別同値、住所履歴、配送/証明文脈 |
| VC/DID/ZK | 識別子、credential、証明 | 住所を漏らさない到達性・範囲・同一性述語 |

## 2. 外部標準との互換研究

AMT は既存標準を置き換える理論ではない。むしろ、それぞれを別の写像として受け入れ、その限界を型で分離する理論である。

### ISO 19160 / UPU S42

ISO 19160 は住所概念モデル、ライフサイクル、メタデータ、別名を扱い、UPU S42 は国別テンプレートと住所要素レンダリングを扱う。AMT ではこれらを次の写像として扱う。

\[
\mathrm{render}_{country,purpose}: X_t \to S_t
\]

ただし、レンダリングは参照解決の逆関数ではない。複数の実体が同じ表示文字列を持ち得るため、一般には次が成り立たない。

\[
F_{\chi,t}(\mathrm{render}(x)) = x
\]

研究課題:

- ISO/UPU 要素を AMT の `surface expression` と `rendering policy` に写す互換表を作る。
- 国別テンプレートを、AMT の「表示の正しさ」と「参照の正しさ」に分離する。
- `postal address valid` と `deliverable target resolved` を別述語にする。

### OSM / Nominatim / libpostal

OSM の `addr:*` はオープンな住所タグ体系であり、Nominatim は OSM を使う geocoder/reverse geocoder である。libpostal は国際住所の parse/normalize に強い。AMT ではこれらを候補生成と正規化のエンジンとして使う。

\[
\Gamma_t(u) =
\Gamma^{postal}_t(u)
\cup
\Gamma^{osm}_t(u)
\cup
\Gamma^{gazetteer}_t(u)
\cup
\Gamma^{manual}_t(u)
\]

重要な非主張:

- 正規化一致は同一住所証明ではない。
- geocoder の最上位候補は PID 発行証明ではない。
- 逆ジオコーディングは近傍地物を返すことがあり、対象そのものの住所を返すとは限らない。

### GeoSPARQL / GIS

GeoSPARQL は RDF 上の地物・幾何・空間関係を扱える。AMT では、GIS 幾何を住所対象の一部として使うが、座標や幾何だけを住所と同一視しない。

\[
geom: X_t \to G_t
\]

この写像は多くの場合非単射である。高層階、入口、私有ロッカー、建物内区画、仮設拠点は同じまたは近い地表幾何を共有し得る。

研究課題:

- `geom equality`、`topological relation`、`reachable entrance`、`delivery handoff point` を別述語にする。
- GeoSPARQL の空間関係を AMT の証拠束に取り込む。
- 2D 投影で失われる垂直・内部構造を、非可逆射影として扱う。

### VC / DID / OpenID4VCI

VC/DID/OpenID4VCI は、住所そのものではなく住所由来の credential や proof を配布・検証する層である。AMT では、証明層を住所解決層の後段に置く。

\[
\mathrm{prove}: \mathrm{Resolved}(X_t) \times Predicate \to Proof
\]

ただし、次を公理として置くべきである。

```text
ZK proof does not repair bad resolution.
```

つまり、誤って解決された住所に対して証明を作っても、それは暗号的には検証できるが、実世界の参照正しさを回復しない。

## 3. 追加すべき数理モデル

### 3.1 出典束モデル

出典を単なるリストではなく、時刻・管轄・ライセンス・鮮度を持つ束として扱う。

\[
\Sigma_t =
\{(source, jurisdiction, coverage, license, freshness, reliability)\}
\]

証拠採用述語:

\[
Admissible(e,\chi,t)
\iff
license(e) \land fresh(e,t) \land covers(e,\chi) \land trusted(e,\chi)
\]

このモデルにより、公式 gazetteer、OSM、GeoNames、Wikidata、行政区画、島、POI、自然地名、旧地名を同じ「証拠」ではなく、異なる信頼・鮮度・用途を持つ出典として扱える。

### 3.2 到達性モデル

住所は「位置」だけでなく「到達できるか」を含む。配送・緊急対応・施設受付では、到達可能性が参照の本体になる。

\[
Reach_{\chi,t}(x, a, \tau)
\]

は、主体または配送手段 `a` が、制約 `chi` と時刻 `t` の下で、対象 `x` に制限時間 `tau` 以内に到達可能であることを表す。

配送向けの安全な同値:

\[
x \sim^{delivery}_{\chi,t} y
\iff
handoff(x) = handoff(y)
\land
Reach_{\chi,t}(x) \approx Reach_{\chi,t}(y)
\]

これにより、同じ建物でも入口・受付・ロッカー・車両進入口が違う場合に別参照として扱える。

### 3.3 公開射影と非可逆性

個人情報を含む完全住所対象を \(X^{private}\)、公開可能な抽象参照を \(X^{public}\) とする。

\[
\pi_{public}: X^{private} \to X^{public}
\]

安全条件:

\[
\nexists g: X^{public} \to X^{private}
\quad
s.t.\quad
g(\pi_{public}(x)) = x
\]

すなわち、公開識別子から部屋番号、受取人、電話、秘密アクセス情報へ戻れないことを理論の要件にする。

### 3.4 履歴グラフと PID 保存

住所履歴は関数ではなくグラフである。

\[
L_t = (V_t, E_t)
\]

辺ラベル:

```text
rename | split | merge | retire | successor | reassignment | alias
```

PID 保存の条件:

\[
PreservePID(e)
\iff
continuity(e) \land no_conflict(e) \land policy_allows(e)
\]

分割・統合では、PID を常に保存するのではなく、保存、廃止、後継リンク、要再発行を分ける。

### 3.5 通信可能住所モデル

住所を通信可能なオブジェクトとして定義する。

\[
ACO =
(reference, payload, disclosure, capability, expiry, revocation, ack)
\]

`ValidComm(ACO, receiver, purpose)` は、受信者がその住所参照を処理でき、必要以上の情報を受け取らず、失効・期限・能力交渉を満たすことを表す。

ACK 状態:

```text
accepted | needs_more_info | ambiguous | unreachable | rejected | expired | revoked
```

これにより AMT は、住所を「人間が読むラベル」から「配送業者・EC・ウォレット・行政・ZK verifier が安全に通信できる参照」へ拡張できる。

## 4. 論文構成への提案

既存の 12章構成は維持するのがよい。章を増やしすぎるより、補助章・付録・互換表として厚くする方が論文の芯がぶれない。

追加するなら本文章ではなく、次の companion/appendix がよい。

| 追加物 | 目的 | 入れる場所 |
| --- | --- | --- |
| Standards Compatibility Appendix | ISO 19160、UPU S42、OSM、GeoSPARQL、VC/DID との対応 | 付録 |
| Source Bundle Calculus | 公式/OSS/現場/履歴出典の採用条件 | 5章または付録 |
| Reachability Calculus | 配送・緊急・施設入口・混雑の到達性 | 10章補強 |
| Public Projection and Non-Inversion | PID/AGID/AOID/credential の公開境界 | 11章補強 |
| Address Communication Object | 住所を通信できる形式へ落とす | companion spec |
| Falsification Benchmarks | 反例、棄却、候補欠落、正規化衝突 | 12章補強 |

## 5. 強く主張できること

AMT が現時点で強く主張できること:

- 住所解決は、一般には文字列から実体への全域関数ではない。
- 住所表現、座標、郵便番号、AGID、AOID、PID、credential、ZK proof は別型である。
- 正規化、geocoding、郵便検証、座標コードは、単独では PID 発行条件ではない。
- 候補集合に真の対象がない場合、後段のスコアリングでは回復できない。
- 履歴、分割、統合、改名、廃止は、単一値関数ではなくグラフを必要とする。
- 公開住所参照は、私的住所情報へ非可逆であるべきである。
- ZK 証明は、解決済み参照に関する述語を証明できるが、誤った住所解決を修復しない。

## 6. 弱点と補強方針

| 弱点 | 補強 |
| --- | --- |
| 外部標準との対応が散らばる | `standards-compatibility-map` を作る |
| 到達性がまだ配送実務に薄い | `Reachability Calculus` と合成 fixture を作る |
| 出典の品質差が文章中心 | source bundle schema と source completeness gate を接続する |
| ZK との関係が誤解されやすい | `ZK non-repair axiom` を本文とテストに固定する |
| 住所通信のプロトコル化が弱い | `Address Communication Object` を OpenAPI/JSON Schema 化する |
| 既存研究との差分が抽象的 | ISO/UPU/OSM/Nominatim/libpostal/GeoSPARQL との比較表を追加する |

## 7. 次の実装研究タスク

最小の次アクションは次の順がよい。

1. `docs/address-morphism-theory-v2/standards-compatibility-map.md` を作る。
2. `src/lib/addressMorphismV2StandardsCompatibility.ts` を作り、ISO/UPU/OSM/GIS/VC/ZK の「AMT上の型」と「非主張」をテストする。
3. `Reachability Calculus` の小さな TypeScript model を作る。
4. `Address Communication Object` の JSON Schema を作る。
5. AMT v2 compatibility gate に standards compatibility test を追加する。

## 8. 参照した一次情報・標準

- ISO TC 211 Addressing overview: <https://committee.iso.org/sites/tc211/home/standards-in-action/addressing.html>
- ISO 19160-1 project page: <https://committee.iso.org/sites/tc211/home/projects/projects---complete-list/iso-19160-1.html>
- ISO 19160-4 abstract: <https://www.iso.org/standard/64242.html>
- UPU Addressing Solutions / S42: <https://www.upu.int/en/postal-solutions/programmes-services/addressing-solutions>
- Address.post S42 overview: <https://www.address.post/home/Addressstandard>
- OGC GeoSPARQL standard: <https://www.ogc.org/standards/geosparql/>
- GeoSPARQL 1.1 specification: <https://docs.ogc.org/is/22-047r1/22-047r1.html>
- OSM `addr:*` documentation: <https://wiki.openstreetmap.org/wiki/Key%3Aaddr%3A%2A>
- OSM Addresses documentation: <https://wiki.openstreetmap.org/wiki/Addresses>
- Nominatim documentation: <https://nominatim.org/>
- Nominatim Search API: <https://nominatim.org/release-docs/latest/api/Search/>
- Nominatim Reverse API: <https://nominatim.org/release-docs/latest/api/Reverse/>
- libpostal repository: <https://github.com/openvenues/libpostal>
- Open Location Code / Plus Codes repository: <https://github.com/google/open-location-code>
- W3C Verifiable Credentials Data Model v2.0: <https://www.w3.org/TR/vc-data-model-2.0/>
- W3C DID Core: <https://www.w3.org/TR/did-core/>
- OpenID for Verifiable Credential Issuance 1.0: <https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html>
