# 住所写像論 日本語版 v1 第22章 検証ノート

対象: 第22章「セキュリティ・悪用・ガバナンス」

本ノートは、第22章で述べられている「住所は高リスク情報であり、AMTは安全な住所システムを作るための意味論的前提を提供するが、暗号安全性そのものは別レイヤで扱うべきである」という主張を、Lean形式化、AGID/AOID公開面、QR赤字化、AOID同期、ZK proof bundle、credential issuer trust、revocation/freshness、MCP/API境界、出典ライセンス検査に照らして検証したものである。

結論を先に述べると、第22章は採用してよい。ただし、現在の原文は短く、攻撃者モデルと資産分類が不足している。第22章には、少なくとも次を追加すべきである。

1. 守るべき資産。
2. 攻撃者モデル。
3. 信頼境界。
4. 公開できるAMTコアと秘匿すべき運用情報の分離。
5. ZK、credential、AOID、MCP、PolkadotなどをAMT本体から分離する理由。
6. ガバナンス上の訂正、異議申し立て、失効、鮮度、ライセンス、災害時例外。

第22章の安全な中心文は次である。

> AMTは暗号プロトコルそのものではない。AMTは、どの住所由来情報が公開地理参照で、どの情報が私的配送情報で、どの状態ではPIDを発行せず、どの証拠を監査可能な最小情報として残すべきかを定義する意味論的安全層である。

この表現なら、住所写像論本体とAGID/AOID応用、ZK住所証明論文を安全に分離できる。

## 1. 検証結果の要約

| 観点 | 判定 | 理由 |
|---|---:|---|
| 住所は高リスク情報である | 採用 | 居住、移動、配送、家族、職場、財産、避難、本人確認に結びつく。 |
| AMT本体が暗号安全性を提供する | 不採用 | AMTは意味論的安全層であり、暗号プロトコル、鍵管理、ZK回路監査は別論文または応用層で扱う。 |
| unresolvedやrejectedは安全機構である | Leanで支持 | `unresolved_emits_no_false_entity`、`issue_if_not_admissible_abstains` が対応する。 |
| 出典汚染はAMT上の脅威である | Lean/実装で支持 | `unknown_source_prevents_verified_claim`、`rejected_source_prevents_verified_claim`、postal source testsが対応する。 |
| 公開可能コアと秘匿運用情報を分ける | 実装で支持 | privacy、QR、AOID同期、MCP、OpenAPI、ZK bundle testsが対応する。 |
| ZKやcredentialの詳細を第22章で全て定義する | 不採用 | AMT本体では境界だけを書く。詳細は住所写像論IIに分離する。 |
| オープンソース化すれば安全である | 不採用 | 公開範囲、鍵管理、秘密値、ログ、濫用対策しきい値の分離が必要である。 |

## 2. 実行した検証

| 検証 | コマンド | 結果 |
|---|---|---:|
| Lean中核 | `lean formal\AMTCore.lean` | 成功 |
| Lean拡張 | `$env:LEAN_PATH='formal'; lean formal\AMTPaperExtensions.lean` | 成功 |
| PID衝突リスク予算 | `npm run verify:pid-risk` | 成功 |
| GIS警告予算 | `npm run verify:gis:budget` | 成功 |
| セキュリティ関連代表実装テスト | `npx tsx --test ...` | 120 tests pass |

代表実装テストには次の主なファイルを含めた。

```text
src/lib/privacyPolicy.test.ts
src/lib/registeredAddressQr.test.ts
src/lib/syncQueue.test.ts
src/lib/agidAoidGovernance.test.ts
src/lib/addressDuplicateNullifier.test.ts
src/lib/addressCredentialFreshnessProof.test.ts
src/lib/aoidOwnershipProof.test.ts
src/lib/regionMembershipProof.test.ts
src/lib/qualityThresholdProof.test.ts
src/lib/consentPurposeScopeProof.test.ts
src/lib/revocationFreshnessRootAnchoring.test.ts
src/lib/privateAddressPredicateProof.test.ts
src/lib/zkProofBundleRegistry.test.ts
src/lib/zkProofCompatibility.test.ts
src/lib/credentialIssuerTrustRegistry.test.ts
src/data/postalSourceMetadata.test.ts
src/server/routes/routeAudit.test.ts
src/server/routes/coreRoutes.test.ts
src/lib/openApiSpec.test.ts
src/lib/apiEndpoints.test.ts
```

実装テストの結果は次である。

