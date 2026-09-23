# 住所写像論 日本語版 v1 第10章 検証ノート

対象: `docs/address-morphism-theory-ja-v1-master.md` 第10章「未解決状態の理論」

目的: 第10章の主張のうち、Lean、GIS証明生成、実装テストで確認できたものを整理し、本文で強く書ける範囲と、弱めて書くべき範囲を分ける。

## 0. 結論

第10章は、住所写像論の安全性を支える章として強く採用できる。

特に、次の主張は検証済みである。

1. `ambiguous` は、どの実体も解決済みとして返さない。
2. `unresolved` は、どの実体も解決済みとして返さない。
3. `rejected` は、どの実体も解決済みとして返さない。
4. 非発行状態は、偽の実体を発行しない。
5. 候補欠落、エネルギー過大、候補間マージン不足、品質不足、鮮度不足、リスク過大は、PID発行の許容条件を壊す。
6. 実装では、近接タイは `ambiguous`、弱証拠は `unresolved` になり、PIDは発行されない。
7. PID発行監査は、`unresolved` の結果に対して証明を発行しない。

ただし、第10章本文の `conditional` は現時点のLean型 `ResolutionOutcome` には含まれていない。したがって、`conditional` は「Leanで証明済みの基本出力」ではなく、「実装・UI・API上の追加情報要求状態」として書くのが正確である。

## 1. 検証コマンド

| 種別 | コマンド | 結果 |
| --- | --- | --- |
| Lean core | `lean formal\AMTCore.lean` | pass |
| Lean extensions | `$env:LEAN_PATH='formal'; lean formal\AMTPaperExtensions.lean` | pass |
| GIS + Lean certificate | `npm run verify:gis:lean` | pass |
| 実装テスト | `npx tsx --test src\lib\addressMorphism.test.ts src\lib\pidIssuanceAudit.test.ts src\lib\pidLifecycleProof.test.ts src\lib\qualityThresholdProof.test.ts src\lib\addressCredentialFreshnessProof.test.ts src\lib\apiEndpoints.test.ts` | 41 tests pass |

## 2. 第10章の主張別判定

| 主張 | 判定 | 根拠 | 本文での扱い |
| --- | --- | --- | --- |
| `unresolved` は失敗ではなく安全出力である | 支持 | Leanの `unresolved_resolves_no_entity`, 実装の弱証拠テスト | 強く書いてよい |
| `ambiguous` は複数候補が残る安全出力である | 支持 | Leanの `ambiguous_resolves_no_entity`, 実装の近接タイテスト | 強く書いてよい |
| `rejected` は証拠不足ではなく拒否である | Leanで型として支持 | `rejected_resolves_no_entity` | 理論状態として書ける |
| `conditional` は基本状態である | 部分支持 | Lean型には未導入 | 補助状態として書く |
| `resolved` でもPID発行は自動ではない | 支持 | `IssueAdmissible`, `issueIfAdmissible` | 強く書いてよい |
| 非発行状態ではPIDを発行しない | 支持 | `issue_if_not_admissible_abstains`, 実装のPID null | 強く書いてよい |
| 理由コードを付けるべきである | 実装方針として支持 | `unresolvedReason`, audit reason code | 推奨仕様として書く |
| 解決状態は履歴・証拠で変わる | 実装方針として支持 | PID lifecycle tests | 第11章以降と接続して書く |

## 3. Leanで確認できる核

### 3.1 解決しない状態

`formal/AMTCore.lean` では、解決結果は次の型で表される。

```lean
inductive ResolutionOutcome (Entity : Type u) where
  | resolved : Entity -> ResolutionOutcome Entity
  | ambiguous : ResolutionOutcome Entity
  | unresolved : ResolutionOutcome Entity
  | rejected : ResolutionOutcome Entity
```

ここで、`ambiguous`、`unresolved`、`rejected` は、実体を返さない。

対応する定理:

| 定理 | 意味 |
| --- | --- |
| `ambiguous_resolves_no_entity` | `ambiguous` は任意の実体を解決済みにしない。 |
| `unresolved_resolves_no_entity` | `unresolved` は任意の実体を解決済みにしない。 |
| `rejected_resolves_no_entity` | `rejected` は任意の実体を解決済みにしない。 |

