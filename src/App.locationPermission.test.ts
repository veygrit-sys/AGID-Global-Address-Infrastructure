import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'App.tsx'), 'utf8');
const mapControlsSource = readFileSync(join(here, 'components', 'MapControls.tsx'), 'utf8');

test('keeps the map current-location button in a fixed visible position', () => {
  assert.match(source, /locationPermissionState/);
  assert.match(source, /jumpToMyLocation=\{jumpToMyLocation\}/);
  assert.match(mapControlsSource, /right-2 top-20 z-50/);
  assert.match(mapControlsSource, /md:right-3 md:top-6/);
  assert.match(mapControlsSource, /onClick=\{jumpToMyLocation\}/);
  assert.match(mapControlsSource, /aria-label=\{t\('current_location'\)\}/);
  assert.doesNotMatch(source, /isMapLoaded && !userLocation && locationPermissionState !== 'unsupported' && locationPermissionState !== 'denied'/);
});

test('location permission button uses the same geolocation flow that updates the map', () => {
  const jumpBlock = source.match(/const jumpToMyLocation = React\.useCallback\(\(\) => \{[\s\S]*?\n  \}, \[[^\]]+\]\);/);

  assert.ok(jumpBlock, 'jumpToMyLocation block should exist');
  assert.match(jumpBlock[0], /navigator\.geolocation\.getCurrentPosition/);
  assert.match(jumpBlock[0], /setLocationPermissionState\('unsupported'\)/);
  assert.match(jumpBlock[0], /setLocationPermissionState\('granted'\)/);
  assert.match(jumpBlock[0], /handleGeolocationErrorQuietly\(error, "Geolocation error:", \{ stopLocating: true \}\)/);
  assert.match(jumpBlock[0], /setUserLocation/);
  assert.match(jumpBlock[0], /map\.current\?\.flyTo/);
  assert.match(jumpBlock[0], /reverseGeocode/);
});

test('location denied state is silent instead of repeatedly showing blocked copy', () => {
  const jumpBlock = source.match(/const jumpToMyLocation = React\.useCallback\(\(\) => \{[\s\S]*?\n  \}, \[[^\]]+\]\);/);
  const geolocationErrorBlock = source.match(/const handleGeolocationErrorQuietly = React\.useCallback\([\s\S]*?\n  \}, \[\]\);/);

  assert.ok(jumpBlock, 'jumpToMyLocation block should exist');
  assert.ok(geolocationErrorBlock, 'shared geolocation error handler should exist');
  assert.match(geolocationErrorBlock[0], /if \(error\.code === error\.PERMISSION_DENIED\) \{[\s\S]*?setLocationPermissionState\('denied'\);[\s\S]*?\} else if/);
  assert.doesNotMatch(geolocationErrorBlock[0], /showAlert/);
  assert.doesNotMatch(jumpBlock[0], /showAlert\(t\('gps_blocked_title'\), t\('gps_blocked_body'\)\)/);
  assert.doesNotMatch(source, /locationPermissionState === 'denied'\s*\?\s*t\('location_permission_blocked'\)/);
});

test('all geolocation entry points use the quiet denied-state handler', () => {
  assert.match(source, /handleGeolocationErrorQuietly\(error, "Geolocation error on start:", \{ warn: true \}\)/);
  assert.match(source, /handleGeolocationErrorQuietly\(error, "Geolocation error:"\)/);
  assert.match(source, /handleGeolocationErrorQuietly\(error, "Tracking error:", \{ stopTracking: true \}\)/);
  assert.match(source, /handleGeolocationErrorQuietly\(error, "Geolocation error:", \{ stopLocating: true \}\)/);
});
