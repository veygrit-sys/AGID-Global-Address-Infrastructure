import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createAndreaniGlobAllPackConnector,
  createBlueExpressConnector,
  createChilexpressConnector,
  createCoordinadoraConnector,
  createEstafetaConnector,
  createJadlogConnector,
  createNinetyNineMinutosConnector,
  createOcaConnector,
  createRedpackConnector,
  createRoadieConnector,
  createServientregaConnector,
  createTotalExpressConnector,
  ExpandedAmericasConnectorError,
} from './expandedAmericasConnector';

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { 'content-type': 'application/json' },
});

test('Chilexpress uses its official sandbox rating URL and subscription header', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = createChilexpressConnector({
    environment: 'sandbox',
    subscriptionKey: 'synthetic-subscription-key',
    routes: {
      address_validation: { method: 'POST', path: '/merchant-issued/georeference', safeToRetry: true },
      shipment: { method: 'POST', path: '/merchant-issued/transport-orders', safeToRetry: false },
      label: { method: 'POST', path: '/merchant-issued/labels', safeToRetry: true },
      tracking: { method: 'POST', path: '/merchant-issued/tracking', safeToRetry: true },
    },
  }, {
    requestId: () => 'chilexpress-request',
    fetch: async (url, init) => { calls.push({ url: String(url), init }); return json({ rates: [] }); },
  });

  const result = await connector.execute('rate', { originCountyCode: 'STGO', destinationCountyCode: 'VALP' });
  assert.equal(result.carrier, 'chilexpress');
  assert.equal(calls[0].url, 'https://testservices.wschilexpress.com/rating/api/v1.0/rates/courier');
  assert.equal((calls[0].init?.headers as Record<string, string>)['Ocp-Apim-Subscription-Key'], 'synthetic-subscription-key');
});

test('Coordinadora obtains and caches OAuth before guide and tracking calls', async () => {
  const urls: string[] = [];
  const connector = createCoordinadoraConnector({
    environment: 'sandbox',
    clientId: 'synthetic-client',
    clientSecret: 'synthetic-secret',
  }, {
    now: () => 1_000,
    requestId: () => `coordinadora-${urls.length}`,
    fetch: async (url) => {
      urls.push(String(url));
      if (String(url).includes('/oauth/token')) return json({ access_token: 'synthetic-token', expires_in: 3600 });
      return json({ codigoRemision: 'synthetic-remission' }, 201);
    },
  });

  await connector.execute('shipment', { reference: 'synthetic-order' });
  await connector.execute('tracking', { codigoRemision: 'synthetic-remission' });
  assert.deepEqual(urls, [
    'https://api-test.coordinadora.tech/oauth/token',
    'https://clientes-integraciones-services-test.coordinadora.com/clientes/guia',
    'https://clientes-integraciones-services-test.coordinadora.com/clientes/tracking',
  ]);
});

test('OCA uses official ePak form operations for rates, returns, labels, void and tracking', async () => {
  const calls: Array<{ url: string; body: string }> = [];
  const connector = createOcaConnector({
    environment: 'sandbox',
    username: 'synthetic-user',
    password: 'synthetic-password',
  }, {
    requestId: () => `oca-${calls.length}`,
    fetch: async (url, init) => {
      calls.push({ url: String(url), body: String(init?.body ?? '') });
      return new Response('<xml>ok</xml>', { status: 200, headers: { 'content-type': 'text/xml' } });
    },
  });

  await connector.execute('rate', { pesoTotal: 1 });
  await connector.execute('return', { logisticaInversa: true, xml_Datos: '<xml />' });
  await connector.execute('label', { idOrdenRetiro: 'synthetic-order', labelFormat: 'zpl' });
  await connector.execute('void', { numeroOrden: 'synthetic-order' });
  await connector.execute('tracking', { numeroEnvio: 'synthetic-shipment' });
  assert.deepEqual(calls.map(call => call.url.split('/').at(-1)), [
    'Tarifar_Envio_Corporativo',
    'IngresoORMultiplesRetiros',
    'ObtenerEtiquetasZPL',
    'AnularOrdenGenerada',
    'GetEnvioEstadoActual',
  ]);
  assert.match(calls[0].body, /usr=synthetic-user/);
  assert.match(calls[0].body, /psw=synthetic-password/);
});

