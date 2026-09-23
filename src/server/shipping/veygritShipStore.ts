import { createHash } from 'node:crypto';

export type SqlResult<Row = Record<string, unknown>> = { rows: Row[]; rowCount?: number | null };
export interface SqlQueryable {
  query<Row = Record<string, unknown>>(sql: string, values?: readonly unknown[]): Promise<SqlResult<Row>>;
}
export interface SqlClient extends SqlQueryable { release(): void }
export interface SqlPool extends SqlQueryable { connect(): Promise<SqlClient>; end?(): Promise<void> }

export type ShipOwner = { merchantRef: string; guestSessionRef?: never } | { guestSessionRef: string; merchantRef?: never };
/** Direct, first-party carrier identifiers persisted by Veygrit Ship. */
export type Carrier =
  | 'ups' | 'dhl' | 'amazon_shipping' | 'loggi' | 'royal_mail' | 'inpost'
  | 'ninja_van' | 'delhivery' | 'pargo' | 'courier_guy' | 'sf_express' | 'four_px'
  | 'chilexpress' | 'coordinadora' | 'oca' | 'ninety_nine_minutos'
  | 'redpack' | 'estafeta' | 'jadlog' | 'total_express' | 'roadie'
  | 'gls' | 'dpd' | 'hermes_de' | 'paack' | 'mondial_relay' | 'packeta' | 'dsv' | 'geodis'
  | 'lalamove' | 'aramex_anz' | 'nz_couriers' | 'jt_express' | 'yamato'
  | 'collivery' | 'ram_couriers' | 'lilwa_delivery'
  | 'fez_delivery' | 'haulstow' | 'kwik_delivery' | 'gigl' | 'dodo_tanzania'
  | 'aramex_mena' | 'smsa_express' | 'naqel_express' | 'emirates_post' | 'bosta' | 'mylerz'
  | 'blue_dart' | 'dtdc' | 'gdex' | 'jne'
  | 'ghn' | 'ghtk' | 'grab_express' | 'gosend' | 'flash_express'
  | 'pathao_courier' | 'ecourier_bd' | 'leopards_courier' | 'domex_lk' | 'nepal_can_move'
  | 'yodel' | 'fan_courier' | 'acs_courier' | 'dachser' | 'sameday'
  | 'zto_express' | 'yto_express' | 'sto_express' | 'deppon'
  | 'jd_logistics' | 'cainiao_express'
  | 'dhl_parcel_de' | 'colissimo' | 'poste_italiane'
  | 'correos' | 'postnl' | 'bpost'
  | 'postnord' | 'swiss_post' | 'austrian_post' | 'ppl_cz'
  | 'omniva' | 'an_post' | 'ctt_portugal'
  | 'andreani' | 'servientrega' | 'blue_express';
export type CarrierAdapter =
  | 'ups' | 'mydhl-express' | 'ecommerce-americas-v4' | 'amazon-shipping-v2' | 'loggi-v1'
  | 'royal-mail-shipping-v2' | 'inpost-shipping-v2' | 'ninja-van-order-v4.2'
  | 'delhivery-b2c-v1' | 'pargo-simba-v1' | 'courier-guy-v2'
  | 'sf-express-openapi-v2' | 'four-px-openapi-v1'
  | 'chilexpress-rest-v1' | 'coordinadora-clientes-v1' | 'oca-epak-v1'
  | '99minutos-v3' | 'redpack-official-v1' | 'estafeta-label-rest-v1'
  | 'jadlog-embarcador-v2.3' | 'total-express-official-v1' | 'ups-roadie-v1'
  | 'gls-europe-official-v1' | 'dpd-europe-official-v1' | 'hermes-germany-hsi-v1'
  | 'paack-public-v3' | 'mondial-relay-webservice-v5' | 'packeta-soap-v1'
  | 'dsv-generic-v2' | 'geodis-official-v1'
  | 'lalamove-v3' | 'aramex-anz-myfastway-v1' | 'nz-couriers-integration-v1'
  | 'jt-open-platform-v1' | 'yamato-b2-cloud-v1'
  | 'collivery-v3' | 'ram-official-v1' | 'lilwa-delivery-v2'
  | 'fez-business-api-v1' | 'haulstow-partner-shipping-v1'
  | 'kwik-business-contract-v1' | 'gigl-enterprise-contract-v1'
  | 'dodo-tanzania-contract-v1'
  | 'aramex-mena-official-v1' | 'smsa-ecommerce-soap-v1' | 'naqel-xml-shipping-v9'
  | 'emirates-post-emx-v1' | 'bosta-v2' | 'mylerz-official-v1'
  | 'blue-dart-business-integration-v1' | 'dtdc-enterprise-v1'
  | 'mygdex-openapi-v1' | 'jne-contract-api-v1'
  | 'ghn-public-api-v2' | 'ghtk-openapi-v1.5'
  | 'grabexpress-contract-v1' | 'gosend-contract-v1' | 'flash-express-contract-v1'
  | 'pathao-courier-v1' | 'ecourier-merchant-v5.4'
  | 'leopards-merchant-contract-v1' | 'domex-client-contract-v1'
  | 'nepal-can-move-contract-v1'
  | 'yodel-shipping-orders-v1' | 'fan-courier-api-v2'
  | 'acs-rest-web-services-v1' | 'dachser-business-integration-v2'
  | 'sameday-client-api-v2'
  | 'zto-open-platform-v1' | 'yto-open-platform-v1' | 'sto-open-platform-v1'
  | 'deppon-open-platform-v1' | 'jd-logistics-open-platform-v1'
  | 'cainiao-express-open-platform-v1'
  | 'dhl-parcel-de-shipping-v2' | 'colissimo-sls-v3'
  | 'poste-delivery-business-v1' | 'correos-oauth-api-v1'
  | 'postnl-shipment-v4' | 'bpost-shipping-manager-v3'
  | 'postnord-booking-contract-v1' | 'swiss-post-digital-commerce-v1'
  | 'austrian-post-contract-v1' | 'ppl-cpl-api-v1' | 'omniva-omx-v1'
  | 'an-post-ecommhub-v2.7' | 'ctt-expresso-contract-v1'
  | 'andreani-globallpack-v1' | 'servientrega-standard-v1'
  | 'blue-express-contract-v1';

