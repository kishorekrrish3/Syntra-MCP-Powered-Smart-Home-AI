/**
 * @file route.ts
 * @path src/app/api/alexa-agent/route.ts
 * @description Natural language Alexa+ Agent reasoning and tool dispatch endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { StateStore } from '@/lib/state-store';
import { McpServerEngine } from '@/lib/mcp-server';
import { EventEngine } from '@/lib/event-engine';

export async function POST(request: NextRequest) {
  try {
    const { query, confirmed } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query string is required' }, { status: 400 });
    }

    const q = query.toLowerCase();
    const state = StateStore.getState();
    const currentEvent = state.currentEvent;

    // Record user message
    StateStore.updateState(s => {
      s.agentConversation.push({
        id: `usr-${Date.now()}`,
        sender: 'user',
        text: query,
        timestamp: new Date().toISOString(),
      });
    });

    let alexaReply = '';
    const executedTools: Array<{ toolName: string; arguments: unknown; result: unknown }> = [];

    if (q.includes('what happened') || q.includes('status') || q.includes('check front door') || q.includes('package')) {
      const toolRes = await McpServerEngine.callTool('ring_get_live_telemetry');
      executedTools.push({ toolName: 'ring_get_live_telemetry', arguments: {}, result: toolRes });

      if (currentEvent) {
        const memRes = await McpServerEngine.callTool('context_search_memories', { query: currentEvent.title });
        executedTools.push({ toolName: 'context_search_memories', arguments: { query: currentEvent.title }, result: memRes });

        alexaReply = `At ${currentEvent.source.location}, I detected "${currentEvent.title}".\n\n` +
          `• Summary: ${currentEvent.summary}\n` +
          `• Severity: ${currentEvent.severity}\n` +
          `• Context Insight: Evaluated against your personal context notes.\n` +
          `• Recommendation: Please check the living room screen or say "Hold courier" or "Inspect camera".`;
      } else {
        alexaReply = 'The front porch is currently clear. No anomalous events or active security triggers.';
      }
    } else if (q.includes('hold courier') || q.includes('tell courier to wait') || q.includes('wait')) {
      const toolRes = await McpServerEngine.callTool('ring_dispatch_hardware_action', { action: 'intercom_courier_wait' });
      executedTools.push({ toolName: 'ring_dispatch_hardware_action', arguments: { action: 'intercom_courier_wait' }, result: toolRes });
      alexaReply = 'Broadcasting through front door two-way audio: "Please wait one moment, the resident is coming to the door."';
    } else if (q.includes('unlock') || q.includes('open door')) {
      const toolRes = await McpServerEngine.callTool('ring_dispatch_hardware_action', {
        action: 'unlock_door',
        confirmed: confirmed === true || q.includes('confirm') || q.includes('yes'),
      });
      executedTools.push({ toolName: 'ring_dispatch_hardware_action', arguments: { action: 'unlock_door', confirmed }, result: toolRes });

      if (toolRes.isError || (toolRes.content?.[0] && toolRes.content[0].text.includes('SAFETY RESTRICTION'))) {
        alexaReply = 'For your home security, door unlocking requires your explicit confirmation. Please confirm you want to unlock the front door.';
      } else {
        alexaReply = 'Front door smart lock has been unlocked for 60 seconds.';
      }
    } else if (q.includes('lock') || q.includes('secure door')) {
      const toolRes = await McpServerEngine.callTool('ring_dispatch_hardware_action', { action: 'lock_door' });
      executedTools.push({ toolName: 'ring_dispatch_hardware_action', arguments: { action: 'lock_door' }, result: toolRes });
      alexaReply = 'Front door deadbolt securely locked.';
    } else if (q.includes('light') || q.includes('floodlight')) {
      const toolRes = await McpServerEngine.callTool('ring_dispatch_hardware_action', { action: 'toggle_floodlight' });
      executedTools.push({ toolName: 'ring_dispatch_hardware_action', arguments: { action: 'toggle_floodlight' }, result: toolRes });
      alexaReply = 'Ring high-lumen floodlights toggled.';
    } else if (q.includes('siren') || q.includes('alarm')) {
      const isSilence = q.includes('stop') || q.includes('off') || q.includes('silence');
      const action = isSilence ? 'silence_siren' : 'trigger_siren';
      const toolRes = await McpServerEngine.callTool('ring_dispatch_hardware_action', {
        action,
        confirmed: confirmed === true || q.includes('confirm'),
      });
      executedTools.push({ toolName: 'ring_dispatch_hardware_action', arguments: { action }, result: toolRes });
      alexaReply = isSilence ? 'Security siren silenced.' : 'Deterrence siren activated at 110dB.';
    } else if (q.includes('clear') || q.includes('reset') || q.includes('resume')) {
      EventEngine.resetAllClear();
      alexaReply = 'All alerts cleared. Movie playback resumed on Fire TV.';
    } else {
      // General agent response with Bedrock or memory search
      const memRes = await McpServerEngine.callTool('context_search_memories', { query });
      executedTools.push({ toolName: 'context_search_memories', arguments: { query }, result: memRes });
      alexaReply = `I checked your home context regarding "${query}". SYNTRA is monitoring all front door events, personal notes, and Fire TV sessions.`;
    }

    // Record Alexa response in conversation
    StateStore.updateState(s => {
      s.agentConversation.push({
        id: `alx-${Date.now()}`,
        sender: 'alexa',
        text: alexaReply,
        timestamp: new Date().toISOString(),
        toolCalls: executedTools,
      });
    });

    return NextResponse.json({
      reply: alexaReply,
      toolCalls: executedTools,
      currentState: StateStore.getState(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
