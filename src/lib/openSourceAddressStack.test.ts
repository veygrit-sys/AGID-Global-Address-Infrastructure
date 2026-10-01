import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  auditOpenSourceAddressStack,
  OPEN_SOURCE_ADDRESS_STACK,
} from './openSourceAddressStack';

test('address OSS stack separates software licenses from data-license boundaries', () => {
  assert.deepEqual(
    OPEN_SOURCE_ADDRESS_STACK.map(entry => entry.id),
    ['libpostal', 'photon', 'pelias', 'overture-addresses'],
  );
  for (const entry of OPEN_SOURCE_ADDRESS_STACK) {
    assert.ok(entry.softwareLicense.length > 0);
    assert.ok(entry.dataLicenseBoundary.length > 0);
    assert.match(entry.projectUrl, /^https:\/\//);
  }
});

test('audit exposes what is integrated and what still needs an explicit deployment decision', () => {
  const audit = auditOpenSourceAddressStack();

  assert.deepEqual(audit.integrated.map(entry => entry.id), ['libpostal', 'photon']);
  assert.deepEqual(audit.optionalAdditions.map(entry => entry.id), ['pelias']);
  assert.deepEqual(audit.licenseGated.map(entry => entry.id), ['overture-addresses']);
  assert.equal(audit.hasLocalParser, true);
  assert.equal(audit.hasSearchAutocomplete, true);
  assert.equal(audit.hasFullSelfHostedGeocoder, false);
});

test('no native parser, service, or external dataset is silently enabled', () => {
  const nonBrowserDependencies = OPEN_SOURCE_ADDRESS_STACK.filter(
    entry => entry.deployment !== 'remote-or-self-hosted',
  );

  assert.equal(nonBrowserDependencies.every(entry => entry.defaultEnabled === false), true);
});
