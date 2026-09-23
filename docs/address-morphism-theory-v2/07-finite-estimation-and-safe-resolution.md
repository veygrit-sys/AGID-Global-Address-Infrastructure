# 第7章 有限推定と安全解決

## 7.0 互換ノート

本章は、現行29章構成における第6章「アドレス参照不可能性判定処理」、第11章「安全な解決とPID発行」、第14章「対立相対的最適性」、第29章「数学的モデル中核」を保存し、v2構成の第7章として再記述する。

第5章は候補集合を作った。第6章は候補を目的別同値類へ整理した。本章は、その有限な候補クラス集合の上で、AMTがどのように選ぶか、棄却するか、手動レビューへ送るか、そしてPID発行を許すかを定義する。

本章の基本主張は次である。

- AMTは常に解を返す必要はない。
- unresolved、abstain、manual_review は失敗ではなく、安全状態である。
- 有限候補クラス集合がなければ、argmin は安全に定義できない。
- 最小エネルギー候補が存在しても、品質、証拠、差分、対立リスク、公開投影が不足すればPIDを発行しない。
- PID発行は、安全解決とは別の追加境界である。

本章の中心式は次である。

\[
\rho_{t,p}(s)
\in
R_t\cup\{\bot_{\operatorname{unresolved}},\bot_{\operatorname{manual}},\bot_{\operatorname{blocked}}\}
\]

AMTは、解決、棄却、保留をすべて正式な出力として扱う。

---

## 7.1 入力: 有限候補クラス集合

第6章の同値類を用いて、表面住所 \(s\)、目的 \(p\) に対する候補クラス集合を次で表す。

\[
\mathcal{K}_t(s,p)
=
C_t(s,p)/\sim_{t,p,\epsilon}
\]

本章では、\(\mathcal{K}_t(s,p)\) が有限であることを要求する。

\[
|\mathcal{K}_t(s,p)|<\infty
\]

有限性がなければ、最小化、監査、再現性、手動レビュー、PID発行境界を安全に定義できない。

有限候補クラス集合が存在しない場合、解決写像は resolved を返してはならない。

\[
|\mathcal{K}_t(s,p)|=\infty
\lor
\mathcal{K}_t(s,p)=\emptyset
\Rightarrow
\rho_{t,p}(s)=\bot
\]

---

## 7.1.1 解決入力証明書

安全解決は、候補クラス集合だけを入力にして実行してはならない。候補集合がどのように作られ、どの出典で支えられ、どの目的に対して比較可能かを同時に持つ必要がある。

本章では、解決器へ渡す入力を次の証明書として扱う。

\[
\operatorname{RIC}_{t,p}(s)
=
(
\mathcal{K},
\operatorname{FiniteOK},
\operatorname{CandidateSufficient},
\operatorname{EvidenceOK},
\operatorname{PurposePolicy},
\operatorname{PrivacyPolicy},
\operatorname{SourceVersion}
)
\]

ここで、RIC は Resolution Input Certificate の略である。

- \(\mathcal{K}\): 第6章で得られた候補同値類集合。
- \(\operatorname{FiniteOK}\): 候補クラス集合が有限であること。
- \(\operatorname{CandidateSufficient}\): 目的に対して候補生成が十分であるという仮定または検証結果。
- \(\operatorname{EvidenceOK}\): 使う証拠が出典政策、ライセンス、鮮度、地域ポリシーに適合していること。
- \(\operatorname{PurposePolicy}\): 配送、本人確認、ホテル受取、災害、ZK証明などの目的別ルール。
- \(\operatorname{PrivacyPolicy}\): raw住所、部屋番号、私有地、危険施設などの公開投影境界。
- \(\operatorname{SourceVersion}\): どの出典集合と版で計算されたか。

重要なのは、RIC が「候補が十分であることを世界規模に証明する万能証明」ではない点である。RIC は、ある地域、ある出典集合、ある時点、ある目的の下で、解決器を動かしてよいかを記録する実務的・検証可能な入力境界である。

したがって、解決写像はより正確には次の部分関数として扱う。

\[
\rho_{t,p}:
(s,\operatorname{RIC}_{t,p}(s))
\rightharpoonup
R_t\cup
\{\bot_{\operatorname{unresolved}},\bot_{\operatorname{manual}},\bot_{\operatorname{blocked}}\}
\]

RIC が欠ける場合、AMTは「スコアだけで解決する」ことを許さない。

\[
\operatorname{RIC}_{t,p}(s)\ \text{is missing}
\Rightarrow
\rho_{t,p}(s)=\bot_{\operatorname{unresolved}}
\]

---

## 7.1.2 候補十分性と真理の分離

候補十分性は、真理そのものではない。

