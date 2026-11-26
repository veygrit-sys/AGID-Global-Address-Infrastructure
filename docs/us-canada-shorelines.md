# 米国・カナダの島と水面の判定

米国・カナダの標準地図、CLI、ローカル住所解決で共通の陸水判定を使用する。下表の範囲は詳細データを調べるための検索窓である。ピンの国候補は、その点の陸地と行政区域の重なりから求める。水面に配送国を割り当てず、海岸線と行政資料が食い違う場所では判断を保留する。

| 収録範囲 | 確認する地形 |
| --- | --- |
| サリッシュ海 | サンフアン諸島、カナダのガルフ諸島、ポイント・ロバーツとその北側の本土 |
| エリー湖西部 | 米加の湖内島と、その間の湖面 |
| スペリオル湖西部 | アイル・ロイヤル、周辺の島と入り江 |
| セントローレンス川のサウザンド諸島 | ウルフ島、ウェルズリー島、島間の水路 |
| ファンディ湾西部 | カンポベロ島、グランドマナン島、メイン州イーストポート付近 |
| ディクソン海峡周辺、ハイダ・グワイの一部 | アラスカ州南東部、カナダのダンダス島、グレアム島 |
| メイン湾のノースロック周辺 | 露出岩、潮間帯、海面。陸地では米国・カナダ双方の領有主張を表示する |
| ユーコン準州の北岸 | ハーシェル島と周辺の水域 |
| アリューシャン列島の一部 | 東経側のシェミャ島、西経側のアダック島 |
| メンフレマゴグ湖 | ケベック州とバーモント州にまたがるプロヴィンス島、その南端を横切る国境と周辺の湖面 |
| メティゴシー湖 | マニトバ州とノースダコタ州の境にカナダの水系図が描く島、その北端の浅瀬と周辺の湖面 |

検索窓の緯度経度は各データに記録している。[主要10範囲](../scripts/data/us-canada-windows.json) · [ノースロック](../src/data/northRockShoreline.json) · [国境にかかる2島](../src/data/usCanadaDividedLakeIslands.json)

ピンに測位誤差が指定されている場合や、発行済みのAGIDから復号した場合は、範囲内で到達し得る陸水境界と行政境界も調べる。異なる国にまたがる場合や、詳細データが測位範囲の一部しか覆わない場合は確認を求める。本人が指定した配送国を保持する。地図の更新後も、発行済みの12文字・16文字IDは元のセルに復号できる。

## データと再生成

