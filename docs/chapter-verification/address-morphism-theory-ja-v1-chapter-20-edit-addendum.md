# 住所写像論 日本語版 v1 第20章 追加・編集差分案

対象: 第20章「通信・登録・監査モデル」

本差分案は、第20章を、AMT本体とAGID/AOID応用層をつなぐ抽象モデル章として強化するための本文案である。中心方針は、住所を通信先として扱う視点を残しつつ、AMT本体では具体的APIや暗号プロトコルを定義しすぎないことである。

## 1. 章冒頭に追加する要約

第20章の冒頭に、次を追加するとよい。

> 本章では、住所を通信、登録、監査の対象として扱う。住所は、配送、行政通知、救急、災害支援、本人確認、ロボット誘導、Agent通信などの宛先になり得る。ただし、本稿で定義するのは具体的な通信APIではない。本稿で扱うのは、AMT本体が応用層へ渡すための住所由来属性、登録状態、非発行状態、PID発行監査エンベロープである。

続けて、次を入れる。

> 具体的なAPI、MCP、QR、SDK、買い物Agent、Polkadot、ZK proof bundle registry、AOID同期、委譲、所有権管理は、AGID/AOID応用論文または住所写像論IIで扱う。本章は、それらの前段に必要な抽象モデルを定義する。

## 2. 20.1を「住所通信仮説」として位置付ける

20.1の末尾に、次の仮説を追加する。

### 仮説20.1 住所通信仮説

> 住所は単なる場所記述ではなく、社会的・物流的・行政的・機械的な通信先として機能する。

本文案:

> この仮説により、住所は「どこにあるか」だけでなく、「どこへ届けるか」「どこへ通知するか」「どこへ支援を向けるか」「どの対象に権限を渡すか」という通信的意味を持つ。ただし、この仮説は応用設計の視点であり、AMT本体が全ての通信プロトコルを定義することを意味しない。

注意書き:

> 住所通信仮説は、第2章の応用仮説、第19章のAGID/AOID境界、住所写像論IIのZK住所述語と接続する。本体論文では、通信先として使うために必要な意味論的属性だけを定義する。

## 3. 20.2に「通信最小開示原則」を追加する

20.2の冒頭または末尾に、次を追加する。

### 原則20.2 通信最小開示原則

> 住所由来の通信では、依拠者が必要とする属性だけを公開する。配送可能性だけで十分な相手に、住所本文、部屋番号、電話番号、受取人名を渡してはならない。

本文案:

> たとえば、配送業者には「配送可能区域内であること」と「正当な受取人であること」だけで十分な場面がある。行政管轄の確認には、国、都道府県、市区町村の所属だけで十分な場合がある。本人確認には、指定国または指定都市の居住属性だけで足りる場合がある。このような場合、AMTは住所本文ではなく、住所由来の限定属性を通信へ渡す。

表として、次を入れると分かりやすい。

| 文脈 | 必要な属性 | 不要な情報 |
|---|---|---|
| 配送可能性確認 | 配送可能区域内、受取資格 | 完全住所、電話番号、部屋番号 |
| 行政管轄確認 | 国、州、自治体、行政区域 | 受取人名、電話番号 |
| 災害支援 | 避難所、支援対象区域、鮮度 | 恒久住所、詳細個人情報 |
| Agent購入 | 配送可能性、同意、用途スコープ | 生住所本文、AOID秘密鍵 |
| 監査 | policyVersion、decision、commitments | raw candidate list、private salt |

## 4. 20.2に属性写像の整理を追加する

現在の列挙を、次のように少し整理するとよい。

```text
CommunicationAttributes =
  regionMembership
  administrativeMembership
  deliveryEligibility
  buildingOrUnitGranularity
  naturalFeatureMembership
  lineageSuccessor
  credentialFreshness
  pidAuditState
  consentScope
  duplicateRegistrationState
```

本文案:

> 通信に使う属性は、住所本文そのものではなく、住所から導出された限定属性である。地域所属、行政所属、配送可能性、建物または部屋粒度、自然地理対象への所属、履歴上の後継関係、credential鮮度、PID発行監査状態、同意スコープ、重複登録状態などが含まれる。

注意:

> これらの属性を秘匿証明する方法は、住所写像論IIで扱う。本章では、AMT本体がそれらの属性を意味論的に供給できることだけを述べる。

## 5. 20.3を「登録非真理宣言命題」として強化する

20.3の末尾に、次を追加する。

### 命題20.3 登録非真理宣言命題

