import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { encodeAGID16 } from '../lib/agid';
import { assessAgidGeography, type AgidGeographyInput } from '../lib/geographicAssessment';
import { AgidGeographySummary } from './AgidGeographySummary';

function render(input: AgidGeographyInput, locale: 'en' | 'ja' = 'en') {
  return renderToStaticMarkup(<AgidGeographySummary assessment={assessAgidGeography(input)} locale={locale} />);
}

test('the map distinguishes a selected point from a border-straddling ID cell and device fix', () => {
  const lat = -28.9086745, lon = 28.988132;
  const point = render({ kind: 'pin', lat, lon });
  assert.match(point, /Selected point/);
  assert.match(point, /Lesotho/);
  assert.doesNotMatch(point, /South Africa/);
  const cell = render({ kind: 'cell', id: encodeAGID16(lat, lon).id });
  assert.match(cell, /AGID cell/);
  assert.match(cell, /Lesotho \/ South Africa/);
  assert.match(cell, /Confirm the region locally/);
  const device = render({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: 10 }, 'ja');
  assert.match(device, /測位誤差の半径 10 m/);
  assert.match(device, /レソト \/ 南アフリカ/);
});

test('unassessed points have no regional claim and missing device accuracy is explicit', () => {
  const result = render({ kind: 'pin', lat: 48.85, lon: 2.35, method: 'device' }, 'ja');
  assert.match(result, /測位精度は不明/);
  assert.match(result, /詳細な境界データがありません/);
  assert.doesNotMatch(result, /国・地域の候補|フランス|陸地|水域/);
});

test('the map credits the boundary provider at an administrative enclave', () => {
  const result = render({ kind: 'pin', lat: 47.7, lon: 8.68333 });
  assert.match(result, /Germany/);
  assert.match(result, /Federal Office of Topography swisstopo/);
});
