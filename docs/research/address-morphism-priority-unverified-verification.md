# 住所写像論 最優先未検証項の分解検証

作成日: 2026-06-29

このメモは、住所写像論で最優先に残っている未検証項を、地域・用途・データソース・失敗時挙動に分解して検証するための台帳です。

ここでの検証は、世界中の実住所を完全に実証したという意味ではありません。Local decomposition gates are checked, but world completeness has not been empirically proven. つまり、論文やREADMEでは「何を検証できたか」と「何をまだ検証していないか」を分けて扱います。

ローカル検証コマンド:

```bash
npm run verify:address-morphism-unverified
```

## 検証対象

| 未検証項目 | 地域分解 | 用途分解 | データソース | 失敗時挙動 | 現在の検証状態 |
| --- | --- | --- | --- | --- | --- |
| 世界規模の候補生成 completeness | 高密度郵便地域、弱郵便地域、郵便番号なし都市、島しょ・港湾、係争・越境 | 国際配送、EC、現場引渡、ホテル/POS/ロッカー | 公式郵便・行政、OSS地理、匿名化フィードバック | candidate missing は unresolved、近似候補は manual review | source-bound recall benchmark として扱う |
| 多言語検索 recall | 多文字体系、旧地名、別名、ラテン・非ラテン、越境名 | 地図検索、配送ラベル、ECフォーム | 言語別 alias pack、住所翻訳ルール、OSS/公式地名 | false merge は candidate-only、同一性判定は二次ゲートへ | recall layer であり identity preservation ではない |
| 自然地理・文化地物 coverage | 川、湖、島、砂漠、湿地、氷河、遺跡、海域 | 非郵便地物参照、災害・人道支援、研究地点 | OSM/Overture系、地名台帳、文化・極地・科学ソース | source missing は unresolved、境界不安定は additional evidence | feature-type/source-bound として扱う |
| GIS strict validation | 都市、島、海域、極地、境界重複地 | 郵便区画設計、配送区域、現場地図 | GIS静的データ、行政境界、OSS地理 | hard error と strict warning を分ける | hard error 0 と strict warning free は別主張 |
| 商用API比較 | 強郵便国、弱郵便国、郵便番号なし地域、島しょ | 住所検証、EC、KYC、国際配送 | Loqate/Experian/Melissa/Smarty等は承認後のみ | Commercial API live benchmark は terms/network approval なしでは実行しない | 比較計画であり勝利宣言ではない |
| 本物のZK回路安全性 | 匿名集合が小さい地域、越境、単一建物、稀な属性 | 居住・地域・配送可否・鮮度述語 | 回路実装、proof system、外部暗号監査 | 回路未監査なら zk-ready-only | proof envelope であり完全ZKではない |
| AGID/AOID本番セキュリティ | 全地域、オフライン、同期、共有、QR、権限委譲 | 住所登録、POS、配送、ホテル、ロッカー、API | mandatory security gate、no-raw-address gate、外部監査 | raw/private material risk は release block | ローカルゲートは必要条件、外部監査は未完 |

## 失敗時挙動の原則

- 候補集合に真の対象が入らない場合は、`unresolved` または `additional-evidence-required` にする。
- 多言語 alias や翻訳が衝突した場合は、`candidate-only` にし、構造・履歴・ソースゲートへ渡す。
- ソースが古い、ライセンス不明、利用目的不明の場合は、検証済み住所として出さない。
- 商用API比較は、利用規約、ネットワーク利用、APIキー、同一入力条件の承認なしに実行しない。
- ZKは、回路実装、証明システム選定、witness leakage監査、外部暗号監査が終わるまで `ZK-ready` とだけ書く。
- private address、recipient、witness、private key、raw connector error が混入する可能性がある場合は release block にする。

## 論文で安全な表現

- 「候補生成は、測定済み地域とソース範囲内で recall を評価する」
- 「多言語展開は recall layer であり、同一性保存は二次ゲートで扱う」
- 「自然・文化地物は feature type と source coverage に依存する」
- 「GISは machine-readable validation と strict warning-free validation を分ける」
- 「商用API比較は同一条件の benchmark 計画として扱う」
- 「ZK-ready envelope はあるが、完全なZKシステムではない」
- 「AGID/AOID本番安全性は応用層の外部監査対象である」

## 禁止する表現

- 「全世界の住所が候補集合に必ず入る」
- 「全ての言語・別名・旧地名を曖昧性なく解決する」
- 「世界中の自然地理・文化地名を全て認識済み」
- 「strict GIS validation が完了した」
- 「商用住所検証APIに勝った」
- 「ZK proof は完成している」
- 「AGID/AOID は本番で無条件に安全」

## 次の実験順

1. 地域 archetype 別の candidate recall@k と candidate-miss-rate を測る。
2. 多言語 alias の recall と false-merge-rate を測る。
3. 自然・文化地物の source-bound coverage benchmark を作る。
4. GIS strict warning の burn-down を進める。
5. 明示承認後にのみ商用API比較を同一入力・同一用途で実施する。
6. ZK回路の最小述語を選び、回路実装と監査計画を分離する。
7. AGID/AOID本番セキュリティは、no raw address、鍵管理、失効、同期、監査ログを外部監査へ渡す。

## 結論

この台帳で検証できるのは、未検証項を放置せず、失敗時に verified として出さない設計になっていることです。実世界の完全性、商用比較、完全ZK、本番安全性は、別途データセット・外部承認・暗号監査・運用監査が必要です。