> AMTにおける登録は、住所の真理を宣言することではない。登録は、証拠、文脈、候補、クラスタ、品質、鮮度、リスク、履歴、監査条件のもとで、対象をどの状態として扱うかを記録する操作である。

Lean対応:

```text
IssueAdmissible
issueIfAdmissible
issue_if_admissible_requires_conditions
issue_if_not_admissible_abstains
```

本文案:

> ユーザーが住所を入力したこと、APIが候補を返したこと、QRが作られたこと、AOIDが仮登録されたことは、ただちにAMT本体のPID発行を意味しない。PID発行には、候補生成、クラスタ、unresolved判定、履歴整合性、品質、鮮度、リスク、監査可能性が必要である。

## 6. 20.3の登録状態を明示する

登録モデルに、次の状態を追加するとよい。

```text
RegistrationState =
  candidate-only
  provisional-local
  verified-registered
  unresolved
  rejected
  revalidation-required
  duplicate-blocked
  privacy-blocked
```

本文案:

> 登録結果は二値ではない。候補だけ返す状態、ローカル仮登録、検証済み登録、unresolved、rejected、再検証対象、重複登録防止による拒否、過剰開示による拒否などがある。これらを区別することで、AMTは登録失敗を品質改善の入力として扱える。

## 7. 20.4を「監査非公開命題」として強化する

20.4の末尾に、次を追加する。

### 命題20.4 監査非公開命題

> 監査は、住所本文や個人情報を公開することではない。監査は、必要な手続きが通過されたことを、commitment、policyVersion、decision、historyState、riskStateなどで確認可能にすることである。

本文案:

> 監査に必要なのは、入力住所本文、電話番号、部屋番号、受取人名、全候補の詳細、hidden history rootsを公開することではない。必要なのは、どのポリシーの下で、どの手続きが通過され、どのdecisionに至ったかを、必要最小限で後から確認できることである。

反例として、次を追加する。

```text
audit log = raw input address + recipient + phone + room + all candidate ids
```

問題:

> このような監査ログは、監査のために個人情報を過剰保存し、漏洩源になる。

修正:

```text
audit log = commitments + policyVersion + decision + timestamp + public reason codes
```

## 8. 20.5の監査エンベロープを読みやすくする

現在の数式的な監査エンベロープは、本文では次の構造体として書くと読みやすい。

```text
AuditEnvelope = {
  policyVersion,
  context,
  inputCommitment,
  sourceSet,
  candidateCommitment,
  clusterCommitment,
  decision,
  qualityPolicy,
  freshnessState,
  historyState,
  riskState,
  timestamp
}
```

本文案:

> `inputCommitment` は入力住所本文そのものではない。`candidateCommitment` や `clusterCommitment` も、候補やクラスタの全詳細を公開するものではなく、必要に応じて検証可能な抽象表現である。AMT本体では、この構造を定義するにとどめ、commitment方式、署名方式、ZK回路、root anchoring方式は別論文で扱う。

## 9. 20.5に監査エンベロープの用途表を追加する

次の表を追加するとよい。

| 用途 | 監査したいこと | 公開しないもの |
|---|---|---|
| PID発行監査 | 発行ゲートを通過したこと | 入力住所、hidden candidate ids |
| PID履歴更新 | update、merge、splitが正当であること | hidden history roots |
| 登録失敗 | 非発行理由と再検証対象 | 個人情報、電話番号 |
| 重複登録防止 | 同一住所、同一AOID、同一地域で二重登録していないこと | AOID本文、生住所 |
| MCP/API公開面 | 公開ツールや公開証明だけを扱うこと | privateSalt、addressText、phone、recipient |

本文案:

> 監査エンベロープは、発行成功だけでなく、非発行、重複、失効、再検証、履歴更新にも使える。これにより、AMTは成功した登録だけでなく、失敗や保留の状態も品質改善に利用できる。

## 10. 20.6を「非発行状態記録命題」として強化する

20.6に、次を追加する。

### 命題20.5 非発行状態記録命題

> 登録条件が不足する場合、AMTはPIDを発行せず、理由を記録する。非発行理由は、再検証、出典追加、履歴補完、品質改善、過剰開示防止に使われる。

Lean対応:

```text
missing_candidate_prevents_issue
high_energy_prevents_issue
low_margin_prevents_issue
low_quality_prevents_issue
stale_freshness_prevents_issue
high_risk_prevents_issue
```

非発行理由を、次のように整理するとよい。

