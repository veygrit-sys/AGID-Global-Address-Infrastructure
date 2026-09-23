# 未整理領域の洗い出しと整理方針

Date: 2026-06-24

この文書は、AGID リポジトリ内で未整理になっている領域を「今すぐ整理するもの」「互換性を守って段階移動するもの」「生成物として扱うもの」に分けるための方針である。

## 現状サマリー

作業ツリーは機能追加が速く進んでおり、アプリ本体、住所データ、SDK、論文、OSS/商用境界、DB、ZK、配送/ホテル/POS/ドローン構想が同じリポジトリ内に集まっている。これは開発初期には速いが、このままでは「どこを直すと何が壊れるか」が見えにくくなる。

今回の確認で見えた主な数値は次の通り。

| 領域 | 現状 |
| --- | ---: |
| `src/lib` | 615 個の直下 TS/TSX ファイル |
| `src/data/address_formats` | 573 ファイル、JSON 282 / YAML 281 |
| `docs` | 244 ファイル |
| `scripts` | 53 ファイル |
| `sdk` | 165 ファイル |
| `data` | 607 ファイル、約 76 MB |
| Git 作業ツリー | modified 198、deleted 22、untracked 795 |

この数値から、最大の問題はコード品質そのものではなく、責務境界と成果物の扱いが混ざっていることだと判断する。

## 未整理領域

| 領域 | 問題 | 方針 |
| --- | --- | --- |
| `src/lib` 直下 | address/agid/grid/zk/pos/open-data などが同じ階層に混在 | 新規追加は原則サブフォルダへ。既存は barrel/shim を置いて段階移動 |
| `src/App.tsx` と大きい UI | 地図、検索、QR、住所品質、保存、位置情報が集中 | 画面単位ではなく controller hook 単位で分割 |
| `server.ts` | bootstrap と route 実装が混在 | 新規 route は必ず `src/server/routes/*` へ。既存 route は地域/機能別に移す |
| 住所フォーマット | JSON/YAML の二重管理、国/自治領/係争地域の配置方針が不統一 | YAML を編集元、JSON を配信用/生成物とする。大陸/小地域/国を canonical path に固定 |
| コーカサス | `asia/caucasus` に AM/AZ/GE があるが、UI 方針は東ヨーロッパ | canonical は `europe/eastern_europe`。移動前に loader alias を用意 |
| SDK 群 | 多言語 SDK が手編集と生成の境界を持ちにくい | `agid-spec` と parity vectors を唯一の生成源にし、SDK 本体は generated marker を持たせる |
| docs | 構想、論文、実装仕様、運用メモが同列 | `docs/specs`, `docs/research`, `docs/product`, `docs/ops`, `docs/archive` に段階分類 |
| `data` | OSS データ、国別 pack、生成 pack、重い参照データが混在 | アプリ同梱は index/metadata のみ。重い国別データは pack として lazy load |
| build/cache/log | `dist`, logs, test-results, SDK build cache が作業時に増える | 成果物ではない。`.gitignore` と clean script の対象に固定 |
| DB/ledger | SQLite/Postgres/Mongo 方針が並列で増えている | reference schema と deployment schema を分ける |
| Web3/ZK | proof、registry、wallet、Ethereum が散らばる | `src/lib/zk`, `src/lib/web3`, `contracts`, `circuits` の依存方向を固定 |

## 決定事項

### 1. 物理移動より先に互換層を作る

既存 import を一気に壊さない。移動対象には先に barrel export または loader alias を追加する。

例:

```text
src/lib/agid.ts
  -> public compatibility barrel

src/lib/agid/encoding.ts
src/lib/agid/grid.ts
src/lib/agid/validation.ts
  -> new internal modules
```

### 2. 新規ファイルは領域別フォルダへ置く

`src/lib` 直下への新規追加は例外扱いにする。3 ファイル以上になる領域は必ずフォルダを作る。

推奨:

```text
src/lib/address/
src/lib/agid/
src/lib/grid/
src/lib/postal/
src/lib/zk/
src/lib/web3/
src/lib/pos/
src/lib/integrations/
```

### 3. 住所フォーマットは YAML source、JSON delivery

国別住所フォーマットは次の扱いにする。

| 形式 | 役割 |
| --- | --- |
| YAML | 人間がレビューする編集元 |
| JSON | アプリと SDK が読み込む配信用 |
| index | 大陸/小地域/国/自治領/係争地域の検索用 |

JSON と YAML の差分は script で検証し、手作業で片方だけ変更しない。

