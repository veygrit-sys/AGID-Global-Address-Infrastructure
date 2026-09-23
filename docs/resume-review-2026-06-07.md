# レジュメ見直しメモ

作成日: 2026-06-07

## 結論

レジュメ群はそのまま増やし続けるより、役割を固定した方が保守しやすい。現時点では `docs/project-resume.md` をプロダクト全体の母艦にし、AGID 数理、AGID/AOID 境界、AOID 応用論文、住所写像論、AMN、ZK 住所述語は補助レジュメとして分けるのが最も安全である。

## 母艦レジュメ

`docs/project-resume.md` は、AGID アプリ全体の要約として残す。ここには、プロダクトの目的、AGID/AOID の境界、現在の実装状況、検証コマンド、直近の改善点、ロードマップだけを書く。

数理証明、ZK、AMN、AOID の詳細、PDF 論文構成、未検証仮説は主レジュメに詰め込まない。主レジュメは読み始めの案内板として軽く保つ。

## 補助レジュメの役割

| 文書 | 役割 |
| --- | --- |
| `docs/agid-math-model-resume.md` | AGID の座標からセルへの決定的な数理モデル。 |
| `docs/agid-aoid-design.md` | AGID と AOID の公開/非公開境界、通信、同期、QR、API の設計原則。 |
| `docs/aoid-detailed-paper-ja.md` | AOID 応用論文。9-16 桁 Base32、linked AGID anchor、private payload、所有証明、同期、失効を扱う。 |
| `docs/address-morphism-theory-verified-resume.md` | Lean、GIS、実装テストで検証済みの住所写像論レジュメ。論文主張の安全な根拠。 |
| `docs/address-morphism-network-resume.md` | AMN の公開 envelope、registry、API、ZK/Polkadot 接続方針。 |
| `docs/address-morphism-theory-ii-zero-knowledge-address-predicates.md` | 住所写像論 II としての ZK 住所述語。住所意味論と暗号証明を分離する。 |
| `docs/unused-file-material-audit-2026-06-07.md` | いらないファイル・資料・生成物候補の監査結果。削除判断の前提資料。 |

## 今回直した点

- `docs/project-resume.md` にレジュメ対応表を追加した。
- `docs/project-resume.md` に最新の AOID ID ルールと 2026-06-07 の起動/ビルド/監査結果を反映した。
- `docs/agid-math-model-resume.md` の更新日を揃え、AGID 数理の範囲と AOID/ZK/AMN/住所検証との境界を追記した。
- `docs/agid-aoid-design.md` に AOID の 9-16 桁 Base32、linked AGID hash anchor、16 桁ゾロ目禁止、4 連番禁止、所有証明ではないことを追記した。
- `docs/address-morphism-network-resume.md` に更新日と位置づけを追加し、AMN を「実装済み暗号通貨」や「全住所完全解決」と誤読されないようにした。

## 残っている整理点

1. `docs/address-morphism-theory-paper-chapter-resume.md` は 16 章の中核英語論文レジュメである。
2. `docs/address-morphism-theory-expanded-japanese-chapter-resume.md` は 21 章の拡張日本語構成レジュメである。
3. この 2 つは矛盾ではないが、どちらも「最終構成」のように見えると読者が迷う。
4. 推奨は、16 章版を `core paper resume`、21 章版を `expanded theory / book-length resume` と明記すること。
5. `output/pdf/docs` や過去の PDF 生成物は、最新版ソースではなく成果物アーカイブとして扱うべきである。

## 書き方の原則

- 検証済みの主張は、対応する Lean、GIS、実装テスト、または監査文書を示す。
- 未検証の主張は、予想、設計仮説、検証予定、または応用構想として明示する。
- AGID は公開地理文脈、AOID は所有者管理の私的住所関係、PID は解決済み参照の永続識別子、AMN は監査 envelope、ZK は選択的開示層として分ける。
- ユーザー向け画面の品質スコアは直接表示せず、内部判定、注意表示、再検証対象化に使う。
- 「商用 API に勝つ」「完全解決」「完全 ZK」「全世界対応済み」などは、同一条件 benchmark と回路監査が終わるまで避ける。

## 次の推奨作業

まず `docs/address-morphism-theory-paper-chapter-resume.md` と `docs/address-morphism-theory-expanded-japanese-chapter-resume.md` の冒頭に、それぞれの用途を明記する。その後、古い PDF 生成物を削除ではなく `archive candidate` として分類し、必要なものだけ最新版 PDF として再生成する。
