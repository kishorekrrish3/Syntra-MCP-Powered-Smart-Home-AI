/**
 * @file mcp-server.ts
 * @description Official Model Context Protocol (MCP) server implementation for SYNTRA powered by ATLAS-MCP (Track A: Alexa+).
 */

import { StateStore } from './state-store';
import { RingProvider } from './ring-provider';
import { ContextProvider } from './context-provider';
import { AwsCloudEngine } from './aws-cloud-engine';
import { AtlasBridgeService } from './atlas-bridge';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface McpPromptDefinition {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'ring_get_live_telemetry',
    description: 'Returns real-time front-door telemetry, device sensor states, current edge event, and simulated vs real indicators.',
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'string', description: 'Optional specific Ring device ID' },
      },
    },
  },
  {
    name: 'ring_dispatch_hardware_action',
    description: 'Dispatches smart hardware actions (unlock_door, lock_door, toggle_floodlight, trigger_siren, silence_siren, intercom_courier_wait). Sensitive actions (unlock_door, trigger_siren) require explicit confirmed=true flag.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['unlock_door', 'lock_door', 'toggle_floodlight', 'trigger_siren', 'silence_siren', 'intercom_courier_wait'],
          description: 'Hardware action to execute',
        },
        confirmed: {
          type: 'boolean',
          description: 'Safety confirmation required for sensitive actions like door unlock and siren trigger',
        },
        durationSec: {
          type: 'number',
          description: 'Optional duration in seconds',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'firetv_push_pip_overlay',
    description: 'Pushes an urgent or high-priority Picture-in-Picture card to the Fire TV living-room display, pausing media playback.',
    inputSchema: {
      type: 'object',
      properties: {
        urgency: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'],
          description: 'Urgency tier of the alert',
        },
        title: { type: 'string', description: 'Headline of the alert' },
        summary: { type: 'string', description: 'Contextual explanation for resident' },
        evidence: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of evidence reasons explaining why this matters',
        },
        pauseMedia: { type: 'boolean', description: 'Whether to pause active media playback' },
      },
      required: ['urgency', 'title', 'summary'],
    },
  },
  {
    name: 'firetv_control_playback',
    description: 'Controls Fire TV media playback state and dismisses active Picture-in-Picture alerts.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['play', 'pause', 'dismiss_overlay'],
          description: 'Playback or overlay command',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'context_search_memories',
    description: 'Searches personal context memories (Bee Wearable notes, Alexa voice memos, calendar) using semantic keywords and tags.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keywords or context phrase' },
        category: {
          type: 'string',
          enum: ['medical', 'visitor', 'security', 'delivery', 'general'],
          description: 'Optional category filter',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'aws_analyze_and_archive_incident',
    description: 'Runs Amazon Bedrock AI inference (or deterministic fallback) on the current event and archives structured metadata to Amazon S3.',
    inputSchema: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'ID of the event to analyze and archive' },
      },
    },
  },
];

export const MCP_RESOURCES: McpResourceDefinition[] = [
  {
    uri: 'syntra://frontdoor/telemetry',
    name: 'Front Door Edge Telemetry',
    description: 'Current sensor telemetry, door lock state, floodlight, and active camera stream from front door.',
    mimeType: 'application/json',
  },
  {
    uri: 'syntra://livingroom/session',
    name: 'Living Room Fire TV Session',
    description: 'Active media playback status, currently focused control, and active PiP overlay state.',
    mimeType: 'application/json',
  },
  {
    uri: 'syntra://context/memories',
    name: 'Personal Context Memories',
    description: 'Active timestamped memories from Bee Wearable and Alexa voice notes.',
    mimeType: 'application/json',
  },
  {
    uri: 'syntra://incidents/archive',
    name: 'Incident Archive & S3 Metadata',
    description: 'Historical records of triaged incidents, AI reasoning traces, and Amazon S3 archive URIs.',
    mimeType: 'application/json',
  },
];

