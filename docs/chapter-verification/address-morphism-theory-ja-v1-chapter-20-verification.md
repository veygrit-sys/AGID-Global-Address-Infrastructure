# 住所写像論 日本語版 v1 第20章 検証ノート

対象: 第20章「通信・登録・監査モデル」

本ノートは、第20章で述べられている「住所は通信先であり、AMT上の住所登録は単なるフォーム保存ではなく、候補生成、クラスタ、非発行判定、品質、履歴、監査を含む」という主張を、Lean形式化、PID監査実装、登録QR、同期キュー、重複登録防止、APIルート、MCP公開面、proof bundle registryに照らして検証したものである。

結論を先に述べると、第20章は採用してよい。ただし、AMT本体論文では、通信、登録、監査を抽象モデルとして扱うべきである。具体的なAPI、MCP、買い物Agent、Polkadot、QR、SDK、ZK proof bundle registry、AOID同期の詳細は、AGID/AOID応用論文または住所写像論IIに分離する。

第20章の安全な中心文は次である。

> 住所は、配送、行政通知、救急、災害支援、本人確認、ロボット誘導などの通信先になり得る。ただし、AMT本体が定義するのは通信プロトコルそのものではなく、通信に使われる住所由来属性、登録状態、PID発行または非発行、監査エンベロープである。

したがって、第20章は「AGID/AOIDのAPI仕様章」ではない。第20章は、AMT本体が応用層へ渡すべき抽象的な通信、登録、監査の境界章である。

## 1. 検証結果の要約

| 観点 | 判定 | 理由 |
|---|---:|---|
| 住所を通信先とみなす | 応用仮説として採用 | 配送、行政、災害支援、本人確認、Agentなどの実装動機として有効。 |
| AMT本体で具体的APIを定義する | 不採用 | API、MCP、Polkadot、買い物Agentは応用層であり、本体では抽象化すべき。 |
| 候補返却と登録は別操作である | Lean/実装で支持 | `issueIfAdmissible` と `addressMorphism.test.ts` が対応する。 |
| 登録は住所の真理宣言である | 不採用 | 登録は、証拠、文脈、品質、鮮度、リスク、履歴のもとで状態を記録する操作である。 |
| 登録失敗は単なるエラーである | 不採用 | Leanと実装はunresolved、品質不足、鮮度不足、リスク超過、重複などを正式状態として扱う。 |
| 監査エンベロープは発行条件を保存すべき | 採用 | PID audit、lifecycle proof、AMN resolution envelopeが対応する。 |
| 監査ログに住所本文や個人情報を載せる | 不採用 | 実装テストがprivate address、phone、recipient、hidden rootsの漏洩を拒否する。 |
| MCP公開面は私的引数を受け取ってよい | 不採用 | MCPテストがprivateSalt、addressText、phone、recipient等を拒否する。 |

## 2. 実行した検証

| 検証 | コマンド | 結果 |
|---|---|---:|
| Lean中核 | `lean formal\AMTCore.lean` | 成功 |
| Lean拡張 | `$env:LEAN_PATH='formal'; lean formal\AMTPaperExtensions.lean` | 成功 |
| PID衝突リスク予算 | `npm run verify:pid-risk` | 成功 |
| 通信・登録・監査関連実装テスト | `npx tsx --test ...` | 81 tests pass |

実装テストには次の主なファイルを含めた。

```text
src/lib/addressMorphism.test.ts
src/lib/pidIssuanceAudit.test.ts
src/lib/pidLifecycleProof.test.ts
src/lib/pidCollisionRisk.test.ts
src/lib/addressDuplicateNullifier.test.ts
src/lib/registeredAddressQr.test.ts
src/lib/syncQueue.test.ts
src/lib/agidAoidGovernance.test.ts
src/lib/apiEndpoints.test.ts
src/server/routes/routeAudit.test.ts
src/server/routes/coreRoutes.test.ts
src/lib/zkProofBundleRegistry.test.ts
src/lib/credentialIssuerTrustRegistry.test.ts
src/lib/addressCredentialFreshnessProof.test.ts
```

実装テストの結果は次である。

```text
tests 81
pass 81
fail 0
duration_ms 2024.704
```

PID衝突リスク検証の結果は次である。

