import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getInitialPwaLifecycleSnapshot,
  getPwaLifecycleCopy,
  reducePwaLifecycleSnapshot,
  shouldShowPwaStatus,
} from './pwaLifecycle';

test('PWA lifecycle starts from network and service worker capability', () => {
  const snapshot = getInitialPwaLifecycleSnapshot({
    online: false,
    standalone: false,
    serviceWorkerSupported: true,
  });

  assert.equal(snapshot.connectivity, 'offline');
  assert.equal(snapshot.serviceWorkerState, 'registering');
  assert.equal(snapshot.updateAvailable, false);
  assert.equal(shouldShowPwaStatus(snapshot), true);
});

test('PWA lifecycle exposes update-ready state without auto refreshing', () => {
  const initial = getInitialPwaLifecycleSnapshot({
    online: true,
    standalone: false,
    serviceWorkerSupported: true,
  });
  const registered = reducePwaLifecycleSnapshot(initial, { type: 'sw-registered' });
  const updateReady = reducePwaLifecycleSnapshot(registered, { type: 'sw-update-ready' });
  const copy = getPwaLifecycleCopy(updateReady, 'ja');

  assert.equal(updateReady.serviceWorkerState, 'update-ready');
  assert.equal(updateReady.updateAvailable, true);
  assert.equal(shouldShowPwaStatus(updateReady), true);
  assert.equal(copy.primaryAction, '更新');
});

test('PWA lifecycle tracks install prompt and dismissal separately from app install', () => {
  const initial = getInitialPwaLifecycleSnapshot({
    online: true,
    standalone: false,
    serviceWorkerSupported: true,
  });
  const ready = reducePwaLifecycleSnapshot(initial, { type: 'install-ready' });
  const dismissed = reducePwaLifecycleSnapshot(ready, { type: 'install-dismissed' });
  const installed = reducePwaLifecycleSnapshot(ready, { type: 'installed' });

  assert.equal(ready.installState, 'ready');
  assert.equal(shouldShowPwaStatus(ready), true);
  assert.equal(dismissed.installState, 'dismissed');
  assert.equal(installed.installState, 'installed');
  assert.equal(installed.standalone, true);
});
