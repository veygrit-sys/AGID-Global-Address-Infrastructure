# AMT / ZK 住所研究 日次ノート — 2026-07-24

## 範囲と結論

前回の checkpoint 非分岐モデルを AddressQL の statement binding へ接続した。実住所、実受取人、秘密鍵、witness、production traffic は使用していない。今回の結論は、proof が root 値だけを公開入力に含めても、authority kind、checkpoint position、policy/boundary epoch と同時に拘束されなければ、別 authority の root 差替えや古い境界意味の replay を防げない、である。

## 新しい理論案

住所述語の受理対象を単なる `Verify(proof, roots)` ではなく、

`Accept(P,B,C) = Verify(P) ∧ Bind(P,B) ∧ CheckpointsValid(C) ∧ AuthorityComplete(B) ∧ TransitionSafe(B)`

とする。binding ref は `(authorityKind, checkpointDigest, rootHash, boundaryEpoch)` を持つ。`deliverable` は issuer、revocation、postal-zone、translation-profile、carrier、customs の直積を要求し、いずれか一軸を別 root で代替できない。

境界更新 `T : Z_e → P⁺(Z_e+1)` は各旧 zone に一つ以上の新 zone を割り当てる全域関係とする。split/merge における翻訳自然性は、配送対象 referent `r` について `Translate_e(r) = Translate_e+1(T(r))` が保存されることを要求する。文字列表現の一致ではなく referent の一致を検査対象にする。

## 発見した弱点と反例

1. 現行 AddressQL v0.6 の `roots` は opaque string であり、root がどの signed checkpoint、authority、boundary epoch に属するかを schema 単独では拘束しない。
2. customs root を attacker root に差し替えても、proof artifact がその root 集合へ正しく再生成されれば、外部 policy binding がなければ誤った越境判定を受理し得る。
3. 古い postal-zone boundary の proof を新しい translation profile と組み合わせると、各 proof が局所的に正しくても同じ zone code の意味が異なり得る。
4. split で旧 zone の一部に遷移先がない場合、その住民・建物は暗黙に消失する。これは「コード生成の成功」では検出できない。
5. translation 前後の表示が妥当でも referent が変われば、自然性は破れて誤配送候補となる。
6. checkpoint digest の文字列連結は今回の非暗号学的 fixture であり、曖昧性のない canonical encoding と domain-separated hash が未実装である。

## 提案した数学的精緻化

- `AuthorityComplete_k(B)` を claim kind ごとに定義し、必要 authority の欠落を平均 confidence で補わない。
- `RootBound(ref,C)` を root 一致だけでなく、checkpoint digest、authority kind、boundary epoch の同時一致とする。
- `TransitionTotal(T)` と `TargetClosed(T)` を分離し、全旧 zone に像があり、像が新 zone 集合の外へ出ないことを要求する。
- `TranslationNatural(T,τ_e,τ_e+1)` を referent 保存義務とし、違反は自動 accept ではなく `manual_review` とする。
- root/checkpoint/boundary の substitution・replay は `block`、遷移写像欠落・naturality 不明は `manual_review` 以上に単調降格させる。

## 実装候補と今回の成果

- `src/lib/addressQlCheckpointBinding.ts` に claim 別 authority 完備性、checkpoint binding、root/digest/epoch substitution 検出、split/merge 全域性、target closure、translation naturality gate を追加した。
- `src/lib/addressQlCheckpointBinding.test.ts` に安全な越境配送、customs root 差替え、旧 boundary replay、非全域 split、referent 変化の合成ベクトルを追加した。
- 新規モデルと checkpoint、AddressQL ZK、VATT、Postal Zone Designer の 34/34 tests が成功した。
- W3C Bitstring Status List v1.0 の herd privacy、cache/proxy、status issuer 分離は、revocation checkpoint を issuer checkpoint と別軸に保持する判断を支持する。IETF SCITT の Signed Statement・Receipt・append-only log の区別は、proof と transparency receipt を別義務にする参考となる。

## 検証が必要

- CBOR/JSON canonicalization、長さ接頭辞、domain separation を備えた実 checkpoint digest
- proof circuit または verifier receipt が binding 全体を public-input commitment に含むことの暗号検証
- split/merge の many-to-many 遷移、区域消滅、紛争地域の複数正当 view、越境 customs policy change
- translation naturality の referent identifier 定義と、PID merge/split 時の可換図
- Bitstring status list の小規模 issuer/地域での herd privacy、取得監視、cache freshness
- property-based test と Lean による `TransitionTotal`、`TargetClosed`、substitution rejection の形式化

## 残余リスク

今回の digest と verifier は protocol-level の合成 gate で、署名、Merkle inclusion、SNARK soundness、canonical hash を検証しない。正当に複数存在する国境 view を攻撃と誤分類する危険、authority 結託、古い carrier/customs evidence、status-list 取得相関、低匿名性 zone、翻訳 profile の悪意ある referent 再割当は残る。production 利用には audited cryptographic binding、永続 checkpoint cache、multi-view governance、privacy-preserving status retrieval が必要である。

## 参照した一次資料

- W3C, Bitstring Status List v1.0, Recommendation, 2025-05-15: https://www.w3.org/TR/vc-bitstring-status-list/
- IETF, SCITT Architecture Internet-Draft: https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/
- Circom documentation, public/private signals: https://docs.circom.io/circom-language/signals/
