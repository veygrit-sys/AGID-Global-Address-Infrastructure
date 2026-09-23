# 住所機械翻訳理論

住所機械翻訳理論は、住所をAI、ルール、郵便番号データ、行政区画、地理データベースによって、別言語、別制度、別フォーム、別配送網で使える形へ自動変換するための理論である。

通常の機械翻訳では意味が伝わることが中心になる。しかし住所機械翻訳では、意味の自然さだけでは不十分である。重要なのは、荷物が届くこと、地図で見つかること、ECフォームに入ること、行政区画と矛盾しないこと、本人確認やZK住所証明に使えること、機械処理できることである。

## 定義

住所機械翻訳とは、住所文字列を国別住所制度、郵便番号体系、行政区画、地理座標、配送会社仕様、入力フォーム構造に基づいて解析し、目的に応じた言語、形式、粒度へ自動変換する技術体系である。

これは単なる日本語住所から英語住所への翻訳ではない。正しい流れは次の通りである。

```text
住所文字列
↓
構造解析
↓
正規化
↓
地理・郵便検証
↓
国別モデル変換
↓
目的別フォーマット出力
```

## 通常の機械翻訳との違い

| 項目 | 通常の機械翻訳 | 住所機械翻訳 |
| --- | --- | --- |
| 対象 | 文章 | 住所データ |
| 目的 | 意味伝達 | 到達・照合・入力・証明 |
| 訳し方 | 文脈重視 | 構造重視 |
| 固有名詞 | 翻訳される場合がある | 原則として転写 |
| 正解 | 複数ありうる | 用途ごとの制約がある |
| 評価 | BLEU、意味類似 | 配送成功率、検証率、フォーム適合率 |
| 失敗時の危険 | 誤訳 | 誤配送、本人確認失敗、API拒否 |

住所内の地名は意味ではなく識別子として扱う。たとえば「神南」を `God South` と訳してはいけない。国際配送や地図検索では `Jinnan` と転写する方が安全である。

## 5段階モデル

住所機械翻訳エンジンは、少なくとも次の5段階に分ける。

### 1. 住所解析

入力住所を国、地域、市区町村、町名、街区、建物、部屋などの要素に分解する。この段階では翻訳しない。

例:

```text
東京都渋谷区神南1-19-11 パークウェースクエア2 4F
```

構造化例:

```json
{
  "country": "JP",
  "prefecture": "東京都",
  "city": "渋谷区",
  "town": "神南",
  "block": "1-19-11",
  "building": "パークウェースクエア2",
  "unit": "4F"
}
```

### 2. 住所正規化

表記揺れを統一する。漢数字、全角数字、郵便番号、行政単位、建物階表記、ローマ字表記を正規化する。

| 入力 | 正規化 |
| --- | --- |
| 東京都渋谷区神南一丁目十九番十一号 | 東京都渋谷区神南1-19-11 |
| 1500041 | 150-0041 |
| ４Ｆ | 4F |
| Shibuya City | Shibuya-ku |

### 3. 地理・郵便検証

郵便番号、行政区画、町域、建物名、座標、配送可能地域を照合する。

```text
150-0041 → 東京都渋谷区神南
```

一致すれば信頼度を上げる。一致しない場合は、翻訳結果を確定せず警告を返す。

```json
{
  "warning": "postal_code_mismatch",
  "confidence": 0.72
}
```

### 4. 制度変換

国別の住所文法へ変換する。翻訳先言語だけでなく、利用先の住所制度に合わせて並べ替える。

| 制度 | 代表的な順序 |
| --- | --- |
| 日本 | 郵便番号 → 都道府県 → 市区町村 → 町名 → 丁目番地 → 建物 |
| 国際配送英語 | 建物・部屋 → 番地・町名 → 市区町村 → 都道府県・郵便番号 → 国 |
| 中国 | 省 → 市 → 区/県 → 街道 → 小区/道路 → 楼棟/部屋 |
| 米国 | Street Address → City → State → ZIP Code → Country |

### 5. 目的別出力

同じ住所でも、目的によって正解は変わる。

| 目的 | 出力方針 |
| --- | --- |
| 配送ラベル | 配送員が読みやすい住所 |
| ECフォーム | Address line 1 / City / State / Postal Code へ分割 |
| 本人確認 | 公的書類に近い表記 |
| 地図検索 | 座標・地名検索に強い表記 |
| 物流API | DHL、FedEx、ヤマトなどの仕様に合わせる |
| 匿名配送 | 必要最小限だけ開示 |
| ZK住所証明 | 住所全文ではなく条件だけ証明 |

## 中核原理

### 住所は自然文ではなく構造体である

住所は次のような階層構造である。

```text
Country
Region
Municipality
District
Town
Street / Block
Building
Unit
```

LLMにそのまま翻訳させるのではなく、まず構造体に変換する必要がある。

### 地名は翻訳より転写を優先する

住所内の固有名詞は意味翻訳ではなく、音写、ローマ字化、標準表記を優先する。

| 元表記 | 推奨 |
| --- | --- |
| 神南 | Jinnan |
| 渋谷 | Shibuya |
| 新宿 | Shinjuku |
| 赤坂 | Akasaka |
| 六本木 | Roppongi |

ただし行政単位は説明的に変換できる。

| 元表記 | 例 |
| --- | --- |
| 東京都 | Tokyo / Tokyo Metropolis |
| 大阪府 | Osaka Prefecture |
| 渋谷区 | Shibuya-ku |
| 京都市 | Kyoto City |

### 郵便番号は翻訳のアンカーである

