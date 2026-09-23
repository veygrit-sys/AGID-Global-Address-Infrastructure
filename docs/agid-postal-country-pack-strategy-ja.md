# AGID Postal Country Pack Strategy

郵便番号が存在しない、または実質的に使われていない国、あるいは郵便番号が粗く配送・住所検証に不足がある国では、国ごとに軽量な **AGID Postal Country Pack** を作る方針が有効である。

ただし、国ごとにアプリ本体やアルゴリズムを複製するべきではない。中央リポジトリには共通エンジン、UI、検証仕様、テストを置き、国別リポジトリには都市名、地名別名、土地・地形情報、港・道路回廊、VPL候補、出典カタログだけを持たせる。

```text
agid-core
  共通AGID生成
  郵便区画フォージ
  Address Element / POS / Portal
  no-raw-address tests

agid-postal-pack-fj
  Fijiの都市名・島・港・地形・VPL候補
  出典カタログ
  ライセンス台帳
  テストベクトル
```

## 判断

国別パック方式は採用価値が高い。

理由は次の通り。

- メインアプリを軽く保てる。
- 国ごとの専門家が都市名、土地情報、言語、旧地名、配送慣習だけを保守できる。
- ライセンスリスクを国別に閉じ込められる。
- 紛争・災害・人道支援地域では、精密データを入れず薄い安全パックにできる。
- 国ごとの郵便番号生成、補助コード、VPL設計、地形別設計を独立して改善できる。

## 分け方

| Tier | 意味 | 推奨 |
| --- | --- | --- |
| mature-reliable-postal-code | 郵便番号が成熟・信頼できる | 公式郵便体系の参照/互換pack |
| no-or-not-required-postal-code | 郵便番号なし、または実質的に要求されない | 国別pack推奨 |
| weak-coarse-postal-code | 郵便番号はあるが粗い | 補助コード用pack |
| fragile-address-infrastructure | 住所制度や居住安定性が弱い | 薄い高リスクpack |
| rapid-growth-address-pressure | 都市化・EC・配送需要が急増 | 重めの成長対応pack |

## 国別packに入れるもの

国別packは、住所そのものではなく、住所解決に必要な公共・非個人データだけを持つ。

- 国プロファイル。
- 公式・旧名・別名・ローマ字表記・現地語名。
- LocalityID と名称履歴。
- 行政境界インデックス。
- 島、谷、砂漠、湿地、森林、河川、デルタ、沿岸、港、空港などの土地・地形情報。
- 集落クラスター。
- 道路回廊、港湾、配送拠点などの配送上の骨格。
- Virtual Postal Locality 候補。
- 既存郵便番号制度の有無、粗さ、採用理由。
- 出典カタログ、取得日、ライセンス、変換スクリプト。
- no-raw-address test vector。

## 入れてはいけないもの

- 個人住所。
- 氏名。
- 電話番号。
- 受取人proof code。
- private AOID body。
- AGID-S payload。
- ライセンス未確認の第三者raw dataset。
- 高リスク施設や避難所の精密位置。

## 互換性

全ての国別packは同じ schema を使う。

```text
schemaId: agid-postal-country-pack-v0.1
enginePackage: @agid/postal-forge-core
```

これにより、中央アプリは国別packを遅延読み込みできる。

```text
国を選ぶ
  ↓
必要なcountry packだけ読む
  ↓
都市名・土地情報・VPL候補を提案
  ↓
AGID Postal Forgeで候補郵便番号を生成
```

## 運用原則

1. Class Aの成熟国は国別packを作っても既存郵便番号を置換しない。
2. Class Bの弱い国は補助AGID郵便区画だけを作る。
3. Class Cの国は主コード候補を作れるが、最初は draft のみ。
4. 高リスク国は thin-pack とし、粗い粒度、短期alias、非公開、redaction を優先する。
5. 公式化には政府、自治体、郵便当局、配送会社、データ品質、プライバシー安全性が必要。

## 結論

国別専用リポジトリは、アプリ分割ではなく **国別データパック分割** として採用するのが最もよい。

AGID本体は共通化し、国別packは軽量・検証可能・ライセンス分離・プライバシー安全な形で配布する。これにより、郵便番号がない国や不十分な国でも、国ごとの都市名・土地情報・配送事情に合わせて保守できる。