test('99minutos maps country-aware V3 rates, orders, guides, tracking and cancellation', async () => {
  const calls: Array<{ url: string; method?: string }> = [];
  const connector = createNinetyNineMinutosConnector({
    environment: 'sandbox',
    clientId: 'synthetic-client',
    clientSecret: 'synthetic-secret',
  }, {
    requestId: () => `99m-${calls.length}`,
    fetch: async (url, init) => {
      calls.push({ url: String(url), method: init?.method });
      return String(url).endsWith('/oauth/token')
        ? json({ access_token: 'synthetic-token', expires_in: 3600 })
        : json({ ok: true });
    },
  });

  await connector.execute('rate', { country: 'MX', service: 'same_day' });
  await connector.execute('shipment', { country: 'CO', service: 'next_day' });
  await connector.execute('label', { shipment_ids: ['synthetic'] });
  await connector.execute('tracking', { identifier: 'synthetic' });
  await connector.execute('void', { shipmentId: 'synthetic', reason: 'merchant_cancelled' });
  assert.deepEqual(calls.slice(1).map(call => call.url), [
    'https://sandbox.99minutos.com/api/v3/shipping/rates',
    'https://sandbox.99minutos.com/api/v3/orders',
    'https://sandbox.99minutos.com/api/v3/documents/guides',
    'https://sandbox.99minutos.com/api/v3/shipments/tracking?identifier=synthetic',
    'https://sandbox.99minutos.com/api/v3/shipments/synthetic',
  ]);
  assert.equal(calls.at(-1)?.method, 'DELETE');
});

test('contract-issued endpoints enable Redpack, Estafeta and Total Express without guessed URLs', async () => {
  const urls: string[] = [];
  const dependencies = {
    requestId: () => `contract-${urls.length}`,
    fetch: async (url: string | URL | Request) => {
      urls.push(String(url));
      return String(url).includes('/oauth/token')
        ? json({ access_token: 'synthetic-token', expires_in: 3600 })
        : json({ ok: true });
    },
  };
  const common = {
    environment: 'sandbox' as const,
    sandboxBaseUrl: 'https://sandbox.carrier.example',
    productionBaseUrl: 'https://api.carrier.example',
    accessToken: 'synthetic-access-token',
  };

  await createRedpackConnector({
    ...common,
    routes: {
      shipment: { method: 'POST', path: '/official/waybills', safeToRetry: false },
      tracking: { method: 'GET', path: '/official/tracking/{shipmentId}', safeToRetry: true },
    },
  }, dependencies).execute('shipment', { insuredValue: 100 });
  await createTotalExpressConnector({
    ...common,
    routes: {
      rate: { method: 'POST', path: '/official/rates', safeToRetry: true },
      pickup: { method: 'POST', path: '/official/pickups', safeToRetry: false },
      tracking: { method: 'GET', path: '/official/tracking/{shipmentId}', safeToRetry: true },
      label: { method: 'GET', path: '/official/labels/{shipmentId}', safeToRetry: true },
      shipment: { method: 'POST', path: '/official/orders', safeToRetry: false },
    },
  }, dependencies).execute('pickup', { orderIds: ['synthetic'] });
  await createEstafetaConnector({
    environment: 'sandbox',
    clientId: 'synthetic-client',
    clientSecret: 'synthetic-secret',
    sandboxBaseUrl: 'https://apiqa.estafeta.example',
    productionBaseUrl: 'https://api.estafeta.example',
    sandboxTokenUrl: 'https://apiqa.estafeta.example/oauth/token',
    productionTokenUrl: 'https://api.estafeta.example/oauth/token',
    routes: {
      label: { method: 'POST', path: '/official/labels', safeToRetry: false },
      tracking: { method: 'POST', path: '/official/tracking', safeToRetry: true },
    },
  }, dependencies).execute('label', { serviceType: 'synthetic' });

  assert.deepEqual(urls, [
    'https://sandbox.carrier.example/official/waybills',
    'https://sandbox.carrier.example/official/pickups',
    'https://apiqa.estafeta.example/oauth/token',
    'https://apiqa.estafeta.example/official/labels',
  ]);
});

test('Jadlog and Roadie use official operation paths and never replay an unknown shipment write', async () => {
  const urls: string[] = [];
  const roadie = createRoadieConnector({
    environment: 'sandbox',
    sandboxBaseUrl: 'https://sandbox.roadie.example',
    productionBaseUrl: 'https://api.roadie.example',
    accessToken: 'synthetic-roadie-token',
    routes: {},
  }, {
    requestId: () => 'roadie-write',
    fetch: async () => { throw new Error('network disconnected'); },
  });
  await assert.rejects(
    roadie.execute('shipment', { idempotency_key: 'synthetic-idempotency' }),
    (error: unknown) => error instanceof ExpandedAmericasConnectorError
      && error.common.outcomeUnknown
      && error.common.operation === 'shipment',
  );

  const jadlog = createJadlogConnector({
    environment: 'production',
    sandboxBaseUrl: 'https://sandbox.jadlog.example',
    accessToken: 'synthetic-jadlog-token',
    routes: {},
  }, {
    requestId: () => `jadlog-${urls.length}`,
    fetch: async url => { urls.push(String(url)); return json({ frete: [] }); },
  });
  await jadlog.execute('rate', { frete: [{ cepori: '00000000', cepdes: '00000000' }] });
  assert.deepEqual(urls, ['https://www.jadlog.com.br/embarcador/api/frete/valor']);
});

