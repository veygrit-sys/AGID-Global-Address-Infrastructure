import assert from 'node:assert/strict';
import { readdirSync,readFileSync,statSync } from 'node:fs';
import { join,relative } from 'node:path';
import { test } from 'node:test';

import {
  collectOfficialPostalSourceCoverage,
  getPostalSourceContinent,
  POSTAL_SOURCE_CONTINENT_ORDER,
  summarizeOfficialPostalSourceCoverage,
} from './officialPostalSourceCoverage';

const root = join(process.cwd(), 'src', 'data', 'address_formats');

function walkJsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walkJsonFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

function loadAddressFormats() {
  return walkJsonFiles(root).map(file => ({
    relativePath: relative(root, file),
    format: JSON.parse(readFileSync(file, 'utf8')),
  }));
}

test('maps address formats into continent ordered postal source coverage', () => {
  const files = loadAddressFormats();
  const entries = collectOfficialPostalSourceCoverage(files);
  const summary = summarizeOfficialPostalSourceCoverage(entries);

  assert.equal(entries.length, files.length);
  assert.equal(summary.total, files.length);

  const seenContinents = new Set(entries.map(entry => entry.continent));
  for (const continent of POSTAL_SOURCE_CONTINENT_ORDER) {
    assert.ok(seenContinents.has(continent), `${continent} should be represented`);
  }

  const continentIndexes = entries.map(entry => POSTAL_SOURCE_CONTINENT_ORDER.indexOf(entry.continent));
  assert.deepEqual(continentIndexes, [...continentIndexes].sort((left, right) => left - right));
});

test('classifies representative official and postal-operator sources strongly', () => {
  const entries = collectOfficialPostalSourceCoverage(loadAddressFormats());
  const byCode = new Map(entries.map(entry => [entry.countryCode, entry]));

  assert.equal(byCode.get('JP')?.status, 'authoritative');
  assert.equal(byCode.get('FR')?.status, 'authoritative');
  assert.equal(byCode.get('DK')?.status, 'authoritative');
  assert.equal(byCode.get('SG')?.status, 'authoritative');
  assert.equal(byCode.get('BR')?.status, 'authoritative');
  assert.equal(byCode.get('NZ')?.status, 'authoritative');
  assert.equal(byCode.get('HK')?.status, 'no-normal-postcode');

  assert.ok(byCode.get('JP')?.evidence.some(source => source.id === 'zipcloud-jp'));
  assert.ok(byCode.get('FR')?.evidence.some(source => /data\.gouv|La Poste/i.test(source.name)));
  assert.ok(byCode.get('BR')?.evidence.some(source => /Correios|ViaCEP|BrasilAPI/i.test(source.name)));
  assert.ok(byCode.get('HK')?.evidence.some(source => source.trustTier === 'authoritative'));
});

