# Vey ID / Address Wallet Foundation

Vey ID / Address Wallet は、配送・住所・友達配送・ウォレット連携をまとめるユーザー側の中核です。

役割を分けると、Vey ID は Google / Apple のみで作成するユーザー認証、Address Wallet は住所ID・友達・承認・QR/passを管理し、Hexaship は配送実行へつなぎます。

## 0. Address Wallet OS navigation

Address Wallet = Veygrit は住所ウォレットです。サイドメニューは SNS や汎用ECアプリではなく、住所を中心に生活サービスへつながるOSとして固定します。

```text
Home / Friends / Store / My Page
```

Home:

- My Address
- Spare Address
- QR
- Recent Deliveries
- Recent Stores

Store:

`Topics / Discover / My Stores`

- Topics
- Discover
- My Stores

My Page:

- Profile
- Payment Methods
- Notifications
- Help
- Settings

## 1. ユーザー認証

Vey ID は通常のソーシャルログインに近い導入感で、ECやアプリにログインセッションを返します。ただしアカウント作成は Google / Apple のみに限定します。メール/パスワード、電話番号のみ、passkeyのみの新規登録はMVPでは提供しません。passkey は高リスク操作の step-up です。

安全な入力:

- `clientId`
- `redirectUri`
- `state`
- `nonce`
- `pkceChallenge`
- `scope`
- `accountProvider` (`google` or `apple`)

安全な出力:

- `pairwiseSubjectAlias`
- `walletSessionRef`
- `sessionFreshUntil`
- `authorizationCodeRef`
- `accessTokenRef`
- `idTokenRef`
- `addressCredentialRef`

チェックアウト時に Address Wallet セッションが新しければ、再ログインは不要です。高リスク操作だけ passkey や端末承認でステップアップします。

Vey ID は ECごとに `pairwiseSubjectAlias` を発行します。Google/Apple の provider subject は hash として保持し、Google/Apple の provider token、access token、refresh token、raw provider profile は Vey ID session に保存しません。

Authorization Code flow は PKCE 必須です。Merchant callback には短期 `authorizationCodeRef` だけを返し、token exchange 後も ECが扱うのは `accessTokenRef`、`idTokenRef`、`addressCredentialRef` などの参照です。住所本文、受取人電話番号、provider token は merchant-visible surface に出しません。

ウォレット側で連携解除すると、`pairwiseSubjectAlias`、`walletConsentRef`、`addressCredentialRef`、`carrierHandoffRef` を失効させ、ECへ削除対象の参照を通知します。

## 2. 住所ID管理

Address Wallet は住所そのものではなく、配送先を `recipient_id` として管理します。

例:

- `aw_rec_self_...`
- `aw_rec_friend_...`
- `aw_rec_org_...`
- `aw_rec_locker_...`

ECやCMS、自社開発ECが保存してよいもの:

- `recipient_id`
- `addressFormVersion`
- `walletConsentRef`
- `carrierCapabilityRef`

保存・公開してはいけないもの:

- `rawAddress`
- `recipientName`
- `recipientPhone`
- `privateDeliveryNotes`
- `proofWitness`
- `proofSecret`
- `privateKey`
- `carrierApiKey`

## 3. 友達配送

友達配送では、購入者は住所を入力せず Address Wallet の友達を選びます。

流れ:

1. 購入者が Vey ID / Address Wallet でECへログインする。
2. Checkoutで Address Wallet friend を選ぶ。
3. ECは `friendDeliveryRequestRef` を作る。
4. 受取人の Address Wallet に通知する。
5. 受取人が商品・送信者・提供範囲を確認する。
6. 受取人が住所提供を承認または拒否する。
7. 承認された場合だけ `walletConsentRef` と `carrierHandoffRef` が発行される。

購入者には受取人の住所を表示しません。

## 4. 住所提供承認

住所提供承認は、Address Wallet の最重要画面です。

承認画面で見せるべきもの:

- 誰が要求しているか
- 何の注文か
- 何の目的か
- どの提供モードか
- いつ失効するか
- どこまで共有されるか

承認の出力:

- `walletConsentRef`
- `consentEnvelopeRef`
- `selectedAddressRef`
- `auditReceiptRef`

住所提供承認は、DHL/UPSの配送可否、通関、最終配達成功を保証しません。

## 4.5 DHL/UPS carrier-form preflight

Address Wallet は、Hexaship が DHL/UPS へ進む前に、国別フォームと carrier capability の next action を表示できます。