郵便番号は住所機械翻訳の最重要キーである。

```text
Postal Code → Town → Municipality → Region
```

郵便番号がない国や不十分な地域では、行政区画ID、地理座標、道路ID、建物ID、配送エリアID、AGIDを代替アンカーにする。

### LLMは補助であり、検証主体ではない

LLMは曖昧な住所の補完、建物名候補、表記揺れ、国別フォーム説明には有用である。しかし郵便番号照合、行政区画判定、配送可能性、座標検証、本人確認は、オープンデータ、公式データ、ルール、監査可能な検証器で行う。

## 数理モデル

住所構造を次のように表す。

```text
A = {c, r, m, d, t, s, b, u}
```

| 記号 | 意味 |
| --- | --- |
| `c` | country |
| `r` | region / prefecture |
| `m` | municipality |
| `d` | district |
| `t` | town |
| `s` | street / block |
| `b` | building |
| `u` | unit / room |

住所機械翻訳を次の写像として定義する。

```text
AMT(A, L, P, F) = O
```

| 記号 | 意味 |
| --- | --- |
| `A` | 入力住所構造 |
| `L` | 目標言語 |
| `P` | 利用目的 |
| `F` | 出力フォーマット |
| `O` | 目的別出力住所 |

信頼度スコアは、郵便番号一致度、地理座標一致度、行政区画一致度、配送可能性、フォーム適合性から構成する。

```text
Score = αP + βG + γA + δD + εF
```

| 記号 | 内容 |
| --- | --- |
| `P` | postal match |
| `G` | geocode match |
| `A` | administrative match |
| `D` | deliverability |
| `F` | form fit |

スコアが低い場合は、翻訳を確定せず、要確認、候補複数、郵便番号不一致、建物名未検証として返す。

## AGID中間言語モデル

住所機械翻訳で最も安定する方式は、住所を一度AGID形式へ変換することである。

```text
Source Address
↓
AGID Address Interlingua
↓
Target Address
```

AGIDは住所翻訳の中間言語として機能する。

```text
日本語住所 → AGID → 英語住所
中国語住所 → AGID → 日本語住所
英語住所 → AGID → 配送ラベル
```

中間形式の例:

```json
{
  "agid": "AGID-JP-TOKYO-SHIBUYA-JINNAN-1-19-11",
  "country": "JP",
  "adminPath": ["Tokyo", "Shibuya", "Jinnan"],
  "postalCode": "150-0041",
  "geo": {
    "lat": 35.66,
    "lon": 139.70
  },
  "deliveryZone": "JP-YAMATO-TKY-23-AREA",
  "privacyLevel": "building_required"
}
```

## API契約

リクエスト例:

```json
{
  "address": "東京都渋谷区神南1-19-11 パークウェースクエア2 4F",
  "source_country": "JP",
  "source_language": "ja",
  "target_language": "en",
  "purpose": "international_shipping",
  "output_format": "shipping_label"
}
```

レスポンス例:

```json
{
  "structured": {
    "country": "Japan",
    "countryCode": "JP",
    "postalCode": "150-0041",
    "adminLevel1": "Tokyo",
    "adminLevel2": "Shibuya-ku",
    "locality": "Jinnan",
    "street": "Jinnan",
    "houseNumber": "1-19-11",
    "building": "Parkway Square 2",
    "unit": "4F"
  },
  "interlingua": {
    "agid": "AGID-JP-TOKYO-SHIBUYA-JINNAN-1-19-11",
    "country": "JP",
    "adminPath": ["Tokyo", "Shibuya-ku", "Jinnan"],
    "postalCode": "150-0041",
    "deliveryZone": "JP-TOKYO-SHIBUYA-150-0041",
    "privacyLevel": "unit_required"
  },
  "formatted": [
    "4F Parkway Square 2",
    "1-19-11 Jinnan, Shibuya-ku",
    "Tokyo 150-0041",
    "Japan"
  ],
  "confidence": 0.91,
  "postalCodeMatch": "valid",
  "deliveryRisk": "low",
  "warnings": []
}
```

## 評価指標

住所機械翻訳では通常の翻訳評価ではなく、次の指標を使う。

| 指標 | 内容 |
| --- | --- |
| Delivery Accuracy | 実際に届く率 |
| Postal Match Rate | 郵便番号と町域の一致率 |
| Geocode Match Rate | 地図座標と一致する率 |
| Form Fill Success | ECフォームに通る率 |
| Carrier Acceptance | 配送会社APIに受理される率 |
| Human Readability | 配送員が読める率 |
| Privacy Preservation | 必要以上に住所を出していない率 |
| Reversibility | 元住所に戻せる率 |
| Ambiguity Detection | 曖昧さを検出できる率 |

AGIDでは、`postalCodeMatch`, `deliveryRisk`, `unverifiedFields`, `warnings`, `interlingua`, `evaluation` を返すことで、 fluent but wrong な住所を防ぐ。

## 実装方針

1. 住所文字列をそのままLLM翻訳しない。
2. `parse → normalize → verify → transform → render` の順序を固定する。
3. AGID Address Interlinguaを中間形式にする。
4. 郵便番号が強い国は郵便番号を主アンカーにする。
5. 郵便番号が弱い国は候補表示と手入力確認を優先する。
6. 郵便番号がない地域はAGID、座標、行政区、地物、配送可能地点を主アンカーにする。
7. すべての出力に信頼度、警告、未検証項目、配送リスクを付ける。
8. raw住所を不要に出さず、目的に応じて粒度を制御する。
