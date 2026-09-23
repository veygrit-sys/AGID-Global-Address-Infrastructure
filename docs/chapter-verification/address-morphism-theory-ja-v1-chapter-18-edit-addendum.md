# 住所写像論 日本語版 v1 第18章 追加・編集差分案

対象: 第18章「AMTと暗号拡張の境界」

本差分案は、第18章をより安全で、論文全体の構成上も明確な境界章にするための本文案である。中心方針は、AMTを「住所意味論」、ZKPやcredentialを「暗号的選択開示層」として分離し、両者の強みと限界を混同しないことである。

## 1. 章冒頭に追加する要約

第18章の冒頭に、次を追加するとよい。

> 本章では、住所写像論と暗号拡張の境界を定める。住所写像論は、住所表現を候補、クラスタ、属性、履歴、品質判定、PID発行監査エンベロープへ写像する意味論である。一方、ZKP、credential、nullifier、revocation、freshness、proof bundle registryは、その意味論から得られた限定述語を秘匿して証明する暗号層である。

続けて、次を入れる。

> したがって、AMTは暗号安全性そのものを保証しない。ZKPは住所意味論の真実性そのものを保証しない。両者は、AMTが「何を証明するか」を定義し、暗号拡張が「それをどのように秘匿して証明するか」を担う、という関係に置く。

## 2. 18.1を「意味論暗号分離原則」として強化する

18.1の末尾に、次の原則を追加する。

### 原則18.1 意味論暗号分離原則

> AMTは住所由来の意味論的対象を生成する理論であり、ZKPなどの暗号拡張は、その対象に対する限定述語を秘匿証明するための別層である。

本文案:

> この分離により、AMT本体論文は、候補生成、クラスタ、unresolved判定、履歴、品質、PID発行監査などの意味論を扱う。一方、ZK Address Proof、ZK Residence Proof、ZK Delivery Eligibility、AOID Ownership Proof、duplicate nullifier、revocation root、freshness root、proof bundle registry、anonymous rate limit、credential issuer trust registryは、別論文で扱う。

注意書き:

> 本章は暗号プロトコルの完成を主張する章ではない。本章は、暗号プロトコルが消費すべきAMT出力を定義し、AMTと暗号拡張を混同しないための境界章である。

## 3. 18.2に「AMTが渡すもの」の型を追加する

18.2の列挙の後に、次の整理を追加するとよい。

```text
AMTOutput =
  resolvedReferenceClass
  | nonIssuanceState
  | attributeMap
  | lineageGraph
  | qualityGate
  | sourceMetadata
  | policyVersion
  | pidAuditEnvelope
```

本文案:

> AMTが暗号拡張へ渡すものは、住所本文そのものではなく、意味論的に処理された出力である。たとえば、解決済み参照クラス、非発行状態、属性写像、履歴グラフ、品質しきい値判定、出典メタデータ、ポリシーバージョン、PID発行監査エンベロープである。

さらに、品質について次の注意を入れる。

> 品質スコアをそのまま公開する必要はない。暗号拡張へ渡す場合は、品質しきい値を満たすか、再検証対象であるか、どのポリシーバージョンで判定したかを扱う方が安全である。

## 4. 18.3に「証明エンベロープと本格ZK回路の区別」を追加する

18.3の末尾に、次を追加する。

> 現在の実装で検証されているのは、住所由来の限定述語を扱う証明エンベロープ、署名、commitment、nullifier、scope、challenge、revocation、freshness、issuer trust、proof bundle互換性である。これは本格的なZK回路のsoundnessやzero-knowledge性そのものを証明したことを意味しない。

続けて、次の表を入れると分かりやすい。

| 層 | 担うもの | 本稿での扱い |
|---|---|---|
| AMT意味論 | 候補、クラスタ、属性、履歴、品質、監査 | 本体論文で扱う |
| 証明エンベロープ | claim、signature、commitment、scope、challenge | 実装境界として言及できる |
| ZK回路 | witness、constraints、soundness、zero-knowledge | 別論文または別監査 |
| 運用信頼 | issuer trust、revocation、freshness、root anchoring | 別論文または応用設計 |

## 5. 18.4に「AMTだけでは保証できないこと」を追加する

18.4のリストに、次を追加する。