\[
\operatorname{CandidateSufficient}_{t,p}(s)=1
\centernot\Rightarrow
K_{\operatorname{true}}\in\mathcal{K}_t(s,p)
\ \text{with absolute certainty}
\]

候補十分性が意味するのは、定義済みの出典、地域、目的、品質ゲートの下で、解決を試みることが許されるということである。

この分離は重要である。世界中の住所、自然地理、文化地理、建物内区画、旧地名、非公式地名、災害時の臨時拠点をすべて完全に候補化することは、現時点では未検証である。したがって、AMTは候補生成を「完全」と呼ばず、候補十分性を局所的な運用仮定として明示する。

---

## 7.2 エネルギー関数

候補クラス \(K\in\mathcal{K}_t(s,p)\) に対して、目的別エネルギー関数を定義する。

\[
E_{t,p}(K)
=
\alpha d_{t,p}(K)
+\beta L_{t,p}(K)
+\gamma U_{t,p}(K)
+\delta Q_{t,p}(K)
+\eta G_{t,p}(K)
\]

ここで、

- \(d_{t,p}(K)\): 入力表現と候補クラスの構造距離。
- \(L_{t,p}(K)\): 目的別損失。
- \(U_{t,p}(K)\): 不確実性。
- \(Q_{t,p}(K)\): 品質不足ペナルティ。
- \(G_{t,p}(K)\): ガバナンス、対立、公開投影リスク。

AMTでは、スコアが高い候補を選ぶのではなく、目的別リスクを含むエネルギーを最小化する。

\[
K^\star
=
\arg\min_{K\in\mathcal{K}_t(s,p)}
E_{t,p}(K)
\]

有限集合上であれば、少なくとも一つの最小候補クラスが存在する。

---

## 7.3 有限argmin存在定理

**定理7.1 有限argmin存在。**  
\(\mathcal{K}_t(s,p)\) が非空有限集合であり、すべての \(K\in\mathcal{K}_t(s,p)\) について \(E_{t,p}(K)\in\mathbb{R}\) が定義されるなら、

\[
\arg\min_{K\in\mathcal{K}_t(s,p)}E_{t,p}(K)
\]

は空でない。

**証明スケッチ。**  
有限個の実数集合は最小値を持つ。したがって、最小値を達成する候補クラスが少なくとも一つ存在する。

この定理は、正しい住所が必ず見つかることを意味しない。意味するのは、有限候補クラス集合の上で最小候補を計算できるということだけである。

---

## 7.4 近接タイと手動レビュー

最小候補 \(K_1\) と二番目の候補 \(K_2\) のエネルギー差を次で表す。

\[
\Delta E
=
E_{t,p}(K_2)-E_{t,p}(K_1)
\]

目的 \(p\) に対する最小分離幅を \(\mu_p\) とする。

\[
\Delta E<\mu_p
\Rightarrow
\rho_{t,p}(s)=\bot_{\operatorname{manual}}
\]

候補同士が近すぎる場合、AMTは無理に勝者を決めない。近接タイは、曖昧性、出典不足、境界変更、旧地名、入口違い、配送会社差分、自然地理の境界曖昧性などを示す可能性がある。

---

## 7.5 決定的タイブレーク

完全な同点が起きることがある。

\[
E_{t,p}(K_1)=E_{t,p}(K_2)
\]

AMTでは、同点を乱数で解決してはならない。再現性のため、決定的タイブレークを使う。

\[
\operatorname{TieBreak}_{t,p}(K_1,K_2)
\]

ただし、タイブレークは万能ではない。タイブレークが安全に定義されていない場合、手動レビューへ送る。

\[
\operatorname{TieBreakSafe}_{t,p}=0
\Rightarrow
\rho_{t,p}(s)=\bot_{\operatorname{manual}}
\]

安全なタイブレークとは、同一候補クラス内の安定ID順、出典版、履歴ルート、監査可能な規則などに基づくものをいう。任意順序、配列順、実行時非決定性、ネットワーク応答順は使ってはならない。

---

## 7.6 安全解決写像

安全解決写像を次で表す。

\[
\rho_{t,p}:S_t\rightharpoonup R_t\cup\{\bot\}
\]

実際には、\(\rho_{t,p}\) は次の状態を返す。

```text
resolved
unresolved
manual_review
blocked
```

resolved は、候補クラスが安全に選べることを示す。unresolved は、候補不足や出典不足により判断できないことを示す。manual_review は、候補が近すぎる、または対立があるため人間の判断が必要であることを示す。blocked は、ライセンス、プライバシー、安全性、公的境界により処理を止める状態である。

---

## 7.7 解決ゲート

resolved を返すためには、少なくとも次のゲートが通る必要がある。

\[
\operatorname{FiniteOK}=1
\]

\[
\operatorname{CandidateSufficient}=1
\]

\[
\operatorname{EvidenceOK}=1
\]

