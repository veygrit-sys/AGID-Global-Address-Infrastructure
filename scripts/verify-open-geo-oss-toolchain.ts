import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  assessOpenGeoOssToolchain,
  requireOpenGeoOssCapability,
  type OpenGeoOssCapability,
  type OpenGeoOssToolId,
  type OpenGeoOssToolProbe,
} from '../src/lib/openGeoOssToolchain';

type CommandProbe = {
  tool: Exclude<OpenGeoOssToolId, 'postgis' | 'libpostal'>;
  command: string;
  args: string[];
  versionPattern: RegExp;
};

const COMMAND_PROBES: CommandProbe[] = [
  { tool: 'gdal', command: 'gdalinfo', args: ['--version'], versionPattern: /\bGDAL\s+(\d+\.\d+\.\d+)\b/i },
  { tool: 'proj', command: 'proj', args: ['-V'], versionPattern: /Rel\.\s*(\d+\.\d+\.\d+)/i },
  { tool: 'osm2pgsql', command: 'osm2pgsql', args: ['--version'], versionPattern: /(\d+\.\d+\.\d+)/ },
  { tool: 'cosign', command: 'cosign', args: ['version'], versionPattern: /v?(\d+\.\d+\.\d+)/i },
];

function digest(data: string) {
  return `sha256:${createHash('sha256').update(data).digest('hex')}` as const;
}

function probeCommand(spec: CommandProbe): OpenGeoOssToolProbe {
  const command = resolveCommand(spec);
  const result = spawnSync(command, spec.args, {
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
  });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  if (result.error) {
    return { tool: spec.tool, status: 'missing', evidenceSha256: digest(output) };
  }
  const version = output.match(spec.versionPattern)?.[1];
  return version
    ? { tool: spec.tool, status: 'available', version, evidenceSha256: digest(output) }
    : result.status === 0
      ? { tool: spec.tool, status: 'unverified', evidenceSha256: digest(output) }
      : { tool: spec.tool, status: 'missing', evidenceSha256: digest(output) };
}

function resolveCommand(spec: CommandProbe) {
  if (spec.tool !== 'cosign' || process.platform !== 'win32') return spec.command;
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return spec.command;
  const wingetCosign = join(
    localAppData,
    'Microsoft',
    'WinGet',
    'Packages',
    'Sigstore.Cosign_Microsoft.Winget.Source_8wekyb3d8bbwe',
    'cosign-windows-amd64.exe',
  );
  return existsSync(wingetCosign) ? wingetCosign : spec.command;
}

function resolveProjDataDirectory() {
  const configured = process.env.PROJ_DATA || process.env.PROJ_LIB;
  if (configured && existsSync(join(configured, 'proj.db'))) return configured;
  const gdalProjData = process.platform === 'win32'
    ? 'C:\\Program Files\\GDAL\\projlib'
    : undefined;
  return gdalProjData && existsSync(join(gdalProjData, 'proj.db'))
    ? gdalProjData
    : undefined;
}

function probeProjDatabase() {
  const projData = resolveProjDataDirectory();
  const result = spawnSync('projinfo', ['EPSG:4326', '-o', 'PROJJSON'], {
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
    env: {
      ...process.env,
      ...(projData ? { PROJ_DATA: projData } : {}),
    },
  });
  return !result.error && result.status === 0 && (result.stdout ?? '').includes('"type"');
}

function parseRequiredProfile(): OpenGeoOssCapability | undefined {
  const inline = process.argv.find(value => value.startsWith('--require-profile='));
  const index = process.argv.indexOf('--require-profile');
  const value = inline
    ? inline.slice('--require-profile='.length)
    : index >= 0
      ? process.argv[index + 1]
      : undefined;
  if (!value) return undefined;
  const allowed: OpenGeoOssCapability[] = [
    'source-backed-terrain',
    'versioned-spatial-index',
    'local-multilingual-parser',
    'signed-artifact-release',
  ];
  if (!allowed.includes(value as OpenGeoOssCapability)) {
    throw new Error(`Unknown --require-profile value: ${value}.`);
  }
  return value as OpenGeoOssCapability;
}

function main() {
  const probes = COMMAND_PROBES.map(probeCommand);
  probes.push(
    { tool: 'postgis', status: 'unverified' },
    { tool: 'libpostal', status: 'unverified' },
  );
  const assessment = assessOpenGeoOssToolchain({
    probes,
    projDatabaseReady: probeProjDatabase(),
    tufMetadataReady: false,
  });
  const requiredProfile = parseRequiredProfile();
  if (requiredProfile) requireOpenGeoOssCapability(assessment, requiredProfile);
  console.log(JSON.stringify({
    assessment,
    requiredProfile: requiredProfile ?? null,
    notes: [
      'PostGIS and libpostal remain unverified until a caller-owned local runtime preflight succeeds.',
      'This report does not inspect source payloads and cannot promote a country or postal source.',
    ],
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