```text
Hash bits: 128
Max issued: 1000000000000
Birthday upper bound: 1.4693679385263966e-15
Required bits: 119
Safety margin bits: 9
Budget: pass
```

## 3. Leanで確認できる部分

### 3.1 登録成功には発行条件が必要である

Lean定義:

```text
IssueAdmissible
issueIfAdmissible
```

Lean定理:

```text
issue_if_admissible_requires_conditions
issue_if_admissible_emits_candidate
```

意味:

> 登録またはPID発行が成功するためには、候補内性、score選択性、品質、鮮度、リスク予算が満たされなければならない。成功した出力は候補集合に含まれる。

第20章では、登録を「住所が真であるという宣言」と書いてはいけない。より正確には、登録は「指定された文脈と証拠のもとで、AMTの発行ゲートを通過した状態を記録する操作」である。

### 3.2 条件不足なら非発行になる

Lean定理:

```text
issue_if_not_admissible_abstains
missing_candidate_prevents_issue
high_energy_prevents_issue
low_margin_prevents_issue
low_quality_prevents_issue
stale_freshness_prevents_issue
high_risk_prevents_issue
```

意味:

> 候補欠落、score過大、候補間margin不足、品質不足、鮮度不足、リスク超過がある場合、AMTは発行を保留し、unresolvedとして扱う。

これは第20章の「登録失敗時の扱い」を支える。登録失敗は単なるエラーではなく、再検証、出典追加、品質改善、履歴更新の入力になる状態である。

### 3.3 unresolvedは誤った実体を発行しない

Lean定理:

```text
unresolved_resolves_no_entity
unresolved_emits_no_false_entity
```

意味:

> unresolvedは実体を解決しないため、誤った実体を発行することもない。

第20章では、登録失敗や非発行を負の結果としてだけ扱わず、安全機構として書くとよい。

## 4. 実装で確認できる部分

### 4.1 PID発行監査

`pidIssuanceAudit.test.ts` は、PID発行が候補生成、クラスタ、unresolvedゲート、履歴更新、PID発行を通過したことを監査エンベロープとして確認している。

確認された性質:

1. unresolved結果ではPID監査証明を発行しない。
2. history witnessなしではPID発行監査を証明しない。
3. 入力住所、postcode、private candidate ids、hidden history rootsを公開証明から除去する。
4. 改ざん署名を拒否する。
5. 同じhidden witnessとprivate audit saltではcommitmentが安定する。

これは第20章の「監査とは私的情報を公開することではなく、必要な手続きを通過したことを確認可能にすること」という主張を支える。

### 4.2 PID履歴監査

`pidLifecycleProof.test.ts` は、PIDのhistory-update、merge、splitを監査可能にするが、hidden history rootsやhidden candidate idsを公開しないことを確認している。

確認された性質:

1. history updateはsequenceとevent countの整合性を確認する。
2. mergeはsource PIDのretireとlineage保存を確認する。
3. splitはhidden partitionsのdisjoint性を確認する。
4. 改ざん署名を拒否する。
5. unstripped local materialを公開証明として拒否する。

第20章では、監査モデルに「発行時監査」だけでなく「履歴更新監査」も含めるとよい。

### 4.3 登録QRとAOID公開面

`registeredAddressQr.test.ts` と `agidAoidGovernance.test.ts` は、登録済み住所やAOIDをQRや公開通信に載せるとき、私的情報が公開面へ漏れないよう制御している。

確認された性質:

1. private QRはlocal/private用途として監査警告付きで許可される。
2. public AGID QRはrecipient、phone、roomを除去してparseされる。
3. public AOID QRはpublic referenceとしてparseされ、owner AOIDには昇格しない。
4. AGID public APIはprivate registered-address fieldsを拒否する。
5. AOID public communicationは平文のprivate AOIDを拒否する。

これは、第20章の通信モデルで「依拠者が必要とする情報だけを渡す」と書く根拠になる。

### 4.4 同期キューと通信失敗

`syncQueue.test.ts` は、通信と同期をlocal-firstかつoffline-awareに扱うことを確認している。

確認された性質:

1. sync queueは安定したlocal-first recordsを作る。
2. offline時にはflushを保留する。
3. retry backoffを尊重する。
4. repeated failuresのbackoffは上限でcapされる。
5. AOID syncはowner-only fieldsをnetwork flush前にredactする。
6. AOID encrypted sync targetは暗号化envelopeのみ受理する。

