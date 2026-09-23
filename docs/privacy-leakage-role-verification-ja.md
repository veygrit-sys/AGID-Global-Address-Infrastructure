# プライバシー漏洩対策と役割充足の検証メモ

## 目的

AGID/AOID/POS/送り状/ZK Address Proof 系の設計では、プライバシー対策が強すぎると現場で必要な判定情報まで消えてしまい、弱すぎると住所・本人・配送履歴が漏れる。したがって、対策の評価は「秘匿できているか」だけでは不十分であり、「その用途の役割を果たす最小限の公開信号が残っているか」も同時に検証する必要がある。

この検証では、各用途を role として分け、次の二条件を同時に満たすかを判定する。

1. 禁止された平文・個人情報・追跡可能情報が公開 payload に出ていない。
2. その role に必要な公開信号が不足していない。

## 検証対象 role

| role | 漏洩させないもの | 残すべき公開信号 |
| --- | --- | --- |
| public-agid-reference | 氏名、電話番号、部屋番号、raw address | 公開 AGID、粗い公開ラベル、confidence/review 状態 |
| aoid-private-registration | AOID 本文、所有者、詳細住所 | commitment、所有 proof、同意 scope、重複防止 nullifier |
| agid-s-high-risk-sharing | AGID 本体、正確座標、受取人情報 | 暗号化 token、jti、有効期限、失効状態、高リスク policy |
| zk-residence-predicate | 住所 witness、AGID、credential secret | predicate 結果、scope、challenge hash、issuer、freshness、revocation |
| delivery-pos-handoff | proof code、実住所、電話番号 | POS 判定、carrier scan、recipient auth、端末署名 receipt、nullifier |
| issuer-trust-credential | subject address、AOID subject、credential secret | issuer、issuer trust root、revocation policy、credential scope |

## 実装方針

`src/lib/privacyLeakageRoleVerification.ts` は、role ごとに `requiredSignals` と `forbiddenRoleFieldKeys` を持つ profile を定義する。payload は再帰的に走査し、公開してよい運用信号と禁止フィールドを分離して判定する。

既存の `securityPrivacyDesign.ts` と `agidSecurity.ts` を併用し、次を確認する。

- surface ごとの禁止フィールド
- public AGID payload としての妥当性
- high-risk mode で必要な expiry / jti / revocation
- ZK proof envelope の witness 非公開性
- POS receipt の scan-to-decision 情報

## 検証結果

テストでは、公開 AGID、AGID-S 高リスク共有、ZK residence predicate、配送 POS handoff、issuer trust credential を通した。過剰秘匿で role に必要な信号が欠ける場合も fail になるため、「漏らさないが使えない」設計を検出できる。

確認できたことは次の通り。

- AGID-S は raw AGID と正確座標を出さず、encrypted token / jti / expiry / revocation を残せば役割を果たせる。
- ZK Address Proof は住所 witness を出さず、predicate result / scope / issuer / freshness / revocation を残せば検証可能な公開 envelope になる。
- POS handoff は proof code を保存せず、carrier receipt / recipient auth result / terminal signature / nullifier を残せば再照合可能になる。
- issuer trust は subject の住所や AOID を持たず、issuer root と policy を公開すれば検証レイヤーとして成立する。

## 制限

この検証は payload 構造と公開信号の検証であり、ZK 回路の完全性証明や暗号実装監査そのものではない。実運用では、回路監査、鍵管理、ログ保存方針、サーバー registry、RPC/receipt 確認、端末署名鍵の失効管理を別途検証する必要がある。
