# 第11章 プロトコル・プライバシー・ガバナンス・悪用境界

## 11.0 互換ノート

本章は、現行29章構成における第18章「AMTと暗号拡張の境界」、第20章「通信・登録・監査モデル」、第22章「セキュリティ・悪用・ガバナンス」、第27章「Address payment rails」、第28章「AMT envelope and ZK predicate boundary」を保存し、v2構成の第11章として再記述する。

第1章から第10章までは、住所参照をどのように定義し、候補化し、同値化し、安全に解決し、履歴と非標準参照へ広げるかを扱った。本章は、その参照を実際の通信、登録、配送、ZK証明、API、監査、委任、商用・OSS境界でどう使うかを定義する。

本章の基本主張は次である。

- AMTは住所解決理論であり、暗号プロトコルそのものではない。
- ZK proof、VC、DID、QR、署名、暗号化住所、監査ログは、AMTの上に乗る利用レイヤーである。
- 暗号は悪い住所解決を修復しない。
- 住所全文を渡さず、必要な事実だけを証明するには、AMT Envelope と Proof Boundary が必要である。
- 公開PID、配送DPID、アプリID、Credential ID、ZK nullifier、QR session ID を混同してはならない。
- 住所参照は便利なインフラになり得るが、監視・再識別・過剰収集・差別・不正配送の道具にもなり得る。
- ガバナンス、監査、非主張、失効、目的制限、最小開示は、理論の外側ではなく中核境界である。

本章の中心式は次である。

\[
\operatorname{Envelope}_{t,p}(r)
=
(
\operatorname{version},
\operatorname{referentCommitment},
\operatorname{pidCommitment},
\operatorname{sourceSetVersion},
\operatorname{qualityState},
\operatorname{resolutionState},
\operatorname{lineageRoot},
\operatorname{freshnessRoot},
\operatorname{revocationRoot},
\operatorname{allowedPredicates},
\operatorname{policy}
)
\]

この Envelope は raw 住所ではない。PIDそのものでもない。証明対象を安全に制限する境界オブジェクトである。

---

## 11.1 AMTと暗号拡張の境界

AMTは、候補生成、同値類、安全解決、履歴、品質、公開投影を扱う。暗号拡張は、その結果を秘匿しながら使う。

```text
surface expression
  ↓
AMT candidate generation
  ↓
AMT safe resolution
  ↓
AMT Envelope
  ↓
ZK / VC / DID / QR / encryption / signature
  ↓
application protocol
```

この境界を逆にしてはならない。

\[
\operatorname{ZKProof}(\phi)
\centernot\Rightarrow
\operatorname{GoodResolution}(r)
\]

ZK proof は、与えられた witness と public signals が relation を満たすことを示す。候補生成が不完全であったり、誤った referent が選ばれていたり、出典が古かったりしても、ZKはそれを自動修復しない。

この境界は、第4章で導入した可換図式の分類では、意図的な非可換図式である。AMT Envelope から public signal へ至る経路は、検証結果としては可換でよい。しかし、その public signal から hidden address、witness、秘密鍵、受取人、部屋番号、配送履歴の詳細へ戻る経路は存在してはならない。

\[
\nexists i :
\operatorname{PublicSignal}
\to
\operatorname{PrivateAddressMaterial}
\]

この非可換性は、ZKだけでなく、carrier-only decryption、匿名配送トークン、監査ログ、公開PID、公開履歴投影にも適用される。図式一覧は [AMT v2 Commutative Diagrams](commutative-diagrams.md) の `zk-boundary-noncommutative`、`vertical-privacy-noncommutative`、`anonymous-delivery-noncommutative`、`audit-projection-noncommutative` を参照する。

---

## 11.2 AMT Envelope

AMT Envelope は、AMTから証明・通信・登録レイヤーへ渡す最小構造である。

\[
\mathcal{E}_{AMT}
=
(
v,
c_r,
c_{pid},
s_v,
q,
\sigma,
\ell,
f,
\rho,
\Phi,
\Pi
)
\]

