import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PUBLIC_PRIVATE_COMMITMENT_ALGORITHM,
  separatePublicPrivatePayload,
  validatePublicPayloadSeparation,
} from './publicPrivateSeparation';

test('separates raw address and AOID material from Address DNS public payloads', () => {
  const separated = separatePublicPrivatePayload({
    mode: 'address-dns',
    domain: 'address-dns:delivery',
    salt: 'test-salt-1',
    now: '2026-06-17T00:00:00.000Z',
    payload: {
      ownerName: 'pickup.store.jp.agid',
      zone: 'jp.agid',
      agid: 'ML01R1A0ZTR4',
      aoid: 'ABCDEFGHJKLMNPQ',
      address: '東京都千代田区丸の内1-1',
      recipient: 'Example Recipient',
      phone: '+81-00-0000-0000',
      room: '1201',
      issuerId: 'issuer-jp',
      freshnessRoot: '0xFRESH',
      revocationRoot: '0xREVOKE',
    },
  });

  const publicText = JSON.stringify(separated.publicPayload);
  const privateText = JSON.stringify(separated.privatePayload);
  const validation = validatePublicPayloadSeparation(separated.publicPayload);

  assert.equal(separated.blocked, false);
  assert.equal(separated.privacy.rawAddressPublic, false);
  assert.equal(separated.privacy.rawAgidPublic, false);
  assert.equal(separated.privacy.rawAoidPublic, false);
  assert.equal(validation.valid, true);
  assert.doesNotMatch(publicText, /東京都|Example Recipient|1201|ML01R1A0ZTR4|ABCDEFGHJKLMNPQ/);
  assert.match(privateText, /東京都|Example Recipient|1201|ML01R1A0ZTR4|ABCDEFGHJKLMNPQ/);
  assert.equal(separated.commitments.length, 6);
  assert.equal(separated.commitments[0].algorithm, PUBLIC_PRIVATE_COMMITMENT_ALGORITHM);
});

test('requires a salt before committing private fields', () => {
  const separated = separatePublicPrivatePayload({
    mode: 'server-registry',
    domain: 'registry:delivery',
    payload: {
      address: '1600 Pennsylvania Avenue NW',
      issuerId: 'issuer-us',
      credentialCommitment: '0xcredential',
    },
  });

  assert.equal(separated.blocked, true);
  assert.match(separated.errors.join('\n'), /salt is required/);
  assert.equal(separated.commitments.length, 0);
});

test('allows local-only private fields without salt while keeping them out of the public payload', () => {
  const separated = separatePublicPrivatePayload({
    mode: 'local-only',
    domain: 'local:pos',
    payload: {
      address: '100-0005 Tokyo Chiyoda Marunouchi 1-9-1',
      recipient: 'Local Recipient',
      label: 'counter',
    },
  });

  assert.equal(separated.blocked, false);
  assert.equal(separated.commitments.length, 0);
  assert.match(separated.warnings.join('\n'), /kept local without a public commitment/);
  assert.doesNotMatch(JSON.stringify(separated.publicPayload), /Tokyo Chiyoda|Local Recipient/);
  assert.match(JSON.stringify(separated.privatePayload), /Tokyo Chiyoda|Local Recipient/);
});

test('allows raw AGID only when explicitly allowed on trusted local/private surfaces', () => {
  const local = separatePublicPrivatePayload({
    mode: 'local-only',
    domain: 'local:operator',
    allowPublicAgid: true,
    payload: {
      agid: 'ML01R1A0ZTR4',
      label: 'counter pickup',
    },
  });
  const highRisk = separatePublicPrivatePayload({
    mode: 'local-only',
    domain: 'local:high-risk',
    allowPublicAgid: true,
    highRiskMode: true,
    salt: 'test-salt-2',
    payload: {
      agid: 'ML01R1A0ZTR4',
      label: 'shelter desk',
    },
  });

  assert.equal(local.privacy.rawAgidPublic, true);
  assert.match(JSON.stringify(local.publicPayload), /ML01R1A0ZTR4/);
  assert.equal(highRisk.privacy.rawAgidPublic, false);
  assert.doesNotMatch(JSON.stringify(highRisk.publicPayload), /ML01R1A0ZTR4/);
  assert.equal(highRisk.commitments.length, 1);
});

test('keeps secret material vault-only and reports warnings', () => {
  const separated = separatePublicPrivatePayload({
    mode: 'encrypted-sync',
    domain: 'sync:aoid',
    salt: 'test-salt-3',
    payload: {
      publicHandle: 'aoid-ref-1',
      recipientSecret: 'do-not-publish',
      privateKey: 'do-not-sync',
    },
  });

  assert.equal(separated.blocked, false);
  assert.equal(separated.commitments.length, 2);
  assert.match(separated.warnings.join('\n'), /secret-local-only/);
  assert.doesNotMatch(JSON.stringify(separated.publicPayload), /do-not-publish|do-not-sync/);
  assert.match(JSON.stringify(separated.privatePayload), /do-not-publish|do-not-sync/);
});

test('public payload validation catches poisoned public exports', () => {
  const validation = validatePublicPayloadSeparation({
    data: {
      address: 'Hidden raw address',
      coordinates: '35.681236, 139.767125',
      aoid: 'ABCDEFGHJKLMNPQ',
    },
  });

  assert.equal(validation.valid, false);
  assert.match(validation.errors.join('\n'), /address.*private material/i);
  assert.match(validation.errors.join('\n'), /coordinates.*private material/i);
  assert.match(validation.errors.join('\n'), /aoid.*private material/i);
});
