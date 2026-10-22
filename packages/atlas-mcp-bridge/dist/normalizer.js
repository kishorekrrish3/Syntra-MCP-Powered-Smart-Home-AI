"use strict";
/**
 * @file normalizer.ts
 * @package @atlas/mcp-iot-bridge
 * @description Transforms raw IoT payloads into normalized structures, MCP resources, and context-correlated urgency assessments for SYNTRA.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeIoTEvent = normalizeIoTEvent;
exports.toMcpResource = toMcpResource;
exports.correlateWithContext = correlateWithContext;
function normalizeIoTEvent(raw) {
    let category = 'SECURITY';
    let severity = 'INFO';
    let title = 'Smart Home Event';
    let summary = `Event detected at ${raw.location}`;
    const entities = [
        { type: 'DEVICE', value: `${raw.deviceType}:${raw.deviceId}`, confidence: 1.0 },
    ];
    switch (raw.eventType) {
        case 'delivery':
        case 'package_anomaly': {
            category = 'DELIVERY';
            const courier = raw.payload.courierName || raw.payload.deliveryCompany || 'Courier';
            const cond = raw.payload.packageCondition || 'intact';
            const isAnomaly = Boolean(raw.payload.packageAnomalyDetected) || cond !== 'intact';
            entities.push({ type: 'COURIER', value: courier, confidence: 0.95 });
            entities.push({ type: 'PACKAGE', value: `Package (${cond})`, confidence: 0.9 });
            if (isAnomaly) {
                severity = cond === 'wet' || cond === 'crushed' || cond === 'torn' || cond === 'temperature_warning' ? 'CRITICAL' : 'WARNING';
                title = `Package Anomaly: Visible ${cond.toUpperCase()}`;
                summary = `A delivery by ${courier} shows signs of ${cond}. Immediate attention recommended.`;
                entities.push({ type: 'CONDITION', value: cond, confidence: 0.92 });
            }
            else {
                severity = 'NOTICE';
                title = `Delivery Received (${courier})`;
                summary = `A package was left at ${raw.location} by ${courier} in normal condition.`;
            }
            break;
        }
        case 'trusted_visitor': {
            category = 'ACCESS';
            severity = 'NOTICE';
            const visitor = raw.payload.visitorName || 'Known Family/Friend';
            title = `Trusted Visitor Arrived: ${visitor}`;
            summary = `${visitor} arrived at ${raw.location}. Smart lock ready for authorized entry.`;
            entities.push({ type: 'PERSON', value: visitor, confidence: 0.98 });
            break;
        }
        case 'visitor': {
            category = 'SECURITY';
            severity = 'NOTICE';
            const isKnown = Boolean(raw.payload.visitorKnown);
            const name = raw.payload.visitorName || (isKnown ? 'Recognized Visitor' : 'Unrecognized Visitor');
            title = `Visitor at ${raw.location}`;
            summary = `${name} is at ${raw.location}.`;
            entities.push({ type: 'PERSON', value: name, confidence: isKnown ? 0.9 : 0.7 });
            break;
        }
        case 'motion': {
            category = 'SECURITY';
            const duration = Number(raw.payload.motionDurationSec || 0);
            const isNight = raw.payload.ambientLightLux !== undefined && Number(raw.payload.ambientLightLux) < 10;
            if (duration > 30 || isNight) {
                severity = 'WARNING';
                title = `Prolonged Motion Detected (${duration}s)`;
                summary = `Unusual motion observed at ${raw.location}${isNight ? ' during low-light conditions' : ''}.`;
            }
            else {
                severity = 'INFO';
                title = `Motion Detected at ${raw.location}`;
                summary = `Brief motion detected (${duration}s) at ${raw.location}.`;
            }
            break;
        }
        case 'lock_state': {
            category = 'ACCESS';
            const state = raw.payload.lockState || 'unknown';
            if (state === 'jammed') {
                severity = 'CRITICAL';
                title = `Smart Lock Warning: Jammed`;
                summary = `Lock at ${raw.location} failed to engage and reported a jam.`;
            }
            else {
                severity = 'INFO';
                title = `Smart Lock State: ${state}`;
                summary = `Lock at ${raw.location} is now ${state}.`;
            }
            entities.push({ type: 'ACTION', value: `lock:${state}`, confidence: 1.0 });
            break;
        }
        case 'light_state': {
            category = 'ENVIRONMENT';
            const state = raw.payload.lightState || 'off';
            severity = 'INFO';
            title = `Floodlight State: ${state}`;
            summary = `Lighting at ${raw.location} toggled to ${state}.`;
            break;
        }
        case 'alarm_state': {
            category = 'SECURITY';
            const active = Boolean(raw.payload.sirenActive);
            severity = active ? 'CRITICAL' : 'NOTICE';
            title = active ? 'Security Siren Active!' : 'Security Siren Silenced';
            summary = active ? `High-decibel deterrence siren active at ${raw.location}.` : `Siren returned to normal.`;
            break;
        }
    }
    const attributes = {
        eventType: raw.eventType,
        deviceType: raw.deviceType,
        deviceId: raw.deviceId,
        location: raw.location,
        confidence: raw.confidence,
        isSimulated: raw.simulated,
    };
    for (const [k, v] of Object.entries(raw.payload)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) {
            attributes[k] = v;
        }
    }
    return {
        eventId: raw.id,
        normalizedTimestamp: raw.timestamp,
        source: {
            deviceType: raw.deviceType,
            deviceId: raw.deviceId,
            location: raw.location,
            isSimulated: raw.simulated,
        },
        category,
        severity,
        title,
        summary,
        attributes,
        extractedEntities: entities,
        mcpResourceUri: `syntra://frontdoor/events/${raw.id}`,
    };
}
function toMcpResource(event) {
    const resourcePayload = {
        eventId: event.eventId,
        timestamp: event.normalizedTimestamp,
        category: event.category,
        severity: event.severity,
        title: event.title,
        summary: event.summary,
        source: event.source,
        attributes: event.attributes,
        entities: event.extractedEntities,
    };
    return {
        uri: event.mcpResourceUri,
        name: event.title,
        description: `Normalized edge event from ${event.source.location} (${event.source.deviceType})`,
        mimeType: 'application/json',
        text: JSON.stringify(resourcePayload, null, 2),
        metadata: {
            eventId: event.eventId,
            timestamp: event.normalizedTimestamp,
            sourceDevice: `${event.source.deviceType}:${event.source.deviceId}`,
            category: event.category,
            severity: event.severity,
            isSimulated: event.source.isSimulated,
            attributes: event.attributes,
        },
    };
}
function correlateWithContext(event, memories) {
    const matchedMemories = [];
    const textToScan = `${event.title} ${event.summary} ${JSON.stringify(event.attributes)}`.toLowerCase();
    for (const mem of memories) {
        const memText = mem.content.toLowerCase();
        const tags = mem.tags.map(t => t.toLowerCase());
        let matchScore = 0;
        const reasons = [];
        // Delivery & Medical correlation keywords
        if (event.category === 'DELIVERY' || event.attributes.eventType === 'package_anomaly') {
            const isAnomaly = event.severity === 'CRITICAL' || event.severity === 'WARNING';
            const courier = String(event.attributes.courierName || event.attributes.deliveryCompany || '').toLowerCase();
            const medicalKeywords = ['insulin', 'medicine', 'medical', 'temperature', 'refrigerate', 'pharma', 'fragile', 'urgent'];
            let foundMedicalKeyword = false;
            for (const kw of medicalKeywords) {
                if (memText.includes(kw) || tags.includes(kw)) {
                    foundMedicalKeyword = true;
                    // If the package is damaged/anomaly, this is critical
                    if (isAnomaly) {
                        matchScore += 4;
                        reasons.push(`Memory mentions temperature/medical keyword: "${kw}" on damaged package`);
                    }
                    else if (courier && memText.includes(courier)) {
                        // If intact delivery matches specific medical courier name
                        matchScore += 2;
                        reasons.push(`Expected medical delivery arrived from "${courier}"`);
                    }
                }
            }
            // Check specific courier name match
            if (courier && courier !== 'courier' && courier !== 'generic parcel' && (memText.includes(courier) || tags.includes(courier))) {
                matchScore += 3;
                reasons.push(`Memory notes expected courier: "${courier}"`);
            }
        }
        // Visitor / Access correlation keywords
        if (event.category === 'ACCESS' || event.attributes.eventType === 'trusted_visitor' || event.attributes.eventType === 'visitor') {
            const visitorName = String(event.attributes.visitorName || '').toLowerCase();
            if (visitorName && (memText.includes(visitorName) || tags.includes(visitorName))) {
                matchScore += 4;
                reasons.push(`Memory matches visitor identity: "${visitorName}"`);
            }
            if (memText.includes('key') || memText.includes('visit') || memText.includes('drop off')) {
                matchScore += 2;
                reasons.push(`Memory notes expected drop-off/visit`);
            }
        }
        // Suspicious / Security correlation
        if (event.category === 'SECURITY' && (event.severity === 'WARNING' || event.severity === 'CRITICAL')) {
            if (memText.includes('suspicious') || memText.includes('prowler') || memText.includes('neighbor') || tags.includes('security')) {
                matchScore += 3;
                reasons.push(`Memory highlights recent neighborhood security alert`);
            }
        }
        if (matchScore > 0) {
            matchedMemories.push({
                memoryId: mem.id,
                memoryContent: mem.content,
                relevanceReason: reasons.join('; ') || 'Contextually relevant to event timing and tags',
            });
        }
    }
    // Determine urgency and whether to interrupt living room / Fire TV
    if (event.severity === 'CRITICAL' || (event.severity === 'WARNING' && matchedMemories.length > 0)) {
        return {
            level: 'EMERGENCY',
            reason: `High risk detected: Event (${event.title}) correlates directly with user context (${matchedMemories.length} relevant memory matches).`,
            matchedMemories,
            requiresInterruption: true,
            recommendedAction: event.category === 'DELIVERY'
                ? 'Interrupt living room display, notify resident immediately, and offer courier-intercom action.'
                : 'Trigger floodlight deterrence, alert household, and display live front-door camera.',
            confidence: 0.94,
        };
    }
    if (matchedMemories.length > 0) {
        return {
            level: 'HIGH',
            reason: `Event relates to active personal context notes (${matchedMemories.map(m => m.relevanceReason).join(', ')}).`,
            matchedMemories,
            requiresInterruption: true,
            recommendedAction: 'Show contextual Picture-in-Picture card with quick response actions.',
            confidence: 0.88,
        };
    }
    if (event.severity === 'WARNING') {
        return {
            level: 'MEDIUM',
            reason: `Event has elevated severity (${event.severity}) without specific personal memory match.`,
            matchedMemories: [],
            requiresInterruption: false,
            recommendedAction: 'Record in timeline and present non-blocking notification banner.',
            confidence: 0.75,
        };
    }
    return {
        level: 'LOW',
        reason: 'Routine front-door activity with no correlated sensitive memories.',
        matchedMemories: [],
        requiresInterruption: false,
        recommendedAction: 'Log to telemetry timeline; no living-room interruption needed.',
        confidence: 0.65,
    };
}
