# カリブ海と米国の小島・水路の判定

カリブ海と周辺の北大西洋、米国の沿岸・五大湖・太平洋諸島の30区域で、個々の島の陸地、水面、住所に使う国・地域の候補を照合する。各区域の外枠は詳細図を照合する範囲を表す。島の形は外枠の中にある陸地のポリゴンで定める。

| 地域 | 区域数 | 詳細図の対象 |
| --- | ---: | --- |
| プエルトリコ・ヴァージン諸島 | 5 | クレブラ島とクレブリタ島、カハ・デ・ムエルトス島とモリリト島、セントクロイ沖のバック島、米英領間のザ・ナローズ、英領のフォールン・エルサレム島とヴァージン・ゴルダ島。[区域データ](../src/data/caribbeanTerritorialIslandsReviewed.json) |
| 大アンティル・ルカヤン諸島 | 6 | ジャマイカのライム・キー、リトルケイマン島とオーウェン島、バハマのウォーダリック・ウェルズ島、タークス・カイコスのソルト・キー、ドミニカ共和国のカタリナ島、キューバのカヨ・ラルゴ島。バハマとタークス・カイコスの対象水面は北大西洋。[区域データ](../src/data/greaterAntillesIslandsReviewed.json) |
| 小アンティル諸島 | 5 | 仏領サン・マルタンのピネル島、サン・バルテルミのフルシュ島、グアドループのプティット・テール諸島、マルティニークのル・ロベール沖、セントビンセント・グレナディーンとグレナダの間の海峡。[区域データ](../src/data/lesserAntillesIslandsReviewed.json) |
| 米国東部・メキシコ湾・五大湖 | 5 | ドライ・トートゥガス、ボストン港の島々、ノースカロライナ州バーデン水道、ニューヨーク港のリバティ島とエリス島、スペリオル湖のデビルズ島。[区域データ](../src/data/usAtlanticIslandsReviewed.json) |
| ハワイ・カリフォルニア・アラスカ | 5 | モクルア諸島、モロキニ島の火口と海面、アナカパ島の東島・中島、セント・ラザリア諸島、ベーリング海峡の米露のダイオミード諸島。[区域データ](../src/data/usPacificIslandsReviewed.json) |
| 米国の太平洋諸地域 | 4 | グアム沖のココス島、北マリアナのマニャガハ島、米領サモアのアウヌウ島、ミッドウェー環礁のサンド島・イースタン島とその間の海面。[区域データ](../src/data/usPacificTerritoriesReviewed.json) |