ここで、

- \(v\): Envelope版。
- \(c_r\): referent commitment。
- \(c_{pid}\): PID commitment。
- \(s_v\): source set version。
- \(q\): quality state。
- \(\sigma\): resolution state。
- \(\ell\): lineage root。
- \(f\): freshness root。
- \(\rho\): revocation root。
- \(\Phi\): allowed predicates。
- \(\Pi\): verifier policy。

Envelope の目的は、住所を渡すことではなく、証明可能な状態だけを渡すことである。

---

## 11.3 Envelope状態

Envelope の resolution state は、第7章の状態と接続する。

```text
verified
partial
ambiguous
unresolved
deprecated
disputed
blocked
```

証明許可は状態に依存する。

| state | proof use |
| --- | --- |
| verified | allowed |
| partial | limited |
| ambiguous | blocked or manual_review |
| unresolved | blocked |
| deprecated | successor required |
| disputed | policy dependent |
| blocked | blocked |

形式化すると次である。

\[
\operatorname{ProofAllowed}(\mathcal{E},\phi,\Pi)=1
\]

であるためには、

\[
\operatorname{StateOK}(\mathcal{E},\Pi)
\land
\phi\in\mathcal{E}.\Phi
\land
\operatorname{PolicyOK}(\phi,\Pi)
\]

が必要である。

---

## 11.4 ZK Predicate Boundary

ZK Address Predicates は、AMT Envelope の上でのみ動くべきである。

証明対象の例は次である。

```text
within(delivery_zone)
quality >= verified
freshness <= 30d
not_revoked == true
consent_scope == delivery
purpose == handoff
country == JP
postal_equivalent == true
```

これらは「住所全文」を証明するのではなく、住所に関する条件だけを証明する。

主関係を次で表す。

\[
\mathcal{R}_{ZK}
(w,\mathcal{E},\phi,\Pi)=1
\]

ここで、\(w\) は witness であり、raw住所、salt、credential secret、device secret などを含み得る。これらは公開してはならない。

ZK proof は次を公開してよい。

```text
predicate id
proof scope
policy id
root ids
expiry
verifier id
```

ZK proof は次を公開してはならない。

```text
raw address
unit number
recipient name
witness
salt
private key
full delivery history
unscoped stable nullifier
```

---

## 11.5 ZK非補修定理

**定理11.1 ZK非補修定理。**  
AMT解決が誤っている場合、ZK証明はその誤りを修復しない。

\[
\operatorname{BadResolution}(r)
\land
\operatorname{ZKProof}(\phi(r))=1
\centernot\Rightarrow
\operatorname{CorrectReferent}(r)
\]

**証明スケッチ。**  
ZK proof は relation が満たされることを秘匿的に示す。relation の入力となる referent や commitment がAMT側で誤っていれば、proof はその誤った対象に関する条件を証明するだけである。したがって、暗号証明は候補生成、同値性、安全解決、履歴保存を置き換えない。

---

## 11.6 Public Signal Safety

ZK proof の public signal は、意図せず住所情報を漏らすことがある。

危険な public signal の例は次である。

- 細かすぎる地理セル。
- 郵便番号が一軒だけを指す地域。
- 建物ID。
- 部屋番号に近い内部ID。
- 安定しすぎる nullifier。
- 小さすぎる配送区域。
- rare predicate の組み合わせ。

public signal safety を次で定義する。

\[
\operatorname{PublicSignalSafe}(\phi,\Pi,A)=1
\]

これは、証明が公開する信号から、許可されていない住所属性が推測されないことを要求する。

漏えい量を次で表す。

\[
\operatorname{Leak}(\phi,\Pi)
\le
\lambda_{\Pi}
\]

Leak が閾値を超える場合、proof-only であっても安全ではない。

---

## 11.7 Nullifier Scope

nullifier は二重利用防止や匿名レート制限に有用である。しかし、スコープを誤ると追跡子になる。

nullifier を次で定義する。