```text
9. 公開述語が細かすぎることによる一意化漏洩。
10. AMT述語とZK回路実装が一致していること。
11. issuer trust registryが運用上正しく維持されること。
12. revocation rootとfreshness rootが十分に新しいこと。
```

本文案:

> AMTは、住所由来の属性や履歴を意味論的に定義できる。しかし、その属性を秘匿して証明する際に、公開述語の粒度、domain separation、nullifier、revocation、freshness、issuer trust、回路実装が安全であることまでは、AMT単体では保証できない。

## 6. 18.5に「ZKPだけでは保証できないこと」を追加する

18.5の末尾に、次を追加する。

> ZKPは、与えられた述語の充足を秘匿して示す装置である。しかし、述語の意味論、地理境界、行政境界、配送可能区域、住所候補生成、履歴更新、出典鮮度、文脈適合性を自動的に生成する装置ではない。したがって、ZKPの前段にはAMTのような住所意味論が必要である。

反例として、次を入れるとよい。

```text
古い配送区域データに対して、配送可能であることをZKで証明した。
暗号的には正しい証明であっても、配送区域データが古ければ、
現在の配送可能性を保証しない。
```

この反例により、ZKPとAMTの分離が自然に説明できる。

## 7. 18.6の境界図式を置換する

18.6の図式は、次のように置換するとよい。

```text
surface address expression
  -> AMT semantic pipeline
  -> resolved class / attributes / lineage / quality gate / audit envelope
  -> cryptographic predicate layer
  -> proof envelope or ZK proof
  -> limited public statement
```

本文案:

> AMTは、住所表現を意味論的な中間成果物へ写像する。暗号拡張は、その中間成果物をhidden witnessまたはcredentialとして使い、公開してよい限定述語だけをpublic statementとして出す。このとき、住所本文、氏名、電話番号、詳細座標、内部履歴、private salt、AOID秘密鍵などは公開しない。

さらに、次の可換図式的説明を追加する。

```text
address expression
  -> AMT attribute map
  -> public predicate

address expression
  -> hidden witness
  -> proof envelope
  -> public predicate
```

説明:

> 上の二つの経路が同じpublic predicateに到達するように設計する。ただし、下の経路ではaddress expressionやhidden witnessを公開しない。AMTはpredicateの意味を定義し、暗号拡張はpredicateの秘匿証明を担う。

## 8. 18.7を「本稿に残す範囲」と「別論文へ送る範囲」に再整理する

18.7は、次の二段構成にすると明確である。

### 本稿に残す範囲

```text
resolved reference class
attribute map
non-issuance state
lineage graph
quality gate
source metadata
policy version
PID audit envelope
```

本文案:

> 本稿に残すのは、暗号拡張が消費できる意味論的出力である。これには、解決済み参照クラス、非発行状態、属性写像、履歴グラフ、品質しきい値判定、出典メタデータ、ポリシーバージョン、PID発行監査エンベロープを含める。

### 別論文へ送る範囲

```text
ZK Address Proof
ZK Residence Proof
ZK Delivery Eligibility
AOID Ownership Proof
duplicate nullifier
revocation root
freshness root
proof bundle registry
anonymous rate limit
credential issuer trust registry
formal ZK circuit implementation
```

本文案:

> これらは別論文「住所写像論 II: 零知識住所述語」で扱う。本体論文では名称と境界を示すにとどめ、回路仕様、proof system、issuer trust、revocation、freshness、nullifier、proof bundle互換性の詳細には深入りしない。

## 9. 公開述語の粒度に関する命題を追加する

18.3または18.4の近くに、次の命題を入れるとよい。

### 命題18.2 粗粒度公開述語命題

> 公開述語が複数の秘密住所を同一の公開主張へ写す場合、公開主張だけから秘密住所を一意に決定することはできない。

Lean対応:

```text
predicate_proof_collision_hides_private_value
```

本文案:

> たとえば「日本在住」や「配送対象区域内」は、多数の住所を同じ公開主張へ写す。したがって、公開主張だけでは住所本文を一意に復元できない。この粗さが、住所述語証明におけるプライバシー設計の第一条件になる。

### 命題18.3 注入的公開述語漏洩命題

> 公開述語が秘密住所に対して注入的である場合、公開主張は秘密住所を一意化し得る。

Lean対応:

