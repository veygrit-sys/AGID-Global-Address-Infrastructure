# 住所写像論 日本語版 v1 付録H 数理モデル・公理・定義・命題・補題・定理・系総覧

位置づけ: 本付録は、住所写像論に現れる数理モデル、論文上の公理、定義、命題、補題、定理、系を一か所に集約する。本文では直観と応用を優先し、本付録では数式、記号、検証状態、証明責任を明示する。

注意: ここでいう「公理」はLeanに未証明公理として追加されたものではない。論文上の設計前提、観測前提、またはモデル化前提である。Lean形式化済みの主張、実装テストで支持される主張、GISまたはデータ検証で支持される主張、概念整理として残す主張を明確に分ける。

本付録をLaTeX本文へ移す場合は、次のような定理環境を用いる。

```latex
\newtheorem{axiom}{Axiom}[section]
\newtheorem{definition}{Definition}[section]
\newtheorem{proposition}{Proposition}[section]
\newtheorem{lemma}{Lemma}[section]
\newtheorem{theorem}{Theorem}[section]
\newtheorem{corollary}{Corollary}[section]
\newtheorem{counterexample}{Counterexample}[section]
\numberwithin{equation}{section}
```

## H.1 検証状態の分類

| 状態 | 意味 |
| --- | --- |
| Lean形式化済み | `formal/AMTCore.lean` または `formal/AMTPaperExtensions.lean` に対応する定義・定理がある。 |
| 実装検証済み | TypeScript等のテストで、アルゴリズム挙動または安全ゲートが確認されている。 |
| GIS検証済み | GIS検証、地理出典、警告予算、検証証明書により支持される。 |
| データ検証済み | 郵便ソース、住所形式、公式またはオープンソース登録で支持される。 |
| 概念整理 | 論文上の枠組みとして有用だが、証明済みとは書かない。 |
| 今後検証 | 実験、形式化、データセット拡張、または外部監査が必要である。 |
| 別論文 | AGID、AOID、ZKP、credentialなど、AMT本体とは責任範囲が異なる。 |

## H.2 基本記号

以下では時点または版を \(t\)、文脈を \(\chi\)、入力された表面住所表現を \(u\) とする。文脈 \(\chi\) は、配送、行政、消防、不動産、自然地理検索、災害支援、秘匿証明などの目的を含む。

| 記号 | 意味 |
| --- | --- |
| \(W_t\) | 時点 \(t\) の住所可能世界状態 |
| \(X_t\) | 時点 \(t\) の住所可能実体集合 |
| \(S_t\) | 表面住所表現集合 |
| \(Y_{\chi,t}\) | 文脈 \(\chi\) における観測空間 |
| \(N_{\ell,t}\) | 言語または正規化方針 \(\ell\) による正規化表現空間 |
| \(O_{\chi,t}:X_t\to Y_{\chi,t}\) | 実体から観測への写像 |
| \(\nu_{\ell,t}:S_t\to N_{\ell,t}\) | 表面表現から正規化表現への写像 |
| \(\Gamma_{\chi,t}:S_t\to\mathcal{P}_{\mathrm{fin}}(X_t)\) | 候補生成写像 |
| \(D_{\chi,t}:X_t\times X_t\to\mathbb{R}_{\ge 0}\) | 文脈依存の構造的非類似度 |
| \(\Pi_{\delta,\chi,t}\) | しきい値 \(\delta\) によるクラスタ分割 |
| \(\kappa_{\delta,\chi,t}:X_t\to\Pi_{\delta,\chi,t}\) | クラスタ射影 |
| \(E_{\chi,t}(K;u)\) | クラスタ \(K\) の評価値またはエネルギー |
| \(Q_{\chi,t}(K)\) | 内部品質スコア |
| \(F_t(K)\) | 鮮度または証拠年齢 |
| \(R_{\chi,t}(K)\) | リスクスコア |
| \(\operatorname{Out}_{\chi,t}(u)\) | 解決結果 |
| \(\psi_t\) | PID発行写像 |
| \(L_t=(V_t,E_t)\) | 住所履歴グラフ |
| \(\operatorname{comp}:X\to C\) | 住所圧縮写像 |
| \(\operatorname{Rep}_t(x)\) | 実体 \(x\) の履歴・評判スコア |

## H.3 数理モデル総覧

### H.3.1 世界状態モデル

住所写像論では、住所は固定された文字列ではなく、時点 \(t\) に依存する世界状態から観測される。

\[
W_t=(G_t,A_t,Soc_t,Src_t,L_t,Pol_t)
\tag{H-M1}
\]

ここで \(G_t\) は地理形状、\(A_t\) は行政構造、\(Soc_t\) は社会的・制度的状態、\(Src_t\) は利用可能な出典集合、\(L_t\) は履歴グラフ、\(Pol_t\) は運用ポリシーである。

検証状態: 概念整理。GIS、郵便ソース、住所形式データ、履歴モデルによって部分的に支持される。

### H.3.2 住所可能実体集合

住所可能実体集合は、住宅だけではなく、建物、部屋、道路、橋、島、湖、川、滝、砂漠、湿地、氷原、遺跡、世界遺産、避難所、宅配ロッカー、3次元区画などを含み得る。

\[
X_t =
X_t^{\mathrm{built}}
\cup X_t^{\mathrm{admin}}
\cup X_t^{\mathrm{natural}}
\cup X_t^{\mathrm{cultural}}
\cup X_t^{\mathrm{social}}
\cup X_t^{\mathrm{virtual}}
\tag{H-M2}
\]

ただし、各部分集合の完全性は出典依存である。したがって \(X_t^{\mathrm{natural}}\) に「世界中の全島名」を含めるという主張は、データソースが登録され、検証予算内で確認された範囲に限定される。

検証状態: 概念整理、GIS検証済み、実装検証済み。全世界完全性は未主張。

### H.3.3 表面表現・正規化・観測モデル

表面住所表現は、人間が入力する文字列、郵便番号、地物名、旧住所、座標、Plus Codes、AGID、AOID参照などを含む。

\[
u\in S_t
\tag{H-M3}
\]

言語・表記・大文字小文字・旧字体・翻字を処理するため、正規化写像を置く。

\[
\nu_{\ell,t}:S_t\longrightarrow N_{\ell,t}
\tag{H-M4}
\]

正規化は検索能力を高めるが、一般には情報を失う。すなわち、

\[
\exists u_1,u_2\in S_t,\quad
u_1\ne u_2\land \nu_{\ell,t}(u_1)=\nu_{\ell,t}(u_2)
\tag{H-M5}
\]

が起こり得る。

検証状態: Lean形式化済み。対応定理は `normalization_collision_prevents_perfect_resolution`。

### H.3.4 観測写像と非単射性

実体から観測への写像を次で表す。

\[
O_{\chi,t}:X_t\longrightarrow Y_{\chi,t}
\tag{H-M6}
\]

AMTは \(O_{\chi,t}\) の単射性を仮定しない。むしろ、住所理論の中核は次の非単射状況を正面から扱うことである。

\[
\exists x_1,x_2\in X_t,\quad
x_1\ne x_2\land O_{\chi,t}(x_1)=O_{\chi,t}(x_2)
\tag{H-M7}
\]

検証状態: Lean形式化済み。対応定理は `no_condition_free_perfect_resolver`。

### H.3.5 候補生成写像

入力 \(u\) から有限候補集合を生成する。

\[
\Gamma_{\chi,t}:S_t\longrightarrow \mathcal{P}_{\mathrm{fin}}(X_t),
\qquad
C_{\chi,t}(u)=\Gamma_{\chi,t}(u)
\tag{H-M8}
\]

候補完全性は次で定義される。

\[
\operatorname{CandidateComplete}(O,\Gamma)
\Longleftrightarrow
\forall x\in X_t,\quad x\in \Gamma(O(x))
\tag{H-M9}
\]

候補集合から真候補が欠落していれば、後段のスコアリング、クラスタリング、PID発行は真候補を回復できない。

検証状態: Lean形式化済み。対応定義は `CandidateComplete`、対応定理は `missing_entity_refutes_candidate_completeness`。

### H.3.6 構造的非類似度

候補間の差は、単純な距離ではなく、文脈依存の有向コストとして扱う。

