# 第9章 確率、品質、エントロピー、意思決定

## 9.0 互換ノート

本章は、現行29章構成における第14章「対立相対的最適性」、第15章「住所圧縮と住所エントロピー」、第17章「評価関数、品質、評判」、第29章「数学的モデル中核」を保存し、v2構成の第9章として再記述する。

第5章は候補集合を作り、第6章は構造距離と同値類を定義し、第7章は有限推定と安全解決を定義し、第8章は履歴とPID保存を扱った。本章は、その上で、候補の不確実性、品質、評判、情報量、目的別損失をどのように意思決定へ入れるかを定義する。

本章の基本主張は次である。

- 確率は真理ではなく、証拠状態の要約である。
- 品質スコアは参照可能性の保証ではなく、目的別判断の信号である。
- 評判は出典・投稿者・配送履歴・検証履歴の信頼更新であり、同一性証明ではない。
- エントロピーは候補集合の曖昧性を測るが、低エントロピーは絶対正解を意味しない。
- MAP候補、Gibbs分布、Bayesian decision は、AMTの安全解決ゲートを置き換えない。
- 目的別損失を入れなければ、配送、本人確認、ZK証明、公共PID発行を同じ基準で誤って評価してしまう。

本章の中心式は次である。

\[
P_t(K\mid s,p,E)
\propto
\pi_t(K)\exp\left(-\frac{E_{t,p}(K)}{T_p}\right)
\]

\[
K^\star_{\operatorname{MAP}}
=
\arg\max_{K\in\mathcal{K}_t(s,p)}
P_t(K\mid s,p,E)
\]

\[
H(P)=-\sum_i p_i\log_2 p_i
\]

AMTは、最も確率が高い候補を機械的に採用する理論ではない。AMTは、確率、品質、評判、エントロピー、損失を使い、採用してよいか、レビューすべきか、未解決にすべきかを判断する理論である。

---

## 9.1 確率層の役割

候補集合 \(\mathcal{K}_t(s,p)\) が有限であっても、候補同士の優劣が完全に決まるとは限らない。出典が古い、表記が曖昧、自然地理境界が緩い、建物入口が複数ある、配送会社ごとの経路が異なる、履歴グラフが分岐している、などの理由で不確実性が残る。

そこで、候補クラスに確率分布を置く。

\[
P_t(\cdot\mid s,p,E):
\mathcal{K}_t(s,p)\to[0,1]
\]

\[
\sum_{K\in\mathcal{K}_t(s,p)}
P_t(K\mid s,p,E)=1
\]

この確率は、候補が「真である確率」を直接表すとは限らない。より正確には、現在の出典、品質、履歴、距離、目的別損失の下で、どの候補が相対的に支持されているかを表す。

---

## 9.2 事前分布

候補クラス \(K\) に対する事前分布を \(\pi_t(K)\) とする。

\[
\pi_t(K)\ge0
\]

\[
\sum_K\pi_t(K)=1
\]

事前分布は、次の要素から構成できる。

- 出典の信頼度。
- 履歴グラフ上の近さ。
- 社会的連続性。
- 配送成功履歴。
- 行政記録との整合。
- 地理的到達可能性。
- 言語・別名・旧地名の一致。
- 地域別の住所制度品質。

ただし、事前分布はバイアスを持ち得る。都市部やデータの多い地域ばかりが高く評価され、郵便番号がない地域、島しょ部、自然地理、非公式地名、災害時拠点が低く評価される危険がある。したがって、AMTは事前分布を出典政策と一緒に監査する。

---

## 9.3 Gibbs分布

第7章のエネルギー関数 \(E_{t,p}(K)\) を用いて、Gibbs分布を定義する。

\[
P_t(K\mid s,p,E)
=
\frac{
\pi_t(K)\exp(-E_{t,p}(K)/T_p)
}{
\sum_{K'\in\mathcal{K}_t(s,p)}
\pi_t(K')\exp(-E_{t,p}(K')/T_p)
}
\]

ここで、\(T_p>0\) は目的別温度である。

