import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

type SecretPattern = {
  code: string;
  pattern: RegExp;
  allowContext?: RegExp;
};

const ROOT = process.cwd();

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'test-results',
  'output',
  'outputs',
  'artifacts',
  'tmp',
  '.next',
  '.vite',
]);

const INCLUDED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.toml',
  '.env',
  '.example',
  '.txt',
  '.sol',
  '.circom',
]);

const SECRET_PATTERNS: SecretPattern[] = [
  {
    code: 'private-key-block',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |)?PRIVATE KEY-----/,
    allowContext: /(detectUnsafeMaterial|fixture|synthetic|example)/i,
  },
  {
    code: 'aws-access-key-id',
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    code: 'github-token',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b/g,
  },
  {
    code: 'slack-token',
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g,
  },
  {
    code: 'stripe-live-secret',
    pattern: /\bsk_live_[A-Za-z0-9]{20,}\b/g,
  },
  {
    code: 'google-api-key',
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    code: 'generic-assignment-secret',
    pattern: /\b(?:SECRET|TOKEN|API_KEY|PRIVATE_KEY|WEBHOOK_SECRET)\s*=\s*["'][A-Za-z0-9_./+=-]{24,}["']/gi,
    allowContext: /(example|placeholder|dummy|test|REDACTED|process\.env)/i,
  },
  {
    code: 'carrier-client-secret',
    pattern: /\b(?:UPS|DHL)_[A-Z0-9_]*(?:SECRET|PASSWORD|TOKEN|API_KEY)\s*[:=]\s*["'][^"'\r\n]{12,}["']/gi,
    allowContext: /(example|placeholder|dummy|test|REDACTED|process\.env)/i,
  },
  {
    code: 'authorization-literal',
    pattern: /\bauthorization\s*[:=]\s*["']Bearer\s+[A-Za-z0-9._~+\/-]{20,}["']/gi,
    allowContext: /(example|placeholder|dummy|test|REDACTED|mock|pk_test|synthetic)/i,
  },
  {
    code: 'signed-storage-url',
    pattern: /https?:\/\/[^\s"']+[?&](?:X-Amz-Signature|X-Goog-Signature|sig)=[A-Za-z0-9%_-]{16,}/gi,
    allowContext: /(example|placeholder|dummy|test|REDACTED)/i,
  },
];

type Finding = {
  file: string;
  line: number;
  code: string;
  excerpt: string;
};

function lineNumberAt(text: string, index: number) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function excerptAt(text: string, index: number) {
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + 120);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

async function* walk(directory: string): AsyncGenerator<string> {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.codex')) continue;
      yield* walk(absolute);
    } else if (entry.isFile()) {
      const extension = path.extname(entry.name);
      if (INCLUDED_EXTENSIONS.has(extension) || entry.name === 'FUNDING.yml' || entry.name === 'SECURITY.md') {
        yield absolute;
      }
    }
  }
}

async function scanFile(filePath: string): Promise<Finding[]> {
  const fileStat = await stat(filePath);
  if (fileStat.size > 1024 * 1024 * 2) return [];

  const text = await readFile(filePath, 'utf8');
  const findings: Finding[] = [];
  const relative = path.relative(ROOT, filePath);

  for (const secretPattern of SECRET_PATTERNS) {
    const flags = secretPattern.pattern.flags.includes('g')
      ? secretPattern.pattern.flags
      : `${secretPattern.pattern.flags}g`;
    const pattern = new RegExp(secretPattern.pattern.source, flags);

    for (const match of text.matchAll(pattern)) {
      const index = match.index ?? 0;
      const excerpt = excerptAt(text, index);
      if (secretPattern.allowContext?.test(excerpt)) continue;

      findings.push({
        file: relative,
        line: lineNumberAt(text, index),
        code: secretPattern.code,
        excerpt,
      });
    }
  }

  return findings;
}

const findings: Finding[] = [];
for await (const filePath of walk(ROOT)) {
  findings.push(...await scanFile(filePath));
}

if (findings.length > 0) {
  console.error('External-audit secret scan failed.');
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} ${finding.code} :: ${finding.excerpt}`);
  }
  process.exit(1);
}

console.log('External-audit secret scan passed.');