\[
\begin{aligned}
D_{\chi,t}(a,b)=&
\lambda_g d_g(a,b)
+\lambda_a d_a(a,b)
+\lambda_\ell d_\ell(a,b)\\
&+\lambda_y d_y(a,b)
+\lambda_v d_v(a,b)
+\lambda_h d_h(a,b)
+\lambda_s d_s(a,b)
+\lambda_r d_r(a,b).
\end{aligned}
\tag{H-M10}
\]

各項は、地理距離 \(d_g\)、行政階層差 \(d_a\)、言語表記差 \(d_\ell\)、対象種別差 \(d_y\)、垂直参照差 \(d_v\)、履歴差 \(d_h\)、出典差 \(d_s\)、リスク差 \(d_r\) を表す。

一般に、

\[
D_{\chi,t}(a,b)\ne D_{\chi,t}(b,a)
\tag{H-M11}
\]

であり、これは距離空間の距離ではなく、有向非類似度または有向コストである。

検証状態: Lean形式化済み。対応定義は `SymmetricDissimilarity`、対応定理は `asymmetric_dissimilarity_not_symmetric`。

### H.3.7 クラスタ分割と参照同値

しきい値 \(\delta\) の下で、候補を参照クラスタへまとめる。対称化された近さを使う場合は、例えば次の関係を置ける。

\[
a\sim_{\delta,\chi,t} b
\Longleftrightarrow
D_{\chi,t}(a,b)\le\delta
\land
D_{\chi,t}(b,a)\le\delta
\land
\neg\operatorname{Conflict}_{\chi,t}(a,b)
\tag{H-M12}
\]

クラスタ分割は

\[
\Pi_{\delta,\chi,t}=X_t/{\sim_{\delta,\chi,t}},
\qquad
\kappa_{\delta,\chi,t}:X_t\to \Pi_{\delta,\chi,t}
\tag{H-M13}
\]

で表す。

ただし、運用クラスタ \(\sim_{\delta,\chi,t}\) は真の参照同値 \(\sim_{\mathrm{ref}}\) の近似である。真の参照同値は、参照写像 \(\operatorname{ref}:S_t\to X_t\) によって次のように定義される。

\[
u_1\sim_{\mathrm{ref}}u_2
\Longleftrightarrow
\operatorname{ref}(u_1)=\operatorname{ref}(u_2)
\tag{H-M14}
\]

検証状態: Lean形式化済み。対応定義は `RefEquivalent`、`SameReferenceClass`。

### H.3.8 評価関数と安全選択条件

候補クラスタ \(K\in\Pi_{\delta,\chi,t}\) の評価値を置く。

\[
E_{\chi,t}(K;u)
=
\alpha_E E^{\mathrm{text}}_{\chi,t}(K;u)
+\alpha_G E^{\mathrm{geo}}_{\chi,t}(K)
+\alpha_H E^{\mathrm{hist}}_{t}(K)
+\alpha_Q(1-Q_{\chi,t}(K))
+\alpha_R R_{\chi,t}(K)
\tag{H-M15}
\]

最良候補を \(K_1\)、二番目の候補を \(K_2\) とする。低いエネルギーがよい場合、安全選択条件は次で表せる。

\[
E_{\chi,t}(K_1;u)\le \tau_E
\land
E_{\chi,t}(K_1;u)+\Delta\le E_{\chi,t}(K_2;u)
\tag{H-M16}
\]

Lean側の簡約形は

\[
\operatorname{ScoreSelectable}(e_1,e_2,\tau,\Delta)
\Longleftrightarrow
e_1\le \tau\land e_1+\Delta\le e_2
\tag{H-M17}
\]

である。

検証状態: Lean形式化済み。対応定義は `ScoreSelectable`。

### H.3.9 解決結果型

AMTの解決結果は、単に「解けた」だけではない。安全な非発行状態を含む。

\[
\operatorname{Out}_{\chi,t}(u)\in
\left\{
\operatorname{resolved}(K),
\operatorname{ambiguous},
\operatorname{unresolved},
\operatorname{rejected},
\operatorname{conditional}
\right\}
\tag{H-M18}
\]

Lean形式化では、主要4状態を次のように扱う。

\[
\operatorname{ResolutionOutcome}(X)
=
\operatorname{resolved}(x)
\mid
\operatorname{ambiguous}
\mid
\operatorname{unresolved}
\mid
\operatorname{rejected}
\tag{H-M19}
\]

検証状態: Lean形式化済み、実装検証済み。

### H.3.10 PID発行許容述語

PID発行は、候補、スコア、品質、鮮度、リスクを通過した場合にのみ許される。

\[
\begin{aligned}
&\operatorname{IssueAdmissible}
(C,e,e_1,e_2,\tau_E,\Delta,q,\tau_Q,f,\tau_F,r,\tau_R)\\
\Longleftrightarrow\;&
e\in C
\land e_1\le \tau_E
\land e_1+\Delta\le e_2\\
&\land \tau_Q\le q
\land f\le \tau_F
\land r\le \tau_R .
\end{aligned}
\tag{H-M20}
\]

この式は「真実体を証明する」ものではなく、「宣言された発行ゲートを通過した」ことを表す。

検証状態: Lean形式化済み。対応定義は `IssueAdmissible`。

### H.3.11 PID写像

参照同値類に対してPIDを与える理想写像を置く。

\[
\psi_t:X_t/{\sim_{\mathrm{ref}}}\longrightarrow \mathsf{PID}_t
\tag{H-M21}
\]

理想的に \(\psi_t\) が単射ならば、

\[
\psi_t([x])=\psi_t([y])\Longrightarrow [x]=[y]
\tag{H-M22}
\]

が成立する。ただし、実装上のハッシュ化PIDでは、有限ビット長に伴う衝突リスク評価が別途必要である。

検証状態: Lean形式化済み。対応定理は `injective_pid_has_no_collision`。有限ハッシュ衝突は実装検証対象。

### H.3.12 履歴グラフ

住所履歴は単一関数ではなく、有向グラフとして扱う。

\[
L_t=(V_t,E_t),
\qquad
E_t\subseteq V_t\times V_t\times \mathcal{K}
\tag{H-M23}
\]

\(\mathcal{K}\) は、改称、分裂、統合、廃止、再割当、不明、後継などの遷移種別である。

append-only拡張を次で定義する。

\[
L_t\preceq L_{t+1}
\Longleftrightarrow
V_t\subseteq V_{t+1}
\land
E_t\subseteq E_{t+1}
\tag{H-M24}
\]

検証状態: Lean形式化済み。対応定義は `LineageGraph`、`LineageExtends`。

### H.3.13 住所圧縮モデル

住所は、巨大な実体空間を人間可読な表現へ圧縮する写像として扱える。

\[
\operatorname{comp}:X\longrightarrow C
\tag{H-M25}
\]

もし

\[
\exists x_1,x_2\in X,\quad
x_1\ne x_2\land
\operatorname{comp}(x_1)=\operatorname{comp}(x_2)
\tag{H-M26}
\]

なら、コードだけから完全復元するデコーダ

\[
\exists d:C\to X,\quad
\forall x\in X,\ d(\operatorname{comp}(x))=x
\tag{H-M27}
\]

は存在しない。

検証状態: Lean形式化済み。対応定理は `noninjective_compression_no_perfect_decoder`。

### H.3.14 住所エントロピーと識別ビット数

有限候補集合 \(C(u)=\{x_1,\ldots,x_n\}\) と事後確率 \(p_i\) に対し、残余不確実性を次で測る。

\[
H_{\chi,t}(u)
=
-\sum_{i=1}^{n}p_i\log_2 p_i
\tag{H-M28}
\]

一様候補の場合は

\[
H_{\chi,t}(u)=\log_2 n
\tag{H-M29}
\]

である。また、\(N\) 個の対象を固定長コードで一意識別するには、少なくとも

\[
b\ge \lceil\log_2 N\rceil
\tag{H-M30}
\]

ビットが必要である。Leanでは容量を

\[
\operatorname{BitCapacity}(b)=2^b,
\qquad
\operatorname{CapacityCovers}(N,b)\Longleftrightarrow N\le 2^b
\tag{H-M31}
\]

として扱う。

検証状態: Lean形式化済み、実験仮説として拡張可能。対応定義は `BitCapacity`、`CapacityCovers`。

### H.3.15 品質スコアと内部制御

国、言語、都市・田舎・島、自然地理、公式ソース有無を考慮した内部品質スコアを

