import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'App.tsx'), 'utf8');
const persistenceHookSource = readFileSync(join(here, 'hooks', 'useAppDatabasePersistence.ts'), 'utf8');

test('App persists regular address registrations and links them to generated QR payloads', () => {
  assert.match(source, /useAppDatabasePersistence\(\{/);
  assert.match(persistenceHookSource, /agid_registered_addresses/);
  assert.match(persistenceHookSource, /loadAppDatabaseSnapshot/);
  assert.match(persistenceHookSource, /persistRegisteredAddresses/);
  assert.match(persistenceHookSource, /persistSavedQrs/);
  assert.match(persistenceHookSource, /persistSyncQueue/);
  assert.match(persistenceHookSource, /agid_sync_queue/);
  assert.match(source, /import type \{ RegisteredAddressRecord \} from '\.\/lib\/registeredAddressQr';/);
  assert.doesNotMatch(source, /import \{[\s\S]*buildRegisteredAddressQrPayload[\s\S]*\} from '\.\/lib\/registeredAddressQr';/);
  assert.match(source, /await import\('\.\/lib\/registeredAddressQr'\)/);
  assert.match(source, /enqueueSyncQueueRecord\('registeredAddress'/);
  assert.match(source, /enqueueSyncQueueRecord\('savedAgid'/);
  assert.match(source, /enqueueSyncQueueRecord\('savedQr'/);
  assert.match(source, /setRegisteredAddresses/);
  assert.match(source, /saveAgid\(\{[\s\S]*?id: data\.agid \|\| registeredAgid\.id,[\s\S]*?\}, data\.address\)/);
  assert.match(persistenceHookSource, /localStorage\.setItem\('saved_qrs', JSON\.stringify\(savedQrs\)\)/);
  assert.match(persistenceHookSource, /localStorage\.setItem\('saved_agids', JSON\.stringify\(savedAgids\)\)/);
});

test('App can read registered-address QR payloads before falling back to AGID or general search', () => {
  const qrBlock = source.match(/const handleQrResult = React\.useCallback\(async \(text: string\) => \{[\s\S]*?\n  \}, \[[^\]]+\]\);/);

  assert.ok(qrBlock, 'handleQrResult block should exist');
  assert.match(source, /import type \{ HotelCheckInSession \} from '\.\/lib\/addressQrIntake';/);
  assert.doesNotMatch(source, /import \{[\s\S]*parseAddressQrIntake[\s\S]*\} from '\.\/lib\/addressQrIntake';/);
  assert.match(qrBlock[0], /await import\('\.\/lib\/addressQrIntake'\)/);
  assert.match(qrBlock[0], /await import\('\.\/lib\/registeredAddressQr'\)/);
  assert.match(qrBlock[0], /parseAddressQrIntake\(result\)/);
  assert.match(qrBlock[0], /Address fields were filled from QR/);
  assert.match(qrBlock[0], /setPendingRegistrationQrRecord\(registeredAddressQr\)/);
  assert.match(qrBlock[0], /setShowAddressRegistration\(true\)/);
  assert.match(qrBlock[0], /setRegisteredAddresses/);
  assert.match(qrBlock[0], /isOwnerManagedAoid/);
  assert.match(qrBlock[0], /ownerManaged\?: unknown/);
});

test('App opens the address registration flow for hotel check-in QR sessions', () => {
  const qrBlock = source.match(/const handleQrResult = React\.useCallback\(async \(text: string\) => \{[\s\S]*?\n  \}, \[[^\]]+\]\);/);

  assert.ok(qrBlock, 'handleQrResult block should exist');
  assert.match(source, /import type \{ HotelCheckInSession \} from '\.\/lib\/addressQrIntake';/);
  assert.match(source, /pendingHotelCheckInSession/);
  assert.match(qrBlock[0], /addressQrIntake\.kind === 'hotel-checkin'/);
  assert.match(qrBlock[0], /setPendingHotelCheckInSession\(addressQrIntake\.session\)/);
  assert.match(qrBlock[0], /Hotel Check-in QR/);
  assert.match(source, /initialHotelCheckInSession=\{pendingHotelCheckInSession\}/);
});

test('AOID registrations are saved with the normalized AOID shape and persisted locally', () => {
  assert.match(source, /data\.type === 'AOID' \|\| data\.isAoid/);
  assert.match(persistenceHookSource, /localStorage\.setItem\('agid_grid_aoids', JSON\.stringify\(aoids\)\)/);
});

test('address registration opened from the menu still has a current map AGID and coordinates for QR use', () => {
  assert.match(source, /initialAgid=\{clickedAgid\?\.id \|\| encodeAGID\(lat, lng\)\.id\}/);
  assert.match(source, /currentCoords=\{clickedAgid \? \{ lat: clickedAgid\.lat, lon: clickedAgid\.lon \} : \{ lat, lon: lng \}\}/);
});

test('App defaults generated address QR sharing to no-raw public mode and opens the saved identifier output', () => {
  assert.match(source, /localStorage\.getItem\('agid_qr_payload_privacy'\) === 'full' \? 'full' : 'public'/);
  assert.match(source, /catch \{ return 'public'; \}/);
  assert.match(source, /onRegister=\{async \(data\) =>/);
  assert.match(source, /buildSavedQrFromRegisteredAddress\(data, payload, undefined, \{ privacy: qrPayloadPrivacy \}\)/);
  assert.match(source, /setSavedTab\(isAoidRegistration \? 'aoid' : 'agid'\);[\s\S]*?setShowSaved\(true\);/);
});

test('App can save the current map AGID directly into the persistent identifier list', () => {
  assert.match(source, /const saveCurrentAgid = \(\) => \{/);
  assert.match(source, /saveAgid\(clickedAgid \?\? encodeAGID\(lat, lng\)\)/);
  assert.match(source, /saveCurrentAgid=\{saveCurrentAgid\}/);
});

test('home search QR action starts camera scanning in one tap', () => {
  const searchSidebarBlock = source.match(/<SearchSidebar[\s\S]*?mapRef=\{map\}\s*\/>/);

  assert.ok(searchSidebarBlock, 'SearchSidebar block should exist');
  assert.match(searchSidebarBlock[0], /openQrReader=\{startQrScanner\}/);
});
