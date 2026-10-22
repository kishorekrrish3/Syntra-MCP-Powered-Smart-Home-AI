/**
 * @file types.ts
 * @package @atlas/mcp-iot-bridge
 * @description Standard type definitions for IoT edge normalization and ATLAS-MCP bridging in SYNTRA.
 */

export type IoTDeviceType =
  | 'ring_doorbell'
  | 'ring_camera'
  | 'smart_lock'
  | 'floodlight'
  | 'motion_sensor'
  | 'custom_iot';

export type IoTEventType =
  | 'motion'
  | 'visitor'
  | 'delivery'
  | 'package_anomaly'
  | 'trusted_visitor'
  | 'lock_state'
  | 'light_state'
  | 'alarm_state';

export interface RawIoTEvent {
  id: string;
  timestamp: string; // ISO 8601 string
  deviceType: IoTDeviceType;
  deviceId: string;
  location: string;
  eventType: IoTEventType;
  simulated: boolean;
  confidence: number; // 0.0 to 1.0
  payload: {
    personDetected?: boolean;
    courierName?: string;
    deliveryCompany?: string;
    packageCondition?: 'intact' | 'crushed' | 'wet' | 'torn' | 'temperature_warning' | 'unknown';
    packageAnomalyDetected?: boolean;
    anomalyDetails?: string;
    visitorKnown?: boolean;
    visitorName?: string;
    lockState?: 'locked' | 'unlocked' | 'jammed';
    lightState?: 'on' | 'off' | 'dimmed';
    sirenActive?: boolean;
    motionDurationSec?: number;
    ambientLightLux?: number;
    notes?: string;
    snapshotUri?: string;
    [key: string]: unknown;
  };
}

export type EventCategory = 'SECURITY' | 'DELIVERY' | 'ACCESS' | 'ENVIRONMENT' | 'MAINTENANCE';

export type SeverityLevel = 'CRITICAL' | 'WARNING' | 'NOTICE' | 'INFO';

export interface ExtractedEntity {
  type: 'PERSON' | 'COURIER' | 'PACKAGE' | 'CONDITION' | 'DEVICE' | 'ACTION';
  value: string;
  confidence: number;
}

export interface NormalizedIoTEvent {
  eventId: string;
  normalizedTimestamp: string;
  source: {
    deviceType: IoTDeviceType;
    deviceId: string;
    location: string;
    isSimulated: boolean;
  };
  category: EventCategory;
  severity: SeverityLevel;
  title: string;
  summary: string;
  attributes: Record<string, string | number | boolean | null>;
  extractedEntities: ExtractedEntity[];
  mcpResourceUri: string;
}

export interface McpResourceRepresentation {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  text: string;
  metadata: {
    eventId: string;
    timestamp: string;
    sourceDevice: string;
    category: EventCategory;
    severity: SeverityLevel;
    isSimulated: boolean;
    attributes: Record<string, string | number | boolean | null>;
  };
}

export interface ContextMemory {
  id: string;
  timestamp: string;
  source: 'bee_wearable' | 'alexa_notes' | 'manual' | 'calendar' | 'synthetic_fixture';
  category: 'medical' | 'delivery' | 'visitor' | 'security' | 'general';
  content: string;
  tags: string[];
  relevanceScore?: number;
}

export interface UrgencyAssessment {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  reason: string;
  matchedMemories: Array<{
    memoryId: string;
    memoryContent: string;
    relevanceReason: string;
  }>;
  requiresInterruption: boolean;
  recommendedAction: string;
  confidence: number;
}

export interface ValidationResult<T> {
  isValid: boolean;
  errors: string[];
  data?: T;
}
