# AGID/AOID QR 資料まとめ

Last updated: 2026-06-07

## 1. 位置づけ

このプロジェクトの QR は、単なる表示用コードではなく、AGID/AOID の通信境界を実装する重要な surface である。

基本方針は次の通りである。

```text
AGID QR = 公開地理参照、公開住所ラベル、公開地物参照
AOID public QR = 公開参照だけ。所有証明ではない
AOID private/full QR = 信頼端末間の私的移行用
```

AGID は公開可能な位置・住所・建物・地物参照である。一方 AOID は、受取人、部屋番号、電話番号、配送指示などを含み得る私的住所層である。そのため、QR では AGID と AOID を同じ扱いにしてはいけない。

## 2. 実装上の中心ファイル

| 役割 | ファイル |
| --- | --- |
| QR payload の build/parse | `src/lib/registeredAddressQr.ts` |
| public QR の redaction | `src/lib/privacyPolicy.ts` |
| AGID/AOID 通信境界と audit | `src/lib/agidAoidGovernance.ts` |
| AGID public QR private field 検査 | `src/lib/agidSecurity.ts` |
| AOID public reference redaction | `src/lib/aoid/records.ts` など AOID モジュール |
| QR reader action UI | `src/components/modals/QrReaderActionScreen.tsx` |
| QR camera scanner modal | `src/components/modals/QrScannerModal.tsx` |
| 保存済み QR 表示 | `src/components/SavedLocations.tsx` |
| QR scan/import 導線 | `src/App.tsx` |
| QR unit tests | `src/lib/registeredAddressQr.test.ts`, `src/App.registrationQr.test.ts`, `src/components/SavedLocations.qr.test.ts`, `src/components/QrReaderActions.test.ts` |

## 3. QR payload の形式

登録住所 QR は、次の prefix を持つ。

```text
agid:address:
```

prefix の後ろには、URL encode された JSON が入る。生成される payload の基本構造は次の通りである。

```json
{
  "version": 1,
  "privacy": "public | full",
  "security": {
    "profile": "AGID security policy id",
    "publicLayer": true
  },
  "audit": {
    "layer": "AGID | AOID",
    "operation": "qr-build",
    "surface": "public-qr | private-qr",
    "payloadClass": "public-agid-reference | aoid-public-reference | ...",
    "outcome": "allowed | blocked",
    "payloadFingerprint": "safe metadata fingerprint"
  },
  "record": {
    "type": "ADDRESS | AOID",
    "id": "AGID or AOID id",
    "agid": "linked AGID if present",
    "address": "public or private address label"
  }
}
```

実装では `buildRegisteredAddressQrPayload(record, { privacy })` がこの payload を組み立てる。`privacy: 'public'` の場合は公開用に redaction され、`privacy: 'full'` の場合は登録住所を復元するための情報を含める。

## 4. QR の種類

### 4.1 Public AGID QR

公開 AGID QR は、公開地理参照として扱う。

含めてよいもの:

- AGID
- 国または海域コード
- 公開住所ラベル
- 公開建物名
- 道路、橋、公園、水辺、山、湖、川、滝、島、湿地、砂漠、草原、森林、遺跡、世界遺産などの公開地物ラベル
- source と confidence metadata

含めてはいけないもの:

- 受取人
- 電話番号
- 部屋番号、unit、room
- 配送指示
- access code
- owner key id
- device key id
- private ownership proof
- opaque encrypted AOID payload

Public AGID QR は、作成時だけでなく parse 時にも再 sanitization する。悪意ある QR が `privacy: public` を名乗りつつ private field を混入させても、その field は復活してはいけない。

### 4.2 Public AOID Reference QR

公開 AOID QR は、参照専用である。所有証明ではない。

含めてよいもの:

- AOID id
- linked AGID
- public handle
- status/version
- `privacy: public-reference`

含めてはいけないもの:

- 受取人
- 電話番号
- 部屋番号
- 正確な私的座標
- 配送指示
- access instruction
- owner-managed flag
- ownership proof

重要なルール:

```text
public AOID QR をスキャンしても、owner-managed AOID として登録してはいけない。
```

