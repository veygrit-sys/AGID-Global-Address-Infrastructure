import assert from 'node:assert/strict';
import { test } from 'node:test';

import { evaluateRepositoryCreationPreflight } from './repositoryCreationPreflight';

test('repository creation preflight blocks user-owner creation from a different login', () => {
  const result = evaluateRepositoryCreationPreflight({
    targetOwner: 'dawnportinfo-design',
    activeLogin: 'rei-k',
    targetOwnerType: 'User',
  });

  assert.equal(result.status, 'blocked');
  assert.match(result.reason, /active GitHub login is rei-k/);
  assert.match(result.nextAction, /logging in as dawnportinfo-design/);
  assert.match(result.nextAction, /do not allow fallback to rei-k/);
});

test('repository creation preflight allows user-owner creation from the same login', () => {
  const result = evaluateRepositoryCreationPreflight({
    targetOwner: 'dawnportinfo-design',
    activeLogin: 'dawnportinfo-design',
    targetOwnerType: 'User',
  });

  assert.equal(result.status, 'pass');
  assert.match(result.reason, /matches the target user owner/);
});

test('repository creation preflight blocks organization creation without confirmed permission', () => {
  const result = evaluateRepositoryCreationPreflight({
    targetOwner: 'agid-org',
    activeLogin: 'maintainer',
    targetOwnerType: 'Organization',
    canCreateInOrganization: false,
  });

  assert.equal(result.status, 'blocked');
  assert.match(result.reason, /has not been confirmed/);
  assert.match(result.nextAction, /repository creation permission/);
});

test('repository creation preflight allows organization creation with confirmed permission', () => {
  const result = evaluateRepositoryCreationPreflight({
    targetOwner: 'agid-org',
    activeLogin: 'maintainer',
    targetOwnerType: 'Organization',
    canCreateInOrganization: true,
  });

  assert.equal(result.status, 'pass');
  assert.match(result.reason, /can create repositories/);
});

test('repository creation preflight blocks missing or unresolved owner state', () => {
  assert.equal(
    evaluateRepositoryCreationPreflight({
      targetOwner: '',
      activeLogin: 'maintainer',
      targetOwnerType: 'Unknown',
    }).status,
    'blocked',
  );

  assert.equal(
    evaluateRepositoryCreationPreflight({
      targetOwner: 'dawnportinfo-design',
      activeLogin: undefined,
      targetOwnerType: 'User',
    }).status,
    'blocked',
  );

  assert.equal(
    evaluateRepositoryCreationPreflight({
      targetOwner: 'dawnportinfo-design',
      activeLogin: 'maintainer',
      targetOwnerType: 'Unknown',
    }).status,
    'blocked',
  );
});
