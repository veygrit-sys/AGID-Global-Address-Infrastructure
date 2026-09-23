# AGID Postal Forge / AtlasWeaver AI

Last updated: 2026-06-20

## 名前

郵便番号・郵便区画を作成できるシステム名は **AGID Postal Forge** とする。日本語名は **AGID郵便区画フォージ**。

AI名は **AtlasWeaver AI** とする。日本語表記は **AtlasWeaver AI（アトラスウィーバー）**。

## 位置付け

AGID Postal Forgeは、郵便番号がない国、郵便番号が弱い国、島嶼国、山岳国、砂漠国、街路名が弱い地域などに対して、AGIDを使った郵便区画案を作る設計システムである。

ただし、これは「勝手に公式郵便番号を作るシステム」ではない。出力は次の段階に分かれる。

- `simulation`: 数理・GIS上の仮想案
- `draft`: 未承認の下書き
- `pilot`: 配送業者や自治体との限定試験
- `supplementary`: 既存郵便番号を補う補助コード
- `official`: 政府・自治体・配送業者・データ品質・匿名性・移行写像がそろった公式案

## AtlasWeaver AI の役割

AtlasWeaver AIは、国土、人口、地形、既存郵便制度、AGID区画、行政境界、道路・配送制約、仮想郵便ローカリティ、プライバシー条件を織り合わせて、郵便区画案を採点・改善するAIである。

AIの出力は、単一の「おすすめ」ではなく、次の品質レポートを持つ。

| 軸 | 見るもの |
| --- | --- |
| country-classification | A/B/C分類、成熟郵便制度の非置換性 |
| template-fit | 国土・人口・地形に対するテンプレート適合度 |
| capacity-sufficiency | 区画数に対するコード容量 |
| learning-depth | 国土、人口、地形、既存体系の事前学習の深さ |
| governance-readiness | 政府、自治体、配送業者、プラットフォームの承認信号 |
| privacy-safety | 最小匿名性、機微地域、高リスク地域 |
| data-trust | 住所、道路、行政、人口、境界データの信頼度 |
| collision-avoidance | 既存郵便番号との衝突回避 |
| readability | 人間の読みやすさ、入力ミス耐性 |
| migration-safety | 改名・分割・統合・再編時の後方互換 |

## 品質グレード

AtlasWeaver AIは、各軸を重み付きで採点し、次のグレードを返す。

- `excellent`
- `good`
- `review-required`
- `draft-only`
- `blocked`

重要なのは、スコアが高くても公式化できるとは限らないこと。たとえばデータ品質が高くても、政府・自治体・配送業者の承認がなければ `draft-only` に留める。機微地域や高リスク地域では `blocked` または `review-required` に落とす。

## 強化された点

今回の強化で、AIは次を明示できる。

- なぜその国にその郵便区画テンプレートを選んだか
- どの条件が公開のボトルネックか
- どのデータを追加すれば品質が上がるか
- 既存郵便番号と衝突しないか
- 個人や危険施設が推定される粒度になっていないか
- 公式化できる段階か、draftに留めるべきか
- AGIDを内部キーとして残し、後から郵便番号の形を変えられるか

## 実装

実装は次にある。

- `src/lib/agidPostalCodeEngine.ts`
- `src/lib/postalZoneDesigner.ts`
- `src/components/PostalZoneDesignerScreen.tsx`

検証は次で行う。

```bash
npx tsx --test src/lib/agidPostalCodeEngine.test.ts src/lib/postalZoneDesigner.test.ts
```
