# 住所写像論 II：零知識住所述語

## 居住・配送可能性・AOID所有・PID監査を秘匿証明するための補助理論

Version: Japanese manuscript v1
Date: 2026-06-07
Status: research manuscript, implementation-aligned formal draft

## 要旨

住所は、単なる文字列でも、単なる座標でもない。住所写像論 I は、住所表記、候補生成、クラスタ、未解決判定、履歴更新、永続識別子発行を通じて、曖昧で変動する住所を物理的・社会的実体へ写像する意味論を与える。本稿は、その上に置かれる秘匿証明層を扱う。中心的な問いは、住所そのものを公開せずに、住所から導かれる事実だけを証明できるか、である。

本稿では、住所写像論の出力を零知識証明の witness と public statement に分離し、`日本在住`、`東京都内`、`配送可能地域内`、`同一住所に属する`、`AOIDを所有する`、`PID発行過程が規定手順を通過した`、`品質しきい値を満たす` といった住所述語を定義する。重要なのは、住所写像論は住所意味論であり、零知識証明はその意味論から導かれた述語を秘匿して検証する暗号プロトコルだという分離である。零知識証明は住所の真実性を単独では保証しない。一方、住所写像論は暗号的秘匿性を単独では保証しない。この境界を明確にすることが、本稿の第一の目的である。

本稿は、数理モデル、公理、定義、補題、定理、反例、検証計画、実装対応を整理し、AGID/AOID アプリケーションに導入するための理論的な骨格を与える。実装面では、TypeScript による意味論的エンベロープ、証明バンドルレジストリ、issuer trust registry、revocation/freshness root anchoring、nullifier、匿名レート制限、品質しきい値証明を中間層として扱い、将来的には Rust/WASM または専用 ZK backend による回路化を想定する。

Keywords: Address Morphism Theory, zero-knowledge proof, private address predicate, AOID, AGID, PID audit, delivery eligibility, address credential, nullifier, revocation, freshness

## 構成整理

本稿は、住所写像論 I の本体とは独立した派生論文として置くのが望ましい。住所写像論 I は、住所の意味論、候補生成、クラスタ、履歴、識別子発行、品質評価を扱う。住所写像論 II は、I の出力を秘密入力として、住所由来の属性だけを公開検証する方法を扱う。

採用する章立ては次の通りである。

1. 序論
2. 住所写像論 I との境界
3. 非主張と信頼境界
4. 記号と対象空間
5. AMT エンベロープと witness
6. 公開述語と証明関係
7. 公理と仮定
8. ZK Address Proof
9. ZK Residence Proof
10. ZK Delivery Eligibility
11. AOID Ownership Proof
12. Duplicate Prevention and Nullifiers
13. PID Issuance Audit Proof
14. Freshness and Revocation
15. Consent and Purpose Scope
16. Anonymous Rate Limiting
17. PID Lifecycle, Merge, and Split Proofs
18. Quality Threshold Proofs
19. Proof Bundle Compatibility
20. Security and Failure Modes
21. Verification Plan and Implementation Boundary
22. Use Cases
23. Limitations
24. Conclusion
25. Appendix A: Mathematical Inventory
26. Appendix B: Theorem and Lemma Catalogue
27. Appendix C: Implementation Mapping
28. Appendix D: Verification Status

この構成では、前半で意味論と暗号の境界を固定し、中盤で証明ファミリを定義し、後半で互換性、安全性、検証方法、実装対応を扱う。これにより、住所写像論 I の数学的議論と、AGID/AOID の実装仕様と、ZK 回路化の将来計画が混ざりすぎない。

## 1. 序論

住所は、個人情報であると同時に、物流、行政、本人確認、不動産、災害支援、地理検索、買い物 Agent にとって不可欠な参照情報である。しかし多くの用途では、住所そのものを開示する必要はない。たとえば、配送業者にとって必要なのは、購入者の完全な住所を全員に公開することではなく、配送可能地域内であり、正当な受取人であり、配送のための経路解決ができることだけである。サービス事業者にとって必要なのは、利用者が日本在住であることや特定都市の居住者であることだけであり、番地や建物名や電話番号ではない場合がある。

この観点から、住所は「公開される文字列」ではなく「証明可能な属性集合」として再解釈できる。住所写像論 I が住所を実体へ写像する理論だとすれば、本稿は、その写像結果から導かれる属性を、秘匿したまま証明する理論である。

本稿の中心命題は条件付きである。