本文では、同期実装の詳細は書き込まず、「通信失敗は再試行、保留、監査対象の状態として扱う」と抽象化すればよい。

### 4.5 重複登録防止

`addressDuplicateNullifier.test.ts` は、同じ住所、同じAOID、同じ地域で二重登録していないことをnullifierで扱えることを確認している。

確認された性質:

1. AOIDや住所本文を公開せずにduplicate-prevention nullifier proofを作る。
2. 同じhidden address、AOID、regionでは同じnullifierになる。
3. address、AOID、regionが変わるとnullifierも変わる。
4. registryはnullifierだけでduplicate registrationを検出する。
5. hidden addressが署名済みcredentialと一致しない場合は拒否する。

これは応用寄りの仕組みなので、AMT本体では「重複登録は監査・再検証対象になり得る」と書き、詳細は住所写像論IIまたはAGID/AOID応用論文へ分離する。

### 4.6 API、MCP、route audit

`apiEndpoints.test.ts`、`routeAudit.test.ts`、`coreRoutes.test.ts` は、API、MCP、AMN envelope、Polkadot commitment、proof bundle registryなどの応用面を確認している。

確認された性質:

1. API endpoint builderは国、検索、routing、trust registry、proof bundle、revocation freshness、Polkadot、AMN registry endpointsを生成する。
2. Express route定義に重複method/pathがない。
3. AMN APIsはpublic resolution envelopeをcreate、register、verify、reportできる。
4. AMN responseはprivate unit、phone、SECRET、owner-device、private address textを漏らさない。
5. MCP endpointは公開AGID toolsを列挙するが、issuerSecret、privateSalt、addressText、phone、recipientを出さない。
6. MCP tool callはpublic proof bundle register/verifyを扱える。
7. MCPはunknown toolsとprivate argument materialを拒否し、値を漏らさない。

これらは第20章の実装証拠にはなるが、AMT本体論文で詳細仕様化する必要はない。

## 5. 採用すべき命題

### 命題20.1 通信最小開示命題

> 住所由来の通信では、依拠者が必要とする属性だけを公開すべきである。配送可能性だけで十分な相手に、住所本文、部屋番号、電話番号、受取人名を渡すべきではない。

実装対応:

```text
agidAoidGovernance.test.ts
registeredAddressQr.test.ts
syncQueue.test.ts
coreRoutes.test.ts
mcpServer.ts
```

### 命題20.2 登録非真理宣言命題

> AMTにおける登録は、住所の真理を宣言することではない。登録は、証拠、文脈、候補、クラスタ、品質、鮮度、リスク、履歴、監査条件のもとで、対象をどの状態として扱うかを記録する操作である。

Lean対応:

```text
IssueAdmissible
issueIfAdmissible
issue_if_admissible_requires_conditions
issue_if_not_admissible_abstains
```

### 命題20.3 非発行状態記録命題

> 登録条件が不足する場合、AMTはPIDを発行せず、候補欠落、曖昧、品質不足、鮮度不足、リスク超過、履歴不足、過剰開示危険などの理由を記録する。

Lean対応:

```text
missing_candidate_prevents_issue
low_quality_prevents_issue
stale_freshness_prevents_issue
high_risk_prevents_issue
```

### 命題20.4 監査非公開命題

> 監査は、住所本文や個人情報を公開することではない。監査は、必要な手続きが通過されたことをcommitment、policyVersion、decision、historyState、riskStateなどで確認可能にすることである。

実装対応:

```text
pidIssuanceAudit.test.ts
pidLifecycleProof.test.ts
coreRoutes.test.ts
zkProofBundleRegistry.test.ts
```

### 命題20.5 応用詳細分離命題

> API、MCP、買い物Agent、Polkadot、QR、SDK、ZK proof bundle registry、AOID同期は、AMT本体を利用する応用層であり、AMT本体の意味論を再定義してはならない。

実装対応:

```text
apiEndpoints.test.ts
routeAudit.test.ts
coreRoutes.test.ts
mcpServer.ts
polkadotIntegration.test.ts
```

## 6. 反例と修正方針

