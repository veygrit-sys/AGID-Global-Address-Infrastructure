# Veygrit Ship — South Asia strengthening

This wave extends the existing Delhivery, Blue Dart and DTDC direct-carrier
coverage without introducing a third-party shipping aggregator.

## Added carrier boundaries

| Carrier | Initial market | Adapter | Route source | Current boundary |
|---|---|---|---|---|
| Pathao Courier | Bangladesh | `pathao-courier-v1` | Merchant developer access | Contract routes only |
| eCourier | Bangladesh | `ecourier-merchant-v5.4` | Published Merchant API v5.4 | Shipment, status, label reference and cancel |
| Leopards Courier | Pakistan | `leopards-merchant-contract-v1` | Merchant API account | Booking, tracking and load sheet contract routes |
| Domex | Sri Lanka | `domex-client-contract-v1` | Registered client API access | Contract routes only |
| Nepal Can Move | Nepal | `nepal-can-move-contract-v1` | Environment token issued to merchants | Contract routes only |

Public merchant API evidence was not sufficient to define fixed direct routes
for Bhutan or Maldives. They remain unsupported rather than being routed
through an aggregator or an undocumented endpoint.

## Security and execution rules

- The browser never receives carrier API keys, passwords, tokens or account IDs.
- PostgreSQL stores only `credential_secret_ref`.
- Carrier-issued routes must use HTTPS.
- Shipment and cancel operations are not automatically replayed after an
  unknown network outcome.
- Safe tracking reads may retry `429`, timeouts and `5xx`.
- Label URLs and documents are private artifacts. They must be downloaded by
  the backend into protected object storage and must not enter logs or analytics.
- Adding an adapter does not enable production traffic. A merchant account,
  active Carrier Connection, secret lookup and explicit live authorization
  remain mandatory.

## eCourier fixed implementation

The published v5.4 specification defines:

- Sandbox: `https://staging.ecourier.com.bd/api`
- Production: `https://backoffice.ecourier.com.bd/api`
- Authentication headers: `API-KEY`, `API-SECRET`, `USER-ID`
- Shipment: `POST /order-place`
- Tracking: `POST /track`
- Label reference: `POST /label-print`
- Cancel: `POST /cancel-order`

The three authentication values are resolved server-side. They are never
accepted in an API request payload or persisted in PostgreSQL.

## Contract-routed implementation

Pathao, Leopards, Domex and Nepal Can Move use only environment URLs,
authentication and operation routes issued during carrier onboarding. Veygrit
does not infer undocumented production paths. This lets the common adapter,
retry policy, Request ID, idempotency and audit boundary be completed before
carrier approval without fabricating a successful connection.

## Official references

- [Pathao merchant developer API](https://merchant.pathao.com/courier/developer-api)
- [Pathao Courier](https://pathao.com/courier/?lang=en)
- [eCourier API resources](https://wp-stage.ecourier.com.bd/resources/)
- [eCourier Merchant API v5.4 PDF](https://ecourier.com.bd/wp-content/uploads/eCourier_Merchant_API_Document_General_v5.4.pdf)
- [Leopards merchant API](https://merchantapi.leopardscourier.com/)
- [Leopards integration FAQ](https://www.leopardscourier.com/faqs)
- [Domex](https://domexmail.lk/)
- [Nepal Can Move merchant portal](https://portal.nepalcanmove.com/)
- [Nepal Can Move WooCommerce integration](https://wordpress.org/plugins/ncm-api/)
