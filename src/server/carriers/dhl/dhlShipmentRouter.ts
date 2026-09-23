import { DhlConfigurationError, type DhlSuccess } from './dhlHttp';
import { DhlEcommerceAmericasV4Adapter, MyDhlExpressAdapter, type DhlLabelFormat, type DhlReturnLabelFormat } from './dhlAdapters';

export type DhlRoutingMode = 'auto' | 'mydhl-express' | 'ecommerce-americas-v4';
export type DhlProductSelection = {
  merchantRef: string;
  shipmentRef: string;
  adapter: Exclude<DhlRoutingMode, 'auto'>;
  productIdCode: string;
  originCountryCode: string;
  destinationCountryCode: string;
  status: 'selected' | 'created';
  savedAt: string;
};

export interface DhlProductCodeStore {
  save(selection: DhlProductSelection): Promise<void>;
  get(shipmentRef: string): Promise<DhlProductSelection | undefined>;
}

export function createInMemoryDhlProductCodeStore(): DhlProductCodeStore {
  const selections = new Map<string, DhlProductSelection>();
  return {
    async save(selection) { selections.set(selection.shipmentRef, { ...selection }); },
    async get(shipmentRef) {
      const value = selections.get(shipmentRef);
      return value ? { ...value } : undefined;
    },
  };
}

const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
const DHL_PRODUCT_SCHEMA = `
CREATE TABLE IF NOT EXISTS veygrit_ship_dhl_product_selection (
  shipment_ref text PRIMARY KEY,
  merchant_ref text NOT NULL,
  adapter text NOT NULL CHECK (adapter IN ('mydhl-express', 'ecommerce-americas-v4')),
  product_id_code varchar(10) NOT NULL CHECK (product_id_code ~ '^[A-Z0-9]{1,10}$'),
  origin_country_code char(2) NOT NULL CHECK (origin_country_code ~ '^[A-Z]{2}$'),
  destination_country_code char(2) NOT NULL CHECK (destination_country_code ~ '^[A-Z]{2}$'),
  status text NOT NULL CHECK (status IN ('selected', 'created')),
  saved_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
)`;

export class PostgresDhlProductCodeStore implements DhlProductCodeStore {
  private poolPromise?: Promise<any>;
  constructor(private readonly connectionString: string) {}

  async save(selection: DhlProductSelection): Promise<void> {
    const pool = await this.pool();
    await pool.query(
      `INSERT INTO veygrit_ship_dhl_product_selection
        (shipment_ref, merchant_ref, adapter, product_id_code, origin_country_code, destination_country_code, status, saved_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())
       ON CONFLICT (shipment_ref) DO UPDATE SET
         merchant_ref=EXCLUDED.merchant_ref, adapter=EXCLUDED.adapter, product_id_code=EXCLUDED.product_id_code,
         origin_country_code=EXCLUDED.origin_country_code, destination_country_code=EXCLUDED.destination_country_code,
         status=EXCLUDED.status, updated_at=now()`,
      [selection.shipmentRef, selection.merchantRef, selection.adapter, selection.productIdCode, selection.originCountryCode, selection.destinationCountryCode, selection.status, selection.savedAt],
    );
  }

  async get(shipmentRef: string): Promise<DhlProductSelection | undefined> {
    const pool = await this.pool();
    const result = await pool.query(
      `SELECT shipment_ref, merchant_ref, adapter, product_id_code, origin_country_code, destination_country_code, status, saved_at
       FROM veygrit_ship_dhl_product_selection WHERE shipment_ref=$1`,
      [shipmentRef],
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return {
      shipmentRef: row.shipment_ref,
      merchantRef: row.merchant_ref,
      adapter: row.adapter,
      productIdCode: row.product_id_code,
      originCountryCode: row.origin_country_code,
      destinationCountryCode: row.destination_country_code,
      status: row.status,
      savedAt: new Date(row.saved_at).toISOString(),
    };
  }

  private async pool(): Promise<any> {
    this.poolPromise ??= this.open();
    return this.poolPromise;
  }

  private async open(): Promise<any> {
    const { Pool } = await dynamicImport('pg');
    const pool = new Pool({ connectionString: this.connectionString });
    await pool.query(DHL_PRODUCT_SCHEMA);
    return pool;
  }
}

export function createDhlProductCodeStoreFromEnv(env: NodeJS.ProcessEnv = process.env): DhlProductCodeStore {
  const connectionString = env.VEYGRIT_SHIP_POSTGRES_URL?.trim() || env.DATABASE_URL?.trim();
  if (!connectionString && env.NODE_ENV === 'production') {
    throw new DhlConfigurationError('VEYGRIT_SHIP_POSTGRES_URL is required for production DHL routing.', ['VEYGRIT_SHIP_POSTGRES_URL']);
  }
  return connectionString ? new PostgresDhlProductCodeStore(connectionString) : createInMemoryDhlProductCodeStore();
}

export type UnifiedDhlShipmentInput = {
  merchantRef: string;
  shipmentRef: string;
  originCountryCode: string;
  destinationCountryCode: string;
  routingMode?: DhlRoutingMode;
  productIdCode: string;
  labelFormat?: DhlLabelFormat;
  payload: Record<string, unknown>;
};

export type UnifiedDhlShipmentResult = {
  ok: true;
  carrier: 'dhl';
  shipmentRef: string;
  selectedAdapter: Exclude<DhlRoutingMode, 'auto'>;
  routingReason: 'explicit' | 'us_domestic_default' | 'international_express_default';
  productIdCode: string;
  productNameStored: false;
  upstream: DhlSuccess;
};

function ref(value: string, name: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 100 || !/^[A-Za-z0-9._:-]+$/.test(normalized)) throw new TypeError(`Invalid ${name}.`);
  return normalized;
}

