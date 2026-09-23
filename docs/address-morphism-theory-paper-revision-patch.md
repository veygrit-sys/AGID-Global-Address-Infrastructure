# Address Morphism Theory Paper Revision Patch

Generated: 2026-06-06

This patch rewrites paper claims that should be aligned with the current
verification results. The repository does not contain the manuscript source, so
this document is written as a replacement-text patch for the PDF manuscript
`main (5).pdf`.

## Verified Inputs

The following verification results are used as the authority for this patch:

- Lean: `lean formal/AMTCore.lean` passed, including the new certified gated
  resolution model.
- AMT implementation tests: 27 tests passed, including PID risk tests.
- PID collision-risk budget: `npm run verify:pid-risk` passed.
- GIS normal validation: 351 features, 0 hard errors, 149 warnings, GDAL ok.
- GIS warning budget: `npm run verify:gis:budget` passed.
- GIS strict validation: not passed because 149 warnings remain.
- Official postal source coverage: `needs-official-source` is 0, but some
  regions rely on global official fallback rather than country-specific
  official sources.
- ZK proof-bundle tests verify envelope compatibility and safety checks, not
  complete cryptographic ZK circuits.

## Global Wording Rules

Replace any unconditional expression of AMT correctness with a conditional
expression.

Avoid:

```text
AMT always determines the true address entity.
AMT proves global address correctness.
DPID is collision-free.
GIS validation proves global geographic correctness.
Current ZK functions are complete zero-knowledge proofs.
All natural features worldwide are already recognized.
```

Use:

```text
Under explicit candidate-generation, evidence, separation, threshold, and
tie-breaking assumptions, AMT can select a best cluster or safely abstain with
ambiguous/unresolved.
```

## Replace Section 1.12 Main Claim

Current safe direction is already mostly correct. Replace the main claim block
with the following stronger verified wording.

```text
本研究の主張は以下に集約される。

住所参照は，文字列照合や座標照合ではなく，候補生成，構造比較，
有界クラスタリング，証拠評価，履歴更新，安全な保留状態，および
識別子発行からなる条件付き計算過程として定式化できる。

ただし，この主張は「任意の現実入力に対して常に正しいPIDを返す」
という無条件完全性を意味しない。候補生成が真の実体を含み，証拠が
十分であり，最良候補と競合候補の分離幅が閾値を満たす場合に，AMTは
一意な参照を決定できる。条件が満たされない場合，AMTは誤ったPIDを
発行するよりも ambiguous または unresolved を返す。

この保留状態は実装上の便宜ではなく，観測表現が非単射である場合に
無条件完全解決器が存在しないことから要請される理論的安全機構である。
```

Reason:

```text
Lean verifies the impossibility of condition-free perfect resolution and now
also verifies that ambiguous/unresolved outcomes are non-emitting states.
```

## Add After Theorem 3.2.3A

Add this verification note after the theorem based on the observation map.

```text
形式検証注記：
この定理の核となる命題は Lean により検証されている。すなわち，
観測写像 obs : E -> O が非単射であり，異なる実体 a, b が同一観測
obs(a) = obs(b) を持つ場合，観測のみを入力とする全関数 r : O -> E は
a と b の両方を同時に正しく解決できない。

さらに，出力型に resolved(e), ambiguous, unresolved を含めた場合，
ambiguous および unresolved は任意の実体を解決せず，誤った実体も
発行しない非出力状態であることも Lean で検証されている。
```

Reason:

```text
The current Lean file includes `ResolutionOutcome`, `ResolvesEntity`,
`Abstains`, and non-emission theorems for ambiguous/unresolved.
```

## Replace Theorem 13.5.C Safe PID Issuance Explanation

Replace the explanatory paragraph after the theorem with:

