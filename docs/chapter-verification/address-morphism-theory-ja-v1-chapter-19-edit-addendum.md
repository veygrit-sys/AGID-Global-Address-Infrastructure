# 住所写像論 日本語版 v1 第19章 追加・編集差分案

対象: 第19章「PIDと応用識別子の境界」

本差分案は、第19章を、AMT本体論文、AGID/AOID応用論文、住所写像論IIの境界を定める章として強化するための本文案である。中心方針は、PIDをAMT本体の参照状態識別子として固定し、AGID/AOIDを応用識別子として分離することである。

## 1. 章冒頭に追加する要約

第19章の冒頭に、次を追加するとよい。

> 本章では、AMT本体が発行するPIDと、AGID/AOIDのような応用識別子の境界を定める。PIDは、住所文字列の別名ではなく、AMTの候補生成、クラスタ、unresolved判定、履歴整合性、品質、鮮度、リスク、監査可能性を通過した参照状態に対して発行される。一方、AGID/AOIDは、AMTの出力を利用して、公開地理参照、所有者管理、配送、QR、同期、委譲、暗号証明などを実現する応用層の識別子である。

続けて、次の注意を入れる。

> したがって、AGID/AOIDはAMTを再定義しない。AGID/AOIDの便利な登録、通信、QR、暗号証明、API、MCP、買い物Agent連携を、AMT本体のPID発行規則と混同してはならない。

## 2. 19.1を「PID発行ゲート原則」として強化する

19.1の末尾に、次を追加する。

### 原則19.1 PID発行ゲート原則

> PIDは、AMTの解決ゲートを通過した参照状態に対して発行される。未解決候補、生住所文字列、単一観測値、低品質候補、履歴未確認候補から直接PIDを発行してはならない。

本文案:

> PIDは、住所文字列 `s` に対して直接 `hash(s)` として作られるものではない。PIDは、候補集合、クラスタ、unresolved判定、履歴更新、品質判定、鮮度、リスク予算、監査エンベロープを経て得られた参照状態に対して発行される。

記法として、次を入れると分かりやすい。

```text
PID = issue(referenceClass, policyVersion, auditEnvelope, riskBudget)
```

避けるべき記法:

```text
PID = hash(rawAddressString)
```

補足:

> 後者は、表記揺れ、同名異対象、複数区画、履歴変更、品質不足、辞書攻撃に弱い。したがって、本稿ではPIDを「住所文字列のhash」ではなく、「AMT参照状態の永続識別子」として扱う。

## 3. 19.1に条件付き一意性を明記する

次の命題を追加する。

### 命題19.2 PID条件付き一意性命題

> PIDの衝突しない割当は、参照対象に対してPID割当がinjectiveであるという条件のもとで成立する。実装では、さらに有限発行量と明示された衝突リスク予算を満たさなければならない。

Lean対応:

```text
injective_pid_has_no_collision
distinct_entities_have_distinct_injective_pids
```

実装対応:

```text
pidCollisionRisk.test.ts
npm run verify:pid-risk
```

本文案:

> 本稿は、PIDが無条件に衝突しないと主張しない。PID一意性は、理論上はinjective assignment、実装上は衝突リスク予算、監査可能な発行過程、再検証可能な履歴に依存する。

## 4. 生観測値PIDの反例を追加する

19.1または19.2に、次を追加する。

### 反例19.1 生観測値PIDの反例

```text
二つの異なる部屋が、同じ建物名、同じ通り名、同じ郵便番号を共有する。
観測値だけからPIDを作ると、二つの対象に同じPIDが発行され得る。
```

Lean対応:

```text
observation_based_pid_collides_on_same_observation
```

本文案:

> 住所解決において、観測値は常に対象を一意に定めるわけではない。同じ文字列、同じ郵便番号、同じ地図セル、同じ建物名を複数対象が共有する場合がある。このため、PIDは生観測値ではなく、AMTの参照クラスと監査可能な発行過程に基づかなければならない。

## 5. 参照クラスPID安定性を追加する

19.1に、次を追加する。

### 命題19.3 参照クラスPID安定性命題