- \(T_p\) が小さいと、低エネルギー候補へ集中する。
- \(T_p\) が大きいと、候補間の差を緩く扱う。

温度は、曖昧性、出典品質、災害時、言語不一致、地域データ不足に応じて調整できる。ただし、温度調整は候補生成の不完全性を修復しない。

\[
K_{\operatorname{true}}\notin\mathcal{K}_t(s,p)
\Rightarrow
\text{Gibbs distribution cannot recover }K_{\operatorname{true}}
\]

---

## 9.4 MAP候補

MAP候補を次で定義する。

\[
K^\star_{\operatorname{MAP}}
=
\arg\max_K
P_t(K\mid s,p,E)
\]

MAP候補は意思決定の材料である。しかし、MAP候補であることは resolved を含意しない。

\[
K=K^\star_{\operatorname{MAP}}
\centernot\Rightarrow
\rho_{t,p}(s)=K
\]

第7章の安全解決ゲートが通らなければ、MAP候補は manual_review または unresolved の証拠として使われるだけである。

---

## 9.5 事後ギャップ

最上位候補 \(K_1\) と二番候補 \(K_2\) の事後確率差を次で表す。

\[
\Delta P
=
P(K_1\mid s,p,E)-P(K_2\mid s,p,E)
\]

目的別の最小ギャップを \(\gamma_p\) とする。

\[
\Delta P<\gamma_p
\Rightarrow
\operatorname{Decision}_{t,p}(s)=\bot_{\operatorname{manual}}
\]

これは、第7章のエネルギー差 \(\Delta E\) と対応するが、同一ではない。エネルギー差はスコア空間の差であり、事後ギャップは確率空間での差である。

---

## 9.6 エントロピー

候補分布のエントロピーを次で定義する。

\[
H_t(s,p)
=
-\sum_{K\in\mathcal{K}_t(s,p)}
P_t(K\mid s,p,E)
\log_2 P_t(K\mid s,p,E)
\]

エントロピーが高いほど、候補集合は曖昧である。

\[
H_t(s,p)>\eta_p
\Rightarrow
\operatorname{Decision}_{t,p}(s)\neq\operatorname{accept}
\]

ただし、エントロピーが低くても候補生成が不完全なら安全ではない。

\[
H_t(s,p)\approx0
\centernot\Rightarrow
K^\star=K_{\operatorname{true}}
\]

低エントロピーは「候補集合内で集中している」ことを表すだけであり、「候補集合が完全である」ことを表さない。

---

## 9.7 曖昧性削減

候補生成前または追加証拠前の分布を \(P_0\)、追加証拠後の分布を \(P_1\) とする。曖昧性削減量を次で定義する。

\[
\Delta H
=
H(P_0)-H(P_1)
\]

\[
\Delta H>0
\]

なら、追加証拠により候補の曖昧性が減ったことを示す。

例として、次の追加証拠は曖昧性を減らし得る。

- 建物入口。
- 配送会社の到達可能性。
- 旧地名辞書。
- POIグラフ。
- 島、港、フェリー接続。
- 行政区画の履歴。
- ホテル予約期間。
- ロッカーID。
- ZKで証明された地域所属。

曖昧性削減は、住所圧縮の理論とも対応する。短い識別子や郵便番号が意味を持つのは、候補集合をどれだけ削れるかに依存する。

---

## 9.8 住所圧縮と符号長

候補分布 \(P\) に対し、理想符号長を次で表す。

\[
\ell(K)=-\log_2 P(K)
\]

高確率候補ほど短い符号で表せる。住所、郵便番号、AGID、PID、ロッカーID、配送トークンは、ある意味で候補空間を圧縮する符号である。

しかし、住所圧縮には安全境界がある。

\[
\operatorname{Compress}(A)
\centernot\Rightarrow
\operatorname{Identify}(A)
\]

郵便番号は便利な圧縮であるが、全世界の全住所を一意に識別するものではない。AGIDやPIDも、公開投影、安全境界、履歴、失効、目的別スコープを無視して使えば危険である。

---

## 9.9 品質スコア

候補 \(K\) の品質を次で表す。

