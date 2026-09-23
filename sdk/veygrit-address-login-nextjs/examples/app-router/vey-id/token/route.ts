import {
  exchangeVeyIdAuthorizationCode,
  type VeyIdTokenExchangeResult,
} from '../../../../src/server';

type VeyIdTokenRequestBody = {
  authorizationCodeRef: string;
  clientId: string;
  redirectUri: string;
  pkceVerifier: string;
};

export async function POST(request: Request): Promise<Response> {
  const body = await request.json() as VeyIdTokenRequestBody;
  const result = await exchangeVeyIdAuthorizationCode<VeyIdTokenExchangeResult>(
    {
      authorizationCodeRef: body.authorizationCodeRef,
      clientId: body.clientId,
      redirectUri: body.redirectUri,
      pkceVerifier: body.pkceVerifier,
    },
    {
      serverAccessToken: requiredEnv('VEYGRIT_SERVER_ACCESS_TOKEN'),
      transport: async ({ url, headers, payload }) => {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error('Vey ID token exchange failed.');
        }
        return await response.json() as VeyIdTokenExchangeResult;
      },
    },
  );

  return Response.json(result);
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}