\[
n
=
H(secret, scope, purpose, verifier, epoch)
\]

安全な nullifier は、少なくとも次を満たす。

- purpose-scoped。
- verifier-scoped。
- epoch-scoped。
- revocable。
- raw住所から直接導出しない。
- 全サービス横断で安定しない。

次は危険である。

\[
n=H(\operatorname{rawAddress})
\]

これは、住所ハッシュをグローバル識別子にしてしまう。

---

## 11.8 住所通信モデル

住所通信は、raw住所文字列の送信ではなく、目的別メッセージの交換として扱う。

\[
m
=
(
\operatorname{actor},
\operatorname{purpose},
\operatorname{scope},
\operatorname{payloadType},
\operatorname{expiry},
\operatorname{signature},
\operatorname{auditRef}
)
\]

payloadType は次のいずれかである。

```text
proof
commitment
encrypted-address
carrier-token
delivery-session
audit-event
revocation-update
successor-pointer
```

raw住所は最後の手段であり、通常は暗号化住所または配送会社限定復号で扱う。

この通信モデルをより厳密にするため、第11章の補助文書として [AMT v2 Address Communication Semantics](address-communication-semantics.md) を置く。同文書では、住所通信を Address Communication Object として定義する。

\[
\operatorname{ACO}
=
(
\operatorname{envelope},
\operatorname{claimSet},
\operatorname{purpose},
\operatorname{audience},
\operatorname{payloadType},
\operatorname{disclosureLevel},
\operatorname{proofBundle},
\operatorname{nonce},
\operatorname{expiry},
\operatorname{revocationRef},
\operatorname{auditRef},
\operatorname{replyPolicy}
)
\]

ACOの妥当性は、次の述語で判定する。

\[
\operatorname{ValidComm}(m,s,r,c,t)=1
\]

これは、送信者 \(s\)、受信者 \(r\)、受信者能力または通信チャネル \(c\)、時刻 \(t\) において、メッセージ \(m\) が目的、相手、開示上限、失効、nonce、有効期限、証明、署名、監査、漏えい境界をすべて満たすことを意味する。

さらに、住所通信は単なるネットワークACKではなく、意味ACKを返す。

```text
received
parsed
referent_accepted
deliverable
proof_verified
rejected
expired
revoked
manual_review_required
disclosure_denied
policy_mismatch
```

このACKは、住所全文を受け取ったことや居住証明を意味しない。例えば `deliverable` は「目的とポリシーの範囲で配送可能性を受理した」ことを表すだけであり、本人確認や住所全文開示を含意しない。

---

## 11.9 住所登録トランザクション

住所登録は、単なるフォーム送信ではなくトランザクションである。

\[
\operatorname{RegisterTx}
=
(
subject,
purpose,
evidence,
candidateSet,
resolutionCertificate,
decisionCertificate,
envelope,
auditEvent
)
\]

登録トランザクションは、次の性質を持つべきである。

- 冪等性。
- 再現性。
- 監査可能性。
- 失効可能性。
- 最小開示。
- 目的制限。
- 後継追跡。

これは、第27章の「住所決済レール」の発想にも接続する。住所処理は、電子決済のように、要求、承認、証明、実行、監査、失効を持つべきである。

---

## 11.10 Address Payment Rails

住所決済レールとは、住所を「支払い」のように安全な手続きで扱うモデルである。

```text
request
authorize
prove
route
deliver
audit
revoke
settle
```

このモデルで重要なのは、住所そのものを商品やトークンにすることではない。住所利用を、目的、権限、証明、監査、失効を持つ安全なレールに乗せることである。

住所レールの状態遷移を次で表す。

\[
\operatorname{RailState}
\in
\{
\operatorname{requested},
\operatorname{authorized},
\operatorname{proved},
\operatorname{routed},
\operatorname{delivered},
\operatorname{audited},
\operatorname{revoked},
\operatorname{failed}
\}
\]

各遷移は署名、nonce、時刻、有効期限、監査イベントを持つ。

---