\[
Q_t(K,p)\in[0,1]
\]

品質は次の要素から構成できる。

\[
Q_t(K,p)
=
w_s Q_{\operatorname{source}}
+w_f Q_{\operatorname{freshness}}
+w_c Q_{\operatorname{coverage}}
+w_g Q_{\operatorname{geometry}}
+w_l Q_{\operatorname{lineage}}
+w_a Q_{\operatorname{audit}}
\]

ここで、

- \(Q_{\operatorname{source}}\): 出典信頼度。
- \(Q_{\operatorname{freshness}}\): 鮮度。
- \(Q_{\operatorname{coverage}}\): 地域・言語・地物カバレッジ。
- \(Q_{\operatorname{geometry}}\): 空間境界・到達可能性の整合。
- \(Q_{\operatorname{lineage}}\): 履歴グラフの整合。
- \(Q_{\operatorname{audit}}\): 監査可能性。

目的別品質閾値を \(\theta_p\) とする。

\[
Q_t(K,p)<\theta_p
\Rightarrow
\operatorname{Decision}_{t,p}(K)\neq\operatorname{accept}
\]

品質は採用条件であり、真理証明ではない。

---

## 9.10 評判更新

出典、投稿者、配送会社、コミュニティ検証者、機械学習モデルの信頼度は固定ではない。観測により更新される。

出典 \(s\) の評判を \(R_t(s)\in[0,1]\) とする。

成功・失敗の観測を用いて、簡易にはBetaモデルで表せる。

\[
R_t(s)
=
\frac{\alpha_s}{\alpha_s+\beta_s}
\]

成功観測で \(\alpha_s\) を増やし、失敗観測で \(\beta_s\) を増やす。

\[
\alpha_s'=\alpha_s+w_{\operatorname{success}}
\]

\[
\beta_s'=\beta_s+w_{\operatorname{failure}}
\]

ただし、配送成功、ユーザー投稿、GPS到達、写真、行政出典、ホテル受取、ロッカー受取は同じ重みでは扱わない。目的別・出典別に重みを変える。

---

## 9.11 評判の非主張

評判が高いことは、個別候補の正しさを保証しない。

\[
R_t(s)>\theta
\centernot\Rightarrow
K=K_{\operatorname{true}}
\]

評判は、過去の観測から見た信頼傾向である。高評判出典でも古いデータ、地域外データ、ライセンス不一致、誤統合、政治的偏り、欠測、住所制度の違いにより誤ることがある。

したがって、AMTでは評判を品質モデルへ入れるが、出典政策、安全解決、公開投影、履歴保存を置き換えない。

---

## 9.12 目的別期待損失

候補を選ぶことの期待損失を次で定義する。

\[
\mathcal{L}_{t,p}(a)
=
\sum_{K\in\mathcal{K}_t(s,p)}
P_t(K\mid s,p,E)
\ell_p(a,K)
\]

ここで、\(a\) は行動である。

行動集合は次のように置ける。

```text
accept
manual_review
unresolved
block
request_more_evidence
issue_short_lived_token
issue_pid
proof_only
carrier_decrypt_only
```

AMTの決定は、単に候補を選ぶことではなく、どの行動を取るかを選ぶことである。

\[
a^\star
=
\arg\min_{a\in A_p}
\mathcal{L}_{t,p}(a)
\]

ただし、安全ゲートが失敗する場合、期待損失だけで accept や PID issue を選んではならない。

---

## 9.13 目的別損失の例

| purpose | high loss | safer alternative |
| --- | --- | --- |
| parcel delivery | 誤配送、到達不能、入口違い | carrier-decrypt-only, manual_review |
| identity verification | 本人住所誤認、公的書類不一致 | request_more_evidence |
| hotel delivery | 滞在期間外配送、予約名不一致 | short-lived token |
| emergency | 到達遅延、危険区域誤判定 | emergency review, time-limited disclosure |
| ZK predicate | public signal leak, linkability | proof_only, scoped nullifier |
| public PID | 秘密属性公開、誤永続化 | pid_blocked, successor review |

