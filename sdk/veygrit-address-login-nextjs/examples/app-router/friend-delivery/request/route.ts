import {
  requestFriendDelivery,
  type FriendDeliveryRequestResult,
} from '../../../../src/server';

type FriendDeliveryRequestBody = {
  purchaserSubjectAlias: string;
  friendAlias: string;
  cartRef: string;
};

export async function POST(request: Request): Promise<Response> {
  const body = await request.json() as FriendDeliveryRequestBody;
  const result = await requestFriendDelivery<FriendDeliveryRequestResult>(
    {
      purchaserSubjectAlias: body.purchaserSubjectAlias,
      friendAlias: body.friendAlias,
      cartRef: body.cartRef,
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
          throw new Error('Friend Delivery request failed.');
        }
        return await response.json() as FriendDeliveryRequestResult;
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
