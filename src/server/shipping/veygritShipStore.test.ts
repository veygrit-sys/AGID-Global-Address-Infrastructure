import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  PostgresVeygritShipStore,
  sha256,
  type SqlClient,
  type SqlPool,
  type SqlResult,
} from './veygritShipStore';

type Handler = (sql: string, values: readonly unknown[]) => SqlResult<any> | Promise<SqlResult<any>>;

class FakePool implements SqlPool, SqlClient {
  readonly calls: Array<{ sql: string; values: readonly unknown[] }> = [];
  released = 0;

  constructor(private readonly handler: Handler) {}

  async query<Row>(sql: string, values: readonly unknown[] = []): Promise<SqlResult<Row>> {
    this.calls.push({ sql, values });
    return this.handler(sql, values) as Promise<SqlResult<Row>>;
  }

  async connect(): Promise<SqlClient> { return this; }
  release(): void { this.released += 1; }
}

test('core PostgreSQL migration defines all eleven required durable entities and safety indexes', async () => {
  const sql = await readFile(new URL('../../../db/veygrit-ship-core.postgres.sql', import.meta.url), 'utf8');
  const tables = [
    'merchant', 'guest_session', 'carrier_connection', 'shipment', 'package', 'rate_quote',
    'label', 'tracking_event', 'webhook_delivery', 'idempotency_record', 'audit_event',
  ];
  for (const table of tables) assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS veygrit_ship_${table}\\b`, 'i'));
  assert.equal((sql.match(/CREATE TABLE IF NOT EXISTS veygrit_ship_/g) ?? []).length, 11);
  assert.match(sql, /veygrit_ship_idempotency_merchant_key_uq/i);
  assert.match(sql, /veygrit_ship_idempotency_guest_key_uq/i);
  assert.match(sql, /veygrit_ship_audit_event_append_only_trg/i);
  assert.match(sql, /credential_secret_ref/i);
  assert.doesNotMatch(sql, /client_secret\s+(text|varchar)/i);
  assert.doesNotMatch(sql, /access_token\s+(text|varchar)/i);
  assert.doesNotMatch(sql, /label_(data|bytes|base64)\s+(text|bytea)/i);
});

test('shipment and package rows commit in one short transaction', async () => {
  const pool = new FakePool((sql) => {
    if (sql.includes('FROM veygrit_ship_guest_session')) return { rows: [{ id: '11' }] };
    if (sql.includes('FROM veygrit_ship_merchant WHERE')) return { rows: [{ id: '10' }] };
    if (sql.includes('INSERT INTO veygrit_ship_shipment')) return { rows: [{ id: '20' }] };
    return { rows: [] };
  });
  const store = new PostgresVeygritShipStore(pool);
  const result = await store.createShipmentWithPackages({
    merchantRef: 'merchant-1', shipmentRef: 'ship-1', carrier: 'ups', adapter: 'ups', productIdCode: '03',
    originCountryCode: 'US', destinationCountryCode: 'US', originAddressRef: 'addr-origin',
    destinationAddressRef: 'addr-destination', packages: [
      { packageRef: 'pkg-1', weightValue: 2.5, weightUnit: 'lb' },
      { packageRef: 'pkg-2', weightValue: 1, weightUnit: 'lb' },
    ],
  });
  assert.deepEqual(result, { shipmentRef: 'ship-1', packageRefs: ['pkg-1', 'pkg-2'] });
  assert.equal(pool.calls[0].sql, 'BEGIN');
  assert.equal(pool.calls.at(-1)?.sql, 'COMMIT');
  assert.equal(pool.calls.filter(call => call.sql.includes('INSERT INTO veygrit_ship_package')).length, 2);
  assert.equal(pool.released, 1);
});

test('shipment transaction rolls back when a package insert fails', async () => {
  let packageCount = 0;
  const pool = new FakePool((sql) => {
    if (sql.includes('FROM veygrit_ship_guest_session')) return { rows: [{ id: '11' }] };
    if (sql.includes('FROM veygrit_ship_merchant WHERE')) return { rows: [{ id: '10' }] };
    if (sql.includes('INSERT INTO veygrit_ship_shipment')) return { rows: [{ id: '20' }] };
    if (sql.includes('INSERT INTO veygrit_ship_package') && ++packageCount === 2) throw new Error('package failed');
    return { rows: [] };
  });
  const store = new PostgresVeygritShipStore(pool);
  await assert.rejects(store.createShipmentWithPackages({
    guestSessionRef: 'guest-1', shipmentRef: 'ship-1', originCountryCode: 'US', destinationCountryCode: 'US',
    originAddressRef: 'origin', destinationAddressRef: 'destination', packages: [
      { packageRef: 'pkg-1', weightValue: 1, weightUnit: 'lb' },
      { packageRef: 'pkg-2', weightValue: 1, weightUnit: 'lb' },
    ],
  }), /package failed/);
  assert.equal(pool.calls.at(-1)?.sql, 'ROLLBACK');
  assert.equal(pool.released, 1);
});

test('guest token and idempotency key are persisted only as hashes', async () => {
  const pool = new FakePool(sql => ({ rows: sql.includes('INSERT INTO veygrit_ship_guest_session') ? [{ session_ref: 'guest-1' }] : [] }));
  const store = new PostgresVeygritShipStore(pool);
  const result = await store.createGuestSession({ sessionRef: 'guest-1', token: 'secret-token', expiresAt: '2030-01-01T00:00:00Z' });
  assert.equal(result.tokenHash, sha256('secret-token'));
  assert.ok(!pool.calls[0].values.includes('secret-token'));
  assert.ok(pool.calls[0].values.includes(sha256('secret-token')));
});

test('carrier connections accept only external secret references and require a Merchant', async () => {
  const pool = new FakePool(sql => ({ rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection') ? [{ connection_ref: 'conn-1' }] : [] }));
  const store = new PostgresVeygritShipStore(pool);
  await assert.rejects(store.upsertCarrierConnection({
    connectionRef: 'conn-raw', merchantRef: 'merchant-1', carrier: 'ups',
    credentialSecretRef: 'credential=value',
  }), /raw carrier credentials are forbidden/);
  assert.equal(pool.calls.length, 0);

  const providerReferenceFixtures = [
    'secretref_ups_merchant_001',
    'arn:aws:secretsmanager:us-east-1:000000000000:secret:veygrit/synthetic/ups-abc123',
    'vault://kv/veygrit/synthetic/ups',
    'https://merchant-vault.vault.azure.net/secrets/ups-token/version001',
    'projects/veygrit-local/secrets/ups-token/versions/1',
  ];
  for (const [index, credentialSecretRef] of providerReferenceFixtures.entries()) {
    await store.upsertCarrierConnection({
      connectionRef: `conn-${index + 1}`, merchantRef: 'merchant-1', carrier: 'ups',
      credentialSecretRef,
    });
    assert.ok(pool.calls.at(-1)?.values.includes('merchant-1'));
    assert.ok(pool.calls.at(-1)?.values.includes(credentialSecretRef));
  }
});

test('Americas direct carrier connections use the same secret-reference boundary', async () => {
  const pool = new FakePool(sql => ({ rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection') ? [{ connection_ref: 'conn-loggi' }] : [] }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-loggi', merchantRef: 'merchant-1', carrier: 'loggi',
    credentialSecretRef: 'secretref_loggi_merchant_001',
  });
  assert.ok(pool.calls.at(-1)?.values.includes('loggi'));

  const coreSql = await readFile(new URL('../../../db/veygrit-ship-core.postgres.sql', import.meta.url), 'utf8');
  const expansionSql = await readFile(new URL('../../../db/veygrit-ship-americas-official-connectors.postgres.sql', import.meta.url), 'utf8');
  assert.match(coreSql, /'amazon_shipping', 'loggi'/);
  assert.match(expansionSql, /amazon-shipping-v2/);
  assert.match(expansionSql, /loggi-v1/);
});

test('European direct carrier connections use the same secret-reference boundary', async () => {
  const pool = new FakePool(sql => ({ rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection') ? [{ connection_ref: 'conn-inpost' }] : [] }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-inpost', merchantRef: 'merchant-1', carrier: 'inpost',
    credentialSecretRef: 'secretref_inpost_merchant_001',
  });
  assert.ok(pool.calls.at(-1)?.values.includes('inpost'));

  const coreSql = await readFile(new URL('../../../db/veygrit-ship-core.postgres.sql', import.meta.url), 'utf8');
  const expansionSql = await readFile(new URL('../../../db/veygrit-ship-europe-official-connectors.postgres.sql', import.meta.url), 'utf8');
  assert.match(coreSql, /'royal_mail', 'inpost'/);
  assert.match(expansionSql, /royal-mail-shipping-v2/);
  assert.match(expansionSql, /inpost-shipping-v2/);
});

test('Asian direct carrier connections use the same secret-reference boundary', async () => {
  const pool = new FakePool(sql => ({ rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection') ? [{ connection_ref: 'conn-delhivery' }] : [] }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-delhivery',
    merchantRef: 'merchant-1',
    carrier: 'delhivery',
    credentialSecretRef: 'secretref_delhivery_merchant_001',
  });
  assert.ok(pool.calls.at(-1)?.values.includes('delhivery'));

  const coreSql = await readFile(new URL('../../../db/veygrit-ship-core.postgres.sql', import.meta.url), 'utf8');
  const expansionSql = await readFile(new URL('../../../db/veygrit-ship-asia-official-connectors.postgres.sql', import.meta.url), 'utf8');
  assert.match(coreSql, /'ninja_van', 'delhivery'/);
  assert.match(expansionSql, /ninja-van-order-v4\.2/);
  assert.match(expansionSql, /delhivery-b2c-v1/);
});

test('African direct carrier connections use the same secret-reference boundary', async () => {
  const pool = new FakePool(sql => ({ rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection') ? [{ connection_ref: 'conn-pargo' }] : [] }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-pargo',
    merchantRef: 'merchant-1',
    carrier: 'pargo',
    credentialSecretRef: 'secretref_pargo_merchant_001',
  });
  assert.ok(pool.calls.at(-1)?.values.includes('pargo'));

  const coreSql = await readFile(new URL('../../../db/veygrit-ship-core.postgres.sql', import.meta.url), 'utf8');
  const expansionSql = await readFile(new URL('../../../db/veygrit-ship-africa-official-connectors.postgres.sql', import.meta.url), 'utf8');
  assert.match(coreSql, /'pargo', 'courier_guy'/);
  assert.match(expansionSql, /pargo-simba-v1/);
  assert.match(expansionSql, /courier-guy-v2/);
});

test('Greater China direct carrier connections use the same secret-reference boundary', async () => {
  const pool = new FakePool(sql => ({ rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection') ? [{ connection_ref: 'conn-sf' }] : [] }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-sf',
    merchantRef: 'merchant-1',
    carrier: 'sf_express',
    credentialSecretRef: 'secretref_sf_express_merchant_001',
  });
  assert.ok(pool.calls.at(-1)?.values.includes('sf_express'));

  const coreSql = await readFile(new URL('../../../db/veygrit-ship-core.postgres.sql', import.meta.url), 'utf8');
  const expansionSql = await readFile(new URL('../../../db/veygrit-ship-greater-china-official-connectors.postgres.sql', import.meta.url), 'utf8');
  assert.match(coreSql, /'sf_express', 'four_px'/);
  assert.match(expansionSql, /sf-express-openapi-v2/);
  assert.match(expansionSql, /four-px-openapi-v1/);
});

test('expanded Americas carrier connections persist only a secret reference', async () => {
  const pool = new FakePool(sql => ({ rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection') ? [{ connection_ref: 'conn-roadie' }] : [] }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-roadie',
    merchantRef: 'merchant-1',
    carrier: 'roadie',
    credentialSecretRef: 'secretref_roadie_merchant_001',
  });
  const last = pool.calls.at(-1);
  assert.ok(last?.values.includes('roadie'));
  assert.ok(last?.values.includes('secretref_roadie_merchant_001'));
  assert.equal(JSON.stringify(last?.values).includes('access_token'), false);

  const migrationSql = await readFile(new URL('../../../db/veygrit-ship-americas-expansion-official-connectors.postgres.sql', import.meta.url), 'utf8');
  for (const carrier of [
    'chilexpress', 'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack',
    'estafeta', 'jadlog', 'total_express', 'roadie',
  ]) assert.match(migrationSql, new RegExp(`'${carrier}'`));
  for (const adapter of [
    'chilexpress-rest-v1', 'coordinadora-clientes-v1', 'oca-epak-v1',
    '99minutos-v3', 'redpack-official-v1', 'estafeta-label-rest-v1',
    'jadlog-embarcador-v2.3', 'total-express-official-v1', 'ups-roadie-v1',
  ]) assert.match(migrationSql, new RegExp(adapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('expanded Europe carrier connections persist only a secret reference', async () => {
  const pool = new FakePool(sql => ({ rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection') ? [{ connection_ref: 'conn-dsv' }] : [] }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-dsv',
    merchantRef: 'merchant-1',
    carrier: 'dsv',
    credentialSecretRef: 'secretref_dsv_merchant_001',
  });
  const last = pool.calls.at(-1);
  assert.ok(last?.values.includes('dsv'));
  assert.ok(last?.values.includes('secretref_dsv_merchant_001'));
  assert.equal(JSON.stringify(last?.values).includes('client_secret'), false);

  const migrationSql = await readFile(new URL('../../../db/veygrit-ship-europe-expansion-official-connectors.postgres.sql', import.meta.url), 'utf8');
  for (const carrier of [
    'gls', 'dpd', 'hermes_de', 'paack', 'mondial_relay', 'packeta', 'dsv', 'geodis',
  ]) assert.match(migrationSql, new RegExp(`'${carrier}'`));
  for (const adapter of [
    'gls-europe-official-v1', 'dpd-europe-official-v1', 'hermes-germany-hsi-v1',
    'paack-public-v3', 'mondial-relay-webservice-v5', 'packeta-soap-v1',
    'dsv-generic-v2', 'geodis-official-v1',
  ]) assert.match(migrationSql, new RegExp(adapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('expanded Asia-Pacific carrier connections persist only a secret reference', async () => {
  const pool = new FakePool(sql => ({ rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection') ? [{ connection_ref: 'conn-lalamove' }] : [] }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-lalamove',
    merchantRef: 'merchant-1',
    carrier: 'lalamove',
    credentialSecretRef: 'secretref_lalamove_merchant_001',
  });
  const last = pool.calls.at(-1);
  assert.ok(last?.values.includes('lalamove'));
  assert.ok(last?.values.includes('secretref_lalamove_merchant_001'));
  assert.equal(JSON.stringify(last?.values).includes('api_secret'), false);

  const migrationSql = await readFile(new URL('../../../db/veygrit-ship-asia-pacific-expansion-official-connectors.postgres.sql', import.meta.url), 'utf8');
  for (const carrier of [
    'lalamove', 'aramex_anz', 'nz_couriers', 'jt_express', 'yamato',
  ]) assert.match(migrationSql, new RegExp(`'${carrier}'`));
  for (const adapter of [
    'lalamove-v3', 'aramex-anz-myfastway-v1', 'nz-couriers-integration-v1',
    'jt-open-platform-v1', 'yamato-b2-cloud-v1',
  ]) assert.match(migrationSql, new RegExp(adapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('expanded African carrier connections persist only a secret reference', async () => {
  const pool = new FakePool(sql => ({ rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection') ? [{ connection_ref: 'conn-collivery' }] : [] }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-collivery',
    merchantRef: 'merchant-1',
    carrier: 'collivery',
    credentialSecretRef: 'secretref_collivery_merchant_001',
  });
  const last = pool.calls.at(-1);
  assert.ok(last?.values.includes('collivery'));
  assert.ok(last?.values.includes('secretref_collivery_merchant_001'));
  assert.equal(JSON.stringify(last?.values).includes('api_token'), false);

  const migrationSql = await readFile(new URL('../../../db/veygrit-ship-africa-expansion-official-connectors.postgres.sql', import.meta.url), 'utf8');
  for (const carrier of ['collivery', 'ram_couriers', 'lilwa_delivery']) {
    assert.match(migrationSql, new RegExp(`'${carrier}'`));
  }
  for (const adapter of ['collivery-v3', 'ram-official-v1', 'lilwa-delivery-v2']) {
    assert.match(migrationSql, new RegExp(adapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('MENA carrier connections persist only a secret reference', async () => {
  const pool = new FakePool(sql => ({ rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection') ? [{ connection_ref: 'conn-smsa' }] : [] }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-smsa',
    merchantRef: 'merchant-1',
    carrier: 'smsa_express',
    credentialSecretRef: 'secretref_smsa_merchant_001',
  });
  const last = pool.calls.at(-1);
  assert.ok(last?.values.includes('smsa_express'));
  assert.ok(last?.values.includes('secretref_smsa_merchant_001'));
  assert.equal(JSON.stringify(last?.values).includes('passKey'), false);

  const migrationSql = await readFile(new URL('../../../db/veygrit-ship-mena-expansion-official-connectors.postgres.sql', import.meta.url), 'utf8');
  for (const carrier of ['aramex_mena', 'smsa_express', 'naqel_express', 'emirates_post', 'bosta', 'mylerz']) {
    assert.match(migrationSql, new RegExp(`'${carrier}'`));
  }
  for (const adapter of [
    'aramex-mena-official-v1', 'smsa-ecommerce-soap-v1', 'naqel-xml-shipping-v9',
    'emirates-post-emx-v1', 'bosta-v2', 'mylerz-official-v1',
  ]) assert.match(migrationSql, new RegExp(adapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('additional private Asia carrier connections persist only a secret reference', async () => {
  const pool = new FakePool(sql => ({
    rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection')
      ? [{ connection_ref: 'conn-gdex' }]
      : [],
  }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-gdex',
    merchantRef: 'merchant-1',
    carrier: 'gdex',
    credentialSecretRef: 'secretref_gdex_merchant_001',
  });
  const last = pool.calls.at(-1);
  assert.ok(last?.values.includes('gdex'));
  assert.ok(last?.values.includes('secretref_gdex_merchant_001'));
  assert.equal(JSON.stringify(last?.values).includes('subscriptionKey'), false);

  const migrationSql = await readFile(
    new URL('../../../db/veygrit-ship-private-asia-expansion-official-connectors.postgres.sql', import.meta.url),
    'utf8',
  );
  for (const carrier of ['blue_dart', 'dtdc', 'gdex', 'jne']) {
    assert.match(migrationSql, new RegExp(`'${carrier}'`));
  }
  for (const adapter of [
    'blue-dart-business-integration-v1',
    'dtdc-enterprise-v1',
    'mygdex-openapi-v1',
    'jne-contract-api-v1',
  ]) {
    assert.match(migrationSql, new RegExp(adapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('additional private Europe carrier connections persist only a secret reference', async () => {
  const pool = new FakePool(sql => ({
    rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection')
      ? [{ connection_ref: 'conn-fan' }]
      : [],
  }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-fan',
    merchantRef: 'merchant-1',
    carrier: 'fan_courier',
    credentialSecretRef: 'secretref_fan_merchant_001',
  });
  const last = pool.calls.at(-1);
  assert.ok(last?.values.includes('fan_courier'));
  assert.ok(last?.values.includes('secretref_fan_merchant_001'));
  assert.equal(JSON.stringify(last?.values).includes('bearerToken'), false);

  const migrationSql = await readFile(
    new URL('../../../db/veygrit-ship-private-europe-expansion-official-connectors.postgres.sql', import.meta.url),
    'utf8',
  );
  for (const carrier of ['yodel', 'fan_courier', 'acs_courier', 'dachser', 'sameday']) {
    assert.match(migrationSql, new RegExp(`'${carrier}'`));
  }
  for (const adapter of [
    'yodel-shipping-orders-v1',
    'fan-courier-api-v2',
    'acs-rest-web-services-v1',
    'dachser-business-integration-v2',
    'sameday-client-api-v2',
  ]) {
    assert.match(migrationSql, new RegExp(adapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('additional Greater China carrier connections persist only a secret reference', async () => {
  const pool = new FakePool(sql => ({
    rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection')
      ? [{ connection_ref: 'conn-zto' }]
      : [],
  }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-zto',
    merchantRef: 'merchant-1',
    carrier: 'zto_express',
    credentialSecretRef: 'secretref_zto_merchant_001',
  });
  const last = pool.calls.at(-1);
  assert.ok(last?.values.includes('zto_express'));
  assert.ok(last?.values.includes('secretref_zto_merchant_001'));
  assert.equal(JSON.stringify(last?.values).includes('appSecret'), false);

  const migrationSql = await readFile(
    new URL('../../../db/veygrit-ship-private-greater-china-expansion-official-connectors.postgres.sql', import.meta.url),
    'utf8',
  );
  for (const carrier of [
    'zto_express',
    'yto_express',
    'sto_express',
    'deppon',
    'jd_logistics',
    'cainiao_express',
  ]) {
    assert.match(migrationSql, new RegExp(`'${carrier}'`));
  }
  for (const adapter of [
    'zto-open-platform-v1',
    'yto-open-platform-v1',
    'sto-open-platform-v1',
    'deppon-open-platform-v1',
    'jd-logistics-open-platform-v1',
    'cainiao-express-open-platform-v1',
  ]) {
    assert.match(migrationSql, new RegExp(adapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('major Europe carrier connections persist only a secret reference', async () => {
  const pool = new FakePool(sql => ({
    rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection')
      ? [{ connection_ref: 'conn-postnl' }]
      : [],
  }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-postnl',
    merchantRef: 'merchant-1',
    carrier: 'postnl',
    credentialSecretRef: 'secretref_postnl_merchant_001',
  });
  const last = pool.calls.at(-1);
  assert.ok(last?.values.includes('postnl'));
  assert.ok(last?.values.includes('secretref_postnl_merchant_001'));
  assert.equal(JSON.stringify(last?.values).includes('apiKey'), false);

  const migrationSql = await readFile(
    new URL('../../../db/veygrit-ship-major-europe-strengthening-official-connectors.postgres.sql', import.meta.url),
    'utf8',
  );
  for (const carrier of [
    'dhl_parcel_de',
    'colissimo',
    'poste_italiane',
    'correos',
    'postnl',
    'bpost',
  ]) {
    assert.match(migrationSql, new RegExp(`'${carrier}'`));
  }
  for (const adapter of [
    'dhl-parcel-de-shipping-v2',
    'colissimo-sls-v3',
    'poste-delivery-business-v1',
    'correos-oauth-api-v1',
    'postnl-shipment-v4',
    'bpost-shipping-manager-v3',
  ]) {
    assert.match(migrationSql, new RegExp(adapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('South America strengthened carrier connections persist only a secret reference', async () => {
  const pool = new FakePool(sql => ({
    rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection')
      ? [{ connection_ref: 'conn-andreani' }]
      : [],
  }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-andreani',
    merchantRef: 'merchant-1',
    carrier: 'andreani',
    credentialSecretRef: 'secretref_andreani_merchant_001',
  });
  const last = pool.calls.at(-1);
  assert.ok(last?.values.includes('andreani'));
  assert.ok(last?.values.includes('secretref_andreani_merchant_001'));
  assert.equal(JSON.stringify(last?.values).includes('password'), false);

  const migrationSql = await readFile(
    new URL('../../../db/veygrit-ship-south-america-strengthening-official-connectors.postgres.sql', import.meta.url),
    'utf8',
  );
  for (const carrier of ['andreani', 'servientrega', 'blue_express']) {
    assert.match(migrationSql, new RegExp(`'${carrier}'`));
  }
  for (const adapter of [
    'andreani-globallpack-v1',
    'servientrega-standard-v1',
    'blue-express-contract-v1',
  ]) {
    assert.match(migrationSql, new RegExp(adapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Southeast Asia strengthened carrier connections persist only a secret reference', async () => {
  const pool = new FakePool(sql => ({
    rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection')
      ? [{ connection_ref: 'conn-ghn' }]
      : [],
  }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-ghn',
    merchantRef: 'merchant-1',
    carrier: 'ghn',
    credentialSecretRef: 'secretref_ghn_merchant_001',
  });
  const last = pool.calls.at(-1);
  assert.ok(last?.values.includes('ghn'));
  assert.ok(last?.values.includes('secretref_ghn_merchant_001'));
  assert.equal(JSON.stringify(last?.values).includes('token'), false);

  const migrationSql = await readFile(
    new URL('../../../db/veygrit-ship-southeast-asia-strengthening-official-connectors.postgres.sql', import.meta.url),
    'utf8',
  );
  for (const carrier of ['ghn', 'ghtk', 'grab_express', 'gosend', 'flash_express']) {
    assert.match(migrationSql, new RegExp(`'${carrier}'`));
  }
  for (const adapter of [
    'ghn-public-api-v2',
    'ghtk-openapi-v1.5',
    'grabexpress-contract-v1',
    'gosend-contract-v1',
    'flash-express-contract-v1',
  ]) {
    assert.match(migrationSql, new RegExp(adapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('South Asia strengthened carrier connections persist only a secret reference', async () => {
  const pool = new FakePool(sql => ({
    rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection')
      ? [{ connection_ref: 'conn-ecourier-bd' }]
      : [],
  }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-ecourier-bd',
    merchantRef: 'merchant-1',
    carrier: 'ecourier_bd',
    credentialSecretRef: 'secretref_ecourier_bd_merchant_001',
  });
  const last = pool.calls.at(-1);
  assert.ok(last?.values.includes('ecourier_bd'));
  assert.ok(last?.values.includes('secretref_ecourier_bd_merchant_001'));
  assert.equal(JSON.stringify(last?.values).includes('apiSecret'), false);

  const migrationSql = await readFile(
    new URL('../../../db/veygrit-ship-south-asia-strengthening-official-connectors.postgres.sql', import.meta.url),
    'utf8',
  );
  for (const carrier of [
    'pathao_courier',
    'ecourier_bd',
    'leopards_courier',
    'domex_lk',
    'nepal_can_move',
  ]) {
    assert.match(migrationSql, new RegExp(`'${carrier}'`));
  }
  for (const adapter of [
    'pathao-courier-v1',
    'ecourier-merchant-v5.4',
    'leopards-merchant-contract-v1',
    'domex-client-contract-v1',
    'nepal-can-move-contract-v1',
  ]) {
    assert.match(migrationSql, new RegExp(adapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Sub-Saharan Africa strengthened carrier connections persist only a secret reference', async () => {
  const pool = new FakePool(sql => ({
    rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection')
      ? [{ connection_ref: 'conn-fez-delivery' }]
      : [],
  }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-fez-delivery',
    merchantRef: 'merchant-1',
    carrier: 'fez_delivery',
    credentialSecretRef: 'secretref_fez_delivery_merchant_001',
  });
  const last = pool.calls.at(-1);
  assert.ok(last?.values.includes('fez_delivery'));
  assert.ok(last?.values.includes('secretref_fez_delivery_merchant_001'));
  assert.equal(JSON.stringify(last?.values).includes('secretKey'), false);

  const migrationSql = await readFile(
    new URL('../../../db/veygrit-ship-subsaharan-africa-strengthening-official-connectors.postgres.sql', import.meta.url),
    'utf8',
  );
  for (const carrier of [
    'fez_delivery',
    'haulstow',
    'kwik_delivery',
    'gigl',
    'dodo_tanzania',
  ]) {
    assert.match(migrationSql, new RegExp(`'${carrier}'`));
  }
  for (const adapter of [
    'fez-business-api-v1',
    'haulstow-partner-shipping-v1',
    'kwik-business-contract-v1',
    'gigl-enterprise-contract-v1',
    'dodo-tanzania-contract-v1',
  ]) {
    assert.match(migrationSql, new RegExp(adapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Medium-country Europe carrier connections persist only a secret reference', async () => {
  const pool = new FakePool(sql => ({
    rows: sql.includes('INSERT INTO veygrit_ship_carrier_connection')
      ? [{ connection_ref: 'conn-postnord' }]
      : [],
  }));
  const store = new PostgresVeygritShipStore(pool);
  await store.upsertCarrierConnection({
    connectionRef: 'conn-postnord',
    merchantRef: 'merchant-1',
    carrier: 'postnord',
    credentialSecretRef: 'secretref_postnord_merchant_001',
  });
  const last = pool.calls.at(-1);
  assert.ok(last?.values.includes('postnord'));
  assert.ok(last?.values.includes('secretref_postnord_merchant_001'));
  assert.equal(JSON.stringify(last?.values).includes('accessToken'), false);

  const migrationSql = await readFile(
    new URL('../../../db/veygrit-ship-medium-europe-strengthening-official-connectors.postgres.sql', import.meta.url),
    'utf8',
  );
  for (const carrier of [
    'postnord',
    'swiss_post',
    'austrian_post',
    'ppl_cz',
    'omniva',
    'an_post',
    'ctt_portugal',
  ]) {
    assert.match(migrationSql, new RegExp(`'${carrier}'`));
  }
  for (const adapter of [
    'postnord-booking-contract-v1',
    'swiss-post-digital-commerce-v1',
    'austrian-post-contract-v1',
    'ppl-cpl-api-v1',
    'omniva-omx-v1',
    'an-post-ecommhub-v2.7',
    'ctt-expresso-contract-v1',
  ]) {
    assert.match(migrationSql, new RegExp(adapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('live shipment creation requires an account and active Carrier Connection', async () => {
  const guestPool = new FakePool(sql => ({ rows: sql.includes('FROM veygrit_ship_guest_session') ? [{ id: '11' }] : [] }));
  const guestStore = new PostgresVeygritShipStore(guestPool);
  await assert.rejects(guestStore.createShipmentWithPackages({
    guestSessionRef: 'guest-1', shipmentRef: 'live-guest', mode: 'live',
    originCountryCode: 'US', destinationCountryCode: 'US', originAddressRef: 'origin', destinationAddressRef: 'destination',
    packages: [{ packageRef: 'pkg-live-guest', weightValue: 1, weightUnit: 'lb' }],
  }), /Merchant account is required/);
  assert.equal(guestPool.calls.some(call => call.sql.includes('INSERT INTO veygrit_ship_shipment')), false);

  const merchantPool = new FakePool(sql => ({ rows: sql.includes('FROM veygrit_ship_merchant WHERE') ? [{ id: '10' }] : [] }));
  const merchantStore = new PostgresVeygritShipStore(merchantPool);
  await assert.rejects(merchantStore.createShipmentWithPackages({
    merchantRef: 'merchant-1', shipmentRef: 'live-no-connection', mode: 'live',
    originCountryCode: 'US', destinationCountryCode: 'US', originAddressRef: 'origin', destinationAddressRef: 'destination',
    packages: [{ packageRef: 'pkg-live-merchant', weightValue: 1, weightUnit: 'lb' }],
  }), /active Merchant carrier connection is required/);
  assert.equal(merchantPool.calls.some(call => call.sql.includes('INSERT INTO veygrit_ship_shipment')), false);
});

test('completed idempotent request is replayed and mismatched body is rejected', async () => {
  const requestHash = sha256('{"shipment":1}');
  const pool = new FakePool((sql) => {
    if (sql.includes('FROM veygrit_ship_merchant WHERE')) return { rows: [{ id: '10' }] };
    if (sql.includes('INSERT INTO veygrit_ship_idempotency_record')) return { rows: [] };
    if (sql.includes('SELECT * FROM veygrit_ship_idempotency_record')) return { rows: [{
      id: '30', idempotency_ref: 'idem-1', request_hash: requestHash, state: 'completed', response_status: 201,
      response_body_ref: 'responses/1.json', response_body_sha256: sha256('response'), lease_expires_at: '2020-01-01T00:00:00Z',
    }] };
    return { rows: [] };
  });
  const store = new PostgresVeygritShipStore(pool);
  const replay = await store.reserveIdempotency({
    merchantRef: 'merchant-1', idempotencyRef: 'idem-new', operation: 'shipment.create', idempotencyKey: 'browser-key',
    requestHash, leaseExpiresAt: '2030-01-01T00:01:00Z', expiresAt: '2030-01-02T00:00:00Z',
  });
  assert.deepEqual(replay, { outcome: 'replay', idempotencyRef: 'idem-1', state: 'completed', responseStatus: 201,
    responseBodyRef: 'responses/1.json', responseBodySha256: sha256('response') });
  const conflict = await store.reserveIdempotency({
    merchantRef: 'merchant-1', idempotencyRef: 'idem-new-2', operation: 'shipment.create', idempotencyKey: 'browser-key',
    requestHash: sha256('{"shipment":2}'), leaseExpiresAt: '2030-01-01T00:01:00Z', expiresAt: '2030-01-02T00:00:00Z',
  });
  assert.deepEqual(conflict, { outcome: 'conflict', idempotencyRef: 'idem-1' });
  const insertCall = pool.calls.find(call => call.sql.includes('INSERT INTO veygrit_ship_idempotency_record'));
  assert.ok(insertCall);
  assert.ok(!insertCall.values.includes('browser-key'));
  assert.ok(insertCall.values.includes(sha256('browser-key')));
});

test('webhook claims use a bounded atomic SKIP LOCKED update', async () => {
  const pool = new FakePool(() => ({ rows: [{ delivery_ref: 'delivery-1' }] }));
  const result = await new PostgresVeygritShipStore(pool).claimWebhookDeliveries(999, 9999);
  assert.equal(result.length, 1);
  assert.match(pool.calls[0].sql, /FOR UPDATE SKIP LOCKED/i);
  assert.match(pool.calls[0].sql, /status='delivering' AND lease_expires_at<=now\(\)/i);
  assert.match(pool.calls[0].sql, /UPDATE veygrit_ship_webhook_delivery/i);
  assert.deepEqual(pool.calls[0].values, [100, 900]);
});

test('rate selection locks quotes in stable order and replaces a previous selection atomically', async () => {
  const pool = new FakePool(sql => {
    if (sql.includes('SELECT q.id, q.quote_ref')) return { rows: [
      { id: '1', quote_ref: 'quote-old', status: 'selected', available: true },
      { id: '2', quote_ref: 'quote-new', status: 'offered', available: true },
    ] };
    return { rows: [] };
  });
  await new PostgresVeygritShipStore(pool).selectRateQuote('quote-new', 'ship-1');
  const lock = pool.calls.find(call => call.sql.includes('SELECT q.id, q.quote_ref'));
  const update = pool.calls.find(call => call.sql.includes("SET status=CASE"));
  assert.match(lock?.sql ?? '', /ORDER BY q\.id FOR UPDATE/i);
  assert.deepEqual(update?.values, ['2', 'ship-1']);
  assert.equal(pool.calls.at(-1)?.sql, 'COMMIT');
});

test('webhook completion records success and retry requires a schedule', async () => {
  const pool = new FakePool(() => ({ rows: [{ status: 'succeeded' }] }));
  const store = new PostgresVeygritShipStore(pool);
  await assert.rejects(store.finishWebhookDelivery({ deliveryRef: 'delivery-1', outcome: 'retry' }), /nextAttemptAt/);
  assert.equal(await store.finishWebhookDelivery({ deliveryRef: 'delivery-1', outcome: 'succeeded', responseStatus: 204 }), 'succeeded');
  assert.match(pool.calls[0].sql, /WHERE delivery_ref=\$1 AND status='delivering'/i);
  assert.deepEqual(pool.calls[0].values.slice(0, 4), ['delivery-1', 'succeeded', null, 204]);
});

test('audit writes are inserts and store exposes no audit mutation method', async () => {
  const pool = new FakePool(() => ({ rows: [] }));
  const store = new PostgresVeygritShipStore(pool);
  await store.appendAuditEvent({
    eventRef: 'audit-1', actorType: 'system', action: 'shipment.created', aggregateType: 'shipment',
    aggregateRef: 'ship-1', outcome: 'success', details: { carrier: 'ups' },
  });
  assert.match(pool.calls[0].sql, /^INSERT INTO veygrit_ship_audit_event/);
  assert.equal('updateAuditEvent' in store, false);
  assert.equal('deleteAuditEvent' in store, false);
});