## 11.11 監査モデル

監査イベントを次で定義する。

\[
a
=
(
\operatorname{eventId},
\operatorname{actor},
\operatorname{action},
\operatorname{purpose},
\operatorname{scope},
\operatorname{timestamp},
\operatorname{result},
\operatorname{disclosureLevel},
\operatorname{hashRef}
)
\]

監査ログに保存してよいもの。

- actor id。
- action。
- purpose。
- scope。
- result。
- proof type。
- disclosure level。
- commitment hash。
- root id。

保存してはならないもの。

- raw住所。
- 部屋番号。
- recipient secret。
- witness。
- private key。
- 生体情報。
- 詳細な配送履歴。

監査は、住所全文を保存する理由ではない。監査は、住所全文を保存せずに、誰が何を要求し、何が許可され、どの証明が使われたかを記録する仕組みである。

---

## 11.12 ガバナンス役割

AMTの利用には複数の役割がある。

```text
subject
issuer
resolver
verifier
carrier
merchant
auditor
registry
governance body
emergency authority
community reviewer
```

各役割の権限は異なる。

| role | may do | must not do |
| --- | --- | --- |
| subject | consent, revoke, delegate | forge evidence |
| issuer | issue credential | store unnecessary raw address |
| resolver | produce envelope | issue PID without gates |
| verifier | verify proof | demand raw address by default |
| carrier | decrypt for delivery | reuse address outside scope |
| merchant | request deliverability | collect raw address unnecessarily |
| auditor | inspect logs | expose secrets |
| registry | publish roots | publish raw witness |
| governance body | update policy | decide political ownership |

---

## 11.13 Policy Matrix

ポリシーを次で定義する。

\[
\Pi
=
(
\operatorname{role},
\operatorname{purpose},
\operatorname{jurisdiction},
\operatorname{riskLevel},
\operatorname{allowedPredicates},
\operatorname{disclosureLimit},
\operatorname{retentionLimit},
\operatorname{auditRequirement}
)
\]

許可判定は次である。

\[
\operatorname{PolicyOK}(\Pi,\phi,m)=1
\]

であるためには、少なくとも次が必要である。

\[
\phi\in\Pi.\operatorname{allowedPredicates}
\]

\[
\operatorname{Disclosure}(m)\le \Pi.\operatorname{disclosureLimit}
\]

\[
\operatorname{Retention}(m)\le \Pi.\operatorname{retentionLimit}
\]

\[
\operatorname{AuditReady}(m,\Pi)=1
\]

---

## 11.14 悪用モデル

住所参照の悪用例は次である。

- EC事業者による住所全文収集。
- 配送会社による目的外利用。
- proof public signal からの再識別。
- stable nullifier による横断追跡。
- raw住所ハッシュの名寄せ。
- 係争地域の政治的主張への利用。
- 高精度住所のストーキング利用。
- 災害避難所情報の過剰公開。
- ロッカーやホテル受取の不正代理。
- 発行者の偽Credential。
- 住所履歴から生活パターンを推測。
- AIによる住所推測・補完の過信。

AMTは、これらを単なる実装リスクではなく、理論上の境界として扱う。

---

## 11.15 Threat/Control Matrix

| threat | control |
| --- | --- |
| raw address over-collection | least disclosure, encrypted-address, proof-only |
| replay | nonce, expiry, session binding |
| QR copy | device signature, one-time token |
| stable tracking | scoped nullifier |
| bad resolution hidden by ZK | AMT state guard, non-repair theorem |
| public signal leakage | signal minimization, leak threshold |
| stale credential | freshness root, expiry |
| revoked credential | revocation root |
| merchant address harvesting | carrier-only decrypt |
| carrier overuse | purpose token, audit |
| emergency over-disclosure | timebox, multi-party approval |
| disputed territory misuse | neutral ID policy, non-sovereignty claim |

---

## 11.16 係争・中立ポリシー

AMTは、領有権や政治的主張を決定しない。

