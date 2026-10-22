'use client';

import React, { useState } from 'react';
import { ScenarioId } from '@/types/syntra';
import {
  PackageCheck,
  ShieldAlert,
  UserCheck,
  RotateCcw,
} from 'lucide-react';

interface ScenarioControlsProps {
  activeScenario: ScenarioId | 'IDLE';
  onScenarioTriggered: () => void;
}

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  activeScenario,
  onScenarioTriggered,
}) => {
  const [triggering, setTriggering] = useState<string | null>(null);

  const scenarios: Array<{
    id: ScenarioId;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    badge: string;
    badgeStyle: string;
  }> = [
    {
      id: 'scenario_1_delivery',
      title: '1. Medical Delivery Anomaly',
      subtitle: 'Crushed box + Bee wearable insulin prescription note',
      icon: <PackageCheck className="w-4 h-4 text-amazon-alert_red" />,
      badge: 'HIGH PRIORITY',
      badgeStyle: 'bg-amazon-alert_red text-white',
    },
    {
      id: 'scenario_2_suspicious',
      title: '2. Suspicious Night Loitering',
      subtitle: 'Prowler detected (58s motion, 2 lux) + Watch advisory',
      icon: <ShieldAlert className="w-4 h-4 text-amazon-orange" />,
      badge: 'SECURITY ALERT',
      badgeStyle: 'bg-amazon-secondary_ink text-amazon-accent_amber',
    },
    {
      id: 'scenario_3_visitor',
      title: '3. Trusted Visitor Arrival',
      subtitle: 'Uncle Dave recognized + Spare car keys voice memo',
      icon: <UserCheck className="w-4 h-4 text-amazon-success_green" />,
      badge: 'VERIFIED ACCESS',
      badgeStyle: 'bg-amazon-success_green text-white',
    },
    {
      id: 'scenario_4_reset',
      title: '4. All-Clear Reset',
      subtitle: 'Clear Fire TV alerts, resume media, retain telemetry',
      icon: <RotateCcw className="w-4 h-4 text-amazon-link_blue" />,
      badge: 'STANDBY',
      badgeStyle: 'bg-amazon-card_hover text-amazon-text_muted border border-amazon-border_subtle',
    },
  ];

  const handleTrigger = async (scenarioId: ScenarioId) => {
    setTriggering(scenarioId);
    try {
      await fetch('/api/ring-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioId }),
      });
      onScenarioTriggered();
    } catch (e) {
      console.error('Failed to trigger scenario:', e);
    } finally {
      setTriggering(null);
    }
  };

  return (
    <div className="bg-amazon-surface_white border border-amazon-border_subtle rounded-[4px] p-3 shadow-amazon">
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-amazon-border_subtle">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-amazon-text_main">
            SYNTRA Edge Scenarios (Discovery & Testing)
          </span>
          <span className="bg-amazon-accent_amber text-amazon-primary_ink font-bold text-[10px] px-1.5 py-0.5 rounded-[2px]">
            E2E WORKFLOWS
          </span>
        </div>
        <span className="text-[11px] text-amazon-text_muted hidden md:inline">
          Click any scenario to test Ring event ingestion → Context correlation → Bedrock AI → Fire TV PiP
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {scenarios.map((sc) => {
          const isActive = activeScenario === sc.id;
          const isBusy = triggering === sc.id;

          return (
            <button
              key={sc.id}
              onClick={() => handleTrigger(sc.id)}
              disabled={isBusy}
              className={`flex flex-col text-left p-2.5 rounded-[4px] border transition relative ${
                isActive
                  ? 'border-2 border-amazon-orange bg-amazon-active_tint shadow-xs'
                  : 'border-amazon-border_subtle bg-white hover:border-amazon-border_subtle hover:bg-amazon-card_hover'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 w-full">
                <div className="flex items-center space-x-1.5">
                  {sc.icon}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] tracking-wide ${sc.badgeStyle}`}>
                    {sc.badge}
                  </span>
                </div>
                {isActive && (
                  <span className="text-[10px] font-bold text-amazon-orange border border-amazon-orange px-1 rounded-[2px]">
                    ACTIVE
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-amazon-text_main mb-0.5 truncate w-full">
                {sc.title}
              </div>
              <div className="text-[11px] text-amazon-text_muted line-clamp-2 leading-tight">
                {sc.subtitle}
              </div>

              {isBusy && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-xs font-bold text-amazon-text_main">
                  Triggering...
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
