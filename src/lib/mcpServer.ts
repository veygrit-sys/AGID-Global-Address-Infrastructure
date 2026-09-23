export const AGID_MCP_PROTOCOL_VERSION = '2025-06-18';
export const AGID_MCP_SERVER_NAME = 'agid-mcp-server';

type JsonRpcId = string | number | null;
type JsonRecord = Record<string, unknown>;

export type AgidMcpToolCallResult = {
  structuredContent: JsonRecord;
  text: string;
  isError?: boolean;
};

export type AgidMcpToolHandler = (name: string, args: JsonRecord) => Promise<AgidMcpToolCallResult> | AgidMcpToolCallResult;

const publicProofBundleArguments = {
  type: 'object',
  required: ['proofs'],
  properties: {
    proofs: {
      type: 'array',
      items: { type: 'object', additionalProperties: true },
    },
    scope: { type: 'string' },
    audience: { type: 'string' },
    operationId: { type: 'string' },
    expectedChallengeHash: { type: 'string' },
    expectedChallengeHashesByVersion: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
    now: { type: 'string', format: 'date-time' },
    metadata: { type: 'object', additionalProperties: true },
  },
  additionalProperties: false,
} as const;

export const AGID_MCP_TOOLS = [
  {
    name: 'agid.health',
    title: 'AGID Health',
    description: 'Report whether the AGID MCP public tool surface is available.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  {
    name: 'agid.zk.proof_bundle.register',
    title: 'Register ZK Proof Bundle',
    description: 'Register a compatible public ZK proof bundle and return its public registry status.',
    inputSchema: publicProofBundleArguments,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  {
    name: 'agid.zk.proof_bundle.verify',
    title: 'Verify ZK Proof Bundle',
    description: 'Verify the lifecycle state of a previously registered public ZK proof bundle.',
    inputSchema: {
      type: 'object',
      required: ['bundleId'],
      properties: {
        bundleId: { type: 'string' },
        now: { type: 'string', format: 'date-time' },
      },
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  {
    name: 'agid.zk.proof_bundle.stats',
    title: 'ZK Proof Bundle Stats',
    description: 'Return aggregate public lifecycle statistics for registered proof bundles.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  {
    name: 'agid.revocation_freshness.verify',
    title: 'Verify Revocation Freshness',
    description: 'Verify a public freshness proof envelope against an anchored revocation/freshness root.',
    inputSchema: {
      type: 'object',
      required: ['anchor'],
      properties: {
        envelope: { type: 'object', additionalProperties: true },
        proof: { type: 'object', additionalProperties: true },
        anchor: { type: 'object', additionalProperties: true },
        now: { type: 'string', format: 'date-time' },
      },
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  {
    name: 'agid.credential_issuer.trust.evaluate',
    title: 'Evaluate Credential Issuer Trust',
    description: 'Evaluate public credential issuer trust using a supplied public registry snapshot.',
    inputSchema: {
      type: 'object',
      required: ['credential', 'trustRegistry'],
      properties: {
        credential: { type: 'object', additionalProperties: true },
        trustRegistry: { type: 'object', additionalProperties: true },
        now: { type: 'string', format: 'date-time' },
        credentialType: { type: 'string' },
        requiredLayer: { type: 'string', enum: ['AGID', 'AOID'] },
        requiredCountryCode: { type: ['string', 'null'] },
        requiredSchemaHash: { type: ['string', 'null'] },
        minimumTrustScore: { type: 'number', minimum: 0, maximum: 1 },
        allowedIssuerStatuses: { type: 'array', items: { type: 'string' } },
        trustedRegistryRoots: { type: 'array', items: { type: 'string' } },
        maxRegistryAgeSeconds: { type: 'number', minimum: 1 },
      },
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  {
    name: 'agid.polkadot.stages',
    title: 'List Polkadot Stages',
    description: 'List the ordered public AGID Polkadot integration stages.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
] as const;

export const AGID_MCP_TOOL_NAMES = AGID_MCP_TOOLS.map(tool => tool.name);

const forbiddenPrivateArgumentKeyPatterns = [
  /secret/iu,
  /private/iu,
  /addressText/iu,
  /plain(?:text)?/iu,
  /phone/iu,
  /email/iu,
  /recipient/iu,
  /deliveryInstruction/iu,
  /rawAoid/iu,
  /aoidPrivateKey/iu,
];

function isJsonRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function jsonRpcResult(id: JsonRpcId | undefined, result: JsonRecord) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    result,
  };
}

function jsonRpcError(id: JsonRpcId | undefined, code: number, message: string, data?: JsonRecord) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: {
      code,
      message,
      ...(data ? { data } : {}),
    },
  };
}

function isPrivateArgumentKey(key: string) {
  return forbiddenPrivateArgumentKeyPatterns.some(pattern => pattern.test(key));
}

function containsPrivateArgumentMaterial(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(item => containsPrivateArgumentMaterial(item));
  }

  if (!isJsonRecord(value)) return false;
  for (const [key, nested] of Object.entries(value)) {
    if (isPrivateArgumentKey(key)) return true;
    if (containsPrivateArgumentMaterial(nested)) return true;
  }
  return false;
}

function coerceJsonRpcId(value: unknown): JsonRpcId | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value;
  if (value === null) return null;
  return undefined;
}

function toolResultContent(result: AgidMcpToolCallResult) {
  return {
    content: [
      {
        type: 'text',
        text: result.text,
      },
    ],
    structuredContent: result.structuredContent,
    isError: result.isError === true,
  };
}

export async function handleAgidMcpRequest(
  requestBody: unknown,
  callTool: AgidMcpToolHandler,
) {
  if (!isJsonRecord(requestBody) || requestBody.jsonrpc !== '2.0' || typeof requestBody.method !== 'string') {
    return {
      httpStatus: 400,
      body: jsonRpcError(undefined, -32600, 'Invalid JSON-RPC 2.0 request'),
    };
  }

  const id = coerceJsonRpcId(requestBody.id);
  const method = requestBody.method;

  if (method === 'initialize') {
    return {
      httpStatus: 200,
      body: jsonRpcResult(id, {
        protocolVersion: AGID_MCP_PROTOCOL_VERSION,
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: AGID_MCP_SERVER_NAME,
          version: '1.0.0',
        },
        instructions: 'Use AGID MCP tools only for public proofs, commitments, registry roots, and non-private integration metadata.',
      }),
    };
  }

  if (method === 'tools/list') {
    return {
      httpStatus: 200,
      body: jsonRpcResult(id, {
        tools: AGID_MCP_TOOLS,
      }),
    };
  }

  if (method !== 'tools/call') {
    return {
      httpStatus: 200,
      body: jsonRpcError(id, -32601, 'MCP method is not supported by AGID'),
    };
  }

  const params = isJsonRecord(requestBody.params) ? requestBody.params : {};
  const name = typeof params.name === 'string' ? params.name : '';
  if (!AGID_MCP_TOOL_NAMES.includes(name as (typeof AGID_MCP_TOOL_NAMES)[number])) {
    return {
      httpStatus: 200,
      body: jsonRpcError(id, -32602, 'Unknown MCP tool'),
    };
  }

  const args = isJsonRecord(params.arguments) ? params.arguments : {};
  if (containsPrivateArgumentMaterial(args)) {
    return {
      httpStatus: 200,
      body: jsonRpcResult(id, toolResultContent({
        isError: true,
        text: 'AGID MCP rejected private argument material. Use public commitments, proofs, roots, or registry snapshots only.',
        structuredContent: {
          ok: false,
          error: 'private-mcp-tool-material-present',
        },
      })),
    };
  }

  try {
    const result = await callTool(name, args);
    return {
      httpStatus: 200,
      body: jsonRpcResult(id, toolResultContent(result)),
    };
  } catch {
    return {
      httpStatus: 200,
      body: jsonRpcResult(id, toolResultContent({
        isError: true,
        text: 'AGID MCP tool execution failed.',
        structuredContent: {
          ok: false,
          error: 'mcp-tool-execution-failed',
        },
      })),
    };
  }
}