\[
Q_{\chi,t}(K)
=
w_s S_t(K)
+w_g G_t(K)
+w_\ell L_t(K)
+w_f F_t(K)
+w_c C_t(K)
+w_r(1-R_t(K))
\tag{H-M32}
\]

と置ける。ここで \(S_t\) は出典信頼性、\(G_t\) は地理整合性、\(L_t\) は言語・表記整合性、\(F_t\) は鮮度、\(C_t\) は候補被覆、\(R_t\) はリスクである。

品質スコアはユーザーへそのまま表示する真理値ではない。内部的に非表示、注意表示、再検証、PID非発行を制御する信号である。

検証状態: 実装検証済み。Leanでは低品質非発行の抽象ゲートを形式化済み。

### H.3.16 評判モデル

配送履歴や到達履歴を持つ場合、評判スコアは例えば次で表せる。

\[
\operatorname{Rep}_t(x)
=
\sigma\left(
\beta_0
+\beta_s S_t^{\mathrm{succ}}(x)
-\beta_f S_t^{\mathrm{fail}}(x)
-\beta_r S_t^{\mathrm{return}}(x)
+\beta_a S_t^{\mathrm{audit}}(x)
\right)
\tag{H-M33}
\]

ここで \(\sigma(z)=1/(1+e^{-z})\) はシグモイド関数である。Leanの簡約形では、正の証拠項を

\[
\operatorname{ReputationEvidenceScore}(p,w,n)=p+wn
\tag{H-M34}
\]

とし、成功証拠数が増えて失敗証拠が固定なら正の証拠項は減少しないことを示す。

検証状態: Lean形式化済み、実装検証済み。生産モデルは統計校正が必要。

### H.3.17 GIS検証証明書モデル

GIS検証は世界の地理的真理をLeanで直接証明するものではない。GISソフトが証明書を出し、Leanはその証明書が受理条件を満たす場合に限定結論を出す。

\[
\mathcal{G}=
(n_{\mathrm{feature}},n_{\mathrm{error}},n_{\mathrm{warning}},
B_{\mathrm{error}},B_{\mathrm{warning}},
n_{\mathrm{source}},B_{\mathrm{feature}},B_{\mathrm{source}})
\tag{H-M35}
\]

受理条件は

\[
n_{\mathrm{error}}\le B_{\mathrm{error}}
\land
n_{\mathrm{warning}}\le B_{\mathrm{warning}}
\land
B_{\mathrm{error}}=0
\land
B_{\mathrm{feature}}\le n_{\mathrm{feature}}
\land
B_{\mathrm{source}}\le n_{\mathrm{source}}
\tag{H-M36}
\]

である。このとき

\[
n_{\mathrm{error}}=0
\tag{H-M37}
\]

が従う。

検証状態: Lean形式化済み、GIS検証済み。対応定理は `accepted_gis_certificate_has_no_errors`。

## H.4 論文上の公理・設計前提

### Axiom H-A1: 時点依存公理

\[
W_t\ne W_{t+1}
\quad\text{が起こり得る。}
\tag{H-A1}
\]

住所可能世界は時点 \(t\) に依存する。地理、行政、出典、配送制約、建物、自然地理名、社会的実体は変化し得る。

状態: 概念整理。

### Axiom H-A2: 住所可能性公理

\[
X_t\supseteq
X_t^{\mathrm{built}}
\cup X_t^{\mathrm{natural}}
\cup X_t^{\mathrm{cultural}}
\cup X_t^{\mathrm{social}}
\tag{H-A2}
\]

住所は住宅だけでなく、道路、橋、山、川、湖、島、滝、湿地、氷河、洞窟、谷、遺跡、世界遺産、避難所、配送拠点などを参照し得る。

状態: GIS検証済み、実装検証済み。ただし出典範囲を超える完全性は主張しない。

### Axiom H-A3: 非単射観測公理

\[
\exists x_1,x_2\in X_t,\quad
x_1\ne x_2\land O_{\chi,t}(x_1)=O_{\chi,t}(x_2)
\tag{H-A3}
\]

異なる実体が同じ観測へ写る場合がある。

状態: Lean形式化済み。

### Axiom H-A4: 候補被覆前提

\[
x^\ast\notin \Gamma_{\chi,t}(u)
\Longrightarrow
\text{後段の候補内選択器は }x^\ast\text{ を選べない。}
\tag{H-A4}
\]

真候補が候補集合に入らない場合、クラスタリングやスコアリングで回復できない。

状態: Lean形式化済み。

### Axiom H-A5: 安全保留公理

\[
\neg\operatorname{IssueAdmissible}(\cdots)
\Longrightarrow
\operatorname{Out}_{\chi,t}(u)\in
\{\operatorname{ambiguous},\operatorname{unresolved},\operatorname{rejected},\operatorname{conditional}\}
\tag{H-A5}
\]

証拠不足、複数候補、ポリシー違反、高リスクでは、resolvedではなく保留状態を返す。

状態: Lean形式化済み、実装検証済み。

### Axiom H-A6: 履歴グラフ前提

\[
L_t=(V_t,E_t),\qquad E_t\subseteq V_t\times V_t\times\mathcal{K}
\tag{H-A6}
\]

住所変更は単一関数ではなく、改称、分裂、統合、廃止、再割当、不明を含む履歴グラフで扱う。

状態: Lean形式化済み、実装検証済み。

### Axiom H-A7: 文脈依存公理

\[
\chi_1\ne\chi_2
\Longrightarrow
U_{\chi_1}\ne U_{\chi_2}
\quad\text{が起こり得る。}
\tag{H-A7}
\]

住所の最適性は、文脈、目的、粒度、リスク許容度に依存する。

状態: Lean形式化済み。

### Axiom H-A8: 品質制御公理

\[
Q_{\chi,t}(K)<\tau_Q
\Longrightarrow
\text{自動確定またはPID発行を止める。}
\tag{H-A8}
\]

品質、鮮度、リスクはPID発行と自動解決を制御する内部信号である。

状態: Lean形式化済み、実装検証済み。

### Axiom H-A9: 出典境界公理

\[
\operatorname{SourceVerified}(s)=\mathrm{false}
\Longrightarrow
s\text{ から検証済み住所主張を導かない。}
\tag{H-A9}
\]

出典範囲を超えた完全性は主張しない。未検証対象はunresolvedまたは再検証対象にする。

状態: Lean形式化済み、データ検証済み、GIS検証済み。

### Axiom H-A10: 意味論と暗号の分離公理

\[
\operatorname{AMT}\not\Rightarrow \operatorname{ZKPrivacy}
\tag{H-A10}
\]

AMTは住所意味論を与える。ZKP、credential、issuer trust、revocation、freshness、nullifier、domain separationは別論文で扱う。

状態: 概念整理、別論文。

## H.5 定義総覧

### Definition H-D1: CorrectFor

\[
\operatorname{CorrectFor}(O,R,x)
\Longleftrightarrow
R(O(x))=x
\tag{H-D1}
\]

観測写像 \(O\) と解決器 \(R\) に対し、実体 \(x\) が正しく解決されることを表す。

Lean名: `CorrectFor`。

### Definition H-D2: CandidateComplete

\[
\operatorname{CandidateComplete}(O,\Gamma)
\Longleftrightarrow
\forall x,\ x\in \Gamma(O(x))
\tag{H-D2}
\]

すべての実体が、自分自身の観測から生成される候補集合に含まれること。

Lean名: `CandidateComplete`。

### Definition H-D3: CandidateSound

\[
\operatorname{CandidateSound}(\Gamma,R)
\Longleftrightarrow
\forall y,\ R(y)\in\Gamma(y)
\tag{H-D3}
\]

解決器が出す結果が、その観測に対して生成された候補集合に属すること。

Lean名: `CandidateSound`。

### Definition H-D4: ResolutionOutcome

\[
\operatorname{ResolutionOutcome}(X)=
\operatorname{resolved}(x)
\mid
\operatorname{ambiguous}
\mid
\operatorname{unresolved}
\mid
\operatorname{rejected}
\tag{H-D4}
\]

住所解決は、発行状態と非発行状態を区別する。

Lean名: `ResolutionOutcome`。

### Definition H-D5: ResolvesEntity

\[
\operatorname{ResolvesEntity}(x,\operatorname{resolved}(y))
\Longleftrightarrow
y=x
\tag{H-D5a}
\]

