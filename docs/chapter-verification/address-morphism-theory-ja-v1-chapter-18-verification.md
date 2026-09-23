# 住所写像論 日本語版 v1 第18章 検証ノート

対象: 第18章「AMTと暗号拡張の境界」

本ノートは、第18章で述べられている「AMTは住所意味論であり、ZKPなどの暗号拡張はAMT由来の属性や監査エンベロープを消費する別層である」という主張を、Lean形式化、ZK証明エンベロープ実装、credential、revocation、freshness、proof bundle互換性テストに照らして検証したものである。

結論を先に述べると、第18章は強く採用してよい。ただし、本文では次の境界を徹底する必要がある。

> AMTは、何を証明するかを定義する意味論である。ZKPは、その意味論から得られた限定述語を、住所本文を公開せずに証明する暗号層である。

したがって、AMTだけでは暗号的秘匿性を保証できない。また、ZKPだけでは住所候補生成、クラスタ、履歴対応、地域境界、配送可能性、公式性、鮮度の意味論的妥当性を保証できない。

第18章の安全な中心文は次である。

> AMT本体論文では、住所意味論、属性写像、履歴、品質判定、PID発行監査エンベロープまでを扱う。ZK Address Proof、ZK Residence Proof、ZK Delivery Eligibility、AOID Ownership Proof、duplicate nullifier、revocation root、freshness root、proof bundle registry、anonymous rate limit、issuer trust registryの暗号プロトコル詳細は、別論文「住所写像論 II: 零知識住所述語」で扱う。

## 1. 検証結果の要約

| 観点 | 判定 | 理由 |
|---|---:|---|
| AMTとZKPを分離する | 強く採用 | Leanと実装の両方が、意味論条件と証明エンベロープ条件を別物として扱う。 |
| AMTは住所意味論を提供する | 採用 | AMTは候補、クラスタ、属性、履歴、品質、監査エンベロープを定義する。 |
| ZKPは限定述語を秘匿証明する | 部分採用 | 実装は証明エンベロープとして支持する。完全な暗号回路の安全性は別途監査が必要である。 |
| 公開述語が粗いほど秘匿性の余地がある | Leanで支持 | `predicate_proof_collision_hides_private_value` が対応する。 |
| 公開述語が細かすぎると秘密値を特定し得る | Leanで支持 | `injective_public_claim_identifies_private_value` が対応する。 |
| 用途に必要な属性がなければ証明できない | Leanで支持 | `missing_required_attribute_prevents_attribute_gate` が対応する。 |
| 証明バンドルは秘密素材を露出してはならない | Leanと実装で支持 | `accepted_proof_bundle_exposes_no_private_material` と互換性テストが対応する。 |
| 証明バンドルはdomain separationを必要とする | Leanと実装で支持 | `accepted_proof_bundle_requires_domain_separation` とscope/challengeテストが対応する。 |
| TypeScriptだけで本格ZK回路まで実装済みと言う | 不採用 | 実装方針はTSをエンベロープ層に置き、回路はNoir/Circom/Rust-ZKVM等を推奨する。 |

## 2. 実行した検証

| 検証 | コマンド | 結果 |
|---|---|---:|
| Lean中核 | `lean formal\AMTCore.lean` | 成功 |
| Lean拡張 | `$env:LEAN_PATH='formal'; lean formal\AMTPaperExtensions.lean` | 成功 |
| ZK/credential/registry実装テスト | `npx tsx --test ...` | 88 tests pass |

実装テストには次のファイルを含めた。

```text
src/lib/privateAddressPredicateProof.test.ts
src/lib/agidZkAddressProofs.test.ts
src/lib/regionMembershipProof.test.ts
src/lib/qualityThresholdProof.test.ts
src/lib/consentPurposeScopeProof.test.ts
src/lib/aoidOwnershipProof.test.ts
src/lib/addressCredential.test.ts
src/lib/addressCredentialFreshnessProof.test.ts
src/lib/anonymousRateLimitProof.test.ts
src/lib/pidIssuanceAudit.test.ts
src/lib/zkProofCompatibility.test.ts
src/lib/zkProofBundleRegistry.test.ts
src/lib/credentialIssuerTrustRegistry.test.ts
src/lib/revocationFreshnessRootAnchoring.test.ts
src/lib/zkProofRuntime.test.ts
```

