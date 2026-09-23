import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { hydrateAddressFormat } from '../data/address_formats/addressFormatCommon';
import type { AddressFormat } from '../data/address_formats';

type AddressFormatCache = {
  byCode: Map<string, AddressFormat>;
  fileCount: number;
  loadedAt: number;
};

const ADDRESS_FORMAT_ROOT = join(process.cwd(), 'src', 'data', 'address_formats');

let cache: AddressFormatCache | null = null;

function normalizeCountryCode(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .replace(/^UK$/u, 'GB');
}

function walkJsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory()
      ? walkJsonFiles(path)
      : path.endsWith('.json')
        ? [path]
        : [];
  });
}

function loadAddressFormatCache(): AddressFormatCache {
  if (cache) return cache;

  const byCode = new Map<string, AddressFormat>();
  const fallbackByCountryCode = new Map<string, AddressFormat>();
  const files = walkJsonFiles(ADDRESS_FORMAT_ROOT);

  for (const file of files) {
    try {
      const raw = JSON.parse(readFileSync(file, 'utf8')) as AddressFormat;
      const format = hydrateAddressFormat(raw);
      const fileCode = normalizeCountryCode(file.split(/[\\/]/u).pop()?.replace(/\.json$/u, ''));
      const countryCode = normalizeCountryCode(format.countryCode || fileCode);
      if (!countryCode) continue;

      if (fileCode && !byCode.has(fileCode)) {
        byCode.set(fileCode, format);
      }

      const isPrimaryCountryFile = fileCode === countryCode || !/[-_]/u.test(fileCode);
      if (isPrimaryCountryFile) {
        byCode.set(countryCode, format);
      } else if (!fallbackByCountryCode.has(countryCode)) {
        fallbackByCountryCode.set(countryCode, format);
      }
    } catch {
      // Keep the server usable even when one experimental country file is malformed.
    }
  }

  for (const [countryCode, format] of fallbackByCountryCode.entries()) {
    if (!byCode.has(countryCode)) {
      byCode.set(countryCode, format);
    }
  }

  cache = {
    byCode,
    fileCount: files.length,
    loadedAt: Date.now(),
  };
  return cache;
}

export function getServerAddressFormat(countryCode: unknown): AddressFormat | null {
  const code = normalizeCountryCode(countryCode);
  if (!code) return null;

  const { byCode } = loadAddressFormatCache();
  return byCode.get(code) || byCode.get(code.split(/[-_]/u)[0]) || null;
}

export function getServerAddressFormatCoverage() {
  const current = loadAddressFormatCache();
  return {
    fileCount: current.fileCount,
    countryCodes: [...current.byCode.keys()].sort(),
    loadedAt: current.loadedAt,
  };
}
