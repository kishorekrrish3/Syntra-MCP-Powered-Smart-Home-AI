/**
 * @file normalizer.ts
 * @package @argon/mcp-iot-bridge
 * @description Transforms raw IoT payloads into normalized structures, MCP resources, and context-correlated urgency assessments.
 */
import { RawIoTEvent, NormalizedIoTEvent, McpResourceRepresentation, ContextMemory, UrgencyAssessment } from './types';
export declare function normalizeIoTEvent(raw: RawIoTEvent): NormalizedIoTEvent;
export declare function toMcpResource(event: NormalizedIoTEvent): McpResourceRepresentation;
export declare function correlateWithContext(event: NormalizedIoTEvent, memories: ContextMemory[]): UrgencyAssessment;
//# sourceMappingURL=normalizer.d.ts.map