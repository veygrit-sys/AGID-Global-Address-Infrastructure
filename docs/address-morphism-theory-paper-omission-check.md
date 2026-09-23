# 住所写像論プロ稿 漏れチェックと分離方針

対象: `docs/address-morphism-theory-paper-professional-draft.md`

運用上の正本: `docs/research-paper-volume-separation.md`

この文書は漏れチェックと編集メモである。AMT本体、AGID/AOID応用、ZK Address Predicate の分冊境界は、`docs/research-paper-volume-separation.md` と `src/lib/researchPaperVolumeSeparation.ts` を優先する。今後の編集では、AMT本体に実装仕様や暗号証明の詳細を戻さず、AGID/AOID応用論文とZK Address Predicate論文へ移す。

## 結論

AMT本体論文として必要な中核項目はおおむね揃っている。特に、住所参照不可能性、候補生成、構造非類似度、クラスタ、未解決/曖昧出力、PID発行、履歴グラフ、自然地理、垂直参照、検証方法の分離は論文の骨格として十分強い。

ただし、ZKPやAGID/AOIDをAMT本体に入れすぎると、読者が「住所解決理論」「暗号プロトコル」「アプリケーション標準」を同じ論文内の同じ主張として読んでしまう。これは危険なので、AMT本体、ZKP別論文、AGID/AOID応用論文の三層に分離する方針が正しい。

## AMT本体論文に残すべきもの

| 項目 | 現状 | 判定 | 理由 |
| --- | --- | --- | --- |
| 住所の定義 | あり | 残す | 住所を圧縮された時間依存・文脈依存参照として定義する部分はAMTの中心。 |
| 観測写像と非単射性 | あり | 残す | 住所参照不可能性定理の前提。 |
| 住所参照不可能性定理 | あり | 残す | 論文の主定理。Lean形式化とも接続しやすい。 |
| 候補生成 | あり | 残す | 実装と理論の接続点。 |
| 構造非類似度 | あり | 残す | 文字列一致だけではない住所解決を説明する要。 |
| クラスタ/同値類 | あり | 残す | 表記揺れ、行政変更、自然地理、縦方向参照を統合できる。 |
| 未解決/曖昧/拒否 | あり | 残す | 「間違った精密さ」を防ぐ安全機構。 |
| PID発行ゲート | あり | 残す | AMTを単なる理論でなく実装可能なプロトコルにする。 |
| 履歴グラフ | あり | 残す | 住所保存則、split/merge、行政変更を扱うために必要。 |
| 文脈相対最適性 | あり | 残す | 配送、行政、緊急対応、不動産で最適出力が違うことを示す。 |
| 住所圧縮/エントロピー | あり | 残す | 郵便番号、座標コード、PIDを比較する理論基盤。 |
| 自然・文化・垂直参照 | あり | 残す | 川、湖、島、砂漠、氷原、遺跡、世界遺産、建物階層を扱うため必要。 |
| PIDと応用識別子の境界 | あり | 残す | PIDはAMT本体、AGID/AOIDは応用論文と明示するため必要。 |
| 通信・登録・監査モデル | あり | 残す | 実装・API・監査へ接続するため必要。ただしAGID/AOID詳細とZKP詳細は別稿。 |
| 検証方法の分類 | あり | 残す | Lean、GIS、実装、ベンチマークを混同しないため重要。 |
| 限界 | あり | 残す | 論文をプロの主張にするうえで必要。 |

## AMT本体でまだ強化した方がいい項目

| 優先度 | 追加/強化項目 | 書く場所 | 内容 |
| --- | --- | --- | --- |
| S | 章冒頭の図式一覧 | 第5章または第7章前 | 入力表現からPID発行までの全体可換図式を置く。 |
| S | PIDと応用識別子の境界図 | 第14章 | `AMT = resolution/PID`, `AGID/AOID = application`, `ZKP = companion protocol` を明示する。 |
| S | PID発行監査エンベロープ | 第8章または第15章 | 候補生成、クラスタ、未解決ゲート、履歴更新、PID発行を通ったことを記録する形式を出す。 |
| A | 品質・公式ソースモデル | 第8章または第16章 | `Source = authority, license, jurisdiction, freshness, coverage, reliability, allowedUse` を明示する。 |
| A | ベンチマーク設計 | 第18章 | 都市、田舎、島、山地、砂漠、湿地、氷原、自然地理、縦方向住所をデータセット族として明確にする。 |
| A | 反例集 | 定理章の後または付録 | 非単射観測、候補欠落、2D射影衝突、履歴split、名称再利用の反例を表にする。 |
| A | 数式記号表 | 付録A | `W_t`, `X_t`, `S`, `O_t`, `D_{c,t}`, `Pi_{\delta,t}`, `E_t`, `R_{c,t}` をまとめる。 |
| B | 商用住所検証APIとの比較条件 | 第18章 | Loqate等に勝つ/負けるではなく、評価条件別に比較する。 |
| B | 倫理・安全 | 第17章 | ストーカー、詐欺、配送偽装、災害時情報漏洩、地図ソース汚染を整理する。 |