\[
\operatorname{QualityOK}=1
\]

\[
\operatorname{ConflictRiskOK}=1
\]

\[
\operatorname{TieSafe}=1
\]

いずれかが失敗した場合、AMTは resolved ではなく、unresolved、manual_review、blocked のいずれかを返す。

---

## 7.7.1 決定ゲート表

実装では、各ゲートを文章ではなく決定表として持つ。決定表は、理論をテスト可能にするための最小単位である。

| gate | class | pass | fail | meaning |
| --- | --- | --- | --- | --- |
| finite-candidate-class-required | resolution | resolvedへ進める | unresolved | 候補クラス集合が非空有限である |
| candidate-sufficiency-required | resolution | resolvedへ進める | unresolved | 候補生成が目的に対して十分である |
| evidence-required | resolution | resolvedへ進める | unresolved | 証拠が出典政策に適合する |
| energy-gap-below-purpose-threshold | review | resolvedへ進める | manual_review | 上位候補の差分が目的別閾値以上である |
| safe-deterministic-tie-break-required | review | resolvedへ進める | manual_review | 同点時に安全な決定規則がある |
| quality-below-threshold | review | resolvedへ進める | manual_review | 最良候補の品質が目的別閾値以上である |
| conflict-risk-above-threshold | review | resolvedへ進める | manual_review | 係争、境界変更、出典対立が許容範囲内である |
| public-projection-safety-required | pid | PID発行へ進める | pid_blocked | 公開識別子が秘密属性を漏らさない |
| lineage-readiness-required | pid | PID発行へ進める | pid_blocked | 履歴・由来・後継関係が追跡可能である |
| revocation-readiness-required | pid | PID発行へ進める | pid_blocked | 誤発行・変更・削除時に失効できる |
| audit-readiness-required | pid | PID発行へ進める | pid_blocked | 発行根拠と判断ログが監査可能である |

この表により、AMTの解決は次の三層に分かれる。

```text
resolution gates  : そもそも解決を試みてよいか
review gates      : 機械で決め切ってよいか
PID gates         : 公開・永続識別子に昇格してよいか
```

この三層を混同すると、理論も実装も危険になる。候補集合が十分でないのにスコア計算へ進むと、未知候補を無視した誤解決になる。近接タイを無視すると、曖昧な住所を確定住所として扱ってしまう。PIDゲートを省略すると、短期配送には十分な参照を公開識別子として固定してしまう。

---

## 7.7.2 安全優先の状態遷移

AMTの状態は、単純な成功・失敗ではない。安全優先の状態遷移として扱う。

\[
\operatorname{blocked}
\succ
\operatorname{manual\_review}
\succ
\operatorname{unresolved}
\succ
\operatorname{resolved}
\]

ここで \(\succ\) は「より強く処理を止めるべき状態」を表す便宜的な安全優先順序であり、数学的な真理順位ではない。

- blocked: 利用してはいけない理由がある。
- manual_review: 機械で決め切ると危険である。
- unresolved: 判断材料が不足している。
- resolved: 定義された条件の下で使える。

決定規則は次である。

\[
\operatorname{StopReason}(s,p)\neq\emptyset
\Rightarrow
\rho_{t,p}(s)
\in
\{\bot_{\operatorname{blocked}},\bot_{\operatorname{manual}},\bot_{\operatorname{unresolved}}\}
\]

AMTは、止まる理由を隠して resolved を返してはならない。止まる理由は、証明書、監査ログ、改善課題、ベンチマーク失敗として保存される。

---

## 7.8 PID発行境界

resolved と PID issuance は同じではない。

\[
\rho_{t,p}(s)=r
\centernot\Rightarrow
\operatorname{PIDIssue}_{t,p}(s,r)=1
\]

PID発行には追加条件が必要である。

\[
\operatorname{PIDIssue}_{t,p}(s,r)=1
\]

であるための十分条件は次である。

\[
\rho_{t,p}(s)=r
\land
\operatorname{PublicProjectionSafe}_t(r,p)=1
\land
\operatorname{LineageReady}_t(r)=1
\land
\operatorname{RevocationReady}_t(r)=1
\land
\operatorname{AuditReady}_t(r,p)=1
\]

PIDは公共的・永続的・相互運用的に使われ得るため、解決より強い境界を必要とする。

---

## 7.8.1 解決証明書

AMTは、resolved かどうかだけを返すのでは不十分である。なぜその状態になったのか、何を保証し、何を保証しないのかを機械可読に返す必要がある。

そこで、解決証明書を次で定義する。

\[
\operatorname{RC}_{t,p}(s)
=
(
\operatorname{state},
K^\star,
E(K^\star),
\Delta E,
\operatorname{failedReasons},
\operatorname{pidCanBeIssued},
\operatorname{nonClaims}
)
\]

