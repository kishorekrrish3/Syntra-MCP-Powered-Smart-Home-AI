/**
 * @file route.ts
 * @path src/app/api/state/route.ts
 * @description State synchronization endpoint between Dashboard, Fire TV screen, and Edge services.
 */

import { NextRequest, NextResponse } from 'next/server';
import { StateStore } from '@/lib/state-store';
import { RingProvider } from '@/lib/ring-provider';
import { EventEngine } from '@/lib/event-engine';

export async function GET() {
  const state = StateStore.getState();
  return NextResponse.json(state);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    switch (action) {
      case 'DISMISS_PIP': {
        StateStore.updateState(state => {
          state.fireTv.pipOverlay = null;
          state.fireTv.playbackState = 'PLAYING';
        });
        StateStore.addTimelineItem({
          actor: 'FIRE_TV',
          action: 'OVERLAY_DISMISSED',
          summary: 'Picture-in-Picture alert dismissed from remote; media playback resumed.',
        });
        break;
      }

      case 'HOLD_COURIER': {
        await RingProvider.executeHardwareAction('intercom_courier_wait');
        StateStore.updateState(state => {
          state.hardware.courierIntercomActive = true;
          if (state.fireTv.pipOverlay) {
            state.fireTv.pipOverlay.courierWaiting = true;
          }
        });
        StateStore.addTimelineItem({
          actor: 'FIRE_TV',
          action: 'COURIER_HOLD_TRIGGERED',
          summary: 'Two-way intercom broadcast requested courier to wait.',
        });
        break;
      }

      case 'UNLOCK_DOOR': {
        const confirmed = Boolean(payload?.confirmed);
        const res = await RingProvider.executeHardwareAction('unlock_door', { confirmed });
        if (res.success) {
          StateStore.updateState(state => {
            state.hardware.frontDoorLock = 'UNLOCKED';
            if (state.fireTv.pipOverlay) {
              state.fireTv.pipOverlay.doorUnlocked = true;
            }
          });
          StateStore.addTimelineItem({
            actor: 'FIRE_TV',
            action: 'DOOR_UNLOCKED',
            summary: 'Front door unlocked from Fire TV remote (60s timer).',
          });
        }
        return NextResponse.json({ success: res.success, message: res.message, res });
      }

      case 'TOGGLE_FLOODLIGHT': {
        const res = await RingProvider.executeHardwareAction('toggle_floodlight');
        StateStore.updateState(state => {
          state.hardware.floodlight = state.hardware.floodlight === 'HIGH' ? 'OFF' : 'HIGH';
        });
        StateStore.addTimelineItem({
          actor: 'FIRE_TV',
          action: 'FLOODLIGHT_TOGGLED',
          summary: 'Floodlight set to HIGH deterrence mode.',
        });
        break;
      }

      case 'TOGGLE_PLAYBACK': {
        StateStore.updateState(state => {
          state.fireTv.playbackState = state.fireTv.playbackState === 'PLAYING' ? 'PAUSED' : 'PLAYING';
        });
        break;
      }

      case 'REMOTE_KEY': {
        const key = String(payload?.key || 'NONE');
        StateStore.updateState(state => {
          state.fireTv.remoteNavigation.lastKeyPress = key;
          state.fireTv.remoteNavigation.lastKeyTimestamp = new Date().toISOString();
        });
        break;
      }

      case 'RESET_ALL': {
        EventEngine.resetAllClear();
        break;
      }

      case 'ADD_MEMORY': {
        if (payload?.content) {
          StateStore.updateState(state => {
            state.memories.unshift({
              id: `mem-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: payload.source || 'manual',
              category: payload.category || 'general',
              content: payload.content,
              tags: payload.tags || ['custom'],
              relevanceScore: 1.0,
            });
          });
          StateStore.addTimelineItem({
            actor: 'RESIDENT',
            action: 'MEMORY_ADDED',
            summary: `Added contextual memory: "${payload.content.slice(0, 40)}..."`,
          });
        }
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, state: StateStore.getState() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
