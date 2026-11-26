# インド・中国と隣国の陸上国境

AGIDは、インド・中国と隣国との国境付近で、手動ピン、端末の測位範囲、発行済みIDのセルに重なる行政区域を照合する。国境線上では両側の国を候補に残す。河川・湖・氷河上にも行政界があるため、陸海の区分には別の地形資料を使う。

| 収録範囲 | 同梱した内容 |
| --- | --- |
| 広域の境界 | インドに接する6組、中国に接する14組。両国間の重複を除く19組で、Natural Earthの同一端点を持つ共有線分8,598本を抽出した。その周辺309区画（緯度・経度各1度）の行政形状を収録した。 |
| 詳細な境界 | インド側7区域と中国側11区域では、指定範囲をFieldMapsの行政形状で置き換えた。アタリ・ワガ、ダハグラム飛び地の北東境界、ラクセル・ビルガンジ、満洲里・ザバイカリスク、ホルゴス、エベレスト稜線などを含む。[18区域の座標](../scripts/data/india-china-borders/crossings.json) |
| 係争区域 | ジャンムー・カシミール、アクサイチン、アルナーチャル・プラデシュなど14地形に、根拠資料に基づく当事国の候補を割り当てた。形状を指定した区域の内側で適用する。[区域と根拠資料](../scripts/data/india-china-borders/disputes.json) |
| 判定を保留する区域 | ティンビガ回廊、サクテン、サー・クリーク河口、ススタ、リンピヤドゥラ・カラパニ・リプレク付近の5区域。資料を精査する範囲を矩形で定め、その範囲内で広域図による国の確定を抑止する。矩形が示すのは判定の適用範囲である。[範囲・理由・根拠資料](../scripts/data/india-china-borders/review.json) |

## ピン・測位誤差・既存ID

- 正確なピンが単一の通常行政区域の内側にある場合、`landBorder.codes` にその国コードを返す。共有辺では複数候補を保持し、地理判定は `needs-confirmation` となる。
- 端末の測位誤差が国境をまたぐ場合は、円の中心が片側にあっても両側を候補に含める。円が収録範囲からはみ出した場合は `partialCoverage` を返し、観測できた候補を示す。
- 係争地の内部では `disputedAreas` と `evidenceUrls` を返す。候補が異なる係争地の接点では、双方の候補を合わせる。資料確認中の範囲には `reviewAreas` が付き、その範囲単独で候補国は追加されない。
- 所属国の確認が必要な境界で新規発行すると、発行結果の `regionCode` は `BORDER_UNRESOLVED` となる。12文字・16文字IDのセル位置と、発行済みのIDから読み取る元の接頭辞は保持される。地理判定の `deliveryRegion` は常に `null` で、配送先は受取人の指定を使う。

例えばアタリ・ワガの収録地図では、次の緯度・経度が共有辺上にあり、`IN` と `PK` の両方が返る。

```sh
npm run agid -- geography --lat 31.6039325 --lon 74.5733387 --json
```

## 原典・利用条件

| 入力 | 同梱データの版 | 配布元 |
| --- | --- | --- |
| Natural Earth 行政地域形状（Admin 0 Map Units） | natural-earth-vector v5.1.2、1:10m（1,000万分の1） | [版固定GeoJSON](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_map_units.geojson) |
| FieldMaps International ADM0（USGS／LSIB） | 2025-07-29、`adm0_polygons.gpkg` | [GeoPackageの配布ZIP](https://data.fieldmaps.io/adm0/usgs/intl/adm0_polygons.gpkg.zip) |
| Natural Earth 係争区域形状（Admin 0 Disputed Areas） | natural-earth-vector v5.1.2、1:10m | [版固定GeoJSON](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_disputed_areas.geojson) |

Natural Earthの2データと、採用したFieldMapsのUSGS版はパブリックドメイン。境界や海岸線は各版の地図表現で、位置精度は地図の縮尺・出典に依存する。係争区域の当事国を選定した根拠は、地形形状の出典とともに参照できる。[Natural Earthの利用条件](https://www.naturalearthdata.com/about/terms-of-use/) · [FieldMaps USGS版の利用条件](https://fieldmaps.io/data/adm0/#us-geological-survey-public-domain)

## 再生成と検証

リポジトリ直下で実行する。Python 3.11以降、GDALのPythonバインディング（`osgeo.ogr`、GEOS対応）、`curl`、`unzip` が必要。生成スクリプトはGeoJSONの2ファイルと展開後のGeoPackageのSHA-256を固定値と照合する。FieldMapsの配布URLは固定版URLではないため、配布物が更新された場合は、記録されたハッシュと一致する保存済み原典を指定する。[生成スクリプトと固定ハッシュ](../scripts/build-india-china-land-borders.py)

```sh
border_inputs=$(mktemp -d)
curl -fL --retry 2 https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_map_units.geojson -o "$border_inputs/map-units.geojson"
curl -fL --retry 2 https://data.fieldmaps.io/adm0/usgs/intl/adm0_polygons.gpkg.zip -o "$border_inputs/fieldmaps.zip"
curl -fL --retry 2 https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_disputed_areas.geojson -o "$border_inputs/disputes.geojson"
unzip -p "$border_inputs/fieldmaps.zip" adm0_polygons.gpkg > "$border_inputs/adm0_polygons.gpkg"
python3 scripts/build-india-china-land-borders.py "$border_inputs/map-units.geojson" "$border_inputs/adm0_polygons.gpkg" "$border_inputs/disputes.geojson"
npm ci
node --import tsx --test src/lib/indiaChinaLandBorders.test.ts
```

テストでは18区域の共有辺と両側の座標、係争形状14件、判定保留5区域、収録範囲をまたぐ測位、旧IDの復号を確認する。[座標と期待値](../src/testFixtures/indiaChinaLandBorderPins.json)