\[
\operatorname{ResolvesEntity}(x,\operatorname{ambiguous})
=
\operatorname{ResolvesEntity}(x,\operatorname{unresolved})
=
\operatorname{ResolvesEntity}(x,\operatorname{rejected})
=\bot
\tag{H-D5b}
\]

Lean名: `ResolvesEntity`。

### Definition H-D6: Abstains

\[
\operatorname{Abstains}(o)
\Longleftrightarrow
o\in\{\operatorname{ambiguous},\operatorname{unresolved},\operatorname{rejected}\}
\tag{H-D6}
\]

Lean名: `Abstains`。

### Definition H-D7: EmitsFalseEntity

\[
\operatorname{EmitsFalseEntity}(x^\ast,\operatorname{resolved}(y))
\Longleftrightarrow
y\ne x^\ast
\tag{H-D7}
\]

非発行状態では偽実体を発行しない。

Lean名: `EmitsFalseEntity`。

### Definition H-D8: OutcomeCandidateSound

\[
\operatorname{OutcomeCandidateSound}(\Gamma,Y)
\Longleftrightarrow
\forall y,x,\ Y(y)=\operatorname{resolved}(x)\Rightarrow x\in\Gamma(y)
\tag{H-D8}
\]

Lean名: `OutcomeCandidateSound`。

### Definition H-D9: ScoreSelectable

\[
\operatorname{ScoreSelectable}(e_1,e_2,\tau,\Delta)
\Longleftrightarrow
e_1\le\tau\land e_1+\Delta\le e_2
\tag{H-D9}
\]

Lean名: `ScoreSelectable`。

### Definition H-D10: IssueAdmissible

\[
\begin{aligned}
\operatorname{IssueAdmissible}
\Longleftrightarrow\;&
e\in C
\land \operatorname{ScoreSelectable}(e_1,e_2,\tau_E,\Delta)\\
&\land \tau_Q\le q
\land f\le \tau_F
\land r\le\tau_R .
\end{aligned}
\tag{H-D10}
\]

Lean名: `IssueAdmissible`。

### Definition H-D11: SymmetricDissimilarity

\[
\operatorname{SymmetricDissimilarity}(D)
\Longleftrightarrow
\forall a,b,\ D(a,b)=D(b,a)
\tag{H-D11}
\]

AMTの構造的非類似度は、一般にはこの条件を満たさない。

Lean名: `SymmetricDissimilarity`。

### Definition H-D12: RepresentsSplit

\[
\operatorname{RepresentsSplit}(f,s,a,b)
\Longleftrightarrow
f(s)=a\land f(s)=b\land a\ne b
\tag{H-D12}
\]

単一関数 \(f\) が一つの過去状態 \(s\) から二つの異なる未来状態 \(a,b\) への分裂を表す、という不可能な条件を表す。

Lean名: `RepresentsSplit`。

### Definition H-D13: CoversRequiredAttributes

\[
\operatorname{CoversRequiredAttributes}(H,R)
\Longleftrightarrow
\forall a,\ R(a)\Rightarrow H(a)
\tag{H-D13}
\]

秘密credentialが用途に必要な属性を持つこと。ZKP論文との接続点だが、AMT本体では意味論的述語として扱う。

Lean名: `CoversRequiredAttributes`。

### Definition H-D14: RefEquivalent

\[
\operatorname{RefEquivalent}(\operatorname{ref},u,v)
\Longleftrightarrow
\operatorname{ref}(u)=\operatorname{ref}(v)
\tag{H-D14}
\]

Lean名: `RefEquivalent`。

### Definition H-D15: SameReferenceClass

\[
\operatorname{SameReferenceClass}(\operatorname{ref},u,v)
\Longleftrightarrow
\forall z,\
\operatorname{RefEquivalent}(\operatorname{ref},z,u)
\Leftrightarrow
\operatorname{RefEquivalent}(\operatorname{ref},z,v)
\tag{H-D15}
\]

Lean名: `SameReferenceClass`。

### Definition H-D16: BitCapacity

\[
\operatorname{BitCapacity}(b)=2^b
\tag{H-D16}
\]

Lean名: `BitCapacity`。

### Definition H-D17: CapacityCovers

\[
\operatorname{CapacityCovers}(N,b)
\Longleftrightarrow
N\le 2^b
\tag{H-D17}
\]

Lean名: `CapacityCovers`。

### Definition H-D18: CandidateResidualZero

\[
\operatorname{CandidateResidualZero}(n)
\Longleftrightarrow
n\le 1
\tag{H-D18}
\]

候補数が2以上なら、候補集合だけを見る限り残余不確実性が残る。

Lean名: `CandidateResidualZero`。

### Definition H-D19: AbsoluteForTwoContexts

\[
\operatorname{AbsoluteForTwoContexts}(a,a_1,a_2)
\Longleftrightarrow
a=a_1\land a=a_2
\tag{H-D19}
\]

二つの文脈に同時に絶対最適な住所表現を表す。

Lean名: `AbsoluteForTwoContexts`。

### Definition H-D20: LineageGraph

\[
L=(V,E),\qquad V:\operatorname{Node}\to\operatorname{Prop},\quad
E:\operatorname{Node}\times\operatorname{Node}\to\operatorname{Prop}
\tag{H-D20}
\]

Lean名: `LineageGraph`。

### Definition H-D21: LineageExtends

