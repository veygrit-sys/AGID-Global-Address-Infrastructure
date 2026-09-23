import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./DeliveryStopCandidatePanel.tsx', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');

test('DeliveryStopCandidatePanel shows a car-stoppable delivery point with source confidence', () => {
  assert.match(source, /Vehicle stop point/);
  assert.match(source, /車が止まれる点/);
  assert.match(source, /formatPublicConfidenceBand/);
  assert.match(source, /OSM service road/);
  assert.match(source, /distanceMeters/);
});

test('DeliveryStopCandidatePanel stays address-safe and is mounted on the map', () => {
  assert.doesNotMatch(source, /recipient/i);
  assert.doesNotMatch(source, /raw address/i);
  assert.doesNotMatch(source, /private key/i);
  assert.match(appSource, /DeliveryStopCandidatePanel/);
  assert.match(appSource, /candidate=\{carNavigationDestination\}/);
  assert.match(appSource, /lowBandwidth=\{isLowBandwidthMapMode\}/);
});
