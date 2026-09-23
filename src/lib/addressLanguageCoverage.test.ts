import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { COUNTRIES } from '../constants/countries';
import { buildRegistrationAddressLanguageTabs } from './addressRegistrationState';
import { isEnglishAddressCountry } from './languageTabs';

function collectAddressFormatJsonFiles(dir: string, files: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectAddressFormatJsonFiles(filePath, files);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.json')) files.push(filePath);
  }

  return files;
}

function loadAddressFormatsByCode() {
  const addressFormatDir = path.join(process.cwd(), 'src', 'data', 'address_formats');
  const formatsByCode = new Map<string, unknown[]>();

  for (const filePath of collectAddressFormatJsonFiles(addressFormatDir)) {
    const format = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { countryCode?: string };
    const code = String(format.countryCode || path.basename(filePath, '.json')).toUpperCase();
    formatsByCode.set(code, [...(formatsByCode.get(code) || []), format]);
  }

  return formatsByCode;
}

test('all supported countries expose native or domestic address tabs plus international English', () => {
  const formatsByCode = loadAddressFormatsByCode();
  const failures: string[] = [];

  for (const country of COUNTRIES) {
    const code = country.code.toUpperCase();
    const format = formatsByCode.get(code)?.[0] as Parameters<typeof buildRegistrationAddressLanguageTabs>[0];

    if (!format) {
      failures.push(`${code}: missing address format`);
      continue;
    }

    const tabs = buildRegistrationAddressLanguageTabs(format, code).map(tab => tab.code);
    if (!tabs.includes('en')) failures.push(`${code}: missing international English tab`);

    if (isEnglishAddressCountry(code.toLowerCase())) {
      if (!tabs.includes('en_domestic')) failures.push(`${code}: missing domestic English tab`);
      continue;
    }

    if (!tabs.some(tab => tab !== 'en' && tab !== 'en_domestic')) {
      failures.push(`${code}: missing native/local address tab`);
    }
  }

  assert.deepEqual(failures, []);
});
