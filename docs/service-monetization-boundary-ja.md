# AGID/AOID Service Monetization Boundary

Last updated: 2026-06-18

この文書は、AGID/AOIDの12サービスについて、無料で提供すべき本体と、有料にしてよい例外を分ける。基本方針は「どうしても無料で提供できないものだけ有料、あとは無料」である。対応する機械可読モデルは `src/lib/serviceMonetizationBoundary.ts` に置く。

## 原則

1. 12サービスすべてに無料の本体を置く。
2. 有料にしてよいのは、Hosted運用、外部手数料、重いZK計算、法務保管、SLA、人手審査、専用導入のように、継続コストが避けられないものだけ。
3. 可能な限り、無料のローカル版またはself-host版を用意する。
4. 有料機能がなくても、警告、拒否、要確認、失効、使用済み、削除、取消、基本receiptは扱える。
5. AGID生成、AGID decode、AGID-Sローカル復号、ローカル住所表示、言語タブ、郵便番号補完、基本住所検証、QR/NFC受付、基本POS、offline queue、基本receipt、Address Element埋め込みUI、高リスクモード、redaction、no-raw-addressテスト、セキュリティ修正、ユーザーの同意確認・取消・削除・exportは絶対に有料化しない。

## サービス別線引き

| サービス | 無料本体 | 有料にしてよい例外 |
| --- | --- | --- |
| AGID Resolver Service | AGID生成、AGID decode、逆引き、ローカル住所表示、住所表示、地名検索、local/self-hosted index | 高容量Hosted resolver、SLA、managed index更新 |
| Address Validation Service | 郵便番号補完、国別住所制度、基本住所検証、配送可否の基本判定、品質状態 | 公式ソース更新監視、配送業者別ルール運用、企業向け検証支援 |
| AGID Address Element | Address Element埋め込みUI、EC/CMS/買い物Agent向け埋め込み住所入力、AddressIntent event、言語対応 | merchant導入支援、enterprise checkout認証、カスタム不正対策 |
| AGID POS Terminal | QR/NFC受付、基本POS、AGID-Sローカル復号、送り状QR受付、受取人proof、配送handoff、基本receipt、offline queue | 端末fleet、certified device profile、managed sync、長期監査保管 |
| Address Portal | ユーザーの同意確認、scope、取消、削除、export、接続管理 | 組織通知workflow、監査用export bundle、法務連携 |
| Address Console / Dashboard | self-hosted API画面、Webhook設定、端末/issuer概要、redacted audit logs | Hosted multi-tenant、RBAC運用、APIキー運用、SLA、長期ログ |
| Hosted Registry API | registry schema、self-hosted issuer/revocation/freshness/nullifier/used-state | public hosted registryの可用性、監視、abuse対策、incident response |
| Address Review Console | 要確認、拒否理由、異議申し立てschema、住所衝突、再照合workflow | managed human review、case SLA、紛争エスカレーション |
| Address Evidence Vault | 写真/PDF取込、local OCR候補編集、redaction、暗号化local evidence envelope | 暗号化cloud保管、managed OCR、legal hold、保持期限管理 |
| Address Radar / Signal | 基本不正ルール、QR期限、nullifier再利用、端末信頼、品質review、理由コード | managed risk運用、carrier/merchant tuning、リスク担当者レビュー |
| Managed ZK Proof Service | 基本回路、public signal schema、self-host prover、verifier fixture、互換性テスト | proof queue、GPU/CPU prover capacity、proof SLA、verifier導入支援 |
| Payment / Settlement / Carrier Label Service | payment intent model、着払い/先払い状態、escrow interface schema、送り状QR形式 | 決済ネットワーク手数料、escrow運用、carrier API費、精算照合 |

## 有料例外の判断基準

有料化してよい条件:
- サーバー維持費が継続的に発生する。
- 外部の決済・配送・OCR・SMSなどに実費が発生する。
- ZK proof生成のように計算資源が大きい。
- 法務保管、legal hold、長期監査ログの責任が発生する。
- 人手審査、異議申し立て、紛争対応が必要になる。
- 企業・自治体・配送業者向けの専用環境、SLA、監査対応が必要になる。

有料化してはいけない条件:
- 公開仕様の検証に必要。
- ローカルで安全に使うために必要。
- ユーザーが自分の住所権限を取り戻すために必要。
- 高リスク環境で安全を守るために必要。
- セキュリティ修正、redaction、no-raw-address検証に関係する。
- 基本POS、offline queue、基本receipt、Address Element埋め込みUIなど、現場や開発者がHostedサービスなしで運用・検証するために必要。

## 推奨メッセージ

外向きの説明は次が安全である。

> AGID/AOIDの標準、SDK、AGID生成/decode、AGID-Sローカル復号、ローカル住所解決、言語タブ、郵便番号補完、基本住所検証、Address Element、基本POS、offline queue、基本receipt、Portal、基本Console、基本ZK仕様、安全機能はOSSで使えます。有料になるのは、Hosted運用、SLA、長期保管、外部手数料、重いproof生成、人手審査、専用導入など、継続コストが避けられない部分だけです。

この言い方にすると、暗号資産・ZK・配送・住所検証が絡んでも、「住所インフラを人質にする課金」ではなく、「運用コストを負担する課金」として説明できる。
