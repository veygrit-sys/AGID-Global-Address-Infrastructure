import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AGID_BASE32_ALPHABET,
  AGID_FACE_AXIS_BITS,
  AGID_FACE_AXIS_DIVISIONS,
  AGID_FACE_COUNT,
  AGID_HASH_BITS,
  AGID_HASH_LENGTH,
  AGID_PACKED_BITS_USED_NUMBER,
  AGID_PREFIX_LENGTH,
  AGID_SPEC_SECURITY_PROFILE,
  AGID_TOTAL_LENGTH,
} from '../src/lib/agidContract';

export type AgidSdkTarget = {
  id: string;
  directory: string;
  language: string;
  packageName: string;
  ecosystem: 'canonical-spec' | 'systems' | 'web' | 'server' | 'mobile' | 'enterprise' | 'data' | 'scripting';
  packageManager: string;
  runtime: string;
  testCommand: string;
  primaryUse: string;
};

export const AGID_SDK_VERSION = '1.0.0';
const AGID_LUA_ROCKSPEC_VERSION = `${AGID_SDK_VERSION}-1`;

export const AGID_SDK_TARGETS: AgidSdkTarget[] = [
  { id: 'agid-spec', directory: 'agid-spec', language: 'Spec', packageName: 'agid-spec', ecosystem: 'canonical-spec', packageManager: 'none', runtime: 'language-neutral', testCommand: 'Use generated SDK parity tests', primaryUse: 'Canonical AGID contract and parity vectors' },
  { id: 'agid-rs', directory: 'agid-rs', language: 'Rust', packageName: 'agid', ecosystem: 'systems', packageManager: 'Cargo', runtime: 'Rust 2021', testCommand: 'cargo test', primaryUse: 'Native core, servers, embedded, and FFI' },
  { id: 'agid-c', directory: 'agid-c', language: 'C', packageName: 'agid-c', ecosystem: 'systems', packageManager: 'CMake/manual', runtime: 'C11', testCommand: 'cc tests/parity.c src/agid.c -Iinclude -lm && ./a.out', primaryUse: 'C ABI and embedded integrations' },
  { id: 'agid-cpp', directory: 'agid-cpp', language: 'C++', packageName: 'agid-cpp', ecosystem: 'systems', packageManager: 'CMake/manual', runtime: 'C++17', testCommand: 'c++ tests/parity.cpp src/agid.cpp -Iinclude -std=c++17 && ./a.out', primaryUse: 'GIS engines, desktop, and native route systems' },
  { id: 'agid-wasm', directory: 'agid-wasm', language: 'WebAssembly', packageName: '@agid/wasm', ecosystem: 'web', packageManager: 'npm', runtime: 'WASM + TypeScript', testCommand: 'npm test', primaryUse: 'Browser and edge runtime bindings' },
  { id: 'agid-js-ts', directory: 'agid-js-ts', language: 'JavaScript/TypeScript', packageName: '@agid/agid', ecosystem: 'web', packageManager: 'npm', runtime: 'Node.js / browser', testCommand: 'npm test', primaryUse: 'Web apps, Node.js, and developer tooling' },
  { id: 'agid-py', directory: 'agid-py', language: 'Python', packageName: 'agid', ecosystem: 'data', packageManager: 'pip/uv', runtime: 'Python >=3.10', testCommand: 'python -m pytest', primaryUse: 'Data pipelines, GIS notebooks, and backend automation' },
  { id: 'agid-go', directory: 'agid-go', language: 'Go', packageName: 'github.com/agid/agid-go', ecosystem: 'server', packageManager: 'Go modules', runtime: 'Go >=1.22', testCommand: 'go test ./...', primaryUse: 'Server services and delivery APIs' },
  { id: 'agid-swift', directory: 'agid-swift', language: 'Swift', packageName: 'AGID', ecosystem: 'mobile', packageManager: 'Swift Package Manager', runtime: 'Swift 5.9', testCommand: 'swift test', primaryUse: 'iOS, macOS, and Apple platform apps' },
  { id: 'agid-kotlin', directory: 'agid-kotlin', language: 'Kotlin', packageName: 'org.agid:agid-kotlin', ecosystem: 'mobile', packageManager: 'Gradle', runtime: 'Kotlin/JVM', testCommand: './gradlew test', primaryUse: 'Android and JVM services' },
  { id: 'agid-java', directory: 'agid-java', language: 'Java', packageName: 'org.agid:agid', ecosystem: 'enterprise', packageManager: 'Maven', runtime: 'Java >=17', testCommand: 'mvn test', primaryUse: 'Enterprise JVM and Android-compatible integrations' },
  { id: 'agid-php', directory: 'agid-php', language: 'PHP', packageName: 'agid/agid', ecosystem: 'server', packageManager: 'Composer', runtime: 'PHP >=8.2', testCommand: 'vendor/bin/phpunit', primaryUse: 'Commerce and CMS integrations' },
  { id: 'agid-dotnet', directory: 'agid-dotnet', language: 'C#/.NET', packageName: 'Agid', ecosystem: 'enterprise', packageManager: 'NuGet/dotnet', runtime: '.NET 8', testCommand: 'dotnet test', primaryUse: 'Enterprise, Windows, POS, and hotel systems' },
  { id: 'agid-ruby', directory: 'agid-ruby', language: 'Ruby', packageName: 'agid', ecosystem: 'server', packageManager: 'RubyGems/Bundler', runtime: 'Ruby >=3.0', testCommand: 'bundle exec ruby test/test_parity.rb', primaryUse: 'Rails and scripting integrations' },
  { id: 'agid-dart', directory: 'agid-dart', language: 'Dart', packageName: 'agid', ecosystem: 'mobile', packageManager: 'pub', runtime: 'Dart >=3.0', testCommand: 'dart test', primaryUse: 'Flutter and Dart services' },
  { id: 'agid-r', directory: 'agid-r', language: 'R', packageName: 'agid', ecosystem: 'data', packageManager: 'R package', runtime: 'R >=4.1', testCommand: 'Rscript -e \"testthat::test_dir(\\\"tests/testthat\\\")\"', primaryUse: 'Statistics, research, and geospatial analysis' },
  { id: 'agid-julia', directory: 'agid-julia', language: 'Julia', packageName: 'AGID', ecosystem: 'data', packageManager: 'Pkg', runtime: 'Julia >=1.9', testCommand: 'julia --project=. -e \"using Pkg; Pkg.test()\"', primaryUse: 'Scientific computing and routing research' },
  { id: 'agid-elixir', directory: 'agid-elixir', language: 'Elixir', packageName: 'agid', ecosystem: 'server', packageManager: 'mix/Hex', runtime: 'Elixir >=1.15', testCommand: 'mix test', primaryUse: 'Concurrent services and realtime systems' },
  { id: 'agid-lua', directory: 'agid-lua', language: 'Lua', packageName: 'agid', ecosystem: 'scripting', packageManager: 'LuaRocks', runtime: 'Lua >=5.4', testCommand: 'lua test/parity_test.lua', primaryUse: 'Embedded scripting and lightweight devices' },
  { id: 'agid-zig', directory: 'agid-zig', language: 'Zig', packageName: 'agid', ecosystem: 'systems', packageManager: 'Zig build', runtime: 'Zig >=0.12', testCommand: 'zig test src/agid_parity_test.zig', primaryUse: 'Systems programming and small binaries' },
  { id: 'agid-nim', directory: 'agid-nim', language: 'Nim', packageName: 'agid', ecosystem: 'systems', packageManager: 'nimble', runtime: 'Nim >=2.0', testCommand: 'nimble test', primaryUse: 'Native tooling and compact services' },
];

const parityTestVectors = [
  {
    name: 'Tokyo Station',
    lat: 35.681236,
    lon: 139.767125,
    expected: {
      id: 'JP05AV8TJGHD',
      prefix: 'JP',
      hash: '05AV8TJGHD',
      face: 1,
      qx: 111082,
      qy: 2056297,
      decoded: {
        lat: 35.68121961131576,
        lon: 139.76712226867676,
      },
      cellBounds: {
        minLat: 35.68121961131576,
        maxLat: 35.68127755465351,
        minLon: 139.76712226867676,
        maxLon: 139.767165184021,
      },
    },
  },
  {
    name: 'Null Island',
    lat: 0,
    lon: 0,
    expected: {
      id: '3B0200000000',
      prefix: '3B',
      hash: '0200000000',
      face: 0,
      qx: 1048576,
      qy: 1048576,
      decoded: {
        lat: 0,
        lon: 0,
      },
      cellBounds: {
        minLat: 0,
        maxLat: 0.00004291534423828125,
        minLon: 0,
        maxLon: 0.00004291534423828125,
      },
    },
  },
  {
    name: 'New York City',
    lat: 40.7128,
    lon: -74.006,
    expected: {
      id: 'US0ECWVG02V9',
      prefix: 'US',
      hash: '0ECWVG02V9',
      face: 3,
      qx: 1421263,
      qy: 2023382,
      decoded: {
        lat: 40.712787854519725,
        lon: -74.00600910186768,
      },
      cellBounds: {
        minLat: 40.71278177280159,
        maxLat: 40.712830550646764,
        minLon: -74.00600910186768,
        maxLon: -74.00596618652344,
      },
    },
  },
];

