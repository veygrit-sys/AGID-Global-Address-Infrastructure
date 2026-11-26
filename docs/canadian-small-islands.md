# カナダの小島と島間水路の判定

カナダ周辺の21区域で、小島、島内の池、島と島の間の水路を区別する。AGIDの発行、ピン・セルの地理判定、ローカル住所解決、オフラインの島照合で同じ詳細データを使う。各ファイルの `windows[].bbox` は照合する範囲を西・南・東・北の順に表す。国候補は、その中で陸地と所属の両方を確認できた位置から求める。

| 地域 | 区域数 | 対象の島・水路 |
| --- | ---: | --- |
| 太平洋岸 | 5 | ガルフ諸島のペロー小島群とポートランド島、キャベッジ島とリーフ・ハーバー、ブロークン群島のベンソン島周辺、ハイダ・グワイのホットスプリング島とスカン・グワイ周辺。[区域データ](../src/data/canadaPacificReviewed.json) |
| 五大湖・セントローレンス川 | 4 | フラワーポット島、チャントリー島、ボーソレイユ島と周辺の小島、米加国境のアイス島とダーク島。[区域データ](../src/data/canadaFreshwaterReviewed.json) |
| 大西洋岸・セントローレンス湾 | 5 | ケープ・ブレトン島沖のバード諸島、ミンガン諸島のペロケ島・メゾン島、ニューファンドランド島沖のアランズ島、仏領のマラン島周辺、ラブラドル沿岸のバトル・ハーバー。[区域データ](../src/data/canadaAtlanticReviewed.json) |
| ハドソン湾・ジェームズ湾 | 3 | ベルチャー諸島のツイン・ケアンズ島、ジェームズ湾のウルフ小島とガスケット島。島の周囲の恒常的な海面も対象にする。[区域データ](../src/data/canadaHudsonReviewed.json) |
| 北極諸島 | 4 | ペニー海峡の北・中・南チェイン島、シーモア島、コーバーグ島沖の岩島プリンセス・シャーロット・モニュメント、スミス海峡のオーン島。[区域データ](../src/data/canadaArcticReviewed.json) |

## ピン、GPS誤差、既存ID

手動ピンでは、陸地と確認した小島に住所地域を返す。海面・河川・湖面の国候補は空になる。測位半径や復号したセルが複数の陸地に届く場合は、到達した国を候補に残す。地図・観測の食い違いや陸水混在があれば確認を求め、地図だけで配送国を確定しない。

| 地点（緯度、経度） | 結果 |
| --- | --- |
| ポートランド島東岸（48.7253475, −123.361361） | 測位半径6 mなら島・カナダ。30 mでは海岸まで届くため陸水は要確認、国候補は `CA`。 |
| アイス島・ダーク島間の川面（44.455, −75.8235） | 半径175 mでは水面だけ。400 mではカナダ側の陸地に届き `CA` が候補。1,300 mでは米国側にも届き `CA`・`US` が候補。 |
| サンピエール・ミクロンのマラン島旧市庁舎（46.784444, −56.149444） | 住所地域は `PM`、主権国は `FR`。一方、セントローレンス川のダーク島（44.4521, −75.8127）はニューヨーク州にあるため `US`。 |
| ジェームズ湾のウルフ小島（52.107074, −79.242810） | 恒常的な陸地はカナダの島、小島の東方（52.107196, −79.234194）は海面。陸水の資料が異なる地点（52.107800, −79.241000）は要確認。 |
| プリンセス・シャーロット・モニュメント（75.8412, −78.827） | 衛星画像と標高が露出した岩島を示し、`CA` を返す。ずれのある旧地名図の位置（75.8337, −78.831）は陸水・国とも要確認。 |

ハイダ・グワイのホットスプリング島（52.576811, −131.440682）では、新規発行の国は `CA`。旧12文字ID `US0JHMMGNY52` と旧16文字ID `US0JHMMGNY521FTM` は以前と同じセルに復号し、ローカル住所解決はカナダの住所形式を選ぶ。既存の領有主張・分割島の扱いは島ごとの記録に従う。[座標と既存IDの回帰テスト](../src/lib/canadianSmallIslands.integration.test.ts) · [米加の共有島・係争島](us-canada-shorelines.md)

## 原典と照合方法

