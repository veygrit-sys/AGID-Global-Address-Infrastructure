# アフリカの国境と島のAGID判定

ピンが複数国の国境線に載るときは、接する国・地域をすべて返す。端末の測位精度が指定された場合とAGIDを読み取った場合は、それぞれの誤差円または区画を覆う円まで評価する。モーリタニアとセネガルの国境を流れるセネガル川では、ロッソのテスト地点で誤差100 mなら水面のまま、320 mなら両岸に届く。

## 大陸の国境

Natural Earth v5.1.2 の1:10,000,000地図で、大陸陸塊上の隣接する行政・地域単位から共有線分を抽出した。対象は110組、検索用区画は5,281個。ビル・タウィールなどの地域単位を含むため、110はこの地図上の組数を表す。各ピンは実際のポリゴンで判定する。FieldMaps の2025-07-29版は別の境界資料として照合し、2資料の候補が一致しない地点は確認を求める。南アフリカの内側にあるレソト、カビンダなどの分離部分、三国境も同じ照合を通る。

| 条件 | 地理判定と住所での扱い |
| --- | --- |
| 両資料の国が一致し、陸地の内部を確認できる | その国を地図上の候補として表示する |
| ピンが共有線上に載る、測位範囲が複数の陸域に届く | 該当するすべての候補を表示する。エジプト・リビア・スーダンの三国境では3か国 |
| 2資料の行政界が異なる | 候補を保持し、資料間の不一致を表示する |
| 複数の行政域に接するが陸地を確認できない | 隣接地域を `adjacentRegions` に記録し、住所国の自動選択を止める。カズングラ橋中央付近のテスト地点ではボツワナとザンビア |
| 河川・湖・海の水面を確認できる | 住所国の候補を空にする。大きな誤差円が岸に届くときは、岸側で確認した国を表示する |
| 地位に関する個別の記録がある | `borderNotices` で対象地域、地位の種類、関係するコード、資料を返す。配送先の国は受取人の指定を使う |

### 個別の地位を記録した9地域

| 地域 | AGIDの表示・確認事項 |
| --- | --- |
| 西サハラ | 西サハラ（EH）とモロッコ（MA）。EHを地域識別子として保持する。モーリタニア側との共有線でMRも地理候補に入るが、地位の記録はEH・MAのまま |
| アビエイ | スーダン（SD）・南スーダン（SS）。境界・最終地位を要確認 |
| ハラーイブ | エジプト（EG）・スーダン（SD） |
| ビル・タウィール | 内部の住所国は空欄。既存の地域識別子はBT_T。外縁では隣接国を地理候補に含め得る |
| イレミ | ケニア（KE）・南スーダン（SS）。地図資料による範囲に限定 |
| ソマリランド | ソマリア（SO）・既存の内部識別子SLND。内部識別子を国際標準の国コードとして扱わない |
| セウタ、メリリャ | それぞれスペイン（ES）・モロッコ（MA）を記録する。従来の地域識別子EAを保持 |
| コアルー／クールー | ブルキナファソ（BF）・ベナン（BJ） |

