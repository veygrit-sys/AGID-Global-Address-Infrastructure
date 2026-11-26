# 欧州・地中海・海外領の国境台帳

AGIDは、手動ピン・端末の測位範囲・保存したセルを個別に評価する。国境をまたぐ陸上のセルは両側の住所地域を候補に持ち、三国境では三地域が候補になる。配送先は住所に明示された地域を使う。

## 収録範囲

| 対象 | 収録内容 |
| --- | --- |
| 欧州 | 51か国・地域コード。EU域外の小国、コソボ、ロシア、トルコ、カザフスタン、南コーカサスを含めた。大陸をまたぐ国はアジア側の対外国境も含む。 |
| 島・海外領・自治地域など | 42の追加地域コードが対象。仏領ギアナ、仏・蘭両側のサン・マルタン島、グリーンランド、ジブラルタル、オーランド諸島、キプロス島の英軍主権基地など。独立コードがない島は所属地域で検索する。王室属領の英国との関連も検索に使う。 |
| 地中海 | 北岸に加え、アルジェリア、エジプト、イスラエル、レバノン、リビア、モロッコ、パレスチナ、シリア、チュニジアの9地域同士の境界も収録。 |
| 陸上の隣接関係 | GeoNamesの現行地域コードを照合したうえでハンス島、マーケット島、キプロスの二基地を加え、129組すべてに線を対応させた。アルバニア・セルビアの重複表記は同じ形状を使うアルバニア・コソボと照合した。休戦線などに相当する区間は原資料の区分を持つ。 |
| 海域 | Marine Regions v12 の世界の線2,349件から、両側の地域が特定される対象377件を抽出。条約線、中間線、未確定線、共同水域、接続線など配布元の区分を保持する。 |

「全129組」は上記の範囲と資料の版に対する照合結果である。各線の現地精度は出典ごとに異なる。海岸全周、各国の全地籍筆、領海・EEZの全外縁の収録率はそれぞれ別の指標になる。[対象コード・隣接129組](../scripts/data/europe-frontiers/scope.json) · [各資料の版・帰属](../src/data/europe-frontiers/sources.json) · [地域別の海岸・島](europe-mediterranean-boundaries.md)

## 形状と判定

- 国境線、条約上の標点、個別測量、参考線、海上の記録を合わせて588件、1,855,859頂点。米国務省LSIB v11.4の該当140件は全区間を収録。元の線の順序と切れ目を保存し、座標は小数7桁に量子化する。保存桁数は測量精度を表さない。
- 2度区画の索引から周辺の線を読み、各区間の外接矩形と実際の線の順に調べる。国境周辺の1/8度区画では、簡略化前の行政ポリゴンを切り出し、飛び地・内周・近接する第三国を含めて照合する。海岸の陸水と行政の根拠は別々に評価する。
- 手動ピンは点、端末は測位誤差の円、保存済みAGIDは復号したセルの四辺を使う。測位精度が不明な端末は `unknown-accuracy`、半径500 kmを超える詳細照会は `large-footprint` を返す。
- `regionCandidates` は陸上の住所候補、`frontiers` は触れた国境の地物と出典、`administrativeArea` は点または範囲の中心が入る個別区域。水面上でも共同管轄や海上の条約線を参照できる。配送地域は自動確定しない。

## 確認地点

