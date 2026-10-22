import { describe, it, expect, beforeEach } from 'vitest';
import { McpServerEngine, MCP_TOOLS, MCP_RESOURCES, MCP_PROMPTS } from '@/lib/mcp-server';
import { StateStore } from '@/lib/state-store';

describe('Model Context Protocol (MCP) Server Compliance', () => {
  beforeEach(() => {
    StateStore.resetToClean();
  });

  it('exposes all mandatory OmniGuard MCP tools with valid schemas', () => {
    expect(MCP_TOOLS.length).toBeGreaterThanOrEqual(6);
    const toolNames = MCP_TOOLS.map(t => t.name);

    expect(toolNames).toContain('ring_get_live_telemetry');
    expect(toolNames).toContain('ring_dispatch_hardware_action');
    expect(toolNames).toContain('firetv_push_pip_overlay');
    expect(toolNames).toContain('firetv_control_playback');
    expect(toolNames).toContain('context_search_memories');
    expect(toolNames).toContain('aws_analyze_and_archive_incident');

    for (const tool of MCP_TOOLS) {
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  it('executes ring_get_live_telemetry tool and returns current hardware state', async () => {
    const res = await McpServerEngine.callTool('ring_get_live_telemetry');
    expect(res.isError).toBe(false);
    expect(res.content.length).toBe(1);

    const data = JSON.parse(res.content[0].text);
    expect(data.device).toBe('ring_doorbell');
    expect(data.hardware.frontDoorLock).toBe('LOCKED');
    expect(data.hardware.cameraStreaming).toBe(true);
  });

  it('enforces safety confirmation on sensitive hardware action (door unlock)', async () => {
    // Calling unlock_door without confirmed: true must fail safety check
    const unconfirmedRes = await McpServerEngine.callTool('ring_dispatch_hardware_action', {
      action: 'unlock_door',
      confirmed: false,
    });

    const unconfirmedData = JSON.parse(unconfirmedRes.content[0].text);
    expect(unconfirmedData.success).toBe(false);
    expect(unconfirmedData.requiresConfirmation).toBe(true);
    expect(unconfirmedData.message).toContain('SAFETY RESTRICTION');

    // Calling with confirmed: true must succeed
    const confirmedRes = await McpServerEngine.callTool('ring_dispatch_hardware_action', {
      action: 'unlock_door',
      confirmed: true,
    });

    const confirmedData = JSON.parse(confirmedRes.content[0].text);
    expect(confirmedData.success).toBe(true);
    expect(StateStore.getState().hardware.frontDoorLock).toBe('UNLOCKED');
  });

  it('searches personal context memories through MCP tool context_search_memories', async () => {
    const res = await McpServerEngine.callTool('context_search_memories', { query: 'insulin' });
    expect(res.isError).toBe(false);

    const data = JSON.parse(res.content[0].text);
    expect(data.matchCount).toBeGreaterThan(0);
    expect(data.memories.some((m: any) => m.content.toLowerCase().includes('insulin'))).toBe(true);
  });

  it('reads MCP resources by URI with valid JSON payloads', () => {
    const telemetryRes = McpServerEngine.readResource('omniguard://frontdoor/telemetry');
    expect(telemetryRes.mimeType).toBe('application/json');
    const parsedTelemetry = JSON.parse(telemetryRes.text);
    expect(parsedTelemetry.device).toBe('ring_doorbell');

    const sessionRes = McpServerEngine.readResource('omniguard://livingroom/session');
    const parsedSession = JSON.parse(sessionRes.text);
    expect(parsedSession.playbackState).toBe('PLAYING');
  });

  it('generates structured prompts for frontdoor_triage and trusted_visitor_handling', () => {
    const triagePrompt = McpServerEngine.getPrompt('frontdoor_triage', { eventSummary: 'Damaged package' });
    expect(triagePrompt.messages[0].content.text).toContain('OmniGuard Alexa+ agent');
    expect(triagePrompt.messages[0].content.text).toContain('Damaged package');

    const visitorPrompt = McpServerEngine.getPrompt('trusted_visitor_handling', { visitorName: 'Uncle Dave' });
    expect(visitorPrompt.messages[0].content.text).toContain('Uncle Dave');
  });
});
