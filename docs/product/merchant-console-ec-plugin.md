# Merchant Console / EC Plugin

Merchant Console / EC Plugin は、Hexaship をEC事業者が導入・運用するための管理画面とSDK/プラグイン群です。

目標は Shopify風の分かりやすい管理画面で、配送会社選択、発送履歴、Webhook履歴を扱えるようにしつつ、住所を直接見せないことです。

## 対象

- Shopify風 Admin App
- WooCommerce Plugin
- EC-CUBE Plugin
- 自社EC向け TypeScript SDK

## EC事業者の導入先選択

Merchant Console では、配送API導入とは別に、EC事業者が次の3つから選べるようにします。

| 選択肢 | 導入先 | 開始地点 | 目的 | ログイン境界 | 必須参照 |
|---|---|---|---|---|---|
| Playlist Commerce | Veygrit app | Veygrit | ECを探す・保存する・選ぶ | ログインボタンなしで買い物開始可能 | `playlistParticipationRef`, `storePreferenceAlias` |
| EC Social Login | merchant EC plugin or SDK | merchant EC site | Continue with Veygrit で住所入力をなくす | EC側では Continue with Veygrit が必要 | `addressLoginClientRef`, `recipientId` |
| Playlist Commerce + EC Social Login | Veygrit app と merchant EC | 両方 | 探す入口と購入入口を同時に有効化 | mixed。発見はログイン不要、EC購入はVey ID確認 | `playlistParticipationRef`, `addressLoginClientRef` |

Playlist Commerce は「どのECを利用するか」を決める入口です。EC Social Login は「そのECでどう購入するか」を担当します。どちらも Address Wallet を使い回せますが、merchant-visible な出力は `merchantRef`、`storeRef`、`recipientId`、`walletConsentRef` などの参照に限定し、`rawAddress`、受取人電話番号、private key、proof secret は扱いません。

## Vey ID Core adoption check

Merchant Console には、ECが `Continue with Veygrit` を導入するための Vey ID Core チェックを置きます。

- アカウント作成は Google / Apple のみに限定します。
- 登録ウィザードの Store / EC Platform で `addressLoginClientRef` と `addressLoginCallbackUrl` を必須にします。
- `addressLoginCallbackUrl` は Address Login callback preflight で HTTPS と forbidden callback params を確認し、成功時だけ `addressLoginCallbackPreflightRef` を発行します。
- preflightが失敗した場合は `replace_with_https_callback_url` と `remove_forbidden_callback_params` のような修復アクションをMerchant Consoleに表示します。
- negative fixture export は `merchant-console-callback-preflight-negative-v0.1` としてコピーでき、`missing_address_login_boundary` を安全に再現します。
- EC側は `GET /veygrit/oauth/authorize`、`POST /veygrit/oauth/token`、`POST /veygrit/connections/revoke` を使います。
- ブラウザ側に出してよいものは `authorizationCodeRef`、`pairwiseSubjectAlias`、`walletSessionRef` などの参照だけです。
- サーバー側は PKCE と token exchange を扱いますが、Merchant Console では `pkceVerifierRef`、`accessTokenRef`、`idTokenRef` の参照として確認します。
- ウォレット側では `connectionRef` と `revocationRef` により、ユーザーがEC連携を解除できます。
- `providerIdToken`、`providerAccessToken`、`providerRefreshToken`、`rawProviderProfile`、`rawAddress`、`rawVeyIdToken` は Merchant Console の表示・保存対象外です。

ローカル検証は次の3つを必須にします。

```text
npm run verify:veygrit-id-core-openapi
npm run verify:veygrit-address-login-react
npm run verify:veygrit-address-login-nextjs
```

## 管理画面

### 1. 配送会社選択

表示:

- `orderRef`
- `recipientDisplayRef`
- `carrierAlias`
- `servicePreference`
- `carrierCapabilityRef`
- `status`

操作:

- Auto allocation
- DHL選択
- UPS選択
- 最速
- 最安
- Balanced
- shipment作成

住所本文は表示しません。

発送作成ボタンは、次の順序が完了するまで無効です。

```text
run_address_wallet_preflight
  -> run_carrier_capability_preflight
  -> ready_for_hexaship_createShipment
```

`carrierCapabilityRef` がない注文は `blocked_missing_carrier_capability` として扱い、`create-shipment`、`create-label`、`buy-label` を無効化します。
Address Wallet 側の `recipientId`、`parcelProfileRef`、`walletConsentRef` が不足している場合は `blocked_missing_address_wallet_preflight` として扱います。
`addressFormVersion` はユーザーが慣れている国別住所フォームの安全な参照として保持し、DHL/UPS の送り状形式への変換は Hexaship Gateway 側で行います。
`rawAddress` や `carrierApiKey` などの private material が混入した場合は `blocked_private_material` として先に止めます。