最初の preview:

- `JP / DHL`: `ready_for_hexaship_createShipment`
- `US / UPS`: `run_carrier_capability_check`

表示してよいもの:

- `countryCode`
- `carrier`
- `activeNextAction`
- `activeSelectionAction`
- `activeMissingRefs`
- `capabilityMode`
- `productionTraffic: false`

表示してはいけないもの:

- `rawAddress`
- `recipientPhone`
- `carrierApiKey`
- `proofWitness`
- `privateKey`

## 4.6 Privacy / Threat Boundary Gates

Address Wallet の最初の公開境界は、実装上も文書上も次の4つに固定します。

| Gate | Owner | Safe evidence refs | Required blocked material | Non-claim |
| --- | --- | --- | --- | --- |
| `merchant-visible-redaction` | `merchant-app` | `pairwiseSubjectAlias`, `recipient_id`, `walletConsentRef`, `addressCredentialRef`, `auditReceiptRef` | `rawAddress`, `recipientName`, `recipientPhone`, `privateDeliveryNotes`, `proofWitness`, `proofSecret`, `privateKey` | Merchant-visible refs are not raw address disclosure, residence proof, or reusable marketing consent. |
| `consent-bound-carrier-handoff` | `hexaship` | `walletConsentRef`, `consentEnvelopeRef`, `carrierHandoffRef`, `ShipmentIntent` | `rawAddress`, `recipientPhone`, `carrierApiKey`, `carrierCredential`, `proofWitness` | A consent-bound carrier handoff is not a delivery guarantee, customs clearance, or production carrier credential exchange. |
| `wallet-pass-short-lived-ref` | `wallet-pass` | `applePassRef`, `googlePassRef`, `qrTokenRef`, `walletOpenRef`, `expiry`, `rotationCounter` | `rawQrPayload`, `unscopedPassPayload`, `rawAddress`, `proofWitness`, `privateKey` | Wallet pass and QR artifacts are short-lived refs, not raw address containers or long-lived bearer address tokens. |
| `carrier-preflight-sandbox-only` | `address-wallet` | `countryCode`, `carrier`, `activeNextAction`, `carrierCapabilityRef`, `productionTraffic:false` | `rawAddress`, `recipientPhone`, `carrierApiKey`, `carrierCredential`, `proofWitness`, `privateKey` | Carrier preflight previews are fixture-safe readiness refs, not production traffic, rate purchases, labels, or carrier acceptance. |

## 5. Apple Wallet / Google Wallet / QR連携の土台

Apple Wallet、Google Wallet、QR は住所を入れる場所ではありません。

短命の handoff artifact として扱います。

安全なpayload ref:

- `applePassRef`
- `googlePassRef`
- `qrTokenRef`
- `walletOpenRef`
- `approvalRequestRef`
- `recipient_id`
- `expiry`

Local pass export audit:

- `buildVeyIdAddressWalletPassExportAudit`
- `npm run verify:vey-id-address-wallet-pass-export-fixture-schema`
- `localOnly: true`
- `productionTraffic: false`
- exports only safe payload refs, blocked payload class names, expiry policy, rotation policy, and non-claims
- blocks value-shaped private material markers before a pass/QR export is treated as release-ready

禁止:

- raw address text
- raw QR payload
- proof witness
- private key
- long-lived bearer address token

使い道:

- Address Walletを開く
- 受取人承認画面を開く
- 店頭・配送員・ロッカーで短命QRを提示する
- 承認済み配送ハンドオフを識別する

## 6. 最初の開発順序

1. Vey ID login session contract
2. Address Wallet `recipient_id`
3. DHL/UPS対象国の住所フォーム
4. 友達配送 request / approval
5. `walletConsentRef` と `carrierHandoffRef`
6. Apple Wallet / Google Wallet / QR token refs
7. Hexaship `ShipmentIntent`
8. DHL/UPS sandbox connector

## Non-Claims

- Vey ID / Address Wallet は標準では一般KYCではありません。
- Wallet pass と QR は住所コンテナではなく handoff refs です。
- Address Wallet の承認は DHL/UPS の配送保証ではありません。
- `recipient_id` は住所証明でもマーケティング同意でもありません。

## Next Build Step

次はこの foundation を UI/SDK に接続します。最小実装は、ログイン済みユーザーが Address Wallet で `recipient_id` を選び、Apple Wallet / Google Wallet / QR 用の短命 `qrTokenRef` を生成できる sandbox flow です。