ここで、RC は Resolution Certificate の略である。

- \(\operatorname{state}\): resolved、unresolved、manual_review、blocked のいずれか。
- \(K^\star\): 選ばれた候補クラス。未解決時には存在しないことがある。
- \(E(K^\star)\): 最良候補のエネルギー。
- \(\Delta E\): 二番候補との差分。
- \(\operatorname{failedReasons}\): 失敗または停止したゲートID。
- \(\operatorname{pidCanBeIssued}\): PID発行境界が通ったか。
- \(\operatorname{nonClaims}\): 本証明書が主張しないこと。

解決証明書は、次を必ず非主張として持つ。

```text
resolution certificate is not raw address disclosure
resolution certificate is not a PID by itself
minimum energy is not global truth
manual_review and unresolved are safe outputs
PID issuance requires stricter public projection, lineage, revocation, and audit gates
```

つまり、RC は「住所そのもの」ではない。「PID」でもない。「世界で唯一正しい対象」を証明するものでもない。RC は、ある時点、ある目的、ある候補集合、ある出典状態における安全解決の監査可能な結果である。

---

## 7.8.2 解決証明書非PID補題

**補題7.1 解決証明書はPIDではない。**  
任意の表面住所 \(s\)、目的 \(p\)、時刻 \(t\) について、

\[
\operatorname{RC}_{t,p}(s)
\centernot\Rightarrow
\operatorname{PID}_{t,p}(s)
\]

である。

**証明スケッチ。**  
RC は状態、候補、エネルギー、差分、失敗理由、非主張を含む判断記録である。一方、PID は公開・永続・相互運用的な識別子であり、公開投影安全性、履歴、失効、監査の追加ゲートを要求する。したがって、RC が存在することから PID の存在は従わない。

この定理は、AMTを商用・OSS・研究のどこで使う場合にも重要である。解決ログを持っていることと、公共的識別子を発行してよいことは違う。

---

## 7.9 対立相対的最適性

AMTは、絶対的な勝利宣言ではなく、対立相対的な最適性を扱う。

目的 \(p\)、制約集合 \(\mathcal{B}\)、損失関数 \(\ell_p\) の下で、候補 \(K^\star\) が安全に選ばれるとは、次を満たすことである。

\[
K^\star
=
\arg\min_{K\in\mathcal{K}_t(s,p)}
E_{t,p}(K)
\]

かつ、

\[
\operatorname{Risk}_{t,p}(K^\star\mid\mathcal{B})\le\tau_p
\]

である。

ここで、\(\mathcal{B}\) は出典、法域、目的、プライバシー、配送会社、災害状態、係争状態などの制約である。

したがって、AMTの解決は「世界で絶対に正しい」とは言わない。AMTは「この目的、この制約、この証拠状態の下では安全に選べる」と言う。

---

## 7.9.1 目的別損失の例

同じ候補クラスでも、目的が変われば損失は変わる。したがって、AMTのエネルギー関数は目的 \(p\) を添字に持つ。

\[
L_{t,p_1}(K)\neq L_{t,p_2}(K)
\]

例として、次の目的を考える。

| purpose \(p\) | 重く見る損失 | 説明 |
| --- | --- | --- |
| parcel_delivery | 到達不能、入口誤り、配送会社対応外 | 配送できるかが中心 |
| identity_verification | 公的書類との不一致、本人性不足 | 法的・本人確認上の整合性が中心 |
| hotel_delivery | 滞在期間、ホテル受取ポリシー、予約名一致 | 時間制約と委任が中心 |
| emergency_response | 到達時間、危険区域、災害時変更 | 平時の行政住所より現場到達性が中心 |
| zk_predicate | 公開信号漏えい、証明範囲、失効状態 | 住所非開示で証明できる事実が中心 |
| public_pid | 公開投影、履歴、失効、監査、社会的対立 | 永続識別子としての安全性が中心 |

この表から分かるように、ある住所参照が配送には十分でも、本人確認には不十分なことがある。ホテル受取には十分でも、公開PIDには危険なことがある。ZK証明には使えても、raw住所表示には使えないことがある。

目的別損失を導入する理由は、住所を一つの万能文字列として扱わないためである。AMTは、住所参照を目的依存の計算対象として扱う。

---

## 7.9.2 目的別安全解決の命題

**命題7.4 目的変更による解決状態の非保存。**  
ある目的 \(p_1\) で resolved であっても、別の目的 \(p_2\) で resolved であるとは限らない。

\[
\rho_{t,p_1}(s)=r
\centernot\Rightarrow
\rho_{t,p_2}(s)=r
\]

理由は、候補十分性、損失関数、品質閾値、プライバシー境界、出典政策が目的ごとに異なるからである。

**例。**  
「ホテル名 + 予約番号 + 滞在日」はホテル受取では十分な候補になり得る。しかし、住民登録や公的本人確認の目的では十分ではない。