**中心命題.** 信頼された issuer により発行された住所 credential または AMT エンベロープが存在し、それが fresh で、revoked ではなく、目的スコープと challenge に束縛され、対象述語が回路表現可能であるならば、利用者は住所そのものを公開せずに、住所由来の述語が真であることを検証者へ証明できる。

この命題は、住所の真実性を無条件に保証するものではない。credential が誤っていれば、ZK 証明は誤った前提を秘匿したまま正しく証明してしまう。したがって本稿では、住所意味論、credential 発行、失効管理、鮮度管理、ZK 証明、監査ログを分離したモデルを採用する。

## 2. 住所写像論 I との境界

住所写像論 I は、時刻 \(t\) における住所表記集合を \(S_t\)、参照対象集合を \(X_t\)、同値類集合を

\[
Q_t = X_t / \sim_t
\]

として扱う。ここで \(x \sim_t x'\) は、時刻 \(t\) において、実用上同一の住所参照対象として扱える関係である。住所表記 \(s \in S_t\) は、正規化、候補生成、距離評価、クラスタリング、履歴更新を通じて、同値類 \(q \in Q_t\) または未解決状態へ写像される。

住所写像論 II は、この結果を次の形で受け取る。

\[
Env_t = (\pi_t, C_t, K_t, U_t, A_t, L_t, Q_t, H_t)
\]

ここで、\(\pi_t\) は解析結果、\(C_t\) は候補集合、\(K_t\) はクラスタ、\(U_t\) は unresolved 判定、\(A_t\) は属性、\(L_t\) は履歴、\(Q_t\) は品質評価、\(H_t\) は監査コミットメントである。

住所写像論 I は次の問いに答える。

- 入力された住所は、どの候補を持つか。
- 候補はどのクラスタに属するか。
- 解決してよいか、それとも unresolved とすべきか。
- PID または AOID はどの履歴を通じて発行されたか。
- 住所表記、座標、地物、行政区画、社会的属性はどう対応するか。

住所写像論 II は次の問いに答える。

- 住所を公開せずに、ある地域内であることだけを証明できるか。
- AOID 本文を公開せずに、AOID 所有を証明できるか。
- 同一住所の二重登録ではないことを nullifier で証明できるか。
- PID 発行過程が規定の候補生成、クラスタ、unresolved、履歴更新を通過したことを証明できるか。
- 複数の ZK 証明が相互に矛盾しないように bundle 化できるか。

この分離により、住所写像論 I の検証可能性と、住所写像論 II の暗号的安全性を別々に評価できる。

## 3. 非主張と信頼境界

本稿は、次のことを主張しない。

1. 零知識証明だけで、住所の現実世界での真実性を保証できる。
2. AMT エンベロープだけで、住所の秘匿性を保証できる。
3. すべての国、地域、用途、データ品質において、同一の住所述語が同一精度で検証できる。
4. ZK 証明を導入すれば、issuer、credential、revocation、freshness、監査ログ、配送履歴の信頼問題が消える。
5. 住所の一意化可能性が高い場面でも、述語粒度を細かくしてよい。

信頼境界は四つに分かれる。

第一に、意味論的境界である。住所表記から参照対象への写像は、住所写像論 I の責務である。

第二に、発行者境界である。住所 credential を発行する行政、郵便局、配送会社、本人確認事業者、AGID issuer の信頼性は、issuer trust registry により管理する。

第三に、暗号境界である。証明の完全性、健全性、零知識性は、ZK backend と回路監査に依存する。

第四に、運用境界である。revocation root、freshness root、challenge、scope、rate limit、bundle compatibility は、アプリケーション運用の責務である。

この境界を曖昧にすると、ZK 証明が「住所が正しいことの魔法の保証」のように誤解される。本稿は、その誤解を避けるため、すべての定理を条件付きで述べる。

## 4. 記号と対象空間

時刻 \(t\) において、次の対象を定義する。

\[
S_t : \text{address-expression space}
\]

\[
X_t : \text{physical or social reference-object space}
\]

\[
Q_t = X_t / \sim_t : \text{address-equivalence-class space}
\]

\[
\mathcal{A}_t : \text{attribute space}
\]

\[
\mathcal{C}_t : \text{credential space}
\]

\[
\mathcal{P}_t : \text{predicate family}
\]

住所表記 \(s \in S_t\) は、解析写像

\[
\nu_t : S_t \to N_t
\]

により正規化表現 \(n \in N_t\) へ写像される。候補生成写像は

\[
\kappa_t : N_t \to \mathcal{P}_{fin}(X_t)
\]

である。候補間の非類似度を

\[
D_t : X_t \times X_t \to \mathbb{R}_{\geq 0}^m
\]

とする。ここで成分は、地理距離、行政階層差、言語表記差、地物種別差、履歴差、配送履歴差などを含みうる。

クラスタリング写像を

\[
\Pi_{\delta,t} : \mathcal{P}_{fin}(X_t) \to \mathcal{P}_{fin}(Q_t)
\]

とする。しきい値 \(\delta\) のもとで、候補集合は同値類集合へ写像される。評価関数を

\[
E_t : Q_t \times H_t \times Context_t \to [0,1]
\]

とし、品質スコアを

\[
\rho_t : Q_t \to [0,1]
\]

とする。

属性写像を

\[
\alpha_t : Q_t \to \mathcal{A}_t
\]

とする。たとえば、\(\alpha_t(q)\) は、国、都道府県、市区町村、配送可能性、地物種別、AOID 所有関係、PID 履歴、品質スコア、災害時仮想住所属性を含む。

住所述語は、属性空間上の関数として定義される。

\[
P_j : \mathcal{A}_t \to \{0,1\}
\]

たとえば、

\[
P_{Japan}(\alpha_t(q)) = 1
\]

は、参照対象 \(q\) が日本国内の住所属性を持つことを表す。

## 5. AMT エンベロープと witness

ZK 証明では、証明者が秘密入力 witness を持ち、検証者は public statement だけを受け取る。住所写像論 II では、witness を次のように定義する。

\[
w =
(s, q, Env_t, cred, sk, r, nonce)
\]

ここで、\(s\) は住所表記、\(q\) は住所同値類、\(Env_t\) は AMT エンベロープ、\(cred\) は住所 credential、\(sk\) は AOID または credential 所有秘密、\(r\) はコミットメント乱数、\(nonce\) は challenge や nullifier 生成に用いる値である。

公開文を次のように定義する。

\[
y =
(pid, predicateId, scope, challenge, issuerRoot, revocationRoot, freshnessRoot, policyId, bundleId)
\]

検証者は \(s\)、\(q\)、完全な住所、AOID 本文、個人名、電話番号を受け取らない。検証者が受け取るのは、述語の種類、用途スコープ、challenge、issuer trust root、revocation root、freshness root、bundle id である。

コミットメントを

\[
Com_q = Commit(q; r)
\]

とする。nullifier は、同一スコープ内で二重登録を防ぎつつ、住所や AOID 本文を隠すために用いる。

\[
N = H(domain \parallel scope \parallel secret)
\]

ここで \(domain\) は証明ファミリを分離する文字列、\(scope\) は用途または地域スコープ、\(secret\) は住所、AOID、credential に由来する秘密値である。domain separation を行わない nullifier は、異なる用途間でリンク可能性を高めるため危険である。

## 6. 公開述語と証明関係

住所述語 \(P_j\) に対して、証明関係を次のように定義する。

\[
R_j(w, y) = 1
\]

であるとは、少なくとも次が成り立つことを意味する。

\[
ValidAMTEnvelope(Env_t)
\]

\[
ValidCredential(cred, issuerRoot)
\]

\[
Fresh(cred, freshnessRoot)
\]

\[
\neg Revoked(cred, revocationRoot)
\]

\[
P_j(\alpha_t(q)) = 1
\]

\[
ScopeCompatible(scope, policyId)
\]

\[
ChallengeBound(challenge)
\]

\[
OwnerBound(sk, cred \text{ or } AOID)
\]

このとき、ZK 証明システム \(\Pi_j\) は次を生成する。

\[
proof_j = Prove_{\Pi_j}(w, y)
\]

検証者は

\[
Verify_{\Pi_j}(y, proof_j) = 1
\]

だけを確認する。健全性により、虚偽の witness からは受理される証明を作りにくい。零知識性により、検証者は witness の内容を学ばない。ただし、公開述語そのものから漏れる情報は残る。たとえば `東京都千代田区内` という述語は、`日本国内` よりも強い情報を漏らす。

## 7. 公理と仮定

本稿では、次の公理と仮定を置く。

**公理 A1: 意味論的根拠公理.** ZK 証明の対象となる住所述語は、AMT エンベロープまたは信頼された credential から導かれなければならない。

**公理 A2: 発行者信頼公理.** credential の有効性は、issuer trust registry に登録された issuer key または issuer root に対して検証される。

**公理 A3: 失効鮮度公理.** 住所 credential は、revocation root に含まれず、freshness root により許容期間内であることを示さなければならない。

**公理 A4: 用途スコープ公理.** 証明は、特定の目的、検証者、challenge、期限に束縛されなければならない。

**公理 A5: domain separation 公理.** nullifier、commitment、bundle id、challenge は、証明ファミリごとに domain separation されなければならない。

**公理 A6: 粒度制御公理.** 公開述語の粒度は、匿名集合が十分小さくならない範囲に制限されなければならない。

**公理 A7: 非代替公理.** ZK 証明は AMT 検証、issuer 審査、配送履歴監査、GIS 検証の代替ではない。

これらの公理は、暗号的な証明の安全性だけではなく、住所という現実世界参照を扱うための運用的安全性を含む。

## 8. ZK Address Proof

ZK Address Proof は、住所そのものを公開せず、住所が特定の地理・行政・社会的属性を満たすことだけを証明する。

典型的な述語は次である。

\[
P_{country=c}(\alpha_t(q)) = 1
\]

\[
P_{city=u}(\alpha_t(q)) = 1
\]

\[
P_{region \in R}(\alpha_t(q)) = 1
\]

たとえば、利用者は、住所を公開せずに `日本在住`、`北海道在住`、`EU 内`、`東京都内` であることを証明できる。この証明は、年齢確認、地域限定サービス、災害支援資格、地域クーポン、配送可能性判定に応用できる。

ただし、地域が小さすぎる場合、住所が一意化される危険がある。そのため、ZK Address Proof は必ず匿名集合評価と組み合わせるべきである。

\[
AnonSet(P_j, t) \geq k_{min}
\]

匿名集合がしきい値を下回る場合、述語は粗い粒度へ丸める。たとえば `特定町丁目` を `市区町村` や `都道府県` に戻す。

## 9. ZK Residence Proof

ZK Residence Proof は、住所 credential を持つこと、および居住資格に関する述語が成り立つことを証明する。ここで重要なのは、住所の存在と居住の継続性である。

witness は次を含む。

\[
w_{res} = (cred_{res}, q, holderSecret, issuerSig, freshnessWitness, revocationWitness)
\]

公開文は次を含む。

\[
y_{res} = (residencePredicate, issuerRoot, revocationRoot, freshnessRoot, scope, challenge)
\]

Residence Proof は、単なる地理的 inside predicate よりも強い。`住所が日本にある` だけでなく、`信頼された発行者により、利用者がその住所に居住していることが証明されている` ことを含む。

反例として、空き家の住所を知っているだけでは Residence Proof は成立しない。住所文字列、座標、地図上の建物情報だけでは、居住者であることは示せない。

## 10. ZK Delivery Eligibility

ZK Delivery Eligibility は、住所を公開せずに、配送可能地域内であること、正当な受取人であること、配送に必要な最小情報が信頼された配送解決層へ渡せることを証明する。

基本述語は次である。

\[
P_{deliverable}^{carrier, t}(\alpha_t(q)) = 1
\]

ここで \(carrier\) は配送事業者または配送ポリシーであり、時刻 \(t\) における配送可能範囲、禁輸地域、災害地域、私書箱可否、宅配ロッカー可否、建物アクセス制約を含む。

買い物 Agent に対応する場合、証明は二段階に分けるのが望ましい。

第一段階では、EC サービスに対して `配送可能` と `正当な受取人` だけを証明する。第二段階では、配送事業者に対して、暗号化された配送解決トークンまたは AGID/AOID 参照を渡す。EC サービスは完全住所を保持しない。

配送可能性証明は、住所秘匿性の観点から有用だが、最終配送には現実世界の経路解決が必要である。したがって、ZK Delivery Eligibility は配送の完全実行証明ではなく、配送資格証明である。

## 11. AOID Ownership Proof

AOID Ownership Proof は、AOID 本文や登録住所を公開せずに、利用者が AOID に対応する秘密鍵、委譲権限、または登録済み住所 credential を持つことを証明する。

AOID は AGID を内包する応用識別子として扱える。AOID の公開値を完全に出す必要がある用途もあるが、所有証明では次のような commitment によって秘匿できる。

\[
Com_{AOID} = Commit(AOID; r)
\]

所有述語は次である。

\[
P_{own}(AOID, sk) = 1
\]

これは、AOID に紐づく公開鍵に対して、秘密鍵 \(sk\) の所有を示す。更新、権限委譲、QR 再発行、共有、相続、配送先再認証では、AOID 本文や住所を出さずに ownership を確認できる。

ただし、AOID が非常に小さい匿名集合に属する場合、所有証明だけでもリンク可能性が生じる。そのため、AOID Ownership Proof は用途スコープ、challenge、期限、bundle compatibility と組み合わせる。

## 12. Duplicate Prevention and Nullifiers

重複登録防止では、同じ住所、同じ AOID、同じ地域スコープで二重登録していないことを、本人や住所を明かさずに証明する。

nullifier を次のように定義する。

\[
N_{dup} = H(\texttt{dup} \parallel regionScope \parallel addressSecret)
\]

または AOID に基づく場合、

\[
N_{aoid} = H(\texttt{aoid-dup} \parallel regionScope \parallel aoidSecret)
\]

同一スコープで同じ nullifier が再提出された場合、二重登録として拒否される。一方、異なるスコープでは domain separation によりリンクされない。

重要な補題は次である。

**補題 12.1: スコープ分離補題.** hash 関数が衝突困難であり、domain と scope が nullifier に含まれるならば、異なるスコープの nullifier は、同一住所由来であっても直接リンクされない。

この補題は暗号仮定に依存する。実装では、scope を曖昧な文字列にせず、正規化された policy id と issuer domain を含めるべきである。

## 13. PID Issuance Audit Proof

PID Issuance Audit Proof は、PID が規定の手順を通過して発行されたことを証明する。公開されるのは、PID 発行過程が妥当であるという監査事実であり、入力住所や候補集合の詳細ではない。

監査対象のパイプラインは次である。

\[
s \xrightarrow{\nu_t} n \xrightarrow{\kappa_t} C
\xrightarrow{\Pi_{\delta,t}} K
\xrightarrow{U_t} resolved/unresolved
\xrightarrow{L_t} history
\xrightarrow{\mu_t} PID
\]

証明関係は次を含む。

\[
PipelineConsistent(s, n, C, K, U_t, L_t, PID)
\]

\[
UnresolvedPolicyApplied(U_t)
\]

\[
HistoryUpdateValid(L_t)
\]

\[
PIDDerivationValid(PID, K, L_t)
\]

この証明により、PID が恣意的に発行されたのではなく、AMT の候補生成、クラスタ、未解決判定、履歴更新を通過したことを検証できる。ただし、詳細な候補集合や住所表記を秘匿する場合、回路化の負荷が大きい。実装初期では、完全 ZK 回路ではなく、署名付き監査エンベロープと透明ログを併用する段階的導入が現実的である。

## 14. Freshness and Revocation

住所 credential は時間とともに古くなる。引っ越し、行政変更、建物解体、配送不能化、災害、issuer 失効、鍵漏洩により、過去に正しかった証明が現在も正しいとは限らない。

freshness root を

\[
R_{fresh}(t)
\]

revocation root を

\[
R_{rev}(t)
\]

とする。証明は、credential が次を満たすことを示す。

\[
issuedAt \leq t \leq expiresAt
\]

\[
credId \notin R_{rev}(t)
\]

\[
freshnessEpoch(cred) \in R_{fresh}(t)
\]

freshness は単なる期限ではない。配送可能性や地域所属は、災害やサービス停止により短時間で変化する。したがって、述語ごとに freshness の要求水準を変える。

たとえば、`日本在住` は比較的長い鮮度でよい場合がある。一方、`本日配送可能` は短い鮮度が必要である。

## 15. Consent and Purpose Scope

住所由来の証明は、用途制限を持つべきである。同じ `東京都内` 証明でも、配送、本人確認、災害支援、広告ターゲティング、年齢確認、金融審査では意味が異なる。

用途スコープを

\[
scope = (purpose, verifier, expiry, jurisdiction, policyId)
\]

とする。証明関係は

\[
PurposeAllowed(cred, scope)
\]

を含む。これにより、配送用 credential を別用途に流用することを防ぐ。

同意は公開文字列ではなく、証明の一部として扱う。すなわち、利用者は「この証明は配送目的に限って検証される」という条件に束縛された proof を提出する。

## 16. Anonymous Rate Limiting

匿名レート制限は、同一利用者または同一住所が、短期間に過剰な証明を発行して濫用することを防ぐ。一方で、検証者間で利用者を追跡できてはならない。

rate limit nullifier を次のように定義する。

\[
N_{rate} = H(\texttt{rate} \parallel epoch \parallel scope \parallel holderSecret)
\]

同一 epoch と scope 内では、同じ holder が複数回証明すると検出される。異なる epoch または scope ではリンクされない。

匿名レート制限は、人道支援、クーポン配布、地域限定アクセス、配送資格チェックで有用である。ただし、epoch が長すぎると追跡性が高まり、短すぎると濫用防止効果が弱まる。

## 17. PID Lifecycle, Merge, and Split Proofs

住所は固定された点ではなく、履歴グラフである。行政変更、再開発、建物分割、統合、私書箱移転、宅配ロッカー更新、災害時仮想住所への切替により、PID は merge または split されうる。

履歴グラフを

\[
G_t = (V_t, E_t)
\]

とする。ノード \(V_t\) は PID または住所同値類を表し、辺 \(E_t\) は継承、分割、統合、改称、移転、失効を表す。

merge 証明は、複数の旧 PID が新 PID へ正当に統合されたことを示す。

\[
MergeValid(PID_1,\ldots,PID_k \to PID')
\]

split 証明は、一つの旧 PID が複数の新 PID へ正当に分割されたことを示す。

\[
SplitValid(PID \to PID'_1,\ldots,PID'_k)
\]

これらは住所保存則と関係する。住所が完全に消えるのではなく、履歴グラフ上で写像される場合、ZK 証明は履歴の正当性だけを示し、旧住所や新住所の詳細を隠せる。

## 18. Quality Threshold Proofs

住所解決の品質スコアは、利用者に直接表示しない場合でも、内部判定では重要である。低品質な住所タブを非表示にする、注意表示する、再検証対象にする、といった用途がある。

品質述語を

\[
P_{\rho \geq \theta}(q) =
\begin{cases}
1 & \rho_t(q) \geq \theta \\
0 & otherwise
\end{cases}
\]

とする。Quality Threshold Proof は、具体的な品質スコアや住所詳細を公開せずに、しきい値を満たすことだけを証明する。

ただし、品質スコアの計算根拠が不透明だと、証明は意味を失う。品質スコアは、候補数、クラスタ安定性、公式データ有無、郵便番号検証、配送履歴、GIS 一貫性、多言語表記安定性、自然地理認識、島・山地・砂漠・湿地・湖・川・滝などの地物検出可能性から構成されるべきである。

## 19. Proof Bundle Compatibility

実用上、単一の ZK 証明だけで十分なことは少ない。たとえば、配送には `住所属性証明`、`居住証明`、`配送可能性証明`、`AOID所有証明`、`失効鮮度証明`、`用途スコープ証明` が同時に必要になる。

Proof bundle を次のように定義する。

\[
B = (proof_1,\ldots,proof_n, descriptor, policy)
\]

descriptor は次を含む。

\[
descriptor =
(family, predicateId, subjectCommitment, scope, challenge, issuerSet, validityWindow)
\]

互換性条件は次である。

\[
SameSubject(Com_i, Com_j) \text{ or } ExplicitlySeparated(Com_i, Com_j)
\]

\[
ScopeCompatible(scope_i, scope_j)
\]

\[
FreshnessCompatible(window_i, window_j)
\]

\[
IssuerCompatible(issuer_i, issuer_j)
\]

互換性がない証明を同じ bundle に入れると、矛盾、リンク不能性の破壊、用途スコープ違反が起きる。したがって、ZK proof bundle registry は、証明ファミリ、descriptor、policy、domain separation を一元管理する必要がある。

## 20. Security and Failure Modes

主要な脅威は次である。

1. 一意化漏洩: 述語が細かすぎて住所が推定される。
2. replay: 古い proof が再利用される。
3. linkability: 異なる用途の証明が同一利用者に結びつく。
4. issuer spoofing: 信頼されていない issuer が credential を発行する。
5. stale credential: 引っ越しや失効後の credential が使われる。
6. scope violation: 配送用証明が広告や審査に流用される。
7. nullifier collision or overlinking: nullifier 設計が悪く、二重登録防止とプライバシーの両立が崩れる。
8. semantic falsehood: ZK 証明は正しいが、credential の住所意味論が誤っている。
9. bundle contradiction: 複数証明の subject や scope が矛盾する。
10. availability risk: revocation root や issuer registry が利用できない。

緩和策は、匿名集合しきい値、challenge binding、短寿命 proof、issuer trust registry、revocation/freshness root anchoring、domain separation、bundle compatibility、透明ログ、段階的回路化である。

## 21. Verification Plan and Implementation Boundary

検証は四層に分ける。

第一に、Lean で検証可能な部分である。集合、写像、同値関係、スコープ分離、条件付き定理、非代替定理、反例構造は Lean で形式化できる。

第二に、GIS またはデータ実験で検証する部分である。inside country、inside city、island recognition、river/lake/wetland/desert/mountain/glacier recognition、postal-code consistency、quality score stability は実データで検証する必要がある。

第三に、実装テストで検証する部分である。TypeScript の proof envelope、bundle registry、issuer registry、revocation/freshness anchoring、nullifier、AOID ownership、PID issuance audit はユニットテストと API テストで確認する。

第四に、暗号監査が必要な部分である。実際の ZK 回路、trusted setup の有無、proof system の健全性、零知識性、side-channel、安全な hash-to-field は専門監査が必要である。

現時点で本稿が扱う実装は、ZK-ready な意味論的エンベロープであり、production-grade ZKP そのものではない。この境界は論文と実装の両方で明記する。

## 22. Use Cases

EC では、利用者が住所を EC サービスに直接渡さず、配送可能性と受取資格だけを証明できる。配送事業者には、必要最小限の配送解決情報だけを暗号化して渡す。

地域資格では、利用者は `日本在住`、`EU在住`、`北海道在住`、`東京都内` といった属性だけを証明できる。番地、建物名、氏名、電話番号は公開されない。

災害支援では、避難所、仮設住宅、支援拠点に対する仮想住所 credential を発行し、被災者が支援対象であることだけを証明できる。

Humanitarian Identity では、難民や住所喪失者が、旧住所、仮想住所、支援資格、配送可能性を組み合わせて、国境を超えた支援を受けられる。

買い物 Agent では、Agent が利用者の完全住所を保持せず、配送可能性証明と AOID ownership proof に基づいて注文を成立させる。

AOID 相続では、自宅、倉庫、店舗、企業拠点の AOID 所有権を、住所本文を公開せずに家族や管理者へ委譲できる。

## 23. Limitations

本稿の限界は明確である。

第一に、ZK 証明は、正しい witness から正しい述語を秘匿して示す技術であり、witness の現実世界での真実性を単独では保証しない。

第二に、住所写像論は、住所の意味論と履歴を扱うが、暗号的秘匿性を単独では与えない。

第三に、国別住所制度、郵便番号制度、地図データ、自然地理データ、配送会社の可否データは品質が不均一である。すべての地域で同じ精度を期待すべきではない。

第四に、述語が細かすぎると、ZK 証明でも住所の推定を防げない。零知識性は witness を隠すが、公開 statement の意味までは隠さない。

第五に、production-grade ZKP には回路設計、proof system 選定、監査、鍵管理、root anchoring、運用継続性が必要である。

## 24. Conclusion

住所写像論 II は、住所を公開文字列ではなく、証明可能な属性集合として扱うための補助理論である。住所写像論 I が意味論を与え、住所写像論 II が秘匿証明の構造を与える。両者を分離することで、住所解決の正しさ、credential の信頼性、ZK 証明の安全性、運用上の用途制限を個別に検証できる。

本稿の中心的な設計原則は、条件付き証明、非代替性、用途スコープ、domain separation、匿名集合しきい値、bundle compatibility である。これらにより、AGID/AOID は住所を秘匿したまま、配送可能性、居住資格、地域所属、所有権、PID 監査、重複防止を扱える基盤へ拡張できる。

## Appendix A: Mathematical Inventory

**定義 A.1: 住所表記空間.** \(S_t\) は、時刻 \(t\) において人間またはシステムが入力しうる住所表記の集合である。

**定義 A.2: 参照対象空間.** \(X_t\) は、建物、土地、部屋、私書箱、宅配ロッカー、道路、橋、山、湖、川、湿地、草原、砂漠、遺跡、世界遺産、災害時仮想拠点などの参照対象集合である。

**定義 A.3: 住所同値類.** \(Q_t = X_t / \sim_t\) は、AMT の同値関係により形成される住所参照対象の同値類集合である。

**定義 A.4: 属性写像.** \(\alpha_t : Q_t \to \mathcal{A}_t\) は、同値類から住所属性集合への写像である。

**定義 A.5: 住所述語.** \(P_j : \mathcal{A}_t \to \{0,1\}\) は、住所属性に関する公開検証可能な命題である。

**定義 A.6: AMT エンベロープ.** \(Env_t = (\pi_t, C_t, K_t, U_t, A_t, L_t, Q_t, H_t)\) は、住所解決過程の監査可能な要約である。

**定義 A.7: ZK 住所証明関係.** \(R_j(w,y)=1\) は、witness \(w\) と公開文 \(y\) が述語 \(P_j\) を満たし、credential、freshness、revocation、scope、challenge、ownership の条件を満たすことを表す。

**定義 A.8: Proof Bundle.** \(B=(proof_1,\ldots,proof_n,descriptor,policy)\) は、複数の住所証明を一つの用途のもとで束ねた検証単位である。

## Appendix B: Theorem and Lemma Catalogue

**定理 B.1: 意味論暗号分離定理.** AMT エンベロープの妥当性は ZK privacy を含意しない。また、ZK proof の検証成功は住所意味論の現実世界での真実性を含意しない。

証明概略。前者は、AMT エンベロープが平文で住所を含む場合に反例が成立する。後者は、誤った issuer が誤った credential を発行した場合、ZK proof はその credential に関する述語を正しく証明できるが、現実世界の住所真実性は保証されない。

**定理 B.2: 条件付き零知識住所述語定理.** \(R_j\) が回路表現可能であり、credential が valid、fresh、not revoked であり、scope と challenge に束縛され、proof system が完全性、健全性、零知識性を満たすならば、証明者は witness を公開せずに \(P_j(\alpha_t(q))=1\) を証明できる。

証明概略。これは標準的な ZK relation の構成に帰着する。住所特有の要素は witness と public statement の分解であり、暗号的性質は proof system の仮定に依存する。

**補題 B.3: スコープ分離補題.** nullifier が domain、scope、secret を含む衝突困難 hash により生成されるなら、異なる scope の nullifier は直接リンクされない。

**補題 B.4: Bundle 互換性補題.** bundle 内の各 proof が同一 subject commitment または明示的に分離された subject commitment を持ち、scope、freshness、issuer が互換ならば、bundle は policy 上の矛盾を起こさない。

**定理 B.5: 述語粒度漏洩定理.** 公開述語 \(P_j\) の真集合が小さすぎる場合、ZK proof は witness を秘匿しても、公開 statement から住所候補が一意化されうる。

**系 B.6: 匿名集合しきい値の必要性.** ZK Address Proof は、少なくとも匿名集合しきい値 \(k_{min}\) または同等の粒度制御を必要とする。

**反例 B.7: 住所文字列所有の反例.** 住所文字列を知っていることは、居住、所有、配送受取権限を意味しない。

**反例 B.8: 古い credential の反例.** 過去に正しい住所 credential は、引っ越しまたは失効後には現在の住所述語を保証しない。

## Appendix C: Implementation Mapping

本稿の概念は、AGID/AOID 実装では次のように対応する。

| 理論概念 | 実装上の対応 |
| --- | --- |
| AMT エンベロープ | `privateAddressPredicateProof`, `pidIssuanceAudit` |
| address credential | `addressCredential`, `addressCredentialFreshnessProof` |
| issuer trust | `credentialIssuerTrustRegistry` |
| revocation/freshness root | `revocationFreshnessRootAnchoring` |
| AOID ownership | `aoidOwnershipProof` |
| duplicate nullifier | `addressDuplicateNullifier` |
| anonymous rate limit | `anonymousRateLimitProof` |
| consent and purpose scope | `consentPurposeScopeProof` |
| quality threshold | `qualityThresholdProof` |
| proof compatibility | `zkProofCompatibility` |
| proof bundle registry | `zkProofBundleRegistry` |
| API boundary | `apiEndpoints` |

現段階では、これらは ZK-ready な証明エンベロープ、署名、commitment、root anchoring、nullifier を扱う実装であり、完全な ZK 回路そのものではない。将来的には、住所述語のうち回路化可能な部分を Rust/WASM または専用 ZK backend に移す。

## Appendix D: Verification Status

| 対象 | 検証方法 | 現状 |
| --- | --- | --- |
| 意味論暗号分離 | Lean 形式化可能 | 論理構造は明確、形式化候補 |
| 条件付き ZK 住所述語 | Lean と暗号仮定 | 条件付き定理として記述可能 |
| inside country/city | GIS 実験 | データ品質依存 |
| delivery eligibility | 配送データと policy 実験 | 事業者データ依存 |
| AOID ownership | 実装テストと署名検証 | 実装検証可能 |
| duplicate nullifier | 実装テストと hash domain 検査 | 実装検証可能 |
| PID issuance audit | パイプライン監査テスト | 回路化前は署名付き監査が現実的 |
| freshness/revocation | root anchoring テスト | 実装検証可能 |
| proof bundle compatibility | policy テスト | 実装検証可能 |
| production ZKP | 回路監査 | 未実装、専門監査が必要 |