実装テストの結果は次である。

```text
tests 88
suites 1
pass 88
fail 0
duration_ms 1322.4013
```

## 3. Leanで確認できる部分

### 3.1 公開述語が粗い場合の秘匿性

Lean定理:

```text
predicate_proof_collision_hides_private_value
```

意味:

> ある公開述語に対して、異なる秘密値が同じ公開値へ写るなら、公開値だけから秘密値を一意に識別することはできない。

これは、住所本文を出さずに「日本在住」「東京都内」「配送可能地域内」のような粗い主張だけを公開する設計の最小モデルである。

ただし、これは本格的なZK回路の完全性、健全性、零知識性を証明するものではない。第18章では「AMTがZK述語の意味論を与える」と書くべきであり、「AMTがZK安全性を証明する」とは書くべきでない。

### 3.2 公開述語が細かすぎる場合の漏洩

Lean定理:

```text
injective_public_claim_identifies_private_value
```

意味:

> 公開述語が秘密値に対して注入的である場合、同じ公開値は同じ秘密値を意味する。したがって、公開述語が細かすぎると秘密値を特定し得る。

これはZKP設計上の重要な警告である。ゼロ知識の仕組みを使っても、公開する述語が実質的に住所を一意化するなら、プライバシーは失われる。

第18章では、次のように書くと安全である。

> 暗号拡張が公開する述語は、目的に必要な最小粒度に制限されなければならない。公開述語が細かすぎる場合、証明システムがゼロ知識であっても、公開主張そのものが秘密住所を一意化する可能性がある。

### 3.3 用途スコープと属性充足

Lean定義:

```text
CoversRequiredAttributes
```

Lean定理:

```text
missing_required_attribute_prevents_attribute_gate
```

意味:

> 用途が要求する属性をcredentialが持たない場合、その用途向けの住所述語証明は通過できない。

これは「配送用だけ」「本人確認用だけ」「地域資格用だけ」といった用途制限の基礎である。第18章では詳細回路を定義せず、AMTが属性写像と用途要件の材料を渡す、と書けばよい。

### 3.4 Proof bundle互換性

Lean構造:

```text
ProofBundlePolicy
ProofBundleAccepted
```

Lean定理:

```text
accepted_proof_bundle_exposes_no_private_material
accepted_proof_bundle_requires_domain_separation
```

意味:

> 受理された証明バンドルは、秘密素材を露出しない条件とdomain separation条件を満たす。

このモデルは、ZK Address Proof、Residence Proof、Delivery Eligibility、AOID Ownership、PID Auditなどを同じ操作で組み合わせるときの安全条件を抽象化している。

## 4. 実装で確認できる部分

### 4.1 住所本文を出さない述語証明エンベロープ

`privateAddressPredicateProof.test.ts` と `agidZkAddressProofs.test.ts` は、配送可能性、居住国、都市内、同一住所グループ、AGID/AOID地域所属などの主張を、住所本文や座標を出さずに証明エンベロープとして扱えることを確認している。

確認された性質:

1. 住所本文を公開しない。
2. 座標や地域ジオメトリを公開しない。
3. hidden witnessが対象述語を満たさない場合は証明作成を拒否する。
4. unstripped private materialを含む公開証明は検証で拒否する。
5. proof bundle互換性モデルと合成できる。

安全な本文表現:

> 現在の実装は、住所由来の限定述語を公開する証明エンベロープを検証している。完全な暗号学的ZK回路の健全性と零知識性は、別途回路実装と監査が必要である。

### 4.2 Credential、失効、鮮度