export type MerchantInput = {
  merchantRef: string;
  displayName: string;
  legalName?: string;
  businessType: 'individual' | 'sole_proprietor' | 'company';
  countryCode: string;
  languageTag?: string;
  email: string;
  phoneE164: string;
};

export type GuestSessionInput = {
  sessionRef: string;
  token: string;
  expiresAt: string;
};

export type CarrierConnectionInput = {
  connectionRef: string;
  merchantRef: string;
  carrier: Carrier;
  accountAlias?: string;
  accountNumberLast4?: string;
  credentialSecretRef: string;
  oauthScopes?: string[];
  tokenExpiresAt?: string;
  status?: 'pending' | 'active' | 'reauthorization_required' | 'disabled';
};

export type PackageInput = {
  packageRef: string;
  packagingCode?: string;
  weightValue: number;
  weightUnit: 'lb' | 'kg';
  lengthValue?: number;
  widthValue?: number;
  heightValue?: number;
  dimensionUnit?: 'in' | 'cm';
  declaredValue?: number;
  declaredValueCurrency?: string;
};

export type ShipmentInput = ShipOwner & {
  shipmentRef: string;
  carrierConnectionRef?: string;
  carrier?: Carrier;
  adapter?: CarrierAdapter;
  productIdCode?: string;
  direction?: 'outbound' | 'return';
  mode?: 'test' | 'live';
  originCountryCode: string;
  destinationCountryCode: string;
  originAddressRef: string;
  destinationAddressRef: string;
  originAddressSnapshotRef?: string;
  destinationAddressSnapshotRef?: string;
  shipDate?: string;
  requestFingerprint?: string;
  packages: PackageInput[];
};

export type RateQuoteInput = {
  quoteRef: string;
  shipmentRef: string;
  carrierConnectionRef?: string;
  carrier: Carrier;
  adapter?: CarrierAdapter;
  productIdCode: string;
  amount: number;
  currency: string;
  deliveryDays?: number;
  estimatedDeliveryAt?: string;
  expiresAt: string;
  carrierResponseRef?: string;
};

export type LabelInput = {
  labelRef: string;
  shipmentRef: string;
  packageRef?: string;
  carrier: Carrier;
  carrierTrackingNumber: string;
  format: 'pdf' | 'png' | 'zpl' | 'gif' | 'epl';
  artifactKey: string;
  artifactSha256: string;
  artifactSizeBytes?: number;
  carrierShipmentId?: string;
};

export type TrackingEventInput = {
  eventRef: string;
  shipmentRef: string;
  labelRef?: string;
  carrier: Carrier;
  carrierEventId?: string;
  eventFingerprint: string;
  statusCode: string;
  statusCategory: 'pre_transit' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'return_to_sender' | 'unknown';
  summary?: string;
  locationCity?: string;
  locationRegion?: string;
  locationPostalCode?: string;
  locationCountryCode?: string;
  occurredAt: string;
  carrierPayloadRef?: string;
  carrierPayloadSha256?: string;
};

export type WebhookDeliveryInput = {
  deliveryRef: string;
  merchantRef: string;
  shipmentRef?: string;
  endpointRef: string;
  eventType: string;
  eventRef: string;
  payloadRef: string;
  payloadSha256: string;
  nextAttemptAt?: string;
};

export type AuditEventInput = Partial<ShipOwner> & {
  eventRef: string;
  actorType: 'merchant_user' | 'guest' | 'api_key' | 'system' | 'carrier' | 'support';
  actorRef?: string;
  action: string;
  aggregateType: string;
  aggregateRef: string;
  outcome: 'success' | 'failure' | 'denied';
  requestId?: string;
  sourceIpHash?: string;
  details?: Record<string, unknown>;
  occurredAt?: string;
};

type OwnerIds = { merchantId: string | null; guestSessionId: string | null };
type IdempotencyRow = {
  id: string;
  idempotency_ref: string;
  request_hash: string;
  state: 'in_progress' | 'completed' | 'failed';
  response_status: number | null;
  response_body_ref: string | null;
  response_body_sha256: string | null;
  lease_expires_at: Date | string;
};

