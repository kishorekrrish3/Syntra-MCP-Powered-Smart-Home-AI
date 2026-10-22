/**
 * @file ring-provider.ts
 * @description Ring edge device simulator and hardware action dispatcher.
 */

import { RawIoTEvent, ScenarioId } from '@/types/syntra';

export class RingProvider {
  /**
   * Generates a structured synthetic event corresponding to one of the 4 hackathon demo scenarios.
   */
  public static getScenarioEvent(scenario: ScenarioId): RawIoTEvent {
    const now = new Date().toISOString();

    switch (scenario) {
      case 'scenario_1_delivery':
        return {
          id: `evt-ring-del-${Date.now()}`,
          timestamp: now,
          deviceType: 'ring_doorbell',
          deviceId: 'ring-pro2-front-entry',
          location: 'Front Door Porch',
          eventType: 'package_anomaly',
          simulated: true,
          confidence: 0.96,
          payload: {
            personDetected: true,
            courierName: 'BioPharma Express',
            deliveryCompany: 'BioPharma Logistics',
            packageCondition: 'crushed',
            packageAnomalyDetected: true,
            anomalyDetails: 'Front corner damaged, outer seal torn, temperature indicator exposed to sunlight',
            ambientLightLux: 1200,
            snapshotUri: '/synthetic-camera-stream/damaged-package.jpg',
          },
        };

      case 'scenario_2_suspicious':
        return {
          id: `evt-ring-sec-${Date.now()}`,
          timestamp: now,
          deviceType: 'ring_camera',
          deviceId: 'ring-floodlight-driveway',
          location: 'Front Driveway / Walkway',
          eventType: 'motion',
          simulated: true,
          confidence: 0.91,
          payload: {
            personDetected: true,
            visitorKnown: false,
            visitorName: 'Unidentified Individual',
            motionDurationSec: 58,
            ambientLightLux: 2, // Pitch dark / late night
            notes: 'Individual pacing near front walkway without approaching doorbell. Loitering threshold exceeded.',
            snapshotUri: '/synthetic-camera-stream/night-loitering.jpg',
          },
        };

      case 'scenario_3_visitor':
        return {
          id: `evt-ring-vis-${Date.now()}`,
          timestamp: now,
          deviceType: 'ring_doorbell',
          deviceId: 'ring-pro2-front-entry',
          location: 'Front Door Porch',
          eventType: 'trusted_visitor',
          simulated: true,
          confidence: 0.98,
          payload: {
            personDetected: true,
            visitorKnown: true,
            visitorName: 'Uncle Dave',
            notes: 'Recognized visitor standing at porch holding car keys.',
            snapshotUri: '/synthetic-camera-stream/uncle-dave.jpg',
          },
        };

      case 'scenario_4_reset':
      default:
        return {
          id: `evt-ring-rst-${Date.now()}`,
          timestamp: now,
          deviceType: 'ring_doorbell',
          deviceId: 'ring-pro2-front-entry',
          location: 'Front Door Porch',
          eventType: 'motion',
          simulated: true,
          confidence: 0.99,
          payload: {
            personDetected: false,
            motionDurationSec: 2,
            notes: 'Area clear. Normal ambient conditions.',
          },
        };
    }
  }

  /**
   * Dispatches a physical or simulated hardware control action.
   * Enforces safety protocols (e.g. door unlock requires explicit confirmation).
   */
  public static async executeHardwareAction(
    action: 'unlock_door' | 'lock_door' | 'toggle_floodlight' | 'trigger_siren' | 'silence_siren' | 'intercom_courier_wait',
    params: { confirmed?: boolean; durationSec?: number; reason?: string } = {}
  ): Promise<{ success: boolean; action: string; message: string; requiresConfirmation?: boolean }> {
    // Safety check for door unlock
    if (action === 'unlock_door' && !params.confirmed) {
      return {
        success: false,
        action,
        message: 'SAFETY RESTRICTION: Smart door unlock requires explicit resident confirmation.',
        requiresConfirmation: true,
      };
    }

    // Safety check for siren trigger
    if (action === 'trigger_siren' && !params.confirmed) {
      return {
        success: false,
        action,
        message: 'SAFETY RESTRICTION: High-decibel security siren activation requires explicit confirmation.',
        requiresConfirmation: true,
      };
    }

    switch (action) {
      case 'unlock_door':
        return {
          success: true,
          action,
          message: 'Smart Lock front door unlocked for 60 seconds (Auto-relock engaged).',
        };

      case 'lock_door':
        return {
          success: true,
          action,
          message: 'Smart Lock front door securely locked and deadbolt engaged.',
        };

      case 'toggle_floodlight':
        return {
          success: true,
          action,
          message: 'Ring Floodlight activated to HIGH 2000-lumen deterrence mode.',
        };

      case 'trigger_siren':
        return {
          success: true,
          action,
          message: 'Ring 110dB Outdoor Siren active for security deterrence.',
        };

      case 'silence_siren':
        return {
          success: true,
          action,
          message: 'Siren silenced and restored to normal standby.',
        };

      case 'intercom_courier_wait':
        return {
          success: true,
          action,
          message: 'Automated two-way audio broadcast: "Please wait one moment, resident is coming to the door."',
        };

      default:
        return {
          success: false,
          action,
          message: `Unknown hardware action: ${action}`,
        };
    }
  }
}
