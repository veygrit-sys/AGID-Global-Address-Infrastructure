import assert from 'node:assert/strict';
import { readdirSync,readFileSync,statSync } from 'node:fs';
import { join,relative } from 'node:path';
import { test } from 'node:test';

import { AFRICA_OPEN_GEO_SOURCES } from './africaOpenGeoSources';
import { AMERICAS_OPEN_GEO_SOURCES } from './americasOpenGeoSources';
import { ASIA_OPEN_GEO_SOURCES } from './asiaOpenGeoSources';
import { EUROPE_OPEN_GEO_SOURCES } from './europeOpenGeoSources';
import { OCEANIA_OPEN_GEO_SOURCES } from './oceaniaOpenGeoSources';
import { POLAR_OPEN_GEO_SOURCES } from './polarOpenGeoSources';
import { LICENSE_REVIEW_REQUIRED,resolveSourceLicenseStatus } from './sourceLicensePolicy';
import { SPACE_AGENCY_OPEN_GEO_SOURCES } from './spaceAgencyOpenGeoSources';

type SourceRecord = {
  url: string;
  kind: string;
  license?: string;
};

const SOURCE_REGISTRY: Record<string, SourceRecord> = {
  ...AFRICA_OPEN_GEO_SOURCES,
  ...AMERICAS_OPEN_GEO_SOURCES,
  ...ASIA_OPEN_GEO_SOURCES,
  ...EUROPE_OPEN_GEO_SOURCES,
  ...OCEANIA_OPEN_GEO_SOURCES,
  ...POLAR_OPEN_GEO_SOURCES,
  ...SPACE_AGENCY_OPEN_GEO_SOURCES,
};

type AddressFormatFile = {
  countryCode: string;
  name: string;
  openSourceIds?: string[];
  postalCode?: {
    api?: string | null;
    source?: string | null;
  };
  addressRules?: {
    openSourceIds?: string[];
    postalCode?: {
      required: boolean;
      usage: string;
    } | null;
  };
};

function walkJsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walkJsonFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

function isCleanHttpUrl(value: string) {
  return /^https?:\/\//.test(value) && !/(utm_source=chatgpt|share\.google|nothing)/i.test(value);
}

test('postal APIs and open-source ids are registered with clean testable URLs', () => {
  const root = join(process.cwd(), 'src', 'data', 'address_formats');
  const failures: string[] = [];
  const files = walkJsonFiles(root);

  for (const file of files) {
    const format = JSON.parse(readFileSync(file, 'utf8')) as AddressFormatFile;
    const sourceIds = new Set([
      ...(format.openSourceIds ?? []),
      ...(format.addressRules?.openSourceIds ?? []),
    ]);

    if (format.postalCode?.api && !isCleanHttpUrl(format.postalCode.api)) {
      failures.push(`${relative(root, file)} has invalid postalCode.api: ${format.postalCode.api}`);
    }

    for (const sourceId of sourceIds) {
      const source = SOURCE_REGISTRY[sourceId];
      if (!source) {
        failures.push(`${relative(root, file)} references unregistered openSourceId: ${sourceId}`);
        continue;
      }

      if (!isCleanHttpUrl(source.url)) {
        failures.push(`${relative(root, file)} references source with invalid URL: ${sourceId} -> ${source.url}`);
      }

      const licenseStatus = resolveSourceLicenseStatus(source);
      if (!licenseStatus.label.trim()) {
        failures.push(`${relative(root, file)} references source without license audit status: ${sourceId}`);
      }
    }

    if (format.addressRules?.postalCode?.required) {
      const hasPostalEvidence =
        Boolean(format.postalCode?.api || format.postalCode?.source) ||
        [...sourceIds].some(sourceId => SOURCE_REGISTRY[sourceId]?.kind === 'postal-code');

      if (!hasPostalEvidence) {
        failures.push(`${relative(root, file)} requires postal codes but has no postal API/source evidence`);
      }
    }
  }

  assert.deepEqual(failures, []);
});

test('source license policy keeps missing licenses out of redistributable data packs', () => {
  const status = resolveSourceLicenseStatus({ url: 'https://example.test/source', kind: 'postal-code' });

  assert.equal(status.label, LICENSE_REVIEW_REQUIRED);
  assert.equal(status.redistributable, false);
  assert.equal(status.requiresReview, true);
});
