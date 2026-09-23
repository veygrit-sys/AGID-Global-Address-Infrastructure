export const LINUX_COMPATIBILITY_VERSION = 'linux-compatibility-v1';

export type LinuxCompatibilitySeverity = 'pass' | 'warn' | 'fail';

export type LinuxCompatibilityCheck = {
  id: string;
  label: string;
  severity: LinuxCompatibilitySeverity;
  message: string;
  evidence: string[];
  remediation: string;
};

export type LinuxCompatibilityReportStatus = 'ready' | 'attention' | 'blocked';

export type LinuxCompatibilityFile = {
  path: string;
  content?: string;
};

export type LinuxCompatibilityInput = {
  platform?: string;
  nodeVersion?: string;
  packageScripts?: Record<string, string>;
  files?: LinuxCompatibilityFile[];
};

export type LinuxCompatibilityReport = {
  version: string;
  status: LinuxCompatibilityReportStatus;
  platform: string;
  nodeMajor: number | null;
  checks: LinuxCompatibilityCheck[];
  summary: {
    pass: number;
    warn: number;
    fail: number;
  };
};

const shellSpecificPattern = /\b(rm\s+-rf|powershell|cmd(?:\.exe)?\s+\/c|del\s+|rmdir\s+|start-process)\b/i;
const windowsAbsolutePathPattern = /(?:^|[^A-Za-z0-9+.-])[A-Za-z]:(?:\\{1,2}|\/)/;
const sourcePathPattern = /^(src\/|scripts\/|server\.ts$|package\.json$)/;

function normalizePath(filePath: string) {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
}

function isRuntimeSourcePath(filePath: string) {
  const normalized = normalizePath(filePath);
  return sourcePathPattern.test(normalized) && !/(^|[./-])test\.(t|j)sx?$/.test(normalized);
}

function parseNodeMajor(nodeVersion: string) {
  const match = nodeVersion.match(/v?(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function makeCheck(
  id: string,
  label: string,
  severity: LinuxCompatibilitySeverity,
  message: string,
  evidence: string[],
  remediation: string,
): LinuxCompatibilityCheck {
  return {
    id,
    label,
    severity,
    message,
    evidence,
    remediation,
  };
}

function checkNodeVersion(nodeMajor: number | null): LinuxCompatibilityCheck {
  if (nodeMajor === null) {
    return makeCheck(
      'node-version',
      'Node.js version',
      'warn',
      'Node.js version could not be parsed.',
      [],
      'Use Node.js 18 or newer on Linux.',
    );
  }
  if (nodeMajor < 18) {
    return makeCheck(
      'node-version',
      'Node.js version',
      'fail',
      `Node.js ${nodeMajor} is below the supported floor.`,
      [`node-major:${nodeMajor}`],
      'Install Node.js 18 or newer before running the AGID toolchain.',
    );
  }
  return makeCheck(
    'node-version',
    'Node.js version',
    'pass',
    `Node.js ${nodeMajor} is compatible with the Linux toolchain.`,
    [`node-major:${nodeMajor}`],
    'No action required.',
  );
}

function checkPackageScripts(packageScripts: Record<string, string>): LinuxCompatibilityCheck {
  const shellSpecificScripts = Object.entries(packageScripts)
    .filter(([, script]) => shellSpecificPattern.test(script))
    .map(([name, script]) => `${name}: ${script}`);

  if (shellSpecificScripts.length > 0) {
    return makeCheck(
      'package-scripts-shell-neutral',
      'Shell-neutral npm scripts',
      'fail',
      'Some npm scripts depend on platform-specific shell commands.',
      shellSpecificScripts,
      'Move filesystem operations into Node scripts or cross-platform packages.',
    );
  }

  return makeCheck(
    'package-scripts-shell-neutral',
    'Shell-neutral npm scripts',
    'pass',
    'npm scripts avoid obvious Windows-only and Unix-only shell commands.',
    Object.keys(packageScripts).sort(),
    'No action required.',
  );
}

function checkCleanScript(packageScripts: Record<string, string>): LinuxCompatibilityCheck {
  const cleanScript = packageScripts.clean;
  if (!cleanScript) {
    return makeCheck(
      'clean-script',
      'Portable clean script',
      'warn',
      '`npm run clean` is not defined.',
      [],
      'Add a Node-based clean script so generated output can be removed consistently on Linux, macOS, and Windows.',
    );
  }

  if (shellSpecificPattern.test(cleanScript)) {
    return makeCheck(
      'clean-script',
      'Portable clean script',
      'fail',
      '`npm run clean` uses a shell-specific command.',
      [cleanScript],
      'Replace it with `tsx scripts/clean-dist.ts` or another Node-based cleanup command.',
    );
  }

  return makeCheck(
    'clean-script',
    'Portable clean script',
    'pass',
    '`npm run clean` is shell-neutral.',
    [cleanScript],
    'No action required.',
  );
}

function checkCaseInsensitiveCollisions(files: LinuxCompatibilityFile[]): LinuxCompatibilityCheck {
  const groups = new Map<string, string[]>();
  for (const file of files) {
    const normalized = normalizePath(file.path);
    const key = normalized.toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), normalized]);
  }

  const collisions = Array.from(groups.values())
    .filter(paths => new Set(paths).size > 1)
    .map(paths => paths.join(' <-> '));

  if (collisions.length > 0) {
    return makeCheck(
      'case-insensitive-path-collisions',
      'Case-insensitive path collisions',
      'fail',
      'Some paths only differ by case and can break clone/build behavior across filesystems.',
      collisions,
      'Rename files so each path is unique after lowercasing.',
    );
  }

  return makeCheck(
    'case-insensitive-path-collisions',
    'Case-insensitive path collisions',
    'pass',
    'No case-only path collisions were found.',
    [],
    'No action required.',
  );
}

