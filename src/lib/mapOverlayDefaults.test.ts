import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MAP_OVERLAY_DEFAULTS_MIGRATION_KEY,
  markMapOverlayDefaultsMigrated,
  readMapOverlayModeDefault,
  type OverlayPreferenceStorage,
} from './mapOverlayDefaults';

function createStorage(initial: Record<string, string> = {}): OverlayPreferenceStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
  };
}

test('legacy nautical overlay preferences are ignored before the visual migration is marked', () => {
  const storage = createStorage({
    agid_nautical_mode: 'true',
    agid_sea_type_mode: 'true',
  });

  assert.equal(readMapOverlayModeDefault('agid_nautical_mode', false, storage), false);
  assert.equal(readMapOverlayModeDefault('agid_sea_type_mode', false, storage), false);
});

test('manual overlay preferences are honored after the visual migration is marked', () => {
  const storage = createStorage({
    [MAP_OVERLAY_DEFAULTS_MIGRATION_KEY]: 'true',
    agid_nautical_mode: 'true',
  });

  assert.equal(readMapOverlayModeDefault('agid_nautical_mode', false, storage), true);
  assert.equal(readMapOverlayModeDefault('agid_sea_type_mode', false, storage), false);
});

test('marks the map overlay default migration once the app has loaded', () => {
  const storage = createStorage();

  markMapOverlayDefaultsMigrated(storage);

  assert.equal(storage.data[MAP_OVERLAY_DEFAULTS_MIGRATION_KEY], 'true');
});