実装では、`App.tsx` の QR import 導線で `ownerManaged === true` かつ `privacy !== 'public-reference'` の AOID だけを owner-managed AOID として扱う。

### 4.3 Full / Private Registered Address QR

full QR は、登録住所を復元するための QR である。受取人、電話番号、部屋番号、座標などを含み得るため、信頼する端末間の移行や本人用 backup に限定する。

現時点の実装では、full QR は plaintext payload として扱われる可能性がある。したがって、公開共有、SNS 投稿、第三者配布、掲示、配送ラベルへの常設印刷には向かない。

将来の望ましい仕様:

- owner-device encryption
- short-lived challenge
- device binding
- one-time import
- revocation
- scope
- import audit

### 4.4 Drone Mission QR

アプリには drone mission QR の読み取り導線もある。`parseDroneMissionQrPayload` により、mission QR を読み込むと、target へ map flyTo し、corridor report を復元する。

これは住所登録 QR とは別系統だが、`saved_qrs` に保存される点は共通である。

## 5. QR 生成の流れ

住所登録 UI で登録が完了すると、アプリは次を行う。

1. `AddressRegistration` から登録住所 record を受け取る。
2. `buildRegisteredAddressQrPayload(data, { privacy: qrPayloadPrivacy })` を呼ぶ。
3. `buildSavedQrFromRegisteredAddress(data, payload)` で保存用 QR record を作る。
4. `saved_qrs` に保存する。
5. `data.type === 'AOID'` の場合は AOID リストへ、通常住所の場合は registered address リストへ追加する。

`qrPayloadPrivacy` は `localStorage` の `agid_qr_payload_privacy` から読み込まれ、値は `public` または `full` である。

## 6. QR 読み取りの流れ

QR 読み取りは `handleQrResult(text)` に集約されている。

処理順序:

1. URL 形式の場合は `agid` または `q` query を抽出する。
2. drone mission QR を試す。
3. registered address QR を試す。
4. AGID らしい文字列なら `jumpToAgid` する。
5. それ以外は通常検索へ渡す。

registered address QR の場合:

1. `parseRegisteredAddressQrPayload(result)` で parse する。
2. parse に成功した record を `saved_qrs` に保存する。
3. AOID かつ owner-managed private record の場合だけ AOID リストへ入れる。
4. public-reference AOID は owner-managed にならない。
5. record に lat/lon がある場合のみ map を移動する。

## 7. 保存と UI

保存済み QR は `saved_qrs` に保存される。`SavedLocations.tsx` の `qr` tab で検索、表示、削除、地図ジャンプができる。

QR 表示は二種類ある。

- `imageData` がある場合: 既存の QR card 画像を表示し、download できる。
- `payload` がある場合: `QRCodeCanvas` で QR を再生成して表示する。

QR reader は、保存済み QR tab と検索 sidebar から開ける。`QrReaderActionScreen` は camera scan と image import の入口を分ける。

## 8. セキュリティ境界

### 8.1 build 時の防御

`buildRegisteredAddressQrPayload` は、public QR の場合に次を行う。

- `sanitizeRegisteredAddressForPublicQr` で private field を削る。
- `validatePublicAgidPayload` で forbidden field を検査する。
- `buildAgidAoidAuditEvent` で QR build audit を作る。
- governance decision が blocked の場合は payload を作らない。

### 8.2 parse 時の防御

`parseRegisteredAddressQrPayload` は、読み取り時にも次を行う。

- prefix が `agid:address:` でなければ登録住所 QR と扱わない。
- JSON decode に失敗したら null を返す。
- `type` が `ADDRESS` または `AOID` でなければ拒否する。
- AGID がある場合は AGID format を検査する。
- AOID public QR は `redactAOIDForPublicUse` で再 redaction する。
- public ADDRESS QR は `sanitizeRegisteredAddressForPublicQr` で再 sanitization する。
- governance decision が allowed でなければ拒否する。

### 8.3 audit

QR build/parse は `agidAoidGovernance` の audit model に接続されている。audit event は raw private payload を保存せず、安全な metadata と fingerprint を持つ。

## 9. テストで確認されていること