`addressCredential.test.ts` と `addressCredentialFreshnessProof.test.ts` は、署名付き住所credential、credential本文の秘匿、失効snapshot、鮮度窓、tamper拒否を確認している。

確認された性質:

1. 検証済み住所結果から軽量credentialを発行できる。
2. credentialの署名改ざんを拒否する。
3. private saltやlocal cache keyを公開credentialから除去できる。
4. credentialが失効snapshotに含まれる場合はfreshness proofを作らない。
5. 古いfreshness windowは検証で拒否される。
6. unstripped local freshness proof materialは公開証明として拒否される。

第18章での扱い:

> credential、revocation、freshnessは暗号拡張層であり、AMT本体ではその入力となる属性、品質、履歴、出典、ポリシーバージョンを定義する。

### 4.3 AOID所有、同意、匿名レート制限

`aoidOwnershipProof.test.ts`、`consentPurposeScopeProof.test.ts`、`anonymousRateLimitProof.test.ts` は、AOID所有、登録済みcredential保有、用途スコープ、同意撤回、匿名レート制限を、直接の個人情報なしに証明エンベロープ化できることを確認している。

確認された性質:

1. AOID秘密鍵やcredential private saltを公開しない。
2. purpose scope escalationを拒否する。
3. 同意grantが失効snapshotに含まれる場合は証明作成を拒否する。
4. 匿名レート制限はbucket nullifierとrequest nullifierを分ける。
5. ledgerはnullifierだけでquotaとreplayを制御できる。

ただし、これらはAMT本体の中心定義ではない。第18章では「別論文へ送るべき詳細」として列挙するのが適切である。

### 4.4 PID発行監査

`pidIssuanceAudit.test.ts` は、候補生成、クラスタ、unresolvedゲート、履歴更新、PID発行を通過したことを監査エンベロープとして証明する流れを確認している。

確認された性質:

1. unresolved結果では監査付きPIDを発行しない。
2. history witnessなしではPID発行監査を証明しない。
3. 改ざん署名は拒否される。
4. 同じhidden witnessとprivate audit saltではcommitmentが安定する。

第18章では、PID発行監査エンベロープをAMTが暗号拡張へ渡せる出力として残すとよい。暗号回路の詳細は別論文へ送る。

### 4.5 Proof bundle registryと互換性

`zkProofCompatibility.test.ts` と `zkProofBundleRegistry.test.ts` は、複数の公開証明を同じ操作に束ねるときの互換性を確認している。

確認された性質:

1. 同じscopeとchallengeを持つ公開証明を受理する。
2. private proof materialが残っている証明を拒否する。
3. duplicate single-use nullifierを拒否する。
4. nullifierとcommitmentのcross-role collisionを検出する。
5. scope mismatchとchallenge mismatchを拒否する。
6. registryはraw proof materialを保存しない。
7. single-use nullifierのcross-bundle replayを拒否する。
8. bundle revocation後は検証を無効にする。

これは第18章の「proof bundle同士が互換であることはAMT単体では保証できない」という主張を補強する。

### 4.6 TypeScriptと本格ZK回路の境界

`zkProofRuntime.test.ts` は、TypeScriptをproof envelope APIとJSON相互運用の層として残し、本格的な述語評価やZK回路はRust、Noir、Circom、Rust-ZKVMなどへ分離する方針を確認している。

確認された性質:

1. envelope runtimeのprimary languageはTypeScriptでよい。
2. predicate runtimeのpreferred languageはRustである。
3. formal proof runtimeのpreferred languageはNoir/Circom/Rust-ZKVMである。
4. TypeScriptは本格ZK回路の主実装言語ではない。

第18章の書き方:

> 本稿の実装は、証明エンベロープ、互換性、登録、検証APIの境界をTypeScriptで扱う。暗号学的ZK回路は、別実装、別検証、別監査の対象である。

## 5. 節ごとの判定

### 5.1 18.1の判定

「AMTだけでは暗号安全性を保証しない。ZKPだけでは住所の真実性を保証しない」という主張は、強く採用すべきである。