- 海岸・湖・湖内島・島内の池には、GSHHG 2.3.7のフル解像度の地形を使用する。北米本土と独立した島を元の地形IDで区別し、湖の中の陸地には湖面より深い階層を用いる。GSHHG © Paul Wessel and Walter H. F. Smith, LGPL-3.0-or-later。[原典](https://github.com/GenericMappingTools/gshhg-gmt/releases/tag/2.3.7) · [ライセンス・再配布条件](../scripts/data/national-island-points/licenses/GSHHG-LICENSE.txt)
- 行政区域はFieldMaps USGS/LSIB国際版（2025-07-29）と、カナダ統計局の2021年国勢調査州・準州地図で照合する。両国の行政区域は湖面にも延びるため、陸地であることを別に確認する。Adapted from Statistics Canada, 2021 Census Boundary Files. This does not constitute an endorsement by Statistics Canada of this product. [FieldMaps](https://fieldmaps.io/data/adm0/) · [カナダ統計局の資料](https://www150.statcan.gc.ca/n1/pub/92-160-g/92-160-g2021002-eng.htm)
- 五大湖とセントローレンス川では、オンタリオ州の *Great Lakes Islands (International)*（2010年版）と米国国勢調査局のTIGER/Line 2025 Area Hydrographyを併用する。州の台帳から島・自然島の地物を選び、対応する公的な地形の内側だけを採用する。アイル・ロイヤルとモット島にはスペリオル湖の水域に囲まれた輪郭を使い、島内の湖・池を差し引く。Contains information licensed under the Open Government Licence – Ontario. Ontario Ministry of Natural Resources © King's Printer for Ontario, 2023. [オンタリオ州配布データ](https://ws.gisetl.lrc.gov.on.ca/fmedatadownload/Packages/GreatLakesIslandsInt.zip) · [オンタリオ州ライセンス](https://www.ontario.ca/page/open-government-licence-ontario) · [TIGER/Line 2025水域データ](https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/)

- セントローレンス川のカナダ側は、オンタリオ州水系データの恒常的な河川水面3地物（OGF_ID 70428304、321973630、321974077）も使用する。島を囲む穴を保持し、ウルフ島付近の水路を行政上のカナダ陸地から切り分ける。[配布元](https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open01/MapServer/25) · [再生成用GeoJSON](https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open01/MapServer/25/query?where=OGF_ID+IN+%2870428304%2C321973630%2C321974077%29&outFields=OGF_ID%2COFFICIAL_NAME_LABEL%2CPERMANENCY&orderByFields=OGF_ID&outSR=4326&f=geojson)

Python 3.11以上、GDAL、Shapely 2、NumPyを使用する。FieldMapsは配布ZIPからGeoPackageを取り出し、TIGERのディレクトリに郡コード26083・36045・39043・39123の4つのZIPを置く。ビルダーは処理前に各入力ファイルのSHA-256を確認する。[FieldMaps配布ZIP](https://data.fieldmaps.io/adm0/usgs/intl/adm0_polygons.gpkg.zip) · [カナダ州・準州地図のZIP](https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/files-fichiers/lpr_000b21a_e.zip)

```sh
python3 scripts/build-us-canada-shorelines.py \
  --gshhg-archive gshhg-shp-2.3.7.zip \
  --fieldmaps-gpkg adm0_polygons.gpkg \
  --statcan-archive lpr_000b21a_e.zip \
  --ontario-archive GreatLakesIslandsInt.zip \
  --ontario-river ohn-st-lawrence.geojson \
  --census-directory tiger-2025
npm run verify:agid-islands
```

国境にかかる2島は専用のビルダーで再生成する。Python 3.11以上とGDAL、Shapely 2、pyprojを使用する。次のコマンドは指定したディレクトリに米国NHDの湖2件、カナダNHNの水系区画05NFC00 v2.0、IBC国境線 v1.3の4ファイルを取得し、SHA-256を検証してから処理する。入力がすべてある場合は `--download` を省略できる。[再生成スクリプトと原典のURL・ハッシュ](../scripts/build-us-canada-divided-lake-islands.py)

```sh
python3 scripts/build-us-canada-divided-lake-islands.py divided-island-inputs --download
npm run verify:agid-islands
```

## 国境をまたぐ島

島全体が地図上で米加にまたがる場合、確認できた陸地では `sharedIslandCountryCodes` に `CA` と `US` を記録する。ピンの国候補（`regionCandidates`）は、資料で陸地を確認できる範囲と、国際境界委員会（IBC）の地図用国境線から求める。この国境線は両区間の国境標・折点の座標に基づく。[IBCデジタル国境線 v1.3](https://www.internationalboundarycommission.org/en/maps-coordinates/coordinates.php)

| 検索窓 | 緯度（南端～北端） | 経度（西端～東端） |
| --- | --- | --- |
| プロヴィンス島 | 45.0028 ～ 45.0144 | −72.2410 ～ −72.2270 |
| メティゴシー湖の島 | 48.9969 ～ 48.9998 | −100.3553 ～ −100.3532 |

**プロヴィンス島（Île de la Province）** は大部分がケベック州にあり、南端がバーモント州に入る。米国NHDのメンフレマゴグ湖水域に囲まれた島の輪郭にIBC第11区間を重ねると、北緯45度より北でも米国になる地点がある。陸上の国境標571では両国を候補として確認を求め、国境線の延長上でも湖面にある点では国候補を返さない。[ケベック州地名委員会の地名録](https://toponymie.gouv.qc.ca/ct/ToposWeb/Fiche.aspx?no_seq=141213) · [米国NHDの湖水域2771880](https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/12/2771880) · [IBC国境標座標表、4ページ](https://www.internationalboundarycommission.org/uploads/maps/11-west_line_qc-vt/west%20line%20qc-vt%20%28french%29.pdf#page=4)

**メティゴシー湖の島** は、カナダ天然資源省の水系図（NHN）では国境をまたいでつながる。米国地質調査所の水系図（NHD）は、IBC第20区間の両側に離れた陸地を描いている。米国農務省の2019年・2022年・2023年の航空写真でも、北側の小区画には安定した陸地を確認できない。国境付近のつなぎ目と北側の小区画は陸水・国とも要確認とする。双方の水系図で陸地と確認できる南側では米国を、双方が湖面を示す周辺では水面を返す。[カナダNHN](https://open.canada.ca/data/dataset/a4b190fe-e090-4e6d-881e-b87956c07977) · [米国NHDの湖水域2166435](https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/12/2166435) · [2023年8月6日のNAIP航空写真](https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer/117792)

| 島・検証点 | 緯度、経度 | 陸水とピンの国候補 |
| --- | --- | --- |
| プロヴィンス島・ケベック州側 | 45.008670, −72.232350 | 陸地、CA |
| プロヴィンス島・バーモント州側 | 45.004310, −72.231000 | 陸地、US |
| プロヴィンス島・国境標571 | 45.004891944, −72.231484167 | 陸地、CA・US。配送国は要確認 |
| プロヴィンス島沖・湖上の国境 | 45.004833584, −72.234500 | 湖面、国候補なし |
| メティゴシー湖・島の南側 | 48.998450, −100.354330 | 陸地、US |
| メティゴシー湖・国境付近のつなぎ目 | 48.9993282, −100.354000 | 陸水は要確認、国候補なし |
| メティゴシー湖・北側の浅瀬 | 48.999400, −100.353920 | 陸水は要確認、国候補なし |
| メティゴシー湖・島の西方 | 48.999050, −100.355000 | 湖面、国候補なし |

プロヴィンス島の米国側（45.004796456, −72.231250）では、測位半径3 mなら米国に収まり、18 mなら島内の国境を越えて両国が候補に入る。[座標別の回帰テスト](../src/lib/usCanadaDividedIslands.integration.test.ts)

## ノースロック

カナダ天然資源省のCanVec 1:50,000（ニューブランズウィック州）の陸域と水域を照合する。露出岩の内部では係争地として米国とカナダの主張を表示し、配送国は未指定にする。灯火の公表座標は潮間帯と資料間で輪郭の異なる部分に該当するため、所属も陸水も自動確定しない。沖の恒常水域には島の情報を付けない。[米国官報](https://www.govinfo.gov/content/pkg/FR-2023-12-21/pdf/2023-28158.pdf) · [カナダ沿岸警備隊の灯火表](https://notmar.gc.ca/publications/list-lights/atl/atl58-en.php) · [原典・再生成スクリプト](../scripts/build-north-rock-shoreline.py)

| 検証点（緯度、経度） | 判定 |
| --- | --- |
| 44.53777, −67.08670 | 露出岩。主張国CA・US、確定した所属国は空欄 |
| 44.53772222, −67.08716667 | 灯火。陸水と所属は要確認 |
| 44.53900, −67.08900 | 海面。住所用の国候補なし |

## 代表地点での比較

変更前（`89f45eb7`）と変更後に、地名台帳・国立公園の施設・空港で位置を確認した島19地点と、観測ブイ・湖底調査地点で位置を確認した水域4地点を同じ条件で比較した。地理判定は陸水・島の区別・国候補のすべてが一致した場合を数え、ID発行は陸上で正しい国の接頭辞、水面で水域判定を返した場合を数えた。この23地点は難所を選んだ回帰検証である。[座標と期待結果](../src/lib/usCanadaShorelines.integration.test.ts)

| 検査 | 変更前 | 変更後 |
| --- | ---: | ---: |
| 地理判定が期待結果と一致 | 10 / 23 | 23 / 23 |
| 新規発行時に正しい国または水域を返す | 12 / 23 | 23 / 23 |

エリー湖のミドル島では、半径800 mの測位範囲が湖上の国境に届いても住所候補はカナダのみとなる。ミドル島と米国ケリーズ島の間では、半径7 kmが両側の陸に達するため両国を候補に残す。
