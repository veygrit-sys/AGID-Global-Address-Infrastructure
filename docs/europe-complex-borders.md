# 欧州の飛び地・一点で接する国境

AGID は下記3地域で、二つの境界資料を同じ座標でそれぞれ照合する。両方が同じ国を示す陸地では1か国を返す。国境そのもの、両資料の線の間、測位誤差や保存セルが両側に及ぶ場合には、関係する2か国をコード順で返す。資料間の不一致がピンまたはセルの中心にある場合は `administrativeSourceDisagreement` も返し、地図と CLI で理由を示す。配送先の国・地域は受取人が指定する。

| 対象 | 判定できる地形・区画 | ピンの検証例（緯度、経度） |
| --- | --- | --- |
| ベルギー・ドイツの旧フェン鉄道 | Münsterbildchen、Roetgener Wald、Rückschlag、Mützenich、Ruitzhof の5飛び地。ドイツ本土と飛び地の間はベルギー領の旧線路敷 | 緯度50.59755では、経度6.24740でドイツの飛び地、6.24873でベルギーの線路敷、6.24930でドイツ本土。6.24845の測位誤差は半径1 mならドイツ、6 mなら両国 |
| オーストリア・ドイツのユングホルツ | ゾルクシュローフェンでチロル本土と一点だけ接する。周囲の四つの区画でユングホルツ、オーストリア本土、ドイツ領2方向を区別する | BEVの共通頂点（47.5557974, 10.4544275）は AT・DE。北側のユングホルツと南側のチロル本土はともにATで、ユングホルツ側だけに同地域名を表示 |
| セルビアに囲まれたメジュレチェ（サスタヴツィ） | ボスニア・ヘルツェゴビナの飛び地と周囲のセルビア領。2013年を表すボスニア側資料、2017年を表すセルビア側資料の境界線には差がある | 緯度43.555では、経度19.41585でBA、19.434でRS、19.404でBA・RS。資料の年代と線の違いを確認できる |

国境の両側が候補になる場所で新規発行するAGIDには、中立の地域接頭辞を使う。旧12文字・16文字コードは同じセルを引き続き指し、住所書式の候補は現在の地図から求める。例えば以前 `RS0GXC6RHZEM` として発行したメジュレチェ内部のセルは、住所書式の候補がBAになる。

## 図形の根拠