この章の核はここである。第18章はZKPの宣伝章ではなく、AMT本体を過剰な暗号主張から守る境界章である。

### 5.2 18.2の判定

AMTが提供するものの列挙は妥当である。ただし、「品質スコア」は直接の公開値ではなく、品質しきい値判定または監査可能な品質条件として渡す、と補足するとよい。

安全な言い換え:

> 品質スコアそのものではなく、品質しきい値を満たすか、または再検証対象であるかの判定を暗号拡張へ渡す。

### 5.3 18.3の判定

暗号拡張が提供するものの列挙は妥当である。ただし、実装済みの証明エンベロープと、本格的なZK回路を区別する必要がある。

本文では、次を追加するとよい。

> 本稿で確認した実装は、証明エンベロープと互換性モデルであり、完全な暗号学的ZK回路の安全性証明ではない。

### 5.4 18.4の判定

AMTだけでは保証できないことの列挙は妥当である。追加するなら、次を含めるとよい。

1. 公開述語が細かすぎることによる一意化漏洩。
2. 証明回路とAMT述語の不一致。
3. issuer trust registryの運用上の正しさ。
4. revocation/freshness rootの最新性。

### 5.5 18.5の判定

ZKPだけでは住所意味論を保証できないという主張は正しい。特に「地域境界が正しいこと」「配送可能区域が正しいこと」「入力住所が現実に存在すること」は、ZKPが自動的に作る性質ではない。

第18章では、次の一文が有効である。

> ZKPは、述語の充足を秘匿して示す装置であり、述語そのものの地理的、制度的、配送上の妥当性を自動的に生成する装置ではない。

### 5.6 18.6の判定

境界図式は採用できる。ただし、より正確には「ZK proof」ではなく「cryptographic predicate layer」と「public statement」を分けるとよい。

推奨図式:

```text
surface address expression
  -> AMT semantic pipeline
  -> resolved class / attributes / history / audit envelope
  -> cryptographic predicate layer
  -> proof envelope or ZK proof
  -> limited public statement
```

この図式なら、現在の証明エンベロープ実装と、将来の本格ZK回路の両方を自然に含められる。

### 5.7 18.7の判定

本稿に残す範囲と外す範囲の切り分けは妥当である。第18章では、ZKP詳細の目次を長く展開しすぎず、「別論文で扱う」と明確に書くのがよい。

### 5.8 18.8の判定

第3部の結論として妥当である。第13章から第17章で拡張した意味論を、第18章で暗号拡張へ安全に接続する形になっている。

## 6. 反例と注意点

### 6.1 細かすぎる公開述語

反例:

```text
公開主張: この住所は東京都千代田区丸の内1-1-1の3階区画である
```

この主張は、形式的には住所本文を出していないように見えても、実質的には住所を一意化する。ZKPを使っても、公開述語が一意識別子になれば秘匿性は弱い。

修正:

```text
公開主張: 東京都内である
公開主張: 配送対象区域内である
公開主張: 指定サービスの受取可能条件を満たす
```

### 6.2 ZKPだけで住所真理を保証するという誤解

反例:

```text
証明者が「配送可能区域内である」ことをZKで証明した。
しかし、その配送可能区域の境界データが古かった。
```

ZKPは、古い境界データに対して正しい証明を作ることができてしまう。この場合、暗号的には正しくても、住所意味論としては弱い。

修正:

```text
boundaryDatasetId
policyVersion
sourceAuthority
freshnessWindow
revocationRoot
```

をpublic statementまたは監査エンベロープに含める。

### 6.3 credential issuerの信頼性

反例:

```text
credentialは正しく署名されている。
しかしissuerが信頼できない、または対象scopeの権限を持たない。
```

署名検証だけでは、issuerの制度的権限は保証されない。

修正:

```text
credential issuer trust registry
issuer scope
issuer status
validity window
```

を別層で確認する。

### 6.4 proof bundleの衝突

反例:

```text
ZK Address ProofとAnonymous Rate Limit Proofが同じnullifier値を別用途で共有する。
```