これは第10章の「未解決は失敗ではなく安全出力である」という主張の形式的な核である。

### 3.2 偽実体を出さない

Leanでは、非発行状態が偽の実体を出さないことも証明されている。

| 定理 | 意味 |
| --- | --- |
| `ambiguous_emits_no_false_entity` | `ambiguous` は偽実体を発行しない。 |
| `unresolved_emits_no_false_entity` | `unresolved` は偽実体を発行しない。 |
| `rejected_emits_no_false_entity` | `rejected` は偽実体を発行しない。 |

このため、第10章では `ambiguous` と `unresolved` を「精度不足のログ」ではなく、「誤発行を避ける出力」と定義できる。

## 4. PID発行ゲートとの接続

Leanの `IssueAdmissible` は、PID発行に必要な条件をまとめる。

```lean
def IssueAdmissible
    (candidates : List Entity)
    (entity : Entity)
    (bestEnergy secondEnergy energyThreshold margin : Nat)
    (qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit : Nat) :
    Prop :=
  entity ∈ candidates /\
  ScoreSelectable bestEnergy secondEnergy energyThreshold margin /\
  qualityThreshold <= qualityScore /\
  freshnessAge <= freshnessLimit /\
  riskScore <= riskLimit
```

この定義により、次の不許可条件がLeanで確認されている。

| 条件 | Lean定理 | 第10章での意味 |
| --- | --- | --- |
| 候補に存在しない | `missing_candidate_prevents_issue` | 候補欠落は `unresolved` または拒否対象。 |
| エネルギーが高すぎる | `high_energy_prevents_issue` | 最良候補でも弱ければ発行しない。 |
| 候補間マージン不足 | `low_margin_prevents_issue` | 近接タイは `ambiguous`。 |
| 品質不足 | `low_quality_prevents_issue` | 品質しきい値未満は発行しない。 |
| 鮮度不足 | `stale_freshness_prevents_issue` | 古い証拠やcredentialは発行しない。 |
| リスク過大 | `high_risk_prevents_issue` | 衝突・誤解決リスクが予算超過なら発行しない。 |

また、`issue_if_not_admissible_abstains` により、許容条件が満たされない場合は `unresolved` へ落ちることが示される。

## 5. 複数候補と residual uncertainty

第10章の `ambiguous` は、単に「候補が多い」という意味ではない。重要なのは、残った候補の不確実性が安全に無視できないことである。

Leanでは、候補数を残差不確実性の簡単な代理量として扱う。

| 定義・定理 | 意味 |
| --- | --- |
| `CandidateResidualZero` | 残差候補が1以下であること。 |
| `multiple_candidates_prevent_zero_residual` | 複数候補なら残差ゼロではない。 |
| `proxy_residual_forces_ambiguous_abstention` | 複数候補の代理モデルでは `ambiguous` が停止状態になる。 |

本文では、次のように書くと正確である。

> `ambiguous` は、複数候補が存在するだけでなく、それらを分離する十分な証拠、文脈、粒度、または履歴が不足している状態である。

## 6. 実装で確認できる挙動

### 6.1 `statusFor`

`src/lib/addressMorphism.ts` の `statusFor` は、次の順序で状態を決める。

1. 候補がなければ `unresolved`。
2. 証拠が弱ければ `unresolved`。
3. エネルギーが高すぎれば `unresolved`。
4. 二位候補との差が小さい、または確率が低ければ `ambiguous`。
5. 自然地理で郵便住所が不足する場合は `partial`。
6. 十分な証拠・確率・低エントロピーなら `verified`。
7. それ以外は `partial`。

第10章にとって重要なのは、`verified` や `partial` に進む前に `unresolved` と `ambiguous` のゲートが置かれている点である。

### 6.2 近接タイ

`addressMorphism.test.ts` では、IllinoisとMassachusettsの同名地名が近接タイになった場合に、結果が `ambiguous` になり、PIDが `null` になることを確認している。

```ts
assert.equal(result.status, 'ambiguous');
assert.equal(result.pid, null);
```

これは第10章の `ambiguous` の実装根拠である。

### 6.3 弱証拠

弱い候補しかない場合、実装は `unresolved` を返し、PIDを発行しない。