- **旧フェン鉄道**　ベルギー連邦財務省CadGISの6自治体を結合し、5個の穴をドイツ・ノルトライン＝ヴェストファーレン州DVG1の5個の非連続な領域と1件ずつ照合した。各対について内部の参照点が両資料に入り、共通部分が和集合の96%以上を占めることを検査する。線路の幅は各資料のポリゴンに従う。[ベルギー連邦財務省](https://finances.belgium.be/fr/experts-partenaires/donnees-ouvertes-patrimoine/jeux-donnees/unites-administratives) · [NRW DVG1](https://www.opengeodata.nrw.de/produkte/geobasis/vkg/dvg/dvg1/) · [米国地名委員会の5飛び地一覧](https://geonames.nga.mil/geonames/GNSSearch/GNSDocs/policies/Belgium_Country_Policy_webversion_Latest.pdf)
- **ユングホルツ**　オーストリアBEVの2026年4月1日時点の自治体境界と、ドイツ・バイエルン州ALKISの2026年10月31日版を照合した。BEV GIS-Grid 2021で座標変換し、ユングホルツと周辺のチロル側自治体が共有する頂点が一つであることを検査する。[BEV VGD](https://doi.org/10.48677/2d7b8f24-deb9-42eb-82f2-c7c1c7ff7075) · [バイエルン州測量局](https://www.ldbv.bayern.de/produkte/liegenschaftsinformationen/verwalt_grenzen.html) · [インスブルック大学チロル地図帳](https://tirolatlas.uibk.ac.at/wsgi/places/show?id=170818&lang=de)
- **メジュレチェ**　geoBoundariesの国別データから、ボスニア・ヘルツェゴビナの分離領域と、セルビアの国土ポリゴンの穴を個別に取り出した。元の年代・出典・各輪郭を保持する。現在の地籍による位置精度は未検証。[ボスニアの資料](https://www.geoboundaries.org/api/current/gbOpen/BIH/ADM0/) · [セルビアの資料](https://www.geoboundaries.org/api/current/gbOpen/SRB/ADM0/) · [サスタヴツィの地理研究](https://doiserbia.nb.rs/Article.aspx?id=0350-75990757325C)

地表の判定にはGSHHG 2.3.7全解像度、ESA WorldCover 2021 v200の水域画素、旧フェン鉄道沿いではNRWのATKIS水域図を使う。NRWの水域28面にはダム湖Dreilägerbachtalsperreが含まれる。水面には配送国候補を付けない。衛星で水域と分類された範囲の縁は1画素分を未確定にする。面として収録されていない細い川や最新の水際には別途現地確認が必要になる。[GSHHG](https://www.soest.hawaii.edu/pwessel/gshhg/) · [ESA WorldCover](https://esa-worldcover.org/en/data-access) · [NRW水系図](https://www.wfs.nrw.de/geobasis/wfs_nw_inspire-gewaesser-physisch_atkis-basis-dlm?SERVICE=WFS&REQUEST=GetCapabilities)

## 再生成と検証

Python 3.11以降、GDAL/OGR、Shapely 2、NumPy、SciPyと、AGIDのNode依存パッケージを使う。下のファイル名で入力を用意する。元データのSHA-256、窓の座標、収録した水域スナップショットはリポジトリに含まれる。提供元が既定のダウンロードを新しい版に差し替えた場合は、差分を調べてから版と検証値を更新する。[生成コード](../scripts/build-europe-border-surveys.py) · [収録窓・入力](../scripts/data/europe-complex-borders)

| 入力ファイル | ダウンロード |
| --- | --- |
| dvg1_EPSG25832_Shape.zip | [NRW DVG1](https://www.opengeodata.nrw.de/produkte/geobasis/vkg/dvg/dvg1/dvg1_EPSG25832_Shape.zip) |
| VGD_Tirol_20260402.zip | [BEVの2026年4月版](https://data.bev.gv.at/download/Verwaltungsgrenzen/shp/20260401/VGD_Tirol_20260402.zip) |
| at_bev_AT_GIS_GRID_2021_09_28.tif | [BEVの変換グリッド・PROJ配布](https://cdn.proj.org/at_bev_AT_GIS_GRID_2021_09_28.tif) |
| alkis-verwaltung.zip | [バイエルン州ALKIS](https://geodaten.bayern.de/odd/m/4/verwaltung/alkis-verwaltung.zip) |
| geoBoundaries-BIH-ADM0.geojson | [2026年11月リリースの固定版](https://www.geoboundaries.org/data/snapshots/1c423398df24ddf6e730b116567d2181c9782778d0459c3f3b76ca2f9f12b6bc/gbOpen/BIH/ADM0/geoBoundaries-BIH-ADM0.geojson) |
| geoBoundaries-SRB-ADM0.geojson | [2026年11月リリースの固定版](https://www.geoboundaries.org/data/snapshots/1c423398df24ddf6e730b116567d2181c9782778d0459c3f3b76ca2f9f12b6bc/gbOpen/SRB/ADM0/geoBoundaries-SRB-ADM0.geojson) |
| gshhg-shp-2.3.7.zip | [GSHHGのアーカイブ](https://www.soest.hawaii.edu/pwessel/gshhg/) |

~~~bash
borders=(--nrw dvg1_EPSG25832_Shape.zip --tirol VGD_Tirol_20260402.zip
  --at-grid at_bev_AT_GIS_GRID_2021_09_28.tif --bavaria alkis-verwaltung.zip
  --bosnia geoBoundaries-BIH-ADM0.geojson --serbia geoBoundaries-SRB-ADM0.geojson)
python3 scripts/build-europe-border-surveys.py "${borders[@]}" --gshhg gshhg-shp-2.3.7.zip
python3 scripts/verify-europe-border-surveys.py "${borders[@]}"
npm run verify:agid-geography
~~~

原図形との照合は各地域1,500地点（範囲内600、境界付近900）の計4,500地点。元の両国の資料が示す候補集合とすべて一致し、うち628地点で両国が候補になった。これは入力図形を実装が再現できたかを調べる検査で、現地で測量した正解率ではない。別の固定テストで頂点、旧線路の両側、測位誤差、セル、水域、旧コードを検査する。[地域ごとの固定テスト](../src/lib/europeComplexBorders.integration.test.ts) · [地理データの利用条件](../DATA_LICENSES.md)

CadGIS、NRW水系図、WorldCoverの収録窓を取得し直して比較するには、次のコマンドを使う。照合にはgzip展開後の内容を使用する。

~~~bash
python3 scripts/fetch-europe-border-snapshots.py --output /tmp/agid-border-snapshots
~~~
