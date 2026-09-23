import assert from 'node:assert/strict';
import { readdirSync,statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { DEFAULT_ADDRESS_VERIFICATION_TARGET_POLICIES } from './addressVerificationEngine';
import {
  ADDRESS_VERIFICATION_COMPETITOR_PROFILES,
  buildAgidAddressVerificationBenchmarkProfile,
  compareAddressVerificationProfiles,
  findAgidAddressVerificationGaps,
  scoreAddressVerificationProfile,
} from './addressVerificationBenchmark';

const addressFormatRoot = join(process.cwd(), 'src', 'data', 'address_formats');

function walkJsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walkJsonFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

test('builds the current AGID address verification benchmark profile from repository coverage', () => {
  const agid = buildAgidAddressVerificationBenchmarkProfile({
    addressFormatCountryCount: walkJsonFiles(addressFormatRoot).length,
    explicitPolicyCountryCount: Object.keys(DEFAULT_ADDRESS_VERIFICATION_TARGET_POLICIES).length,
  });

  assert.equal(agid.metrics.explicitPolicyCountries, 22);
  assert.ok((agid.metrics.addressFormatCountries || 0) >= 280);
  assert.ok(scoreAddressVerificationProfile(agid) > 5);
  assert.ok(agid.scores.openSourceAuditability > 9);
  assert.ok(agid.scores.privacyLocalFirst > 9);
});

test('keeps AGID comparison honest against commercial delivery-point validators', () => {
  const agid = buildAgidAddressVerificationBenchmarkProfile({
    addressFormatCountryCount: walkJsonFiles(addressFormatRoot).length,
    explicitPolicyCountryCount: Object.keys(DEFAULT_ADDRESS_VERIFICATION_TARGET_POLICIES).length,
  });

  const ranked = compareAddressVerificationProfiles([agid,...ADDRESS_VERIFICATION_COMPETITOR_PROFILES]);
  const agidRank = ranked.findIndex(profile => profile.id === agid.id);
  const gaps = findAgidAddressVerificationGaps(agid, ADDRESS_VERIFICATION_COMPETITOR_PROFILES);

  assert.ok(agidRank > 0, 'AGID should not claim paid-API parity before authoritative delivery-point datasets are added');
  assert.ok(gaps.some(gap => gap.dimension === 'deliveryPointDepth' && gap.priority === 'high'));
  assert.ok(gaps.some(gap => gap.dimension === 'authoritativePostalDepth' && gap.priority === 'high'));
});

test('captures AGID advantages that commercial postal validators do not target', () => {
  const agid = buildAgidAddressVerificationBenchmarkProfile({
    addressFormatCountryCount: walkJsonFiles(addressFormatRoot).length,
    explicitPolicyCountryCount: Object.keys(DEFAULT_ADDRESS_VERIFICATION_TARGET_POLICIES).length,
  });

  const commercial = ADDRESS_VERIFICATION_COMPETITOR_PROFILES.filter(profile => profile.kind !== 'open-source');
  assert.ok(commercial.every(profile => agid.scores.naturalFeatureContext > profile.scores.naturalFeatureContext));
  assert.ok(commercial.every(profile => agid.scores.openSourceAuditability > profile.scores.openSourceAuditability));
  assert.ok(commercial.every(profile => agid.scores.costControl > profile.scores.costControl));
});
