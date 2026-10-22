/**
 * @file route.ts
 * @path src/app/api/mcp/route.ts
 * @description Model Context Protocol (MCP) Streamable HTTP & JSON-RPC 2.0 endpoint for Alexa+ integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  McpServerEngine,
  MCP_TOOLS,
  MCP_RESOURCES,
  MCP_PROMPTS,
} from '@/lib/mcp-server';
import { StateStore } from '@/lib/state-store';

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_NAME = 'syntra-atlas-mcp';
const SERVER_VERSION = '1.0.0';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  const sessionId = request.headers.get('mcp-session-id') || `sess-${Date.now()}`;

  // Check if client requests text/event-stream for SSE Streamable HTTP
  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('text/event-stream')) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `event: endpoint\ndata: ${JSON.stringify({ endpoint: '/api/mcp', sessionId })}\n\n`
          )
        );
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'mcp-session-id': sessionId,
      },
    });
  }

  // Health and info check
  return NextResponse.json({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    status: 'ACTIVE',
    capabilities: {
      tools: { listChanged: false },
      resources: { listChanged: false, subscribe: false },
      prompts: { listChanged: false },
    },
    toolsCount: MCP_TOOLS.length,
    resourcesCount: MCP_RESOURCES.length,
    promptsCount: MCP_PROMPTS.length,
  });
}

export async function POST(request: NextRequest) {
  const sessionId = request.headers.get('mcp-session-id') || `mcp-sess-${Date.now()}`;
  let body: any;

  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error: Invalid JSON' },
      },
      { status: 400 }
    );
  }

  // Validate JSON-RPC 2.0 structure
  if (!body || body.jsonrpc !== '2.0') {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: body?.id ?? null,
        error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
      },
      { status: 400 }
    );
  }

  const { method, id, params } = body;

  StateStore.addProtocolLog({
    transport: 'STREAMABLE_HTTP',
    direction: 'REQUEST',
    method: String(method),
    params,
  });

  try {
    switch (method) {
      case 'initialize': {
        const clientVersion = params?.protocolVersion || PROTOCOL_VERSION;
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: clientVersion,
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
            },
            serverInfo: {
              name: SERVER_NAME,
              version: SERVER_VERSION,
            },
          },
        });
      }

      case 'notifications/initialized': {
        // Notification, no result response required
        return new NextResponse(null, { status: 204 });
      }

      case 'ping': {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {},
        });
      }

      case 'tools/list': {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS,
          },
        });
      }

      case 'tools/call': {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};
        if (!toolName) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Missing tool name in params' },
          });
        }

        const callResult = await McpServerEngine.callTool(toolName, toolArgs);
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: callResult,
        });
      }

      case 'resources/list': {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            resources: MCP_RESOURCES,
          },
        });
      }

      case 'resources/read': {
        const uri = params?.uri;
        if (!uri) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Missing uri parameter' },
          });
        }
        const resource = McpServerEngine.readResource(uri);
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            contents: [resource],
          },
        });
      }

      case 'prompts/list': {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            prompts: MCP_PROMPTS,
          },
        });
      }

      case 'prompts/get': {
        const promptName = params?.name;
        const promptArgs = params?.arguments || {};
        if (!promptName) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Missing prompt name parameter' },
          });
        }
        const prompt = McpServerEngine.getPrompt(promptName, promptArgs);
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: prompt,
        });
      }

      default: {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        });
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: `Internal error: ${message}` },
    });
  }
}
