import { describe, it, expect } from 'vitest';
import {
  validateIoTEvent,
  normalizeIoTEvent,
  toMcpResource,
  correlateWithContext,
  RawIoTEvent,
  ContextMemory,
} from '../src';

describe('@atlas/mcp-iot-bridge', () => {
  const sampleDeliveryEvent: RawIoTEvent = {
    id: 'evt-test-101',
    timestamp: '2026-10-20T14:30:00.000Z',
    deviceType: 'ring_doorbell',
    deviceId: 'front-door-ring-pro-2',
    location: 'Front Door',
    eventType: 'package_anomaly',
    simulated: true,
    confidence: 0.94,
    payload: {
      personDetected: true,
      courierName: 'BioPharma Logistics',
      deliveryCompany: 'BioPharma Express',
      packageCondition: 'crushed',
      packageAnomalyDetected: true,
      anomalyDetails: 'Corner dented and exterior seal compromised',
    },
  };

  const sampleMemories: ContextMemory[] = [
    {
      id: 'mem-001',
      timestamp: '2026-10-20T10:15:00.000Z',
      source: 'bee_wearable',
      category: 'medical',
      content: 'Critical insulin shipment arriving this afternoon between 2-4 PM. Needs immediate refrigeration.',
      tags: ['medical', 'insulin', 'temperature', 'urgent', 'delivery'],
    },
    {
      id: 'mem-002',
      timestamp: '2026-10-20T11:00:00.000Z',
      source: 'alexa_notes',
      category: 'visitor',
      content: 'Uncle Dave visiting around 3:30 PM to drop off spare car keys.',
      tags: ['visitor', 'family', 'keys'],
    },
  ];

  it('validates correct raw IoT events', () => {
    const result = validateIoTEvent(sampleDeliveryEvent);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.data?.id).toBe('evt-test-101');
  });

  it('rejects malformed IoT events with detailed error messages', () => {
    const malformed = {
      id: '',
      timestamp: 'not-a-date',
      deviceType: 'unknown_gadget',
      confidence: 1.5,
    };
    const result = validateIoTEvent(malformed);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('timestamp'))).toBe(true);
    expect(result.errors.some(e => e.includes('deviceType'))).toBe(true);
  });

  it('normalizes a package anomaly event with appropriate severity and extracted entities', () => {
    const normalized = normalizeIoTEvent(sampleDeliveryEvent);
    expect(normalized.category).toBe('DELIVERY');
    expect(normalized.severity).toBe('CRITICAL');
    expect(normalized.title).toContain('Package Anomaly: Visible CRUSHED');
    expect(normalized.mcpResourceUri).toBe('syntra://frontdoor/events/evt-test-101');

    const courierEntity = normalized.extractedEntities.find(e => e.type === 'COURIER');
    expect(courierEntity?.value).toBe('BioPharma Logistics');

    const conditionEntity = normalized.extractedEntities.find(e => e.type === 'CONDITION');
    expect(conditionEntity?.value).toBe('crushed');
  });

  it('converts normalized events to valid MCP resource representations', () => {
    const normalized = normalizeIoTEvent(sampleDeliveryEvent);
    const mcpRes = toMcpResource(normalized);

    expect(mcpRes.uri).toBe('syntra://frontdoor/events/evt-test-101');
    expect(mcpRes.mimeType).toBe('application/json');
    expect(mcpRes.metadata.category).toBe('DELIVERY');
    expect(mcpRes.metadata.isSimulated).toBe(true);

    const parsedJson = JSON.parse(mcpRes.text);
    expect(parsedJson.eventId).toBe('evt-test-101');
    expect(parsedJson.severity).toBe('CRITICAL');
  });

  it('correlates delivery anomaly with insulin wearable note to elevate urgency to EMERGENCY', () => {
    const normalized = normalizeIoTEvent(sampleDeliveryEvent);
    const assessment = correlateWithContext(normalized, sampleMemories);

    expect(assessment.level).toBe('EMERGENCY');
    expect(assessment.requiresInterruption).toBe(true);
    expect(assessment.matchedMemories.length).toBeGreaterThan(0);
    expect(assessment.matchedMemories[0].memoryId).toBe('mem-001');
    expect(assessment.matchedMemories[0].relevanceReason).toContain('insulin');
  });

  it('correlates trusted visitor arrival with visitor memory', () => {
    const visitorEvent: RawIoTEvent = {
      id: 'evt-test-102',
      timestamp: '2026-10-20T15:30:00.000Z',
      deviceType: 'ring_doorbell',
      deviceId: 'front-door-ring-pro-2',
      location: 'Front Door',
      eventType: 'trusted_visitor',
      simulated: true,
      confidence: 0.98,
      payload: {
        visitorName: 'Uncle Dave',
        personDetected: true,
      },
    };

    const normalized = normalizeIoTEvent(visitorEvent);
    expect(normalized.category).toBe('ACCESS');
    expect(normalized.severity).toBe('NOTICE');

    const assessment = correlateWithContext(normalized, sampleMemories);
    expect(assessment.level).toBe('HIGH');
    expect(assessment.requiresInterruption).toBe(true);
    expect(assessment.matchedMemories.some(m => m.memoryContent.includes('Uncle Dave'))).toBe(true);
  });

  it('handles events with no matching context gracefully without unwanted interruption', () => {
    const normalEvent: RawIoTEvent = {
      id: 'evt-test-103',
      timestamp: '2026-10-20T12:00:00.000Z',
      deviceType: 'ring_doorbell',
      deviceId: 'front-door-ring-pro-2',
      location: 'Front Door',
      eventType: 'delivery',
      simulated: true,
      confidence: 0.95,
      payload: {
        courierName: 'Generic Parcel',
        packageCondition: 'intact',
      },
    };

    const normalized = normalizeIoTEvent(normalEvent);
    const assessment = correlateWithContext(normalized, sampleMemories);
    expect(assessment.level).toBe('LOW');
    expect(assessment.requiresInterruption).toBe(false);
    expect(assessment.matchedMemories.length).toBe(0);
  });
});
