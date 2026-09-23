# Operations

`src/lib/operations.ts` adds an integrated WMS/TMS layer for warehouses and distribution centers.
It is designed to connect AGID/AOID address validation, POS handoff, shipping-label QR, and carrier
execution without putting raw addresses or private recipient material into operational dashboards.

## Scope

Operations covers:

- warehouse inventory;
- receiving and putaway;
- automatic allocation;
- picking instructions;
- replenishment alerts;
- shipment and route manifests;
- transportation KPIs;
- warehouse KPIs;
- integrated WMS/TMS dashboard state.

It complements `deliveryOperationsIntelligence.ts`. That module focuses on workforce, driver skills,
route execution, and delivery performance. Operations focuses on the warehouse-to-transportation
execution flow.

## WMS Model

### Inventory

Inventory is represented by SKU, lot, location, quantity, handling class, received time, optional
expiry, and reorder point.

Public output stores:

- SKU and lot aliases;
- location identifiers;
- quantities;
- expiry dates when operationally required;
- serial commitments, not raw serial values.

### Allocation

`planWarehouseExecution` allocates orders with an explainable baseline:

1. Sort orders by due time and priority.
2. For each line, select candidate lots by SKU and handling class.
3. Prefer FEFO when expiry is present.
4. Fall back to FIFO by received time.
5. Emit shortages and replenishment alerts.
6. Generate picking tasks sorted by zone, aisle, and bay.

The first implementation is deterministic and auditable. It is not a black-box AI optimizer.

### Picking

Supported picking strategies:

- `piece`
- `batch`
- `zone`
- `wave`

The task output contains the minimal operational instruction: order, line, SKU, lot, location, zone,
aisle, bay, quantity, and sequence.

### Putaway

Receiving lines are assigned to locations when capacity, temperature class, and handling class match.
If no compatible location exists, the task is marked `needs-review`.

## TMS Model

### Shipment Planning

`planTransportationExecution` assigns shipments to vehicles by:

- vehicle availability;
- capacity weight;
- capacity volume;
- handling compatibility;
- coordinates;
- time window risk;
- distance from current route cursor.

Unassigned shipments carry reasons such as missing coordinates, no vehicle, capacity mismatch, or
private material rejection.

### Route Manifest

Route manifests include:

- vehicle;
- driver alias if supplied;
- stop list;
- ETA;
- distance;
- status;
- route efficiency;
- estimated cost.

They do not include raw address, raw AGID, raw AOID, raw recipient, or raw phone values.

## KPIs

Warehouse metrics:

- inventory turnover rate;
- storage utilization;
- order fulfillment accuracy;
- picking productivity in lines per hour.

Transportation metrics:

- on-time delivery rate;
- first-attempt success rate;
- route efficiency;
- delivery cost per order.

## Integrated Dashboard

`buildOperationsDashboard` combines WMS and TMS:

- build warehouse execution plan;
- derive shipments from fully allocated orders when explicit shipments are not provided;
- plan transportation;
- merge KPIs;
- return `ready`, `attention`, or `blocked`.

## Privacy Boundary

The public Operations surface is:

```text
operational status + commitments + allocations + pick tasks + route manifests + KPIs
```

The public surface is not:

```text
raw address + raw AGID + raw AOID + recipient name + phone + private inventory serial
```

Private shipment or order material is rejected from the plan and converted into a blocked state.

## Future Adapters

The current implementation is intentionally local and dependency-light. Production adapters can replace
or extend the deterministic baseline with:

- PostgreSQL/PostGIS warehouse and route storage;
- Redis allocation locks and hot route caches;
- barcode/QR scanner event streams;
- OSRM, Valhalla, GraphHopper, or carrier routing engines;
- carrier label APIs;
- mobile driver apps;
- robot or drone dispatch adapters;
- advanced simulation and KPI forecasting.