目的別損失を使う理由は、同じ住所参照でも誤りのコストが異なるからである。低額配送と医薬品配送、ホテル一時受取と住民登録、匿名配送と公開PID発行を同じ損失関数で扱うべきではない。

---

## 9.14 品質・確率・安全ゲートの関係

本章の確率層は、第7章の安全解決ゲートの上にあるのではなく、横にある。

```text
candidate classes
   ↓
energy / posterior / entropy / quality / reputation
   ↓
decision certificate
   ↓
safe resolution gates
   ↓
PID boundary or non-resolution
```

確率層は候補の優先順位と不確実性を説明する。安全ゲートは、利用してよいかを決める。

\[
\operatorname{HighPosterior}(K)
\land
\operatorname{LowEntropy}
\land
\operatorname{HighQuality}
\centernot\Rightarrow
\operatorname{PIDIssue}(K)
\]

PID発行には、第7章と第8章の公開投影、履歴、失効、監査の条件が必要である。

---

## 9.15 意思決定証明書

第7章の解決証明書に対応して、本章では意思決定証明書を定義する。

\[
\operatorname{DC}_{t,p}(s)
=
(
P,
H(P),
\Delta P,
Q,
R,
\mathcal{L},
a^\star,
\operatorname{reasons},
\operatorname{nonClaims}
)
\]

ここで、DC は Decision Certificate の略である。

DC は次を記録する。

- 候補の事後分布。
- エントロピー。
- 上位候補の事後ギャップ。
- 品質ゲート。
- 評判信号。
- 目的別期待損失。
- 選ばれた行動。
- 採用、レビュー、未解決、ブロックの理由。
- 非主張。

DC は、住所全文ではない。PIDでもない。ZK証明でもない。DCは、意思決定の監査可能な記録である。

---

## 9.16 反例

### 反例9.1 MAP候補は真候補とは限らない

\[
K^\star_{\operatorname{MAP}}
\centernot\Rightarrow
K_{\operatorname{true}}
\]

候補生成が不十分なら、MAP候補は候補集合内の最良にすぎない。

### 反例9.2 低エントロピーは完全性を含意しない

\[
H(P)\approx0
\centernot\Rightarrow
K_{\operatorname{true}}\in\mathcal{K}
\]

候補集合が一つしかなければエントロピーは低いが、その候補が真とは限らない。

### 反例9.3 高品質スコアはPID発行を含意しない

\[
Q_t(K,p)\ge\theta_p
\centernot\Rightarrow
\operatorname{PIDIssue}(K)=1
\]

公開投影、履歴、失効、監査が不足すればPIDは発行できない。

### 反例9.4 高評判出典は個別候補の正しさを含意しない

\[
R_t(s)\ge\theta
\centernot\Rightarrow
\operatorname{Correct}(K)
\]

高評判の出典でも、地域差、古さ、政治的境界、建物内区画、臨時拠点に弱いことがある。

### 反例9.5 確率は暗号証明ではない

\[
P(K)>0.99
\centernot\Rightarrow
\operatorname{ZKProof}(\phi(K))=1
\]

確率的支持と暗号証明は別物である。

---

## 9.17 命題と定理

**命題9.1 Gibbs分布の正規化。**  
\(\mathcal{K}\) が非空有限集合で、\(\pi(K)\ge0\)、少なくとも一つの \(\pi(K)>0\)、\(T_p>0\) なら、Gibbs分布は正規化される。

\[
\sum_K P(K\mid s,p,E)=1
\]

**命題9.2 MAP非安全解決。**  
MAP候補であることは、安全解決を含意しない。

\[
K=K^\star_{\operatorname{MAP}}
\centernot\Rightarrow
\rho_{t,p}(s)=K
\]

**命題9.3 エントロピー削減は曖昧性削減である。**

\[
H(P_0)-H(P_1)>0
\Rightarrow
\operatorname{AmbiguityReduced}(P_0,P_1)=1
\]

ただし、真候補の包含は含意しない。

**命題9.4 品質閾値は採用条件である。**

\[
Q_t(K,p)<\theta_p
\Rightarrow
\operatorname{Decision}_{t,p}(K)\neq\operatorname{accept}
\]

