# OmniGuard — Context-Aware Home Guardian, powered by Argon-MCP

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP Protocol](https://img.shields.io/badge/MCP-2024--11--05%20%7C%202025--11--25-emerald.svg)](https://modelcontextprotocol.io)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.18-black.svg)](https://nextjs.org)
[![AWS Bedrock](https://img.shields.io/badge/AWS-Bedrock%20%7C%20S3-orange.svg)](https://aws.amazon.com/bedrock)
[![Tests](https://img.shields.io/badge/Tests-19%20Passing-success.svg)](#testing-and-acceptance-criteria)

> *“Your home doesn’t just detect events. It understands what matters.”*

Built for the **Build, Ship, Shape: Amazon Developer Hackathon**, OmniGuard unifies the core Amazon developer ecosystem—**Alexa+**, **Ring**, **Fire TV**, and **AWS Cloud (Bedrock + S3)**—into a cohesive, agentic smart-home guardian powered by the open **Model Context Protocol (MCP)**.

---

## Table of Contents

1. [Product Overview & Vision](#1-product-overview--vision)
2. [The Core Problem](#2-the-core-problem)
3. [System Architecture](#3-system-architecture)
4. [Primary Hackathon Tracks & Challenges](#4-primary-hackathon-tracks--challenges)
5. [Monorepo & Package Structure](#5-monorepo--package-structure)
6. [Reusable Open Source Package (`@argon/mcp-iot-bridge`)](#6-reusable-open-source-package-argonmcp-iot-bridge)
7. [Installation & Configuration](#7-installation--configuration)
8. [Running the Application](#8-running-the-application)
9. [MCP Server Specification & Endpoints](#9-mcp-server-specification--endpoints)
10. [End-to-End Demonstration Scenarios](#10-end-to-end-demonstration-scenarios)
11. [Testing & Verification Evidence](#11-testing--verification-evidence)
12. [AWS Cloud Integration: Real vs. Simulated Mode](#12-aws-cloud-integration-real-vs-simulated-mode)
13. [Security & Safety Enforcements](#13-security--safety-enforcements)
14. [Developer Friction Log](#14-developer-friction-log)
15. [Amazon Product Feedback & Feature Requests](#15-amazon-product-feedback--feature-requests)
16. [Three-Minute Video Pitch Script](#16-three-minute-video-pitch-script)
17. [Devpost Submission Text](#17-devpost-submission-text)

---

## 1. Product Overview & Vision

Smart home systems typically flood users with low-context notifications: *"Motion detected at Front Door"* or *"Person spotted on Porch"*. Homeowners are forced to unlock their phones, launch separate camera apps, cross-reference calendar entries, and decipher whether an alert warrants an immediate interruption.

**OmniGuard** replaces disconnected notifications with **context-aware event prioritization across devices**:
- Ingests edge events from Ring doorbells and security cameras.
- Normalizes disparate telemetry into standard **Model Context Protocol (MCP)** resources via our standalone `@argon/mcp-iot-bridge` package.
- Correlates detections with personal context (e.g. timestamped wearable voice notes, prescription reminders, family arrival schedules).
- Uses AWS Bedrock generative reasoning to assess situational urgency and uncertainty.
- Selectively interrupts living-room entertainment on **Fire TV** with high-contrast, remote-navigable Picture-in-Picture cards when an event truly matters.
- Records every decision, tool call, and S3 tamper-evident archive in an inspectable timeline.

---

## 2. The Core Problem

Consider an everyday scenario:
A resident is watching a 4K movie on Fire TV. Outside, a courier delivers a damaged parcel on the porch.
- **Without OmniGuard**: The doorbell sends a generic motion ping. The resident ignores it to finish the movie. Hours later, the temperature-sensitive insulin prescription inside the crushed box has expired in the afternoon heat.
- **With OmniGuard**: The edge detection is correlated against a resident wearable voice note (*"Rapid-acting insulin arriving 2–4 PM, keep cool"*). OmniGuard assesses the situation as **EMERGENCY**, pauses the movie, pushes a Picture-in-Picture card to Fire TV, broadcasts an automated two-way audio message (*"Please wait, resident is coming to the door"*), and archives the incident record to Amazon S3.

---

## 3. System Architecture

```text
 ┌────────────────────────────────────────────────────────┐
 │            RING EDGE SENSORS / SIMULATOR               │
 │ (Doorbell Pro 2, Motion Detect, Package Anomaly, Lock) │
 └──────────────────────────┬─────────────────────────────┘
                            │ Raw IoT JSON Payload
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │        @argon/mcp-iot-bridge (Standalone Package)      │
 │   • Input Validation & Type Safety                     │
 │   • Canonical Normalization (NormalizedIoTEvent)       │
 │   • MCP Resource Generator (toMcpResource)             │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │         PERSONAL CONTEXT STORE (Bee Wearable / Notes)  │
 │   • Timestamped Voice Notes & Transcripts              │
 │   • Lexical / Semantic Contextual Correlation Engine   │
 └──────────────────────────┬─────────────────────────────┘
                            │ Urgency Assessment & Evidence
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │         MODEL CONTEXT PROTOCOL (MCP) SERVER            │
 │             (/api/mcp Streamable HTTP)                 │
 │   • Tools: ring_telemetry, hardware_actions,           │
 │            firetv_pip, context_search, aws_archive     │
 │   • Resources: telemetry, session, memories, archives  │
 │   • Prompts: frontdoor_triage, trusted_visitor         │
 └─────────────┬──────────────────────────┬───────────────┘
               │                          │
               ▼                          ▼
 ┌───────────────────────────┐  ┌─────────────────────────┐
 │        AWS CLOUD          │  │     FIRE TV LIVING ROOM │
 │ • Amazon Bedrock Claude   │  │ • 16:9 Cinematic Canvas │
 │ • Amazon S3 Archive       │  │ • D-Pad Remote Nav      │
 │ • SHA-256 Checksums       │  │ • Contextual PiP Cards  │
 └───────────────────────────┘  └─────────────────────────┘
```

---

## 4. Primary Hackathon Tracks & Challenges

| Hackathon Dimension | OmniGuard Implementation & Verification |
|---|---|
| **Track A: Alexa+** | Implemented self-hosted MCP server with Streamable HTTP transport, JSON-RPC 2.0 protocol negotiation, 6 schema-validated tools, 4 resources, 2 prompts, and live Protocol Inspector. |
| **Track B: Ring** | High-fidelity edge simulator with synthetic canvas rendering, bounding boxes, damage indicators, ambient lux calculation, and hardware state control. |
| **Track C: Fire TV** | Dedicated `/firetv` route with 16:9 cinematic styling, D-pad keyboard remote navigation (Arrow/Enter/Esc), contextual PiP cards, and server-backed shared state. |
| **Track D: Bee Wearable** | Ingestion interface for timestamped wearable voice notes with provenance tags, dynamic memory injection, and semantic correlation. |
| **AWS Builder Mini Challenge** | Integrated `@aws-sdk/client-bedrock-runtime` and `@aws-sdk/client-s3` with automatic dual execution: real cloud API calls or deterministic local reasoning. |
| **Open Source Mini Challenge** | Reusable MIT package `@argon/mcp-iot-bridge` in `packages/argon-mcp-bridge` with independent tests and documentation. |

---

## 5. Monorepo & Package Structure

```text
omniguard-argon-mcp/
├── LICENSE                               # Root MIT License
├── README.md                             # Comprehensive submission documentation
├── .env.example                          # Environment variable template
├── package.json                          # Root npm workspaces configuration
├── tsconfig.json                         # Strict TypeScript configuration
├── next.config.mjs                       # Next.js App Router configuration
├── tailwind.config.js                    # Amazon-tailored styling system
├── postcss.config.js                     # PostCSS config
├── vitest.config.ts                      # Vitest test runner configuration
├── packages/
│   └── argon-mcp-bridge/                 # Open Source Mini Challenge package
│       ├── LICENSE                       # MIT License
│       ├── README.md                     # Package documentation & API examples
│       ├── package.json                  # @argon/mcp-iot-bridge package definition
│       ├── tsconfig.json                 # Independent TypeScript configuration
│       ├── vitest.config.ts              # Package test runner config
│       ├── src/
│       │   ├── index.ts                  # Package entrypoint
│       │   ├── types.ts                  # Core IoT & MCP type definitions
│       │   ├── validator.ts              # Runtime schema validator
│       │   └── normalizer.ts             # Normalizer & Context Correlator
│       └── test/
│           └── bridge.test.ts            # 7 standalone unit tests
├── src/
│   ├── types/
│   │   └── omniguard.ts                  # Shared application typings
│   ├── lib/
│   │   ├── argon-bridge.ts               # Bridge service adapter
│   │   ├── context-provider.ts           # Personal context memory provider
│   │   ├── ring-provider.ts              # Ring simulator & hardware safety gate
│   │   ├── aws-cloud-engine.ts           # Bedrock & S3 dual-mode engine
│   │   ├── state-store.ts                # Server-backed synchronized state store
│   │   ├── event-engine.ts               # End-to-end intelligence pipeline
│   │   └── mcp-server.ts                 # Model Context Protocol server engine
│   ├── components/
│   │   ├── CameraCanvas.tsx              # Front-door synthetic camera viewport
│   │   ├── AlexaSimulatorPanel.tsx       # Alexa+ natural language console & tool trace
│   │   ├── ScenarioControls.tsx          # 4 deterministic demo scenario buttons
│   │   ├── ContextMemoryList.tsx         # Personal context store & injection modal
│   │   ├── McpProtocolInspector.tsx      # Real-time JSON-RPC 2.0 inspector
│   │   ├── FireTvMiniPreview.tsx         # Live Fire TV sync preview on dashboard
│   │   └── SubmissionDocsModal.tsx       # In-app interactive rubric & friction log
│   └── app/
│       ├── layout.tsx                    # Dark guardian root layout
│       ├── globals.css                   # Tailwind styles & remote focus halos
│       ├── page.tsx                      # Mission Control Dashboard
│       ├── firetv/
│       │   └── page.tsx                  # Dedicated 16:9 Fire TV remote experience
│       └── api/
│           ├── mcp/route.ts              # Streamable HTTP MCP endpoint
│           ├── ring-webhook/route.ts     # Ring edge event ingestion webhook
│           ├── alexa-agent/route.ts      # Alexa+ natural language agent endpoint
│           └── state/route.ts            # Server-backed shared state sync endpoint
└── tests/
    ├── mcp-server.test.ts                # MCP tools, resources & prompts tests
    ├── event-engine.test.ts              # End-to-end scenario pipeline tests
    └── aws-cloud-engine.test.ts          # Bedrock inference & S3 archive tests
```

---

## 6. Reusable Open Source Package (`@argon/mcp-iot-bridge`)

Located in [`packages/argon-mcp-bridge`](packages/argon-mcp-bridge), this package is an independent, MIT-licensed TypeScript library that standardizes IoT edge payloads into Model Context Protocol resources:

```typescript
import {
  validateIoTEvent,
  normalizeIoTEvent,
  toMcpResource,
  correlateWithContext,
} from '@argon/mcp-iot-bridge';

// Ingest and validate raw edge payload
const validation = validateIoTEvent(rawPayload);

// Normalize to canonical representation
const normalized = normalizeIoTEvent(rawPayload);

// Export as an official MCP Resource
const mcpResource = toMcpResource(normalized);
// -> uri: "omniguard://frontdoor/events/evt-101"

// Correlate with resident wearable memories
const urgency = correlateWithContext(normalized, residentMemories);
// -> urgency.level: "EMERGENCY"
// -> urgency.requiresInterruption: true
```

---

## 7. Installation & Configuration

### Prerequisites
- Node.js 20+ (Verified on Node v24.19.0)
- npm 10+ (Verified on npm 11.11.0)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd omniguard-argon-mcp
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

To run in **Real Cloud Execution Mode** (AWS Builder Challenge):
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
AWS_S3_INCIDENT_BUCKET=omniguard-incident-archives
```
*Note: If AWS credentials are left empty, OmniGuard automatically runs in high-fidelity **Deterministic Simulation Mode**.*

---

## 8. Running the Application

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for **Mission Control Dashboard**.  
Open [http://localhost:3000/firetv](http://localhost:3000/firetv) for **Fire TV Living-Room Display**.

### Production Build & Run
```bash
npm run build
npm run start
```

---

## 9. MCP Server Specification & Endpoints

OmniGuard exposes its Model Context Protocol server at `POST /api/mcp` and `GET /api/mcp` (Streamable HTTP):

### MCP Capabilities
- Protocol Version: `2024-11-05` / `2025-11-25`
- Transport: Streamable HTTP (`text/event-stream` / JSON-RPC 2.0)

### Available MCP Tools
1. `ring_get_live_telemetry` — Fetches front-door hardware status, active camera stream, and sensor indicators.
2. `ring_dispatch_hardware_action` — Dispatches smart lock, floodlight, and siren commands. Enforces safety confirmation for sensitive actions.
3. `firetv_push_pip_overlay` — Sends a contextual Picture-in-Picture alert to the Fire TV living room screen.
4. `firetv_control_playback` — Controls media playback (`play`, `pause`, `dismiss_overlay`).
5. `context_search_memories` — Queries wearable voice notes and personal context memories.
6. `aws_analyze_and_archive_incident` — Invokes AWS Bedrock AI inference and archives incident metadata to Amazon S3.

### Example MCP curl Requests

**1. Tool Discovery (`tools/list`):**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "req-1",
    "method": "tools/list",
    "params": {}
  }'
```

**2. Tool Execution (`tools/call` for `context_search_memories`):**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "req-2",
    "method": "tools/call",
    "params": {
      "name": "context_search_memories",
      "arguments": { "query": "insulin" }
    }
  }'
```

**3. Resource Read (`resources/read`):**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "req-3",
    "method": "resources/read",
    "params": {
      "uri": "omniguard://frontdoor/telemetry"
    }
  }'
```

---

## 10. End-to-End Demonstration Scenarios

The dashboard includes 4 deterministic, zero-fail demo scenarios:

### Scenario 1: Temperature-Sensitive Medical Delivery Triage
1. **Trigger**: Courier drops a parcel with visible crushed box damage.
2. **Context Correlation**: OmniGuard cross-references against a Bee Wearable note stating temperature-sensitive insulin was shipped today.
3. **Assessment**: Urgency elevated to **EMERGENCY**.
4. **Living-Room Interruption**: Fire TV movie automatically pauses; PiP card slides in with damage highlight and evidence breakdown.
5. **Action**: Resident triggers two-way audio to hold courier.
6. **Archive**: Incident metadata archived to Amazon S3.

### Scenario 2: Suspicious Nighttime Loitering
1. **Trigger**: Motion detected for 58 seconds under low-light (2 lux) conditions.
2. **Context Correlation**: Correlates with recent neighborhood watch advisory.
3. **Assessment**: Severity elevated to **WARNING**.
4. **Action**: Recommends activating 2000-lumen floodlights and displays live camera stream.

### Scenario 3: Trusted Visitor Arrival
1. **Trigger**: Uncle Dave arrives at the porch holding spare keys.
2. **Context Correlation**: Verified against Alexa note regarding car key drop-off.
3. **Action**: Welcoming notification appears on Fire TV with one-touch smart lock authorization.

### Scenario 4: All-Clear Reset
1. Restores default movie playback on Fire TV.
2. Dismisses alerts and returns hardware to standby while preserving incident history.

---

## 11. Testing & Verification Evidence

Run all 19 unit and integration tests across the monorepo:

```bash
npm run test
```

### Actual Test Execution Output
```text
 RUN  v2.1.9 D:/ACADEMICS/PROJECTS/AMAZON DEVELOPER HACKATHON

 ✓ packages/argon-mcp-bridge/test/bridge.test.ts (7 tests) 7ms
 ✓ tests/aws-cloud-engine.test.ts (2 tests) 5ms
 ✓ tests/mcp-server.test.ts (6 tests) 12ms
 ✓ tests/event-engine.test.ts (4 tests) 21ms

 Test Files  4 passed (4)
      Tests  19 passed (19)
   Start at  21:07:21
   Duration  786ms
```

### TypeScript Typecheck & Production Build Verification
```bash
npm run typecheck   # 0 errors
npm run build       # Next.js compiled successfully, all routes prerendered
```

---

## 12. AWS Cloud Integration: Real vs. Simulated Mode

OmniGuard implements a transparent **dual-mode engine** in `src/lib/aws-cloud-engine.ts`:

- **Real AWS Bedrock**: When credentials exist, constructs messages format for `anthropic.claude-3-5-sonnet-20241022-v2:0`, invokes Bedrock runtime, and records actual latency and request IDs.
- **Real Amazon S3**: Serializes incident metadata and executes `PutObjectCommand` to the configured S3 bucket.
- **High-Fidelity Simulation Mode**: When offline or credentials are not supplied, provides deterministic local reasoning and simulated S3 URIs (e.g. `s3://omniguard-incident-archives/2026/10/20/...`), with `isSimulated: true` explicitly tagged in all UI badges, protocol logs, and API payloads.

---

## 13. Security & Safety Enforcements

1. **Explicit Door Unlock Safety Gate**: Physical door unlocking cannot be triggered silently by an AI agent or single accidental click. A safety confirmation dialog is enforced across both Alexa+ and Fire TV.
2. **Siren Activation Confirmation**: High-decibel outdoor siren requires explicit resident confirmation.
3. **Zero Secrets in Bundles**: AWS credentials and Ring tokens are strictly confined to server-side route handlers.
4. **Input Schema Validation**: All external and MCP inputs are validated against strict JSON schemas before execution.

---

## 14. Developer Friction Log

As requested by hackathon guidelines, here are three genuine architectural hurdles solved during development:

### Friction Incident 1: MCP SDK Streamable HTTP vs Next.js App Router Web Stream Handshake
- **Severity**: HIGH
- **Observed Behavior**: The official `@modelcontextprotocol/sdk` `StreamableHTTPServerTransport` is designed around Node.js `IncomingMessage` and `ServerResponse`. In Next.js App Router route handlers, standard Web `Request`/`Response` objects caused stream chunking deadlocks on incoming JSON-RPC POST requests.
- **Root Cause**: Next.js App Router abstracts the underlying Node HTTP streams into Web Streams.
- **Workaround / Solution**: Built a standards-compliant App Router route handler (`src/app/api/mcp/route.ts`) that executes JSON-RPC 2.0 protocol dispatching directly while retaining SDK schema compliance and CORS negotiation.
- **Actionable Recommendation for MCP Team**: Provide a first-class `@modelcontextprotocol/sdk/server/web` adapter compatible with standard Web `Request` and `Response` objects.

### Friction Incident 2: AWS Bedrock Claude 3.5 Payload Differences vs Converse API
- **Severity**: MEDIUM
- **Observed Behavior**: Invoking Bedrock with `InvokeModelCommand` requires vendor-specific JSON formats (Anthropic Messages API format) rather than a uniform request envelope. Calling Claude with standard `prompt` fields produces silent 400 validation failures.
- **Workaround / Solution**: Implemented a specialized Bedrock client wrapper in `src/lib/aws-cloud-engine.ts` formatting the request with `anthropic_version: "bedrock-2023-05-31"` and structured message arrays, backed by deterministic fallback.
- **Actionable Recommendation for AWS Team**: Standardize the Bedrock JavaScript SDK to automatically handle vendor envelope formatting through a unified prompt abstraction.

### Friction Incident 3: Fire TV Remote Navigation Focus Trapping Across Viewports
- **Severity**: MEDIUM
- **Observed Behavior**: When testing Fire TV in a browser tab, D-pad arrow keys scrolled the browser window rather than navigating on-screen buttons, and browser `localStorage` failed to synchronize state across independent windows.
- **Workaround / Solution**: Implemented custom keydown interceptors with `e.preventDefault()`, added distinct amber focus rings (`.remote-focused`), and backed cross-window synchronization with a polling server store (`/api/state`).
- **Actionable Recommendation for Amazon Fire TV Web Team**: Publish official React hooks for Fire TV Web Apps encapsulating D-pad focus management and spatial navigation.

---

## 15. Amazon Product Feedback & Feature Requests

### Alexa+ & MCP Ecosystem
- **What Worked Well**: The Model Context Protocol provides an exceptionally clean mental model for tool dispatching and contextual grounding.
- **Areas for Improvement**: Streamable HTTP specification needs clearer documentation around session reconnection lifecycle and server-sent event heartbeats.
- **Feature Request**: An official Alexa+ MCP simulator CLI that can pipe synthetic voice intents directly into local MCP server endpoints.

### Ring Developer Experience
- **What Worked Well**: The event structure of Ring doorbells (motion, doorbell press, two-way audio) maps naturally to canonical IoT representations.
- **Feature Request**: Official Ring Webhook Sandbox environment allowing developers to test edge AI bounding-box triggers and camera snapshots without physical hardware.

### Fire TV Web Development
- **What Worked Well**: The 16:9 layout with dark cinematic themes provides an immersive living-room canvas.
- **Feature Request**: A standardized Fire TV Picture-in-Picture Web API allowing background web apps to request non-intrusive overlays over native media streams.

---

## 16. Three-Minute Video Pitch Script

- **0:00–0:20 (Problem)**: Show resident watching a movie on Fire TV. Highlight how modern smart homes send hundreds of low-context alerts that get ignored.
- **0:20–0:55 (Trigger & Context)**: Courier arrives with damaged package. Ring simulator fires event. OmniGuard retrieves Bee Wearable note regarding urgent insulin prescription.
- **0:55–1:35 (MCP Intelligence Trace)**: Open Mission Control dashboard. Show live Protocol Inspector executing `ring_get_live_telemetry`, `context_search_memories`, and Bedrock AI inference.
- **1:35–2:15 (Fire TV Experience)**: Switch to `/firetv`. Movie pauses; Picture-in-Picture card slides in. Demonstrate D-Pad remote navigation: selecting "Hold Courier" to broadcast two-way audio.
- **2:15–2:40 (Technical Proof)**: Highlight 19 passing tests, `@argon/mcp-iot-bridge` open-source package, and verified S3 incident archive URI.
- **2:40–3:00 (Conclusion)**: Summary of consumer impact: OmniGuard ensures your home doesn't just detect events—it understands what matters.

---

## 17. Devpost Submission Text

### Project Title
**OmniGuard — Context-Aware Home Guardian, powered by Argon-MCP**

### Short Tagline
*Your home doesn't just detect events. It understands what matters.*

### Inspiration
Today's smart homes are noisy and fragmented. When a delivery arrives or motion is detected, our devices spam our phones with generic alerts. But whether that alert matters depends entirely on context: Is that crushed package a generic cardboard box, or a temperature-sensitive prescription the resident needs immediately? We built OmniGuard to connect front-door edge sensors, personal wearable context, living-room entertainment, and generative cloud AI into a unified guardian.

### What It Does
When an edge event occurs at the front door:
1. **Ingests & Validates**: Standardizes the event using our open-source `@argon/mcp-iot-bridge` library.
2. **Context Correlation**: Retrieves timestamped personal notes (e.g. Bee Wearable memos, doctor prescription reminders, visitor drop-offs).
3. **Agentic Reasoning**: Dispatches MCP tools to evaluate urgency and uncertainty using Amazon Bedrock.
4. **Living-Room Interruption**: If urgent, pauses media playback on Fire TV and pushes a high-contrast Picture-in-Picture card with remote-navigable response actions.
5. **Incident Archival**: Archives structured evidence to Amazon S3.

### How We Built It
- **Monorepo**: Next.js App Router, React 18, TypeScript, Tailwind CSS.
- **MCP Server**: Implemented official Model Context Protocol Streamable HTTP endpoint with tools, resources, and prompts.
- **AWS Integration**: Bedrock Runtime (`anthropic.claude-3-5-sonnet`) and S3 Client with dual execution mode.
- **Fire TV UI**: 16:9 remote-accessible interface with D-pad keyboard navigation.
- **Testing**: 19 automated unit and integration tests across package, server, and scenarios.

### Accomplishments That We're Proud Of
- 100% test pass rate across 4 independent test suites.
- Fully working, reproducible end-to-end scenarios.
- Standalone MIT-licensed open-source package (`@argon/mcp-iot-bridge`).
- Zero console errors and zero broken links.

---

## License

MIT © 2026 OmniGuard Contributors & Argon Team
Amazon Developer Hackathon: Build, Ship, Shape
