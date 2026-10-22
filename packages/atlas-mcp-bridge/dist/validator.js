"use strict";
/**
 * @file validator.ts
 * @package @argon/mcp-iot-bridge
 * @description Input validation for IoT events prior to MCP bridging.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateIoTEvent = validateIoTEvent;
const VALID_DEVICE_TYPES = new Set([
    'ring_doorbell',
    'ring_camera',
    'smart_lock',
    'floodlight',
    'motion_sensor',
    'custom_iot',
]);
const VALID_EVENT_TYPES = new Set([
    'motion',
    'visitor',
    'delivery',
    'package_anomaly',
    'trusted_visitor',
    'lock_state',
    'light_state',
    'alarm_state',
]);
function validateIoTEvent(event) {
    const errors = [];
    if (!event || typeof event !== 'object') {
        return { isValid: false, errors: ['Input event must be a non-null object'] };
    }
    const e = event;
    if (typeof e.id !== 'string' || e.id.trim() === '') {
        errors.push('Missing or invalid event "id" (must be non-empty string)');
    }
    if (typeof e.timestamp !== 'string' || isNaN(Date.parse(e.timestamp))) {
        errors.push('Missing or invalid "timestamp" (must be valid ISO-8601 string)');
    }
    if (!VALID_DEVICE_TYPES.has(e.deviceType)) {
        errors.push(`Invalid "deviceType": ${String(e.deviceType)}. Must be one of: ${Array.from(VALID_DEVICE_TYPES).join(', ')}`);
    }
    if (typeof e.deviceId !== 'string' || e.deviceId.trim() === '') {
        errors.push('Missing or invalid "deviceId"');
    }
    if (typeof e.location !== 'string' || e.location.trim() === '') {
        errors.push('Missing or invalid "location"');
    }
    if (!VALID_EVENT_TYPES.has(e.eventType)) {
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
        data: event,
    };
}