> 住所表現が同じ参照クラスへ写像される場合、参照クラスに対して発行されたPIDは、表記揺れや用途別表示によって自動的には変化しない。

Lean対応:

```text
class_pid_invariant_under_ref_equivalence
relative_rendering_preserves_class_pid
```

本文案:

> たとえば、同じ場所を日本語表記、英語表記、配送向け表記、行政向け表記で表したとしても、それらが同じ参照クラスに属するかぎり、参照クラスPIDは同一に保たれる。表示の違いはレンダリング層の問題であり、PID発行層の問題ではない。

## 6. 19.2を「応用識別子非再定義原則」として強化する

19.2の末尾に、次を追加する。

### 原則19.4 応用識別子非再定義原則

> AGID/AOIDは、AMT本体のPID、候補生成、クラスタ、unresolved判定、履歴規則、品質規則を再定義しない。AGID/AOIDは、AMT出力を利用する応用識別子である。

本文案:

> AGIDは、公開地理参照または公開geo-semantic referenceとして機能する。AOIDは、所有者管理、配送操作、委譲、私的同期、credential、暗号証明などに利用される。いずれも、AMT本体の解決規則そのものではない。

注意書き:

> AGID/AOIDの実装が便利であるほど、それをAMT本体と混同する危険が大きい。本稿では、AGID/AOIDを応用例として位置付け、詳細仕様は別論文へ送る。

## 7. 19.3の表を拡張する

19.3の表を、次のように拡張するとよい。

| 識別子 | 層 | 主な対象 | 公開性 | 本体論文での扱い |
|---|---|---|---|---|
| PID | AMT本体 | 解決済み参照クラス、履歴付き参照状態 | 限定公開または内部参照 | 中核定義として扱う |
| AGID | 応用層 | 公開地理参照、地図特徴、公開住所的対象 | 原則公開 | 応用例として概要のみ扱う |
| AOID | 応用層 | 所有者管理、配送操作、委譲、私的同期 | 原則私的、公開時はpublic referenceのみ | 応用例として概要のみ扱う |
| ZK address predicate id | 暗号拡張層 | 住所由来の限定述語証明 | 公開statementのみ | 住所写像論IIで扱う |

本文案:

> PIDはAMT本体の参照状態識別子である。AGIDは公開地理参照として、AOIDは所有者管理の応用識別子として、それぞれPIDとは異なる役割を持つ。AGID/AOIDはPIDを補助できるが、PIDの意味論を置き換えるものではない。

## 8. 公開情報と私的情報の表を追加する

19.4に、次の表を追加するとよい。

| 情報 | 公開してよい場合 | 私的に保持すべき場合 |
|---|---|---|
| AGID public reference | 公開地理参照、地図表示、検索補助 | 個人受取人と直接結び付く場合 |
| AOID public handle | 所有者が許可した公開参照 | 受取人、電話番号、部屋番号、詳細座標を含む場合 |
| recipient | 原則公開しない | AOID private record、配送credential、暗号化envelope |
| phone | 原則公開しない | 配送業者向けの限定credentialまたは暗号化envelope |
| room/unit | 原則公開しない | 配送、建物内到達、所有者管理 |
| exact coordinates | 用途により限定 | 私的住所、AOID、ZK witness |
| owner key | 公開しない | AOID ownership proofのhidden witness |
| PID audit material | 公開証明ではcommitment化 | private audit salt、hidden candidate ids、history roots |

本文案:

> AGID/AOIDを応用識別子として使う場合、公開面と私的面を分離しなければならない。特にAOIDは、公開住所IDではなく、所有者管理の識別子である。公開する場合は、public handleや公開AGID参照に制限し、recipient、phone、room、詳細座標、所有者秘密鍵、private audit materialを出してはならない。

## 9. 19.4にAOID公開漏洩の反例を追加する

### 反例19.2 AOID公開漏洩の反例

```text
AOID public payload includes recipient, phone, room, lat, lon.
```

問題:

> AOIDが公開面で個人住所情報を含むと、AOID所有証明、配送可能性証明、住所秘匿、匿名配送、買い物Agent連携の前提が壊れる。

修正文:

```text
AOID public payload = publicHandle + linked public AGID reference + safe audit metadata
AOID private payload = local record or encrypted owner-device envelope
```

## 10. 19.4にAGID grid過信の反例を追加する

### 反例19.3 AGID grid過信の反例

```text
AGID cell = unique address entity
```

問題:

> 同じ地理セルには、複数の建物、階、部屋、店舗、私書箱、宅配ロッカー、地下区画、3次元区画が含まれ得る。したがって、AGID cellをそのままAMT本体のPIDと同一視してはならない。

修正文:

```text
AGID = public geo-semantic reference
PID = resolved reference-class identifier
AOID = owner-managed operation identifier
```

## 11. 19.5を論文分離表として強化する

19.5の表を、次のように整理するとよい。

| 論文 | 中心対象 | 含める内容 | 含めない内容 |
|---|---|---|---|
| 住所写像論本体 | 住所意味論、候補、クラスタ、unresolved、履歴、PID | AMT数理モデル、PID発行条件、品質、履歴、参照クラス | AGID/AOID API詳細、本格ZK回路、Polkadot/MCP詳細 |
| AGID/AOID応用論文 | 公開地理参照、所有者管理、配送、QR、同期、Agent | AGID/AOID登録、通信、監査、同期、委譲、買い物Agent、MCP | AMT本体定理の再定義 |
| 住所写像論II | ZK住所述語、credential、nullifier、proof bundle | ZK Address Proof、Residence Proof、Delivery Eligibility、AOID Ownership、PID Audit | 住所意味論そのものの再定義 |

本文案:

> 本体論文、応用論文、暗号拡張論文を分離することで、理論の中核、実装応用、秘匿証明を混同せずに扱える。この分離は保守性だけでなく、検証可能性にも重要である。

## 12. 章末にまとめを追加する

章末に、次を追加するとよい。

> 本章の結論は単純である。PIDはAMT本体の参照状態識別子であり、AGID/AOIDはAMTを利用する応用識別子である。PIDは、生住所文字列や単一観測値から直接発行されるものではなく、AMTの解決ゲート、履歴、品質、鮮度、衝突リスク予算、監査可能性を通過した参照状態に対して発行される。一方、AGID/AOIDは、公開地理参照、所有者管理、配送、QR、同期、委譲、暗号証明などを扱うが、AMT本体の意味論を再定義しない。

続けて、第20章への橋渡しを入れる。

> 次章では、この境界を踏まえ、応用識別子や暗号拡張に接続する前に、AMT本体としてどこまで検証でき、どこから先を別論文または応用実装として扱うべきかを整理する。

## 13. 本文で避けるべき表現

| 避ける表現 | 問題 | 修正文 |
|---|---|---|
| PIDは住所文字列のhashである | 表記揺れ、同名異対象、辞書攻撃に弱い | PIDはAMT参照状態に発行される |
| PIDは絶対に衝突しない | injective条件とリスク予算が必要 | PIDは条件付き一意性と有限リスク予算で管理される |
| AGIDは住所そのものである | 公開地理参照と住所実体は同一ではない | AGIDは公開geo-semantic referenceである |
| AOIDは公開住所IDである | AOIDには所有者管理と私的配送情報が関係する | AOIDはowner-managed operation identifierである |
| AGID/AOIDでAMTを置き換える | 応用識別子が理論本体を再定義してしまう | AGID/AOIDはAMT出力を利用する |
| ZK証明でPIDの意味論が保証される | ZKPは意味論を自動生成しない | AMTが意味論、ZKPが秘匿証明を担う |

## 14. 追加後の章構成案

第19章は、次の構成にすると読みやすい。

```text
19.1 PIDはAMT本体の出力である
19.2 PID発行ゲートと条件付き一意性
19.3 生観測値PIDの反例
19.4 AGID/AOIDはAMTを再定義しない
19.5 PID、AGID、AOIDの役割表
19.6 公開情報と私的情報の分離
19.7 論文分離: AMT本体、AGID/AOID応用、住所写像論II
19.8 まとめ
```

この構成にすると、第19章は、第18章の暗号境界と、第20章以降の応用・検証境界をつなぐ章として機能する。
