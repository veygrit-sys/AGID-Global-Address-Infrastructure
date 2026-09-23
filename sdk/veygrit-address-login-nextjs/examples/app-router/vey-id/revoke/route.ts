import {
  revokeVeyIdConnection,
  type VeyIdConnectionRevocationResult,
} from '../../../../src/server';

type VeyIdRevocationRequestBody = {
  clientId: string;
  pairwiseSubjectAlias: string;
  walletConsentRef?: string;
};

export async function POST(request: Request): Promise<Response> {
  const body = await request.json() as VeyIdRevocationRequestBody;
  const result = await revokeVeyIdConnection<VeyIdConnectionRevocationResult>(
    {
      clientId: body.clientId,
      pairwiseSubjectAlias: body.pairwiseSubjectAlias,
      walletConsentRef: body.walletConsentRef,
      reason: 'user_wallet_unlink',
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
          throw new Error('Vey ID connection revocation failed.');
        }
        return await response.json() as VeyIdConnectionRevocationResult;
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