既存テストでは次が確認されている。

- 登録住所 record が QR payload を通じて round-trip できる。
- ADDRESS record は AGID id と座標を保持できる。
- AOID record は AOID id と linked AGID を保持できる。
- public AOID QR は public reference として parse され、owner-managed AOID にならない。
- public AOID QR には recipient、phone、room、lat、lon が残らない。
- malformed AOID QR payload は登録前に拒否される。
- public AGID QR は parse 時にも再 sanitization される。
- registered address から saved QR entry を作れる。
- App は registered address QR を AGID fallback より先に読む。
- QR reader action screen は camera scan と image import の導線を持つ。

## 10. 現在の強み

- public/full の privacy mode がある。
- public QR は build 時と parse 時の両方で private field を削る。
- AGID/AOID governance decision により、surface ごとの許可・拒否を行っている。
- public AOID QR を所有証明と混同しないテストがある。
- saved QR はローカル保存が基本で、privacy design と整合している。
- AGID は公開、AOID は private という境界が docs と code の両方にある。

## 11. 残っている弱点

1. full/private QR が暗号化済みとは限らない。
2. full QR の短命 challenge、one-time import、device binding が未実装である。
3. QR payload の schema が明示的な JSON Schema として固定されていない。
4. QR の version migration 方針が薄い。
5. public QR と full QR の UI 上の危険度表示をさらに強くできる。
6. saved QR の encrypted local storage は未完了である。
7. QR payload のサイズ制限、圧縮、canonical JSON 化がまだ十分に文書化されていない。
8. import audit はあるが、ユーザー向けの確認画面で「これは public reference です」「これは private full QR です」を明示する余地がある。

## 12. 推奨改善

優先度 S:

- full/private QR は plaintext ではなく owner-device encrypted envelope にする。
- private QR import に one-time challenge と期限を入れる。
- public AOID QR は UI 上も `Reference only` と表示し、所有登録ボタンを出さない。
- QR payload JSON Schema を作成し、version 1 schema として固定する。
- public QR forbidden field test を AGID/AOID 両方で増やす。

優先度 A:

- QR の threat model を `docs/agid-aoid-qr-threat-model.md` として分離する。
- QR import confirmation screen を追加し、取り込む data class を表示する。
- saved QR のローカル暗号化を導入する。
- full QR の download/share 時に強い警告を表示する。
- QR payload の canonical encoding を導入し、署名や fingerprint の安定性を上げる。

優先度 B:

- QR payload の圧縮形式を検討する。
- 多言語 UI に `public reference`, `private transfer`, `owner-managed` の翻訳を追加する。
- QR scan 後の安全な undo/revoke 導線を追加する。
- mobile で camera permission failure 時の fallback を改善する。

## 13. 論文・仕様書での書き方

AGID/AOID 応用論文では、QR を次のように記述するのがよい。

> QR is a communication surface, not an ownership primitive. Public AGID QR codes carry only public location and public evidence. Public AOID QR codes carry only a reference handle and linked AGID, and do not prove ownership. Full AOID or registered-address QR codes are private trusted-device transfer payloads and must be encrypted, scope-bound, and revocable in production deployments.

日本語では次のように書ける。

> QR は所有権そのものではなく通信 surface である。公開 AGID QR は公開位置・公開住所・公開地物根拠のみを運ぶ。公開 AOID QR は参照ハンドルと紐付く AGID だけを運び、所有証明にはならない。full AOID または登録住所 QR は、信頼端末間の私的移行 payload であり、本番運用では暗号化、用途スコープ、失効、短命 challenge を備える必要がある。

## 14. 最短の仕様まとめ

```text
1. AGID QR は公開してよい。
2. AOID public QR は参照だけ。所有証明ではない。
3. AOID private/full QR は信頼端末間だけ。
4. public QR には受取人、電話、部屋、配送指示、正確な私的座標を入れない。
5. public QR は build 時と parse 時の両方で sanitization する。
6. malformed AOID QR は登録前に拒否する。
7. public AOID QR を読んでも owner-managed AOID として保存しない。
8. full/private QR は将来的に暗号化、短命化、one-time 化する。
```
