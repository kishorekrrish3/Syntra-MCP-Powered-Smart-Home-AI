/**
 * @file route.ts
 * @path src/app/api/ring-webhook/route.ts
 * @description Ingestion endpoint for Ring IoT events, camera triggers, and scenario demonstrations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { EventEngine } from '@/lib/event-engine';
import { ScenarioId, RawIoTEvent } from '@/types/omniguard';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if triggering a specific scenario
    if (body.scenario) {
      const scenario = body.scenario as ScenarioId;
      const outcome = await EventEngine.triggerScenario(scenario);
      return NextResponse.json({
        success: true,
        type: 'SCENARIO_TRIGGERED',
        scenario,
        outcome,
      });
    }

    // Otherwise process raw event
    const rawEvent = body as RawIoTEvent;
    const outcome = await EventEngine.processEvent(rawEvent);

    return NextResponse.json({
      success: true,
      type: 'EVENT_PROCESSED',
      outcome,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
