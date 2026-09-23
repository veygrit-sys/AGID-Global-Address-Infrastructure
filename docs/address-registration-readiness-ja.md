# Address Registration Readiness

Address Registration は、住所を入力できるだけでは不十分です。配送、本人確認、支援、EC、POS、監査に接続するには、登録前に「現場で使える状態か」を同じ基準で判定する必要があります。

このため `address-registration-readiness-v1` を追加します。これは Address Element の安全なセッションを入力にして、職種別の観点から登録画面の完成度を判定します。

## 職種別チェック

| 観点 | 見ること |
| --- | --- |
| Addressing specialist | 国別住所形式、必須フィールド、国内表示、国際英語表示 |
| Carrier operations | 郵便番号補完、AGID逆ジオ候補、配送Intent、handoff前の不足 |
| Privacy / security | raw addressを公開メタデータへ出さないこと、高リスク時のAGID-S/commitment優先 |
| Accessibility / i18n | 言語タブ、国際配送英語、状態表示、内部スコア非表示 |
| Support / review | 要確認・拒否・修正の次アクション、文書読み取り候補、閉じたローカル学習 |
| Developer platform | Address Element session ID、Address Intent ID、安全なevidence fingerprint |

## 画面表示

ユーザーに細かい品質スコアは表示しません。画面では次の操作判断だけを表示します。

- `ready`
- `usable`
- `needs_review`
- `blocked`

内部では `score` を持ちますが、これはテスト、監査、開発者向けメタデータのための値です。一般の住所登録利用者には、何を直すべきかだけを示します。

## 公開メタデータ

登録時に保存・連携してよいのは `registrationReadiness.publicMetadata` だけです。

含めるもの:

- Address Element session ID
- Address Intent ID
- quality decision
- intent status
- pass / warning / fail の件数
- 職種別サマリ
- `no-raw-address-public-metadata`

含めないもの:

- 氏名
- 電話番号
- 実住所本文
- 部屋番号
- AGID本体
- AOID本体
- OCR抽出本文

## 今後の拡張

この readiness は Address Registration だけでなく、Address Element、POS Terminal、Field Handoff、Review Console にも同じ考え方で接続できます。各surfaceは独自UIを持ってよいですが、判定と公開メタデータの形は共通化します。
