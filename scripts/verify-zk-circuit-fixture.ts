import { execFile } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const ROOT = process.cwd();
const DEFAULT_CIRCUIT = 'circuits/fixtures/nullifier_linear_fixture.circom';
const DEFAULT_WITNESS_INPUT = {
  holderSecret: 7,
  scopeSecret: 11,
  scopeHash: 13,
  nullifierHash: 31,
};

export type ZkCircuitFixtureVerificationOptions = {
  circuitPath?: string;
  witnessInput?: Record<string, unknown>;
  witnessInputPath?: string;
  keepArtifacts?: boolean;
};

export type ZkCircuitFixtureVerificationResult = {
  circuitPath: string;
  artifactDirectory: string | null;
  artifactDirectoryKept: boolean;
  r1csInfo: string;
  witnessCheck: string;
  wasmPath: string;
};

function resolveFromRoot(inputPath: string) {
  return path.resolve(ROOT, inputPath);
}

function localToolPath(...segments: string[]) {
  return path.join(ROOT, 'node_modules', ...segments);
}

async function runNodeScript(scriptPath: string, args: readonly string[], cwd: string) {
  try {
    const result = await execFileAsync(process.execPath, [scriptPath, ...args], {
      cwd,
      maxBuffer: 1024 * 1024 * 10,
    });

    return `${result.stdout}${result.stderr}`;
  } catch (error) {
    if (error && typeof error === 'object') {
      const maybeExecError = error as { stdout?: string; stderr?: string; message?: string };
      const output = `${maybeExecError.stdout ?? ''}${maybeExecError.stderr ?? ''}`.trim();
      throw new Error(
        [
          `Command failed: node ${scriptPath} ${args.join(' ')}`,
          maybeExecError.message,
          output,
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }

    throw error;
  }
}

async function readWitnessInput(options: ZkCircuitFixtureVerificationOptions) {
  if (options.witnessInput) return options.witnessInput;
  if (!options.witnessInputPath) return DEFAULT_WITNESS_INPUT;

  const inputText = await readFile(resolveFromRoot(options.witnessInputPath), 'utf8');
  return JSON.parse(inputText) as Record<string, unknown>;
}

export async function verifyZkCircuitFixture(
  options: ZkCircuitFixtureVerificationOptions = {},
): Promise<ZkCircuitFixtureVerificationResult> {
  const sourceCircuitPath = resolveFromRoot(options.circuitPath ?? DEFAULT_CIRCUIT);
  const circuitFileName = path.basename(sourceCircuitPath);
  const circuitBaseName = circuitFileName.replace(/\.circom$/i, '');
  const sourceCircuitDir = path.dirname(sourceCircuitPath);
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'agid-zk-circuit-'));
  const tempCircuitDir = path.join(tempRoot, 'circuit');
  const witnessInputPath = path.join(tempRoot, 'input.json');
  const witnessPath = path.join(tempRoot, 'witness.wtns');
  const r1csPath = path.join(tempCircuitDir, `${circuitBaseName}.r1cs`);
  const wasmPath = path.join(tempCircuitDir, `${circuitBaseName}_js`, `${circuitBaseName}.wasm`);

  let keepArtifacts = options.keepArtifacts === true;

  try {
    await cp(sourceCircuitDir, tempCircuitDir, { recursive: true });
    await writeFile(
      witnessInputPath,
      `${JSON.stringify(await readWitnessInput(options), null, 2)}\n`,
      'utf8',
    );

    await runNodeScript(
      localToolPath('circom2', 'cli.js'),
      [circuitFileName, '--r1cs', '--sym', '--wasm', '-o', '.'],
      tempCircuitDir,
    );

    const r1csInfo = await runNodeScript(
      localToolPath('snarkjs', 'build', 'cli.cjs'),
      ['r1cs', 'info', r1csPath],
      tempCircuitDir,
    );

    await runNodeScript(
      path.join(tempCircuitDir, `${circuitBaseName}_js`, 'generate_witness.js'),
      [wasmPath, witnessInputPath, witnessPath],
      tempCircuitDir,
    );

    const witnessCheck = await runNodeScript(
      localToolPath('snarkjs', 'build', 'cli.cjs'),
      ['wtns', 'check', r1csPath, witnessPath],
      tempCircuitDir,
    );

    if (options.keepArtifacts !== true) {
      await rm(tempRoot, { recursive: true, force: true });
      keepArtifacts = false;
    }

    return {
      circuitPath: sourceCircuitPath,
      artifactDirectory: keepArtifacts ? tempRoot : null,
      artifactDirectoryKept: keepArtifacts,
      r1csInfo,
      witnessCheck,
      wasmPath,
    };
  } catch (error) {
    if (options.keepArtifacts !== true) {
      await rm(tempRoot, { recursive: true, force: true });
    }
    throw error;
  }
}

function parseArgs(argv: readonly string[]): ZkCircuitFixtureVerificationOptions & { json?: boolean } {
  const options: ZkCircuitFixtureVerificationOptions & { json?: boolean } = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--circuit') {
      options.circuitPath = argv[index + 1];
      index += 1;
    } else if (arg === '--input') {
      options.witnessInputPath = argv[index + 1];
      index += 1;
    } else if (arg === '--keep') {
      options.keepArtifacts = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (!arg.startsWith('--') && !options.circuitPath) {
      options.circuitPath = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const options = parseArgs(process.argv.slice(2));
  const result = await verifyZkCircuitFixture(options);
  const summary = {
    circuitPath: result.circuitPath,
    artifactDirectory: result.artifactDirectory,
    artifactDirectoryKept: result.artifactDirectoryKept,
    witnessCorrect: /WITNESS IS CORRECT/.test(result.witnessCheck),
    publicInputs: /Public Inputs:\s+2/.test(result.r1csInfo),
    privateInputs: /Private Inputs:\s+2/.test(result.r1csInfo),
  };

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log('ZK circuit fixture verification passed.');
    console.log(`Circuit: ${summary.circuitPath}`);
    console.log(`Witness correct: ${summary.witnessCorrect ? 'yes' : 'no'}`);
    console.log(`Artifacts kept: ${summary.artifactDirectoryKept ? summary.artifactDirectory : 'no'}`);
  }
}
