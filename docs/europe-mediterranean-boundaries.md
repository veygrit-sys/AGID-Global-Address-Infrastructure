# 地中海・欧州本土・海外領の国境と島

AGID は元のピン、端末が返した測位誤差、保存した AGID のセルをそれぞれ評価する。陸上の位置が二つの国・地域に接すると両方を、三国境では接した全地域を `regionCandidates` に返す。返却順はコード順で、優先順位を表さない。配送先の国・地域は本人の指定を使う。

| 地点 | 判定例 |
| --- | --- |
| ゴリツィア／ノヴァ・ゴリツァ | 国境の西側は IT、東側は SI。国境上または測位範囲が国境にかかる場合は IT・SI。 |
| ファールセルベルク | 三国境は BE・DE・NL。付近でも位置精度が十分なら、その側の1か国。 |
| メッシーナ海峡、ボニファシオ海峡 | 岸の島と海峡の水面を分ける。水面の国・地域候補は空。 |
| フェザント島 | 仏西共同管理の島内は ES・FR。ビダソア川の恒常水域は水面、間欠水域は要確認。両岸はそれぞれの国。 |
| マーケット島 | 灯台のある側はオーランド諸島 AX（主権国 FI）、対岸側は SE。中央境界標の乾いた地面では AX・SE。 |
| サン・マルタン島 | マリゴは MF（FR）、フィリップスブルフは SX（NL）。島内の国境では MF・SX。隣のアンギラは AI。 |
| フランス領ギアナ | カイエンヌは GF。サリュ諸島のロワイヤル島、サン・ジョゼフ島、ディアブル島の地名点は GF（FR）で、島間の水道には国を付けない。 |

## 範囲と資料の読み方

- 欧州・地中海周辺とギアナの大陸部に、周辺国を含む計64地域コードの陸地ポリゴンを収録した。FieldMaps の国境を Natural Earth の大陸陸地と重ね、同資料の係争域・湖を除いた後、隣り合う境界を一緒に簡略化した。簡略化許容値は 0.00065 度。国境線の測量誤差をメートルで保証する値ではない。[広域の収録範囲](../scripts/data/europe-overview-windows.json)
- 海岸・島・国境の55か所では GSHHG の全解像度の海岸・湖・湖中島を、FieldMaps の行政境界と突合する。地中海両岸と欧州の島に加え、グリーンランド、フェロー、サンピエール、レユニオン、キュラソー、バミューダ、ウォリス、ニューカレドニアなどの対象区画を含む。島の一部を対象とする区画もある。各区画の四辺は `[西, 南, 東, 北]`。[詳細な55区画](../scripts/data/europe-shoreline-windows.json)
- 沖合は22区画で 1/16 度のタイルを使う。Natural Earth Ocean に属し、Natural Earth の陸地・小島、GSHHG、FieldMaps の陸地のいずれにも触れないタイルを採用する。海岸や小島に触れるタイルは他の資料で判定する。GPS やセルの範囲を水面と確定するには、その全体について水面の根拠が必要になる。
- 詳細図の海岸と行政資料が一致しない地点や潮間帯では国の確定を保留する。係争地には既存の主張・施政の記録を適用する。細い河川、図に収録されない小島、時点の異なる海岸、区画外の陸地には追加調査が必要になる。水面は領海や配送可否の判定を表さない。

## 個別測量の根拠

**ビダソア川。** フランス外務省が共同管理を説明するフェザント島について、IGN の地名点 `PAIOROGR0000000025029774` を囲む河川ポリゴンの内周を使う。恒常水域、間欠水域、島の内部を別々に評価する。地名点の周囲に一定半径を与えて島とする処理はない。[フランス外務省の資料](https://www.diplomatie.gouv.fr/files/files/le-ministere/lieux-emblematiques/13_notice_hendaye-faisans_complete_v2.pdf) · [入力地物](../scripts/data/bidasoa)

**サリュ諸島。** IGN BD TOPO の3地名点をそれぞれ囲む満潮線と干潮線を照合する。両者が陸地を示す部分と、カイエンヌ市（INSEE 97302）の行政ポリゴンが重なる地点に GF を付ける。IGN の地物 ID と更新時点を入力に保存した。Géoplateforme の WFS では `BDTOPO_V3:detail_orographique`、`surface_hydrographique`、`limite_terre_mer`、`commune` の各レイヤーを使う。[IGN BD TOPO](https://geoservices.ign.fr/bdtopo) · [CNES の諸島解説](https://cnes.fr/geoimage/iles-salut) · [入力地物](../scripts/data/iles-du-salut)

**マーケット島。** フィンランド・スウェーデンの2006年国境画定記録にある11個の標識を公表順に結ぶ。両国の行政輪郭内で、中央境界標とつながる ESA WorldCover 2021 の陸地を抽出し、水際から1画素を除いた範囲を分割する。標識自体の精度を世界の海岸線に一律適用することはできない。[フィンランド国土地理庁](https://www.maanmittauslaitos.fi/en/stateboundaries) · [二国間の画定資料 7.1・7.3節、地図49](https://www.maanmittauslaitos.fi/sites/maanmittauslaitos.fi/files/Suomen_valtakunnanrajat/FIN-SWE_Valtakunnanraja_Riksgr%C3%A4nsen_2006/FIN-SWE_Gr%C3%A4nsen_Dokumentena.pdf) · [ESA WorldCover](https://esa-worldcover.org/en/data-access)

## 再生成と検証

Python、GDAL/OGR、Shapely 2.1 以降、NumPy を使用する。マーケット島には SciPy と pdftotext も必要になる。Natural Earth は natural-earth-vector v5.1.2 の GeoJSON、GSHHG は 2.3.7 の Shapefile アーカイブ、FieldMaps は 2025-07-29 の international USGS/LSIB GeoPackage を与える。生成スクリプトが元データのチェックサムを検査する。[Natural Earth v5.1.2](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2/geojson) · [GSHHG](https://www.soest.hawaii.edu/pwessel/gshhg/) · [FieldMaps](https://fieldmaps.io/data/adm0/)

~~~sh
python3 scripts/build-europe-overview.py \
  --units ne_10m_admin_0_map_units.geojson --land ne_10m_land.geojson \
  --disputes ne_10m_admin_0_disputed_areas.geojson --ocean ne_10m_ocean.geojson \
  --minor ne_10m_minor_islands.geojson --lakes ne_10m_lakes.geojson \
  --gshhg-archive gshhg-shp-2.3.7.zip --fieldmaps-gpkg adm0_polygons.gpkg
python3 scripts/build-europe-shorelines.py \
  --gshhg-archive gshhg-shp-2.3.7.zip --fieldmaps-gpkg adm0_polygons.gpkg
python3 scripts/build-market-island.py world.sqlite FIN-SWE_Gränsen_Dokumentena.pdf
npm run verify:agid-geography
npm run verify:agid-islands
npm run verify:agid16
~~~

代表36地点の固定テストで、陸海・地域コードと、指定がある地点の島区分・主権国がすべて一致した地点は変更前16件、変更後36件。欧州全域の推定正解率ではない。別のテストで国境の両側、測位誤差、三国境、旧12文字・16文字コードの再解決、配送国の明示選択を検査する。[検証地点と期待値](../src/lib/europeGeography.integration.test.ts) · [地理データのライセンス](../DATA_LICENSES.md)