### 6.1 登録を真理宣言とみなす反例

反例:

```text
user submits address
  -> system stores address
  -> address is treated as true and PID is issued
```

問題:

候補欠落、曖昧性、古い出典、品質不足、危険な過剰開示、履歴不足、同名異対象が無視される。

修正:

```text
user submits address
  -> AMT semantic pipeline
  -> admissibility gate
  -> registered / unresolved / rejected / revalidation-required
  -> audit envelope
```

### 6.2 監査ログに住所本文を載せる反例

反例:

```text
audit log = raw input address + recipient + phone + room + all candidate ids
```

問題:

監査のために過剰開示が起こり、配送秘匿、住所秘匿、AOID所有証明、ZK住所述語の前提が壊れる。

修正:

```text
audit envelope = policyVersion + context + inputCommitment + sourceSet
  + candidateCommitment + clusterCommitment + decision
  + qualityPolicy + freshnessState + historyState + riskState + timestamp
```

### 6.3 API実装をAMT本体と同一視する反例

反例:

```text
MCP endpoint exists
  -> therefore AMT communication model is fully defined
```

問題:

MCP endpointは応用実装であり、AMT本体の通信理論そのものではない。

修正:

```text
AMT core = semantic attributes + registration states + audit envelope
Application layer = API / MCP / Agent / QR / Polkadot / SDK
```

### 6.4 登録失敗を捨てる反例

反例:

```text
registration failed
  -> return error
  -> discard reason
```

問題:

後の再検証、公式ソース追加、履歴補完、自然地理境界改善、品質改善に使えない。

修正:

```text
registration failed
  -> record non-issuance reason
  -> schedule revalidation or data-improvement task
```

## 7. 監査エンベロープの安全な抽象形

第20章の監査エンベロープは、LaTeXの詳細式にしすぎず、次のような抽象構造として書くとよい。

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

ここで、`inputCommitment` は入力住所本文そのものではない。`candidateCommitment` や `clusterCommitment` も、候補やクラスタの全詳細を公開するものではなく、必要に応じて検証可能な抽象表現である。

AMT本体では、commitment方式、署名方式、ZK proof system、root anchoring方式までは定義しない。これらは住所写像論IIまたは応用論文で扱う。

## 8. 本文で避けるべき表現

| 避ける表現 | 理由 | 修正文 |
|---|---|---|
| 住所は通信プロトコルそのものである | AMT本体では具体プロトコルを定義しない | 住所は通信先として機能し得る |
| 登録とは住所の正しさの確定である | AMTは条件付き解決であり、真理宣言ではない | 登録とは証拠と文脈に基づく状態記録である |
| 登録失敗はエラーである | 非発行理由は再検証と改善に使える | 登録失敗は非発行状態として記録する |
| 監査とは全入力を保存することである | 監査ログが個人情報漏洩源になる | 監査はcommitmentと必要最小限の状態で行う |
| MCPやPolkadotを第20章で仕様化する | 応用層の詳細が本体論文を重くする | 本体では抽象境界だけを扱う |

## 9. 限界

第20章単独では、次の点を完全には検証しない。

1. 具体的なAPI仕様の完全性。
2. MCP tool schemaの長期互換性。
3. 買い物Agentの全ユースケース。
4. Polkadot連携のfinalityや手数料設計。
5. QR、SDK、AOID同期の全運用仕様。
6. 本格ZK回路のsoundnessとzero-knowledge性。
7. 法的な登録正当性や行政上の効力。

これらは、AMT本体論文ではなく、AGID/AOID応用論文、住所写像論II、または実装仕様書へ送るべきである。

## 10. 最終評価

第20章は、住所写像論を現実の配送、行政通知、災害支援、本人確認、Agent通信へ接続するために有用である。ただし、本体論文で扱うべきなのは、具体的通信仕様ではなく、次の三点である。

1. 住所由来属性を必要最小限に分離して通信へ渡すこと。
2. 登録を真理宣言ではなく、AMT条件を通過した状態記録として扱うこと。
3. 監査を私的情報公開ではなく、手続き通過の検証可能なエンベロープとして扱うこと。

この修正により、第20章は、第19章のPID/AGID/AOID境界を受けて、応用層へ接続するための安全な抽象モデルになる。