Natural Earth とFieldMaps は個別地域の線を必ずしも同じ位置に描いていない。行政単位、係争域、既知の陸地・水面を照合する。関係する国・地域のコードと根拠ページは更新可能な台帳にある。[個別方針と資料](../scripts/data/africa/mainland-policies.json) · [国連の西サハラ資料](https://www.un.org/dppa/decolonization/en/nsgt/western-sahara) · [国連アビエイ暫定治安部隊の地図](https://unisfa.unmissions.org/sites/default/files/documents/24-12-monthly_maps.pdf)

### 河川の詳細範囲

セネガル川のロッソ（MR・SN）、コンゴ川のプール・マレボ内の指定区間（CG・CD）、ザンベジ川のカズングラ橋下流の指定区間（ZM・ZW）では、ESA WorldCoverの2020年版と2021年版で同じ地表種別が観測され、陸地が独立した河岸の基準地点につながることを検査する。水位の変化、狭い支流、橋の路面、市街地の境目では未判定が残る。橋の中央に周辺4か国を一括で割り当てる処理は行わない。[アフリカ開発銀行のカズングラ橋資料](https://www.afdb.org/sites/default/files/documents/publications/cross-border_road_corridors_web.pdf) · [ESA WorldCover](https://esa-worldcover.org/en/data-access)

## 島と周囲の水面

大陸の検証後に追加した詳細対象は21範囲。表の「2範囲」などは個々の島の総数ではなく、別々に検証する地図範囲を表す。

| 海域・湖 | 詳細範囲 |
| --- | --- |
| 北大西洋・ギニア湾 | カーボベルデ、カナリア諸島、マデイラとポルト・サント、サントメ、プリンシペ、ビオコ、アンノボン |
| 南大西洋 | セントヘレナ、アセンション、トリスタン・ダ・クーニャ |
| インド洋 | コモロの主要3島、マヨット、セーシェル内諸島、モーリシャス本島、ロドリゲス、レユニオン |
| アフリカ東岸・マダガスカル | ウングジャ、ペンバ、ノシ・ベと対岸、サント・マリーと対岸 |
| マラウイ湖 | リコマ、チズムルとその間の水面 |

GSHHG 2.3.7の海岸・湖岸・湖内島とFieldMapsの行政領域を別々に照合する。両資料の岸線の間には未判定帯を残す。湖内島では旧岸線がリコマ島の集落を横切るため、2年分のWorldCoverで連続する島の陸域を確かめ、マラウイ政府が記すリコマ・チズムルと対応づけた。リコマのテスト地点（南緯12.065度、東経34.736度）はMW、両島間の湖面に住所国は付かない。[マラウイ政府の両島に関する資料](https://www.energy.gov.mw/docs/uploads/MAREP-FLYER.pdf)

マヨットでは島の陸地とYTの行政領域の両方がピンを含むことを確認し、既存の群島単位の地位記録（フランスの行政、FR・KMの関係）を表示する。沖合の水面にはこの記録を引き継がない。ムバニエ島は2025年の国際司法裁判所判決を反映する既存処理も回帰テストに含む。[マヨットを含む島の地位台帳](../src/data/islandDisputePolicies.json) · [国際司法裁判所の事件記録](https://www.icj-cij.org/case/179)

## AGIDと配送先

地理結果の `deliveryRegion` は常に `null`。確定できない地点から住所フォームの国を自動選択しない。保存済み12文字・16文字AGIDはそのまま読み取り、現在の区画評価を適用する。利用者が指定した住所国を優先する。たとえばマヨットのYT、レユニオンのRE、カナリアの地域識別子は、地形・主権国・配送先のそれぞれと区別して表示できる。

## 検証とデータ再生成

```sh
npm run verify:agid-geography
npm run verify:agid-islands
npm run verify:agid16
npm run agid -- geography --lat 22 --lon 25 --json
npm run agid -- geography --lat 16.504042 --lon -15.805458 --accuracy-meters 320 --json
```

生成時はPython 3.11以降、GDALのPythonバインディング、NumPy、Shapely 2.1以降を使用する。次の例では固定版の入力をカレントディレクトリに用意する。各生成スクリプトが入力ファイルまたは使用した画素領域のSHA-256を照合する。島のGeoJSON化の丸め単位は100万分の1度で、原典の位置精度は地域によって異なる。

```sh
python3 scripts/build-african-mainland.py ne_10m_admin_0_map_units.geojson ne_10m_land.geojson ne_10m_admin_0_disputed_areas.geojson adm0_polygons.gpkg
python3 scripts/build-african-border-rivers.py adm0_polygons.gpkg worldcover-cache
python3 scripts/build-african-islands.py gshhg-shp-2.3.7.zip adm0_polygons.gpkg worldcover-cache
```

[固定版Natural Earthの入力](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2/geojson) · [FieldMaps USGS版](https://fieldmaps.io/data/adm0/) · [GSHHG配布元](https://www.soest.hawaii.edu/pwessel/gshhg/) · [データ利用条件](../DATA_LICENSES.md)

小さな湖内島や細い河川、未画定区間の全域、季節で動く岸線は地域ごとに検証範囲が異なる。これらの結果から配達可否、通関上の国や境界の法的位置を決めることはできない。