\[
\operatorname{AGID}(r)
\centernot\Rightarrow
\operatorname{SovereigntyClaim}(r)
\]

係争地域、占領地域、自治領、特別行政区、海外領土、海域、南極、EEZでは、住所参照を中立的な技術IDとして扱う。

必要な記述は次である。

```text
This identifier is for address, routing, and referent interoperability.
It does not assert sovereignty, legal ownership, or political status.
```

---

## 11.17 緊急時開示

緊急時には、通常より強い開示が必要になることがある。しかし、緊急時は無制限開示の理由ではない。

緊急時開示を次で定義する。

\[
\operatorname{EmergencyDisclosure}
=
(
\operatorname{reason},
\operatorname{authority},
\operatorname{scope},
\operatorname{timebox},
\operatorname{approval},
\operatorname{audit}
)
\]

必要条件は次である。

\[
\operatorname{timebox}\neq\emptyset
\land
\operatorname{scope}\neq\operatorname{unbounded}
\land
\operatorname{audit}=1
\]

---

## 11.18 委任

住所利用では、本人だけでなく代理人が必要になる。

\[
\operatorname{Delegate}(u,v,r,scope,expiry)
\]

これは、利用者 \(u\) が代理人 \(v\) に、参照 \(r\) に関する権限を、範囲 \(scope\) と期限 \(expiry\) で渡すことを表す。

委任は次を満たすべきである。

- 目的限定。
- 期限付き。
- 失効可能。
- 監査可能。
- 再委任制限。
- raw住所非開示可能。

---

## 11.19 プロトコル状態機械

住所利用プロトコルを次の状態機械として定義する。

```text
created
requested
authorized
proved
fulfilled
audited
revoked
expired
failed
```

許可される遷移は次である。

```text
created -> requested
requested -> authorized
authorized -> proved
proved -> fulfilled
fulfilled -> audited
requested -> failed
authorized -> revoked
proved -> expired
```

各遷移には、actor、purpose、nonce、timestamp、signature、audit event が必要である。

---

## 11.20 反例

### 反例11.1 ZK proofは住所解決を修復しない

\[
\operatorname{ZKProof}(\phi(r))=1
\centernot\Rightarrow
\operatorname{CorrectReferent}(r)
\]

### 反例11.2 raw住所ハッシュは安全な匿名IDではない

\[
n=H(\operatorname{rawAddress})
\]

は、辞書攻撃や横断名寄せの対象になり得る。

### 反例11.3 Merchantの配送可能性要求は住所全文要求を含意しない

\[
\operatorname{NeedDeliverability}(m)=1
\centernot\Rightarrow
\operatorname{NeedRawAddress}(m)=1
\]

### 反例11.4 監査ログはraw住所保存を正当化しない

\[
\operatorname{AuditRequired}=1
\centernot\Rightarrow
\operatorname{StoreRawAddress}=1
\]

### 反例11.5 AGIDは政治的主張ではない

\[
\operatorname{AGID}(r)
\centernot\Rightarrow
\operatorname{SovereigntyClaim}(r)
\]

### 反例11.6 Stable nullifier は匿名性を壊す

\[
n=H(secret)
\]

が全verifierで同じなら、匿名証明は横断追跡可能になる。

---

## 11.21 命題と定理

**命題11.1 Envelope非住所性。**  
AMT Envelope は raw 住所ではない。

\[
\operatorname{Envelope}_{AMT}
\centernot\Rightarrow
\operatorname{RawAddress}
\]

**命題11.2 Proof許可はEnvelope状態に依存する。**

\[
\operatorname{ProofAllowed}(\mathcal{E},\phi,\Pi)=1
\Rightarrow
\operatorname{StateOK}(\mathcal{E},\Pi)=1
\]

**命題11.3 監査非開示原則。**

\[
\operatorname{AuditReady}=1
\centernot\Rightarrow
\operatorname{RawAddressStored}=1
\]

**定理11.1 ZK非補修定理。**  
ZK proof は、誤ったAMT解決を正しい解決へ変換しない。