---

## 7.10 未解決状態は正しさである

AMTにおいて、unresolved は失敗ではない。

\[
\rho_{t,p}(s)=\bot_{\operatorname{unresolved}}
\]

は、次の意味を持つ。

- 候補集合が不足している。
- 出典カバレッジが不足している。
- 構造比較ができない。
- 証拠が目的に対して許容されない。
- 候補同士の差分が十分でない。
- 公開投影が安全でない。

誤って resolved を返すより、unresolved を返す方が正しい場合がある。

未解決状態は、次の情報を持つべきである。

\[
\bot_{\operatorname{unresolved}}
=
(
\operatorname{missingEvidence},
\operatorname{missingSources},
\operatorname{unsupportedJurisdiction},
\operatorname{candidateDebt},
\operatorname{nextVerificationStep}
)
\]

これにより、unresolved は単なる空返答ではなく、改善可能な研究対象になる。

例として、郵便番号が存在しない国では、郵便番号照合に失敗しただけで住所参照不能と判定してはならない。AGID区域、行政区画、POI、道路、港、島、自然地理、配送拠点、緯度経度セルなど、別の候補生成層を追加すべきである。この場合の unresolved は「郵便番号がないから失敗」ではなく、「郵便番号以外の候補生成層がまだ十分に検証されていない」という状態である。

---

## 7.10.1 未解決負債

未解決の原因を負債として表す。

\[
\operatorname{Debt}_{t,p}(s)
=
w_s D_{\operatorname{source}}
+w_c D_{\operatorname{coverage}}
+w_l D_{\operatorname{license}}
+w_m D_{\operatorname{multilingual}}
+w_g D_{\operatorname{geometry}}
+w_a D_{\operatorname{audit}}
\]

ここで、

- \(D_{\operatorname{source}}\): 出典不足。
- \(D_{\operatorname{coverage}}\): 地域カバレッジ不足。
- \(D_{\operatorname{license}}\): ライセンス不明またはOSS利用不能。
- \(D_{\operatorname{multilingual}}\): 多言語・別名・旧地名不足。
- \(D_{\operatorname{geometry}}\): 境界、到達可能性、自然地理の不足。
- \(D_{\operatorname{audit}}\): 判断根拠を再現できない不足。

未解決負債は、次にどのデータ、テスト、ガバナンス、UI、レビュー手順を作るべきかを決める。AMTの改善ループは、resolved の増加だけでなく、未解決負債の減少として評価される。

---

## 7.11 手動レビュー

manual_review は、モデルの敗北ではない。これは、人間または組織的判断が必要な状態である。

\[
\rho_{t,p}(s)=\bot_{\operatorname{manual}}
\]

が返される例は次である。

- 上位候補のエネルギー差が小さい。
- 出典間に対立がある。
- 行政区画変更直後である。
- 災害時の臨時住所である。
- 係争地域である。
- 建物入口や配送拠点が複数ある。
- PID発行には強すぎるが、短期配送には十分な候補がある。

manual_review は、研究・運用・OSSにおいて重要な状態である。なぜなら、曖昧性を隠さず、改善すべき出典、ルール、UI、ガバナンスへ戻せるからである。

手動レビューは、次のように形式化できる。

\[
\operatorname{ManualReview}_{t,p}(s)
=
(
\operatorname{candidateSet},
\operatorname{topCandidates},
\operatorname{energyGap},
\operatorname{conflictEvidence},
\operatorname{reviewPolicy},
\operatorname{allowedActions}
)
\]

allowedActions には、次のような操作を含める。

- 出典を追加する。
- 候補を統合しない。
- 一時配送トークンだけを許す。
- PID発行を拒否する。
- 地域コミュニティ検証へ送る。
- ZK proof-only モードへ制限する。
- 中立ラベルを付けて係争状態として扱う。

この形式化により、manual_review は「人間が何となく見る」状態ではなく、どの証拠を見て、どの操作が許されるかを限定した安全な状態になる。

---

## 7.11.1 レビュー可能性命題

**命題7.5 手動レビューは解決器の外部例外ではない。**  
manual_review は、\(\rho_{t,p}\) の正規出力である。

\[
\bot_{\operatorname{manual}}
\in
\operatorname{codomain}(\rho_{t,p})
\]

したがって、manual_review を返す実装は、AMTの失敗ではなく、AMTの仕様に従っている。

---

## 7.12 ブロック状態

blocked は、候補の曖昧性ではなく、利用してはいけない理由がある状態である。

\[
\rho_{t,p}(s)=\bot_{\operatorname{blocked}}
\]

例は次である。