export type IdempotencyReservation =
  | { outcome: 'acquired'; idempotencyRef: string }
  | { outcome: 'busy'; idempotencyRef: string }
  | { outcome: 'conflict'; idempotencyRef: string }
  | { outcome: 'replay'; idempotencyRef: string; state: 'completed' | 'failed'; responseStatus: number | null; responseBodyRef: string | null; responseBodySha256: string | null };

const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function required(value: string, name: string, max = 500): string {
  const normalized = value.normalize('NFKC').trim();
  if (!normalized || normalized.length > max) throw new TypeError(`${name} is invalid.`);
  return normalized;
}

function upperCode(value: string, name: string, length: number): string {
  const normalized = required(value, name, length).toUpperCase();
  if (!new RegExp(`^[A-Z0-9_-]{${length === 2 || length === 3 ? length : `1,${length}`}}$`).test(normalized)) {
    throw new TypeError(`${name} is invalid.`);
  }
  return normalized;
}

function iso(value: string, name: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError(`${name} is invalid.`);
  return date.toISOString();
}

function assertHash(value: string, name: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) throw new TypeError(`${name} must be a SHA-256 hex digest.`);
  return normalized;
}

function credentialSecretReference(value: string): string {
  const normalized = required(value, 'credentialSecretRef');
  const isOpaqueRef = /^secretref_[A-Za-z0-9_-]{8,}$/.test(normalized);
  const isAwsRef = /^arn:(?:aws|aws-us-gov|aws-cn):secretsmanager:[^\s]+$/.test(normalized);
  const isVaultRef = /^vault:\/\/[^\s]+$/.test(normalized);
  const isAzureRef = /^https:\/\/[A-Za-z0-9.-]+\.vault\.azure\.net\/secrets\/[^\s]+$/.test(normalized);
  const isGcpRef = /^projects\/[A-Za-z0-9._-]+\/secrets\/[A-Za-z0-9._-]+\/versions\/[A-Za-z0-9._-]+$/.test(normalized);
  if (!isOpaqueRef && !isAwsRef && !isVaultRef && !isAzureRef && !isGcpRef) {
    throw new TypeError('credentialSecretRef must be an opaque Secrets Manager reference; raw carrier credentials are forbidden.');
  }
  return normalized;
}

async function inTransaction<T>(pool: SqlPool, work: (client: SqlClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* keep the original error */ }
    throw error;
  } finally {
    client.release();
  }
}

export class PostgresVeygritShipStore {
  constructor(private readonly pool: SqlPool) {}

  async close(): Promise<void> { await this.pool.end?.(); }

  async upsertMerchant(input: MerchantInput): Promise<void> {
    await this.pool.query(
      `INSERT INTO veygrit_ship_merchant
        (merchant_ref, display_name, legal_name, business_type, country_code, language_tag, email, phone_e164)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (merchant_ref) DO UPDATE SET
         display_name=EXCLUDED.display_name, legal_name=EXCLUDED.legal_name,
         business_type=EXCLUDED.business_type, country_code=EXCLUDED.country_code,
         language_tag=EXCLUDED.language_tag, email=EXCLUDED.email, phone_e164=EXCLUDED.phone_e164`,
      [required(input.merchantRef, 'merchantRef', 100), required(input.displayName, 'displayName', 200), input.legalName?.trim() || null,
        input.businessType, upperCode(input.countryCode, 'countryCode', 2), input.languageTag?.trim() || 'en-US',
        required(input.email, 'email', 320).toLowerCase(), required(input.phoneE164, 'phoneE164', 20)],
    );
  }

  async createGuestSession(input: GuestSessionInput): Promise<{ sessionRef: string; tokenHash: string }> {
    const sessionRef = required(input.sessionRef, 'sessionRef', 100);
    const tokenHash = sha256(required(input.token, 'token', 2000));
    const result = await this.pool.query(
      `INSERT INTO veygrit_ship_guest_session (session_ref, token_hash, expires_at)
       VALUES ($1,$2,$3)
       ON CONFLICT (session_ref) DO UPDATE SET last_seen_at=now()
       WHERE veygrit_ship_guest_session.token_hash=EXCLUDED.token_hash
       RETURNING session_ref`,
      [sessionRef, tokenHash, iso(input.expiresAt, 'expiresAt')],
    );
    if (!result.rows.length) throw new Error('Guest session reference is already bound to another token.');
    return { sessionRef, tokenHash };
  }

