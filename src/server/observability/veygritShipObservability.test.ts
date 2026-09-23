import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  resolveVeygritShipRequestId,
  VeygritShipMetrics,
  VeygritShipStructuredLogger,
} from './veygritShipObservability';

test('accepts only bounded safe request IDs and generates a UUID otherwise', () => {
  assert.equal(resolveVeygritShipRequestId({ 'x-request-id': 'req_release_1234' }), 'req_release_1234');
  const generated = resolveVeygritShipRequestId({ 'x-request-id': '../../bad?token=secret' });
  assert.match(generated, /^[0-9a-f-]{36}$/);
});

test('structured logs are JSON and redact fields that could contain PII or secrets', () => {
  const lines: string[] = [];
  const logger = new VeygritShipStructuredLogger(line => lines.push(line));
  logger.write({
    level: 'error', event: 'carrier.failed', requestId: 'req_release_1234', carrier: 'ups',
    operation: 'label', outcome: 'failure', errorCode: 'Bearer should-never-appear-in-a-log',
  });
  const record = JSON.parse(lines[0]);
  assert.equal(record.service, 'veygrit-ship');
  assert.equal(record.requestId, 'req_release_1234');
  assert.equal(record.errorCode, '[REDACTED]');
  assert.doesNotMatch(lines[0], /should-never-appear/);
});

test('metrics expose UPS/DHL success, rate latency, label failures, and webhook delay without high-cardinality IDs', async () => {
  const metrics = new VeygritShipMetrics();
  await metrics.observeCarrier('ups', 'rate', async () => ({ ok: true }));
  await assert.rejects(metrics.observeCarrier('dhl', 'label', async () => { throw new Error('failed'); }));
  metrics.recordWebhookDelay('dhl', 1_250);
  metrics.recordHttpRequest('GET', '/api/internal/carriers/ups/tracking/:inquiryNumber', 200);
  const output = metrics.renderPrometheus();
  assert.match(output, /veygrit_ship_observability_up 1/);
  assert.match(output, /veygrit_ship_carrier_requests_total\{carrier="ups",operation="rate",outcome="success"\} 1/);
  assert.match(output, /veygrit_ship_label_creation_total\{carrier="dhl",operation="label",outcome="failure"\} 1/);
  assert.match(output, /veygrit_ship_rate_duration_seconds_count\{carrier="ups"\} 1/);
  assert.match(output, /veygrit_ship_webhook_delay_seconds_count\{carrier="dhl"\} 1/);
  assert.doesNotMatch(output, /(merchant|shipment|request_id|email|address)=/i);
});

test('Prometheus rules define every limited-release alert', async () => {
  const rules = await readFile('config/observability/veygrit-ship-alerts.yml', 'utf8');
  for (const alert of [
    'VeygritShipCarrierSuccessRateLow', 'VeygritShipRateLatencyHigh',
    'VeygritShipLabelCreationFailureRateHigh', 'VeygritShipWebhookDelayHigh',
    'VeygritShipMetricsMissing',
  ]) assert.match(rules, new RegExp(`alert: ${alert}`));
});