- ライセンス不明データしかない。
- raw住所や部屋番号を公開してしまう。
- 公開PIDに秘密属性が混入する。
- 出典が商用制限付きでOSSに使えない。
- セキュリティポリシーに反する。
- 係争地域で中立ポリシーが未定義である。

blocked は、manual_review より強い停止状態である。

blocked は、次のように扱う。

\[
\operatorname{Blocked}_{t,p}(s)
=
(
\operatorname{policyViolation},
\operatorname{licenseViolation},
\operatorname{privacyViolation},
\operatorname{safetyViolation},
\operatorname{governanceViolation}
)
\]

blocked の特徴は、追加計算で無理に解決してはいけない点である。たとえば、部屋番号や個人宅の精密座標を公開PIDに混ぜる危険がある場合、候補スコアが高くても PID 発行へ進んではならない。

blocked は、原則として次のどれかが必要になる。

- 入力から秘密属性を除去する。
- 公開投影を粗くする。
- 利用目的を変える。
- ライセンスを確認する。
- ガバナンスポリシーを定義する。
- ZKまたは暗号化だけで扱う。
- 処理そのものを拒否する。

---

## 7.13 反例

### 反例7.1 最小エネルギー候補が正しいとは限らない

\[
K^\star=\arg\min E_{t,p}(K)
\centernot\Rightarrow
K^\star=K_{\operatorname{true}}
\]

候補生成が不十分なら、真の候補が集合に含まれない。

### 反例7.2 resolved はPID発行を含意しない

\[
\rho_{t,p}(s)=r
\centernot\Rightarrow
\operatorname{PIDIssue}_{t,p}(s,r)=1
\]

公開投影、履歴、監査、失効境界が不足すればPIDは発行できない。

### 反例7.3 タイを配列順で解決してはならない

\[
E(K_1)=E(K_2)
\]

で、配列順やAPI応答順により \(K_1\) を選ぶと、実行ごとに結果が変わる可能性がある。

### 反例7.4 手動レビューは失敗ではない

\[
\rho_{t,p}(s)=\bot_{\operatorname{manual}}
\]

は、誤ったPIDを発行しないための安全状態である。

### 反例7.5 短期配送可能性は公開PIDを含意しない

ホテル、イベント会場、災害避難所、ポップアップ店舗では、一時的に配送可能な参照が成立することがある。

\[
\operatorname{Deliverable}_{t,p}(K)=1
\centernot\Rightarrow
\operatorname{PIDIssue}_{t,p}(K)=1
\]

配送できることと、公開・永続識別子として固定できることは違う。

### 反例7.6 郵便番号一致は安全解決を含意しない

\[
\operatorname{PostalCode}(K_1)=\operatorname{PostalCode}(K_2)
\centernot\Rightarrow
K_1\sim_{t,p}K_2
\]

同じ郵便番号内に複数の建物、入口、配送不能区域、私有地、ロッカー、港湾区域が存在し得る。

### 反例7.7 座標近接は同一実体を含意しない

\[
\operatorname{dist}_{geo}(K_1,K_2)<\epsilon
\centernot\Rightarrow
K_1=K_2
\]

高層建物の別階、隣接する入口、地下街、駅施設、港湾ゲート、島の桟橋、軍事施設境界では、近接座標が同一配送参照を意味しない。

### 反例7.8 ZK証明可能性は住所解決の正しさを補修しない

\[
\operatorname{ZKProof}(\phi(K))=1
\centernot\Rightarrow
K=K_{\operatorname{true}}
\]

ZKは秘密を明かさずに条件を証明する技術であり、候補生成や解決が誤っている場合、その誤りを自動的に直すものではない。

### 反例7.9 安全な同点規則がない完全同点

\[
E(K_1)=E(K_2)
\land
\operatorname{TieBreakSafe}=0
\Rightarrow
\rho_{t,p}(s)=\bot_{\operatorname{manual}}
\]

同点をランダム順、DB返却順、API応答順で解く実装は、再現性と監査可能性を失う。

---

## 7.14 命題と定理

**命題7.1 有限性なしに安全解決はない。**

\[
|\mathcal{K}_t(s,p)|=\infty
\Rightarrow
\rho_{t,p}(s)\neq r
\]

**命題7.2 近接タイは手動レビューを要求する。**

\[
\Delta E<\mu_p
\Rightarrow
\rho_{t,p}(s)=\bot_{\operatorname{manual}}
\]

**命題7.3 PID発行は解決より強い。**

\[
\operatorname{PIDIssue}_{t,p}(s,r)=1
\Rightarrow
\rho_{t,p}(s)=r
\]

しかし逆は成り立たない。

**定理7.1 有限argmin存在。**  
非空有限候補クラス集合と実数値エネルギー関数があれば、最小候補クラスは存在する。

**定理7.2 安全棄却定理。**  
有限性、候補十分性、証拠、品質、対立リスク、タイ安全性のいずれかが失敗する場合、AMTが resolved 以外を返すことは安全性違反ではない。

