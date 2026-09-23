import assert from 'node:assert/strict';
import { mkdtemp,readFile,rm,stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { AGID_SDK_TARGETS,generateAgidSdks } from './generate-agid-sdks';

test('generates every requested AGID SDK package target', async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), 'agid-sdks-'));

  try {
    const result = await generateAgidSdks(outputDir);

    assert.deepEqual(result.targets.map(target => target.id), AGID_SDK_TARGETS.map(target => target.id));

    for (const target of AGID_SDK_TARGETS) {
      const targetPath = path.join(outputDir, target.directory);
      assert.equal((await stat(targetPath)).isDirectory(), true);
    }
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test('writes shared spec, manifests, and API files for publishable SDKs', async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), 'agid-sdks-'));

  try {
    await generateAgidSdks(outputDir);

    const spec = await readFile(path.join(outputDir, 'agid-spec', 'agid-spec.json'), 'utf8');
    assert.match(spec, /"base32Alphabet": "0123456789ABCDEFGHJKMNPQRSTVWXYZ"/);
    assert.match(spec, /"hashLength": 10/);
    assert.match(spec, /"totalLength": 12/);
    assert.match(spec, /"profile": "agid-public-security-v1"/);
    assert.match(spec, /"sdkValidationApi"/);
    assert.match(spec, /"validateAgid\(agid\) -> AgidValidationResult"/);
    assert.match(spec, /"version": "agid-grid-neighborhood-v0.1"/);
    assert.match(spec, /"publicIdentity": "canonical AGID \+ opaque buildingId"/);
    assert.match(spec, /"syntheticVectorCount": 10000/);
    assert.match(spec, /"adjacentCells\(agid\) -> AgidAdjacentCell\[\]"/);

    const rustManifest = await readFile(path.join(outputDir, 'agid-rs', 'Cargo.toml'), 'utf8');
    assert.match(rustManifest, /name = "agid"/);

    const cHeader = await readFile(path.join(outputDir, 'agid-c', 'include', 'agid.h'), 'utf8');
    assert.match(cHeader, /agid_encode/);
    assert.match(cHeader, /agid_decode/);

    const jsManifest = await readFile(path.join(outputDir, 'agid-js-ts', 'package.json'), 'utf8');
    assert.match(jsManifest, /"name": "@agid\/agid"/);
    const jsSource = await readFile(path.join(outputDir, 'agid-js-ts', 'src', 'index.ts'), 'utf8');
    assert.match(jsSource, /AGID_SECURITY_PROFILE/);
    assert.match(jsSource, /function normalizeAgid/);
    assert.match(jsSource, /function isValidAgid/);
    assert.match(jsSource, /function validateAgid/);

    const pyManifest = await readFile(path.join(outputDir, 'agid-py', 'pyproject.toml'), 'utf8');
    assert.match(pyManifest, /name = "agid"/);

    const javaManifest = await readFile(path.join(outputDir, 'agid-java', 'pom.xml'), 'utf8');
    assert.match(javaManifest, /<artifactId>agid<\/artifactId>/);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test('writes a multi-language SDK target matrix and per-language manifests', async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), 'agid-sdks-'));

  try {
    await generateAgidSdks(outputDir);

    const matrix = JSON.parse(await readFile(path.join(outputDir, 'agid-spec', 'sdk-targets.json'), 'utf8'));
    assert.equal(matrix.version, '1.0.0');
    assert.equal(matrix.targets.length, AGID_SDK_TARGETS.length);
    assert.deepEqual(
      matrix.targets.map((target: { id: string }) => target.id),
      AGID_SDK_TARGETS.map(target => target.id),
    );
    assert.equal(new Set(matrix.targets.map((target: { directory: string }) => target.directory)).size, matrix.targets.length);

    for (const target of AGID_SDK_TARGETS) {
      const manifest = JSON.parse(await readFile(path.join(outputDir, target.directory, 'agid-sdk.json'), 'utf8'));
      assert.equal(manifest.id, target.id);
      assert.equal(manifest.language, target.language);
      assert.equal(manifest.packageName, target.packageName);
      assert.equal(typeof manifest.packageManager, 'string');
      assert.equal(typeof manifest.testCommand, 'string');
      assert.ok(manifest.conformance.requiredApis.includes('validateAgid'));
      assert.equal(manifest.securityBoundary.publicAgidOnly, true);

      const readme = await readFile(path.join(outputDir, target.directory, 'README.md'), 'utf8');
      assert.match(readme, /SDK Target Matrix/);
      assert.match(readme, /Release Gate/);
    }
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test('includes additional ecosystem SDKs for desktop, mobile, data, and systems users', () => {
  assert.deepEqual(
    AGID_SDK_TARGETS
      .filter(target => target.id.startsWith('agid-'))
      .map(target => target.id),
    [
      'agid-spec',
      'agid-rs',
      'agid-c',
      'agid-cpp',
      'agid-wasm',
      'agid-js-ts',
      'agid-py',
      'agid-go',
      'agid-swift',
      'agid-kotlin',
      'agid-java',
      'agid-php',
      'agid-dotnet',
      'agid-ruby',
      'agid-dart',
      'agid-r',
      'agid-julia',
      'agid-elixir',
      'agid-lua',
      'agid-zig',
      'agid-nim',
    ]
  );
});

test('generates encode/decode/cellBounds parity tests for every publishable SDK language', async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), 'agid-sdks-'));

  const expectedParityFiles: Record<string, string> = {
    'agid-rs': 'tests/parity.rs',
    'agid-c': 'tests/parity.c',
    'agid-cpp': 'tests/parity.cpp',
    'agid-wasm': 'test/parity.test.ts',
    'agid-js-ts': 'test/parity.test.ts',
    'agid-py': 'tests/test_parity.py',
    'agid-go': 'agid_parity_test.go',
    'agid-swift': 'Tests/AGIDTests/AGIDParityTests.swift',
    'agid-kotlin': 'src/test/kotlin/org/agid/AgidParityTest.kt',
    'agid-java': 'src/test/java/org/agid/AgidParityTest.java',
    'agid-php': 'tests/ParityTest.php',
    'agid-dotnet': 'tests/AgidParityTests.cs',
    'agid-ruby': 'test/test_parity.rb',
    'agid-dart': 'test/agid_parity_test.dart',
    'agid-r': 'tests/testthat/test-parity.R',
    'agid-julia': 'test/runtests.jl',
    'agid-elixir': 'test/agid_parity_test.exs',
    'agid-lua': 'test/parity_test.lua',
    'agid-zig': 'src/agid_parity_test.zig',
    'agid-nim': 'tests/test_parity.nim',
  };

  try {
    await generateAgidSdks(outputDir);

    const vectors = JSON.parse(await readFile(path.join(outputDir, 'agid-spec', 'test-vectors.json'), 'utf8'));
    assert.ok(vectors.length >= 3);
    for (const vector of vectors) {
      assert.equal(typeof vector.expected.id, 'string');
      assert.equal(vector.expected.id.length, 12);
      assert.equal(typeof vector.expected.decoded.lat, 'number');
      assert.equal(typeof vector.expected.decoded.lon, 'number');
      assert.equal(typeof vector.expected.cellBounds.minLat, 'number');
      assert.equal(typeof vector.expected.cellBounds.maxLat, 'number');
      assert.equal(typeof vector.expected.cellBounds.minLon, 'number');
      assert.equal(typeof vector.expected.cellBounds.maxLon, 'number');
    }

    for (const [target, relativeFile] of Object.entries(expectedParityFiles)) {
      const paritySource = await readFile(path.join(outputDir, target, relativeFile), 'utf8');
      assert.match(paritySource, /encode/i, `${target} parity test should cover encode`);
      assert.match(paritySource, /decode/i, `${target} parity test should cover decode`);
      assert.match(paritySource, /cellBounds/i, `${target} parity test should cover cellBounds`);
      assert.match(paritySource, /test-vectors\.json|PARITY_VECTORS|parityVectors/i, `${target} parity test should use shared vectors`);
    }
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});