登録画面の Address Wallet Settings では、`addressFormVersionRef` と `carrierSpecificAddressShapeBlocked` を必須項目にします。EC は国別フォーム版の参照だけを保存し、carrier-specific address forms、DHL/UPS label payload、P.O. Box の carrier eligibility 判定は Gateway と Carrier Connector Layer に任せます。
安全な登録リクエスト例は `docs/specs/fixtures/merchant-console-onboarding-v0.1.json` に置きます。この fixture は `wallet_country_form_ref_...` 形式の `addressFormVersionRef` と `carrierSpecificAddressShapeBlocked: true` だけを含み、生住所、受取人電話番号、carrier credential、raw carrier payload は含めません。
ローカルでは `createMerchantConsoleOnboardingMock()` が同じ fixture を受け取り、private material または Wallet form boundary 不足を `400` 相当で拒否し、成功時は `merchant_onboarding_ref_...` と `merchant_...` の安全な参照だけを返します。

Merchant Console は UI 側の readiness だけでなく、Hexaship Gateway の `preflightHexashipMvpV01Shipment()` も発送作成ボタン前に確認します。

Gateway preflight は次のいずれかを返します。

- `remove_private_material`
- `run_address_wallet_preflight`
- `run_carrier_capability_preflight`
- `call_hexaship_createShipment`

これにより、ECプラグインは Address Wallet の不足、DHL/UPS capability check の不足、private material 混入を同じ順序で修復できます。

`run_carrier_capability_preflight` で止まった注文は、Merchant Console の Capability preflight 操作で Carrier Connector Layer のローカル preflight を実行し、成功した場合だけ synthetic `carrierCapabilityRef` を注文の readiness に反映します。
Capability preflight は Address Wallet carrier country-form selector の `carrier` と `countryCode` を入力として使うため、`JP / DHL` と `US / UPS` のような組み合わせを発送作成前に切り替えられます。
成功後は guided two-step 表示が `Capability preflight` から `Create shipment` に進み、EC担当者は次に押すべき操作を確認できます。
この操作も local-only であり、DHL/UPS の本番API、carrier credential、生住所、受取人連絡先は扱いません。

### 2. 発送履歴

表示:

- `shipmentRef`
- `orderRef`
- `recipientDisplayRef`
- `carrierAlias`
- `status`
- `labelRef`
- `trackingAlias`
- `createdAt`

非表示:

- `rawAddress`
- `rawLabelPayload`
- `recipientPhone`
- `proofWitness`
- `privateDeliveryNotes`

### 3. Webhook履歴

表示:

- `eventRef`
- `eventType`
- `status`
- `attemptCount`
- `lastAttemptAt`
- `nextRetryAt`

非表示:

- `rawWebhookPayload`
- `webhookSecret`
- `rawAddress`
- `recipientPhone`

## EC Plugin / SDK

### Shopify風

Package: `@hexaship/shopify-like`

形:

- embedded admin app
- checkout extension
- carrier selection block

### WooCommerce

Package: `@hexaship/woocommerce`

形:

- WordPress plugin settings
- WooCommerce shipping method
- webhook verifier

### EC-CUBE

Package: `@hexaship/ec-cube`

形:

- EC-CUBE admin plugin
- checkout delivery extension
- carrier allocation setup

### 自社EC

Package: `@hexaship/js`

形:

- server SDK
- optional admin widgets
- webhook verifier
- idempotency support

## 住所を直接見せない設計

Merchant Consoleが保存・表示してよいもの:

- `recipient_id`
- `recipientDisplayRef`
- `shipmentRef`
- `labelRef`
- `trackingAlias`
- `walletConsentRef`
- `carrierCapabilityRef`

保存・表示しないもの:

- `rawAddress`
- `addressLine1`
- `addressLine2`
- `recipientName`
- `recipientPhone`
- `privateDeliveryNotes`
- `proofWitness`
- `proofSecret`
- `privateKey`
- `carrierApiKey`
- `carrierCredential`
- `webhookSecret`
- `rawWebhookPayload`
- `rawLabelPayload`

## Non-Claims

- Merchant Console は標準では raw address export tool ではありません。
- Plugin profile は Shopify, WooCommerce, EC-CUBE などの公式審査通過を意味しません。
- 配送会社選択は DHL/UPS の配送保証ではありません。
- 管理者権限はユーザー同意をバイパスしません。

## Next Build Step

次は callback negative fixture export を OpenAPI evidence fixture として保存し、検証スクリプトから直接読めるようにします。