\[
\operatorname{LineageExtends}(L,L')
\Longleftrightarrow
\left(\forall v,\ V_L(v)\Rightarrow V_{L'}(v)\right)
\land
\left(\forall a,b,\ E_L(a,b)\Rightarrow E_{L'}(a,b)\right)
\tag{H-D21}
\]

Lean名: `LineageExtends`。

### Definition H-D22: ReferencePreservingRename

\[
\operatorname{ReferencePreservingRename}(\operatorname{ref},\rho)
\Longleftrightarrow
\forall u,\ \operatorname{ref}(\rho(u))=\operatorname{ref}(u)
\tag{H-D22}
\]

Lean名: `ReferencePreservingRename`。

### Definition H-D23: ReputationEvidenceScore

\[
\operatorname{ReputationEvidenceScore}(p,w,n)=p+wn
\tag{H-D23}
\]

Lean名: `ReputationEvidenceScore`。

### Definition H-D24: GisValidationCertificate

\[
\mathcal{G}=
(n_f,n_e,n_w,B_e,B_w,n_s,B_f,B_s,g,s)
\tag{H-D24}
\]

ここで \(n_f\) は地物数、\(n_e\) はエラー数、\(n_w\) は警告数、\(B_e,B_w\) は予算、\(n_s\) は登録出典数、\(g,s\) は幾何検証と出典登録検証を表す。

Lean名: `GisValidationCertificate`。

### Definition H-D25: SourceValidation

\[
\operatorname{SourceValidation}
\in
\{\operatorname{accepted},\operatorname{unknown},\operatorname{rejected}\}
\tag{H-D25}
\]

Lean名: `SourceValidation`。

### Definition H-D26: ProofBundlePolicy

\[
\mathcal{P}_{\mathrm{bundle}}
=
(d,\sigma,n,\phi,\rho,i,c,m)
\tag{H-D26}
\]

domain separation、scope一致、nullifier再利用なし、fresh root、revocation root、issuer trust、粗い公開述語、秘密素材非公開を含む。これはAMT IIまたはZKP論文の範囲である。

Lean名: `ProofBundlePolicy`。状態: 別論文。

### Definition H-D27: OptimalInContext

\[
\operatorname{OptimalInContext}(\operatorname{cost},\chi,r)
\Longleftrightarrow
\forall r',\ \operatorname{cost}(\chi,r)\le \operatorname{cost}(\chi,r')
\tag{H-D27}
\]

Lean名: `OptimalInContext`。

### Definition H-D28: UniversallyOptimalForTwoContexts

\[
\operatorname{UniversallyOptimalForTwoContexts}(c,\chi_1,\chi_2,r)
\Longleftrightarrow
\operatorname{OptimalInContext}(c,\chi_1,r)
\land
\operatorname{OptimalInContext}(c,\chi_2,r)
\tag{H-D28}
\]

Lean名: `UniversallyOptimalForTwoContexts`。

## H.6 命題総覧

### Proposition H-P1: 候補健全性命題

\[
Y(y)=\operatorname{resolved}(x)
\Longrightarrow
x\in\Gamma(y)
\tag{H-P1}
\]

解決器が候補集合外の実体を発行しないこと。

状態: Lean形式化済み。Lean名: `outcome_candidate_soundness_yields_membership`。

### Proposition H-P2: 候補欠落非回復命題

\[
x^\ast\notin\Gamma(O(x^\ast))
\Longrightarrow
\neg\operatorname{CandidateComplete}(O,\Gamma)
\tag{H-P2}
\]

真候補が候補生成段階で欠落すると、候補内選択器では正しく解けない。

状態: Lean形式化済み。Lean名: `missing_entity_refutes_candidate_completeness`。

### Proposition H-P3: 低品質非発行命題

\[
q<\tau_Q
\Longrightarrow
\neg\operatorname{IssueAdmissible}(\cdots,q,\tau_Q,\cdots)
\tag{H-P3}
\]

品質がしきい値を下回る場合、PID発行または自動確定を止める。

状態: Lean形式化済み、実装検証済み。Lean名: `low_quality_prevents_issue`。

### Proposition H-P4: 出典拒否非検証命題

\[
\operatorname{SourceValidation}(s)\in\{\operatorname{unknown},\operatorname{rejected}\}
\Longrightarrow
\neg\operatorname{SourceVerified}(s)
\tag{H-P4}
\]

未検証または拒否された出典から検証済み住所主張を導かない。

状態: Lean形式化済み。Lean名: `unknown_source_prevents_verified_claim`, `rejected_source_prevents_verified_claim`。

### Proposition H-P5: 自然地理型依存命題

\[
x\in X_t^{\mathrm{natural}}
\Longrightarrow
\operatorname{repr}(x)\in
\{\operatorname{point},\operatorname{line},\operatorname{polygon},\operatorname{volume},\operatorname{graph},\operatorname{label}\}
\tag{H-P5}
\]

川、滝、湖、島、湿地、砂漠、氷原、洞窟、谷などは、単一住所文字列ではなく地物型に応じた表現を必要とする。

状態: GIS検証済み、実装検証済み。全世界完全性は未主張。

### Proposition H-P6: 文脈相対的最適性命題

\[
\operatorname{cost}(\chi_1,r_1)<\operatorname{cost}(\chi_1,r_2)
\Longrightarrow
\neg\operatorname{UniversallyOptimalForTwoContexts}(\operatorname{cost},\chi_1,\chi_2,r_2)
\tag{H-P6}
\]

ある文脈で別解が厳密に優れているなら、劣る解は二文脈で普遍最適にはなれない。

状態: Lean形式化済み。Lean名: `strictly_better_context_blocks_universal_optimum`。

### Proposition H-P7: 有限容量下限命題

\[
2^b<N
\Longrightarrow
\neg\operatorname{CapacityCovers}(N,b)
\tag{H-P7}
\]

固定長コードが持つ値の数が対象数より少なければ、そのコードだけで全対象を一意識別できない。

状態: Lean形式化済み。Lean名: `insufficient_bit_capacity_prevents_capacity_cover`。

### Proposition H-P8: 暗号拡張分離命題

\[
\operatorname{AMT\ Semantics}
\ne
\operatorname{ZK\ Protocol\ Security}
\tag{H-P8}
\]

AMTは住所由来属性の意味論を定義できるが、ゼロ知識性、知識健全性、issuer trust、revocation、nullifier安全性は別理論の責任である。

状態: 概念整理、別論文。

## H.7 補題総覧

### Lemma H-L1: 非単射観測補題

\[
O(a)=O(b)\land a\ne b
\Longrightarrow
\neg\left(
\operatorname{CorrectFor}(O,R,a)
\land
\operatorname{CorrectFor}(O,R,b)
\right)
\tag{H-L1}
\]

Lean名: `no_condition_free_perfect_resolver`。状態: Lean形式化済み。

### Lemma H-L2: 候補健全性所属補題

\[
\operatorname{CandidateSound}(\Gamma,R)
\Longrightarrow
R(y)\in\Gamma(y)
\tag{H-L2}
\]

Lean名: `candidate_soundness_yields_membership`。状態: Lean形式化済み。

### Lemma H-L3: 結果候補健全性所属補題

\[
\operatorname{OutcomeCandidateSound}(\Gamma,Y)
\land
Y(y)=\operatorname{resolved}(x)
\Longrightarrow
x\in\Gamma(y)
\tag{H-L3}
\]

Lean名: `outcome_candidate_soundness_yields_membership`。状態: Lean形式化済み。

### Lemma H-L4: ambiguous非解決補題

\[
\forall x,\ \neg\operatorname{ResolvesEntity}(x,\operatorname{ambiguous})
\tag{H-L4}
\]

Lean名: `ambiguous_resolves_no_entity`。状態: Lean形式化済み。

### Lemma H-L5: unresolved非解決補題

\[
\forall x,\ \neg\operatorname{ResolvesEntity}(x,\operatorname{unresolved})
\tag{H-L5}
\]

Lean名: `unresolved_resolves_no_entity`。状態: Lean形式化済み。

### Lemma H-L6: rejected非解決補題

\[
\forall x,\ \neg\operatorname{ResolvesEntity}(x,\operatorname{rejected})
\tag{H-L6}
\]

Lean名: `rejected_resolves_no_entity`。状態: Lean形式化済み。

### Lemma H-L7: 非発行状態は偽実体を出さない

\[
o\in\{\operatorname{ambiguous},\operatorname{unresolved},\operatorname{rejected}\}
\Longrightarrow
\neg\operatorname{EmitsFalseEntity}(x^\ast,o)
\tag{H-L7}
\]

Lean名: `ambiguous_emits_no_false_entity`, `unresolved_emits_no_false_entity`, `rejected_emits_no_false_entity`。状態: Lean形式化済み。

### Lemma H-L8: 候補選択所属補題

\[
\operatorname{chooseFirstCandidate}(C)=\operatorname{some}(x)
\Longrightarrow
x\in C
\tag{H-L8}
\]

Lean名: `chooseFirstCandidate_some_is_member`。状態: Lean形式化済み。

### Lemma H-L9: スコア選択しきい値補題

\[
\tau<e_1
\Longrightarrow
\neg\operatorname{ScoreSelectable}(e_1,e_2,\tau,\Delta)
\tag{H-L9}
\]

Lean名: `score_selection_requires_threshold`。状態: Lean形式化済み。

### Lemma H-L10: タイ証拠は選択を妨げる

\[
e_2<e_1+\Delta
\Longrightarrow
\neg\operatorname{ScoreSelectable}(e_1,e_2,\tau,\Delta)
\tag{H-L10}
\]

Lean名: `tied_evidence_prevents_score_selection`。状態: Lean形式化済み。

### Lemma H-L11: PID注入性補題

\[
\operatorname{Injective}(\psi)\land \psi(a)=\psi(b)
\Longrightarrow
a=b
\tag{H-L11}
\]

Lean名: `injective_pid_has_no_collision`。状態: Lean形式化済み。

### Lemma H-L12: 発行条件復元補題

\[
\operatorname{issueIfAdmissible}(\cdots)
=\operatorname{resolved}(y)
\Longrightarrow
\operatorname{IssueAdmissible}(\cdots)\land y=e
\tag{H-L12}
\]

Lean名: `issue_if_admissible_requires_conditions`。状態: Lean形式化済み。

### Lemma H-L13: 非許容時保留補題

\[
\neg\operatorname{IssueAdmissible}(\cdots)
\Longrightarrow
\operatorname{issueIfAdmissible}(\cdots)=\operatorname{unresolved}
\tag{H-L13}
\]

Lean名: `issue_if_not_admissible_abstains`。状態: Lean形式化済み。

### Lemma H-L14: 候補欠落非発行補題

\[
e\notin C
\Longrightarrow
\neg\operatorname{IssueAdmissible}(C,e,\cdots)
\tag{H-L14}
\]

Lean名: `missing_candidate_prevents_issue`。状態: Lean形式化済み。

### Lemma H-L15: 高エネルギー非発行補題

\[
\tau_E<e_1
\Longrightarrow
\neg\operatorname{IssueAdmissible}(\cdots,e_1,\cdots,\tau_E,\cdots)
\tag{H-L15}
\]

Lean名: `high_energy_prevents_issue`。状態: Lean形式化済み。

### Lemma H-L16: 低マージン非発行補題

\[
e_2<e_1+\Delta
\Longrightarrow
\neg\operatorname{IssueAdmissible}(\cdots,e_1,e_2,\cdots,\Delta,\cdots)
\tag{H-L16}
\]

Lean名: `low_margin_prevents_issue`。状態: Lean形式化済み。

### Lemma H-L17: 低品質非発行補題

\[
q<\tau_Q
\Longrightarrow
\neg\operatorname{IssueAdmissible}(\cdots,q,\tau_Q,\cdots)
\tag{H-L17}
\]

Lean名: `low_quality_prevents_issue`。状態: Lean形式化済み。

### Lemma H-L18: 低鮮度非発行補題

\[
\tau_F<f
\Longrightarrow
\neg\operatorname{IssueAdmissible}(\cdots,f,\tau_F,\cdots)
\tag{H-L18}
\]

Lean名: `stale_freshness_prevents_issue`。状態: Lean形式化済み。

### Lemma H-L19: 高リスク非発行補題

\[
\tau_R<r
\Longrightarrow
\neg\operatorname{IssueAdmissible}(\cdots,r,\tau_R)
\tag{H-L19}
\]

Lean名: `high_risk_prevents_issue`。状態: Lean形式化済み。

### Lemma H-L20: 候補完全性反駁補題

\[
x\notin \Gamma(O(x))
\Longrightarrow
\neg\operatorname{CandidateComplete}(O,\Gamma)
\tag{H-L20}
\]

Lean名: `missing_entity_refutes_candidate_completeness`。状態: Lean形式化済み。

### Lemma H-L21: 非対称非類似度補題

\[
D(a,b)\ne D(b,a)
\Longrightarrow
\neg\operatorname{SymmetricDissimilarity}(D)
\tag{H-L21}
\]

Lean名: `asymmetric_dissimilarity_not_symmetric`。状態: Lean形式化済み。

### Lemma H-L22: 正規化衝突補題

\[
\nu(O(a))=\nu(O(b))\land a\ne b
\Longrightarrow
\text{正規化観測だけを見る解決器は }a,b\text{ の両方に完全正解できない。}
\tag{H-L22}
\]

Lean名: `normalization_collision_prevents_perfect_resolution`。状態: Lean形式化済み。

### Lemma H-L23: 射影損失補題

\[
\pi(a)=\pi(b)\land a\ne b
\Longrightarrow
\text{水平射影だけでは }a,b\text{ を完全識別できない。}
\tag{H-L23}
\]

Lean名: `projection_collision_prevents_vertical_resolution`。状態: Lean形式化済み。

### Lemma H-L24: 分裂非関数性補題

\[
f(s)=a\land f(s)=b\land a\ne b
\Longrightarrow \bot
\tag{H-L24}
\]

単一関数は、一つの過去状態から二つの異なる未来状態への分裂を同時に表せない。

Lean名: `functional_transition_cannot_represent_split`。状態: Lean形式化済み。

### Lemma H-L25: 観測ベースPID衝突補題

\[
O(a)=O(b)
\Longrightarrow
\rho(O(a))=\rho(O(b))
\tag{H-L25}
\]

PIDが観測だけの関数なら、観測衝突はPID衝突を引き起こす。

Lean名: `observation_based_pid_collides_on_same_observation`。状態: Lean形式化済み。

### Lemma H-L26: 述語証明非単射補題

\[
P(z_1)=P(z_2)\land z_1\ne z_2
\Longrightarrow
P\text{ は秘密値を一意識別しない。}
\tag{H-L26}
\]

Lean名: `predicate_proof_collision_hides_private_value`。状態: Lean形式化済み、別論文。

### Lemma H-L27: 公開述語注入性漏洩補題

\[
\operatorname{Injective}(P)\land P(z_1)=P(z_2)
\Longrightarrow
z_1=z_2
\tag{H-L27}
\]

公開述語が細かすぎると、ZKPを使っても秘密値を推測可能にする。

Lean名: `injective_public_claim_identifies_private_value`。状態: Lean形式化済み、別論文。

### Lemma H-L28: 必要属性欠落補題

\[
R(a)\land \neg H(a)
\Longrightarrow
\neg\operatorname{CoversRequiredAttributes}(H,R)
\tag{H-L28}
\]

Lean名: `missing_required_attribute_prevents_attribute_gate`。状態: Lean形式化済み。

### Lemma H-L29: 参照同値関係補題

\[
u\sim_{\mathrm{ref}}u,\qquad
u\sim_{\mathrm{ref}}v\Rightarrow v\sim_{\mathrm{ref}}u,\qquad
u\sim_{\mathrm{ref}}v\land v\sim_{\mathrm{ref}}w\Rightarrow u\sim_{\mathrm{ref}}w
\tag{H-L29}
\]

Lean名: `ref_equivalent_is_reflexive`, `ref_equivalent_is_symmetric`, `ref_equivalent_is_transitive`。状態: Lean形式化済み。

### Lemma H-L30: 同値類PID不変補題

\[
u\sim_{\mathrm{ref}}v
\Longrightarrow
\psi(\operatorname{ref}(u))=\psi(\operatorname{ref}(v))
\tag{H-L30}
\]

Lean名: `class_pid_invariant_under_ref_equivalence`。状態: Lean形式化済み。

### Lemma H-L31: 衝突ゲート補題

\[
\operatorname{Conflict}(u,v)
\Longrightarrow
\neg(u\sim_{\mathrm{ref}}v)
\tag{H-L31}
\]

Lean名: `conflict_gate_prevents_ref_equivalence`。状態: Lean形式化済み。

### Lemma H-L32: ビット容量不足補題

\[
2^b<N
\Longrightarrow
\neg\operatorname{CapacityCovers}(N,b)
\tag{H-L32}
\]

Lean名: `insufficient_bit_capacity_prevents_capacity_cover`。状態: Lean形式化済み。

### Lemma H-L33: 複数候補残差補題

\[
1<n
\Longrightarrow
\neg\operatorname{CandidateResidualZero}(n)
\tag{H-L33}
\]

Lean名: `multiple_candidates_prevent_zero_residual`。状態: Lean形式化済み。

### Lemma H-L34: proxy残差保留補題

\[
1<n
\Longrightarrow
\neg\operatorname{CandidateResidualZero}(n)
\land
\operatorname{Abstains}(\operatorname{ambiguous})
\tag{H-L34}
\]

Lean名: `proxy_residual_forces_ambiguous_abstention`。状態: Lean形式化済み。

### Lemma H-L35: 文脈衝突補題

\[
a_1\ne a_2
\Longrightarrow
\neg\operatorname{AbsoluteForTwoContexts}(a,a_1,a_2)
\tag{H-L35}
\]

Lean名: `conflicting_context_optima_prevent_absolute_address`。状態: Lean形式化済み。

### Lemma H-L36: 履歴拡張保存補題

\[
L\preceq L'
\Longrightarrow
\left(
V_L\subseteq V_{L'}
\land E_L\subseteq E_{L'}
\right)
\tag{H-L36}
\]

Lean名: `append_only_lineage_preserves_node`, `append_only_lineage_preserves_edge`, `append_only_lineage_preserves_trace`。状態: Lean形式化済み。

### Lemma H-L37: 改称同値類不変補題

\[
\forall u,\ \operatorname{ref}(\rho(u))=\operatorname{ref}(u)
\Longrightarrow
\rho(u)\sim_{\mathrm{ref}}u
\tag{H-L37}
\]

Lean名: `equivalence_class_invariant_under_renaming`, `renamed_address_has_same_reference_class`。状態: Lean形式化済み。

### Lemma H-L38: 非単射圧縮補題

\[
\operatorname{comp}(a)=\operatorname{comp}(b)\land a\ne b
\Longrightarrow
\neg\exists d,\ \forall x,\ d(\operatorname{comp}(x))=x
\tag{H-L38}
\]

Lean名: `noninjective_compression_no_perfect_decoder`。状態: Lean形式化済み。

### Lemma H-L39: 評判単調性補題

\[
p+wn\le p+w(n+m)
\tag{H-L39}
\]

ただし \(p,w,n,m\in\mathbb{N}\)。成功証拠を追加して失敗証拠を固定する限り、正の証拠項は下がらない。

Lean名: `positive_evidence_monotone_reputation`。状態: Lean形式化済み。

### Lemma H-L40: GIS証明書補題

\[
\operatorname{Accepted}(\mathcal{G})\land B_e=0
\Longrightarrow n_e=0
\tag{H-L40}
\]

Lean名: `accepted_gis_certificate_has_no_errors`。状態: Lean形式化済み、GIS検証済み。

### Lemma H-L41: 出典未検証補題

\[
s\in\{\operatorname{unknown},\operatorname{rejected}\}
\Longrightarrow
\neg\operatorname{SourceVerified}(s)
\tag{H-L41}
\]

Lean名: `unknown_source_prevents_verified_claim`, `rejected_source_prevents_verified_claim`。状態: Lean形式化済み。

### Lemma H-L42: proof bundle分離補題

\[
\operatorname{ProofBundleAccepted}(\mathcal{P})
\Longrightarrow
\mathcal{P}.\operatorname{domainSeparated}
\land
\mathcal{P}.\operatorname{noPrivateMaterialExposed}
\tag{H-L42}
\]

Lean名: `accepted_proof_bundle_requires_domain_separation`, `accepted_proof_bundle_exposes_no_private_material`。状態: Lean形式化済み、別論文。

### Lemma H-L43: 文脈優位補題

\[
\operatorname{cost}(\chi,r_1)<\operatorname{cost}(\chi,r_2)
\Longrightarrow
r_2\text{ は }\chi\text{ で最適でない。}
\tag{H-L43}
\]

Lean名: `strictly_better_context_blocks_universal_optimum`。状態: Lean形式化済み。

## H.8 定理総覧

### Theorem H-T1: 住所参照不可能性定理

非単射観測の下では、観測だけを見る無条件完全住所解決器は存在しない。

\[
O(a)=O(b)\land a\ne b
\Longrightarrow
\neg\exists R,\
\operatorname{CorrectFor}(O,R,a)\land
\operatorname{CorrectFor}(O,R,b)
\tag{H-T1}
\]

証明要旨: \(O(a)=O(b)\) なら \(R(O(a))=R(O(b))\) である。もし \(R(O(a))=a\) かつ \(R(O(b))=b\) なら \(a=b\) となり、\(a\ne b\) に反する。

状態: Lean形式化済み。Lean名: `no_condition_free_perfect_resolver`。

### Theorem H-T2: 安全な非発行定理

発行許容条件を満たさない場合、PID発行を保留することで既知の危険状態での誤発行を防ぐ。

\[
\neg\operatorname{IssueAdmissible}(\cdots)
\Longrightarrow
\operatorname{issueIfAdmissible}(\cdots)=\operatorname{unresolved}
\tag{H-T2}
\]

証明要旨: `issueIfAdmissible` は `IssueAdmissible` が真のときだけ `resolved` を返す条件分岐として定義される。否定が与えられれば分岐は `unresolved` になる。

状態: Lean形式化済み、実装検証済み。Lean名: `issue_if_not_admissible_abstains`。

### Theorem H-T3: 住所同値類安定性定理

参照同値性が保たれる場合、表記変更後も同一参照クラスとPIDを保てる。

\[
\operatorname{ref}(\rho(u))=\operatorname{ref}(u)
\Longrightarrow
\rho(u)\sim_{\mathrm{ref}}u
\tag{H-T3a}
\]

\[
u\sim_{\mathrm{ref}}v
\Longrightarrow
\psi(\operatorname{ref}(u))=\psi(\operatorname{ref}(v))
\tag{H-T3b}
\]

証明要旨: 参照同値は参照写像の値の一致として定義される。改称が参照を保存するなら、改称後表現と元表現は同値である。同値類上にPIDを定義すれば、表記差はPIDを変えない。

状態: Lean形式化済み。Lean名: `equivalence_class_invariant_under_renaming`, `class_pid_invariant_under_ref_equivalence`。

### Theorem H-T4: 条件付き住所保存定理

append-only履歴グラフでは、既存ノード、エッジ、有限トレースを保存しつつ履歴を拡張できる。

\[
L_t\preceq L_{t+1}
\Longrightarrow
V_t\subseteq V_{t+1}\land E_t\subseteq E_{t+1}
\tag{H-T4}
\]

証明要旨: `LineageExtends` がノード保存とエッジ保存を定義として含むため、古いノード、古いエッジ、有限エッジ列はいずれも新しいグラフ内に残る。

状態: Lean形式化済み。Lean名: `append_only_lineage_preserves_node`, `append_only_lineage_preserves_edge`, `append_only_lineage_preserves_trace`。

### Theorem H-T5: Address No Free Lunch定理

異なる文脈で損失関数または最適解が衝突する場合、すべての国、言語、対象種別、用途、品質、リスク許容度に同時最適な単一住所解決器は一般には存在しない。

\[
\operatorname{cost}(\chi_1,r_1)<\operatorname{cost}(\chi_1,r_2)
\Longrightarrow
\neg
\operatorname{UniversallyOptimalForTwoContexts}(\operatorname{cost},\chi_1,\chi_2,r_2)
\tag{H-T5}
\]

証明要旨: 普遍最適なら、\(\chi_1\) において任意の \(r'\) より \(r_2\) のコストが小さいか等しいはずである。しかし \(r_1\) が厳密に低コストなので矛盾する。

状態: Lean形式化済み、概念整理。Lean名: `strictly_better_context_blocks_universal_optimum`。

### Theorem H-T6: 住所圧縮不可能性定理

非単射な住所圧縮表現から、全実体を完全復元するデコーダは構成できない。

\[
\operatorname{comp}(a)=\operatorname{comp}(b)\land a\ne b
\Longrightarrow
\neg\exists d:C\to X,\ \forall x,\ d(\operatorname{comp}(x))=x
\tag{H-T6}
\]

証明要旨: 完全デコーダ \(d\) が存在すると仮定すると、同じコードに対して \(d\) は同じ値を返す。しかし完全復元性からそれは同時に \(a\) であり \(b\) であるため、\(a=b\) となり矛盾する。

状態: Lean形式化済み。Lean名: `noninjective_compression_no_perfect_decoder`。

### Theorem H-T7: 垂直参照不可能性定理

2D射影だけでは、同一点上の異なる垂直対象を完全に区別できない。

\[
\pi(z_1)=\pi(z_2)\land z_1\ne z_2
\Longrightarrow
\neg\left(
\operatorname{CorrectFor}(\pi,R,z_1)
\land
\operatorname{CorrectFor}(\pi,R,z_2)
\right)
\tag{H-T7}
\]

証明要旨: これは住所参照不可能性定理の射影版である。地上座標が同じでも階、部屋、入口、ロッカー、地下空間が異なれば、水平射影だけでは識別できない。

状態: Lean形式化済み。Lean名: `projection_collision_prevents_vertical_resolution`。

### Theorem H-T8: 品質ゲート安全定理

低品質、低鮮度、高リスク、高エネルギー、低マージン、候補欠落のいずれかがある場合、発行ゲートはPIDを止める。

\[
\begin{aligned}
&e\notin C
\lor \tau_E<e_1
\lor e_2<e_1+\Delta
\lor q<\tau_Q
\lor \tau_F<f
\lor \tau_R<r\\
\Longrightarrow\;&
\neg\operatorname{IssueAdmissible}(C,e,e_1,e_2,\tau_E,\Delta,q,\tau_Q,f,\tau_F,r,\tau_R)
\end{aligned}
\tag{H-T8}
\]

証明要旨: `IssueAdmissible` は全条件の連言である。いずれか一つが否定されれば全体は成立しない。

状態: Lean形式化済み、実装検証済み。Lean名: `missing_candidate_prevents_issue`, `high_energy_prevents_issue`, `low_margin_prevents_issue`, `low_quality_prevents_issue`, `stale_freshness_prevents_issue`, `high_risk_prevents_issue`。

### Theorem H-T9: GIS証明書限定健全性定理

ゼロエラー予算で受理されたGIS検証証明書は、記録上のハードエラー数がゼロであることを含意する。

\[
\operatorname{Accepted}(\mathcal{G})\land B_e=0
\Longrightarrow
n_e=0
\tag{H-T9}
\]

証明要旨: 受理条件から \(n_e\le B_e\)。さらに \(B_e=0\) なので \(n_e\le 0\)。自然数性より \(n_e=0\)。

状態: Lean形式化済み、GIS検証済み。Lean名: `accepted_gis_certificate_has_no_errors`。

### Theorem H-T10: 暗号拡張分離定理

AMTは住所由来属性と監査エンベロープの意味論を定義できるが、暗号学的秘匿性そのものを含意しない。

\[
\operatorname{AMT}
\not\vdash
\operatorname{ZeroKnowledge}
\land
\operatorname{AMT}
\not\vdash
\operatorname{CredentialTruth}
\tag{H-T10}
\]

証明要旨: AMTの定義域は、住所表現、候補、クラスタ、履歴、品質、出典、監査である。ゼロ知識性は、証明関係、commitment、challenge、simulator、soundness、knowledge extraction、issuer trust、revocationを必要とする。これらはAMT本体の定義からは導かれない。

状態: 概念整理、別論文。ZKP関連は「住所写像論II」で扱う。

## H.9 系総覧

### Corollary H-C1: unresolved必要性系

\[
\exists a,b,\ O(a)=O(b)\land a\ne b
\Longrightarrow
\text{安全な住所解決器には }\operatorname{unresolved}\text{ が必要である。}
\tag{H-C1}
\]

理由: 無条件完全解決器が存在しないため、証拠不足をresolvedに偽装してはならない。

### Corollary H-C2: ambiguous必要性系

\[
|\Gamma_{\chi,t}(u)|>1
\land
\text{分離マージン不足}
\Longrightarrow
\operatorname{ambiguous}
\tag{H-C2}
\]

理由: 複数候補やタイ証拠が残る場合、単一resolvedを返すべきではない。

### Corollary H-C3: rejected必要性系

\[
\operatorname{SourceValidation}(s)=\operatorname{rejected}
\lor
\operatorname{PolicyViolation}(u)
\Longrightarrow
\operatorname{rejected}
\tag{H-C3}
\]

理由: 危険、ポリシー違反、出典拒否の場合は処理拒否状態が必要である。

### Corollary H-C4: 履歴グラフ必要性系

\[
\exists s,a,b,\ a\ne b\land
\operatorname{Split}(s,\{a,b\})
\Longrightarrow
\text{履歴は単一関数では不十分である。}
\tag{H-C4}
\]

理由: 分裂、統合、不明を扱うには履歴グラフまたは関係が必要である。

### Corollary H-C5: 文脈分離必要性系

\[
\chi_{\mathrm{delivery}}\ne\chi_{\mathrm{emergency}}
\Longrightarrow
U_{\chi_{\mathrm{delivery}}}
\text{ と }
U_{\chi_{\mathrm{emergency}}}
\text{ を分けてよい。}
\tag{H-C5}
\]

理由: 配送、消防、行政、不動産、自然地理検索では評価関数と出力粒度が異なる。

### Corollary H-C6: 出典境界必要性系

\[
x\notin \operatorname{Coverage}(Src_t)
\Longrightarrow
\operatorname{Verified}(x)\text{ と主張しない。}
\tag{H-C6}
\]

理由: 出典範囲外の完全性を主張せず、source-boundな検証として扱う必要がある。

### Corollary H-C7: 品質内部制御系

\[
Q_{\chi,t}(K)<\tau_Q
\Longrightarrow
\operatorname{hide}\lor\operatorname{warn}\lor\operatorname{revalidate}\lor\operatorname{noIssue}
\tag{H-C7}
\]

理由: 品質スコアはユーザー表示用真理ではなく、UIや発行制御の内部信号である。

### Corollary H-C8: 自然地理アクセス点分離系

\[
\operatorname{Geometry}(x)
\ne
\operatorname{LabelPoint}(x)
\ne
\operatorname{AccessPoint}(x)
\ne
\operatorname{DeliveryPoint}(x)
\tag{H-C8}
\]

理由: 川、湖、山、砂漠、島、湿地、洞窟、遺跡、世界遺産などでは、地物範囲、表示点、到達点、配送点を分ける必要がある。

### Corollary H-C9: AGID/AOID分離系

\[
\operatorname{AGID},\operatorname{AOID}
\in
\operatorname{Applications}(\operatorname{AMT})
\tag{H-C9}
\]

理由: AGID/AOIDはAMTの応用識別子であり、AMT本体の定理ではない。

### Corollary H-C10: ZKP分離系

\[
\operatorname{ZKAddressPredicate}
\in
\operatorname{CompanionTheory}(\operatorname{AMT})
\tag{H-C10}
\]

理由: ZK Address PredicateはAMT IIとして別論文化するのが適切である。

## H.10 反例総覧

| 反例 | 破れる仮定 | AMTでの扱い |
| --- | --- | --- |
| 同じ正規化文字列が二つの場所に対応する | 観測単射性 | ambiguous、追加証拠、候補分離 |
| 郵便番号が多数の建物を含む | 郵便番号を一意IDとみなす | 候補生成とクラスタリング |
| 同じ2D座標に異なる階・部屋がある | 水平射影が同一性を保存する | 垂直参照層 |
| 旧住所が契約書や登記に残る | 現在住所だけで十分 | 履歴グラフ |
| 一つの町が二つに分かれる | 履歴が単一関数 | relationまたは有向グラフ |
| 二つの自治体が合併する | 一対一履歴 | many-to-one履歴 |
| 湖や砂漠に郵便受けがない | 住所対象は配送点だけ | 自然地理参照とアクセス点分離 |
| 配送と消防で最適住所が違う | 単一絶対最適住所 | 文脈相対モデル |
| 狭すぎるZK述語が住所を特定する | ZKなら何でも秘匿 | anonymity setと述語粒度 |
| 配送失敗が天候による | 配送失敗は住所偽を意味する | 失敗原因の分離 |

## H.11 実装・検証スクリプト対応

| 対象 | 主な検証 |
| --- | --- |
| 形式理論 | `lean formal/AMTCore.lean`, `LEAN_PATH=formal lean formal/AMTPaperExtensions.lean` |
| GIS出典 | `npm run verify:gis:budget`, `npm run verify:gis:lean` |
| 郵便出典 | `npm run verify:postal-sources` |
| PID衝突リスク | `npm run verify:pid-risk` |
| 候補生成、クラスタ、未解決、PID | `addressMorphism.test.ts`, `pidIssuanceAudit.test.ts` |
| 履歴merge/split | `pidLifecycleProof.test.ts` |
| 自然地理・文化地理 | `naturalAddress.test.ts`, `mapFeatureAddress.test.ts` |
| 品質スコア | `addressTabQuality.test.ts`, `addressQualitySummary.test.ts`, `qualityThresholdProof.test.ts` |
| 住所検証エンジン | `addressVerificationEngine.test.ts`, `addressVerificationPolicy.test.ts`, `addressVerificationBenchmark.test.ts` |
| 多言語地名検索 | `placeSearchLanguage.test.ts`, `searchQuery.test.ts` |
| 暗号拡張境界 | `zkProofRuntime.test.ts`, `zkProofCompatibility.test.ts`, `privateAddressPredicateProof.test.ts` |

## H.12 まだ一般定理として書かない項目

| 項目 | 理由 | 扱い |
| --- | --- | --- |
| 全世界住所完全解決 | 候補欠落、非単射観測、出典不足がある。 | 主張しない。 |
| 商用APIへの全面勝利 | 同一データ、同一指標、同一国、同一用途での比較が未完了。 | ベンチマーク計画に留める。 |
| 住所保存則の無条件版 | 廃止、不明、分裂、統合があり、常に一意後継とは限らない。 | 条件付き住所保存として扱う。 |
| 都市化と住所情報量の一般定理 | 地域、地物型、出典密度、住所制度に依存する。 | 実験仮説として扱う。 |
| ZKPによる住所真実性保証 | issuer trust, revocation, freshness, credentialが必要。 | 住所写像論IIで扱う。 |
| AGID/AOIDの暗号安全性 | 鍵管理、登録、監査、失効、nullifier、実装監査が必要。 | 応用論文で扱う。 |

## H.13 最終整理

住所写像論の数理的核は、次の五つに集約できる。

1. 住所は表面文字列ではなく、実体、観測、文脈、履歴、出典を結ぶ写像系である。
2. 観測と圧縮は一般に非単射であり、無条件完全住所解決器は存在しない。
3. 候補生成、クラスタ、評価、品質、鮮度、リスク、履歴、監査を通した安全ゲートが必要である。
4. 解決できない場合をresolvedに偽装せず、ambiguous、unresolved、rejected、conditionalとして扱う。
5. AGID、AOID、ZKP、credentialはAMTを利用する応用層であり、AMT本体の意味論とは分離して記述する。