**定理7.3 解決証明書非PID定理。**  
\(\operatorname{RC}_{t,p}(s)\) が存在しても、PID発行は従わない。

\[
\operatorname{RC}_{t,p}(s)
\centernot\Rightarrow
\operatorname{PIDIssue}_{t,p}(s,r)=1
\]

**命題7.6 目的変更による解決状態の非保存。**  
ある目的で resolved であっても、別目的で resolved であるとは限らない。

\[
\rho_{t,p_1}(s)=r
\centernot\Rightarrow
\rho_{t,p_2}(s)=r
\]

**命題7.7 PID境界の片方向性。**  
PID発行が許されるなら、解決は成立していなければならない。

\[
\operatorname{PIDIssue}_{t,p}(s,r)=1
\Rightarrow
\rho_{t,p}(s)=r
\]

しかし、

\[
\rho_{t,p}(s)=r
\centernot\Rightarrow
\operatorname{PIDIssue}_{t,p}(s,r)=1
\]

である。

**定理7.4 安全非解決定理。**  
AMTが unresolved、manual_review、blocked のいずれかを返し、その理由を証明書に記録するなら、その出力は仕様上の正規状態である。

\[
\rho_{t,p}(s)
\in
\{
\bot_{\operatorname{unresolved}},
\bot_{\operatorname{manual}},
\bot_{\operatorname{blocked}}
\}
\Rightarrow
\operatorname{SafeNonResolution}_{t,p}(s)=1
\]

ただし、これは「処理を放棄してよい」という意味ではない。未解決負債、レビュー方針、ブロック理由を記録し、改善ループへ戻す必要がある。

**定理7.5 候補十分性の非完全性。**  
候補十分性が成立しても、世界全体で真候補を含むことは自動的には従わない。

\[
\operatorname{CandidateSufficient}_{t,p}(s)=1
\centernot\Rightarrow
K_{\operatorname{true}}\in\mathcal{K}_t(s,p)
\ \text{globally}
\]

候補十分性は、地域・出典・時刻・目的に相対的な運用仮定である。

---

## 7.15 実装アルゴリズム

安全解決の基本手順は次である。

```text
1. 解決入力証明書 RIC を受け取る
2. 候補クラス集合 K が非空有限か確認する
3. 候補十分性を確認する
4. 出典、ライセンス、鮮度、目的別証拠を確認する
5. 各候補クラスのエネルギー E を計算する
6. 最小候補と二番目候補の差分 DeltaE を計算する
7. 差分が小さければ manual_review
8. 完全同点なら決定的タイブレークの安全性を確認する
9. 最良候補の品質と対立リスクを確認する
10. 解決証明書 RC を発行する
11. resolved であっても PID発行境界を別途確認する
12. PID条件が通る場合のみ PID 発行を許可する
```

PID発行を同じ関数に混ぜないことが重要である。解決とPID発行は、隣接しているが同一ではない。

擬似コードで表すと次のようになる。

```text
safeResolve(s, purpose, RIC):
  if missing(RIC):
    return RC(unresolved, reason = missing-resolution-input-certificate)

  if not finite(RIC.K) or empty(RIC.K):
    return RC(unresolved, reason = finite-candidate-class-required)

  if not RIC.candidateSufficient:
    return RC(unresolved, reason = candidate-sufficiency-required)

  if not RIC.evidenceOk:
    return RC(unresolved, reason = evidence-required)

  ranked = sortByEnergy(RIC.K, purpose)
  best = ranked[0]
  second = ranked[1]
  gap = energy(second) - energy(best)

  if gap == 0 and not safeTieBreak(RIC):
    return RC(manual_review, selected = best, reason = safe-deterministic-tie-break-required)

  if gap < purpose.minEnergyGap:
    return RC(manual_review, selected = best, reason = energy-gap-below-purpose-threshold)

  if quality(best) < purpose.qualityThreshold:
    return RC(manual_review, selected = best, reason = quality-below-threshold)

  if conflictRisk(best) > purpose.conflictRiskThreshold:
    return RC(manual_review, selected = best, reason = conflict-risk-above-threshold)

  pidAllowed =
    publicProjectionSafe(best)
    and lineageReady(best)
    and revocationReady(best)
    and auditReady(best)

  return RC(resolved, selected = best, pidCanBeIssued = pidAllowed)
```

---

## 7.16 実装フック

本章に対応する実装・検証フックは次である。

- 有限候補クラスfixture
- 解決入力証明書fixture
- エネルギー関数
- 有限argminテスト
- 近接タイテスト
- 決定的タイブレークテスト
- 決定ゲート表テスト
- 解決証明書テスト
- manual_review状態テスト
- unresolved状態テスト
- blocked状態テスト
- PID発行境界テスト
- 公開投影安全性テスト
- 対立リスクテスト
- 非主張テスト

