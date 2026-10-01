import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./MapControls.tsx', import.meta.url), 'utf8');

test('current-location control stays above the desktop AGID panel', () => {
  assert.match(source, /md:right-5 md:top-6/);
  assert.doesNotMatch(source, /md:right-\[452px\]/);
});

test('current-location control is a compact high-contrast circular button', () => {
  assert.match(source, /h-9 w-9/);
  assert.match(source, /md:h-8 md:w-8/);
  assert.match(source, /rounded-full border border-white\/90 bg-white text-blue-600/);
  assert.match(source, /<LocateFixed className=\{cn\("h-4 w-4"/);
});

test('renders exactly one persistent current-location control', () => {
  assert.equal((source.match(/onClick=\{jumpToMyLocation\}/g) ?? []).length, 1);
  assert.equal((source.match(/<LocateFixed/g) ?? []).length, 1);
});