```ts
assert.equal(result.status, 'unresolved');
assert.equal(result.pid, null);
```

これは第10章の `unresolved` の実装根拠である。

### 6.4 PID監査との接続

`pidIssuanceAudit.test.ts` は、`unresolved` の結果に対してPID発行監査証明を作らないことを確認している。

```ts
await assert.rejects(
  createPidIssuanceAuditProof(...),
  /selected PID/i
);
```

`pidIssuanceAudit.ts` の `assertIssuablePid` は、PID、選択クラスタ、`verified` または `partial` の状態を要求する。

したがって、第10章の非発行安全性は、PID監査層にも接続されている。

## 7. `conditional` の扱い

第10章本文では、`conditional` が五つ目の基本状態として書かれている。しかし、現時点のLean型 `ResolutionOutcome` には `conditional` はない。

そのため、本文では次のように修正するのが望ましい。

| 状態 | 扱い |
| --- | --- |
| `ambiguous` | Leanで証明済みの基本停止状態。 |
| `unresolved` | Leanで証明済みの基本停止状態。 |
| `rejected` | Leanで証明済みの基本拒否状態。 |
| `conditional` | UI/API上の追加情報要求状態。基本停止状態へ写像して扱う。 |

たとえば `conditional` は、内部的には次のような構造として扱える。

```text
conditional(requiredEvidence, currentOutcome)
```

PID発行上は、`conditional` は `resolved + admissible` を満たすまで非発行である。

## 8. 反例と注意点

| 反例 | 危険 | 本文での対策 |
| --- | --- | --- |
| 候補が一つだけあるので解決済みとする | 弱証拠の誤発行 | 候補数ではなく証拠・品質・鮮度を見る。 |
| 二候補の差がわずかでも最上位を採用する | 同名地名や同名建物で誤発行 | マージン不足なら `ambiguous`。 |
| 古い公式データを常に信用する | 行政変更・建物廃止を見落とす | 鮮度ゲートを入れる。 |
| 自然地理を郵便住所と同じ粒度で扱う | 湖、山、川、島などで境界誤認 | `partial` または `unresolved` を許す。 |
| `unresolved` にPID監査証明を出す | 未解決の権威化 | 監査証明側で拒否する。 |
| `conditional` を証明済み基本型として扱う | Leanとの不一致 | 補助状態と明記する。 |

## 9. 第10章へ追加できる命題

### 命題10.1 非解決状態の非発行性

`ambiguous`、`unresolved`、`rejected` は、任意の実体を解決済みとして返さない。

根拠:

```text
ambiguous_resolves_no_entity
unresolved_resolves_no_entity
rejected_resolves_no_entity
```

### 命題10.2 偽実体非発行性

`ambiguous`、`unresolved`、`rejected` は、偽の実体を発行しない。

根拠:

```text
ambiguous_emits_no_false_entity
unresolved_emits_no_false_entity
rejected_emits_no_false_entity
```

### 命題10.3 許容条件不足による停止

候補包含、スコア分離、品質、鮮度、リスクのいずれかが不足する場合、PID発行は許容されない。

根拠:

```text
missing_candidate_prevents_issue
high_energy_prevents_issue
low_margin_prevents_issue
low_quality_prevents_issue
stale_freshness_prevents_issue
high_risk_prevents_issue
```

### 命題10.4 残差候補による曖昧停止

複数の候補が残り、追加ゲートで分離されていない場合、解決器は `ambiguous` として停止すべきである。

根拠:

```text
multiple_candidates_prevent_zero_residual
proxy_residual_forces_ambiguous_abstention
```

## 10. 総合評価

第10章は、AMTが「何でも解決する理論」ではなく、「解くべきでないときに安全に止まる理論」であることを示す中心章である。

採用判定:

| 項目 | 評価 |
| --- | --- |
| 数理的根拠 | 強い |
| Lean検証 | 強い |
| 実装対応 | 強い |
| PDF本文への採用 | 推奨 |
| 修正が必要な点 | `conditional` を補助状態として扱う |

最終評価:

> 第10章は大きく採用できる。ただし、`conditional` だけはLeanで証明済みの基本型ではないため、本文では追加情報要求状態またはAPI/UI状態として位置付けるべきである。
