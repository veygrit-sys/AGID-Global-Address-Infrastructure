# 飛び地・包領の判定資料

この地図は、飛び地の行政上の位置と、ピンがある陸地の地形を別々に扱う。例えばテンブロンはボルネオ島にあるブルネイの沿岸飛び地で、島の残りの部分にはこのラベルを付けない。リコマ島とチズムル島はマラウイ領の湖の島で、周囲のモザンビーク水域まで島の所属表示を伸ばさない。

| 収録例 | 実装の扱い |
| --- | --- |
| バールレ | ベルギーの22区画、うち2区画の内部にあるオランダの二重飛び地7区画、ベルギー本土内にあるオランダの飛び地N8を区別する。オランダの周辺本土は同国地籍の自治体形状で照合する |
| ビュージンゲン、リビア、カンピョーネ、マダ、ナハワ | 国境の実形状を使い、マダの内側のナハワがアラブ首長国連邦領であることも表現する。ビュージンゲンの公的行政界にはライン川の一部も含まれる |
| フェルガナ周辺 | ウズベキスタンのソフ・ショヒマルドン、タジキスタンのヴォルフ・ロラゾル・サルヴァンを収録。2024年に飛び地でなくなったバラクは現行の飛び地台帳に含めない |
| ナヒチェヴァン、カリーニングラード、カビンダ | 周囲の国と、そのピンで実際に接する国を区別する。ナヒチェヴァンとトルコの国境上の候補はAZとTR |
| アラスカ本土、ポイント・ロバーツ、ムサンダム、テンブロン、オエクシ | 本土と陸続きでない沿岸の行政領域。別の沖合の島は本土用の形状から除く |
| リコマ島、チズムル島 | マラウイの行政形状とGSHHGの湖内島地形が重なる陸地だけを扱う |
| 旧フェン鉄道の5飛び地、ユングホルツ、メジュレチェ | 各地域を二つの境界資料で照合する。ドイツとベルギーが交互に現れる旧線路敷、チロル本土との一点接続、セルビアに囲まれたボスニアの飛び地を区別する。[区画・データ・検証地点](europe-complex-borders.md) |
| サンマリノ、バチカン、レソト | 各国の国土全体が一つの外国に囲まれている独立国として表示する |

一点で本土に接するユングホルツを含め、33の地域・区画グループが60の領域を表す。バールレの30区画は同じ行政関係の3グループにまとめた。湾、湖、国境線、島内の行政線は領域の外接長方形から推定しない。元の海岸線の縮尺、河川や湖の収録範囲、測位誤差によって保留になることがある。行政上の飛び地ラベルは配送先を決めるデータではない。

配信用形状の検証では、符号化前のGDAL/GEOS形状から取得した周辺13,125点（内側3,249点）をJavaScriptの判定と照合し、相違は0件だった。バールレでは別に地籍上の30区画と周辺本土から選んだ4,000点で、公開APIが国・飛び地の種別・地形を正しく区別した。精度は地図の版・縮尺に依存する。

## 出典・再生成

- バールレはオランダ地籍局KadasterのBRK Bestuurlijke Gebieden 2026を使用。Baarle-Nassau自治体最大部分の22個の穴と、飛び地に対応する8つのオランダの非連続部分を個別に検証し、7つの二重飛び地をベルギー側の形状から除いた。元座標をWGS84の小数7桁に丸め、配信用に差分符号化した。出典表記はKadaster、CC BY 4.0。[自治体境界の説明](https://www.kadaster.nl/zakelijk/producten/percelen-en-grenzen/bestuurlijke-gebieden) · [ライセンス](https://data.overheid.nl/dataset/81774-bestuurlijke-gebieden) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · [自治体資料による区画数の確認](https://www.baarle-nassau.nl/fileadmin/Bestanden_BaarleNassau/Projecten/Masterplan_Centrum_Baarle.pdf)
- ビュージンゲンは既存のswissBOUNDARIES3D 2026-01を再利用。[境界再生成コード](../scripts/build-buesingen-boundary.py) · [swisstopo利用条件](https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices)
- アラスカ本土はNatural Earthの1:10m Map Units v5.1.2、その他の対象地域・周辺領域はFieldMaps International ADM0 USGS/LSIB 2025-07-29の正の行政形状を使う。水域と別の島はGSHHG 2.3.7の原典地形で除外。これによりアラスカ本土・カリーニングラードの粗い図と細かい海岸線が食い違うとき、独立した海の島を本土飛び地に取り込む問題を抑える。アラスカに属する島をアラスカ本土として分類しない。GSHHG由来の地形のライセンスはLGPL-3.0以降。[Natural Earth](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2) · [FieldMaps](https://fieldmaps.io/data/adm0/) · [GSHHGのソースと元アーカイブ](https://github.com/GenericMappingTools/gshhg-gmt/releases/tag/2.3.7) · [ライセンス・原著作権表示](../scripts/data/national-island-points/licenses/)
- 地形と行政上の飛び地が重なる事例には政府資料を併用した。マラウイの2島では湖上の行政範囲をGSHHGの各湖内島・水面で切り抜く。キルギス・タジキスタンの資料は地名と境界の更新確認にも使用。[マラウイ地名資料](https://assets.publishing.service.gov.uk/media/68aee2f02f1856648215588f/Malawi_Toponymic_Factfile.pdf) · [ブルネイ政府観光局のテンブロン資料](https://www.bruneitourism.com/wp-content/uploads/2025/03/Brunei-Tourism-Temburong-Brochure-3.pdf) · [東ティモール政府によるオエクシの説明](https://timor-leste.gov.tl/?lang=en&p=91) · [キルギス地名資料](https://assets.publishing.service.gov.uk/media/68dfa392c487360cc70ca0ba/Kyrgyzstan_Toponymic_Factfile.pdf) · [タジキスタン地名資料](https://assets.publishing.service.gov.uk/media/691c7a7f5a253e2c40d706d8/Tajikistan_Toponymic_Factfile.pdf)

準備するデータは[世界の島の高精細SQLite](high-resolution-island-pack.md)、[Natural Earth地図単位](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_map_units.geojson)、[Baarle-Nassau自治体の個別GeoJSON](https://api.pdok.nl/kadaster/brk-bestuurlijke-gebieden/ogc/v1/collections/gemeentegebied/items/f6a469a5-f2f0-53a9-8402-5635437577ef?f=json)。Python 3とGDAL/OGR・GEOSを使用する。再生成コードは元の版・行政部分・地籍座標のダイジェストを確認する。地籍が更新された場合は手動で原典を再確認する。点照合の境界候補には、選んだ行政区画と隣の行政区画に共通する線分だけを使う。

```sh
/usr/bin/python3 scripts/build-territorial-exclaves.py world.sqlite ne_10m_admin_0_map_units.geojson baarle-nassau.json
node --import tsx --test src/lib/territorialExclaves.test.ts
```