## AMT本体から外すべきもの

| 項目 | 理由 | 移動先 |
| --- | --- | --- |
| ZK Address Proof の回路安全性 | AMTだけでは暗号学的健全性を証明できない。 | ZKP別論文 |
| ZK Residence Proof | 住所理論ではなく証明プロトコルの話。 | ZKP別論文 |
| ZK Delivery Eligibility | 配送可能性の秘匿証明はAMTの応用。 | ZKP別論文 |
| nullifier設計 | ハッシュ、スコープ、epoch、リンク不能性の暗号設計が必要。 | ZKP別論文 |
| revocation/freshness root | Credential運用と暗号コミットメントの設計。 | ZKP別論文 |
| issuer trust registry | DID/VC/認証局に近い領域。 | ZKP別論文またはプロトコル論文 |
| proof bundle registry | 互換性、スコープ、チャレンジ、replay対策が必要。 | ZKP別論文 |
| 匿名レート制限 | ZKP/nullifierの応用でありAMT本体ではない。 | ZKP別論文 |
| 品質しきい値証明 | AMT本体では品質スコアを定義し、証明化は別論文。 | ZKP別論文 |
| AGID標準仕様 | AMT本体ではなく公開地理参照の応用標準。 | AGID/AOID応用論文 |
| AOID private record / QR / sync | AMT本体ではなく私的操作IDの実装・運用仕様。 | AGID/AOID応用論文 |
| AGID/AOID通信境界 | API、SDK、QR、sync、data packの具体設計は応用論文で扱う。 | AGID/AOID応用論文 |
| AGID/AOID conformance | パリティベクトル、OpenAPI、QR安全性、公開データパックは標準論文で扱う。 | AGID/AOID応用論文 |

## AGID/AOID応用論文に必ず書くべきもの

| 項目 | 必須理由 |
| --- | --- |
| AMTとの境界 | AMTが意味論、AGID/AOIDが応用識別子であることを明示する。 |
| AGID定義 | 公開地理・住所・建物・地図特徴の参照層として定義する。 |
| AOID定義 | 所有者管理の私的配送・操作・委譲・同意層として定義する。 |
| AGID/AOID分離原則 | public facts と private delivery/control facts を混ぜない。 |
| public evidence model | 道路、橋、公園、水辺、山、砂漠、湿地、氷河、遺跡などの公開特徴を扱う。 |
| AOID private data model | recipient、phone、unit、room、delivery instructionなどを私的に保持する。 |
| QR model | public AGID QR、public AOID reference QR、full AOID transfer QRを分ける。 |
| SDK/API conformance | encode/decode/cellBounds、OpenAPI、source metadata、release artifactsを定義する。 |
| security/privacy | private field contamination、ownership confusion、plaintext sync leakageを防ぐ。 |
| ZKPとの境界 | AOID ownership proofやdelivery eligibility proofはZKP別論文に渡す。 |

## ZKP別論文に必ず書くべきもの

| 項目 | 必須理由 |
| --- | --- |
| AMTとの境界 | AMTが意味論を与え、ZKPが公開述語だけを証明することを明示する。 |
| witnessモデル | 秘密住所、PID、AOID、Credential、履歴、品質スコアをどう扱うか。 |
| public claimモデル | 公開されるのは国・都市・配送可能性・同居・所有などの述語だけ。 |
| anonymity set条件 | 述語が一意住所まで絞るなら秘匿にならない。 |
| scope/domain separation | 同じ証明が別用途で再利用・追跡されないようにする。 |
| nullifierモデル | 重複登録防止と匿名レート制限の中核。 |
| revocation/freshness | 古い住所資格証明を無効化するため必須。 |
| issuer trust registry | どの発行者の住所credentialを信頼するか。 |
| proof bundle compatibility | ZK Address、Residence、Delivery、AOID Ownership、PID Auditなどの衝突防止。 |
| disclosure escalation | 商人には配送可能性だけ、配送業者には必要最小限の配送情報だけ出す流れ。 |
| 検証計画 | Leanで集合論的補題、実装テストで互換性、回路監査で暗号安全性、GISで地域述語を検証する。 |

## 最終方針

AMT本体論文は「住所解決の数理理論」として完成させる。AGID/AOIDは「AMTを使った公開地理参照と私的操作IDの応用標準」として別論文化する。ZKPは「AMTから得られた参照クラス・属性・監査エンベロープを、秘匿したまま述語証明に使う別プロトコル」として別論文化する。

この分離により、AMT本体は過剰主張を避けられ、AGID/AOID論文は標準・API・QR・SDK・プライバシー境界を十分に扱え、ZKP論文は暗号学・Credential・nullifier・失効・鮮度・匿名性を十分な深さで扱える。
