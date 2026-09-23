import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESS_DNS_RECORD_VERSION,
  addressDnsRecordToZoneLine,
  collectAddressDnsPrivateMaterialErrors,
  createAddressDnsRecord,
  createAddressDnsZoneSnapshot,
  validateAddressDnsRecord,
} from './addressDnsRecord';

test('Address DNS creates a privacy-preserving public ADR record', () => {
  const record = createAddressDnsRecord({
    ownerName: 'tokyo-station.jp.agid',
    zone: 'jp.agid',
    target: {
      addressReferenceCommitment: '0xADDRESSREF',
    },
    issuerId: 'issuer-jp-postal',
    freshnessRoot: '0xFRESH',
    revocationRoot: '0xREVOKE',
    scope: 'delivery',
    issuedAt: '2026-06-17T00:00:00.000Z',
    expiresAt: '2026-06-17T00:10:00.000Z',
  }, { now: '2026-06-17T00:00:00.000Z' });

  const validation = validateAddressDnsRecord(record, {
    now: '2026-06-17T00:05:00.000Z',
    requireFreshnessRoot: true,
    requireRevocationRoot: true,
  });
  const zoneLine = addressDnsRecordToZoneLine(record);

  assert.equal(record.version, ADDRESS_DNS_RECORD_VERSION);
  assert.match(record.recordId, /^ADNS-[0-9A-F]{24}$/);
  assert.match(record.recordHash, /^[0-9a-f]{64}$/);
  assert.equal(record.targetKind, 'address-reference-commitment');
  assert.equal(record.target.addressReferenceCommitment, '0xaddressref');
  assert.equal(record.privacy.rawAddressStored, false);
  assert.equal(validation.valid, true);
  assert.match(zoneLine, /ADNS address-dns-record-v1 ADR AGID address-reference-commitment/);
  assert.doesNotMatch(zoneLine, /東京都|丸の内|35\./);
});

test('Address DNS rejects raw address, raw AGID, raw AOID, and coordinate material', () => {
  assert.throws(
    () => createAddressDnsRecord({
      ownerName: 'unsafe.jp.agid',
      zone: 'jp.agid',
      address: '東京都千代田区丸の内1-1',
      target: {
        addressReferenceCommitment: '0xpublic',
      },
    }),
    /private material/i,
  );

  const errors = collectAddressDnsPrivateMaterialErrors({
    ownerName: 'unsafe.jp.agid',
    target: {
      agid: 'AGID-SECRET-123456',
      coordinates: '35.681236, 139.767125',
    },
  });

  assert.match(errors.join('\n'), /target\.agid.*private material/i);
  assert.match(errors.join('\n'), /target\.coordinates.*private material/i);
});

test('Address DNS detects canonical hash tampering', () => {
  const record = createAddressDnsRecord({
    ownerName: 'pickup.store.us.agid',
    zone: 'us.agid',
    target: {
      agidCommitment: '0xAABBCC',
    },
    issuedAt: '2026-06-17T00:00:00.000Z',
  });

  const tampered = {
    ...record,
    target: {
      ...record.target,
      agidCommitment: '0xdeadbeef',
    },
  };
  const validation = validateAddressDnsRecord(tampered, {
    now: '2026-06-17T00:00:00.000Z',
  });

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes('recordHash does not match canonical record payload'));
  assert.ok(validation.errors.includes('recordId does not match recordHash'));
});

test('Address DNS high-risk validation requires short TTL and freshness metadata', () => {
  const record = createAddressDnsRecord({
    ownerName: 'shelter-1.relief.example.agid',
    zone: 'example.agid',
    target: {
      serviceEndpoint: 'https://relief.example/.well-known/agid/address-dns',
    },
    ttlSeconds: 3600,
    issuedAt: '2026-06-17T00:00:00.000Z',
    expiresAt: '2026-06-17T01:00:00.000Z',
  });

  const validation = validateAddressDnsRecord(record, {
    now: '2026-06-17T00:10:00.000Z',
    highRiskMode: true,
    requireFreshnessRoot: true,
  });

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes('high-risk Address DNS records must use ttlSeconds <= 900'));
  assert.ok(validation.errors.includes('freshnessRoot is required'));
});

test('Address DNS zone snapshots are deterministic by record hash set', () => {
  const a = createAddressDnsRecord({
    ownerName: 'a.jp.agid',
    zone: 'jp.agid',
    target: { aoidCommitment: '0xAOID' },
    issuedAt: '2026-06-17T00:00:00.000Z',
  });
  const b = createAddressDnsRecord({
    ownerName: 'b.jp.agid',
    zone: 'jp.agid',
    target: { pidCommitment: '0xPID' },
    issuedAt: '2026-06-17T00:00:00.000Z',
  });

  const first = createAddressDnsZoneSnapshot([b, a], {
    zone: 'jp.agid',
    generatedAt: '2026-06-17T00:00:00.000Z',
  });
  const second = createAddressDnsZoneSnapshot([a, b], {
    zone: 'jp.agid',
    generatedAt: '2026-06-17T00:05:00.000Z',
  });

  assert.equal(first.snapshotRoot, second.snapshotRoot);
  assert.equal(first.records[0].ownerName, 'a.jp.agid');
  assert.equal(first.recordCount, 2);
  assert.equal(first.privacy.rawAddressStored, false);
});
