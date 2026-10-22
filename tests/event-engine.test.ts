import { describe, it, expect, beforeEach } from 'vitest';
import { EventEngine } from '@/lib/event-engine';
import { StateStore } from '@/lib/state-store';

describe('SYNTRA End-to-End Scenario Engine', () => {
  beforeEach(() => {
    StateStore.resetToClean();
  });

  it('Scenario 1: Delivery Anomaly triggers EMERGENCY triage, pauses Fire TV playback, and creates PiP card', async () => {
    const outcome = (await EventEngine.triggerScenario('scenario_1_delivery')) as any;

    expect(outcome.event.category).toBe('DELIVERY');
    expect(outcome.assessment.level).toBe('EMERGENCY');
    expect(outcome.assessment.requiresInterruption).toBe(true);
    expect(outcome.assessment.matchedMemories.length).toBeGreaterThan(0);

    const state = StateStore.getState();
    expect(state.activeScenario).toBe('scenario_1_delivery');
    expect(state.fireTv.playbackState).toBe('PAUSED');
    expect(state.fireTv.pipOverlay).not.toBeNull();
    expect(state.fireTv.pipOverlay?.urgency).toBe('EMERGENCY');
    expect(state.fireTv.pipOverlay?.title).toContain('CRUSHED');

    // S3 archive verification
    expect(state.aws.lastArchive).not.toBeNull();
    expect(state.aws.lastArchive?.s3Uri).toContain('s3://');
    expect(state.aws.lastInference?.isSimulated).toBe(true); // unless real AWS creds provided
  });

  it('Scenario 2: Suspicious Night Activity elevates to HIGH alert with floodlight deterrence recommendation', async () => {
    const outcome = (await EventEngine.triggerScenario('scenario_2_suspicious')) as any;

    expect(outcome.event.category).toBe('SECURITY');
    expect(outcome.event.severity).toBe('WARNING');
    expect(outcome.assessment.requiresInterruption).toBe(true);

    const state = StateStore.getState();
    expect(state.fireTv.pipOverlay).not.toBeNull();
    expect(state.fireTv.playbackState).toBe('PAUSED');
  });

  it('Scenario 3: Trusted Visitor matches family note and offers safe access', async () => {
    const outcome = (await EventEngine.triggerScenario('scenario_3_visitor')) as any;

    expect(outcome.event.category).toBe('ACCESS');
    expect(outcome.assessment.matchedMemories.some((m: any) => m.memoryContent.includes('Uncle Dave'))).toBe(true);

    const state = StateStore.getState();
    expect(state.fireTv.pipOverlay).not.toBeNull();
    expect(state.fireTv.pipOverlay?.title).toContain('Uncle Dave');
  });

  it('Scenario 4: All Clear resets active alerts and restores entertainment playback', async () => {
    // First trigger an alert
    await EventEngine.triggerScenario('scenario_1_delivery');
    expect(StateStore.getState().fireTv.pipOverlay).not.toBeNull();

    // Now trigger all clear
    const resetRes = (await EventEngine.triggerScenario('scenario_4_reset')) as any;
    expect(resetRes.success).toBe(true);

    const state = StateStore.getState();
    expect(state.fireTv.pipOverlay).toBeNull();
    expect(state.fireTv.playbackState).toBe('PLAYING');
    expect(state.hardware.courierIntercomActive).toBe(false);
  });
});