| 理由 | 意味 | 次の処理 |
|---|---|---|
| candidate-missing | 候補がない | 外部ソース追加、手動確認 |
| ambiguous-candidates | 候補が近すぎる | 追加証拠、配送履歴待ち |
| quality-below-threshold | 品質不足 | 再検証、公式ソース確認 |
| stale-evidence | 出典が古い | freshness更新 |
| risk-over-budget | リスク超過 | 手動審査、非発行 |
| history-missing | 履歴接続不足 | lineage補完 |
| duplicate-blocked | 重複登録疑い | nullifier registry確認 |
| privacy-blocked | 過剰開示 | payload redaction |

## 11. API/MCP/Agent/Polkadotの扱いを明示する

第20章の末尾に、次を追加するとよい。

> API、MCP、買い物Agent、Polkadot、QR、SDKは、AMT本体の意味論を利用する応用層である。これらは本体論文で詳細仕様化しない。本体論文では、通信最小開示、登録状態、監査エンベロープ、非発行理由を定義し、具体的な実装仕様はAGID/AOID応用論文に分離する。

表として、次を入れる。

| 層 | 本体論文で扱うか | 内容 |
|---|---:|---|
| AMT semantic layer | 扱う | 属性、登録状態、非発行、監査エンベロープ |
| API endpoint layer | 概要のみ | 実装仕様は応用論文 |
| MCP tool layer | 概要のみ | 公開ツール面とprivate argument拒否 |
| Shopping Agent layer | 概要のみ | 配送可能性、同意、用途スコープ |
| Polkadot anchoring | 概要のみ | commitment anchoringの応用例 |
| ZK proof bundle registry | 別論文 | 住所写像論II |

## 12. 反例を追加する

### 反例20.1 登録即PID発行の反例

```text
submitted address
  -> stored form record
  -> PID issued
```

問題:

> ユーザー入力だけでPIDを発行すると、候補曖昧性、品質不足、古い出典、履歴不足、同名異対象、危険な過剰開示を無視することになる。

修正:

```text
submitted address
  -> AMT pipeline
  -> admissibility gate
  -> verified-registered or non-issuance state
  -> audit envelope
```

### 反例20.2 MCP private argumentの反例

```text
MCP tool call includes privateSalt, addressText, phone, recipient.
```

問題:

> MCPはAgent連携に有用だが、公開ツール面で私的住所素材を受け取ると、住所秘匿と用途スコープが壊れる。

修正:

```text
MCP public tool call includes public proof bundle or commitment only.
Private address material remains local, encrypted, or hidden witness.
```

## 13. 本文で避けるべき表現

| 避ける表現 | 問題 | 修正文 |
|---|---|---|
| 住所は通信プロトコルである | AMT本体ではプロトコル詳細を定義しない | 住所は通信先として機能し得る |
| 登録は住所の真理確定である | 登録は条件付き状態記録である | 登録は証拠と文脈に基づく状態記録である |
| 登録失敗はエラーとして捨てる | 非発行理由は改善入力になる | 非発行状態として記録する |
| 監査には住所本文を保存する | 監査ログが漏洩源になる | commitmentとreason codeで監査する |
| MCP/Polkadotを本体定理にする | 応用実装であり本体理論ではない | 応用層として分離する |
| ZK proof bundle registryを第20章で詳述する | 住所写像論IIの対象である | 第20章では境界だけ扱う |

## 14. 章末まとめを追加する

章末に、次を追加するとよい。

> 本章の結論は、住所を通信先として扱うためには、住所本文をそのまま流通させるのではなく、AMTによって導出された属性、登録状態、非発行理由、監査エンベロープを使うべきだということである。登録は住所の真理宣言ではなく、証拠と文脈に基づく状態記録である。監査は個人情報の公開ではなく、手続き通過の検証可能性である。

続けて、第21章への橋渡しを入れる。

> 次章では、このような通信、登録、監査モデルを含むAMT全体を、Lean、GIS、実装テスト、APIテスト、セキュリティレビュー、未検証項目の一覧として、どのように再現可能に検証するかを整理する。

## 15. 追加後の章構成案

第20章は、次の構成にすると読みやすい。

```text
20.1 住所通信仮説
20.2 通信最小開示原則
20.3 通信に使う住所由来属性
20.4 登録は真理宣言ではない
20.5 登録状態と非発行状態
20.6 監査非公開命題
20.7 監査エンベロープ
20.8 登録失敗時の扱い
20.9 API/MCP/Agent/Polkadotとの境界
20.10 まとめ
```

この構成にすると、第20章は、第19章の識別子境界を受けて、第21章の検証と再現性へ自然に接続できる。
