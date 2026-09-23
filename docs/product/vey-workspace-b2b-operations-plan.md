# Vey Workspace / B2B Operations Plan

Status: executable planning surface backed by `src/lib/veyWorkspace.ts`

Vey Workspace is the B2B operations layer for merchants and enterprise teams. It should not become a raw-address CRM. Its job is to coordinate order, inventory, shipment, invoice, task, and partner work while surfacing operational quality from redacted references.

## MVP Scope

The first useful operations plan tracks:

- shipping cost;
- delivery delay;
- returns;
- regional delivery quality;
- redacted shipment exceptions;
- references into Delivery Gateway, Trade Gateway, and Playlist Commerce.

The model intentionally uses references such as `shipmentId`, `regionId`, `deliveryGatewayShipmentRef`, `tradeGatewayIntentRef`, and `playlistCommerceIntentRef`. It does not require raw address text, recipient name, phone, email, carrier credentials, or webhook secrets.

## Operations Plan Fields

`buildVeyWorkspace()` now returns `operationsPlan`:

- `cost.totalShippingCost`
- `cost.averageShippingCost`
- `cost.highestCostShipmentRef`
- `delay.delayedShipments`
- `delay.delayedShipmentRefs`
- `returns.returnShipments`
- `returns.returnShipmentRefs`
- `regionalQuality[]`
- `ecosystemConnections.deliveryGatewayShipmentRefs`
- `ecosystemConnections.tradeGatewayIntentRefs`
- `ecosystemConnections.playlistCommerceIntentRefs`

Regional quality uses a conservative baseline score from exception, delay, and return counts. It is an operations triage signal, not a carrier guarantee or a public reputation score.

## B2B Dashboard Views

1. Cost

Show total shipping cost, average cost per shipment, highest-cost shipment reference, and cost by region.

2. Delay

Show delayed shipment references and regions where delivery promises need recalibration.

3. Returns

Show return shipment references and return reason aliases. Do not show raw customer notes.

4. Regional Quality

Show `healthy`, `watch`, or `attention` status by `regionId`, with exception, delay, return, on-time, and cost metrics.

5. Ecosystem Connections

Show references to:

- Hexaship / Delivery Gateway for shipment execution;
- Trade Gateway for B2B trade intent and settlement context;
- Playlist Commerce for demand and campaign context.

## Privacy Boundary

Allowed:

- aliases;
- commitments;
- refs;
- statuses;
- timestamps;
- carrier aliases;
- cost/currency;
- regional aggregate metrics.

Blocked:

- raw address;
- recipient name;
- phone;
- email;
- raw invoice body;
- raw webhook URL or secret;
- carrier credentials;
- private keys;
- proof witnesses.

## Non-Claims

- Vey Workspace regional quality is not a public carrier ranking.
- It does not guarantee DHL, UPS, or any future carrier performance.
- It does not grant Trade Gateway or Playlist Commerce access to raw recipient data.
- It is an internal B2B operations planning view, not a legal customs or tax engine.

## Verification

```bash
npm run verify:vey-workspace
npm run verify:merchant-console-ec-plugin
npm run verify:hexaship-delivery-gateway
```

