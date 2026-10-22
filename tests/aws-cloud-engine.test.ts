import { describe, it, expect } from 'vitest';
import { AwsCloudEngine } from '@/lib/aws-cloud-engine';
import { AtlasBridgeService } from '@/lib/atlas-bridge';
import { RingProvider } from '@/lib/ring-provider';
import { DEFAULT_CONTEXT_MEMORIES } from '@/lib/context-provider';

describe('AWS Cloud Engine (AWS Builder Mini Challenge)', () => {
  it('correctly reports cloud configuration status and mode', () => {
    const status = AwsCloudEngine.getCloudStatus();
    expect(status.mode).toBeDefined();
    expect(['REAL_BEDROCK_S3', 'SIMULATED_LOCAL']).toContain(status.mode);
    expect(status.configuredRegion).toBeTruthy();
    expect(status.configuredModel).toBeTruthy();
    expect(status.s3Bucket).toBe('syntra-incident-archives');
  });

  it('runs analysis and generates structured incident archive with checksum', async () => {
    const raw = RingProvider.getScenarioEvent('scenario_1_delivery');
    const normalized = AtlasBridgeService.normalize(raw);
    const assessment = AtlasBridgeService.correlate(normalized, DEFAULT_CONTEXT_MEMORIES);

    const result = await AwsCloudEngine.analyzeAndArchiveIncident(
      normalized,
      DEFAULT_CONTEXT_MEMORIES,
      assessment
    );

    expect(result.reasoning).toBeTruthy();
    expect(result.reasoning).toContain('SYNTRA Bedrock Analysis');
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.latencyMs).toBeGreaterThan(0);
    expect(result.s3Archive).toBeDefined();
    expect(result.s3Archive?.s3Uri).toMatch(/^s3:\/\/syntra-incident-archives\//);
    expect(result.s3Archive?.checksum).toBeTruthy();
  });
});