### 4. コーカサスは東ヨーロッパ canonical

AM/AZ/GE は今後 `europe/eastern_europe` を canonical とする。既存の `asia/caucasus` は互換 alias として残すか、loader が旧パスを読める期間を設ける。

実施順:

1. address format loader に alias を追加する。
2. テストで AM/AZ/GE が Eastern Europe として出ることを確認する。
3. YAML/JSON を `europe/eastern_europe` に移す。
4. 旧 `asia/caucasus` は deprecated manifest か alias にする。

### 5. SDK は生成物として管理する

各 SDK は `sdk/agid-spec` と parity vectors から生成されるものとして扱う。手で直す場合も generator に戻す。

必須ルール:

- SDK ごとに parity test を持つ。
- `agid-sdk.json` と `agid-parity-vectors.json` は同じ source version を持つ。
- SDK の build/cache はリポジトリ成果物にしない。
- 生成できない手修正は generator 側に移植してから反映する。

### 6. docs は公開導線で分類する

docs は次の 5 分類にする。

| 分類 | 例 |
| --- | --- |
| `docs/specs` | AGID spec、address format、OpenAPI、SDK conformance |
| `docs/research` | 住所写像論、論文、検証仮説 |
| `docs/product` | PWA、Address Wallet、Postal Forge、UI 方針 |
| `docs/ops` | production load test、continuous improvement、security gates |
| `docs/archive` | 古い resume、過去の検討、重複した草案 |

まず index を作り、物理移動は後で行う。

### 7. 重い地理データは app bundle に入れない

アプリ本体には国/地域の metadata と軽い index のみを入れる。郵便番号、行政界、地物、自然地形、OpenAddresses/Overture/OSM 派生の重いデータは country pack / region pack として外出しする。

### 8. server は route family 単位で分ける

`server.ts` は最終的に app bootstrap、middleware、route registration、listener だけにする。

優先移動:

1. external proxy routes
2. postal/address validation routes
3. natural feature routes
4. map tile / terrain routes
5. OPERA/POS/delivery integrations

### 9. セキュリティ境界は整理より優先

次のファイル群は整理時も raw address / secret / witness を漏らさないことを最優先にする。

- QR / wallet / secure address
- OPERA / POS / delivery integration
- ZK witness / proof
- DB ledger / registry
- external proxy

移動や分割の前後で `verify:no-raw-address` と `verify:mandatory-security` を通す。

## 優先順位

| 優先 | 作業 | 理由 |
| ---: | --- | --- |
| P0 | 生成物/キャッシュ/ログを成果物から分離 | 公開 repo の信頼性に直結 |
| P0 | `src/lib` 新規直下追加を止める | これ以上の混線を止める |
| P0 | 住所フォーマットの YAML/JSON 方針固定 | 全世界対応の保守性に直結 |
| P1 | コーカサス canonical 移動 | 既に UI 方針と実配置がずれている |
| P1 | `App.tsx` controller hook 分割 | 地図/住所登録/QR の変更が安全になる |
| P1 | `server.ts` route family 分割 | 外部連携と security gate が追いやすくなる |
| P1 | docs index と分類 | 採択/公開/監査時に読者が迷わない |
| P2 | SDK generator と generated marker 整理 | 多言語 SDK を継続更新しやすくする |
| P2 | heavy geo data pack 化 | bundle size と配布責任を下げる |
| P2 | maintainability guard script | 再び散らかるのを防ぐ |

## 次に実装する小さい単位

大移動はしない。次の順で小さく進める。

1. `docs/document-index.md` を更新して specs/research/product/ops/archive の入口を作る。
2. `src/data/address_formats/index.ts` に AM/AZ/GE の Eastern Europe alias を入れる。
3. `scripts/verify-address-format-source-sync.ts` を追加し、YAML/JSON の片側更新を検知する。
4. `scripts/verify-maintainability.ts` を追加し、巨大ファイル、新規 `src/lib` 直下追加、route 増加を警告する。
5. `App.tsx` から location permission / grid controller / address panel controller を順に hook 化する。

## 完了条件

この整理方針が機能している状態は次の条件で判断する。

- 新規機能の置き場所が迷わない。
- address format の編集元が一意である。
- SDK は generator から再生成できる。
- app bundle に重い地理データを抱えない。
- server route が外部連携ごとに監査できる。
- docs の読者が「仕様」「研究」「製品」「運用」を区別できる。
- security/privacy gate が整理作業のたびに通る。