export const MCP_PROMPTS: McpPromptDefinition[] = [
  {
    name: 'frontdoor_triage',
    description: 'Guides Alexa+ agent to triage front-door events using contextual memories, evaluating uncertainty, and recommending safe actions.',
    arguments: [
      {
        name: 'eventSummary',
        description: 'Brief summary of the detected front-door event',
        required: true,
      },
    ],
  },
  {
    name: 'trusted_visitor_handling',
    description: 'Guides Alexa+ agent to handle trusted visitor arrival with hospitality and verified safety checks.',
    arguments: [
      {
        name: 'visitorName',
        description: 'Name of recognized visitor',
        required: true,
      },
    ],
  },
];

export class McpServerEngine {
  /**
   * Dispatches and executes an MCP tool call.
   */
  public static async callTool(toolName: string, args: Record<string, unknown> = {}) {
    const startTime = Date.now();

    try {
      let resultData: unknown;

      switch (toolName) {
        case 'ring_get_live_telemetry': {
          const state = StateStore.getState();
          resultData = {
            device: 'ring_doorbell',
            deviceId: 'ring-pro2-front-entry',
            location: 'Front Door Porch',
            hardware: state.hardware,
            currentEvent: state.currentEvent,
            isSimulated: state.currentEvent?.source.isSimulated ?? true,
            timestamp: new Date().toISOString(),
          };
          break;
        }

        case 'ring_dispatch_hardware_action': {
          const action = String(args.action) as 'unlock_door' | 'lock_door' | 'toggle_floodlight' | 'trigger_siren' | 'silence_siren' | 'intercom_courier_wait';
          const confirmed = Boolean(args.confirmed);
          const res = await RingProvider.executeHardwareAction(action, { confirmed });

          if (res.success) {
            StateStore.updateState(state => {
              if (action === 'unlock_door') state.hardware.frontDoorLock = 'UNLOCKED';
              if (action === 'lock_door') state.hardware.frontDoorLock = 'LOCKED';
              if (action === 'toggle_floodlight') state.hardware.floodlight = state.hardware.floodlight === 'HIGH' ? 'OFF' : 'HIGH';
              if (action === 'trigger_siren') state.hardware.siren = 'ACTIVE';
              if (action === 'silence_siren') state.hardware.siren = 'OFF';
              if (action === 'intercom_courier_wait') state.hardware.courierIntercomActive = true;
            });

            StateStore.addTimelineItem({
              actor: 'ALEXA_AGENT',
              action: `HARDWARE_${action.toUpperCase()}`,
              summary: res.message,
              severity: 'NOTICE',
            });
          }

          resultData = res;
          break;
        }

        case 'firetv_push_pip_overlay': {
          const urgency = (args.urgency as 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY') || 'HIGH';
          const title = String(args.title || 'Front Door Alert');
          const summary = String(args.summary || 'Activity detected at front door');
          const evidence = Array.isArray(args.evidence) ? (args.evidence as string[]) : [];
          const pauseMedia = args.pauseMedia !== false;

          StateStore.updateState(state => {
            if (pauseMedia) state.fireTv.playbackState = 'PAUSED';
            state.fireTv.pipOverlay = {
              active: true,
              urgency,
              title,
              summary,
              evidence,
              recommendedActions: ['Inspect Camera', 'Acknowledge & Resume Playback'],
              courierWaiting: false,
              doorUnlocked: false,
              timestamp: new Date().toISOString(),
              sourceEventId: state.currentEvent?.eventId || `evt-${Date.now()}`,
            };
          });

          StateStore.addTimelineItem({
            actor: 'FIRE_TV',
            action: 'PIP_OVERLAY_PUSHED',
            summary: `PiP alert pushed: ${title}`,
            severity: urgency === 'EMERGENCY' ? 'CRITICAL' : 'WARNING',
          });

          resultData = { success: true, playbackState: pauseMedia ? 'PAUSED' : 'PLAYING' };
          break;
        }

        case 'firetv_control_playback': {
          const action = String(args.action);
          StateStore.updateState(state => {
            if (action === 'play') state.fireTv.playbackState = 'PLAYING';
            if (action === 'pause') state.fireTv.playbackState = 'PAUSED';
            if (action === 'dismiss_overlay') {
              state.fireTv.pipOverlay = null;
              state.fireTv.playbackState = 'PLAYING';
            }
          });

          resultData = { success: true, action, currentPlayback: StateStore.getState().fireTv.playbackState };
          break;
        }

        case 'context_search_memories': {
          const query = String(args.query || '');
          const results = ContextProvider.searchMemories(query);
          resultData = {
            query,
            matchCount: results.length,
            memories: results,
          };
          break;
        }

        case 'aws_analyze_and_archive_incident': {
          const state = StateStore.getState();
          const event = state.currentEvent;
          if (!event) {
            resultData = { success: false, message: 'No active event to analyze or archive' };
            break;
          }
          const memories = state.memories;
          const assessment = AtlasBridgeService.correlate(event, memories);
          const analysis = await AwsCloudEngine.analyzeAndArchiveIncident(event, memories, assessment);
          resultData = analysis;
          break;
        }

        default:
          throw new Error(`Tool not found: ${toolName}`);
      }

      const latencyMs = Date.now() - startTime;
      StateStore.addProtocolLog({
        transport: 'STREAMABLE_HTTP',
        direction: 'RESPONSE',
        method: `tools/call -> ${toolName}`,
        params: args,
        result: resultData,
        latencyMs,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(resultData, null, 2),
          },
        ],
        isError: false,
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);

      StateStore.addProtocolLog({
        transport: 'STREAMABLE_HTTP',
        direction: 'RESPONSE',
        method: `tools/call -> ${toolName}`,
        params: args,
        error: errorMessage,
        latencyMs,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: errorMessage }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Reads an MCP resource by URI.
   */
  public static readResource(uri: string) {
    const state = StateStore.getState();

    switch (uri) {
      case 'syntra://frontdoor/telemetry':
      case 'omniguard://frontdoor/telemetry':
        return {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              device: 'ring_doorbell',
              location: 'Front Door Porch',
              hardware: state.hardware,
              currentEvent: state.currentEvent,
            },
            null,
            2
          ),
        };

      case 'syntra://livingroom/session':
      case 'omniguard://livingroom/session':
        return {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(state.fireTv, null, 2),
        };

      case 'syntra://context/memories':
      case 'omniguard://context/memories':
        return {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(state.memories, null, 2),
        };

      case 'syntra://incidents/archive':
      case 'omniguard://incidents/archive':
        return {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              lastInference: state.aws.lastInference,
              lastArchive: state.aws.lastArchive,
              cloudMode: state.aws.mode,
            },
            null,
            2
          ),
        };

      default:
        throw new Error(`Resource not found for URI: ${uri}`);
    }
  }

  /**
   * Retrieves an MCP prompt template.
   */
  public static getPrompt(promptName: string, args: Record<string, string> = {}) {
    switch (promptName) {
      case 'frontdoor_triage': {
        const eventSummary = args.eventSummary || 'Unspecified front-door event';
        return {
          description: 'Context-aware front-door triage',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `You are SYNTRA Alexa+ agent powered by ATLAS-MCP.
Evaluate this front-door event: "${eventSummary}".
Cross-reference with user context memories (search via context_search_memories).
Provide:
1. What happened.
2. Why it matters (evidence & correlation).
3. Uncertainties (what is unverified).
4. Recommended non-destructive action.
5. If high urgency, push a Fire TV PiP alert using firetv_push_pip_overlay.`,
              },
            },
          ],
        };
      }

      case 'trusted_visitor_handling': {
        const visitorName = args.visitorName || 'Friend/Family';
        return {
          description: 'Accessibility-conscious trusted visitor handling',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `You are SYNTRA Alexa+ agent powered by ATLAS-MCP.
Recognized visitor "${visitorName}" is at the front door.
Provide a welcoming living-room notification and offer the resident safe one-touch smart lock authorization.`,
              },
            },
          ],
        };
      }

      default:
        throw new Error(`Prompt not found: ${promptName}`);
    }
  }
}