広域判定にはNatural Earthの地図単位を使う。既存のカリブ海・オセアニアの追加分は、サン・マルタン、シント・マールテン、アンギラ、サン・バルテルミ、英領・米領ヴァージン諸島、グアム、北マリアナ、サモア、米領サモアの10地域。地図単位の全体と島間の水路を照合し、詳細図を収録した区域では細かい海岸線を優先する。[広域図の生成定義](../scripts/build-country-map-units.mjs) · [Natural Earthの利用条件](https://www.naturalearthdata.com/about/terms-of-use/)

## ピンと測位範囲

| 地点（緯度、経度） | AGIDの結果 |
| --- | --- |
| ホイッスリング・キー（18.3700407, −64.7567083）とグレート・サッチ島（18.3862047, −64.7412265） | 前者は米領ヴァージン諸島 `VI`・主権国 `US`、後者は英領ヴァージン諸島 `VG`・主権国 `GB`。両島は近接するが別々の陸地。 |
| ザ・ナローズ（18.378, −64.741） | 測位半径300 mでは海面で住所国候補なし。550 mでは英領側の陸地に届き `VG` が候補、800 mでは米領側にも届き `VG` と `VI` が候補。 |
| 英領ケイマン諸島のオーウェン島（19.6641069, −80.0628931）とリトルケイマン島への水路（19.666952, −80.065412） | 島の住所地域は `KY`、主権国は `GB`。島間はカリブ海の水面で住所国候補なし。 |
| フルシュ島（17.9566896, −62.9008984） | 島の陸地。住所地域はサン・バルテルミ `BL`、主権国はフランス `FR`。 |
| スペリオル湖デビルズ島のキャンプ場（47.06332841, −90.72800654）と西側（47.068, −90.735） | キャンプ場は島の陸地で `US`。西側は淡水で住所国候補なし。 |
| モロキニ島の火口縁（20.63193, −156.49384）と内側（20.6323, −156.4958） | 火口縁はハワイの島で `US`。三日月形の火口内の水面は北太平洋。 |
| ミッドウェーのサンド島（28.202, −177.3775）、イースタン島（28.207, −177.3291）、礁湖（28.22, −177.367） | 2島の地理上の地域コードは米国領有の `UM`。礁湖は海面で住所国候補なし。 |
| 小ダイオミード島（65.7522073, −168.9407223）、大ダイオミード島（65.7685158, −169.0380898）、両島間（65.761, −168.976） | 順に米国 `US`、ロシア `RU`、ベーリング海の水域。 |

海岸や小さな岩礁で資料が食い違う場合は陸水または住所国を要確認とする。領有主張のあるナヴァッサ島では米国とハイチの主張を表示し、配送用の国は自動選択しない。行政地域コードと主権国コードを別々に返し、ミッドウェーの `UM` は米国領有の地理上の地域コードとして使う。地理判定から配達可否は確定しない。既存の12文字・16文字IDは発行時と同じセルに復号する。再判定ではセル全体を調べ、新規発行時には更新済みの地理判定を使用する。[回帰テストと旧ID](../src/lib/caribbeanUsIslands.integration.test.ts)

## 原典と再生成

米国では2025年TIGER/Lineの水域・海岸地形とESA WorldCoverの2020年版・2021年版の画素を照合する。ミッドウェー環礁はWorldCoverのタイルがなく、GSHHG 2.3.7の島の輪郭、Copernicus GLO-30の標高、JRC Global Surface Water v1.4の水面履歴を照合する。カリブ海ではFieldMaps International ADM0のUSGS/LSIB版、仏領ではフランスIGNのADMIN EXPRESS COGとBD TOPOの地名を使う。海図上の領海や国立公園の水域が陸地として塗られるのを防ぐため、海につながる水面と島の陸地を個別に識別する。区域ごとの入力版と追加の標高資料、帰属表示はJSONの `version`、`attribution`、`evidenceUrls` に収録した。[米国国勢調査局](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html) · [ESA WorldCoverとCC BY 4.0](https://esa-worldcover.org/en/data-access) · [FieldMaps USGS版](https://fieldmaps.io/data/adm0/) · [IGNの利用条件](https://geoservices.ign.fr/cgu-licences) · [AGIDデータの利用条件](../DATA_LICENSES.md)

地名と水路を照合した資料には、米国海洋大気庁の航路誌、カイマン諸島政府の海岸地図、英領ヴァージン諸島国立公園トラストの地形説明、米国国立公園局のキャンプ場座標がある。[NOAA Coast Pilot 5 第14章](https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp5/CPB5_C14_WEB.pdf) · [リトルケイマン地図](https://doe.ky/wp-content/uploads/2021/04/Little_Cayman_Boundary_Maps.pdf) · [フォールン・エルサレム国立公園](https://www.bvinpt.org/fallen-jerusalem-national-park-info) · [デビルズ島のキャンプ場座標](https://www.nps.gov/apis/planyourvisit/campsite-gps.htm)

Python 3.11以上、GDAL、NumPy、Shapely 2を使う。下の入力ディレクトリにFieldMaps国際USGS版（2025-07-29）のGeoPackageを展開し、GSHHG 2.3.7シェープファイルの配布ZIPを置く。各ビルダーが元資料または抽出画素のSHA-256を照合する。[FieldMaps配布ZIP](https://data.fieldmaps.io/adm0/usgs/intl/adm0_polygons.gpkg.zip) · [GSHHG 2.3.7シェープファイル配布元](https://github.com/GenericMappingTools/gshhg-gmt/releases/tag/2.3.7)

```sh
inputs=../agid-caribbean-us-inputs
fieldmaps="$inputs/adm0_polygons.gpkg"
gshhg="$inputs/gshhg-shp-2.3.7.zip"
python3 scripts/build_caribbean_territorial_islands.py --fieldmaps-gpkg "$fieldmaps"
python3 scripts/build_greater_antilles_islands.py --fieldmaps-gpkg "$fieldmaps"
python3 scripts/build_lesser_antilles_islands.py --source-directory "$inputs/lesser-antilles" --fieldmaps-gpkg "$fieldmaps"
python3 scripts/build_us_atlantic_islands.py "$inputs/us-atlantic" --download
python3 scripts/build_us_pacific_islands.py "$inputs/us-pacific" --download
python3 scripts/build_us_pacific_territory_islands.py "$inputs/us-territories" --download --gshhg-archive "$gshhg"
node --import tsx --test src/lib/caribbeanUsIslands.integration.test.ts
```