**定理9.1 確率層非補修定理。**  
候補生成が真候補を含まない場合、Gibbs分布、MAP、エントロピー、品質スコアは真候補を復元しない。

\[
K_{\operatorname{true}}\notin\mathcal{K}
\Rightarrow
K_{\operatorname{true}}\notin
\operatorname{support}(P)
\]

**定理9.2 低エントロピー非完全性定理。**  
エントロピーが低いことは、候補集合の完全性を含意しない。

\[
H(P)\le\epsilon
\centernot\Rightarrow
K_{\operatorname{true}}\in\mathcal{K}
\]

**定理9.3 安全意思決定の合成条件。**  
AMTが accept を返すためには、少なくとも posterior gap、entropy、quality、reputation、safety gate が目的別閾値を満たす必要がある。

\[
\operatorname{Accept}_{t,p}(K)
\Rightarrow
\Delta P\ge\gamma_p
\land
H(P)\le\eta_p
\land
Q_t(K,p)\ge\theta_p
\land
R_t(K)\ge r_p
\land
\operatorname{SafeGate}_{t,p}(K)=1
\]

---

## 9.18 実装アルゴリズム

意思決定の基本手順は次である。

```text
1. 有限候補クラス集合を受け取る
2. 候補ごとに prior, energy, quality, reputation, freshness, uncertainty を取得する
3. Gibbs分布を計算する
4. MAP候補と事後ギャップを計算する
5. エントロピーを計算する
6. 品質・評判・鮮度・不確実性ゲートを評価する
7. 目的別期待損失を計算する
8. accept / manual_review / unresolved / block の行動を選ぶ
9. Decision Certificate を出力する
10. PID発行は第7章・第8章の境界へ渡す
```

擬似コードは次である。

```text
decide(candidates, purpose):
  if candidates is empty:
    return DC(unresolved, reason = no-candidates)

  posterior = gibbs(candidates.energy, candidates.prior, purpose.temperature)
  entropy = H(posterior)
  top, second = top2(posterior)
  gap = posterior[top] - posterior[second]

  if entropy > purpose.maxEntropy:
    return DC(manual_review, reason = entropy-above-threshold)

  if gap < purpose.minPosteriorGap:
    return DC(manual_review, reason = posterior-gap-below-threshold)

  if quality(top) < purpose.minQuality:
    return DC(manual_review, reason = quality-below-threshold)

  if reputation(top) < purpose.minReputation:
    return DC(manual_review, reason = reputation-below-threshold)

  if freshness(top) < purpose.minFreshness:
    return DC(unresolved, reason = freshness-below-threshold)

  if uncertainty(top) > purpose.maxUncertainty:
    return DC(manual_review, reason = uncertainty-above-threshold)

  return DC(accept, selected = top)
```

---

## 9.19 実装フック

本章に対応する実装・検証フックは次である。

- Gibbs posterior fixture
- MAP selection fixture
- entropy fixture
- ambiguity reduction fixture
- quality threshold fixture
- reputation update fixture
- purpose-relative loss fixture
- posterior gap fixture
- low entropy non-completeness counterexample
- high quality non-PID counterexample
- decision certificate fixture
- probability cannot repair missing candidate fixture

最低限のfixtureは次である。

| fixture | expected result | purpose |
| --- | --- | --- |
| clear-low-energy-candidate | accept | Gibbs/MAP基本形 |
| near-posterior-tie | manual_review | 事後ギャップ |
| high-entropy-distribution | manual_review | エントロピー |
| low-quality-map | manual_review | 品質閾値 |
| low-reputation-source | manual_review | 評判 |
| stale-source | unresolved | 鮮度 |
| missing-true-candidate | non-repair | 確率層非補修 |
| entropy-reduction-after-evidence | positive delta H | 曖昧性削減 |
| reputation-success-update | reputation increases | 評判更新 |
| reputation-failure-update | reputation decreases | 評判更新 |

---

## 9.20 後半補強: 反事実評価と失敗時挙動