```text
tests 120
pass 120
fail 0
duration_ms 1915.7194
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

GIS警告予算の結果は次である。

```text
Features: 351
Errors: 0/0
Warnings: 149/149
Registered sources: 408/408
Result: pass
```

## 3. Leanで確認できる安全性

Leanは、現実の攻撃を全て防ぐ証明ではない。しかし、第22章の安全原則を支える形式的な核を提供する。

### 3.1 非発行状態は誤った実体を発行しない

Lean定理:

```text
ambiguous_emits_no_false_entity
unresolved_emits_no_false_entity
rejected_emits_no_false_entity
```

意味:

> ambiguous、unresolved、rejectedは、安全側の出力であり、誤った実体を解決結果として発行しない。

第22章では、未解決状態の無視を脅威として扱うべきである。ユーザー体験だけを優先して強制的にPIDを発行すると、AMTの安全設計が壊れる。

### 3.2 PID発行には条件が必要である

Lean定理:

```text
issue_if_admissible_requires_conditions
issue_if_not_admissible_abstains
missing_candidate_prevents_issue
low_quality_prevents_issue
stale_freshness_prevents_issue
high_risk_prevents_issue
```

意味:

> 候補欠落、品質不足、鮮度不足、リスク超過がある場合、PID発行は止められる。

これは、PID誤発行、低品質地域での過剰自動化、古い出典の誤利用に対する形式的な根拠である。

### 3.3 出典汚染は検証済み主張を止める

Lean定理:

```text
unknown_source_prevents_verified_claim
rejected_source_prevents_verified_claim
accepted_gis_certificate_has_no_errors
```

意味:

> 未知の出典、拒否された出典、エラーを含むGIS証明書は、検証済み主張の根拠にできない。

これは、第22章の出典ガバナンス、ライセンス、公式ソース管理に直結する。

### 3.4 ZK proof bundleの境界はAMT本体から分離できる

Lean定理:

```text
accepted_proof_bundle_exposes_no_private_material
accepted_proof_bundle_requires_domain_separation
```

意味:

> 受理されたproof bundleは私的材料を公開せず、domain separationを必要とする。

ただし、これはZK回路の完全な暗号監査ではない。AMT本体では「ZKは住所由来述語を秘匿証明する応用層である」と書くのが正確である。

## 4. 守るべき資産

第22章には、次の資産分類を追加すべきである。

| 資産 | 例 | 主なリスク |
|---|---|---|
| 個人住所本文 | 番地、部屋番号、建物名 | 漏えい、ストーキング、過剰開示 |
| AOID秘密情報 | 秘密鍵、所有者credential、private salt | 乗っ取り、なりすまし、権限委譲悪用 |
| 配送情報 | 受取人、電話番号、置き配指示 | 配送詐欺、住居推定 |
| 監査情報 | PID発行理由、履歴root、commitment | linkability、再識別 |
| 出典情報 | 公式ソース、地図ソース、郵便ソース | 出典汚染、古いデータ、ライセンス違反 |
| 品質情報 | 内部スコア、低品質地域、再検証理由 | 濫用、差別的扱い、攻撃対象化 |
| 公開識別子 | AGID、PID、public AOID reference | 相関、追跡、replay |

重要なのは、これらを同じ「住所データ」として扱わないことである。公開してよいもの、文脈付きで公開するもの、端末内だけに置くもの、絶対にログへ出さないものを分ける必要がある。

## 5. 攻撃者モデル

第22章には、次の攻撃者モデルを追加するとよい。

| 攻撃者 | 目的 | 対策 |
|---|---|---|
| 外部閲覧者 | 公開QRやAPIから個人住所を推定する | public payload redaction、private fields禁止 |
| 悪意ある登録者 | 偽住所、重複AOID、他人住所を登録する | nullifier、credential、issuer trust、audit proof |
| 悪意ある配送者 | 配送可能性や受取資格を悪用する | purpose scope、delivery eligibility、freshness |
| 悪意あるデータ提供者 | 出典汚染、古い境界、偽地物を入れる | source registry、license audit、GIS budget |
| 内部運用者 | ログや監査情報から個人を再識別する | log redaction、commitment監査、最小保持 |
| リプレイ攻撃者 | 古いproofやnullifierを再利用する | challenge、domain separation、revocation root |
| 過剰自動化システム | 低品質地域で誤発行する | quality gate、unresolved、revalidation-required |

この表を入れると、第22章が一般論ではなく、AMT実装で何を守るべきかの章になる。

## 6. 実装テストで確認できた安全境界

### 6.1 公開QRとログ

対応テスト:

```text
privacyPolicy.test.ts
registeredAddressQr.test.ts
```

確認できた内容:

1. public registered-address QR payloadは個人情報と正確座標を除去する。
2. public AOID QR payloadはAGID参照を残し、owner-only delivery fieldsを除去する。
3. malformed AOID QRはローカル登録前に拒否される。
4. ログ赤字化は住所らしいquery値と座標を除去する。
5. private local storage clearは宣言済みprivate keyだけを消す。

### 6.2 AGID/AOID公開面

対応テスト:

```text
agidAoidGovernance.test.ts
syncQueue.test.ts
```

確認できた内容:

1. AGID public surfacesはprivate registered-address fieldsを拒否する。
2. AOID public communicationはpublic referencesだけを公開する。
3. AOID encrypted syncはowner-device envelopeを要求する。
4. AOID sync queueはowner-only address fieldsをnetwork flush前に赤字化する。
5. malformed encrypted envelopeは送信されない。

### 6.3 ZK proof bundleと秘匿証明境界

対応テスト:

```text
addressDuplicateNullifier.test.ts
addressCredentialFreshnessProof.test.ts
aoidOwnershipProof.test.ts
regionMembershipProof.test.ts
qualityThresholdProof.test.ts
consentPurposeScopeProof.test.ts
revocationFreshnessRootAnchoring.test.ts
privateAddressPredicateProof.test.ts
zkProofBundleRegistry.test.ts
zkProofCompatibility.test.ts
```

確認できた内容:

1. AOIDや住所本文を出さずに重複防止nullifierを検証できる。
2. credential freshnessとnon-revocationをcredential bodyなしで証明できる。
3. AOID所有をAOID本文やprivate dataなしで証明できる。
4. 地域所属や配送可能区域内性を座標なしで証明できる。
5. 品質しきい値をexact scoreなしで証明できる。
6. 同意と用途スコープをconsent bodyなしで証明できる。
7. unstripped private proof materialは検証時に拒否される。
8. scope、challenge、nullifier、commitmentの衝突を検出できる。

第22章では、これらを「AMT本体の暗号的証明」ではなく、「応用層がAMTの属性写像を安全に消費する例」と書くべきである。

### 6.4 APIとMCP公開境界

対応テスト:

```text
coreRoutes.test.ts
openApiSpec.test.ts
apiEndpoints.test.ts
routeAudit.test.ts
```

確認できた内容:

1. Credential issuer trust APIはpublic issuer secretsを受け入れない。
2. ZK proof bundle APIはpublic commitment surfacesとして文書化されている。
3. AMN APIはpublic resolution envelopeとして扱われる。
4. MCP endpointはpublic AGID toolsを列挙し、private fieldsを拒否する。
5. 不明なMCP toolとprivate argument materialは拒否される。
6. route auditはduplicate method/path pairsを検出する。

## 7. オープンソース化できる部分

第22章の原文は、オープンソース化できる部分を列挙している。この方向は採用できる。より正確には、次の表にするとよい。

| 公開しやすい部分 | 理由 |
|---|---|
| 形式モデル | 個人住所や秘密鍵を含まない。 |
| 状態機械 | resolved、ambiguous、unresolved、rejectedなどの安全仕様を公開できる。 |
| PID発行許容述語 | 誤発行防止の透明性を高める。 |
| 出典メタデータスキーマ | 出典、ライセンス、鮮度、権威の監査に必要。 |
| GIS検証スクリプト | 地物検証と警告予算を再現可能にする。 |
| エラー理由コード | 失敗時の再検証や異議申し立てを支える。 |
| ベンチマーク方法 | 商用API比較を透明にする。 |
| 公開API仕様 | private fieldsを受け入れない境界を示す。 |

## 8. 公開すべきでない部分

原文の方向は正しいが、次のように細分化すると安全になる。

| 公開注意対象 | 理由 | 例外 |
|---|---|---|
| 個人住所本文 | ストーキング、住居推定、過剰開示 | 本人が明示同意した配送文脈 |
| AOID秘密鍵 | 所有権乗っ取り | なし |
| private salt | nullifierやcommitmentの再識別防止に必要 | なし |
| 内部濫用対策しきい値 | 攻撃回避に使われる | 集計された安全方針のみ公開 |
| 配送事業者の非公開リスク信号 | 詐欺回避情報を漏らす | 事業者合意済みの抽象分類 |
| 未公開脆弱性 | 攻撃を容易にする | coordinated disclosure後 |
| 生監査ログ | 個人情報や履歴相関を含み得る | 赤字化済みcommitmentログ |
| 低品質地域の詳細失敗パターン | 悪用対象化される | 再検証対象という抽象状態 |

## 9. ガバナンス上の要件

第22章のガバナンス節は採用できるが、もう少し構造化した方がよい。

| ガバナンス項目 | AMT上の扱い |
|---|---|
| 出典権威 | source registryとcontextで明示する。 |
| ライセンス | redistributable、review-required、restrictedを分ける。 |
| 更新頻度 | freshness windowとrevalidation-requiredへ接続する。 |
| 異議申し立て | corrected-by、superseded-by、disputed edgeを履歴に残す。 |
| 削除要求 | raw private data削除とpublic commitment保持を分ける。 |
| 災害時例外 | 仮想住所、避難所、支援資格、鮮度を別扱いする。 |
| 政治的名称 | claim-aware displayとsource attributionを使う。 |
| 低品質地域 | 自動発行せず、manual reviewまたはunresolvedにする。 |

AMTは、世界単一の住所権威を仮定しない。この点は第22章で明確に書くべきである。

## 10. 反例と注意点

### 10.1 オープンソース化すれば安全という反例

反例:

> 形式モデルと実装を公開すれば、住所システムは自動的に安全になる。

これは誤りである。公開により透明性は上がるが、private salt、AOID秘密鍵、個人住所、内部リスク信号、未公開脆弱性、ログ保持方針を誤ると、むしろ攻撃面が増える。

### 10.2 ZKPが住所真実性を保証するという反例

反例:

> ZKPを使えば住所が正しいことまで証明できる。

これは誤りである。ZKPは、秘密入力を公開せずに述語を満たすことを証明する。住所の真実性は、credential issuer、AMT候補、出典鮮度、失効、監査に依存する。

### 10.3 監査ログを全保存する反例

反例:

> 不正対策のため、入力住所、候補リスト、電話番号、配送指示を全て監査ログに保存する。

これは危険である。監査ログが漏洩源になる。第22章では、監査はcommitment、reason code、policy version、decision、freshness、redacted envelopeを中心にすべきである。

### 10.4 低品質地域で自動化する反例

反例:

> 低品質地域でもユーザー体験のためにPIDを強制発行する。

これは、誤配送、誤登録、重複登録、政治的名称の誤扱い、自然地物境界の誤認を引き起こす。第22章では、低品質地域ではunresolved、manual review、revalidation-requiredを安全機構として使うべきである。

## 11. 本文に採用できる原則

### 原則22.1 高リスク住所情報原則

> 住所は、個人、財産、移動、配送、職場、避難、本人確認に接続する高リスク情報である。

### 原則22.2 意味論と暗号の分離原則

> AMTは住所参照の意味論を提供する。暗号的秘匿、鍵管理、ZK回路監査、credential発行は応用層または住所写像論IIで扱う。

### 原則22.3 最小開示原則

> 住所由来情報は、文脈が必要とする最小属性だけを公開し、住所本文やprivate fieldsを不要に公開してはならない。

### 原則22.4 安全側非発行原則

> 品質、鮮度、出典、リスク、履歴、候補完全性が不足する場合、AMTはPIDを発行せず、unresolved、rejected、revalidation-requiredを返す。

### 原則22.5 公開可能コア分離原則

> 形式モデル、状態機械、検証スクリプト、スキーマ、ベンチマーク方法は公開可能なコアに属し、個人住所、秘密鍵、private salt、内部濫用対策しきい値、生監査ログは秘匿運用情報に属する。

### 原則22.6 出典ガバナンス原則

> 住所解決に使う出典は、権威、文脈、ライセンス、鮮度、更新頻度、異議申し立て可能性を明示しなければならない。

## 12. 第22章の結論

第22章は、住所写像論の中でも重要度が高い章である。住所理論は、単に「住所を正しく解く」だけでは不十分である。誤って解くこと、過剰に公開すること、古い出典を使うこと、低品質地域で自動発行すること、監査ログに個人情報を残すことも、理論上の失敗として扱う必要がある。

したがって、第22章では、次を断言してよい。

> AMTは、住所解決の意味論に安全側状態、出典ガバナンス、最小開示、非発行条件、監査境界を組み込む理論である。

一方で、次は断言してはならない。

> AMT本体だけで暗号安全性、鍵管理、ZK回路安全性、配送事業者の詐欺対策、法的本人確認を完全に保証する。

AMT本体は安全な住所システムの意味論的基礎であり、AGID/AOID応用論文と住所写像論IIは、その上に通信、所有、credential、ZK、MCP、Agent、Polkadotなどの具体的な安全プロトコルを構築する。
