# 小島の判定と国・地域別の収録範囲

同梱地図では、小島の陸地と、その座標を含む行政地域を別々に照合する。Natural Earth v5.1.2 の Minor Islands 全2,795地物に、通常の地図単位と小島レイヤーに含まれない実在の物理地形3件を加えた。この補足層の2,798件は地図上の地物数で、世界の島の総数や固有名の数を表さない。天然の微小岩、新しい埋立地、極域などに収録限界がある。[Natural Earth Minor Islands](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-minor-islands/)

| FieldMapsの行政上の陸域との照合結果 | 補足層の地物数 | ピンを置いたときの扱い |
| --- | ---: | --- |
| 地物の全域が一致 | 28 | 陸域内で地域コードを返す |
| 地物の一部が一致 | 2,309 | 重なる部分だけに地域コードを付け、残りの陸地は所属未確定とする |
| 確定可能な地域と重なる部分がない | 461 | 島の陸地として返し、所属は未確定とする |

行政上の根拠にはFieldMapsの2025年7月29日版のうち、USGS海岸線を使うInternational ADM0を採用した。例えばトケラウの検証点では、地図上の地域コードはTK、上位国のコードはNZとなる。係争地の表示方針と日本の主張を適用する地物は、これら一般地図の地域コードより優先する。郵送先は本人が指定する。[FieldMaps配布元](https://fieldmaps.io/data/adm0/) · [版・原典・ハッシュ](../src/data/minorIslands/manifest.json)

[国・地域別CSV](island-region-coverage.csv) は一般地図で帰属候補を持つ168の地域コードを掲載している。2列目にはNatural Earthの非係争扱いの行政地物数、3列目には独立したFieldMapsの行政根拠が一部以上で得られた小島地物数を記録した。表は個別の領土表示方針を適用する前の原典の収録状況を示す。共有島には複数の行政地物があり、データセット間には重なりがあるため、列の合計は実在する島数に換算できない。

## 再現手順

小島データの生成にはPython 3.12とShapely 2.1.2を使用した。生成器は入力ファイルのSHA-256を検証する。地物の水際で行政コードが不当に広がるのを防ぐため、簡略化した行政との重複形状を原典の重複領域で再度切り取り、小数点以下6桁で格納する。国・地域別CSVの再計算と回帰試験には同梱データを使う。

```sh
python scripts/build-minor-islands.py ne_10m_minor_islands.geojson ne_10m_land.geojson adm0_polygons.gpkg
node scripts/island-region-coverage.mjs > docs/island-region-coverage.csv
node --import tsx --test src/lib/minorIslands.test.ts src/lib/agidIslandCountryIntegration.test.ts
```

[回帰試験](../src/lib/minorIslands.test.ts) は2,798地物が空間索引から取得できることを全件検査する。[住所判定の試験](../src/lib/agidIslandCountryIntegration.test.ts) では、イスパニョーラ島・ティモール島・アイルランド島の両側や海外領の実地点で確認する。
