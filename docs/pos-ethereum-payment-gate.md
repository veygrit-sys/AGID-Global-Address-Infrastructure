# AGID POS Ethereum Payment Gate

This note defines the optional Ethereum payment gate for AGID/AOID delivery POS acceptance. The feature supports prepaid and collect-on-delivery flows without turning normal POS scans into mandatory blockchain operations.

## 日本語要約

配送POS受付で、Ethereum支払いを任意で有効化できる。

- 先払い: 支払いまたはエスクローを確認できた場合だけ、荷物の引き渡しを許可できる。
- 着払い: 配送業者スキャンは進められるが、受取人への引き渡し前に支払い確認を要求する。
- 通常受付: 設定でEthereum支払いゲートを有効化しない限り、従来どおりQR/NFC/AGID-S/AOID確認だけで動く。

## Operating Modes

The payment gate is deliberately separate from the POS runtime modes.

| Settlement mode | Purpose | POS behavior |
| --- | --- | --- |
| `offchain-observed` | Operator records an already observed payment reference. | No Ethereum write plan is generated. |
| `ethereum-registry` | Record public payment status and references in the AGID Ethereum registry layer. | The POS receipt can include a registry `txPlan`. |
| `ethereum-escrow` | Use an escrow-style payment status before delivery release. | Release is allowed only after escrow/payment evidence is settled. |

## Payment Kinds

| Kind | Use case | Handoff gate |
| --- | --- | --- |
| `prepaid` | EC checkout, paid pickup, support delivery where payment is settled before release. | Blocks carrier/release if payment is missing or rejected. |
| `collect-on-delivery` | Recipient pays at pickup or doorstep. | Allows carrier scan, but blocks package release until payment is observed. |

## Privacy Boundary

The Ethereum payment gate must not store or submit:

- raw address
- raw AGID
- raw AOID
- private keys, seed phrases, passkeys, proof codes
- phone numbers, full names, card numbers

The POS stores only payment commitments, public payment references, optional transaction hashes, public network identifiers, and receipt-level handoff decisions.

## API Fields

`POST /api/pos/acceptance` may include these optional fields:

```json
{
  "paymentKind": "prepaid",
  "settlementMode": "ethereum-registry",
  "paymentStatus": "escrowed",
  "amount": 12.5,
  "currency": "USD",
  "tokenSymbol": "USDC",
  "paymentNetworkId": "base-sepolia",
  "observedPaymentTxHash": "0x...",
  "releaseAfterHandoff": true,
  "highRiskPaymentMode": false
}
```

If the POS settings screen does not enable Ethereum payment, the frontend omits these payment fields and the existing local/server registry scan flow is unchanged.

## Registry Submission Flow

When `settlementMode` is `ethereum-registry` or `ethereum-escrow`, the POS receipt may include a `txPlan` compatible with the existing Mode 3 Ethereum registry client.

1. POS accepts or reviews the scan and produces a redacted receipt.
2. The receipt contains only public payment commitments and a `recordPayment` tx plan.
3. An authorized backend operator submits the plan to `POST /api/ethereum/mode3/tx/submit`.
4. The backend uses the configured server-side `AGID_ETHEREUM_PRIVATE_KEY`, never a private key from the POS payload.
5. The receipt can later be checked with `GET /api/ethereum/mode3/tx/receipt/:txHash`.

For local-only or server-registry operations, skip the submission step and keep `settlementMode` as `offchain-observed`.

## Receipt Semantics

Receipts may include `ethereumPayment` when the gate is enabled.

- `handoffGate.canAcceptCarrierScan`: whether the carrier-side scan can proceed.
- `handoffGate.canReleasePackage`: whether a recipient/package release can proceed.
- `handoffGate.canCompleteHandoff`: whether payment, carrier, and recipient gates are all clear.
- `requiredAction`: operator-facing action such as `collect-payment-from-recipient-before-release`.

For collect-on-delivery with no settled payment, the receipt remains `review`, not `accepted`, so the operator sees the hold state before release.