```text
この定理は，PID発行を「最良候補らしいものを楽観的に選ぶ」操作では
なく，複数の安全条件を満たす場合にのみ進むゲートとして定式化する。
現在のLean形式化では，低いエネルギーほど良いという抽象モデルのもとで，
次の選択ゲートが検証されている。

bestEnergy <= threshold
bestEnergy + margin <= secondEnergy

この条件により，最良候補が閾値を超える場合，または第二候補との分離幅
が不足する場合，選択は許されない。したがって，AMTのPID発行は
「一意な真実の発見」ではなく，「候補内で十分に分離され，閾値を満たす
場合に限る条件付き発行」である。
```

Reason:

```text
Lean now verifies `score_selection_requires_threshold` and
`tied_evidence_prevents_score_selection`.
```

## Add After Theorem 13.5.C: Certified Gated Resolution Model

Add the following new model after the safe PID issuance theorem.

```text
証明付きゲート解決モデル

AMTのPID発行は，候補生成，スコア評価，品質評価，鮮度検査，および
リスク予算を別々の経験的処理として並べるだけでは不十分である。
これらを一つの発行条件として束ねるため，本論文では
Certified Gated Resolution（証明付きゲート解決）を導入する。

候補集合 C，選択候補 e，最良候補エネルギー bestEnergy，第二候補
エネルギー secondEnergy，エネルギー閾値 tau，分離幅 mu，品質スコア q，
品質閾値 theta，鮮度年齢 f，鮮度上限 F，リスク値 r，リスク上限 R に
対して，発行可能性 IssueAdmissible を次で定義する。

e in C
bestEnergy <= tau
bestEnergy + mu <= secondEnergy
theta <= q
f <= F
r <= R

AMTは IssueAdmissible が成り立つ場合にのみ resolved(e) を返す。
IssueAdmissible が成り立たない場合，AMTは unresolved を返し，PIDを
発行しない。

このモデルにより，AMTの正の主張は「常に真の住所実体を発見する」
ことではなく，「候補内性，スコア分離，品質，鮮度，リスク予算が
同時に満たされた場合に限り発行する」こととして定式化される。

Lean検証では，証明付きゲート解決が resolved(e) を発行したなら
IssueAdmissible の全条件が存在すること，条件が存在しない場合は
unresolved として保留すること，候補欠落，高エネルギー，分離不足，
低品質，鮮度切れ，高リスクの各場合に発行が不可能であることが
確認されている。
```

Reason:

```text
This new model should be introduced because it connects the formal AMT
limitation theorem to the implementation's operational safeguards. It also
prevents the paper from overstating AMT as an unconditional resolver.
```

## Replace DPID Collision Risk Paragraph in Section 13.6

Replace the DPID collision-risk paragraph with:

```text
理論PIDと実装DPIDは区別しなければならない。理論上のPID写像
psi : E -> PID が単射であるなら，異なる実体は異なるPIDを持つ。
この単射性に基づく衝突不在は Lean で検証されている。

一方，実装上のDPIDは正規化表現 canon(e) に対して SHA-256 を適用し，
上位128ビットを用いる有限長ハッシュ識別子である。

DPID(e) = prefix128(SHA-256(canon(e))).

これは数学的な完全単射ではない。n個のDPIDを発行した場合，理想ハッシュ
近似のもとで少なくとも一つの衝突が発生する確率は birthday bound により
次で上界評価される。

p_collision <= n(n - 1) / (2 * 2^128).

現在の実装では，この衝突可能性を否定するのではなく，発行上限と許容リスク
を明示したリスク予算として検証する。リポジトリの無料ローカル検証
`npm run verify:pid-risk` では，n = 1,000,000,000,000，許容リスク
1e-12 に対して，

p_collision <= 1.4693679385263966e-15

であり，必要ビット数は119ビット，128ビットDPIDの安全余裕は9ビットで
あることが確認されている。

したがって，実装DPIDは「衝突不可能な識別子」ではなく，「明示された
発行上限のもとで衝突リスクを十分小さく管理する識別子」と記述すべきで
ある。
```

Reason:

```text
The original paper already distinguishes theoretical PID and hash DPID. This
replacement adds the verified numeric budget and avoids implying absolute
collision-freedom for the hash identifier.
```

## Replace Section 14.11 Verification Table

Replace the three-layer verification table with the following updated table.

```text
AMTの検証は，少なくとも五層に分ける。

1. 形式検証：
   Leanにより，非単射観測のもとで無条件完全解決器が存在しないこと，
   ambiguous/unresolved が非出力状態であること，候補健全性が候補内出力を
   保証すること，単射PID写像で衝突がないこと，および抽象的な
   threshold/margin ゲートが検証されている。

2. 実装検証：
   候補生成，構造非類似度，有界クラスタリング，証拠合意，履歴更新，
   ambiguous/unresolved判定，PID発行監査，AMN公開envelopeを単体テストで
   検証する。

3. リスク予算検証：
   実装DPIDは有限長ハッシュであるため，衝突不在を絶対主張せず，
   birthday-bound による衝突リスク予算を検証する。現在の予算検証は
   1兆PID，許容リスク1e-12に対してpassしている。

4. GIS検証：
   境界，代表点，バウンディングボックス，行政階層，地名IDの整合性を
   検査する。現在の通常検証では351 features，0 hard errors，149 warnings，
   GDAL okである。strict GIS validationは警告が残るため未達である。

5. GIS warning budget / ratchet：
   strictが通るまでの中間検証として，警告数と警告種別を予算化し，
   新しい警告種別または警告数の増加を失敗として扱う。現在のbudget検証は
   errors 0/0，warnings 149/149，registered sources 408/408でpassしている。
```

Reason:

```text
The paper's verification layer should match the actual verification results:
strict GIS has not passed, while GIS budget and PID risk budget now have
separate reproducible local checks.
```

## Replace Appendix A Lean Formalization

Replace Appendix A with:

```text
付録A Leanによる形式化

Leanによる形式化では，本文の全構成を機械検証するのではなく，中核となる
小定理を分離して扱う。

第一に，観測写像 obs : E -> O が単射でない場合，観測表現のみから完全
解決器 r : O -> E を構成できないことを形式化する。

第二に，出力型 ResolutionOutcome E を

resolved(e), ambiguous, unresolved

として定義し，ambiguous および unresolved が任意の実体を解決せず，
誤った実体も発行しない非出力状態であることを形式化する。

第三に，候補健全性を定義し，解決器が resolved(e) を返す場合，その e は
同じ観測から生成された候補集合に含まれることを形式化する。

第四に，低エネルギーが良いという抽象モデルのもとで，

bestEnergy <= threshold
bestEnergy + margin <= secondEnergy

を満たさない場合に選択を許さない score gate を形式化する。

第五に，PID写像 psi が単射であるという仮定から，異なるクラスタが同一PID
を持たないことを形式化する。ただし，実装DPIDは有限長ハッシュであるため，
この単射PID定理とは別に衝突リスク予算によって扱う。

第六に，証明付きゲート解決モデル IssueAdmissible を形式化する。このモデルは，
候補内性，score threshold/margin，品質しきい値，鮮度窓，リスク予算を
一つの発行条件として束ねる。Leanでは，発行が起きた場合に全条件が存在する
こと，条件が存在しない場合は unresolved として保留すること，および候補欠落，
高エネルギー，分離不足，低品質，鮮度切れ，高リスクの各場合に発行が
不可能であることを検証している。
```

Reason:

```text
Appendix A currently mentions only two Lean facts. The verified Lean core is
now broader and should be described accurately.
```

## Replace Appendix C GIS Validation Result

Replace Appendix C with:

```text
付録C GIS検証結果

GIS検証では，境界ポリゴン，代表点，バウンディングボックス，行政階層，
地名ID，およびオープン地理ソース登録の整合性を確認する。

現在の通常検証結果は次の通りである。

features: 351
hard errors: 0
warnings: 149
registered open-source sources: 408
GDAL conversion/read check: ok

警告の内訳は次の通りである。

missing-polygon: 66
point-outside-bbox: 64
duplicate-id: 19

したがって，通常検証は「致命的な幾何エラーがないこと」および
「GDALで機械可読であること」を確認する。一方で，警告が149件残るため，
strict GIS validation は現時点では通過していない。

strict未達を放置しないため，本実装では warning budget / ratchet を導入する。
`npm run verify:gis:budget` は，警告数や警告種別が現在の予算を超えた場合に
失敗する。現在のbudget検証は errors 0/0，warnings 149/149，
registered sources 408/408でpassしている。

この結果に基づき，論文では「GIS検証により世界地理の完全性が証明された」
とは書かず，「現在のデータセットについて機械可読性とhard error 0を確認し，
残る警告はbudget管理とQGIS/手動レビューの対象である」と書く。
```

Reason:

```text
This exactly reflects the verified GIS status: normal and budget checks pass,
strict check does not.
```

## Add Note to Chapter 15 Natural Geography

Add the following caution after the paragraph stating that AMT can handle
mountains, valleys, rivers, coastlines, faults, wetlands, and cave systems.

```text
実装検証注記：
現在の実装テストでは，海域，山岳，湖，河川，滝，島，群島，砂漠，
砂漠類似の疎自然地理，荒野，塩湖，氷原などの代表ケースについて，
通常の街路住所を無理に生成せず，自然地理住所として表示できることを
確認している。ただし，これは世界中の全自然地物がすでに網羅的に認識
できることを意味しない。自然地物住所の正しさは，名称，座標，地図・
地理ソース，地物種別，および候補生成の再現率に依存する。
```

Reason:

```text
Representative natural-feature tests pass, but global natural-feature
recognition is not verified.
```

## Add Optional Appendix D: Reproducible Free Verification Commands

Add this appendix if space allows.

```text
付録D 無料ローカル検証コマンド

本論文の検証可能な部分は，次の無料ローカルコマンドで再現できる。

Lean形式検証：
lean formal/AMTCore.lean

AMT実装テスト：
npx tsx --test src/lib/addressMorphism.test.ts \
  src/lib/addressMorphismSources.test.ts \
  src/lib/pidIssuanceAudit.test.ts \
  src/lib/addressMorphismNetwork.test.ts \
  src/lib/pidCollisionRisk.test.ts

PID衝突リスク予算：
npm run verify:pid-risk

GIS通常検証：
npm run verify:gis

GIS warning budget：
npm run verify:gis:budget

公式郵便ソース検証：
npm run verify:postal-sources
npm run report:official-postal-sources

これらの検証は，AMTの全ての現実世界適用を証明するものではない。
それぞれ，形式モデル，実装挙動，データ品質，衝突リスク，ソース分類を
別々に検査する段階的検証である。
```

## Summary of Required Claim Changes

Use these final claim statuses:

```text
Verified:
- Condition-free perfect resolution is impossible under non-injective
  observation.
- Ambiguous/unresolved are non-emitting states in the formal model.
- Candidate-sound resolved output is candidate-contained.
- Injective theoretical PID has no collision.
- Score threshold and margin gates can be formally checked in an abstract model.
- Certified gated resolution emits only when candidate, score, quality,
  freshness, and risk gates are all present.
- AMT implementation tests pass for representative resolution behavior.
- PID hash collision risk can be bounded under an explicit issuance budget.
- GIS data has 0 hard errors and passes GDAL readability in the current
  validator.
- GIS warnings are budgeted and regression-checked.

Not yet verified:
- Strict GIS validation.
- Complete global natural-feature recognition.
- Full cryptographic ZK circuits.
- Production scoring function fully connected to Lean.
- Production quality, freshness, and risk code paths fully connected to the
  Lean certified gated resolution predicate.
- Absolute collision-freedom for finite hash DPID.
- Universal address correctness across all real-world inputs.
```