function checkWindowsAbsolutePaths(files: LinuxCompatibilityFile[]): LinuxCompatibilityCheck {
  const offenders = files
    .map(file => ({
      path: normalizePath(file.path),
      content: file.content ?? '',
    }))
    .filter(file => isRuntimeSourcePath(file.path))
    .filter(file => windowsAbsolutePathPattern.test(file.content))
    .map(file => file.path);

  if (offenders.length > 0) {
    return makeCheck(
      'windows-absolute-paths',
      'Windows absolute paths in runtime surfaces',
      'fail',
      'Runtime code or scripts contain Windows absolute paths.',
      offenders,
      'Use relative paths, environment variables, or `path.resolve` from the project root.',
    );
  }

  return makeCheck(
    'windows-absolute-paths',
    'Windows absolute paths in runtime surfaces',
    'pass',
    'No Windows absolute paths were found in runtime source, scripts, or package metadata.',
    [],
    'No action required.',
  );
}

export function buildLinuxCompatibilityReport(
  input: LinuxCompatibilityInput = {},
): LinuxCompatibilityReport {
  const platform = input.platform ?? process.platform;
  const nodeVersion = input.nodeVersion ?? process.version;
  const nodeMajor = parseNodeMajor(nodeVersion);
  const packageScripts = input.packageScripts ?? {};
  const files = input.files ?? [];

  const checks = [
    checkNodeVersion(nodeMajor),
    checkPackageScripts(packageScripts),
    checkCleanScript(packageScripts),
    checkCaseInsensitiveCollisions(files),
    checkWindowsAbsolutePaths(files),
  ];

  const summary = {
    pass: checks.filter(check => check.severity === 'pass').length,
    warn: checks.filter(check => check.severity === 'warn').length,
    fail: checks.filter(check => check.severity === 'fail').length,
  };

  const status: LinuxCompatibilityReportStatus =
    summary.fail > 0 ? 'blocked' : summary.warn > 0 ? 'attention' : 'ready';

  return {
    version: LINUX_COMPATIBILITY_VERSION,
    status,
    platform,
    nodeMajor,
    checks,
    summary,
  };
}
