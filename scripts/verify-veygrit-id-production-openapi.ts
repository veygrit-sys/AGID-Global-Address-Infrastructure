import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const OPENAPI_PATH = join('docs', 'specs', 'veygrit-id-production.openapi.yaml');
const SOCIAL_PROVIDERS = ['google', 'apple'] as const;

type JsonObject = Record<string, unknown>;
export type VeygritIdProductionOpenApiVerificationResult = {
  ok: boolean;
  errors: string[];
  openApiPath: string;
  socialProviders: readonly string[];
};

function readText(path: string, errors: string[]) {
  if (!existsSync(path)) {
    errors.push(`missing-file:${path}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

function nested(value: unknown, path: string[]) {
  return path.reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as JsonObject)[key];
  }, value);
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function assertExactArray(value: unknown, expected: readonly string[], label: string, errors: string[]) {
  const actual = asArray(value);
  if (actual.length !== expected.length || actual.some((item, index) => item !== expected[index])) {
    errors.push(`${label}-must-equal:${expected.join(',')}`);
  }
}

function assertIncludes(text: unknown, expected: string, label: string, errors: string[]) {
  if (!String(text ?? '').includes(expected)) errors.push(`${label}-missing:${expected}`);
}

function assertRef(value: unknown, expected: string, label: string, errors: string[]) {
  if (nested(value, ['$ref']) !== expected) errors.push(`${label}-ref-mismatch:${expected}`);
}

export function verifyVeygritIdProductionOpenApiText(
  openApiText: string,
  options: { openApiPath?: string } = {},
): VeygritIdProductionOpenApiVerificationResult {
  const openApiPath = options.openApiPath ?? OPENAPI_PATH;
  const errors: string[] = [];
  let openApi: JsonObject = {};
  try {
    openApi = openApiText ? parseYaml(openApiText) as JsonObject : {};
  } catch (error) {
    errors.push(`invalid-yaml:${openApiPath}:${error instanceof Error ? error.message : String(error)}`);
  }

  const paths = nested(openApi, ['paths']) as JsonObject | undefined;
  for (const requiredPath of [
    '/.well-known/openid-configuration',
    '/.well-known/jwks.json',
    '/veygrit/oauth/authorize',
    '/veygrit/oauth/approve',
    '/veygrit/social/{provider}/callback',
    '/veygrit/oauth/token',
    '/veygrit/oauth/userinfo',
    '/veygrit/oauth/introspect',
    '/veygrit/oauth/revoke',
    '/v1/navigation-handoffs',
    '/v1/navigation-handoffs/consume',
  ]) {
    if (!paths?.[requiredPath]) errors.push(`openapi-path-missing:${requiredPath}`);
  }

  const socialCallback = nested(openApi, ['paths', '/veygrit/social/{provider}/callback', 'post']) as JsonObject | undefined;
  if (!socialCallback) {
    errors.push('social-callback-operation-missing');
  } else {
    if (socialCallback.operationId !== 'completeGoogleAppleSocialCallback') {
      errors.push('social-callback-operation-id-mismatch');
    }

    const providerParameter = asArray(socialCallback.parameters).find(parameter => (
      nested(parameter, ['name']) === 'provider' && nested(parameter, ['in']) === 'path'
    ));
    if (!providerParameter) errors.push('social-callback-provider-parameter-missing');
    assertExactArray(nested(providerParameter, ['schema', 'enum']), SOCIAL_PROVIDERS, 'social-callback-provider-enum', errors);

    const description = socialCallback.description;
    assertIncludes(
      description,
      'Unsupported providers are rejected before provider code exchange, secret lookup, or Veygrit session creation',
      'social-callback-description',
      errors,
    );
    assertIncludes(description, 'Provider tokens are verified only in memory', 'social-callback-description', errors);
    assertIncludes(description, 'never stored or returned', 'social-callback-description', errors);

    const requiredBodyFields = nested(socialCallback, [
      'requestBody',
      'content',
      'application/json',
      'schema',
      'required',
    ]);
    assertExactArray(requiredBodyFields, ['request_ref', 'state', 'code'], 'social-callback-required-body-fields', errors);

    const response200 = nested(socialCallback, ['responses', '200']);
    if (!response200) errors.push('social-callback-response-200-missing');
    if (nested(response200, ['headers', 'Cache-Control', 'schema', 'const']) !== 'no-store') {
      errors.push('social-callback-response-200-cache-control-must-be-no-store');
    }

    const response400 = nested(socialCallback, ['responses', '400']);
    if (!response400) errors.push('social-callback-response-400-missing');
    assertRef(nested(response400, ['content', 'application/json', 'schema']), '#/components/schemas/OAuthErrorBody', 'social-callback-response-400', errors);
  }

  assertRef(nested(openApi, ['components', 'responses', 'OAuthError', 'content', 'application/json', 'schema']), '#/components/schemas/OAuthErrorBody', 'oauth-error-response', errors);
  if (!asArray(nested(openApi, ['components', 'schemas', 'OAuthErrorBody', 'required'])).includes('error')) {
    errors.push('oauth-error-body-required-error-missing');
  }

  const openApiJson = JSON.stringify(openApi);
  for (const pattern of [
    /api\.github\.com/i,
    /github_access_token/i,
    /login\/oauth\/access_token/i,
    /enum:\s*\[google,\s*apple,\s*github\]/i,
    /provider_access_token/i,
    /provider_refresh_token/i,
    /providerIdTokenStored\s*:\s*true/i,
    /providerAccessTokenStored\s*:\s*true/i,
    /providerRefreshTokenStored\s*:\s*true/i,
    /raw_address/i,
    /rawRecipient|raw_recipient/i,
    /privateKey|private_key/i,
    /proofSecret|proof_secret/i,
  ]) {
    if (pattern.test(openApiText) || pattern.test(openApiJson)) {
      errors.push(`openapi-banned-pattern:${pattern}`);
    }
  }

  return { ok: errors.length === 0, errors, openApiPath, socialProviders: SOCIAL_PROVIDERS };
}

export function verifyVeygritIdProductionOpenApi(openApiPath = OPENAPI_PATH): VeygritIdProductionOpenApiVerificationResult {
  const readErrors: string[] = [];
  const result = verifyVeygritIdProductionOpenApiText(readText(openApiPath, readErrors), { openApiPath });
  const errors = [...readErrors, ...result.errors];
  return { ...result, errors, ok: errors.length === 0 };
}

function main() {
  const result = verifyVeygritIdProductionOpenApi();
  if (result.errors.length > 0) {
  console.error('[verify-veygrit-id-production-openapi] status=fail');
    for (const error of result.errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log('[verify-veygrit-id-production-openapi] status=pass');
    console.log(`openapi=${result.openApiPath}`);
    console.log(`socialProviders=${result.socialProviders.join(',')}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}
