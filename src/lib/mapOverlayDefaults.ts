export interface OverlayPreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const MAP_OVERLAY_DEFAULTS_MIGRATION_KEY = 'agid_map_overlay_defaults_v2';

function getBrowserStorage(): OverlayPreferenceStorage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function parseStoredBoolean(value: string | null, fallback: boolean) {
  if (value === null) return fallback;
  try {
    return JSON.parse(value) === true;
  } catch {
    return fallback;
  }
}

export function readMapOverlayModeDefault(
  key: string,
  fallback = false,
  storage: OverlayPreferenceStorage | null = getBrowserStorage(),
) {
  if (!storage) return fallback;

  const hasMigrated = storage.getItem(MAP_OVERLAY_DEFAULTS_MIGRATION_KEY) === 'true';
  if (!hasMigrated) return false;

  return parseStoredBoolean(storage.getItem(key), fallback);
}

export function markMapOverlayDefaultsMigrated(
  storage: OverlayPreferenceStorage | null = getBrowserStorage(),
) {
  if (!storage) return;
  storage.setItem(MAP_OVERLAY_DEFAULTS_MIGRATION_KEY, 'true');
}