const REQUIRED_SDK_APIS = [
  'encode',
  'decode',
  'cellBounds',
  'cellPolygon',
  'normalizeAgid',
  'isValidAgid',
  'validateAgid',
];

function sdkTargetMatrix() {
  return {
    version: AGID_SDK_VERSION,
    generatedFrom: 'scripts/generate-agid-sdks.ts',
    specPackage: 'agid-spec',
    releaseGate: 'A language SDK is publishable only after its generated parity tests pass against agid-spec/test-vectors.json.',
    requiredApis: REQUIRED_SDK_APIS,
    targets: AGID_SDK_TARGETS.map(target => ({
      id: target.id,
      directory: target.directory,
      language: target.language,
      packageName: target.packageName,
      ecosystem: target.ecosystem,
      packageManager: target.packageManager,
      runtime: target.runtime,
      testCommand: target.testCommand,
      primaryUse: target.primaryUse,
      releaseStatus: target.id === 'agid-spec' ? 'canonical-spec' : 'generated-scaffold',
    })),
  };
}

function sdkManifest(target: AgidSdkTarget) {
  return {
    schema: 'agid-sdk-manifest-v1',
    version: AGID_SDK_VERSION,
    id: target.id,
    directory: target.directory,
    language: target.language,
    packageName: target.packageName,
    ecosystem: target.ecosystem,
    packageManager: target.packageManager,
    runtime: target.runtime,
    testCommand: target.testCommand,
    primaryUse: target.primaryUse,
    generatedFrom: 'agid-spec/agid-spec.json',
    releaseStatus: target.id === 'agid-spec' ? 'canonical-spec' : 'generated-scaffold',
    conformance: {
      vectorFile: target.id === 'agid-spec' ? 'test-vectors.json' : 'agid-parity-vectors.json',
      requiredApis: REQUIRED_SDK_APIS,
      parityRequiredBeforePublish: target.id !== 'agid-spec',
      canonicalSpecPath: target.id === 'agid-spec' ? 'agid-spec.json' : '../agid-spec/agid-spec.json',
    },
    securityBoundary: {
      publicAgidOnly: true,
      forbiddenPublicFields: [
        'recipientName',
        'phoneNumber',
        'roomNumber',
        'unitNumber',
        'privateDeliveryInstruction',
        'ownerKey',
        'deviceKey',
        'aoidPrivatePayload',
        'encryptedAoidPayload',
      ],
    },
  };
}

const spec = {
  name: 'AGID',
  version: AGID_SDK_VERSION,
  precision: {
    projection: 'cubed-sphere-equal-area',
    faceCount: AGID_FACE_COUNT,
    faceAxisBits: AGID_FACE_AXIS_BITS,
    faceAxisDivisions: AGID_FACE_AXIS_DIVISIONS,
    hashBits: AGID_HASH_BITS,
    packedBitsUsed: AGID_PACKED_BITS_USED_NUMBER,
  },
  stringFormat: {
    prefixLength: AGID_PREFIX_LENGTH,
    hashLength: AGID_HASH_LENGTH,
    totalLength: AGID_TOTAL_LENGTH,
    base32Alphabet: AGID_BASE32_ALPHABET,
    landPrefix: 'ISO 3166-1 alpha-2 where available',
    openOceanPrefix: 'letter + number',
    coastalSeaPrefix: 'number + letter',
    otherPrefix: 'number + number',
  },
  neighborhood: {
    version: 'agid-grid-neighborhood-v0.1',
    topology: 'eight-neighbor',
    relations: [
      'same-cell',
      'edge-adjacent',
      'corner-adjacent',
      'separate',
      'invalid',
    ],
    calculation:
      'sample adjacent cell centers through the cubed sphere and re-encode',
    crossesFaceBoundaries: true,
    boundarySemantics:
      'same, edge-adjacent, and corner-adjacent cells may be accepted as the same-or-near area candidate',
    nonClaim:
      'proximity does not prove a shared building, entrance, traversable route, or delivery endpoint',
    extensionApi: [
      'adjacentCells(agid) -> AgidAdjacentCell[]',
      'gridNeighborhoodMatch(left, right) -> AgidGridNeighborhoodMatch',
    ],
  },
  addressReference: {
    version: 'agid-address-reference-v0.1',
    publicIdentity: 'canonical AGID + opaque buildingId',
    buildingIdPattern: '^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$',
    subPremiseClassification: 'private-sub-premise',
    subPremiseRetention: 'client-controlled',
    subPremiseExcludedFrom: [
      'AGID',
      'public reference key',
      'public building comparison',
      'public conformance vectors',
    ],
  },
  addressNormalizationBenchmark: {
    version: 'agid-address-normalization-benchmark-v0.1',
    syntheticVectorCount: 10000,
    boundaryCheckCount: 2000,
    subPremiseSeparationCheckCount: 1000,
    minimumNormalizationSuccessRate: 0.995,
    maximumBoundaryValueErrorRate: 0.001,
    maximumSubPremiseLeakageRate: 0,
    realWorldQualityClaim: false,
  },
  security: AGID_SPEC_SECURITY_PROFILE,
  api: [
    'encode(latitude, longitude) -> AgidResult',
    'decode(agid) -> AgidDecoded | null',
    'cellBounds(agid) -> bounds',
    'cellPolygon(agid) -> lon/lat polygon',
    'normalizeAgid(agid) -> canonical uppercase string | null',
    'isValidAgid(agid) -> boolean',
    'validateAgid(agid) -> AgidValidationResult',
  ],
  sdkTargets: sdkTargetMatrix().targets,
  testVectors: parityTestVectors,
};

type FileMap = Record<string, string>;

function json(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function readme(target: AgidSdkTarget) {
  return `# ${target.id}

${target.language} SDK package scaffold for AGID.

This package is generated from \`agid-spec/agid-spec.json\` so every language binding follows the same coordinate model, ID format, and public API.

## SDK Target Matrix

| Field | Value |
| --- | --- |
| Language | ${target.language} |
| Package | \`${target.packageName}\` |
| Ecosystem | ${target.ecosystem} |
| Package manager | ${target.packageManager} |
| Runtime | ${target.runtime} |
| Primary use | ${target.primaryUse} |
| Test command | \`${target.testCommand}\` |

The machine-readable target manifest is \`agid-sdk.json\`. The complete language matrix is published by \`agid-spec/sdk-targets.json\`.

## API

- \`encode(latitude, longitude)\`
- \`decode(agid)\`
- \`cellBounds(agid)\`
- \`cellPolygon(agid)\`
- \`normalizeAgid(agid)\`
- \`isValidAgid(agid)\`
- \`validateAgid(agid)\`

## Security Boundary

AGID is a public location/address/building-map-feature identifier. SDKs must keep recipient names, phone numbers, room or unit numbers, private delivery instructions, owner keys, device keys, AOID private payloads, and encrypted AOID payloads outside the public AGID contract. Validation helpers are generated so clients can reject malformed or unsafe public AGID strings before decode, QR, NFC, POS, registry, or resolver use.

## Status

This scaffold is ready for implementation work, but it is not ready for formal distribution until the generated encode/decode/cellBounds parity tests pass for this language. The canonical implementation is the existing TypeScript/Rust core in this repository; language implementations should use the shared spec and vectors in \`agid-spec\`.

## Release Gate

Before publishing this SDK, run \`${target.testCommand}\` and confirm every parity vector in \`agid-parity-vectors.json\` matches the canonical \`agid-spec/test-vectors.json\`.
`;
}

function commonFiles(target: AgidSdkTarget): FileMap {
  return {
    'README.md': readme(target),
    'LICENSE': 'MIT\n',
    'agid-sdk.json': json(sdkManifest(target)),
    'agid-parity-vectors.json': json(parityTestVectors),
  };
}

function specFiles(): FileMap {
  return {
    'README.md': `# agid-spec

\`agid-spec\` is the canonical language-neutral AGID specification package.

Use \`agid-spec.json\` as the contract for every generated AGID SDK package. Do not treat the web app UI, address registration flow, or private AOID records as the core AGID contract.

## SDK Target Matrix

\`sdk-targets.json\` lists every generated SDK language, package manager, test command, runtime target, and release status. Downstream CI should use that file instead of maintaining separate language lists.

## Canonical Artifacts

| File | Role |
| --- | --- |
| \`agid-spec.json\` | Normative AGID core contract: precision, projection assumptions, string format, API names, security boundary, and vector references. |
| \`test-vectors.json\` | Parity vectors for SDK implementations. |
| \`sdk-targets.json\` | Multi-language SDK release matrix. |
| \`agid-sdk.json\` | Manifest for the spec package itself. |

## SDK Parity Requirement

A generated SDK is not ready for formal distribution until it passes parity tests for:

- \`encode\`
- \`decode\`
- \`cellBounds\`
- \`normalizeAgid\`
- \`isValidAgid\`
- \`validateAgid\`

\`cellPolygon\` should also be implemented for map and GIS clients, but \`encode\`, \`decode\`, \`cellBounds\`, and the validation helpers are the minimum cross-language compatibility gate.

## Security Requirement

AGID is public by design, so SDK security focuses on integrity and strict parsing:

- trim and uppercase before validation,
- accept only the ${AGID_TOTAL_LENGTH}-character AGID format,
- reject hashes outside the AGID Base32 alphabet,
- reject packed values outside the ${AGID_PACKED_BITS_USED_NUMBER}-bit AGID range,
- reject face values outside \`0..${AGID_FACE_COUNT - 1}\`,
- never treat AGID as a container for recipient, phone, unit, room, private delivery, owner-key, device-key, or encrypted AOID payload fields.

Formal releases should publish checksums or detached signatures for \`agid-spec.json\`, \`test-vectors.json\`, generated SDK packages, and public data packs.

## Release Gate

Do not publish a language SDK until its \`agid-sdk.json\` manifest exists, its test command passes, and every required API listed in \`sdk-targets.json\` has parity coverage.
`,
    'agid-spec.json': json(spec),
    'sdk-targets.json': json(sdkTargetMatrix()),
    'agid-sdk.json': json(sdkManifest(AGID_SDK_TARGETS[0])),
    'test-vectors.json': json(spec.testVectors),
  };
}

function rustFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[1]),
    'Cargo.toml': `[package]
name = "agid"
version = "${AGID_SDK_VERSION}"
edition = "2021"
license = "MIT"
description = "AGID Rust SDK"

[lib]
name = "agid"
path = "src/lib.rs"
crate-type = ["rlib", "staticlib", "cdylib"]
`,
    'src/lib.rs': `pub const BASE32_ALPHABET: &str = "${AGID_BASE32_ALPHABET}";
pub const AGID_PREFIX_LENGTH: usize = ${AGID_PREFIX_LENGTH};
pub const AGID_HASH_LENGTH: usize = ${AGID_HASH_LENGTH};
pub const AGID_TOTAL_LENGTH: usize = ${AGID_TOTAL_LENGTH};

#[derive(Debug, Clone, PartialEq)]
pub struct AgidResult {
    pub id: String,
    pub lat: f64,
    pub lon: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct AgidBounds {
    pub min_lat: f64,
    pub max_lat: f64,
    pub min_lon: f64,
    pub max_lon: f64,
}

pub fn encode(_lat: f64, _lon: f64) -> Result<AgidResult, &'static str> {
    Err("wire the generated SDK to the agid-core reference implementation")
}

pub fn decode(_id: &str) -> Option<AgidResult> {
    None
}

pub fn cell_bounds(_id: &str) -> Result<AgidBounds, &'static str> {
    Err("wire the generated SDK to the agid-core reference implementation")
}
`,
  };
}

function cFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[2]),
    'include/agid.h': `#ifndef AGID_H
#define AGID_H

#ifdef __cplusplus
extern "C" {
#endif

#define AGID_PREFIX_LENGTH ${AGID_PREFIX_LENGTH}
#define AGID_HASH_LENGTH ${AGID_HASH_LENGTH}
#define AGID_TOTAL_LENGTH ${AGID_TOTAL_LENGTH}

typedef struct agid_result {
  char id[AGID_TOTAL_LENGTH + 1];
  double lat;
  double lon;
  int face;
} agid_result;

typedef struct agid_bounds {
  double min_lat;
  double max_lat;
  double min_lon;
  double max_lon;
} agid_bounds;

int agid_encode(double lat, double lon, agid_result* out);
int agid_decode(const char* id, agid_result* out);
int agid_cell_bounds(const char* id, agid_bounds* out);

#ifdef __cplusplus
}
#endif

#endif
`,
    'src/agid.c': `#include "agid.h"

int agid_encode(double lat, double lon, agid_result* out) {
  (void)lat;
  (void)lon;
  (void)out;
  return -1;
}

int agid_decode(const char* id, agid_result* out) {
  (void)id;
  (void)out;
  return -1;
}

int agid_cell_bounds(const char* id, agid_bounds* out) {
  (void)id;
  (void)out;
  return -1;
}
`,
  };
}

function cppFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[3]),
    'include/agid.hpp': `#pragma once

#include <optional>
#include <string>

namespace agid {

constexpr int PrefixLength = ${AGID_PREFIX_LENGTH};
constexpr int HashLength = ${AGID_HASH_LENGTH};
constexpr int TotalLength = ${AGID_TOTAL_LENGTH};

struct Result {
  std::string id;
  double lat;
  double lon;
  int face;
};

struct Bounds {
  double minLat;
  double maxLat;
  double minLon;
  double maxLon;
};

std::optional<Result> encode(double lat, double lon);
std::optional<Result> decode(const std::string& id);
std::optional<Bounds> cellBounds(const std::string& id);

} // namespace agid
`,
    'src/agid.cpp': `#include "agid.hpp"

namespace agid {

std::optional<Result> encode(double lat, double lon) {
  (void)lat;
  (void)lon;
  return std::nullopt;
}

std::optional<Result> decode(const std::string& id) {
  (void)id;
  return std::nullopt;
}

std::optional<Bounds> cellBounds(const std::string& id) {
  (void)id;
  return std::nullopt;
}

} // namespace agid
`,
  };
}

function wasmFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[4]),
    'package.json': json({
      name: '@agid/wasm',
      version: AGID_SDK_VERSION,
      type: 'module',
      files: ['dist', 'agid_core.wasm'],
      exports: { '.': './dist/index.js' },
    }),
    'src/index.ts': `export type AgidWasmExports = {
  agid_get_quantized_face(lat: number, lon: number): number;
  agid_get_quantized_qx(lat: number, lon: number): number;
  agid_get_quantized_qy(lat: number, lon: number): number;
  agid_get_lat(face: number, qx: number, qy: number): number;
  agid_get_lon(face: number, qx: number, qy: number): number;
};

export async function loadAgidWasm(wasmUrl: string | URL): Promise<AgidWasmExports> {
  const response = await fetch(wasmUrl);
  const bytes = await response.arrayBuffer();
  const instance = await WebAssembly.instantiate(bytes, {});
  return instance.instance.exports as unknown as AgidWasmExports;
}

export type AgidResult = {
  id: string;
  lat: number;
  lon: number;
  face?: number;
};

export type AgidBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export function encode(_lat: number, _lon: number): AgidResult {
  throw new Error("wire this package to the AGID WASM reference implementation");
}

export function decode(_id: string): AgidResult | null {
  return null;
}

export function cellBounds(_id: string): AgidBounds {
  throw new Error("wire this package to the AGID WASM reference implementation");
}
`,
  };
}

function jsTsFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[5]),
    'package.json': json({
      name: '@agid/agid',
      version: AGID_SDK_VERSION,
      type: 'module',
      main: './dist/index.js',
      types: './dist/index.d.ts',
      files: ['dist'],
      scripts: { build: 'tsc -p tsconfig.json' },
    }),
    'tsconfig.json': json({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        declaration: true,
        outDir: 'dist',
        strict: true,
        moduleResolution: 'Bundler',
      },
      include: ['src'],
    }),
    'src/index.ts': `export const BASE32_ALPHABET = "${AGID_BASE32_ALPHABET}";
export const AGID_PREFIX_LENGTH = ${AGID_PREFIX_LENGTH};
export const AGID_HASH_LENGTH = ${AGID_HASH_LENGTH};
export const AGID_TOTAL_LENGTH = ${AGID_TOTAL_LENGTH};
export const AGID_SECURITY_PROFILE = ${JSON.stringify(AGID_SPEC_SECURITY_PROFILE, null, 2)} as const;

const AGID_FORMAT_PATTERN = /^[A-Z0-9]{${AGID_PREFIX_LENGTH}}[${AGID_BASE32_ALPHABET}]{${AGID_HASH_LENGTH}}$/;

export type AgidValidationResult = {
  ok: boolean;
  normalized: string | null;
  issues: string[];
};

export type AgidResult = {
  id: string;
  lat: number;
  lon: number;
  face?: number;
};

export type AgidBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export function normalizeAgid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

export function isValidAgid(value: unknown): value is string {
  const normalized = normalizeAgid(value);
  return Boolean(normalized && AGID_FORMAT_PATTERN.test(normalized));
}

export function validateAgid(value: unknown): AgidValidationResult {
  const normalized = normalizeAgid(value);
  const issues: string[] = [];
  if (!normalized) {
    return { ok: false, normalized, issues: ["not-a-non-empty-string"] };
  }
  if (normalized.length !== AGID_TOTAL_LENGTH) issues.push("invalid-length");
  if (!AGID_FORMAT_PATTERN.test(normalized)) issues.push("invalid-format-or-alphabet");
  return { ok: issues.length === 0, normalized, issues };
}

export function encode(_lat: number, _lon: number): AgidResult {
  throw new Error("wire this package to the AGID TypeScript reference implementation");
}

export function decode(_id: string): AgidResult | null {
  return null;
}

export function cellBounds(_id: string): AgidBounds {
  throw new Error("wire this package to the AGID TypeScript reference implementation");
}
`,
  };
}

function pyFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[6]),
    'pyproject.toml': `[project]
name = "agid"
version = "${AGID_SDK_VERSION}"
description = "AGID Python SDK"
requires-python = ">=3.9"
license = { text = "MIT" }
`,
    'agid/__init__.py': `BASE32_ALPHABET = "${AGID_BASE32_ALPHABET}"
AGID_PREFIX_LENGTH = ${AGID_PREFIX_LENGTH}
AGID_HASH_LENGTH = ${AGID_HASH_LENGTH}
AGID_TOTAL_LENGTH = ${AGID_TOTAL_LENGTH}

def encode(lat: float, lon: float):
    raise NotImplementedError("wire this package to the AGID reference implementation")

def decode(agid: str):
    return None

def cell_bounds(agid: str):
    raise NotImplementedError("wire this package to the AGID reference implementation")
`,
  };
}

function goFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[7]),
    'go.mod': `module github.com/agid/agid-go

go 1.22
`,
    'agid.go': `package agid

const Base32Alphabet = "${AGID_BASE32_ALPHABET}"
const PrefixLength = ${AGID_PREFIX_LENGTH}
const HashLength = ${AGID_HASH_LENGTH}
const TotalLength = ${AGID_TOTAL_LENGTH}

type Result struct {
	ID   string
	Lat  float64
	Lon  float64
	Face int
}

type Bounds struct {
	MinLat float64
	MaxLat float64
	MinLon float64
	MaxLon float64
}

func Encode(lat float64, lon float64) (Result, error) {
	return Result{}, ErrNotImplemented
}

func Decode(id string) (Result, error) {
	return Result{}, ErrNotImplemented
}

func CellBounds(id string) (Bounds, error) {
	return Bounds{}, ErrNotImplemented
}
`,
    'errors.go': `package agid

import "errors"

var ErrNotImplemented = errors.New("wire this package to the AGID reference implementation")
`,
  };
}

function swiftFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[8]),
    'Package.swift': `// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "AGID",
    products: [.library(name: "AGID", targets: ["AGID"])],
    targets: [.target(name: "AGID")]
)
`,
    'Sources/AGID/AGID.swift': `public let base32Alphabet = "${AGID_BASE32_ALPHABET}"
public let agidPrefixLength = ${AGID_PREFIX_LENGTH}
public let agidHashLength = ${AGID_HASH_LENGTH}
public let agidTotalLength = ${AGID_TOTAL_LENGTH}

public struct AGIDResult: Equatable {
    public let id: String
    public let lat: Double
    public let lon: Double
    public let face: Int?
}

public struct AGIDBounds: Equatable {
    public let minLat: Double
    public let maxLat: Double
    public let minLon: Double
    public let maxLon: Double
}

public func encode(lat: Double, lon: Double) throws -> AGIDResult {
    throw AGIDError.notImplemented
}

public func decode(_ id: String) -> AGIDResult? {
    nil
}

public func cellBounds(_ id: String) throws -> AGIDBounds {
    throw AGIDError.notImplemented
}

public enum AGIDError: Error {
    case notImplemented
}
`,
  };
}

function kotlinFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[9]),
    'build.gradle.kts': `plugins {
    kotlin("jvm") version "1.9.24"
}

group = "org.agid"
version = "${AGID_SDK_VERSION}"

repositories {
    mavenCentral()
}
`,
    'src/main/kotlin/org/agid/Agid.kt': `package org.agid

const val BASE32_ALPHABET = "${AGID_BASE32_ALPHABET}"
const val AGID_PREFIX_LENGTH = ${AGID_PREFIX_LENGTH}
const val AGID_HASH_LENGTH = ${AGID_HASH_LENGTH}
const val AGID_TOTAL_LENGTH = ${AGID_TOTAL_LENGTH}

data class AgidResult(
    val id: String,
    val lat: Double,
    val lon: Double,
    val face: Int? = null,
)

data class AgidBounds(
    val minLat: Double,
    val maxLat: Double,
    val minLon: Double,
    val maxLon: Double,
)

fun encode(lat: Double, lon: Double): AgidResult {
    throw NotImplementedError("wire this package to the AGID reference implementation")
}

fun decode(id: String): AgidResult? = null

fun cellBounds(id: String): AgidBounds {
    throw NotImplementedError("wire this package to the AGID reference implementation")
}
`,
  };
}

function javaFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[10]),
    'pom.xml': `<project xmlns="http://maven.apache.org/POM/4.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>org.agid</groupId>
  <artifactId>agid</artifactId>
  <version>${AGID_SDK_VERSION}</version>
  <name>AGID Java SDK</name>
  <properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
  </properties>
</project>
`,
    'src/main/java/org/agid/Agid.java': `package org.agid;

public final class Agid {
  public static final String BASE32_ALPHABET = "${AGID_BASE32_ALPHABET}";
  public static final int PREFIX_LENGTH = ${AGID_PREFIX_LENGTH};
  public static final int HASH_LENGTH = ${AGID_HASH_LENGTH};
  public static final int TOTAL_LENGTH = ${AGID_TOTAL_LENGTH};

  private Agid() {}

  public static AgidResult encode(double lat, double lon) {
    throw new UnsupportedOperationException("wire this package to the AGID reference implementation");
  }

  public static AgidResult decode(String id) {
    return null;
  }

  public static AgidBounds cellBounds(String id) {
    throw new UnsupportedOperationException("wire this package to the AGID reference implementation");
  }
}
`,
    'src/main/java/org/agid/AgidResult.java': `package org.agid;

public record AgidResult(String id, double lat, double lon, int face) {}
`,
    'src/main/java/org/agid/AgidBounds.java': `package org.agid;

public record AgidBounds(double minLat, double maxLat, double minLon, double maxLon) {}
`,
  };
}

function phpFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[11]),
    'composer.json': json({
      name: 'agid/agid',
      description: 'AGID PHP SDK',
      license: 'MIT',
      type: 'library',
      autoload: { psr4: { 'Agid\\\\': 'src/' } },
      require: { php: '>=8.1' },
    }),
    'src/Agid.php': `<?php

namespace Agid;

final class Agid
{
    public const BASE32_ALPHABET = '${AGID_BASE32_ALPHABET}';
    public const PREFIX_LENGTH = ${AGID_PREFIX_LENGTH};
    public const HASH_LENGTH = ${AGID_HASH_LENGTH};
    public const TOTAL_LENGTH = ${AGID_TOTAL_LENGTH};

    public static function encode(float $lat, float $lon): array
    {
        throw new \\RuntimeException('wire this package to the AGID reference implementation');
    }

    public static function decode(string $id): ?array
    {
        return null;
    }

    public static function cellBounds(string $id): array
    {
        throw new \\RuntimeException('wire this package to the AGID reference implementation');
    }
}
`,
  };
}

function dotnetFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[12]),
    'Agid.csproj': `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <PackageId>Agid</PackageId>
    <Version>${AGID_SDK_VERSION}</Version>
    <Authors>AGID</Authors>
    <Description>AGID .NET SDK</Description>
    <PackageLicenseExpression>MIT</PackageLicenseExpression>
  </PropertyGroup>
</Project>
`,
    'src/Agid.cs': `namespace Agid;

public static class Agid
{
    public const string Base32Alphabet = "${AGID_BASE32_ALPHABET}";
    public const int PrefixLength = ${AGID_PREFIX_LENGTH};
    public const int HashLength = ${AGID_HASH_LENGTH};
    public const int TotalLength = ${AGID_TOTAL_LENGTH};

    public static AgidResult Encode(double lat, double lon)
    {
        throw new NotImplementedException("wire this package to the AGID reference implementation");
    }

    public static AgidResult? Decode(string id)
    {
        return null;
    }

    public static AgidBounds CellBounds(string id)
    {
        throw new NotImplementedException("wire this package to the AGID reference implementation");
    }
}

public sealed record AgidResult(string Id, double Lat, double Lon, int? Face);
public sealed record AgidBounds(double MinLat, double MaxLat, double MinLon, double MaxLon);
`,
  };
}

function rubyFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[13]),
    'agid.gemspec': `Gem::Specification.new do |spec|
  spec.name = "agid"
  spec.version = "${AGID_SDK_VERSION}"
  spec.summary = "AGID Ruby SDK"
  spec.license = "MIT"
  spec.files = Dir["lib/**/*.rb", "README.md", "LICENSE"]
  spec.require_paths = ["lib"]
  spec.required_ruby_version = ">= 3.0"
end
`,
    'lib/agid.rb': `# frozen_string_literal: true

module Agid
  BASE32_ALPHABET = "${AGID_BASE32_ALPHABET}"
  PREFIX_LENGTH = ${AGID_PREFIX_LENGTH}
  HASH_LENGTH = ${AGID_HASH_LENGTH}
  TOTAL_LENGTH = ${AGID_TOTAL_LENGTH}

  Result = Struct.new(:id, :lat, :lon, :face, keyword_init: true)
  Bounds = Struct.new(:minLat, :maxLat, :minLon, :maxLon, keyword_init: true)

  def self.encode(lat, lon)
    raise NotImplementedError, "wire this package to the AGID reference implementation"
  end

  def self.decode(id)
    nil
  end

  def self.cellBounds(id)
    raise NotImplementedError, "wire this package to the AGID reference implementation"
  end
end
`,
  };
}

function dartFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[14]),
    'pubspec.yaml': `name: agid
description: AGID Dart SDK
version: ${AGID_SDK_VERSION}
environment:
  sdk: ">=3.0.0 <4.0.0"
`,
    'lib/agid.dart': `const base32Alphabet = '${AGID_BASE32_ALPHABET}';
const agidPrefixLength = ${AGID_PREFIX_LENGTH};
const agidHashLength = ${AGID_HASH_LENGTH};
const agidTotalLength = ${AGID_TOTAL_LENGTH};

class AgidResult {
  const AgidResult({required this.id, required this.lat, required this.lon, this.face});

  final String id;
  final double lat;
  final double lon;
  final int? face;
}

class AgidBounds {
  const AgidBounds({required this.minLat, required this.maxLat, required this.minLon, required this.maxLon});

  final double minLat;
  final double maxLat;
  final double minLon;
  final double maxLon;
}

AgidResult encode(double lat, double lon) {
  throw UnimplementedError('wire this package to the AGID reference implementation');
}

AgidResult? decode(String id) => null;

AgidBounds cellBounds(String id) {
  throw UnimplementedError('wire this package to the AGID reference implementation');
}
`,
  };
}

function rFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[15]),
    'DESCRIPTION': `Package: agid
Type: Package
Title: AGID R SDK
Version: ${AGID_SDK_VERSION}
License: MIT
Encoding: UTF-8
Description: Address Grid ID helpers for R.
Roxygen: list(markdown = TRUE)
`,
    'NAMESPACE': `export(agid_encode)
export(agid_decode)
export(agid_cellBounds)
`,
    'R/agid.R': `BASE32_ALPHABET <- "${AGID_BASE32_ALPHABET}"
AGID_PREFIX_LENGTH <- ${AGID_PREFIX_LENGTH}
AGID_HASH_LENGTH <- ${AGID_HASH_LENGTH}
AGID_TOTAL_LENGTH <- ${AGID_TOTAL_LENGTH}

agid_encode <- function(lat, lon) {
  stop("wire this package to the AGID reference implementation")
}

agid_decode <- function(id) {
  NULL
}

agid_cellBounds <- function(id) {
  stop("wire this package to the AGID reference implementation")
}
`,
  };
}

function juliaFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[16]),
    'Project.toml': `name = "AGID"
uuid = "11111111-2222-3333-4444-555555555555"
authors = ["AGID"]
version = "${AGID_SDK_VERSION}"
`,
    'src/AGID.jl': `module AGID

export encode, decode, cellBounds, AGIDResult, AGIDBounds

const BASE32_ALPHABET = "${AGID_BASE32_ALPHABET}"
const PREFIX_LENGTH = ${AGID_PREFIX_LENGTH}
const HASH_LENGTH = ${AGID_HASH_LENGTH}
const TOTAL_LENGTH = ${AGID_TOTAL_LENGTH}

struct AGIDResult
    id::String
    lat::Float64
    lon::Float64
    face::Union{Int, Nothing}
end

struct AGIDBounds
    minLat::Float64
    maxLat::Float64
    minLon::Float64
    maxLon::Float64
end

function encode(lat::Real, lon::Real)
    error("wire this package to the AGID reference implementation")
end

decode(id::AbstractString) = nothing
cellBounds(id::AbstractString) = error("wire this package to the AGID reference implementation")

end
`,
  };
}

function elixirFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[17]),
    'mix.exs': `defmodule Agid.MixProject do
  use Mix.Project

  def project do
    [
      app: :agid,
      version: "${AGID_SDK_VERSION}",
      elixir: "~> 1.15",
      description: "AGID Elixir SDK",
      package: [licenses: ["MIT"]]
    ]
  end
end
`,
    'lib/agid.ex': `defmodule Agid do
  @base32_alphabet "${AGID_BASE32_ALPHABET}"
  @prefix_length ${AGID_PREFIX_LENGTH}
  @hash_length ${AGID_HASH_LENGTH}
  @total_length ${AGID_TOTAL_LENGTH}

  def base32_alphabet, do: @base32_alphabet
  def prefix_length, do: @prefix_length
  def hash_length, do: @hash_length
  def total_length, do: @total_length

  def encode(_lat, _lon) do
    {:error, :not_implemented}
  end

  def decode(_id), do: nil

  def cellBounds(_id), do: {:error, :not_implemented}
end
`,
  };
}

function luaFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[18]),
    'agid.lua': `local agid = {}

agid.BASE32_ALPHABET = "${AGID_BASE32_ALPHABET}"
agid.PREFIX_LENGTH = ${AGID_PREFIX_LENGTH}
agid.HASH_LENGTH = ${AGID_HASH_LENGTH}
agid.TOTAL_LENGTH = ${AGID_TOTAL_LENGTH}

function agid.encode(lat, lon)
  error("wire this package to the AGID reference implementation")
end

function agid.decode(id)
  return nil
end

function agid.cellBounds(id)
  error("wire this package to the AGID reference implementation")
end

return agid
`,
    [`agid-${AGID_LUA_ROCKSPEC_VERSION}.rockspec`]: `package = "agid"
version = "${AGID_LUA_ROCKSPEC_VERSION}"
source = { url = "git://github.com/agid/agid-lua" }
description = {
  summary = "AGID Lua SDK",
  license = "MIT"
}
build = {
  type = "builtin",
  modules = {
    agid = "agid.lua"
  }
}
`,
  };
}

function zigFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[19]),
    'build.zig': `const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});
    _ = b.addModule("agid", .{
        .root_source_file = b.path("src/agid.zig"),
        .target = target,
        .optimize = optimize,
    });
}
`,
    'src/agid.zig': `pub const base32_alphabet = "${AGID_BASE32_ALPHABET}";
pub const prefix_length = ${AGID_PREFIX_LENGTH};
pub const hash_length = ${AGID_HASH_LENGTH};
pub const total_length = ${AGID_TOTAL_LENGTH};

pub const Result = struct {
    id: [total_length]u8,
    lat: f64,
    lon: f64,
    face: ?u8,
};

pub const Bounds = struct {
    minLat: f64,
    maxLat: f64,
    minLon: f64,
    maxLon: f64,
};

pub fn encode(lat: f64, lon: f64) !Result {
    _ = lat;
    _ = lon;
    return error.NotImplemented;
}

pub fn decode(id: []const u8) ?Result {
    _ = id;
    return null;
}

pub fn cellBounds(id: []const u8) !Bounds {
    _ = id;
    return error.NotImplemented;
}
`,
  };
}

function nimFiles(): FileMap {
  return {
    ...commonFiles(AGID_SDK_TARGETS[20]),
    'agid.nimble': `version       = "${AGID_SDK_VERSION}"
author        = "AGID"
description   = "AGID Nim SDK"
license       = "MIT"
srcDir        = "src"
`,
    'src/agid.nim': `const
  base32Alphabet* = "${AGID_BASE32_ALPHABET}"
  prefixLength* = ${AGID_PREFIX_LENGTH}
  hashLength* = ${AGID_HASH_LENGTH}
  totalLength* = ${AGID_TOTAL_LENGTH}

type
  AgidResult* = object
    id*: string
    lat*: float
    lon*: float
    face*: int

  AgidBounds* = object
    minLat*: float
    maxLat*: float
    minLon*: float
    maxLon*: float

proc encode*(lat: float, lon: float): AgidResult =
  raise newException(CatchableError, "wire this package to the AGID reference implementation")

proc decode*(id: string): AgidResult =
  raise newException(CatchableError, "not implemented")

proc cellBounds*(id: string): AgidBounds =
  raise newException(CatchableError, "wire this package to the AGID reference implementation")
`,
  };
}

function compactParityVectorsJson() {
  return JSON.stringify(parityTestVectors, null, 2);
}