\[
\operatorname{BadResolution}(r)
\land
\operatorname{ZKProof}(\phi(r))=1
\centernot\Rightarrow
\operatorname{CorrectReferent}(r)
\]

**定理11.2 最小開示安全条件。**  
ある要求 \(Q\) に対し、より少ない開示 \(D_i\) で検証可能なら、より大きい開示 \(D_j\) を要求してはならない。

\[
D_i\le D_j
\land
\operatorname{Verify}(Q,D_i)=1
\Rightarrow
\operatorname{Prefer}(D_i,D_j)=1
\]

**定理11.3 スコープ付きnullifier安全条件。**  
nullifier が purpose、verifier、epoch に束縛されない場合、横断追跡リスクが残る。

\[
n\neq H(secret,scope,purpose,verifier,epoch)
\Rightarrow
\operatorname{LinkabilityRisk}>0
\]

**定理11.4 中立識別子定理。**  
AGIDまたはPIDが発行されても、政治的主張、所有権、主権、法的管轄を自動的には含意しない。

\[
\operatorname{PIDIssue}(r)=1
\centernot\Rightarrow
\operatorname{LegalOrPoliticalClaim}(r)=1
\]

---

## 11.22 実装アルゴリズム

AMT Envelope から proof request を評価する手順は次である。

```text
1. Envelopeを受け取る
2. Envelope version を確認する
3. resolutionState を確認する
4. requested predicate が allowedPredicates に含まれるか確認する
5. verifier policy を確認する
6. public signal leak を評価する
7. freshnessRoot と revocationRoot を確認する
8. nullifier scope を確認する
9. audit requirement を確認する
10. proof allowed / limited / blocked を返す
```

擬似コードは次である。

```text
evaluateProofRequest(envelope, predicate, policy):
  if envelope.resolutionState in [unresolved, blocked]:
    return blocked(state-not-proof-ready)

  if predicate not in envelope.allowedPredicates:
    return blocked(predicate-not-allowed)

  if not policyAllows(policy, predicate):
    return blocked(policy-denied)

  if leak(predicate, policy) > policy.maxLeak:
    return blocked(public-signal-leak)

  if envelope.revocationRoot is missing:
    return blocked(revocation-root-required)

  if nullifier is unscoped:
    return blocked(nullifier-linkability-risk)

  return allowed
```

---

## 11.23 実装フック

本章に対応する実装・検証フックは次である。

- AMT envelope schema
- envelope state guard
- proof predicate allowlist
- verifier policy matrix
- public signal leak fixture
- scoped nullifier fixture
- revocation root fixture
- freshness root fixture
- audit event schema
- protocol state machine
- delegation fixture
- emergency disclosure fixture
- neutral identifier non-claim fixture
- ZK non-repair counterexample
- merchant raw-address over-collection counterexample

最低限のfixtureは次である。

| fixture | expected result | purpose |
| --- | --- | --- |
| verified-envelope-delivery-proof | allowed | proof boundary |
| unresolved-envelope-proof | blocked | AMT state guard |
| predicate-not-allowed | blocked | allowlist |
| public-signal-leak | blocked | privacy |
| unscoped-nullifier | blocked | unlinkability |
| revoked-root-missing | blocked | revocation |
| merchant-deliverability-only | raw address denied | least disclosure |
| audit-without-raw-address | allowed | audit |
| emergency-timeboxed | limited | emergency |
| disputed-neutral-id | allowed with non-sovereignty claim | governance |

---

## 11.24 後半補強: 責任境界とプロトコル失敗モード

本章の弱点は、ZK、Credential、DID、QR、監査、委任を並べるだけだと、暗号機能の寄せ集めに見える点である。AMTのプロトコル章で重要なのは、各主体が何を知り、何を知らず、何を証明でき、どこで拒否されるかを、状態機械として固定することである。

主体集合を次で置く。

\[
\mathcal{R}=\{
U,D,I,V,M,C,A,G
\}
\]

