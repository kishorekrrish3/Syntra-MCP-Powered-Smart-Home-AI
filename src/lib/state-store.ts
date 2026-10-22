/**
 * @file state-store.ts
 * @description Centralized server-backed state store for SYNTRA, synchronizing Dashboard, Fire TV, ATLAS-MCP server, and Agent APIs.
 */

import fs from 'fs';
import path from 'path';
import {
  SyntraGlobalState,
  ScenarioId,
  NormalizedIoTEvent,
  RawIoTEvent,
  ContextMemory,
  ProtocolLogEntry,
  TimelineActionItem,
} from '@/types/syntra';
import { DEFAULT_CONTEXT_MEMORIES } from './context-provider';
import { AwsCloudEngine } from './aws-cloud-engine';

const STATE_FILE_PATH = path.resolve(process.cwd(), '.syntra-state.json');
const LEGACY_STATE_FILE_PATH = path.resolve(process.cwd(), '.omniguard-state.json');

function createInitialState(): SyntraGlobalState {
  const cloudStatus = AwsCloudEngine.getCloudStatus();

  return {
    activeScenario: 'IDLE',
    currentEvent: null,
    rawEventHistory: [],
    hardware: {
      frontDoorLock: 'LOCKED',
      floodlight: 'OFF',
      siren: 'OFF',
      cameraStreaming: true,
      courierIntercomActive: false,
    },
    fireTv: {
      playbackState: 'PLAYING',
      currentMedia: {
        title: 'Interstellar Odyssey (4K Ultra HD)',
        runtime: '2h 49m',
        progressPercent: 42,
        backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
      },
      pipOverlay: null,
      remoteNavigation: {
        focusedControlId: 'btn-inspect',
        lastKeyPress: 'NONE',
        lastKeyTimestamp: new Date().toISOString(),
      },
    },
    memories: [...DEFAULT_CONTEXT_MEMORIES],
    aws: cloudStatus,
    protocolLogs: [
      {
        id: 'proto-init-1',
        timestamp: new Date().toISOString(),
        transport: 'STREAMABLE_HTTP',
        direction: 'NOTIFICATION',
        method: 'notifications/initialized',
        params: { protocolVersion: '2024-11-05', server: 'syntra-atlas-mcp' },
        result: { status: 'ONLINE' },
      },
    ],
    timeline: [
      {
        id: 'time-init-0',
        timestamp: new Date().toISOString(),
        actor: 'ATLAS_BRIDGE',
        action: 'SYSTEM_BOOT',
        summary: 'SYNTRA ATLAS-MCP edge bridge initialized. Ready for Ring telemetry and Alexa+ agent requests.',
        severity: 'INFO',
      },
    ],
    agentConversation: [
      {
        id: 'msg-welcome',
        sender: 'alexa',
        text: 'SYNTRA Guardian online. Powered by ATLAS-MCP. Actively monitoring your front door sensors and cross-referencing events with your personal context memories.',
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// In-process cache backed by disk sync
let inMemoryState: SyntraGlobalState | null = null;

export class StateStore {
  public static getState(): SyntraGlobalState {
    if (inMemoryState) {
      return inMemoryState;
    }

    try {
      if (fs.existsSync(STATE_FILE_PATH)) {
        const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
        inMemoryState = JSON.parse(raw);
        return inMemoryState!;
      } else if (fs.existsSync(LEGACY_STATE_FILE_PATH)) {
        const raw = fs.readFileSync(LEGACY_STATE_FILE_PATH, 'utf-8');
        inMemoryState = JSON.parse(raw);
        return inMemoryState!;
      }
    } catch (e) {
      console.warn('Failed to read state file, initializing fresh state:', e);
    }

    inMemoryState = createInitialState();
    this.persist();
    return inMemoryState;
  }

  public static updateState(updater: (draft: SyntraGlobalState) => void): SyntraGlobalState {
    const state = this.getState();
    updater(state);
    this.persist();
    return state;
  }

  public static addProtocolLog(entry: Omit<ProtocolLogEntry, 'id' | 'timestamp'>): void {
    const fullEntry: ProtocolLogEntry = {
      id: `proto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.updateState(state => {
      state.protocolLogs.unshift(fullEntry);
      if (state.protocolLogs.length > 50) {
        state.protocolLogs = state.protocolLogs.slice(0, 50);
      }
    });
  }

  public static addTimelineItem(item: Omit<TimelineActionItem, 'id' | 'timestamp'>): void {
    const fullItem: TimelineActionItem = {
      id: `time-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...item,
    };
    this.updateState(state => {
      state.timeline.unshift(fullItem);
      if (state.timeline.length > 60) {
        state.timeline = state.timeline.slice(0, 60);
      }
    });
  }

  public static resetToClean(): SyntraGlobalState {
    inMemoryState = createInitialState();
    this.persist();
    return inMemoryState;
  }

  private static persist(): void {
    if (!inMemoryState) return;
    try {
      fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(inMemoryState, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Warning: Unable to write state to disk:', e);
    }
  }
}
