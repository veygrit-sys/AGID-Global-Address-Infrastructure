import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import {
  buildExternalOssGeoPostalIntegrationPlans,
  summarizeExternalOssGeoPostalIntegrationPlans,
} from '../src/lib/externalOssGeoPostalIntegration';

const ADDRESS_FORMAT_ROOT = join(process.cwd(), 'src', 'data', 'address_formats');
const REPORT_PATH = join(process.cwd(), 'test-results', 'external-oss-geo-postal-integration.json');

function walkJsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walkJsonFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

function loadAddressFormats() {
  return walkJsonFiles(ADDRESS_FORMAT_ROOT).map(file => ({
    relativePath: relative(ADDRESS_FORMAT_ROOT, file),
    format: JSON.parse(readFileSync(file, 'utf8')),
  }));
}

const plans = buildExternalOssGeoPostalIntegrationPlans(loadAddressFormats());
const summary = summarizeExternalOssGeoPostalIntegrationPlans(plans);

mkdirSync(dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, JSON.stringify({
  generatedAt: new Date().toISOString(),
  summary,
  plans,
}, null, 2));

console.log(JSON.stringify({
  ...summary,
  reportPath: REPORT_PATH,
}, null, 2));
