import assert from 'node:assert/strict';
import { readdirSync,readFileSync } from 'node:fs';
import { basename,join,relative } from 'node:path';
import { test } from 'node:test';
import { parse } from 'yaml';

type AddressField = {
  key: string;
  required?: boolean;
};

type LanguageAddressFormat = {
  addressFormat?: string;
  fields?: AddressField[];
};

type AddressFormat = {
  countryCode: string;
  name: string;
  native?: LanguageAddressFormat;
  english?: LanguageAddressFormat;
  domestic?: Record<string, LanguageAddressFormat>;
  international?: Record<string, LanguageAddressFormat>;
  postalCode?: { regex?: string };
  addressRules?: {
    languages?: { code: string; name: string }[];
    postalCode?: { required?: boolean; usage?: string } | null;
    openSourceIds?: string[];
  };
  openSourceIds?: string[];
};

const africaDir = join(process.cwd(), 'src', 'data', 'address_formats', 'africa');
const requiredOpenSourceIds = ['osm-nominatim', 'openaddresses', 'geonames-postal'];

function collectFiles(extension: '.json' | '.yaml', dir = africaDir): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(extension, fullPath));
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function loadAddressFormat(filePath: string): AddressFormat {
  const raw = readFileSync(filePath, 'utf8');
  if (filePath.endsWith('.yaml')) return parse(raw) as AddressFormat;
  return JSON.parse(raw) as AddressFormat;
}

function listLanguageFormats(format: AddressFormat): [string, LanguageAddressFormat][] {
  const languageFormats: [string, LanguageAddressFormat][] = [];

  if (format.native) languageFormats.push(['native', format.native]);
  if (format.english) languageFormats.push(['english', format.english]);

  for (const [code, languageFormat] of Object.entries(format.domestic ?? {})) {
    languageFormats.push([`domestic.${code}`, languageFormat]);
  }

  for (const [code, languageFormat] of Object.entries(format.international ?? {})) {
    languageFormats.push([`international.${code}`, languageFormat]);
  }

  return languageFormats;
}

function shouldRequirePostcode(format: AddressFormat): boolean {
  const postalRule = format.addressRules?.postalCode;
  return Boolean(postalRule?.required || postalRule?.usage === 'required');
}

test('Africa address formats have renderable language tabs and open postal/geographic evidence', () => {
  const jsonFiles = collectFiles('.json');
  assert.equal(jsonFiles.length, 64);

  for (const filePath of jsonFiles) {
    const format = loadAddressFormat(filePath);
    const relativePath = relative(africaDir, filePath).replace(/\\/g, '/');
    const expectedCountryCode = basename(filePath, '.json');

    assert.equal(format.countryCode, expectedCountryCode, `${relativePath} countryCode should match filename`);
    assert.ok(format.name, `${format.countryCode} should define a display name`);
    assert.ok(format.native?.addressFormat, `${format.countryCode} should define a native address template`);
    assert.ok(format.english?.addressFormat, `${format.countryCode} should define an English address template`);
    assert.ok(
      (format.addressRules?.languages?.length ?? 0) > 0,
      `${format.countryCode} should define address language metadata`,
    );

    if (format.postalCode?.regex) {
      assert.doesNotThrow(
        () => new RegExp(format.postalCode?.regex),
        `${format.countryCode} postal regex should compile`,
      );
    }

    const sourceIds = new Set([...(format.openSourceIds ?? []), ...(format.addressRules?.openSourceIds ?? [])]);
    for (const sourceId of requiredOpenSourceIds) {
      assert.ok(sourceIds.has(sourceId), `${format.countryCode} should expose ${sourceId}`);
    }
  }
});

test('Africa postal-code-required rules are reflected in every address language tab', () => {
  const files = [...collectFiles('.json'), ...collectFiles('.yaml')];
  assert.equal(files.length, 127);

  for (const filePath of files) {
    const format = loadAddressFormat(filePath);
    if (!shouldRequirePostcode(format)) continue;

    const relativePath = relative(africaDir, filePath).replace(/\\/g, '/');
    for (const [languageKey, languageFormat] of listLanguageFormats(format)) {
      const postcodeField = languageFormat.fields?.find(field => field.key === 'postcode');
      assert.ok(postcodeField, `${relativePath} ${languageKey} should include a postcode field`);
      assert.equal(
        postcodeField.required,
        true,
        `${relativePath} ${languageKey} postcode should be required when postal metadata is required`,
      );
    }
  }
});