  async upsertCarrierConnection(input: CarrierConnectionInput): Promise<void> {
    const result = await this.pool.query(
      `INSERT INTO veygrit_ship_carrier_connection
        (connection_ref, merchant_id, carrier, account_alias, account_number_last4, credential_secret_ref,
         oauth_scopes, token_expires_at, status, next_token_refresh_at)
       SELECT $1, m.id, $3, $4, $5, $6, $7, $8, $9,
         CASE WHEN $3='ups' THEN COALESCE($8::timestamptz - interval '5 minutes', now()) ELSE NULL END
       FROM veygrit_ship_merchant m WHERE m.merchant_ref=$2
       ON CONFLICT (connection_ref) DO UPDATE SET
         carrier=EXCLUDED.carrier, account_alias=EXCLUDED.account_alias,
         account_number_last4=EXCLUDED.account_number_last4, credential_secret_ref=EXCLUDED.credential_secret_ref,
         oauth_scopes=EXCLUDED.oauth_scopes, token_expires_at=EXCLUDED.token_expires_at, status=EXCLUDED.status,
         next_token_refresh_at=EXCLUDED.next_token_refresh_at
       WHERE veygrit_ship_carrier_connection.merchant_id=EXCLUDED.merchant_id
       RETURNING connection_ref`,
      [required(input.connectionRef, 'connectionRef', 100), required(input.merchantRef, 'merchantRef', 100), input.carrier,
        input.accountAlias?.trim() || 'default', input.accountNumberLast4?.trim() || null,
        credentialSecretReference(input.credentialSecretRef), input.oauthScopes ?? [],
        input.tokenExpiresAt ? iso(input.tokenExpiresAt, 'tokenExpiresAt') : null, input.status ?? 'pending'],
    );
    if (!result.rows.length) throw new Error('Merchant was not found for carrier connection.');
  }