function country(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) throw new TypeError('Country codes must be ISO two-letter codes.');
  return normalized;
}

function productCode(value: string, adapter: Exclude<DhlRoutingMode, 'auto'>): string {
  const normalized = value.trim().toUpperCase();
  const valid = adapter === 'ecommerce-americas-v4' ? /^[A-Z]{3}$/.test(normalized) : /^[A-Z0-9]{1,4}$/.test(normalized);
  if (!valid) throw new TypeError(`productIdCode is not a valid ${adapter} carrier code; product names are not accepted.`);
  return normalized;
}

function selectAdapter(input: UnifiedDhlShipmentInput): {
  adapter: Exclude<DhlRoutingMode, 'auto'>;
  reason: UnifiedDhlShipmentResult['routingReason'];
} {
  if (input.routingMode && input.routingMode !== 'auto') return { adapter: input.routingMode, reason: 'explicit' };
  const origin = country(input.originCountryCode);
  const destination = country(input.destinationCountryCode);
  return origin === 'US' && destination === 'US'
    ? { adapter: 'ecommerce-americas-v4', reason: 'us_domestic_default' }
    : { adapter: 'mydhl-express', reason: 'international_express_default' };
}

export class DhlShipmentRouter {
  constructor(
    private readonly express: MyDhlExpressAdapter,
    private readonly ecommerce: DhlEcommerceAmericasV4Adapter,
    private readonly products: DhlProductCodeStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async createShipment(input: UnifiedDhlShipmentInput): Promise<UnifiedDhlShipmentResult> {
    const merchantRef = ref(input.merchantRef, 'merchantRef');
    const shipmentRef = ref(input.shipmentRef, 'shipmentRef');
    const originCountryCode = country(input.originCountryCode);
    const destinationCountryCode = country(input.destinationCountryCode);
    const selection = selectAdapter(input);
    const productIdCode = productCode(input.productIdCode, selection.adapter);

    const stored: DhlProductSelection = {
      merchantRef,
      shipmentRef,
      adapter: selection.adapter,
      productIdCode,
      originCountryCode,
      destinationCountryCode,
      status: 'selected',
      savedAt: this.now().toISOString(),
    };
    await this.products.save(stored);

    const upstream = selection.adapter === 'ecommerce-americas-v4'
      ? await this.ecommerce.createLabel(input.payload, productIdCode, input.labelFormat)
      : await this.express.createShipment(input.payload, productIdCode);
    await this.products.save({ ...stored, status: 'created' });
    return {
      ok: true,
      carrier: 'dhl',
      shipmentRef,
      selectedAdapter: selection.adapter,
      routingReason: selection.reason,
      productIdCode,
      productNameStored: false,
      upstream,
    };
  }

  async createReturnLabel(input: UnifiedDhlShipmentInput & { returnFormat?: DhlReturnLabelFormat }): Promise<UnifiedDhlShipmentResult> {
    const origin = country(input.originCountryCode);
    const destination = country(input.destinationCountryCode);
    const isDomesticUs = origin === 'US' && destination === 'US';
    if (input.routingMode === 'ecommerce-americas-v4' && !isDomesticUs) {
      throw new TypeError('DHL eCommerce Americas Return Label is available only for US domestic returns.');
    }
    const useEcommerce = input.routingMode === 'ecommerce-americas-v4' || ((input.routingMode ?? 'auto') === 'auto' && isDomesticUs);
    const routed: UnifiedDhlShipmentInput = { ...input, routingMode: useEcommerce ? 'ecommerce-americas-v4' : 'mydhl-express' };
    const merchantRef = ref(routed.merchantRef, 'merchantRef');
    const shipmentRef = ref(routed.shipmentRef, 'shipmentRef');
    const adapter = routed.routingMode as Exclude<DhlRoutingMode, 'auto'>;
    const productIdCode = productCode(routed.productIdCode, adapter);
    const stored: DhlProductSelection = { merchantRef, shipmentRef, adapter, productIdCode, originCountryCode: origin, destinationCountryCode: destination, status: 'selected', savedAt: this.now().toISOString() };
    await this.products.save(stored);
    const upstream = adapter === 'ecommerce-americas-v4'
      ? await this.ecommerce.createReturnLabel(routed.payload, productIdCode, input.returnFormat)
      : await this.express.createReturnShipment(routed.payload, productIdCode);
    await this.products.save({ ...stored, status: 'created' });
    return { ok: true, carrier: 'dhl', shipmentRef, selectedAdapter: adapter, routingReason: input.routingMode && input.routingMode !== 'auto' ? 'explicit' : useEcommerce ? 'us_domestic_default' : 'international_express_default', productIdCode, productNameStored: false, upstream };
  }

  createManifest(payload: Record<string, unknown>) { return this.ecommerce.createManifest(payload); }
  getManifest(requestId: string) { return this.ecommerce.getManifest(requestId); }
  findEcommerceProducts(payload: Record<string, unknown>) { return this.ecommerce.findProducts(payload); }

  async voidShipment(shipmentRef: string, packageId: string, dhlPackageId?: string): Promise<DhlSuccess> {
    const selection = await this.products.get(ref(shipmentRef, 'shipmentRef'));
    if (!selection) throw new TypeError('DHL shipment product selection was not found.');
    if (selection.adapter === 'mydhl-express') return this.express.voidShipment();
    if (selection.originCountryCode !== 'US' || selection.destinationCountryCode !== 'US') {
      throw new TypeError('DHL eCommerce v4 Void is available only for domestic labels.');
    }
    return this.ecommerce.voidLabel(packageId, dhlPackageId);
  }
}