| 地点 | 結果 |
| --- | --- |
| 旧フェン鉄道 | 北緯50.59735度、東経6.248380度のピンはドイツ、同6.248406度はベルギー。両方が入る同じセルは BE・DE。 |
| ファールセルベルク | 三国点に接する陸上のピンとセルは BE・DE・NL。 |
| Eurode Business Center | 建物を通る独蘭国境を州の測量図から収録。国境の両側約2 m、線上、測位円の接触を検証する。 |
| 独・ルクセンブルク | モーゼル、ザウアー、ウールの共同管轄区域を地籍当局の二つの面で収録。レーミヒ付近では DE・LU の共同管轄を返す。 |
| キプロス | アクロティリ XU、デケリア XD、デケリア内のキプロス側の飛び地を扱う。国連緩衝地帯は参考線に分類。 |
| サン・マルタン島 | 2023年署名協定附属書Aの392点を順に収録。陸上の371標点で MF・SX を検証。オランダ条約台帳の発効日が空欄のため署名済み協定と表示する。[協定](https://zoek.officielebekendmakingen.nl/trb-2023-66.html) · [条約台帳](https://verdragenbank.overheid.nl/en/Treaty/Details/013951) |
| ハンス島、マーケット島 | ハンス島はカナダ・デンマーク・グリーンランドの協定第4条の3標点、マーケット島はフィンランド・スウェーデンの画定記録の11標識を使用。海外・自治地域のコード CA・GL、AX・SE を保持する。[ハンス島](https://www.retsinformation.dk/api/pdf/239124) · [マーケット島](https://www.maanmittauslaitos.fi/en/stateboundaries) |
| モナコ | 埋立地区MareterraのLe RenzoはMCの陸地。隣接するPetit Portierの港内水面は住所候補が空。 |

## 検索

```sh
npm run agid -- geography --borders-of FR --json
npm run agid -- geography --borders-of GF --json
npm run agid -- geography --lat 50.59735 --lon 6.24838 --json
npm run agid -- geography --lat 50.59735 --lon 6.24838 --accuracy-meters 10 --json
npm run agid -- geography DE0GZ02AW45V1XRK --json
```

## 再生成と検証

Python 3.11以降、Shapely 2.1、pyproj、pyshp 2、NumPy、osmiumとNode.jsを使用する。入力ファイルのSHA-256を確認する。配布時のGeoNames入力のハッシュと追加・統合の根拠は隣接一覧に含まれる。Marine Regionsは原資料の地物IDと両当事者を保持する。[米国務省](https://geodata.state.gov/geonetwork/srv/api/records/3bdb81a0-c1b9-439a-a0b1-85dac30c59b2) · [LSIB固定版](https://github.com/fieldmaps/international/blob/ead689152f06d2baf823c667c7d803ea25c4f4ce/inputs/archive/11.4/DoS_LSIB_v11_4_24Feb2025.gpkg) · [FieldMaps配布元](https://fieldmaps.io/data/adm0/) · [VLIZ海域データ](https://doi.org/10.14284/632)

```sh
python scripts/fetch-europe-frontier-sources.py --cache /tmp/agid-frontier-inputs --output /tmp/agid-frontiers.json
python scripts/supplement-europe-frontiers.py /tmp/agid-frontiers.json --cache /tmp/agid-frontier-inputs --areas src/data/europe-frontiers/local-areas.json
node scripts/build-europe-frontiers.mjs /tmp/agid-frontiers.json src/data/europe-frontiers
python scripts/build-europe-frontier-sides.py --cache /tmp/agid-frontier-inputs
python scripts/build-monaco-shoreline.py /tmp/agid-frontier-inputs/monaco-261124.osm.pbf
python scripts/verify-europe-frontiers.py --lsib /tmp/agid-frontier-inputs/lsib.gpkg --marine /tmp/agid-frontier-inputs/vliz.json
python scripts/verify-europe-frontier-sides.py --cache /tmp/agid-frontier-inputs
npm run verify:agid-geography
npm run verify:agid-islands
npm run verify:agid16
```

全線の検査は、配布する各区間を読み戻し、原本の座標・順番・区間数・分割点の連続性・タイル索引を照合する。左右の検査では原線から20 m離れた座標を原本の行政ポリゴンと配布データで独立に照合する。GeoNamesとの再照合には検証コマンドに `--geonames countryInfo.txt` を追加する。ピン・セル・水域の回帰試験には別の固定地点を使う。[検証コード](../scripts/verify-europe-frontiers.py) · [地点別テスト](../src/lib/europeFrontierAtlas.integration.test.ts) · [地理データの利用条件](../DATA_LICENSES.md)