本章の弱点は、Gibbs posterior、MAP、品質スコア、評判を導入すると、読者が「高スコアなら正しい」と誤読しやすい点である。AMTでは、確率層は解決層ではなく、行動選択層である。したがって、評価対象は「真の住所を常に選んだか」だけではなく、「不確実なときに止まれたか」でなければならない。

候補集合 \(C\)、観測 \(x\)、目的 \(p\)、行動集合

\[
\mathcal{A}=\{
\mathrm{accept},
\mathrm{manualReview},
\mathrm{unresolved},
\mathrm{block}
\}
\]

を置く。意思決定は

\[
d_p(x,C)\in\mathcal{A}
\]

であり、候補そのものではなく行動を返す。

損失関数を次で分ける。

\[
L_p(a,c^\*)=
L_{\mathrm{wrong}}+
L_{\mathrm{delay}}+
L_{\mathrm{privacy}}+
L_{\mathrm{operational}}
\]

特に、誤配送や誤PID発行の損失は、手動確認の遅延損失より大きく置く。

\[
L_p(\mathrm{wrongAccept}) \gg L_p(\mathrm{manualReview})
\]

この不等式があるため、AMTは曖昧な候補で無理にacceptしない。

反事実評価では、次を検証する。

\[
\operatorname{Counterfactual}(x,C,E^+)
\]

ここで \(E^+\) は追加証拠である。証拠追加前後で、

\[
H(P(C\mid x)) - H(P(C\mid x,E^+)) > 0
\]

なら曖昧性が減っている。ただし、曖昧性が減ってもPID発行が許されるとは限らない。

本章の追加評価指標は次である。

| metric | definition | reason |
| --- | --- | --- |
| abstention precision | stopped cases that were truly unsafe | 止める品質 |
| unsafe accept rate | accepted cases later contradicted | 最重要リスク |
| evidence sensitivity | decision changes after admissible evidence | 証拠反応性 |
| entropy calibration | high entropy predicts review/unresolved | 不確実性校正 |
| reputation recovery | good new evidence can repair low reputation gradually | 永久罰の回避 |
| purpose-loss alignment | high-risk purpose causes stricter decision | 目的相対性 |

失敗時挙動は、次の順でなければならない。

```text
missing true candidate
  -> unresolved

near posterior tie
  -> manual_review

high posterior but low source coverage
  -> manual_review or unresolved

high quality but unsafe public projection
  -> block

stale evidence for current delivery
  -> unresolved

high reputation source with contradictory evidence
  -> manual_review
```

この補強により、第9章は単なるスコアリング章ではなく、「誤って進むより安全に止まる」ための意思決定章になる。

---

## 9.21 非主張

本章は、確率が真理であるとは主張しない。

本章は、MAP候補が正しい住所対象であるとは主張しない。

本章は、低エントロピーが候補生成完全性を意味すると主張しない。

本章は、品質スコアがPID発行を許すと主張しない。

本章は、評判が高い出典が常に正しいと主張しない。

本章は、Bayesian/Gibbs/MAP層が第5章の候補生成、第7章の安全解決、第8章の履歴保存、第11章のプライバシー境界を置き換えると主張しない。

---

## 9.22 まとめ

本章では、候補集合上の確率分布、Gibbs/MAP意思決定、エントロピー、曖昧性削減、品質スコア、評判更新、目的別期待損失、意思決定証明書を定義した。

第7章が「安全に解決するか、止めるか」を扱い、第8章が「解決された参照が時間の中でどう保存されるか」を扱うなら、第9章は「不確実性の中でどの行動を取るべきか」を扱う。

本章の最重要分離は次である。

```text
high posterior
  != truth
  != safe resolution
  != PID issuance
  != ZK proof
```

そして、本章の中核は次である。

```text
Probability + Quality + Reputation + Entropy + Purpose Loss
  -> Decision Certificate
  -> Safety Gates
  -> Accept / Review / Unresolved / Block
```

住所写像論は、曖昧性を消したふりをしない。曖昧性を測り、圧縮し、証拠で減らし、それでも残る不確実性に応じて安全な行動を選ぶ。
