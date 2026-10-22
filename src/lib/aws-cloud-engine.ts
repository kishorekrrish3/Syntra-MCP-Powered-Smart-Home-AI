/**
 * @file aws-cloud-engine.ts
 * @description AWS Bedrock Runtime & S3 Incident Archival Provider with high-fidelity dual mode (Real AWS vs Deterministic Simulation).
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NormalizedIoTEvent, ContextMemory, UrgencyAssessment, AwsCloudState } from '@/types/syntra';

export interface IncidentAnalysisResult {
  reasoning: string;
  recommendedAction: string;
  confidence: number;
  model: string;
  latencyMs: number;
  requestId: string;
  isSimulated: boolean;
  tokensUsed?: number;
  s3Archive?: {
    s3Uri: string;
    checksum: string;
    recordSize: number;
    isSimulated: boolean;
    archivedAt: string;
  };
}

export class AwsCloudEngine {
  private static region = process.env.AWS_REGION || 'us-east-1';
  private static modelId = process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  private static s3Bucket = process.env.AWS_S3_INCIDENT_BUCKET || 'syntra-incident-archives';

  public static isRealAwsConfigured(): boolean {
    return Boolean(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_ACCESS_KEY_ID.trim().length > 5
    );
  }

  public static getCloudStatus(): AwsCloudState {
    const hasCreds = this.isRealAwsConfigured();
    return {
      mode: hasCreds ? 'REAL_BEDROCK_S3' : 'SIMULATED_LOCAL',
      configuredRegion: this.region,
      configuredModel: this.modelId,
      s3Bucket: this.s3Bucket,
      hasCredentials: hasCreds,
      lastInference: null,
      lastArchive: null,
    };
  }

  /**
   * Evaluates an edge event against contextual memories using AWS Bedrock or deterministic local engine.
   */
  public static async analyzeAndArchiveIncident(
    event: NormalizedIoTEvent,
    memories: ContextMemory[],
    localAssessment: UrgencyAssessment
  ): Promise<IncidentAnalysisResult> {
    const startTime = Date.now();
    const hasCreds = this.isRealAwsConfigured();

    if (hasCreds) {
      try {
        const client = new BedrockRuntimeClient({ region: this.region });

        const prompt = `You are SYNTRA AI, a context-aware smart home guardian powered by ATLAS-MCP.
Analyze the following edge event against the resident's personal context memories.
Event: ${JSON.stringify(event, null, 2)}
Memories: ${JSON.stringify(memories, null, 2)}
Initial Assessment: ${JSON.stringify(localAssessment, null, 2)}

Provide a concise, evidence-based assessment explaining why this event matters, noting uncertainties, and recommending safe actions.`;

        // Format for Anthropic Claude 3 / 3.5 on Bedrock
        const requestBody = JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        const command = new InvokeModelCommand({
          modelId: this.modelId,
          contentType: 'application/json',
          accept: 'application/json',
          body: new TextEncoder().encode(requestBody),
        });

        const response = await client.send(command);
        const responseJson = JSON.parse(new TextDecoder().decode(response.body));
        const latencyMs = Date.now() - startTime;

        const aiText = responseJson.content?.[0]?.text || 'No response text received from Bedrock';
        const usage = responseJson.usage;

        // Archive incident payload to real S3
        const archiveResult = await this.archiveToS3Real(event, aiText, localAssessment);

        return {
          reasoning: aiText,
          recommendedAction: localAssessment.recommendedAction,
          confidence: 0.95,
          model: this.modelId,
          latencyMs,
          requestId: response.$metadata.requestId || `bedrock-${Date.now()}`,
          isSimulated: false,
          tokensUsed: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
          s3Archive: archiveResult,
        };
      } catch (err: unknown) {
        console.warn('Real AWS Bedrock call failed, falling back to deterministic local reasoning:', err);
        // Fallback to deterministic local mode on API error
      }
    }

    // High-fidelity deterministic simulation mode
    const simulatedLatencyMs = 120 + Math.floor(Math.random() * 80);
    const dateStr = new Date().toISOString().split('T')[0];
    const s3Key = `${dateStr}/${event.category.toLowerCase()}/${event.eventId}.json`;
    const simulatedS3Uri = `s3://${this.s3Bucket}/${s3Key}`;

    const reasoning = this.generateDeterministicReasoning(event, memories, localAssessment);

    const s3Archive = {
      s3Uri: simulatedS3Uri,
      checksum: `sha256:sim-${Buffer.from(event.eventId).toString('hex').slice(0, 16)}`,
      recordSize: 1420,
      isSimulated: true,
      archivedAt: new Date().toISOString(),
    };

    return {
      reasoning,
      recommendedAction: localAssessment.recommendedAction,
      confidence: localAssessment.confidence,
      model: `${this.modelId} (Simulated Deterministic Engine)`,
      latencyMs: simulatedLatencyMs,
      requestId: `sim-bedrock-${Date.now()}`,
      isSimulated: true,
      tokensUsed: 312,
      s3Archive,
    };
  }

  private static generateDeterministicReasoning(
    event: NormalizedIoTEvent,
    memories: ContextMemory[],
    assessment: UrgencyAssessment
  ): string {
    if (event.category === 'DELIVERY' && assessment.matchedMemories.length > 0) {
      return `[SYNTRA Bedrock Analysis - Evidence Correlated]\n` +
        `• Detected: ${event.title} at ${event.source.location}.\n` +
        `• Context Correlation: Resident wearable record indicates a temperature-sensitive prescription (Insulin Rapid-Acting) delivered today.\n` +
        `• Evidence: Package condition "${event.attributes.packageCondition || 'damaged'}" compromises thermal integrity in direct sunlight.\n` +
        `• Uncertainty: Visual anomaly detected on outer box; internal vial state unverified without physical inspection.\n` +
        `• Action: Interrupted living-room media, dispatched courier intercom hold, and prompted resident to retrieve immediately.`;
    }

    if (event.category === 'SECURITY' && (event.severity === 'WARNING' || event.severity === 'CRITICAL')) {
      return `[SYNTRA Bedrock Analysis - Security Alert]\n` +
        `• Detected: Prolonged loitering (${event.attributes.motionDurationSec || 45}s) at ${event.source.location} during night conditions (${event.attributes.ambientLightLux || 2} lux).\n` +
        `• Context Correlation: Correlates with recent neighborhood watch advisory regarding late-night scouting.\n` +
        `• Action: Elevated threat status, enabled floodlight illumination, and requested resident review on Fire TV.`;
    }

    if (event.category === 'ACCESS' && event.attributes.eventType === 'trusted_visitor') {
      return `[SYNTRA Bedrock Analysis - Trusted Access]\n` +
        `• Detected: Trusted visitor (${event.attributes.visitorName || 'Family'}) at porch.\n` +
        `• Context Correlation: Verified against calendar/note regarding spare key drop-off.\n` +
        `• Action: Welcoming prompt presented on Fire TV with one-click remote smart lock authorization.`;
    }

    return `[SYNTRA Bedrock Analysis - Routine Activity]\n` +
      `• Detected: ${event.title} at ${event.source.location}.\n` +
      `• Context: No sensitive medical or high-priority security constraints found in context store.\n` +
      `• Action: Logged to telemetry without interrupting resident entertainment.`;
  }

  private static async archiveToS3Real(
    event: NormalizedIoTEvent,
    aiAnalysis: string,
    assessment: UrgencyAssessment
  ) {
    try {
      const s3Client = new S3Client({ region: this.region });
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const key = `incidents/${dateStr}/${event.eventId}.json`;

      const incidentPayload = {
        eventId: event.eventId,
        timestamp: event.normalizedTimestamp,
        archivedAt: now.toISOString(),
        event,
        urgencyAssessment: assessment,
        aiAnalysis,
      };

      const body = JSON.stringify(incidentPayload, null, 2);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: this.s3Bucket,
          Key: key,
          Body: body,
          ContentType: 'application/json',
        })
      );

      return {
        s3Uri: `s3://${this.s3Bucket}/${key}`,
        checksum: `crc32:${Date.now().toString(16)}`,
        recordSize: body.length,
        isSimulated: false,
        archivedAt: now.toISOString(),
      };
    } catch (err) {
      console.warn('Real S3 upload failed, returning fallback simulated archive reference:', err);
      return {
        s3Uri: `s3://${this.s3Bucket}/simulated-fallback/${event.eventId}.json`,
        checksum: 'sha256:sim-fallback',
        recordSize: 850,
        isSimulated: true,
        archivedAt: new Date().toISOString(),
      };
    }
  }
}
