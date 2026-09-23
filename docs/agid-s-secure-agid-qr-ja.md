# AGID-S: Secure AGID QR Envelope

## 1. 定義

AGID-S は、通常の公開 AGID を認証付き暗号で暗号化し、QR、NFC、リンク、紙媒体で安全に共有するための封筒形式である。

最小定義は次の通りである。

```text
AGID-S = AEAD_Encrypt(key, AGID + expiry + purpose)
```

AGID が公開位置コードであるのに対し、AGID-S は鍵を持つ相手だけが復号できる暗号化 AGID である。AGID-S は AOID ではない。住所所有、部屋番号、氏名、電話番号、配送指示を表すものではなく、AGID を安全に渡すための暗号化共有層である。

## 2. 三層分離

| Layer | Role | Visibility | Main use |
|---|---|---|---|
| AGID | 公開位置 ID | public | 地図表示、仮想郵便番号、公開住所参照 |
| AGID-S | 暗号化 AGID 封筒 | key-gated | 支援、避難、配送、監視リスク下の共有 |
| AOID | 住所所有・配送詳細 ID | private owner-controlled | 所有、権限、credential、redaction |

この分離により、AGID の公開性、AOID の私的所有性、AGID-S の安全共有性を混同しない。

## 3. Token Format

外部表現は次の形式を使う。

```text
AGIDS1-{BASE32_ENCODED_ENVELOPE}
```

内部 envelope は次のフィールドを持つ。

```json
{
  "v": 1,
  "alg": "A256GCM",
  "kid": "delivery-key-1",
  "n": "BASE32_NONCE",
  "c": "BASE32_CIPHERTEXT",
  "t": "BASE32_AUTH_TAG"
}
```

暗号化 payload は次の最小構造である。

```json
{
  "agid": "JP05AV8TJGHD",
  "exp": 1780830000,
  "purpose": "delivery",
  "precision": "coarse",
  "iat": 1780826400,
  "jti": "RANDOM_NONCE_ID"
}
```

## 4. Security Rules

AGID-S は次を必須条件とする。

- AES-GCM などの認証付き暗号を使う。
- nonce は毎回ランダムにする。
- `exp` を必須にする。
- 長期・永久の正確位置 QR を禁止する。
- 全員共通鍵を使わない。
- `recipient`、`phone`、`room`、`building`、`deliveryInstruction` などの個人・配送詳細を入れない。
- `key_id` は鍵そのものではなく、復号鍵選択のための短い識別子に限定する。
- QR コピーを前提にし、失効、使用済み管理、purpose scope を別レイヤで併用する。

## 5. Ethereum / L2 / Registry Boundary

AGID-S 本文をチェーンに載せるべきではない。チェーンに載せる場合は、次のような公開検証情報だけに限定する。

- issuer registry
- credential hash
- revocation status
- nullifier
- used status
- payment / donation / delivery support metadata

推奨分離は次の通りである。

```text
AGID-S QR body: off-chain
AGID plaintext: visible only after decryption
Chain / registry: revocation, freshness, issuer trust, used status only
```

## 6. Current Implementation

現在の実装は [src/lib/agidSecureShare.ts](../src/lib/agidSecureShare.ts) にある。

実装済みの不変条件:

- AGID-S token は `AGIDS1-` prefix を持つ。
- payload は有効な公開 AGID のみを含む。
- payload は `exp`、`iat`、`jti` を持つ。
- 同じ AGID でも nonce と jti により毎回異なる token になる。
- 期限切れ、鍵違い、key id 違い、purpose 違い、改ざんを拒否する。
- POS/NFC 受付は AGID-S を認識するが、復号鍵なしでは AGID を取り出さない。

テストは [src/lib/agidSecureShare.test.ts](../src/lib/agidSecureShare.test.ts) と [src/lib/posAcceptance.test.ts](../src/lib/posAcceptance.test.ts) にある。

## 7. Open Issues

次は今後の実装対象である。

- POS 端末側の鍵管理 UI。
- 復号後 AGID を通常 AGID record として受け付ける async POS flow。
- issuer trust、revocation、freshness、used status registry との統合。
- mobile / browser QR scan と Web NFC 実測。
- 鍵ローテーションと複数受信者向け envelope。
