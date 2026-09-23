import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'AddressElementPlaygroundScreen.tsx'), 'utf8');
const rootSource = readFileSync(join(here, '..', 'RootApp.tsx'), 'utf8');

test('Address Element Playground gives EC, CMS, and shopping agent embed surfaces', () => {
  assert.match(source, /Address Element Playground/);
  assert.match(source, /EC Checkout/);
  assert.match(source, /CMS Form/);
  assert.match(source, /Shopping Agent/);
  assert.match(source, /Embeddable Address UI Demo/);
  assert.match(source, /AgidAddressElement/);
});

test('Address Element Playground exposes safe host integration outputs', () => {
  assert.match(source, /Safe event log/);
  assert.match(source, /Address Intent preview/);
  assert.match(source, /React embed/);
  assert.match(source, /Web Component embed/);
  assert.match(source, /Host receives safe events only/);
  assert.match(source, /No raw AGID\/AOID in event log/);
  assert.match(source, /Internal quality score stays internal/);
});

test('Address Element Playground generates country-aware language tabs and embed code', () => {
  assert.match(source, /getAddressFormat\(normalizedCountryCode\)/);
  assert.match(source, /buildAddressElementLanguageTabs\(playgroundAddressFormat, countryCode\)/);
  assert.match(source, /pickAddressElementLanguage\(current, languageOptions\)/);
  assert.match(source, /Country form switch/);
  assert.match(source, /default-language="\$\{input\.defaultLanguage\}"/);
  assert.doesNotMatch(source, /<option value="ja">日本語<\/option>/);
});

test('Address Element Playground is routed as a standalone app screen', () => {
  assert.match(rootSource, /AddressElementPlaygroundScreen/);
  assert.match(rootSource, /isAddressElementRoute/);
  assert.match(rootSource, /window\.location\.pathname === '\/element'/);
});