これにより、異なる用途の証明がリンクされ得る。

修正:

```text
domain separation
scope binding
challenge binding
single-use nullifier replay rejection
cross-role collision detection
```

を必須にする。

## 7. 本章で採用できる命題

### 命題18.1 意味論暗号分離命題

> AMTは住所由来の意味論的対象を生成する理論であり、ZKPなどの暗号拡張はその対象に対する限定述語を秘匿証明する層である。

根拠:

Leanと実装は、住所意味論の生成、証明エンベロープ、proof bundle互換性を別の構造として扱っている。

### 命題18.2 粗粒度公開述語命題

> 公開述語が複数の秘密住所を同じ公開主張へ写す場合、公開主張だけから秘密住所を一意に決定することはできない。

Lean対応:

```text
predicate_proof_collision_hides_private_value
```

### 命題18.3 注入的公開述語漏洩命題

> 公開述語が秘密住所に対して注入的である場合、公開主張は秘密住所を一意化し得る。

Lean対応:

```text
injective_public_claim_identifies_private_value
```

### 命題18.4 用途属性充足命題

> ある用途の証明には、その用途が要求する属性がhidden credentialに含まれていなければならない。

Lean対応:

```text
missing_required_attribute_prevents_attribute_gate
```

### 命題18.5 証明バンドル受理条件命題

> 住所由来の複数証明を同じ操作に束ねる場合、domain separation、scope整合性、nullifier replay防止、freshness、revocation、issuer trust、公開主張の粗さ、秘密素材非露出が必要である。

Lean対応:

```text
ProofBundlePolicy
ProofBundleAccepted
accepted_proof_bundle_exposes_no_private_material
accepted_proof_bundle_requires_domain_separation
```

## 8. 検証できない、または別検証が必要な範囲

| 項目 | 現在の状態 | 理由 | 次の検証方法 |
|---|---:|---|---|
| 本格ZK回路のsoundness | 未検証 | TS実装は証明エンベロープ中心 | Noir/Circom/Rust-ZKVM回路と監査 |
| 本格ZK回路のzero-knowledge性 | 未検証 | 回路と証明システムが別途必要 | 回路仕様、シミュレータ証明、第三者監査 |
| issuerの現実制度上の正当性 | 未完全 | registryは運用モデルであり法的権限までは証明しない | issuer登録ポリシー、監査ログ、法域別審査 |
| revocation rootの常時最新性 | 未完全 | rootの鮮度は運用に依存する | freshness SLA、監視、オンチェーン/外部アンカー |
| 地域境界データの完全性 | 未完全 | GISデータは更新、欠落、境界差異を持つ | source version管理、GIS検証、境界差分監査 |
| 配送可能性の実運用妥当性 | 未完全 | 配送会社、天候、災害、規制で変わる | carrier policy feed、履歴評価、再検証 |

## 9. 最終評価

第18章は、AMT本体論文の防御力を上げる章である。ZKPをAMTの中心に入れすぎると、論文が暗号プロトコル論文に見えてしまう。一方、ZKPを完全に外すと、AMTが住所由来の属性証明の前段理論になり得る強みが見えにくくなる。

したがって、第18章の最適な位置づけは次である。

> 第18章は、AMTと暗号拡張を接続するが、混同しないための境界章である。

採用すべき表現:

```text
AMTは住所意味論を提供する。
暗号拡張は、AMT由来の限定述語を秘匿証明する。
現在の実装は証明エンベロープと互換性モデルを検証している。
完全なZK回路の安全性は、住所写像論IIまたは別実装監査で扱う。
```

避けるべき表現:

```text
AMTだけで住所の秘匿証明が完成する。
ZKPだけで住所の真実性が保証される。
TypeScript実装だけで本格的なZK回路安全性が証明された。
公開述語がどれほど細かくてもゼロ知識なら安全である。
```

第18章をこの形に修正すれば、住所写像論本体と「住所写像論 II: 零知識住所述語」を自然に分離できる。