  async createShipmentWithPackages(input: ShipmentInput): Promise<{ shipmentRef: string; packageRefs: string[] }> {
    if (!input.packages.length) throw new TypeError('At least one package is required.');
    return inTransaction(this.pool, async client => {
      const owner = await this.resolveOwner(client, input);
      if (input.mode === 'live' && !owner.merchantId) {
        throw new TypeError('A Merchant account is required for live shipments and real label purchases.');
      }
      if (input.mode === 'live' && !input.carrierConnectionRef) {
        throw new TypeError('An active Merchant carrier connection is required for live shipments.');
      }
      let connectionId: string | null = null;
      if (input.carrierConnectionRef) {
        if (!owner.merchantId) throw new TypeError('Guest shipments cannot use a merchant carrier connection.');
        const connection = await client.query<{ id: string; carrier: Carrier }>(
          `SELECT id, carrier FROM veygrit_ship_carrier_connection
           WHERE connection_ref=$1 AND merchant_id=$2 AND status='active'`,
          [required(input.carrierConnectionRef, 'carrierConnectionRef', 100), owner.merchantId],
        );
        if (!connection.rows[0]) throw new Error('Active carrier connection was not found.');
        if (input.carrier && input.carrier !== connection.rows[0].carrier) throw new TypeError('Shipment carrier does not match carrier connection.');
        connectionId = connection.rows[0].id;
      }
      const shipmentRef = required(input.shipmentRef, 'shipmentRef', 100);
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO veygrit_ship_shipment
          (shipment_ref, merchant_id, guest_session_id, carrier_connection_id, carrier, adapter, product_id_code,
           direction, mode, origin_country_code, destination_country_code, origin_address_ref, destination_address_ref,
           origin_address_snapshot_ref, destination_address_snapshot_ref, ship_date, request_fingerprint)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING id`,
        [shipmentRef, owner.merchantId, owner.guestSessionId, connectionId, input.carrier ?? null, input.adapter ?? null,
          input.productIdCode ? upperCode(input.productIdCode, 'productIdCode', 20) : null,
          input.direction ?? 'outbound', input.mode ?? 'test', upperCode(input.originCountryCode, 'originCountryCode', 2),
          upperCode(input.destinationCountryCode, 'destinationCountryCode', 2), required(input.originAddressRef, 'originAddressRef', 200),
          required(input.destinationAddressRef, 'destinationAddressRef', 200), input.originAddressSnapshotRef?.trim() || null,
          input.destinationAddressSnapshotRef?.trim() || null, input.shipDate ?? null,
          input.requestFingerprint ? assertHash(input.requestFingerprint, 'requestFingerprint') : null],
      );
      const shipmentId = inserted.rows[0]?.id;
      if (!shipmentId) throw new Error('Shipment was not created.');
      for (const [index, pkg] of input.packages.entries()) {
        await client.query(
          `INSERT INTO veygrit_ship_package
            (package_ref, shipment_id, sequence_no, packaging_code, weight_value, weight_unit,
             length_value, width_value, height_value, dimension_unit, declared_value, declared_value_currency)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [required(pkg.packageRef, 'packageRef', 100), shipmentId, index + 1, pkg.packagingCode?.trim() || null,
            pkg.weightValue, pkg.weightUnit, pkg.lengthValue ?? null, pkg.widthValue ?? null, pkg.heightValue ?? null,
            pkg.dimensionUnit ?? null, pkg.declaredValue ?? null,
            pkg.declaredValueCurrency ? upperCode(pkg.declaredValueCurrency, 'declaredValueCurrency', 3) : null],
        );
      }
      return { shipmentRef, packageRefs: input.packages.map(pkg => pkg.packageRef) };
    });
  }

  async saveRateQuote(input: RateQuoteInput): Promise<void> {
    const result = await this.pool.query(
      `INSERT INTO veygrit_ship_rate_quote
        (quote_ref, shipment_id, carrier_connection_id, carrier, adapter, product_id_code, amount, currency,
         delivery_days, estimated_delivery_at, expires_at, carrier_response_ref)
       SELECT $1, s.id, c.id, $4, $5, $6, $7, $8, $9, $10, $11, $12
       FROM veygrit_ship_shipment s
       LEFT JOIN veygrit_ship_carrier_connection c ON c.connection_ref=$3
       WHERE s.shipment_ref=$2 AND ($3::text IS NULL OR c.merchant_id=s.merchant_id)
       ON CONFLICT (quote_ref) DO UPDATE SET
         amount=EXCLUDED.amount, currency=EXCLUDED.currency, delivery_days=EXCLUDED.delivery_days,
         estimated_delivery_at=EXCLUDED.estimated_delivery_at, expires_at=EXCLUDED.expires_at,
         carrier_response_ref=EXCLUDED.carrier_response_ref
       RETURNING quote_ref`,
      [required(input.quoteRef, 'quoteRef', 100), required(input.shipmentRef, 'shipmentRef', 100),
        input.carrierConnectionRef?.trim() || null, input.carrier, input.adapter ?? null,
        upperCode(input.productIdCode, 'productIdCode', 20), input.amount, upperCode(input.currency, 'currency', 3),
        input.deliveryDays ?? null, input.estimatedDeliveryAt ? iso(input.estimatedDeliveryAt, 'estimatedDeliveryAt') : null,
        iso(input.expiresAt, 'expiresAt'), input.carrierResponseRef?.trim() || null],
    );
    if (!result.rows.length) throw new Error('Shipment or matching carrier connection was not found for rate quote.');
  }

  async selectRateQuote(quoteRef: string, shipmentRef: string): Promise<void> {
    await inTransaction(this.pool, async client => {
      const normalizedQuoteRef = required(quoteRef, 'quoteRef', 100);
      const normalizedShipmentRef = required(shipmentRef, 'shipmentRef', 100);
      const rows = await client.query<{ id: string; quote_ref: string; status: string; available: boolean }>(
        `SELECT q.id, q.quote_ref, q.status, (q.expires_at>now()) AS available
         FROM veygrit_ship_rate_quote q JOIN veygrit_ship_shipment s ON s.id=q.shipment_id
         WHERE s.shipment_ref=$1 ORDER BY q.id FOR UPDATE`,
        [normalizedShipmentRef],
      );
      const selected = rows.rows.find(row => row.quote_ref === normalizedQuoteRef && row.status === 'offered' && row.available);
      if (!selected) throw new Error('Available rate quote was not found.');
      await client.query(
        `UPDATE veygrit_ship_rate_quote
         SET status=CASE WHEN id=$1 THEN 'selected' WHEN status='selected' THEN 'rejected' ELSE status END
         WHERE shipment_id=(SELECT id FROM veygrit_ship_shipment WHERE shipment_ref=$2)`,
        [selected.id, normalizedShipmentRef],
      );
      await client.query(`UPDATE veygrit_ship_shipment SET status='rated' WHERE shipment_ref=$1`, [normalizedShipmentRef]);
    });
  }

  async saveLabel(input: LabelInput): Promise<void> {
    await inTransaction(this.pool, async client => {
      const result = await client.query(
        `INSERT INTO veygrit_ship_label
          (label_ref, shipment_id, package_id, carrier, carrier_tracking_number, format,
           artifact_key, artifact_sha256, artifact_size_bytes)
         SELECT $1, s.id, p.id, $4, $5, $6, $7, $8, $9
         FROM veygrit_ship_shipment s
         LEFT JOIN veygrit_ship_package p ON p.package_ref=$3 AND p.shipment_id=s.id
         WHERE s.shipment_ref=$2 AND ($3::text IS NULL OR p.id IS NOT NULL)
         ON CONFLICT (label_ref) DO UPDATE SET label_ref=EXCLUDED.label_ref
         WHERE veygrit_ship_label.shipment_id=EXCLUDED.shipment_id
           AND veygrit_ship_label.carrier=EXCLUDED.carrier
           AND veygrit_ship_label.carrier_tracking_number=EXCLUDED.carrier_tracking_number
           AND veygrit_ship_label.artifact_sha256=EXCLUDED.artifact_sha256
         RETURNING label_ref`,
        [required(input.labelRef, 'labelRef', 100), required(input.shipmentRef, 'shipmentRef', 100), input.packageRef?.trim() || null,
          input.carrier, required(input.carrierTrackingNumber, 'carrierTrackingNumber', 100), input.format,
          required(input.artifactKey, 'artifactKey'), assertHash(input.artifactSha256, 'artifactSha256'), input.artifactSizeBytes ?? null],
      );
      if (!result.rows.length) throw new Error('Label identity conflicts, or shipment/package was not found.');
      await client.query(
        `UPDATE veygrit_ship_shipment SET status='created', carrier=$2,
           carrier_shipment_id=COALESCE($3, carrier_shipment_id), label_outcome='confirmed',
           next_tracking_poll_at=now(), next_carrier_reconcile_at=now()
         WHERE shipment_ref=$1`,
        [input.shipmentRef, input.carrier, input.carrierShipmentId?.trim() || null],
      );
    });
  }

  async appendTrackingEvent(input: TrackingEventInput): Promise<boolean> {
    const result = await this.pool.query(
      `INSERT INTO veygrit_ship_tracking_event
        (event_ref, shipment_id, label_id, carrier, carrier_event_id, event_fingerprint, status_code,
         status_category, summary, location_city, location_region, location_postal_code, location_country_code,
         occurred_at, carrier_payload_ref, carrier_payload_sha256)
       SELECT $1, s.id, l.id, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
       FROM veygrit_ship_shipment s
       LEFT JOIN veygrit_ship_label l ON l.label_ref=$3 AND l.shipment_id=s.id
       WHERE s.shipment_ref=$2 AND ($3::text IS NULL OR l.id IS NOT NULL)
       ON CONFLICT DO NOTHING RETURNING event_ref`,
      [required(input.eventRef, 'eventRef', 100), required(input.shipmentRef, 'shipmentRef', 100), input.labelRef?.trim() || null,
        input.carrier, input.carrierEventId?.trim() || null, assertHash(input.eventFingerprint, 'eventFingerprint'),
        required(input.statusCode, 'statusCode', 50), input.statusCategory, input.summary?.trim() || null,
        input.locationCity?.trim() || null, input.locationRegion?.trim() || null, input.locationPostalCode?.trim() || null,
        input.locationCountryCode ? upperCode(input.locationCountryCode, 'locationCountryCode', 2) : null,
        iso(input.occurredAt, 'occurredAt'), input.carrierPayloadRef?.trim() || null,
        input.carrierPayloadSha256 ? assertHash(input.carrierPayloadSha256, 'carrierPayloadSha256') : null],
    );
    return result.rows.length === 1;
  }

  async enqueueWebhookDelivery(input: WebhookDeliveryInput): Promise<boolean> {
    const result = await this.pool.query(
      `INSERT INTO veygrit_ship_webhook_delivery
        (delivery_ref, merchant_id, shipment_id, endpoint_ref, event_type, event_ref,
         payload_ref, payload_sha256, next_attempt_at)
       SELECT $1, m.id, s.id, $4, $5, $6, $7, $8, COALESCE($9, now())
       FROM veygrit_ship_merchant m
       LEFT JOIN veygrit_ship_shipment s ON s.shipment_ref=$3 AND s.merchant_id=m.id
       WHERE m.merchant_ref=$2 AND ($3::text IS NULL OR s.id IS NOT NULL)
       ON CONFLICT (merchant_id, endpoint_ref, event_ref) DO NOTHING RETURNING delivery_ref`,
      [required(input.deliveryRef, 'deliveryRef', 100), required(input.merchantRef, 'merchantRef', 100), input.shipmentRef?.trim() || null,
        required(input.endpointRef, 'endpointRef', 200), required(input.eventType, 'eventType', 100),
        required(input.eventRef, 'eventRef', 100), required(input.payloadRef, 'payloadRef'),
        assertHash(input.payloadSha256, 'payloadSha256'), input.nextAttemptAt ? iso(input.nextAttemptAt, 'nextAttemptAt') : null],
    );
    return result.rows.length === 1;
  }

  async claimWebhookDeliveries(limit: number, leaseSeconds = 60): Promise<Record<string, unknown>[]> {
    const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
    const safeLease = Math.max(10, Math.min(900, Math.trunc(leaseSeconds)));
    const result = await this.pool.query(
      `WITH candidates AS (
         SELECT id FROM veygrit_ship_webhook_delivery
         WHERE (status IN ('pending','retry') AND next_attempt_at<=now())
            OR (status='delivering' AND lease_expires_at<=now())
         ORDER BY COALESCE(lease_expires_at, next_attempt_at), id LIMIT $1 FOR UPDATE SKIP LOCKED
       )
       UPDATE veygrit_ship_webhook_delivery d
       SET status='delivering', attempt_count=d.attempt_count+1,
           lease_expires_at=now()+make_interval(secs => $2)
       FROM candidates c WHERE d.id=c.id RETURNING d.*`,
      [safeLimit, safeLease],
    );
    return result.rows;
  }

  async finishWebhookDelivery(input: {
    deliveryRef: string;
    outcome: 'succeeded' | 'retry' | 'dead_letter';
    nextAttemptAt?: string;
    responseStatus?: number;
    errorCode?: string;
  }): Promise<'succeeded' | 'retry' | 'dead_letter'> {
    if (input.outcome === 'retry' && !input.nextAttemptAt) throw new TypeError('nextAttemptAt is required for a webhook retry.');
    const result = await this.pool.query(
      `WITH finished AS (
         UPDATE veygrit_ship_webhook_delivery
         SET status=CASE WHEN $2='retry' AND attempt_count>=max_attempts THEN 'dead_letter' ELSE $2 END,
             next_attempt_at=COALESCE($3,next_attempt_at), response_status=$4,
             last_error_code=$5, lease_expires_at=NULL,
             delivered_at=CASE WHEN $2='succeeded' THEN now() ELSE NULL END,
             dead_lettered_at=CASE WHEN $2='dead_letter' OR ($2='retry' AND attempt_count>=max_attempts) THEN now() ELSE NULL END
         WHERE delivery_ref=$1 AND status='delivering' RETURNING *
       ), audit_dlq AS (
         INSERT INTO veygrit_ship_audit_event
           (event_ref, merchant_id, actor_type, action, aggregate_type, aggregate_ref, outcome, details)
         SELECT 'audit_' || md5(clock_timestamp()::text || random()::text || f.delivery_ref), f.merchant_id,
           'system', 'webhook.delivery.dead_lettered', 'webhook_delivery', f.delivery_ref, 'failure',
           jsonb_build_object('eventType',f.event_type,'errorCode',f.last_error_code,'attemptCount',f.attempt_count)
         FROM finished f WHERE f.status='dead_letter' RETURNING id
       ) SELECT status FROM finished`,
      [required(input.deliveryRef, 'deliveryRef', 100), input.outcome,
        input.nextAttemptAt ? iso(input.nextAttemptAt, 'nextAttemptAt') : null,
        input.responseStatus ?? null, input.errorCode?.trim() || null],
    );
    const status = (result.rows[0] as { status?: 'succeeded' | 'retry' | 'dead_letter' } | undefined)?.status;
    if (!status) throw new Error('Claimed webhook delivery was not found.');
    return status;
  }

  async listDeadLetterWebhookDeliveries(limit = 100): Promise<Record<string, unknown>[]> {
    const safeLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
    const result = await this.pool.query(
      `SELECT delivery_ref, endpoint_ref, event_type, event_ref, attempt_count, max_attempts,
         response_status, last_error_code, dead_lettered_at
       FROM veygrit_ship_webhook_delivery WHERE status='dead_letter'
       ORDER BY dead_lettered_at DESC, id DESC LIMIT $1`,
      [safeLimit],
    );
    return result.rows;
  }

  async replayWebhookDeadLetter(deliveryRef: string, nextAttemptAt = new Date().toISOString()): Promise<void> {
    const result = await this.pool.query(
      `UPDATE veygrit_ship_webhook_delivery SET status='pending', attempt_count=0, next_attempt_at=$2,
         lease_expires_at=NULL, response_status=NULL, last_error_code=NULL, delivered_at=NULL, dead_lettered_at=NULL
       WHERE delivery_ref=$1 AND status='dead_letter' RETURNING delivery_ref`,
      [required(deliveryRef, 'deliveryRef', 100), iso(nextAttemptAt, 'nextAttemptAt')],
    );
    if (!result.rows.length) throw new Error('Dead-letter webhook delivery was not found.');
  }

  async reserveIdempotency(input: ShipOwner & {
    idempotencyRef: string;
    operation: string;
    idempotencyKey: string;
    requestHash: string;
    leaseExpiresAt: string;
    expiresAt: string;
  }): Promise<IdempotencyReservation> {
    const owner = await this.resolveOwner(this.pool, input);
    const idempotencyRef = required(input.idempotencyRef, 'idempotencyRef', 100);
    const operation = required(input.operation, 'operation', 150);
    const keyHash = sha256(required(input.idempotencyKey, 'idempotencyKey', 500));
    const requestHash = assertHash(input.requestHash, 'requestHash');
    const inserted = await this.pool.query<IdempotencyRow>(
      `INSERT INTO veygrit_ship_idempotency_record
        (idempotency_ref, merchant_id, guest_session_id, operation, idempotency_key_hash,
         request_hash, lease_expires_at, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT DO NOTHING RETURNING *`,
      [idempotencyRef, owner.merchantId, owner.guestSessionId, operation, keyHash, requestHash,
        iso(input.leaseExpiresAt, 'leaseExpiresAt'), iso(input.expiresAt, 'expiresAt')],
    );
    if (inserted.rows[0]) return { outcome: 'acquired', idempotencyRef };

    const existing = await this.pool.query<IdempotencyRow>(
      `SELECT * FROM veygrit_ship_idempotency_record
       WHERE operation=$1 AND idempotency_key_hash=$2
         AND merchant_id IS NOT DISTINCT FROM $3 AND guest_session_id IS NOT DISTINCT FROM $4`,
      [operation, keyHash, owner.merchantId, owner.guestSessionId],
    );
    const row = existing.rows[0];
    if (!row) throw new Error('Idempotency record conflict could not be resolved.');
    if (row.request_hash !== requestHash) return { outcome: 'conflict', idempotencyRef: row.idempotency_ref };
    if (row.state !== 'in_progress') {
      return { outcome: 'replay', idempotencyRef: row.idempotency_ref, state: row.state,
        responseStatus: row.response_status, responseBodyRef: row.response_body_ref, responseBodySha256: row.response_body_sha256 };
    }
    const reclaimed = await this.pool.query<{ idempotency_ref: string }>(
      `UPDATE veygrit_ship_idempotency_record SET lease_expires_at=$2
       WHERE id=$1 AND state='in_progress' AND lease_expires_at<=now() RETURNING idempotency_ref`,
      [row.id, iso(input.leaseExpiresAt, 'leaseExpiresAt')],
    );
    return reclaimed.rows[0]
      ? { outcome: 'acquired', idempotencyRef: reclaimed.rows[0].idempotency_ref }
      : { outcome: 'busy', idempotencyRef: row.idempotency_ref };
  }

  async finishIdempotency(input: {
    idempotencyRef: string;
    requestHash: string;
    state: 'completed' | 'failed';
    responseStatus?: number;
    responseBodyRef?: string;
    responseBodySha256?: string;
  }): Promise<void> {
    const result = await this.pool.query(
      `UPDATE veygrit_ship_idempotency_record SET state=$3, response_status=$4,
         response_body_ref=$5, response_body_sha256=$6,
         completed_at=CASE WHEN $3='completed' THEN now() ELSE NULL END
       WHERE idempotency_ref=$1 AND request_hash=$2 AND state='in_progress'
       RETURNING idempotency_ref`,
      [required(input.idempotencyRef, 'idempotencyRef', 100), assertHash(input.requestHash, 'requestHash'), input.state,
        input.responseStatus ?? null, input.responseBodyRef?.trim() || null,
        input.responseBodySha256 ? assertHash(input.responseBodySha256, 'responseBodySha256') : null],
    );
    if (!result.rows.length) throw new Error('In-progress idempotency record was not found.');
  }

  async appendAuditEvent(input: AuditEventInput): Promise<void> {
    const owner = input.merchantRef || input.guestSessionRef
      ? await this.resolveOwner(this.pool, input as ShipOwner)
      : { merchantId: null, guestSessionId: null };
    const details = JSON.stringify(input.details ?? {});
    if (Buffer.byteLength(details, 'utf8') > 16_384) throw new TypeError('Audit details exceed 16 KiB.');
    await this.pool.query(
      `INSERT INTO veygrit_ship_audit_event
        (event_ref, merchant_id, guest_session_id, actor_type, actor_ref, action, aggregate_type,
         aggregate_ref, outcome, request_id, source_ip_hash, details, occurred_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,COALESCE($13,now()))`,
      [required(input.eventRef, 'eventRef', 100), owner.merchantId, owner.guestSessionId, input.actorType,
        input.actorRef?.trim() || null, required(input.action, 'action', 150), required(input.aggregateType, 'aggregateType', 100),
        required(input.aggregateRef, 'aggregateRef', 200), input.outcome, input.requestId?.trim() || null,
        input.sourceIpHash ? assertHash(input.sourceIpHash, 'sourceIpHash') : null, details,
        input.occurredAt ? iso(input.occurredAt, 'occurredAt') : null],
    );
  }

  private async resolveOwner(queryable: SqlQueryable, owner: ShipOwner): Promise<OwnerIds> {
    if (owner.merchantRef) {
      const result = await queryable.query<{ id: string }>(
        `SELECT id FROM veygrit_ship_merchant WHERE merchant_ref=$1 AND status='active'`,
        [required(owner.merchantRef, 'merchantRef', 100)],
      );
      if (!result.rows[0]) throw new Error('Active merchant was not found.');
      return { merchantId: result.rows[0].id, guestSessionId: null };
    }
    const result = await queryable.query<{ id: string }>(
      `SELECT id FROM veygrit_ship_guest_session
       WHERE session_ref=$1 AND status='active' AND expires_at>now()`,
      [required(owner.guestSessionRef, 'guestSessionRef', 100)],
    );
    if (!result.rows[0]) throw new Error('Active guest session was not found.');
    return { merchantId: null, guestSessionId: result.rows[0].id };
  }
}

