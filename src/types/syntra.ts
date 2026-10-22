/**
 * @file syntra.ts
 * @description Central TypeScript types for SYNTRA: Context-Aware Smart Home AI powered by ATLAS-MCP.
 */

import {
  RawIoTEvent,
  NormalizedIoTEvent,
  ContextMemory,
  UrgencyAssessment,
  McpResourceRepresentation,
  SeverityLevel,
} from '@atlas/mcp-iot-bridge';

export type {
  RawIoTEvent,
  NormalizedIoTEvent,
  ContextMemory,
  UrgencyAssessment,
  McpResourceRepresentation,
  SeverityLevel,
};

export type ScenarioId = 'scenario_1_delivery' | 'scenario_2_suspicious' | 'scenario_3_visitor' | 'scenario_4_reset';

export interface HardwareState {
  frontDoorLock: 'LOCKED' | 'UNLOCKED' | 'JAMMED';
  floodlight: 'OFF' | 'DIMMED' | 'HIGH';
  siren: 'OFF' | 'ACTIVE';
  cameraStreaming: boolean;
  courierIntercomActive: boolean;
}

export interface FireTvState {
  playbackState: 'PLAYING' | 'PAUSED' | 'IDLE';
  currentMedia: {
    title: string;
    runtime: string;
    progressPercent: number;
    backdropUrl: string;
  };
  pipOverlay: {
    active: boolean;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
    title: string;
    summary: string;
    evidence: string[];
    recommendedActions: string[];
    courierWaiting: boolean;
    doorUnlocked: boolean;
    timestamp: string;
    sourceEventId: string;
  } | null;
  remoteNavigation: {
    focusedControlId: string;
    lastKeyPress: string;
    lastKeyTimestamp: string;
  };
}

export interface AwsCloudState {
  mode: 'REAL_BEDROCK_S3' | 'SIMULATED_LOCAL';
  configuredRegion: string;
  configuredModel: string;
  s3Bucket: string;
  hasCredentials: boolean;
  lastInference: {
    executedAt: string;
    model: string;
    latencyMs: number;
    reasoning: string;
    confidence: number;
    tokensUsed?: number;
    isSimulated: boolean;
    requestId: string;
  } | null;
  lastArchive: {
    archivedAt: string;
    s3Uri: string;
    recordSize: number;
    isSimulated: boolean;
    checksum: string;
  } | null;
}

export interface ProtocolLogEntry {
  id: string;
  timestamp: string;
  transport: 'STREAMABLE_HTTP' | 'JSON_RPC_2_0';
  direction: 'REQUEST' | 'RESPONSE' | 'NOTIFICATION';
  method: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
  latencyMs?: number;
}

export interface TimelineActionItem {
  id: string;
  timestamp: string;
  actor: 'RING_SENSOR' | 'ATLAS_BRIDGE' | 'ARGON_BRIDGE' | 'ALEXA_AGENT' | 'BEDROCK_AI' | 'FIRE_TV' | 'RESIDENT';
  action: string;
  summary: string;
  details?: Record<string, unknown>;
  severity?: SeverityLevel;
}

export interface SyntraGlobalState {
  activeScenario: ScenarioId | 'IDLE';
  currentEvent: NormalizedIoTEvent | null;
  rawEventHistory: RawIoTEvent[];
  hardware: HardwareState;
  fireTv: FireTvState;
  memories: ContextMemory[];
  aws: AwsCloudState;
  protocolLogs: ProtocolLogEntry[];
  timeline: TimelineActionItem[];
  agentConversation: Array<{
    id: string;
    sender: 'user' | 'alexa' | 'system';
    text: string;
    timestamp: string;
    toolCalls?: Array<{ toolName: string; arguments: unknown; result: unknown }>;
  }>;
}

// Backward compatibility alias
export type OmniGuardGlobalState = SyntraGlobalState;