```text
injective_public_claim_identifies_private_value
```

本文案:

> 「この住所は特定建物の特定階の特定区画である」のような公開主張は、形式上は住所本文を出していないように見えても、実質的には住所を特定する場合がある。したがって、暗号拡張では、公開述語の粒度を目的に必要な最小限へ制限しなければならない。

## 10. 用途スコープに関する命題を追加する

18.3または18.7に、次を追加するとよい。

### 命題18.4 用途属性充足命題

> ある用途の証明には、その用途が要求する属性がhidden credentialに含まれていなければならない。

Lean対応:

```text
CoversRequiredAttributes
missing_required_attribute_prevents_attribute_gate
```

本文案:

> 配送用途の証明には配送可能性、地域資格用途の証明には地域所属、AOID所有用途の証明にはAOID所有または登録済みcredential保有が必要である。用途が要求する属性をhidden credentialが持たない場合、証明は通過してはならない。

## 11. Proof bundle互換性の命題を追加する

18.4または18.7に、次を追加する。

### 命題18.5 証明バンドル受理条件命題

> 住所由来の複数証明を同じ操作に束ねる場合、domain separation、scope整合性、nullifier replay防止、freshness、revocation、issuer trust、公開主張の粗さ、秘密素材非露出が必要である。

Lean対応:

```text
ProofBundlePolicy
ProofBundleAccepted
accepted_proof_bundle_exposes_no_private_material
accepted_proof_bundle_requires_domain_separation
```

本文案:

> ZK Address Proof、Residence Proof、Delivery Eligibility、AOID Ownership、PID Audit、匿名レート制限などを同時に使う場合、それぞれの証明が個別に有効であるだけでは不十分である。同じscope、challenge、domain separationの下で、nullifier衝突、replay、private material露出、revocation、freshness、issuer trustを確認しなければならない。

## 12. 避けるべき表現を本文注に入れる

第18章末尾または編集注として、次を入れるとよい。

| 避ける表現 | 理由 | 安全な表現 |
|---|---|---|
| AMTはZKPを完成させる | AMTは意味論であり暗号安全性ではない | AMTはZK住所述語の意味論を提供する |
| ZKPにより住所の真実性が保証される | ZKPは述語充足を証明するだけ | ZKPはAMT由来の述語充足を秘匿証明する |
| 住所を出さないので常に安全 | 公開述語が細かいと一意化する | 公開述語は目的に必要な最小粒度に制限する |
| TS実装で本格ZK回路が完成 | 現在はエンベロープと互換性モデル | 回路はNoir/Circom/Rust-ZKVM等で別実装する |
| issuer署名があれば十分 | issuerの権限とscopeが別問題 | issuer trust registryとscope検証が必要 |

## 13. 第18章末尾の結論を強化する

18.8の末尾に、次を追加するとよい。

> 第18章の役割は、AMTと暗号拡張を接続しつつ、両者を混同しないことである。AMTは、住所本文から意味論的に検証可能な属性、履歴、品質、監査エンベロープを生成する。暗号拡張は、それらをhidden witnessまたはcredentialとして用い、公開してよい限定述語だけを示す。この分離により、AMT本体論文は住所意味論として完結し、ZKPの詳細は「住所写像論 II: 零知識住所述語」で本格的に扱える。

続けて、次の短い橋渡しを入れる。

> 以後の応用論文では、AGID、AOID、PID、住所credential、配送可能性証明、同意スコープ、匿名レート制限、issuer trustを、AMT本体ではなくAMT上の応用層として扱う。

## 14. 章全体の採用判定

第18章は、現在の本文でも採用できる。ただし、プロの論文としては次の修正を入れた方がよい。

1. 「AMTは意味論、暗号拡張は秘匿証明」という原則を冒頭で明示する。
2. 「証明エンベロープ」と「本格ZK回路」を分ける。
3. 公開述語が細かすぎる場合の漏洩命題を入れる。
4. 用途スコープと属性充足の命題を入れる。
5. proof bundle互換性の受理条件を入れる。
6. ZKP詳細は別論文へ送る。
7. TypeScript実装はエンベロープ層、本格回路は別実装と明記する。

この修正により、第18章はAMT本体論文の境界を守りつつ、住所写像論II、AGID/AOID応用論文、ZK証明実装へ自然につながる章になる。