export async function createPostgresVeygritShipStore(
  connectionString: string,
  options: { maxConnections?: number; statementTimeoutMs?: number } = {},
): Promise<PostgresVeygritShipStore> {
  const normalized = required(connectionString, 'connectionString', 4000);
  const { Pool } = await dynamicImport('pg');
  const pool = new Pool({
    connectionString: normalized,
    max: Math.max(1, Math.min(30, options.maxConnections ?? 10)),
    statement_timeout: Math.max(1000, options.statementTimeoutMs ?? 15000),
    application_name: 'veygrit-ship',
  }) as SqlPool;
  await pool.query('SELECT 1');
  return new PostgresVeygritShipStore(pool);
}

export async function createVeygritShipStoreFromEnv(env: NodeJS.ProcessEnv = process.env): Promise<PostgresVeygritShipStore> {
  const url = env.VEYGRIT_SHIP_POSTGRES_URL?.trim() || env.DATABASE_URL?.trim();
  if (!url) throw new Error('VEYGRIT_SHIP_POSTGRES_URL (or DATABASE_URL) is required for Veygrit -ship persistence.');
  return createPostgresVeygritShipStore(url, {
    maxConnections: Number(env.VEYGRIT_SHIP_POSTGRES_POOL_MAX || 10),
    statementTimeoutMs: Number(env.VEYGRIT_SHIP_POSTGRES_STATEMENT_TIMEOUT_MS || 15000),
  });
}
