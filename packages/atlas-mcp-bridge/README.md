# @atlas/mcp-iot-bridge

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP Protocol](https://img.shields.io/badge/MCP-2024--11--05%20%7C%202025--11--25-emerald.svg)](https://modelcontextprotocol.io)

**Standardized TypeScript bridge normalizing edge IoT events (Ring, smart locks, cameras, sensors) into Model Context Protocol (MCP) resources, tools, and context-correlated assessments for Agentic AI in SYNTRA.**

Built as a core open-source building block for the **Build, Ship, Shape: Amazon Developer Hackathon** and designed for seamless integration with Alexa+, AWS Bedrock, and smart living-room interfaces.

---

## Features

- **Schema Normalization**: Converts disparate IoT vendor payloads (e.g. Ring Doorbell motion, package detections, smart lock telemetry) into a canonical `NormalizedIoTEvent`.
- **MCP Resource Generation**: Directly produces `McpResourceRepresentation` objects ready to be served by any `@modelcontextprotocol/sdk` server.
- **Contextual Correlation Engine**: Deterministically evaluates edge events against personal context notes (e.g., Bee wearable transcripts, Alexa voice memos) to compute an `UrgencyAssessment`.
- **Zero Runtime Dependencies**: Lightweight, typed, and dependency-free core.
- **Full Type Safety**: Comprehensive TypeScript typings and runtime schema validation.

---

## Installation

```bash
npm install @atlas/mcp-iot-bridge
```

Or when developing within the SYNTRA monorepo:

```bash
npm install
```

---

## Quick Start

```typescript
import {
  validateIoTEvent,
  normalizeIoTEvent,
  toMcpResource,
  correlateWithContext,
  RawIoTEvent,
  ContextMemory,
} from '@atlas/mcp-iot-bridge';

// 1. Raw event from Ring or simulated webhook
const rawEvent: RawIoTEvent = {
  id: 'evt-2026-001',
  timestamp: new Date().toISOString(),
  deviceType: 'ring_doorbell',
  deviceId: 'front-door-ring-pro',
  location: 'Front Door',
  eventType: 'package_anomaly',
  simulated: true,
  confidence: 0.94,
  payload: {
    courierName: 'BioPharma Direct',
    packageCondition: 'crushed',
    packageAnomalyDetected: true,
  },
};

// 2. Validate event
const validation = validateIoTEvent(rawEvent);
if (!validation.isValid) {
  console.error('Invalid event:', validation.errors);
}

// 3. Normalize to canonical IoT representation
const normalized = normalizeIoTEvent(rawEvent);

// 4. Convert to Model Context Protocol (MCP) Resource
const mcpResource = toMcpResource(normalized);
console.log('MCP URI:', mcpResource.uri); // syntra://frontdoor/events/evt-2026-001

// 5. Correlate with wearable or personal context memories
const userMemories: ContextMemory[] = [
  {
    id: 'mem-101',
    timestamp: '2026-10-20T10:00:00Z',
    source: 'bee_wearable',
    category: 'medical',
    content: 'Expecting temperature-controlled insulin today. Must be refrigerated immediately.',
    tags: ['medical', 'insulin', 'temperature'],
  },
];

const assessment = correlateWithContext(normalized, userMemories);
console.log('Urgency Level:', assessment.level); // 'EMERGENCY'
console.log('Requires TV Interruption:', assessment.requiresInterruption); // true
```

---

## MCP Protocol Compatibility

This package targets the Model Context Protocol specification:
- Transport compatibility: **Streamable HTTP** (`text/event-stream` / JSON-RPC 2.0) and **stdio**.
- Protocol versions: `2024-11-05` and `2025-11-25`.
- MCP primitive support: **Resources** (`resources/list`, `resources/read`), **Tools** (`tools/list`, `tools/call`), and **Prompts** (`prompts/get`).

---

## License

MIT © SYNTRA Contributors & ATLAS-MCP Team