- **太平洋岸**ではブリティッシュコロンビア州のFreshwater Atlasから海の島の個別ポリゴンを取得し、ESA WorldCover 2020年版・2021年版の10 m観測と重ねる。両年が恒常水面を示し、かつ州の島の輪郭の外側にある地点を海面とする。州台帳に群島名しかない岩礁では、群島名を個別の島名に転記しない。[州の島台帳](https://open.canada.ca/data/dataset/4483aeea-df26-4b83-a565-934c769e74de) · [州の利用条件](https://pub.data.gov.bc.ca/license/OGL-vbc2.0.pdf) · [WorldCover・CC BY 4.0](https://esa-worldcover.org/en/data-access)
- **五大湖・セントローレンス川**ではオンタリオ州のGreat Lakes Islands台帳とOntario Hydro Networkの恒常水域を組み合わせ、島内の池と浅瀬を分ける。米加国境では米国のTIGER/Line 2025水域と国際境界委員会の境界線v1.3も照合する。[州の島台帳](https://ws.gisetl.lrc.gov.on.ca/fmedatadownload/Packages/GreatLakesIslandsInt.zip) · [オンタリオ州の利用条件](https://www.ontario.ca/page/open-government-licence-ontario) · [米国の水域データ](https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/) · [国際境界委員会](https://www.internationalboundarycommission.org/en/maps-coordinates/coordinates.php)
- **大西洋岸**ではカナダ地名データベース（CGNDB）の島の輪郭とWorldCoverを照合する。バトル・ハーバーは2021年国勢調査の州境データに収録された島の輪郭に地名位置を照合する。マラン島周辺の行政範囲にはフランス国土地理院（IGN）のADMIN EXPRESS COG、サンピエールのコミューン番号97502を使う。[ペロケ島の公式輪郭](https://geogratis.gc.ca/services/geoname/en/features/05b96865be4411d892e2080020a0f4c9.geojson) · [統計局の利用条件](https://www.statcan.gc.ca/en/reference/licence) · [IGNデータ](https://geoservices.ign.fr/adminexpress) · [Licence Ouverte 2.0](https://www.data.gouv.fr/pages/legal/licences/etalab-2-0)
- **ハドソン湾・ジェームズ湾**ではCGNDBの公式島ポリゴン、CanVec 1:50,000水域、WorldCoverの2年分を使用する。CanVecの恒常海域と両年の水面が一致した範囲に海域コード `HUDB` を付ける。季節性の湿地や海氷から島の陸地を推定しない。[CanVec](https://open.canada.ca/data/en/dataset/be0165a8-ad5d-4adb-a27a-2d4117c3967c) · [ウルフ小島の地名記録](https://geogratis.gc.ca/services/geoname/en/geonames/OASBE.html) · [カナダ政府の利用条件](https://open.canada.ca/en/open-government-licence-canada)
- **北極諸島**ではCGNDBとWorldCoverを基礎に、チェイン島群とプリンセス・シャーロット・モニュメントをArcticDEM v4.1（2 m）でも照合する。チェイン島間の北極海（76.321, −97.522）には `ARCT`、中チェイン島内の池（76.310088, −97.522249）には `INLAND_WATER` を返す。[ArcticDEMとクレジット](https://www.pgc.umn.edu/data/arcticdem/) · [カナダ水路部の水路誌](https://waves-vagues.dfo-mpo.gc.ca/library-bibliotheque/chs-shc-ARC402-eng-202604-41326076.pdf) · [使用データと帰属表示](../DATA_LICENSES.md)

## 再生成・検証

リポジトリ直下でPython 3.11以降、GDAL（Pythonバインディング・HTTPS範囲取得機能付き）、NumPy、Shapely 2を使用する。大西洋岸の処理にはカナダ統計局の2021年版州・準州境界アーカイブを用意する。下のコマンドは公式配布先から取得し、失敗時には同一のSHA-256を確認したミラーを使う。各スクリプトが元データまたは抽出画素のSHA-256を検査し、対応する `src/data/canada*Reviewed.json` を再生成する。

```sh
ca_inputs=${TMPDIR:-/tmp}/agid-canada-inputs
mkdir -p "$ca_inputs"
curl --fail --location --output "$ca_inputs/lpr_000b21a_e.zip" \
  'https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/files-fichiers/lpr_000b21a_e.zip' || \
  curl --fail --location --output "$ca_inputs/lpr_000b21a_e.zip" \
    'https://data.source.coop/dataforcanada/d4c-datapkg-statistical/archive/statcan/boundaries/2021/lpr_000b21a_e.zip'
python3 scripts/build_canada_pacific_reviewed.py --cache-dir "$ca_inputs/pacific"
python3 scripts/build_canada_freshwater_reviewed.py "$ca_inputs/freshwater" --download
python3 scripts/build_canada_atlantic_reviewed.py --source-directory "$ca_inputs/atlantic" --statcan-archive "$ca_inputs/lpr_000b21a_e.zip"
python3 scripts/build_canada_hudson_reviewed.py "$ca_inputs/hudson" --download
python3 scripts/build_canada_arctic_reviewed.py --source-directory "$ca_inputs/arctic"
node --import tsx --test src/lib/canadianSmallIslands.integration.test.ts
```