test('separates global official fallback from country-specific official source gaps', () => {
  const entries = collectOfficialPostalSourceCoverage(loadAddressFormats());
  const summary = summarizeOfficialPostalSourceCoverage(entries);
  const byCode = new Map(entries.map(entry => [entry.countryCode, entry]));

  assert.equal(summary.byStatus['needs-official-source'], 0);
  assert.equal(summary.missingOfficialSourceCountryCodes.length, 0);
  assert.ok(summary.globalOfficialFallbackCountryCodes.length > 0);
  assert.ok(summary.countrySpecificOfficialMissingCountryCodes.length > 0);
  assert.ok(summary.countrySpecificOfficialMissingCountryCodesByContinent.africa.length > 0);
  assert.ok(!summary.countrySpecificOfficialMissingCountryCodesByContinent.europe.includes('DE'));
  assert.ok(!summary.countrySpecificOfficialMissingCountryCodesByContinent.europe.includes('FI'));
  assert.ok(!summary.countrySpecificOfficialMissingCountryCodesByContinent.europe.includes('LV'));
  assert.ok(!summary.countrySpecificOfficialMissingCountryCodesByContinent.europe.includes('LT'));
  assert.ok(!summary.countrySpecificOfficialMissingCountryCodesByContinent.europe.includes('JE'));
  assert.ok(!summary.countrySpecificOfficialMissingCountryCodesByContinent.europe.includes('IM'));

  assert.equal(byCode.get('DE')?.status, 'authoritative');
  assert.equal(byCode.get('DE')?.usesGlobalOfficialFallback, false);
  assert.equal(byCode.get('DE')?.countrySpecificOfficialSourceMissing, false);
  assert.ok(byCode.get('DE')?.evidence.some(source => source.id === 'catalog:deutsche-post-plz-server'));
  assert.equal(byCode.get('FI')?.status, 'authoritative');
  assert.equal(byCode.get('FI')?.usesGlobalOfficialFallback, false);
  assert.equal(byCode.get('FI')?.countrySpecificOfficialSourceMissing, false);
  assert.ok(byCode.get('FI')?.evidence.some(source => source.id === 'catalog:posti-finland-postal-code-services'));
  assert.equal(byCode.get('LV')?.status, 'authoritative');
  assert.equal(byCode.get('LV')?.usesGlobalOfficialFallback, false);
  assert.equal(byCode.get('LV')?.countrySpecificOfficialSourceMissing, false);
  assert.ok(byCode.get('LV')?.evidence.some(source => source.id === 'catalog:latvijas-pasts-check-address'));
  assert.equal(byCode.get('LT')?.status, 'authoritative');
  assert.equal(byCode.get('LT')?.usesGlobalOfficialFallback, false);
  assert.equal(byCode.get('LT')?.countrySpecificOfficialSourceMissing, false);
  assert.ok(byCode.get('LT')?.evidence.some(source => source.id === 'catalog:lietuvos-pastas-postcode-search'));
  assert.equal(byCode.get('JE')?.status, 'authoritative');
  assert.equal(byCode.get('JE')?.usesGlobalOfficialFallback, false);
  assert.equal(byCode.get('JE')?.countrySpecificOfficialSourceMissing, false);
  assert.ok(byCode.get('JE')?.evidence.some(source => source.id === 'catalog:jersey-post-address-finder'));
  assert.equal(byCode.get('IM')?.status, 'authoritative');
  assert.equal(byCode.get('IM')?.usesGlobalOfficialFallback, false);
  assert.equal(byCode.get('IM')?.countrySpecificOfficialSourceMissing, false);
  assert.ok(byCode.get('IM')?.evidence.some(source => source.id === 'catalog:isle-of-man-post-office-postcode-finder'));

  for (const countryCode of ['AT', 'BF', 'BJ', 'CI', 'CV', 'DE', 'DJ', 'ET', 'FI', 'LV', 'LT', 'GH', 'GM', 'GN', 'IM', 'JE', 'KE', 'KM', 'LR', 'LY', 'MA', 'MR', 'MW', 'MZ', 'NA', 'NG', 'SC', 'SD', 'SN', 'SO', 'SS', 'TG', 'TN', 'UG', 'ZM', 'ZW']) {
    assert.equal(byCode.get(countryCode)?.countrySpecificOfficialEvidence, true, `${countryCode} should have country-specific official evidence`);
    assert.equal(byCode.get(countryCode)?.countrySpecificOfficialSourceMissing, false, `${countryCode} should not remain country-specific missing`);
    assert.equal(byCode.get(countryCode)?.usesGlobalOfficialFallback, false, `${countryCode} should not depend on the global fallback`);
  }

  assert.ok(
    entries
      .filter(entry => entry.countrySpecificOfficialSourceMissing)
      .every(entry => entry.recommendation.includes('global official postal fallback')),
  );
});

test('does not count metadata-only Guatemala evidence as country-specific validation evidence', () => {
  const entries = collectOfficialPostalSourceCoverage(loadAddressFormats());
  const guatemala = entries.find(entry => entry.countryCode === 'GT');

  assert.ok(guatemala);
  assert.equal(guatemala.countrySpecificOfficialEvidence, false);
  assert.equal(guatemala.countrySpecificOfficialSourceMissing, true);
  assert.equal(guatemala.usesGlobalOfficialFallback, true);
  assert.ok(guatemala.evidence.some(source => (
    source.id === 'catalog:correos-guatemala-postal-legal-framework' &&
    source.sourceRole === 'legal-framework-only' &&
    source.validationReadiness === 'metadata-only'
  )));
});

test('derives continents from relative address-format paths', () => {
  assert.equal(getPostalSourceContinent('africa/western_africa/NG.json'), 'africa');
  assert.equal(getPostalSourceContinent('americas/north_america/US.json'), 'americas');
  assert.equal(getPostalSourceContinent('asia/east_asia/JP.json'), 'asia');
  assert.equal(getPostalSourceContinent('europe/western_europe/FR.json'), 'europe');
  assert.equal(getPostalSourceContinent('oceania/australia_and_new_zealand/AU.json'), 'oceania');
  assert.equal(getPostalSourceContinent('antarctica/antarctica/AQ.json'), 'antarctica');
  assert.equal(getPostalSourceContinent('special/disputed/BT_T.json'), 'special');
});
