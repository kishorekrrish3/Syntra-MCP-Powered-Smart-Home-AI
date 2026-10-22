/**
 * @file atlas-bridge.ts
 * @description Application bridge wrapper integrating @atlas/mcp-iot-bridge for SYNTRA.
 */

import {
  RawIoTEvent,
  NormalizedIoTEvent,
  McpResourceRepresentation,
  ContextMemory,
  UrgencyAssessment,
  validateIoTEvent,
  normalizeIoTEvent,
  toMcpResource,
  correlateWithContext,
} from '@atlas/mcp-iot-bridge';

export class AtlasBridgeService {
  /**
   * Ingest and validate a raw IoT payload from edge sensors or simulator.
   */
  public static ingestAndValidate(raw: unknown) {
    return validateIoTEvent(raw);
  }

  /**
   * Normalize an edge event into canonical IoT format.
   */
  public static normalize(raw: RawIoTEvent): NormalizedIoTEvent {
    return normalizeIoTEvent(raw);
  }

  /**
   * Convert normalized event into an MCP-compliant resource representation.
   */
  public static toResource(event: NormalizedIoTEvent): McpResourceRepresentation {
    return toMcpResource(event);
  }

  /**
   * Correlate edge event with active personal context memories.
   */
  public static correlate(event: NormalizedIoTEvent, memories: ContextMemory[]): UrgencyAssessment {
    return correlateWithContext(event, memories);
  }
}

// Backward compatibility alias
export const ArgonBridgeService = AtlasBridgeService;