ここで、\(U\) は利用者、\(D\) は端末、\(I\) は発行者、\(V\) は検証者、\(M\) は加盟店、\(C\) は配送会社、\(A\) は監査者、\(G\) はレジストリである。

各主体が見てよい情報を開示関数で表す。

\[
\operatorname{View}(r,s,p,t)
\]

ここで、\(r\) は主体、\(s\) はプロトコル状態、\(p\) は目的、\(t\) は時刻である。

最小開示条件は次である。

\[
\operatorname{View}(r,s,p,t)
\subseteq
\operatorname{Need}(r,p,t)
\]

特に加盟店について、

\[
\operatorname{rawAddress}\notin \operatorname{View}(M,s,\mathrm{delivery},t)
\]

配送会社については、

\[
\operatorname{rawAddress}\in \operatorname{View}(C,s,\mathrm{executeDelivery},t)
\]

であっても、次の制約を受ける。

\[
\operatorname{carrierDecrypt}
\Rightarrow
\operatorname{sessionActive}
\land
\operatorname{userApproved}
\land
\operatorname{auditLogged}
\land
t\le t_{\mathrm{expiry}}
\]

プロトコル状態機械は次である。

```text
created
  -> user_approved
  -> proof_generated
  -> proof_verified
  -> carrier_authorized
  -> delivery_executed
  -> closed

any state
  -> revoked
  -> blocked
```

失敗モードを状態遷移として固定する。

| failure | required state |
| --- | --- |
| unresolved AMT envelope | blocked |
| stale freshness root | blocked or reissue_required |
| missing revocation root | blocked |
| unscoped nullifier | blocked |
| public signal leak | blocked |
| merchant raw-address request | denied |
| carrier decrypt without session | blocked |
| emergency disclosure without multi-party rule | blocked |
| delegation expired | blocked |
| audit log stores raw address | blocked |

本章で追加すべき責任境界は次である。

| actor | can do | cannot claim |
| --- | --- | --- |
| Issuer | issue credential over evidence | global truth of all addresses |
| Resolver | resolve AMT referent under policy | legal ownership |
| Merchant | request deliverability proof | raw address collection by default |
| Carrier | decrypt for execution window | purpose-free reuse |
| Auditor | inspect event metadata | store raw address unnecessarily |
| Registry | publish roots/status | reveal witness or private unit |

この補強により、第11章は暗号技術紹介ではなく、住所を通信可能にするための責任分離プロトコルになる。

---

## 11.25 非主張

本章は、AMTが完全なZKシステムであるとは主張しない。

本章は、ZK proof が住所解決の誤りを修復すると主張しない。

本章は、Envelope が raw 住所であるとは主張しない。

本章は、監査のために raw 住所を保存すべきだとは主張しない。

本章は、AGID、PID、Envelope、Credential、DID、VC、nullifier、QR session ID が同じ識別子であるとは主張しない。

本章は、住所参照が政治的主権、所有権、法的管轄を決定すると主張しない。

本章は、緊急時に無制限開示が許されるとは主張しない。

---

## 11.26 まとめ

本章では、AMT Envelope、ZK predicate boundary、public signal safety、nullifier scope、住所通信、登録トランザクション、住所決済レール、監査、ガバナンス、悪用モデル、緊急時開示、委任、プロトコル状態機械を定義した。

第7章が安全解決、第8章が履歴、第9章が不確実性、第10章が非標準参照を扱うなら、本章は、それらを社会・プロトコル・暗号・監査の中で安全に使う境界を扱う。

本章の最重要分離は次である。

```text
AMT resolution
  != cryptographic proof
  != raw address disclosure
  != political claim
  != commercial tracking identifier
```

そして、本章の中核は次である。

```text
Address should not be shared by default.
Only the necessary predicate, to the necessary actor,
for the necessary purpose, for the necessary time,
with audit and revocation.
```

住所写像論は、住所を使いやすくするだけでは不十分である。住所を必要以上に使わせない境界を持って初めて、信頼できる住所インフラになる。