function escapedSingleQuotedJson() {
  return compactParityVectorsJson().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function parityFiles(targetId: string): FileMap {
  const vectorsJson = compactParityVectorsJson();
  const first = parityTestVectors[0];
  const second = parityTestVectors[1];
  const third = parityTestVectors[2];

  const commonNote = 'Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.';

  const files: Record<string, FileMap> = {
    'agid-rs': {
      'tests/parity.rs': `// ${commonNote}
use agid::{cell_bounds, decode, encode};

const EPS: f64 = 0.000001;
const PARITY_VECTORS: &[(&str, f64, f64, &str, f64, f64, f64, f64, f64, f64)] = &[
    ("${first.name}", ${first.lat}, ${first.lon}, "${first.expected.id}", ${first.expected.decoded.lat}, ${first.expected.decoded.lon}, ${first.expected.cellBounds.minLat}, ${first.expected.cellBounds.maxLat}, ${first.expected.cellBounds.minLon}, ${first.expected.cellBounds.maxLon}),
    ("${second.name}", ${second.lat}, ${second.lon}, "${second.expected.id}", ${second.expected.decoded.lat}, ${second.expected.decoded.lon}, ${second.expected.cellBounds.minLat}, ${second.expected.cellBounds.maxLat}, ${second.expected.cellBounds.minLon}, ${second.expected.cellBounds.maxLon}),
    ("${third.name}", ${third.lat}, ${third.lon}, "${third.expected.id}", ${third.expected.decoded.lat}, ${third.expected.decoded.lon}, ${third.expected.cellBounds.minLat}, ${third.expected.cellBounds.maxLat}, ${third.expected.cellBounds.minLon}, ${third.expected.cellBounds.maxLon}),
];

fn close(actual: f64, expected: f64) {
    assert!((actual - expected).abs() < EPS, "expected {expected}, got {actual}");
}

#[test]
fn encode_decode_cellbounds_match_spec() {
    for (name, lat, lon, id, decoded_lat, decoded_lon, min_lat, max_lat, min_lon, max_lon) in PARITY_VECTORS {
        let encoded = encode(*lat, *lon).expect(name);
        assert_eq!(encoded.id, *id, "{name} encode parity");
        let decoded = decode(id).expect(name);
        close(decoded.lat, *decoded_lat);
        close(decoded.lon, *decoded_lon);
        let bounds = cell_bounds(id).expect(name);
        close(bounds.min_lat, *min_lat);
        close(bounds.max_lat, *max_lat);
        close(bounds.min_lon, *min_lon);
        close(bounds.max_lon, *max_lon);
    }
}
`,
    },
    'agid-c': {
      'tests/parity.c': `/* ${commonNote} */
#include "agid.h"
#include <assert.h>
#include <math.h>
#include <string.h>

static const double EPS = 0.000001;

static void close_enough(double actual, double expected) {
  assert(fabs(actual - expected) < EPS);
}

int main(void) {
  agid_result encoded;
  agid_result decoded;
  agid_bounds bounds;

  assert(agid_encode(${first.lat}, ${first.lon}, &encoded) == 0);
  assert(strcmp(encoded.id, "${first.expected.id}") == 0);
  assert(agid_decode("${first.expected.id}", &decoded) == 0);
  close_enough(decoded.lat, ${first.expected.decoded.lat});
  close_enough(decoded.lon, ${first.expected.decoded.lon});
  assert(agid_cell_bounds("${first.expected.id}", &bounds) == 0); /* cellBounds parity */
  close_enough(bounds.min_lat, ${first.expected.cellBounds.minLat});
  close_enough(bounds.max_lat, ${first.expected.cellBounds.maxLat});
  close_enough(bounds.min_lon, ${first.expected.cellBounds.minLon});
  close_enough(bounds.max_lon, ${first.expected.cellBounds.maxLon});
  return 0;
}
`,
    },
    'agid-cpp': {
      'tests/parity.cpp': `// ${commonNote}
#include "agid.hpp"
#include <cassert>
#include <cmath>

static void close_enough(double actual, double expected) {
  assert(std::abs(actual - expected) < 0.000001);
}

int main() {
  const auto encoded = agid::encode(${first.lat}, ${first.lon});
  assert(encoded.has_value());
  assert(encoded->id == "${first.expected.id}");
  const auto decoded = agid::decode("${first.expected.id}");
  assert(decoded.has_value());
  close_enough(decoded->lat, ${first.expected.decoded.lat});
  close_enough(decoded->lon, ${first.expected.decoded.lon});
  const auto bounds = agid::cellBounds("${first.expected.id}");
  assert(bounds.has_value());
  close_enough(bounds->minLat, ${first.expected.cellBounds.minLat});
  close_enough(bounds->maxLat, ${first.expected.cellBounds.maxLat});
  close_enough(bounds->minLon, ${first.expected.cellBounds.minLon});
  close_enough(bounds->maxLon, ${first.expected.cellBounds.maxLon});
}
`,
    },
    'agid-wasm': {
      'test/parity.test.ts': `// ${commonNote}
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cellBounds, decode, encode } from '../src/index';

const PARITY_VECTORS = ${vectorsJson} as const;
const EPS = 0.000001;

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < EPS, \`expected \${expected}, got \${actual}\`);

test('encode/decode/cellBounds match the AGID spec vectors', () => {
  for (const vector of PARITY_VECTORS) {
    assert.equal(encode(vector.lat, vector.lon).id, vector.expected.id);
    const decoded = decode(vector.expected.id);
    assert.ok(decoded);
    close(decoded.lat, vector.expected.decoded.lat);
    close(decoded.lon, vector.expected.decoded.lon);
    const bounds = cellBounds(vector.expected.id);
    close(bounds.minLat, vector.expected.cellBounds.minLat);
    close(bounds.maxLat, vector.expected.cellBounds.maxLat);
    close(bounds.minLon, vector.expected.cellBounds.minLon);
    close(bounds.maxLon, vector.expected.cellBounds.maxLon);
  }
});
`,
    },
    'agid-js-ts': {
      'test/parity.test.ts': `// ${commonNote}
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cellBounds, decode, encode } from '../src/index';

const PARITY_VECTORS = ${vectorsJson} as const;
const EPS = 0.000001;

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < EPS, \`expected \${expected}, got \${actual}\`);

test('encode/decode/cellBounds match the AGID spec vectors', () => {
  for (const vector of PARITY_VECTORS) {
    assert.equal(encode(vector.lat, vector.lon).id, vector.expected.id);
    const decoded = decode(vector.expected.id);
    assert.ok(decoded);
    close(decoded.lat, vector.expected.decoded.lat);
    close(decoded.lon, vector.expected.decoded.lon);
    const bounds = cellBounds(vector.expected.id);
    close(bounds.minLat, vector.expected.cellBounds.minLat);
    close(bounds.maxLat, vector.expected.cellBounds.maxLat);
    close(bounds.minLon, vector.expected.cellBounds.minLon);
    close(bounds.maxLon, vector.expected.cellBounds.maxLon);
  }
});
`,
    },
    'agid-py': {
      'tests/test_parity.py': `# ${commonNote}
from agid import cell_bounds, decode, encode

PARITY_VECTORS = ${vectorsJson}
EPS = 0.000001

def close(actual, expected):
    assert abs(actual - expected) < EPS

def test_encode_decode_cellBounds_match_spec():
    for vector in PARITY_VECTORS:
        assert encode(vector["lat"], vector["lon"])["id"] == vector["expected"]["id"]
        decoded = decode(vector["expected"]["id"])
        close(decoded["lat"], vector["expected"]["decoded"]["lat"])
        close(decoded["lon"], vector["expected"]["decoded"]["lon"])
        bounds = cell_bounds(vector["expected"]["id"])
        close(bounds["minLat"], vector["expected"]["cellBounds"]["minLat"])
        close(bounds["maxLat"], vector["expected"]["cellBounds"]["maxLat"])
        close(bounds["minLon"], vector["expected"]["cellBounds"]["minLon"])
        close(bounds["maxLon"], vector["expected"]["cellBounds"]["maxLon"])
`,
    },
    'agid-go': {
      'agid_parity_test.go': `// ${commonNote}
package agid

import (
	"math"
	"testing"
)

type parityVector struct {
	name string
	lat float64
	lon float64
	id string
	decodedLat float64
	decodedLon float64
	minLat float64
	maxLat float64
	minLon float64
	maxLon float64
}

var PARITY_VECTORS = []parityVector{
	{"${first.name}", ${first.lat}, ${first.lon}, "${first.expected.id}", ${first.expected.decoded.lat}, ${first.expected.decoded.lon}, ${first.expected.cellBounds.minLat}, ${first.expected.cellBounds.maxLat}, ${first.expected.cellBounds.minLon}, ${first.expected.cellBounds.maxLon}},
	{"${second.name}", ${second.lat}, ${second.lon}, "${second.expected.id}", ${second.expected.decoded.lat}, ${second.expected.decoded.lon}, ${second.expected.cellBounds.minLat}, ${second.expected.cellBounds.maxLat}, ${second.expected.cellBounds.minLon}, ${second.expected.cellBounds.maxLon}},
	{"${third.name}", ${third.lat}, ${third.lon}, "${third.expected.id}", ${third.expected.decoded.lat}, ${third.expected.decoded.lon}, ${third.expected.cellBounds.minLat}, ${third.expected.cellBounds.maxLat}, ${third.expected.cellBounds.minLon}, ${third.expected.cellBounds.maxLon}},
}

func close(t *testing.T, actual float64, expected float64) {
	if math.Abs(actual-expected) >= 0.000001 {
		t.Fatalf("expected %f, got %f", expected, actual)
	}
}

func TestEncodeDecodeCellBoundsParity(t *testing.T) {
	for _, v := range PARITY_VECTORS {
		encoded, err := Encode(v.lat, v.lon)
		if err != nil { t.Fatal(err) }
		if encoded.ID != v.id { t.Fatalf("%s encode mismatch: %s", v.name, encoded.ID) }
		decoded, err := Decode(v.id)
		if err != nil { t.Fatal(err) }
		close(t, decoded.Lat, v.decodedLat)
		close(t, decoded.Lon, v.decodedLon)
		bounds, err := CellBounds(v.id)
		if err != nil { t.Fatal(err) }
		close(t, bounds.MinLat, v.minLat)
		close(t, bounds.MaxLat, v.maxLat)
		close(t, bounds.MinLon, v.minLon)
		close(t, bounds.MaxLon, v.maxLon)
	}
}
`,
    },
    'agid-swift': {
      'Tests/AGIDTests/AGIDParityTests.swift': `// ${commonNote}
import XCTest
@testable import AGID

final class AGIDParityTests: XCTestCase {
    func testEncodeDecodeCellBoundsMatchSpec() throws {
        let encoded = try encode(lat: ${first.lat}, lon: ${first.lon})
        XCTAssertEqual(encoded.id, "${first.expected.id}")
        let decoded = try XCTUnwrap(decode("${first.expected.id}"))
        XCTAssertEqual(decoded.lat, ${first.expected.decoded.lat}, accuracy: 0.000001)
        XCTAssertEqual(decoded.lon, ${first.expected.decoded.lon}, accuracy: 0.000001)
        let bounds = try cellBounds("${first.expected.id}")
        XCTAssertEqual(bounds.minLat, ${first.expected.cellBounds.minLat}, accuracy: 0.000001)
        XCTAssertEqual(bounds.maxLat, ${first.expected.cellBounds.maxLat}, accuracy: 0.000001)
        XCTAssertEqual(bounds.minLon, ${first.expected.cellBounds.minLon}, accuracy: 0.000001)
        XCTAssertEqual(bounds.maxLon, ${first.expected.cellBounds.maxLon}, accuracy: 0.000001)
    }
}
`,
    },
    'agid-kotlin': {
      'src/test/kotlin/org/agid/AgidParityTest.kt': `// ${commonNote}
package org.agid

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class AgidParityTest {
    @Test
    fun encodeDecodeCellBoundsMatchSpec() {
        val encoded = encode(${first.lat}, ${first.lon})
        assertEquals("${first.expected.id}", encoded.id)
        val decoded = assertNotNull(decode("${first.expected.id}"))
        assertEquals(${first.expected.decoded.lat}, decoded.lat, 0.000001)
        assertEquals(${first.expected.decoded.lon}, decoded.lon, 0.000001)
        val bounds = cellBounds("${first.expected.id}")
        assertEquals(${first.expected.cellBounds.minLat}, bounds.minLat, 0.000001)
        assertEquals(${first.expected.cellBounds.maxLat}, bounds.maxLat, 0.000001)
        assertEquals(${first.expected.cellBounds.minLon}, bounds.minLon, 0.000001)
        assertEquals(${first.expected.cellBounds.maxLon}, bounds.maxLon, 0.000001)
    }
}
`,
    },
    'agid-java': {
      'src/test/java/org/agid/AgidParityTest.java': `// ${commonNote}
package org.agid;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class AgidParityTest {
  @Test
  void encodeDecodeCellBoundsMatchSpec() {
    AgidResult encoded = Agid.encode(${first.lat}, ${first.lon});
    assertEquals("${first.expected.id}", encoded.id());
    AgidResult decoded = Agid.decode("${first.expected.id}");
    assertNotNull(decoded);
    assertEquals(${first.expected.decoded.lat}, decoded.lat(), 0.000001);
    assertEquals(${first.expected.decoded.lon}, decoded.lon(), 0.000001);
    AgidBounds bounds = Agid.cellBounds("${first.expected.id}");
    assertEquals(${first.expected.cellBounds.minLat}, bounds.minLat(), 0.000001);
    assertEquals(${first.expected.cellBounds.maxLat}, bounds.maxLat(), 0.000001);
    assertEquals(${first.expected.cellBounds.minLon}, bounds.minLon(), 0.000001);
    assertEquals(${first.expected.cellBounds.maxLon}, bounds.maxLon(), 0.000001);
  }
}
`,
    },
    'agid-php': {
      'tests/ParityTest.php': `<?php
// ${commonNote}

use Agid\\Agid;

$PARITY_VECTORS = json_decode('${escapedSingleQuotedJson()}', true);

foreach ($PARITY_VECTORS as $vector) {
    $encoded = Agid::encode($vector['lat'], $vector['lon']);
    assert($encoded['id'] === $vector['expected']['id']);
    $decoded = Agid::decode($vector['expected']['id']);
    assert(abs($decoded['lat'] - $vector['expected']['decoded']['lat']) < 0.000001);
    assert(abs($decoded['lon'] - $vector['expected']['decoded']['lon']) < 0.000001);
    $bounds = Agid::cellBounds($vector['expected']['id']);
    assert(abs($bounds['minLat'] - $vector['expected']['cellBounds']['minLat']) < 0.000001);
    assert(abs($bounds['maxLat'] - $vector['expected']['cellBounds']['maxLat']) < 0.000001);
    assert(abs($bounds['minLon'] - $vector['expected']['cellBounds']['minLon']) < 0.000001);
    assert(abs($bounds['maxLon'] - $vector['expected']['cellBounds']['maxLon']) < 0.000001);
}
`,
    },
    'agid-dotnet': {
      'tests/AgidParityTests.cs': `// ${commonNote}
using Xunit;

namespace Agid.Tests;

public sealed class AgidParityTests
{
    [Fact]
    public void EncodeDecodeCellBoundsMatchSpec()
    {
        var encoded = Agid.Encode(${first.lat}, ${first.lon});
        Assert.Equal("${first.expected.id}", encoded.Id);
        var decoded = Agid.Decode("${first.expected.id}");
        Assert.NotNull(decoded);
        Assert.Equal(${first.expected.decoded.lat}, decoded!.Lat, 6);
        Assert.Equal(${first.expected.decoded.lon}, decoded.Lon, 6);
        var bounds = Agid.CellBounds("${first.expected.id}");
        Assert.Equal(${first.expected.cellBounds.minLat}, bounds.MinLat, 6);
        Assert.Equal(${first.expected.cellBounds.maxLat}, bounds.MaxLat, 6);
        Assert.Equal(${first.expected.cellBounds.minLon}, bounds.MinLon, 6);
        Assert.Equal(${first.expected.cellBounds.maxLon}, bounds.MaxLon, 6);
    }
}
`,
    },
    'agid-ruby': {
      'test/test_parity.rb': `# frozen_string_literal: true
# ${commonNote}

require "json"
require "minitest/autorun"
require "agid"

PARITY_VECTORS = JSON.parse('${escapedSingleQuotedJson()}')

class AgidParityTest < Minitest::Test
  def test_encode_decode_cellBounds_match_spec
    PARITY_VECTORS.each do |vector|
      assert_equal vector["expected"]["id"], Agid.encode(vector["lat"], vector["lon"]).id
      decoded = Agid.decode(vector["expected"]["id"])
      assert_in_delta vector["expected"]["decoded"]["lat"], decoded.lat, 0.000001
      assert_in_delta vector["expected"]["decoded"]["lon"], decoded.lon, 0.000001
      bounds = Agid.cellBounds(vector["expected"]["id"])
      assert_in_delta vector["expected"]["cellBounds"]["minLat"], bounds.minLat, 0.000001
      assert_in_delta vector["expected"]["cellBounds"]["maxLat"], bounds.maxLat, 0.000001
      assert_in_delta vector["expected"]["cellBounds"]["minLon"], bounds.minLon, 0.000001
      assert_in_delta vector["expected"]["cellBounds"]["maxLon"], bounds.maxLon, 0.000001
    end
  end
end
`,
    },
    'agid-dart': {
      'test/agid_parity_test.dart': `// ${commonNote}
import 'package:test/test.dart';
import 'package:agid/agid.dart';

void main() {
  test('encode/decode/cellBounds match spec', () {
    final encoded = encode(${first.lat}, ${first.lon});
    expect(encoded.id, '${first.expected.id}');
    final decoded = decode('${first.expected.id}')!;
    expect(decoded.lat, closeTo(${first.expected.decoded.lat}, 0.000001));
    expect(decoded.lon, closeTo(${first.expected.decoded.lon}, 0.000001));
    final bounds = cellBounds('${first.expected.id}');
    expect(bounds.minLat, closeTo(${first.expected.cellBounds.minLat}, 0.000001));
    expect(bounds.maxLat, closeTo(${first.expected.cellBounds.maxLat}, 0.000001));
    expect(bounds.minLon, closeTo(${first.expected.cellBounds.minLon}, 0.000001));
    expect(bounds.maxLon, closeTo(${first.expected.cellBounds.maxLon}, 0.000001));
  });
}
`,
    },
    'agid-r': {
      'tests/testthat/test-parity.R': `# ${commonNote}
test_that("encode/decode/cellBounds match spec", {
  encoded <- agid_encode(${first.lat}, ${first.lon})
  expect_equal(encoded$id, "${first.expected.id}")
  decoded <- agid_decode("${first.expected.id}")
  expect_equal(decoded$lat, ${first.expected.decoded.lat}, tolerance = 0.000001)
  expect_equal(decoded$lon, ${first.expected.decoded.lon}, tolerance = 0.000001)
  bounds <- agid_cellBounds("${first.expected.id}")
  expect_equal(bounds$minLat, ${first.expected.cellBounds.minLat}, tolerance = 0.000001)
  expect_equal(bounds$maxLat, ${first.expected.cellBounds.maxLat}, tolerance = 0.000001)
  expect_equal(bounds$minLon, ${first.expected.cellBounds.minLon}, tolerance = 0.000001)
  expect_equal(bounds$maxLon, ${first.expected.cellBounds.maxLon}, tolerance = 0.000001)
})
`,
    },
    'agid-julia': {
      'test/runtests.jl': `# ${commonNote}
using Test
using AGID

@testset "encode/decode/cellBounds parity" begin
    encoded = encode(${first.lat}, ${first.lon})
    @test encoded.id == "${first.expected.id}"
    decoded = decode("${first.expected.id}")
    @test isapprox(decoded.lat, ${first.expected.decoded.lat}; atol=0.000001)
    @test isapprox(decoded.lon, ${first.expected.decoded.lon}; atol=0.000001)
    bounds = cellBounds("${first.expected.id}")
    @test isapprox(bounds.minLat, ${first.expected.cellBounds.minLat}; atol=0.000001)
    @test isapprox(bounds.maxLat, ${first.expected.cellBounds.maxLat}; atol=0.000001)
    @test isapprox(bounds.minLon, ${first.expected.cellBounds.minLon}; atol=0.000001)
    @test isapprox(bounds.maxLon, ${first.expected.cellBounds.maxLon}; atol=0.000001)
end
`,
    },
    'agid-elixir': {
      'test/agid_parity_test.exs': `# ${commonNote}
ExUnit.start()

defmodule AgidParityTest do
  use ExUnit.Case

  test "encode/decode/cellBounds match spec" do
    assert {:ok, encoded} = Agid.encode(${first.lat}, ${first.lon})
    assert encoded.id == "${first.expected.id}"
    decoded = Agid.decode("${first.expected.id}")
    assert_in_delta decoded.lat, ${first.expected.decoded.lat}, 0.000001
    assert_in_delta decoded.lon, ${first.expected.decoded.lon}, 0.000001
    bounds = Agid.cellBounds("${first.expected.id}")
    assert_in_delta bounds.minLat, ${first.expected.cellBounds.minLat}, 0.000001
    assert_in_delta bounds.maxLat, ${first.expected.cellBounds.maxLat}, 0.000001
    assert_in_delta bounds.minLon, ${first.expected.cellBounds.minLon}, 0.000001
    assert_in_delta bounds.maxLon, ${first.expected.cellBounds.maxLon}, 0.000001
  end
end
`,
    },
    'agid-lua': {
      'test/parity_test.lua': `-- ${commonNote}
local agid = require("agid")

local PARITY_VECTORS = {
  { name = "${first.name}", lat = ${first.lat}, lon = ${first.lon}, id = "${first.expected.id}", decodedLat = ${first.expected.decoded.lat}, decodedLon = ${first.expected.decoded.lon}, minLat = ${first.expected.cellBounds.minLat}, maxLat = ${first.expected.cellBounds.maxLat}, minLon = ${first.expected.cellBounds.minLon}, maxLon = ${first.expected.cellBounds.maxLon} }
}

local function close(actual, expected)
  assert(math.abs(actual - expected) < 0.000001)
end

for _, vector in ipairs(PARITY_VECTORS) do
  local encoded = agid.encode(vector.lat, vector.lon)
  assert(encoded.id == vector.id)
  local decoded = agid.decode(vector.id)
  close(decoded.lat, vector.decodedLat)
  close(decoded.lon, vector.decodedLon)
  local bounds = agid.cellBounds(vector.id)
  close(bounds.minLat, vector.minLat)
  close(bounds.maxLat, vector.maxLat)
  close(bounds.minLon, vector.minLon)
  close(bounds.maxLon, vector.maxLon)
end
`,
    },
    'agid-zig': {
      'src/agid_parity_test.zig': `// ${commonNote}
const std = @import("std");
const agid = @import("agid.zig");

test "encode/decode/cellBounds parity" {
    const encoded = try agid.encode(${first.lat}, ${first.lon});
    try std.testing.expectEqualStrings("${first.expected.id}", encoded.id[0..]);
    const decoded = agid.decode("${first.expected.id}").?;
    try std.testing.expectApproxEqAbs(${first.expected.decoded.lat}, decoded.lat, 0.000001);
    try std.testing.expectApproxEqAbs(${first.expected.decoded.lon}, decoded.lon, 0.000001);
    const bounds = try agid.cellBounds("${first.expected.id}");
    try std.testing.expectApproxEqAbs(${first.expected.cellBounds.minLat}, bounds.minLat, 0.000001);
    try std.testing.expectApproxEqAbs(${first.expected.cellBounds.maxLat}, bounds.maxLat, 0.000001);
    try std.testing.expectApproxEqAbs(${first.expected.cellBounds.minLon}, bounds.minLon, 0.000001);
    try std.testing.expectApproxEqAbs(${first.expected.cellBounds.maxLon}, bounds.maxLon, 0.000001);
}
`,
    },
    'agid-nim': {
      'tests/test_parity.nim': `# ${commonNote}
import unittest
import agid

suite "encode/decode/cellBounds parity":
  test "matches spec vectors":
    let encoded = encode(${first.lat}, ${first.lon})
    check encoded.id == "${first.expected.id}"
    let decoded = decode("${first.expected.id}")
    check abs(decoded.lat - ${first.expected.decoded.lat}) < 0.000001
    check abs(decoded.lon - ${first.expected.decoded.lon}) < 0.000001
    let bounds = cellBounds("${first.expected.id}")
    check abs(bounds.minLat - ${first.expected.cellBounds.minLat}) < 0.000001
    check abs(bounds.maxLat - ${first.expected.cellBounds.maxLat}) < 0.000001
    check abs(bounds.minLon - ${first.expected.cellBounds.minLon}) < 0.000001
    check abs(bounds.maxLon - ${first.expected.cellBounds.maxLon}) < 0.000001
`,
    },
  };

  return files[targetId] || {};
}

const FILES_BY_TARGET: Record<string, () => FileMap> = {
  'agid-spec': specFiles,
  'agid-rs': rustFiles,
  'agid-c': cFiles,
  'agid-cpp': cppFiles,
  'agid-wasm': wasmFiles,
  'agid-js-ts': jsTsFiles,
  'agid-py': pyFiles,
  'agid-go': goFiles,
  'agid-swift': swiftFiles,
  'agid-kotlin': kotlinFiles,
  'agid-java': javaFiles,
  'agid-php': phpFiles,
  'agid-dotnet': dotnetFiles,
  'agid-ruby': rubyFiles,
  'agid-dart': dartFiles,
  'agid-r': rFiles,
  'agid-julia': juliaFiles,
  'agid-elixir': elixirFiles,
  'agid-lua': luaFiles,
  'agid-zig': zigFiles,
  'agid-nim': nimFiles,
};

export async function generateAgidSdks(outputDir = path.join(process.cwd(), 'sdk')) {
  const writtenFiles: string[] = [];

  for (const target of AGID_SDK_TARGETS) {
    const files = { ...FILES_BY_TARGET[target.id](), ...parityFiles(target.id) };
    const targetDir = path.join(outputDir, target.directory);

    for (const [relativePath, content] of Object.entries(files)) {
      const filePath = path.join(targetDir, relativePath);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, content, 'utf8');
      writtenFiles.push(filePath);
    }
  }

  return {
    outputDir,
    targets: AGID_SDK_TARGETS,
    writtenFiles,
  };
}

async function main() {
  const argOutputDir = process.argv[2];
  const outputDir = argOutputDir ? path.resolve(argOutputDir) : path.join(process.cwd(), 'sdk');
  const result = await generateAgidSdks(outputDir);
  console.log(`Generated ${result.targets.length} AGID SDK targets in ${result.outputDir}`);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
