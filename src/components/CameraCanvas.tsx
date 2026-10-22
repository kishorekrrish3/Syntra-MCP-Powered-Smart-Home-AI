'use client';

import React, { useRef, useEffect, useState } from 'react';
import { NormalizedIoTEvent, HardwareState } from '@/types/syntra';
import {
  Video,
  Sun,
  Lock,
  Unlock,
  Radio,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface CameraCanvasProps {
  currentEvent: NormalizedIoTEvent | null;
  hardware: HardwareState;
}

export const CameraCanvas: React.FC<CameraCanvasProps> = ({ currentEvent, hardware }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showPayloadModal, setShowPayloadModal] = useState(false);

  const isNight =
    currentEvent?.attributes.ambientLightLux !== undefined &&
    Number(currentEvent.attributes.ambientLightLux) < 50;

  const hasAnomaly =
    currentEvent?.category === 'DELIVERY' &&
    (currentEvent?.severity === 'CRITICAL' || currentEvent?.severity === 'WARNING');

  const isSuspicious =
    currentEvent?.category === 'SECURITY' && currentEvent?.severity === 'WARNING';

  const isVisitor =
    currentEvent?.category === 'ACCESS' || currentEvent?.attributes.eventType === 'trusted_visitor';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isNight) {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#040b08');
        grad.addColorStop(1, '#091a13');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#1a2436');
        grad.addColorStop(0.6, '#28364f');
        grad.addColorStop(1, '#1e2430');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Porch floor
      ctx.fillStyle = isNight ? '#0e241b' : '#3d342a';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.7);
      ctx.lineTo(canvas.width, canvas.height * 0.7);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Door frame
      ctx.strokeStyle = isNight ? '#1b4d38' : '#5c4d3c';
      ctx.lineWidth = 3;
      ctx.strokeRect(canvas.width * 0.62, canvas.height * 0.15, canvas.width * 0.28, canvas.height * 0.65);
      ctx.fillStyle = isNight ? '#0b1f17' : '#1e2024';
      ctx.fillRect(canvas.width * 0.62, canvas.height * 0.15, canvas.width * 0.28, canvas.height * 0.65);

      // Lock indicator LED
      ctx.fillStyle = hardware.frontDoorLock === 'UNLOCKED' ? '#007600' : '#B12704';
      ctx.beginPath();
      ctx.arc(canvas.width * 0.66, canvas.height * 0.48, 5, 0, Math.PI * 2);
      ctx.fill();

      // Floodlight beam effect
      if (hardware.floodlight === 'HIGH') {
        const lightGrad = ctx.createRadialGradient(
          canvas.width * 0.5,
          0,
          20,
          canvas.width * 0.5,
          canvas.height * 0.5,
          canvas.width * 0.7
        );
        lightGrad.addColorStop(0, 'rgba(255, 255, 220, 0.45)');
        lightGrad.addColorStop(1, 'rgba(255, 255, 220, 0)');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Scene Actors
      if (hasAnomaly) {
        // Courier
        ctx.fillStyle = isNight ? '#164832' : '#334155';
        ctx.beginPath();
        ctx.arc(canvas.width * 0.28, canvas.height * 0.35, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(canvas.width * 0.23, canvas.height * 0.4, 28, 55);

        // Package
        ctx.fillStyle = '#b45309';
        ctx.fillRect(canvas.width * 0.42, canvas.height * 0.66, 44, 34);

        // Crushed damage visual zone
        ctx.fillStyle = '#B12704';
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.42, canvas.height * 0.66);
        ctx.lineTo(canvas.width * 0.47, canvas.height * 0.71);
        ctx.lineTo(canvas.width * 0.42, canvas.height * 0.74);
        ctx.closePath();
        ctx.fill();

        // Bounding box for package
        ctx.strokeStyle = '#B12704';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(canvas.width * 0.4, canvas.height * 0.63, 50, 42);
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = '#B12704';
        ctx.fillRect(canvas.width * 0.4, canvas.height * 0.59, 134, 15);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px "Amazon Ember", Arial, sans-serif';
        ctx.fillText('CRUSHED PACKAGE [0.96]', canvas.width * 0.42, canvas.height * 0.61);

        // Bounding box for courier
        ctx.strokeStyle = '#007185';
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(canvas.width * 0.21, canvas.height * 0.3, 34, 85);
        ctx.setLineDash([]);
        ctx.fillStyle = '#007185';
        ctx.fillRect(canvas.width * 0.21, canvas.height * 0.26, 120, 15);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('COURIER (BioPharma)', canvas.width * 0.22, canvas.height * 0.28);
      } else if (isSuspicious) {
        const sway = Math.sin(tick * 0.05) * 5;
        ctx.fillStyle = isNight ? '#0d3322' : '#1f2937';
        ctx.beginPath();
        ctx.arc(canvas.width * 0.45 + sway, canvas.height * 0.38, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(canvas.width * 0.4 + sway, canvas.height * 0.43, 26, 68);

        ctx.strokeStyle = '#FF9900';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(canvas.width * 0.36 + sway, canvas.height * 0.32, 36, 100);
        ctx.setLineDash([]);
        ctx.fillStyle = '#FF9900';
        ctx.fillRect(canvas.width * 0.36 + sway, canvas.height * 0.28, 140, 15);
        ctx.fillStyle = '#0F1111';
        ctx.font = 'bold 9px "Amazon Ember", Arial, sans-serif';
        ctx.fillText('LOITERING DETECTED (58s)', canvas.width * 0.38 + sway, canvas.height * 0.3);
      } else if (isVisitor) {
        ctx.fillStyle = isNight ? '#1b4d38' : '#232F3E';
        ctx.beginPath();
        ctx.arc(canvas.width * 0.52, canvas.height * 0.35, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(canvas.width * 0.47, canvas.height * 0.4, 28, 65);

        ctx.strokeStyle = '#007600';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width * 0.44, canvas.height * 0.3, 34, 90);
        ctx.fillStyle = '#007600';
        ctx.fillRect(canvas.width * 0.44, canvas.height * 0.26, 134, 15);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px "Amazon Ember", Arial, sans-serif';
        ctx.fillText('TRUSTED: UNCLE DAVE [0.98]', canvas.width * 0.46, canvas.height * 0.28);
      }

      // Subtle scanline
      ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 1);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentEvent, hardware, isNight, hasAnomaly, isSuspicious, isVisitor]);

  return (
    <div className="bg-amazon-surface_white border border-amazon-border_subtle rounded-[4px] shadow-amazon overflow-hidden">
      {/* Amazon Card Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-amazon-card_hover border-b border-amazon-border_subtle">
        <div className="flex items-center space-x-2">
          <span className="bg-amazon-primary_ink text-white font-bold text-[10px] px-1.5 py-0.5 rounded-[2px] tracking-wide">
            RING LIVE
          </span>
          <span className="text-amazon-text_main font-bold text-xs tracking-tight">
            Ring Video Doorbell Pro 2
          </span>
          <span className="text-amazon-text_muted font-mono text-[11px] hidden sm:inline">
            1080p • 30 FPS • H.264
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPayloadModal(!showPayloadModal)}
            className="btn-amazon-white px-2 py-1 text-[11px] font-medium flex items-center space-x-1"
            title="Inspect raw event JSON payload"
          >
            <Eye className="w-3 h-3 text-amazon-text_muted" />
            <span>Inspect Payload</span>
          </button>
        </div>
      </div>

      {/* Synthetic Camera Viewport */}
      <div className="relative aspect-video w-full bg-black">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-full object-cover"
        />

        {/* Telemetry Overlay */}
        <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded-[2px] text-[10px] font-mono text-white border border-white/20 flex items-center space-x-2">
          <span>{new Date().toLocaleTimeString()}</span>
          <span className="text-gray-400">|</span>
          <span className="text-emerald-400">4.2 Mbps</span>
          <span className="text-gray-400">|</span>
          <span>{isNight ? 'IR NIGHT' : 'DAYLIGHT'}</span>
        </div>

        {/* Status Badges */}
        <div className="absolute top-2 right-2 flex items-center space-x-1.5">
          {hardware.floodlight === 'HIGH' && (
            <div className="bg-amazon-orange text-amazon-text_main px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold shadow-xs flex items-center space-x-1">
              <Sun className="w-3 h-3" />
              <span>FLOODLIGHT 2000lm</span>
            </div>
          )}

          {hardware.frontDoorLock === 'UNLOCKED' ? (
            <div className="bg-amazon-success_green text-white px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold shadow-xs flex items-center space-x-1">
              <Unlock className="w-3 h-3" />
              <span>UNLOCKED</span>
            </div>
          ) : (
            <div className="bg-black/80 text-gray-200 px-1.5 py-0.5 rounded-[2px] text-[10px] font-medium border border-white/20 flex items-center space-x-1">
              <Lock className="w-3 h-3 text-red-400" />
              <span>SECURED</span>
            </div>
          )}
        </div>

        {/* Simulation Indicator Tag */}
        <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded-[2px] text-[10px] font-mono text-gray-300 border border-white/10">
          STATUS:{' '}
          <span className="text-cyan-400 font-bold">
            {currentEvent?.source.isSimulated ? 'ATLAS-MCP SYNTHETIC CANVAS' : 'PHYSICAL HARDWARE'}
          </span>
        </div>

        {/* Active Event Severity Banner */}
        {currentEvent && (
          <div className="absolute bottom-2 right-2 bg-white/95 px-2.5 py-1 rounded-[2px] border border-amazon-border_subtle flex items-center space-x-1.5 shadow-amazon">
            <span
              className={`w-2 h-2 rounded-full ${
                currentEvent.severity === 'CRITICAL'
                  ? 'bg-amazon-alert_red'
                  : currentEvent.severity === 'WARNING'
                  ? 'bg-amazon-orange'
                  : 'bg-amazon-link_blue'
              }`}
            />
            <span className="text-xs font-bold text-amazon-text_main truncate max-w-[200px]">
              {currentEvent.title}
            </span>
          </div>
        )}
      </div>

      {/* Inspectable Raw Event Payload Modal */}
      {showPayloadModal && (
        <div className="p-3 bg-amazon-background_light border-t border-amazon-border_subtle font-mono text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-amazon-text_main font-bold">Ring Edge Event Payload (ATLAS-MCP Normalized JSON)</span>
            <button
              onClick={() => setShowPayloadModal(false)}
              className="text-amazon-link_blue hover:underline text-[11px]"
            >
              Close
            </button>
          </div>
          <pre className="max-h-48 overflow-auto p-2 bg-white rounded-[2px] border border-amazon-border_subtle text-amazon-text_main text-[11px]">
            {JSON.stringify(currentEvent || { status: 'NO_ACTIVE_EVENT' }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
