# 配送POSシミュレーション v1

このノートは、AGID/AOID POS Terminal を「受付する人」「管理者」「配送したい人」「配送員」「受取人」「越境審査担当」の立場で動かしたときに、必要になる画面、ボタン、画面遷移、保留理由を整理するための運用シミュレーションである。

実行可能なモデルは `src/lib/deliveryPosSimulation.ts` に置き、国内版と越境版のシナリオは `src/lib/deliveryPosSimulation.test.ts` で検証する。

## 役割と目標

| 立場 | 主な目標 | 制御すべきリスク |
| --- | --- | --- |
| 発送者 | QR/NFC/AGID-S を提示し、配送を依頼する | 詳細住所や AOID を必要以上に出してしまう |
| 受付スタッフ | 1回のスキャンから accept / review / reject を判断する | 信頼状態、住所品質、鮮度を見ずに荷物を受ける |
| 配送員 | POS 受付時の判断と配送完了を再照合する | 受付記録と実配送の対応が切れる |
| 受取人 | NFC/QR で受取または本人側の提示を行う | 受取時に個人情報を過剰開示する |
| 管理者 | 例外、拒否、端末診断、監査、再照合レポートを扱う | 権限なしの上書き、証跡なしの解除、端末不良 |
| 越境審査担当 | HSコード、関税参考情報、通貨、通関補助情報を見る | 補助データを法的な通関判断として扱う |

## 国内版シミュレーション

### 標準フロー

1. `role-login` で受付者がロールを選ぶ。
2. `scan-intake` で QR / NFC / 手入力を受ける。
3. `decrypt-trust` で AGID-S 復号、レジストリ鮮度、失効、使用済み状態を見る。
4. `address-resolution` で住所表示と言語タブを確認する。
5. `domestic-decision` で受理、要確認、拒否を決める。
6. `handoff` で赤字化済みラベルを印刷し、配送員へ引き渡す。
7. `reverification-report` で配送完了後に再照合する。

必要な主ボタン:

| ボタン | 目的 |
| --- | --- |
| `scan-qr` / `scan-nfc` / `manual-entry` | 入力経路を明示する |
| `decrypt-agid-s` | 鍵を持つ端末だけが AGID-S を開く |
| `check-registry` | 失効、使用済み、鮮度を見る |
| `switch-address-language` | 住所表示タブの有効性を確認する |
| `accept-domestic-shipment` | 通常受理 |
| `hold-for-review` | 要確認で止める |
| `reject-shipment` | 明確な拒否 |
| `print-redacted-label` | 個人情報を出さずにラベルを印刷する |
| `create-handoff` | 配送員への引き渡しを記録する |
| `complete-delivery` / `rescan-for-reverification` | 配送完了後の再照合 |

### 例外フロー

国内でも、次の場合は `exception-audit` に送る。

- AGID-S が期限切れ、失効、使用済み
- レジストリが古い
- 住所品質が低い
- QR/NFC は読めるが、必要な配送情報が不足
- プリンタ、キャッシュドロワー、バーコードリーダーの状態が不明
- スタッフ権限が足りない

管理者は `device-diagnostics` でプリンタ、キャッシュドロワー、バーコードリーダーを確認し、必要なら `offline-sync-queue` に送る。

## 越境版シミュレーション

越境版は国内版に加えて、`cross-border-declaration` と `cross-border-risk-review` を必要とする。住所の正確性だけでなく、品目、HSコード、申告価格、通貨、発送元国、宛先国、通関補助情報が関係するためである。

### 標準フロー

1. `scan-intake` で宛先 AGID/AOID/AGID-S または住所を受ける。
2. `cross-border-declaration` で HSコード、品目、価額、通貨、発送元、宛先を入力する。
3. `cross-border-risk-review` で補助データを確認する。
4. `domestic-decision` と同じ判定面で受理、要確認、拒否を決める。
5. `handoff` と `reverification-report` で配送員への引き渡しと再照合を行う。

越境で使うボタン:

| ボタン | 目的 |
| --- | --- |
| `enter-hs-code` | HSコードを入力または補助検索する |
| `check-customs-evidence` | 関税・貿易・通貨データの根拠を確認する |
| `estimate-duty` | 関税や通貨換算を参考値として表示する |
| `mark-customs-review` | 最終判断ができない場合に要確認へ送る |

## 採用するオープンソース/無料データ

初期導入は重くしない。既存の `tradeComplianceDataPlan.ts` にあるもののうち、次を越境POSの補助データとして使う。

| データ | 使い方 | 注意 |
| --- | --- | --- |
| `datasets-harmonized-system` | オフライン HSコード補助 | 法的な最終分類ではない |
| `wto-tariff-data` | 関税根拠の静的スナップショット | リアルタイム税額保証に使わない |
| `world-bank-wits` | サーバー側の定期更新 | ブラウザから直接呼ばない |
| `frankfurter-api` | 通貨換算の参考値 | 決済レートとは別物 |

この段階では新しい依存パッケージは追加しない。既存の静的データ計画と POS モデルだけで、UI/UXの不足を検出できる。

## あぶり出した画面不足

今後 UI に明示すべき画面は次の通り。

| 画面 | 理由 |
| --- | --- |
| `role-login` | 受付、管理者、配送員で許可ボタンを変える |
| `scan-intake` | QR、NFC、手入力を同じ入口で扱う |
| `decrypt-trust` | 復号、失効、使用済み、鮮度を1画面で見る |
| `address-resolution` | 住所表示品質と言語タブの有効性を見る |
| `domestic-decision` | accept / review / reject を大きく表示する |
| `cross-border-declaration` | HSコード、品目、価額、通貨、国を入力する |
| `cross-border-risk-review` | 通関補助データを法的判断と分離して見る |
| `device-diagnostics` | プリンタ、キャッシュドロワー、バーコードリーダーを診断する |
| `exception-audit` | 拒否・要確認を後から追えるようにする |
| `handoff` | 配送員への引き渡しを記録する |
| `reverification-report` | 配送後に同じ受付記録と再照合する |
| `offline-sync-queue` | 災害・店舗・通信不良時に後で同期する |
| `manager-settings` | 権限、鍵、レジストリ、端末設定を分ける |

## 次にUIへ反映する優先順位

1. 判定画面で `accept / review / reject` を最優先表示する。
2. レジストリ鮮度、失効、使用済み、住所品質を同じ信頼状態として見せる。
3. 国内と越境で画面を分け、越境だけ HSコード・関税・通貨・通関補助を出す。
4. 拒否・要確認は必ず `exception-audit` に残す。
5. プリンタ、キャッシュドロワー、バーコードリーダーの診断を管理者設定からだけでなく、受付中の例外導線からも開けるようにする。
6. 配送完了後の `reverification-report` を、店舗・配送員・管理者の共通レポートにする。
