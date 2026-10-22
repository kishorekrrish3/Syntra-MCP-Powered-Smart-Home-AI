/**
 * @file validator.ts
 * @package @atlas/mcp-iot-bridge
 * @description Input validation for IoT events prior to ATLAS-MCP bridging in SYNTRA.
 */

import { RawIoTEvent, ValidationResult, IoTDeviceType, IoTEventType } from './types';

const VALID_DEVICE_TYPES = new Set<IoTDeviceType>([
  'ring_doorbell',
  'ring_camera',
  'smart_lock',
  'floodlight',
  'motion_sensor',
  'custom_iot',
]);

const VALID_EVENT_TYPES = new Set<IoTEventType>([
  'motion',
  'visitor',
  'delivery',
  'package_anomaly',
  'trusted_visitor',
  'lock_state',
  'light_state',
  'alarm_state',
]);

export function validateIoTEvent(event: unknown): ValidationResult<RawIoTEvent> {
  const errors: string[] = [];

  if (!event || typeof event !== 'object') {
    return { isValid: false, errors: ['Input event must be a non-null object'] };
  }

  const e = event as Record<string, unknown>;

  if (typeof e.id !== 'string' || e.id.trim() === '') {
    errors.push('Missing or invalid event "id" (must be non-empty string)');
  }

  if (typeof e.timestamp !== 'string' || isNaN(Date.parse(e.timestamp))) {
    errors.push('Missing or invalid "timestamp" (must be valid ISO-8601 string)');
  }

  if (!VALID_DEVICE_TYPES.has(e.deviceType as IoTDeviceType)) {
    errors.push(`Invalid "deviceType": ${String(e.deviceType)}. Must be one of: ${Array.from(VALID_DEVICE_TYPES).join(', ')}`);
  }

  if (typeof e.deviceId !== 'string' || e.deviceId.trim() === '') {
    errors.push('Missing or invalid "deviceId"');
  }

  if (typeof e.location !== 'string' || e.location.trim() === '') {
    errors.push('Missing or invalid "location"');
  }

  if (!VALID_EVENT_TYPES.has(e.eventType as IoTEventType)) {
    errors.push(`Invalid "eventType": ${String(e.eventType)}. Must be one of: ${Array.from(VALID_EVENT_TYPES).join(', ')}`);
  }

  if (typeof e.simulated !== 'boolean') {
    errors.push('Field "simulated" must be a boolean flag');
  }

  if (typeof e.confidence !== 'number' || e.confidence < 0 || e.confidence > 1) {
    errors.push('Field "confidence" must be a number between 0.0 and 1.0');
  }

  if (!e.payload || typeof e.payload !== 'object' || Array.isArray(e.payload)) {
    errors.push('Field "payload" must be an object');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: event as RawIoTEvent,
  };
}
