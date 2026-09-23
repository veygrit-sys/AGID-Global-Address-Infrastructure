import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';

import {
  OPEN_SOURCE_DOWNLOAD_FILES,
  buildOpenSourceDownloads,
  type OpenSourceDownloadManifest,
} from './build-open-source-downloads.ts';

type ZipEntry = { entryName: string };
type ZipReader = {
  getEntries: () => ZipEntry[];
  readAsText: (entryName: string) => string;
};

const require = createRequire(import.meta.url);
const AdmZip = require('adm-zip') as new (filePath: string) => ZipReader;

function sha256File(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

test('open-source download builder creates zip packs and checksum manifest', () => {
  const outputDir = mkdtempSync(join(tmpdir(), 'agid-open-source-downloads-'));

  try {
    const manifest = buildOpenSourceDownloads({
      outputDir,
      generatedAt: '2026-06-26T00:00:00.000Z',
    });
    const manifestPath = join(outputDir, OPEN_SOURCE_DOWNLOAD_FILES.manifest);

    assert.equal(manifest.generatedAt, '2026-06-26T00:00:00.000Z');
    assert.equal(manifest.policy.appBundleSourceZip, false);
    assert.equal(manifest.policy.rawAddressMaterial, 'excluded-by-path-policy');
    assert.equal(manifest.sourceArchive.appBundle, false);
    assert.match(manifest.sourceArchive.href, /github\.com\/dawnportinfo-design\/Adreess-Grid-ID\/archive\/refs\/heads\/main\.zip/);
    assert.equal(manifest.files.length, 2);
    assert.equal(existsSync(manifestPath), true);

    const persisted = JSON.parse(readFileSync(manifestPath, 'utf8')) as OpenSourceDownloadManifest;
    assert.deepEqual(
      persisted.files.map(file => file.fileName).sort(),
      [OPEN_SOURCE_DOWNLOAD_FILES.sdkPack, OPEN_SOURCE_DOWNLOAD_FILES.specConformance].sort(),
    );

    for (const file of manifest.files) {
      const zipPath = join(outputDir, file.fileName);
      assert.equal(existsSync(zipPath), true);
      assert.equal(file.href, `/downloads/${file.fileName}`);
      assert.equal(file.containsRawAddressMaterial, false);
      assert.equal(file.sha256, sha256File(zipPath));
      assert.ok(file.size > 100);
    }
  } finally {
    rmSync(outputDir, { force: true, recursive: true });
  }
});

test('open-source download packs include SDK/spec assets and exclude unsafe material paths', () => {
  const outputDir = mkdtempSync(join(tmpdir(), 'agid-open-source-downloads-'));
  const unsafeEntryPattern = /(?:node_modules|dist|\.git|raw[-_]?address|recipient[-_]?fixture|private[-_]?key|proof[-_]?code|witness|secret)/i;

  try {
    buildOpenSourceDownloads({
      outputDir,
      generatedAt: '2026-06-26T00:00:00.000Z',
    });

    const sdkZip = new AdmZip(join(outputDir, OPEN_SOURCE_DOWNLOAD_FILES.sdkPack));
    const specZip = new AdmZip(join(outputDir, OPEN_SOURCE_DOWNLOAD_FILES.specConformance));
    const sdkEntries = sdkZip.getEntries().map(entry => entry.entryName);
    const specEntries = specZip.getEntries().map(entry => entry.entryName);

    assert.ok(sdkEntries.includes('DOWNLOAD-MANIFEST.json'));
    assert.ok(sdkEntries.some(entry => entry.startsWith('sdk/agid-js-ts/')));
    assert.ok(sdkEntries.some(entry => entry.startsWith('sdk/agid-rs/')));
    assert.equal(sdkEntries.some(entry => entry.startsWith('sdk/agid-spec/')), false);

    assert.ok(specEntries.includes('DOWNLOAD-MANIFEST.json'));
    assert.ok(specEntries.includes('sdk/agid-spec/agid-spec.json'));
    assert.ok(specEntries.includes('sdk/agid-spec/sdk-targets.json'));
    assert.ok(specEntries.includes('data/agid_resolver_conformance/manifest.json'));
    assert.ok(specEntries.some(entry => entry.endsWith('/agid-parity-vectors.json')));
    assert.equal(specEntries.some(entry => entry.startsWith('data/address_test_vectors/')), false);

    for (const entryName of [...sdkEntries, ...specEntries]) {
      assert.doesNotMatch(entryName, unsafeEntryPattern);
    }

    const packManifest = JSON.parse(sdkZip.readAsText('DOWNLOAD-MANIFEST.json')) as { containsRawAddressMaterial: boolean };
    assert.equal(packManifest.containsRawAddressMaterial, false);
  } finally {
    rmSync(outputDir, { force: true, recursive: true });
  }
});
