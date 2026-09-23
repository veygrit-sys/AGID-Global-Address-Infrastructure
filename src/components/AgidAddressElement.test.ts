import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'AgidAddressElement.tsx'), 'utf8');

test('AGID Address Element exposes a safe host event and readiness API', () => {
  assert.match(source, /hostSurface\?: AddressElementHostSurface/);
  assert.match(source, /onPublicEvent\?: \(event: AddressElementPublicEvent\) => void/);
  assert.match(source, /onReadinessChange\?: \(readiness: AddressElementReadiness\['publicMetadata'\]\) => void/);
  assert.match(source, /buildAddressElementPublicEvents\(\{ surface: hostSurface, session \}\)\.forEach\(onPublicEvent\)/);
  assert.match(source, /onReadinessChange\?\.\(elementReadiness\.publicMetadata\)/);
});

test('AGID Address Element runs professional readiness checks in the UI', () => {
  assert.match(source, /assessAddressElementReadiness\(\{/);
  assert.match(source, /hostSurface/);
  assert.match(source, /addressLinkStatus: addressLinkSession\.status/);
  assert.match(source, /requestedCapabilities: linkCapabilities/);
  assert.match(source, /Embed readiness/);
  assert.match(source, /elementReadiness\.roleSummaries\.map/);
  assert.match(source, /elementReadiness\.nextActions\[0\]/);
});

test('AGID Address Element shares country form and language-tab logic with registration', () => {
  assert.match(source, /getAddressFormat\(normalizedCountryCode\)/);
  assert.match(source, /buildAddressElementLanguageTabs\(addressFormat, fields\.countryCode \|\| countryCode\)/);
  assert.match(source, /buildAddressElementFormFields\(addressFormat, selectedLanguage\)/);
  assert.match(source, /describeAddressElementCountryForm\(addressFormat, selectedLanguage\)/);
  assert.match(source, /Country form/);
  assert.doesNotMatch(source, /languageTabs: \[\s*\{\s*language: 'local'/);
});

test('AGID Address Element keeps internal quality score out of the rendered readiness copy', () => {
  assert.doesNotMatch(source, /elementReadiness\.score/);
  assert.doesNotMatch(source, /session\.quality\.score/);
  assert.match(source, /formatAddressElementPublicDecision/);
  assert.doesNotMatch(source, /quality\.decision\.replace/);
});

test('AGID Address Element surfaces secure QR/NFC intake without raw payload details', () => {
  assert.match(source, /Secure intake/);
  assert.match(source, /session\.scanSecurity\.publicDecision/);
  assert.match(source, /aria-pressed=\{scanCapabilities\.qr\}/);
  assert.match(source, /aria-pressed=\{scanCapabilities\.nfc\}/);
  assert.match(source, /aria-pressed=\{scanCapabilities\.agidSecure\}/);
  assert.doesNotMatch(source, /session\.scanSecurity.*payload/i);
});