最低限のfixtureは次である。

| fixture | expected state | purpose |
| --- | --- | --- |
| finite-sufficient-two-candidates | resolved | 有限argminとPID境界の基本形 |
| non-finite-candidate-class | unresolved | 有限性ゲート |
| empty-candidate-class | unresolved | 非空ゲート |
| insufficient-candidate-coverage | unresolved | 候補十分性ゲート |
| evidence-not-admissible | unresolved | 出典政策ゲート |
| near-tie | manual_review | 近接タイ |
| exact-tie-unsafe-break | manual_review | 安全でないタイブレーク |
| low-quality-best | manual_review | 品質閾値 |
| high-conflict-best | manual_review | 対立リスク |
| resolved-but-public-projection-unsafe | resolved + pid_blocked | 解決とPIDの分離 |
| resolved-but-audit-not-ready | resolved + pid_blocked | 監査境界 |
| certificate-non-pid | certificate only | 解決証明書の非PID性 |

---

## 7.17 前半補強: 最小化と発行判断の分離

本章の弱点は、有限候補集合上でエネルギー最小化を定義すると、「最小値が存在すれば解決できる」と誤読される点である。AMTでは、最小化は必要条件であって、解決やPID発行の十分条件ではない。

候補クラス集合を \(\mathcal{K}\)、エネルギー関数を

\[
E_{t,p}:\mathcal{K}\to\mathbb{R}
\]

とする。有限性により

\[
K^\star=\arg\min_{K\in\mathcal{K}}E_{t,p}(K)
\]

は存在する。しかし、AMTの意思決定は

\[
\operatorname{Decide}(K^\star,G)
\]

であり、\(G\) はゲート集合である。

\[
G=
\{
g_{\mathrm{finite}},
g_{\mathrm{sufficient}},
g_{\mathrm{admissible}},
g_{\mathrm{gap}},
g_{\mathrm{quality}},
g_{\mathrm{conflict}},
g_{\mathrm{projection}},
g_{\mathrm{audit}}
\}
\]

解決条件は次である。

\[
\operatorname{Resolved}(K^\star)
\iff
\operatorname{ArgminExists}
\land
\operatorname{GapSafe}
\land
\operatorname{EvidenceAdmissible}
\land
\operatorname{QualityOK}
\land
\operatorname{ConflictLow}
\]

PID発行条件はさらに強い。

\[
\operatorname{PIDIssue}(K^\star)
\iff
\operatorname{Resolved}(K^\star)
\land
\operatorname{ProjectionSafe}
\land
\operatorname{AuditReady}
\land
\operatorname{PolicyAllowsPID}
\]

したがって、

\[
\operatorname{ArgminExists}
\centernot\Rightarrow
\operatorname{Resolved}
\centernot\Rightarrow
\operatorname{PIDIssue}
\]

である。

第7章で追加する決定表は次である。

| condition | decision |
| --- | --- |
| non-finite candidates | unresolved |
| empty candidates | unresolved |
| finite but insufficient source coverage | unresolved |
| exact tie without safe tie-break | manual_review |
| small energy gap | manual_review |
| best candidate low quality | manual_review |
| high conflict or disputed policy | manual_review or blocked |
| resolved but unsafe public projection | resolved, PID blocked |
| resolved but audit missing | resolved, PID blocked |
| privacy violation | blocked |

この補強により、第7章はアルゴリズムの章であると同時に、発行しないことを正当化する境界の章になる。

---

## 7.18 非主張

本章は、最小エネルギー候補が絶対的に正しいと主張しない。

\[
\neg
(
K^\star=\arg\min E
\Rightarrow
K^\star=K_{\operatorname{true}}
)
\]

本章は、resolved が PID 発行を含意すると主張しない。

\[
\neg
(
\rho_{t,p}(s)=r
\Rightarrow
\operatorname{PIDIssue}_{t,p}(s,r)=1
)
\]

本章は、manual_review がモデル失敗であるとは主張しない。

本章は、全世界の全住所で安全解決が必ず可能とは主張しない。

本章は、目的、法域、出典状態、プライバシー境界を無視した絶対最適性を主張しない。

---

## 7.19 まとめ

本章では、有限候補クラス集合の上で、AMTがどのように解決、棄却、手動レビュー、ブロック、PID発行境界を扱うかを定義した。

第5章が候補生成、第6章が構造距離と同値類なら、本章は「安全に選ぶ、または選ばない」ための章である。

本章の最重要分離は次である。

```text
finite estimation
  != safe resolution
  != PID issuance
```

最小エネルギー候補が存在することは重要である。しかし、それだけではPIDを発行できない。AMTは、正しく選ぶだけでなく、選ばない勇気を形式化する。