test('safe reads retry once on 429 and honor the same request route', async () => {
  let calls = 0;
  const connector = createRoadieConnector({
    environment: 'sandbox',
    sandboxBaseUrl: 'https://sandbox.roadie.example',
    productionBaseUrl: 'https://api.roadie.example',
    accessToken: 'synthetic-roadie-token',
    routes: {},
    maxSafeRetries: 1,
  }, {
    sleep: async () => undefined,
    requestId: () => 'roadie-tracking',
    fetch: async () => {
      calls += 1;
      return calls === 1 ? json({ message: 'slow down' }, 429) : json({ status: 'scheduled' });
    },
  });
  const result = await connector.execute('tracking', { shipmentId: 'synthetic-shipment' });
  assert.equal(result.operation, 'tracking');
  assert.equal(calls, 2);
});

test('Andreani GlobAllPack uses Basic login, cached 24-hour token and official QA routes', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = createAndreaniGlobAllPackConnector({
    environment: 'sandbox',
    username: 'synthetic-user',
    password: 'synthetic-password',
    labelFormat: 'zpl',
  }, {
    now: () => 1_000,
    requestId: () => `andreani-${calls.length}`,
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/login')) return json({ token: 'synthetic-token' });
      if (String(url).includes('/Etiqueta/')) {
        return new Response(Uint8Array.from([0x5e, 0x58, 0x41]), {
          status: 200,
          headers: { 'content-type': 'application/zpl' },
        });
      }
      return json({ ok: true });
    },
  });

  await connector.execute('shipment', { IdPedido: 'synthetic-order' });
  const label = await connector.execute('label', { numeroEnvio: 'synthetic-shipment' });
  await connector.execute('tracking', { numeroEnvio: 'synthetic-shipment', idioma: 'es' });

  assert.deepEqual(calls.map(call => call.url), [
    'https://apisqa.andreani.com/login',
    'https://apisqa.andreanigloballpack.com/altapreenvio-globallpack/api/v1/ordenes-de-envio',
    'https://apisqa.andreanigloballpack.com/obtener-etiquetas/api/v1/Etiqueta/synthetic-shipment',
    'https://apisqa.andreanigloballpack.com/trazabilidad-globallpack/api/v1/Envios/synthetic-shipment/trazas?idioma=es',
  ]);
  assert.equal(calls[0].init?.method, 'GET');
  assert.match(new Headers(calls[0].init?.headers).get('authorization') ?? '', /^Basic /);
  assert.equal(new Headers(calls[1].init?.headers).get('x-authorization-token'), 'synthetic-token');
  assert.ok(label.data instanceof Uint8Array);
});

test('Servientrega and Blue Express accept only contract-issued HTTPS hosts and routes', async () => {
  const calls: string[] = [];
  const common = {
    environment: 'sandbox' as const,
    sandboxBaseUrl: 'https://contract.sandbox.example',
    productionBaseUrl: 'https://contract.production.example',
    auth: { type: 'bearer' as const, token: 'synthetic-token' },
  };
  const dependencies = {
    fetch: async (url: string | URL | Request) => {
      calls.push(String(url));
      return json({ ok: true });
    },
  };

  await createServientregaConnector({
    ...common,
    routes: {
      shipment: { method: 'POST', path: '/merchant/guias', safeToRetry: false },
    },
  }, dependencies).execute('shipment', { reference: 'synthetic' });
  await createBlueExpressConnector({
    ...common,
    routes: {
      pickup_point: { method: 'GET', path: '/merchant/puntos', queryPayload: true, safeToRetry: true },
    },
  }, dependencies).execute('pickup_point', { region: 'CL-RM' });

  assert.deepEqual(calls, [
    'https://contract.sandbox.example/merchant/guias',
    'https://contract.sandbox.example/merchant/puntos?region=CL-RM',
  ]);
  assert.throws(() => createBlueExpressConnector({
    ...common,
    sandboxBaseUrl: 'http://unsafe.example',
    routes: {},
  }), /must use HTTPS/);
});
