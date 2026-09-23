import assert from 'node:assert/strict';
import { test } from 'node:test';
import { probeAeReference } from './inspect-postal-context-ae-sources.mjs';

const html = { id: 'synthetic-reference', url: 'https://www.dm.gov.ae/example', mime: 'text/html', markers: ['Synthetic reference'] };
test('AE reference probe hashes documents without treating them as source records', async () => {
  const result = await probeAeReference(html, async () => new Response('<p>Synthetic reference</p>', { headers: { 'content-type': 'text/html' } }));
  assert.equal(result.status, 'reference-verified-not-data');
  assert.equal(result.sourceDataRecords, 0);
  assert.match(result.sourceDocumentDigest, /^sha256:[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(result).includes('<p>'));
});
test('a PDF URL returning HTML is not a valid document, even with HTTP 200', async () => {
  const result = await probeAeReference({ ...html, mime: 'application/pdf', markers: [] }, async () => new Response('<h1>Home</h1>', { headers: { 'content-type': 'text/html' } }));
  assert.equal(result.status, 'unexpected-content'); assert.equal(result.sourceDocumentDigest, null);
});
test('missing document markers and forbidden redirects fail closed', async () => {
  const missing = await probeAeReference(html, async () => new Response('<h1>Home</h1>', { headers: { 'content-type': 'text/html' } }));
  assert.equal(missing.contentVerified, false); assert.deepEqual(missing.missingMarkers, html.markers);
  await assert.rejects(() => probeAeReference(html, async () => new Response(null, { status: 302, headers: { location: 'https://unapproved.invalid/records' } })), /unapproved-reference-host/);
  await assert.rejects(() => probeAeReference({ ...html, url: 'http://www.dm.gov.ae/example' }), /unapproved-reference-host/);
});
test('HTTP errors are recorded without accepting their bodies as evidence', async () => {
  const result = await probeAeReference(html, async () => new Response('restricted', { status: 403 }));
  assert.equal(result.status, 'http-error'); assert.equal(result.contentVerified, false);
  assert.equal(result.sourceDocumentDigest, undefined);
});
test('partial HTTP responses are not complete source documents', async () => {
  const result = await probeAeReference(html, async () => new Response('<p>Synthetic reference</p>', { status: 206, headers: { 'content-type': 'text/html' } }));
  assert.equal(result.status, 'http-error');
  assert.equal(result.sourceDocumentDigest, undefined);
});
test('AE probe caps advertised and streaming response sizes', async () => {
  await assert.rejects(() => probeAeReference(html, async () => new Response('x', { headers: { 'content-length': String(5 * 1024 * 1024) } })), /reference-byte-limit/);
  await assert.rejects(() => probeAeReference(html, async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(4 * 1024 * 1024 + 1)); controller.close(); } }))), /reference-byte-limit/);
});
