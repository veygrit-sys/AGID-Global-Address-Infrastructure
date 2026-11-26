import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyWorldLocalitiesAddress1 as verify } from './worldLocalitiesAddress1';

const config = { endpoint: 'https://localities.example/v1/address', token: 'internal', callerToken: 'wallet' };
const bearer = 'Bearer wallet';
const body = { countryCode: 'US', address: { address_line1: '123 Main St', address_line2: 'Apt 4B',
  city: 'Sample', state: 'DC', postcode: '00001', recipient: 'Must not leave', phone: 'Must not leave' },
  referenceRecords: [{ source: 'client' }], address1_decision: { status: 'verified' } };
const fields = ['road', 'house_number', 'city', 'state', 'postcode'];
const decision = { status: 'partial', level: 'premise', candidate_count: 1, verified_fields: fields, unverified_fields: ['unit'] };
const source = { country: 'US', deliverability_verified: false, matched_scope: 'published_address_point',
  blocking_conflict: false, evidence: [{ source_id: 'official-fixture', record_id: 'R1', snapshot: 'release-1' }] };
const response = (value: unknown) => Response.json({ schema_version: 1, operation: 'validate', result: value });

test('authenticated server validates only address components and returns the observed fields and source', async () => {
  const result = await verify(body, 'US', true, bearer, async (url, init) => {
    assert.equal(String(url), config.endpoint);
    assert.equal(init?.redirect, 'error');
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer internal');
    const request = JSON.parse(String(init?.body));
    assert.deepEqual(request, { operation: 'validate', country: 'US', components: {
      city: 'Sample', state: 'DC', postcode: '00001', road: 'Main St', house_number: '123', unit: '4B',
    } });
    return response({ ...source, address1_decision: decision });
  }, config);
  assert.equal(result.address1_source, 'world-localities');
  assert.deepEqual(result.address1_decision, decision);
  assert.equal(result.address1_evidence[0].source_id, 'official-fixture');
});

test('public, mismatched country, unconfigured and unavailable lookups never accept client-supplied proof', async () => {
  const neverFetch = async () => { throw Error('unexpected network call'); };
  assert.equal((await verify(body, 'US', true, undefined, neverFetch, config)).address1_source, 'not-applicable');
  assert.equal((await verify(body, 'US', true, 'Bearer wrong', neverFetch, config)).address1_source, 'not-applicable');
  assert.equal((await verify(body, 'US', false, bearer, neverFetch, config)).address1_decision.status, 'conflict');
  const empty = { endpoint: undefined, token: undefined, callerToken: undefined };
  assert.equal((await verify(body, 'US', true, bearer, neverFetch, empty)).address1_source, 'not-configured');
  for (const reply of [
    { ...source, address1_decision: decision, country: 'CA' },
    { ...source, address1_decision: decision, evidence: [] },
    { ...source, address1_decision: decision, matched_scope: 'postal_locality' },
    { ...source, address1_decision: { ...decision, status: 'verified' } },
    { ...source, address1_decision: { ...decision, candidate_count: 2 } },
  ]) {
    const result = await verify(body, 'US', true, bearer, async () => response(reply), config);
    assert.equal(result.address1_source, 'unavailable');
    assert.deepEqual(result.address1_decision.verified_fields, []);
  }
  const offline = await verify(body, 'US', true, bearer, neverFetch, config);
  assert.equal(offline.address1_source, 'unavailable');
  assert.equal(offline.address1_decision.status, 'unverified');
});

test('Japanese block, Chinese original line and unparsed facility names reach the national adapter', async () => {
  const fixtures = [
    { country: 'JP', address: { address_line1: '永田町1丁目2番3号' }, fields: { neighbourhood: '永田町', house_number: '1丁目2番3号' } },
    { country: 'CN', address: { address_line1: '中山路123号' }, fields: { address_line1: '中山路123号' } },
    { country: 'CA', address: { address_line1: "50 O'Connor Street", address_line2: 'Australian High Commission', city: 'Ottawa' },
      fields: { city: 'Ottawa', road: "O'Connor Street", house_number: '50', address_line2: 'Australian High Commission' } },
  ];
  for (const row of fixtures) {
    let sent;
    await verify(row, row.country, true, bearer, async (_url, init) => {
      sent = JSON.parse(String(init?.body)).components;
      return new Response('', { status: 503 });
    }, config);
    assert.deepEqual(sent, row.fields);
  }
});

test('G-NAF evidence is reported as physical-only and cannot become full delivery-line verification', async () => {
  const request = { address: { road: 'Demo Crescent', house_number: '2', city: 'Sample' } };
  const decision = { status: 'partial', level: 'premise', candidate_count: 1,
    verified_fields: ['road', 'house_number', 'city'], unverified_fields: [] };
  const source = { country: 'AU', deliverability_verified: false, blocking_conflict: false,
    matched_scope: 'physical_address_context', issues: ['gnaf_independent_mailing_source_required'],
    evidence: [{ source_id: 'fixture-gnaf', record_id: 'fixture-1', use: 'physical_context_only' }] };
  const lookup = async (result: object) => verify(request, 'AU', true, bearer, async () => response(result), config);
  const partial = await lookup({ ...source, address1_decision: decision });
  assert.equal(partial.address1_decision.level, 'premise');
  assert.equal(partial.address1_evidence[0].use, 'physical_context_only');
  assert.deepEqual(partial.address1_issues, ['gnaf_independent_mailing_source_required']);
  for (const invalid of [{ ...source, address1_decision: { ...decision, status: 'verified' } },
    { ...source, address1_decision: decision, evidence: [] }]) {
    assert.equal((await lookup(invalid)).address1_source, 'unavailable');
  }
});

test('a unit explicitly matched inside a complete LINZ primary line retains its scope and original field list', async () => {
  const request = { address: { address_line1: '1/57 Kana Street', city: 'Mataura', postcode: '9712' } };
  const result = await verify(request, 'NZ', true, bearer, async () => response({ ...source,
    country: 'NZ', address1_decision: {
      status: 'partial', level: 'unit', candidate_count: 1,
      verified_fields: ['address_line1', 'city'], unverified_fields: ['postcode'],
    },
  }), config);
  assert.equal(result.address1_decision.level, 'unit');
  assert.deepEqual(result.address1_decision.verified_fields, ['address_line1', 'city']);
});

test('distinct Chinese room and unit fields and local address discriminators are kept for comparison', async () => {
  let sent;
  const request = { address: { address_line1: '樣例路9号', unit: '2单元', room: '501室',
    villageOrCommunity: '涉及社区', poBox: '12', betweenStreets: 'A y B' } };
  await verify(request, 'CN', true, bearer, async (_url, init) => {
    sent = JSON.parse(String(init?.body)).components;
    return new Response('', { status: 503 });
  }, config);
  assert.deepEqual(sent, { address_line1: '樣例路9号', unit: '2单元', cn_room: '501室',
    village_or_community: '涉及社区', po_box: '12', between_streets: 'A y B' });
});
