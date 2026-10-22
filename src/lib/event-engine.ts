/**
 * @file event-engine.ts
 * @description Core intelligence pipeline: Ring edge event -> ATLAS-MCP normalization -> Context correlation -> AWS Bedrock -> Fire TV PiP -> Timeline.
 */

import { RawIoTEvent, ScenarioId } from '@/types/syntra';
import { StateStore } from './state-store';
import { AtlasBridgeService } from './atlas-bridge';
import { RingProvider } from './ring-provider';
import { AwsCloudEngine } from './aws-cloud-engine';

export class EventEngine {
  /**
   * Triggers one of the 4 defined scenarios end-to-end.
   */
  public static async triggerScenario(scenario: ScenarioId) {
    if (scenario === 'scenario_4_reset') {
      return this.resetAllClear();
    }

    const rawEvent = RingProvider.getScenarioEvent(scenario);
    return this.processEvent(rawEvent, scenario);
  }

  /**
   * Ingests and processes a raw IoT event through the entire SYNTRA pipeline.
   */
  public static async processEvent(rawEvent: RawIoTEvent, scenarioTag?: ScenarioId) {
    // 1. Validate
    const validation = AtlasBridgeService.ingestAndValidate(rawEvent);
    if (!validation.isValid) {
      throw new Error(`Invalid IoT event: ${validation.errors.join(', ')}`);
    }

    // 2. Normalize via @atlas/mcp-iot-bridge
    const normalized = AtlasBridgeService.normalize(rawEvent);

    // 3. Update StateStore with current event & history
    StateStore.updateState(state => {
      if (scenarioTag) state.activeScenario = scenarioTag;
      state.currentEvent = normalized;
      state.rawEventHistory.unshift(rawEvent);
      if (state.rawEventHistory.length > 20) {
        state.rawEventHistory = state.rawEventHistory.slice(0, 20);
      }
    });

    StateStore.addTimelineItem({
      actor: 'RING_SENSOR',
      action: 'EVENT_INGESTED',
      summary: `${normalized.title} detected at ${normalized.source.location}`,
      severity: normalized.severity,
      details: { eventId: normalized.eventId, deviceType: normalized.source.deviceType },
    });

    // 4. Retrieve contextual memories
    const currentState = StateStore.getState();
    const memories = currentState.memories;

    // 5. Correlate with context
    const assessment = AtlasBridgeService.correlate(normalized, memories);

    StateStore.addTimelineItem({
      actor: 'ATLAS_BRIDGE',
      action: 'CONTEXT_CORRELATION',
      summary: `Urgency assessed as ${assessment.level}: ${assessment.reason}`,
      severity: assessment.level === 'EMERGENCY' ? 'CRITICAL' : assessment.level === 'HIGH' ? 'WARNING' : 'INFO',
      details: {
        matches: assessment.matchedMemories,
        interruptionRequired: assessment.requiresInterruption,
      },
    });

    // 6. Invoke AWS Bedrock & S3 Archive (Dual Mode)
    const analysis = await AwsCloudEngine.analyzeAndArchiveIncident(normalized, memories, assessment);

    StateStore.updateState(state => {
      state.aws.lastInference = {
        executedAt: new Date().toISOString(),
        model: analysis.model,
        latencyMs: analysis.latencyMs,
        reasoning: analysis.reasoning,
        confidence: analysis.confidence,
        tokensUsed: analysis.tokensUsed,
        isSimulated: analysis.isSimulated,
        requestId: analysis.requestId,
      };

      if (analysis.s3Archive) {
        state.aws.lastArchive = {
          archivedAt: analysis.s3Archive.archivedAt,
          s3Uri: analysis.s3Archive.s3Uri,
          recordSize: analysis.s3Archive.recordSize,
          isSimulated: analysis.s3Archive.isSimulated,
          checksum: analysis.s3Archive.checksum,
        };
      }
    });

    StateStore.addTimelineItem({
      actor: 'BEDROCK_AI',
      action: analysis.isSimulated ? 'INFERENCE_SIMULATED' : 'BEDROCK_INFERENCE',
      summary: `Analyzed with ${analysis.model} (${analysis.latencyMs}ms)`,
      severity: 'INFO',
      details: {
        requestId: analysis.requestId,
        s3Archive: analysis.s3Archive?.s3Uri,
      },
    });

    // 7. Update Fire TV Living-Room Experience
    if (assessment.requiresInterruption) {
      StateStore.updateState(state => {
        state.fireTv.playbackState = 'PAUSED';
        state.fireTv.pipOverlay = {
          active: true,
          urgency: assessment.level,
          title: normalized.title,
          summary: normalized.summary,
          evidence: assessment.matchedMemories.map(m => m.relevanceReason),
          recommendedActions: [
            assessment.recommendedAction,
            'Hold Courier via Two-Way Audio',
            'Dismiss & Resume Movie',
          ],
          courierWaiting: false,
          doorUnlocked: false,
          timestamp: new Date().toISOString(),
          sourceEventId: normalized.eventId,
        };
      });

      StateStore.addTimelineItem({
        actor: 'FIRE_TV',
        action: 'MEDIA_PAUSED_PIP_PUSHED',
        summary: `Living room display interrupted with ${assessment.level} Picture-in-Picture alert`,
        severity: 'WARNING',
      });
    }

    // 8. Add entry to Agent Conversation
    StateStore.updateState(state => {
      state.agentConversation.push({
        id: `msg-${Date.now()}`,
        sender: 'alexa',
        text: `${assessment.reason}\n\nEvidence Summary:\n${analysis.reasoning}`,
        timestamp: new Date().toISOString(),
        toolCalls: [
          {
            toolName: 'ring_get_live_telemetry',
            arguments: { eventId: normalized.eventId },
            result: { location: normalized.source.location, severity: normalized.severity },
          },
          {
            toolName: 'context_search_memories',
            arguments: { query: normalized.title },
            result: { matchedCount: assessment.matchedMemories.length },
          },
          {
            toolName: 'firetv_push_pip_overlay',
            arguments: { urgency: assessment.level, eventId: normalized.eventId },
            result: { success: true },
          },
        ],
      });
    });

    return {
      event: normalized,
      assessment,
      analysis,
    };
  }

  /**
   * Resets active alerts, dismisses PiP, restores entertainment playback.
   */
  public static resetAllClear() {
    StateStore.updateState(state => {
      state.activeScenario = 'scenario_4_reset';
      state.fireTv.playbackState = 'PLAYING';
      state.fireTv.pipOverlay = null;
      state.hardware.courierIntercomActive = false;
      state.hardware.frontDoorLock = 'LOCKED';
      state.hardware.floodlight = 'OFF';
      state.hardware.siren = 'OFF';
    });

    StateStore.addTimelineItem({
      actor: 'RESIDENT',
      action: 'ALL_CLEAR_RESTORED',
      summary: 'All alerts dismissed. Entertainment playback resumed. Hardware returned to standby.',
      severity: 'INFO',
    });

    return { success: true, message: 'All clear restored' };
  }
}
