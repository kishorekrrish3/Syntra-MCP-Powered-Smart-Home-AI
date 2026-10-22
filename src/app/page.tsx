'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { OmniGuardGlobalState } from '@/types/omniguard';
import { CameraCanvas } from '@/components/CameraCanvas';
import { AlexaSimulatorPanel } from '@/components/AlexaSimulatorPanel';
import { ScenarioControls } from '@/components/ScenarioControls';
import { ContextMemoryList } from '@/components/ContextMemoryList';
import { McpProtocolInspector } from '@/components/McpProtocolInspector';
import { FireTvMiniPreview } from '@/components/FireTvMiniPreview';
import { SubmissionDocsModal } from '@/components/SubmissionDocsModal';
import {
  Shield,
  Tv,
  FileText,
  Activity,
  Layers,
  Cloud,
  CheckCircle2,
  Lock,
  Unlock,
  Sun,
  Volume2,
  ExternalLink,
  RotateCcw,
  Search,
  MapPin,
  Menu,
} from 'lucide-react';

export default function MissionControlDashboard() {
  const [state, setState] = useState<OmniGuardGlobalState | null>(null);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync state from server-backed state store
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (e) {
      console.error('Failed to sync state:', e);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, [fetchState]);

  const handleManualAction = async (action: string, payload?: unknown) => {
    setIsRefreshing(true);
    try {
      await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      fetchState();
    } catch (e) {
      console.error('Action failed:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    fetch('/api/alexa-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery }),
    }).then(() => {
      setSearchQuery('');
      fetchState();
    });
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-amazon-background_light flex items-center justify-center font-sans text-xs text-amazon-text_muted">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-amazon-orange animate-ping" />
          <span>Connecting to Amazon OmniGuard Mission Control...</span>
        </div>
      </div>
    );
  }

  const { hardware, currentEvent, fireTv, memories, aws, protocolLogs, timeline, activeScenario } = state;

  return (
    <div className="min-h-screen bg-amazon-background_light text-amazon-text_main flex flex-col font-ember antialiased">
      {/* 1. Amazon Global Primary Navigation Bar (#131921) */}
      <header className="bg-amazon-primary_ink text-white px-4 py-2 flex items-center justify-between gap-3 text-xs">
        {/* Amazon Logo & OmniGuard Brand */}
        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="flex flex-col">
            <div className="flex items-center space-x-1">
              <span className="text-lg font-black tracking-tight text-white leading-none">
                amazon
              </span>
              <span className="text-xs font-bold text-amazon-orange tracking-tight leading-none">
                omniguard
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">Home Guardian</span>
          </div>

          {/* Deliver to Home */}
          <div className="hidden md:flex items-center space-x-1 pl-3 text-left border-l border-gray-700">
            <MapPin className="w-3.5 h-3.5 text-amazon-accent_amber" />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] text-gray-400">Deliver to</span>
              <span className="font-bold text-[11px] text-white">Front Porch Hub</span>
            </div>
          </div>
        </div>

        {/* Global Search Bar (Amazon High-Conversion Search Standard) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-2 hidden sm:flex">
          <div className="flex w-full rounded-[4px] overflow-hidden focus-within:ring-2 focus-within:ring-amazon-orange">
            <div className="bg-gray-100 text-amazon-text_main px-2.5 py-1.5 text-xs font-medium border-r border-gray-300 flex items-center cursor-pointer select-none">
              All Devices
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search front-door events, ask Alexa+, or type a command..."
              className="flex-1 px-3 py-1.5 text-xs text-amazon-text_main bg-white focus:outline-none"
            />
            <button
              type="submit"
              className="bg-amazon-orange hover:bg-amazon-orange_hover px-4 py-1.5 text-amazon-primary_ink transition flex items-center justify-center"
              title="Search"
            >
              <Search className="w-4 h-4 font-bold" />
            </button>
          </div>
        </form>

        {/* Right Navigation Links & Status */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex flex-col text-right leading-tight">
            <span className="text-[10px] text-gray-400">MCP Protocol</span>
            <span className="font-bold text-[11px] text-amazon-accent_amber">Streamable HTTP</span>
          </div>

          <div className="hidden lg:flex flex-col text-right leading-tight">
            <span className="text-[10px] text-gray-400">Cloud Engine</span>
            <span className="font-bold text-[11px] text-emerald-400">
              {aws.mode === 'REAL_BEDROCK_S3' ? 'AWS Bedrock' : 'Simulated'}
            </span>
          </div>

          <Link
            href="/diagram"
            target="_blank"
            className="btn-amazon-white px-2.5 py-1 text-xs font-bold text-amazon-text_main flex items-center space-x-1"
          >
            <Layers className="w-3.5 h-3.5 text-amazon-orange" />
            <span>Architecture Slide</span>
          </Link>

          <button
            onClick={() => setShowDocsModal(true)}
            className="btn-amazon-white px-2.5 py-1 text-xs font-bold text-amazon-text_main flex items-center space-x-1"
          >
            <FileText className="w-3.5 h-3.5 text-amazon-orange" />
            <span>Docs & Rubric</span>
          </button>

          <Link
            href="/firetv"
            target="_blank"
            className="btn-amazon-primary px-3 py-1 text-xs font-bold text-amazon-primary_ink flex items-center space-x-1"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Fire TV</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* 2. Amazon Sub-Navigation Bar (#232F3E) */}
      <nav className="bg-amazon-secondary_ink text-white px-4 py-1.5 flex items-center justify-between text-xs font-medium border-t border-gray-700">
        <div className="flex items-center space-x-4 overflow-x-auto">
          <span className="flex items-center space-x-1 font-bold cursor-pointer hover:text-amazon-accent_amber">
            <Menu className="w-4 h-4" />
            <span>All Scenarios</span>
          </span>
          <span className="text-gray-300 hover:text-white cursor-pointer">Ring Doorbell Pro 2</span>
          <span className="text-gray-300 hover:text-white cursor-pointer">Bee Wearable Notes</span>
          <span className="text-gray-300 hover:text-white cursor-pointer">Alexa+ Agent</span>
          <span className="text-gray-300 hover:text-white cursor-pointer">AWS Bedrock & S3</span>
          <span className="text-gray-300 hover:text-white cursor-pointer">@argon/mcp-iot-bridge (MIT)</span>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono text-amazon-accent_amber">
          <span>HACKATHON BUILD, SHIP, SHAPE</span>
        </div>
      </nav>

      {/* 3. Main Dashboard Body (#EAEDED) */}
      <main className="flex-1 p-3 md:p-4 space-y-3 max-w-[1720px] w-full mx-auto">
        {/* Scenario Controls Bar */}
        <ScenarioControls
          activeScenario={activeScenario}
          onScenarioTriggered={fetchState}
        />

        {/* 4-Area Mission Control Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Column Left (5 cols): Camera Viewport & Edge Actuators */}
          <div className="lg:col-span-5 space-y-3 flex flex-col">
            <CameraCanvas currentEvent={currentEvent} hardware={hardware} />

            {/* Hardware Actuators Card */}
            <div className="bg-amazon-surface_white border border-amazon-border_subtle rounded-[4px] p-3 shadow-amazon">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-amazon-border_subtle text-xs">
                <span className="font-bold text-amazon-text_main">Edge Hardware Actuators</span>
                <span className="text-amazon-text_muted text-[11px]">Enforced Resident Safety Protocols</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* Door Lock Action */}
                <button
                  onClick={() =>
                    handleManualAction(
                      hardware.frontDoorLock === 'UNLOCKED' ? 'RESET_ALL' : 'UNLOCK_DOOR',
                      { confirmed: true }
                    )
                  }
                  className={`flex flex-col items-center justify-center p-2 rounded-[4px] border transition ${
                    hardware.frontDoorLock === 'UNLOCKED'
                      ? 'bg-emerald-50 border-amazon-success_green text-amazon-success_green font-bold'
                      : 'btn-amazon-white text-amazon-text_main font-medium'
                  }`}
                >
                  {hardware.frontDoorLock === 'UNLOCKED' ? (
                    <Unlock className="w-4 h-4 mb-0.5 text-amazon-success_green" />
                  ) : (
                    <Lock className="w-4 h-4 mb-0.5 text-amazon-alert_red" />
                  )}
                  <span className="text-[11px]">
                    {hardware.frontDoorLock === 'UNLOCKED' ? 'Door Unlocked' : 'Deadbolt Locked'}
                  </span>
                  <span className="text-[10px] text-amazon-text_muted">Click to toggle</span>
                </button>

                {/* Floodlight Action */}
                <button
                  onClick={() => handleManualAction('TOGGLE_FLOODLIGHT')}
                  className={`flex flex-col items-center justify-center p-2 rounded-[4px] border transition ${
                    hardware.floodlight === 'HIGH'
                      ? 'bg-amber-50 border-amazon-orange text-amazon-primary_ink font-bold'
                      : 'btn-amazon-white text-amazon-text_main font-medium'
                  }`}
                >
                  <Sun className={`w-4 h-4 mb-0.5 ${hardware.floodlight === 'HIGH' ? 'text-amazon-orange' : 'text-gray-400'}`} />
                  <span className="text-[11px]">
                    Floodlight: {hardware.floodlight}
                  </span>
                  <span className="text-[10px] text-amazon-text_muted">2000lm Deterrence</span>
                </button>

                {/* Two-Way Audio Courier Hold */}
                <button
                  onClick={() => handleManualAction('HOLD_COURIER')}
                  className={`flex flex-col items-center justify-center p-2 rounded-[4px] border transition ${
                    hardware.courierIntercomActive
                      ? 'bg-blue-50 border-amazon-link_blue text-amazon-link_blue font-bold'
                      : 'btn-amazon-white text-amazon-text_main font-medium'
                  }`}
                >
                  <Volume2 className={`w-4 h-4 mb-0.5 ${hardware.courierIntercomActive ? 'text-amazon-link_blue' : 'text-gray-400'}`} />
                  <span className="text-[11px]">
                    {hardware.courierIntercomActive ? 'Intercom Active' : 'Hold Courier'}
                  </span>
                  <span className="text-[10px] text-amazon-text_muted">Two-Way Audio</span>
                </button>
              </div>
            </div>

            {/* Fire TV Mini Preview */}
            <FireTvMiniPreview fireTv={fireTv} />
          </div>

          {/* Column Middle (4 cols): Alexa+ Agent Console */}
          <div className="lg:col-span-4 flex flex-col">
            <AlexaSimulatorPanel state={state} onRefresh={fetchState} />
          </div>

          {/* Column Right (3 cols): Personal Context Store */}
          <div className="lg:col-span-3 flex flex-col">
            <ContextMemoryList memories={memories} onRefresh={fetchState} />
          </div>
        </div>

        {/* Lower Row: MCP Protocol Inspector & Incident Archive */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Protocol Inspector (7 cols) */}
          <div className="lg:col-span-7">
            <McpProtocolInspector logs={protocolLogs} awsState={aws} />
          </div>

          {/* Event & Action Timeline (5 cols) */}
          <div className="lg:col-span-5 flex flex-col bg-amazon-surface_white border border-amazon-border_subtle rounded-[4px] shadow-amazon overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-amazon-card_hover border-b border-amazon-border_subtle">
              <div className="flex items-center space-x-2">
                <span className="bg-amazon-primary_ink text-white font-bold text-[10px] px-1.5 py-0.5 rounded-[2px] tracking-wide">
                  TIMELINE
                </span>
                <span className="text-amazon-text_main font-bold text-xs tracking-tight">
                  Inspectable Event & Hardware Timeline
                </span>
              </div>

              <button
                onClick={() => handleManualAction('RESET_ALL')}
                className="btn-amazon-white px-2 py-0.5 text-[11px] font-bold flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3 text-amazon-orange" />
                <span>Reset Standby</span>
              </button>
            </div>

            <div className="flex-1 p-2.5 overflow-y-auto space-y-1.5 max-h-[340px] text-xs font-mono bg-white">
              {timeline.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-[4px] border border-amazon-border_subtle hover:bg-amazon-card_hover transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-[2px] ${
                        item.actor === 'BEDROCK_AI'
                          ? 'bg-purple-100 text-purple-800'
                          : item.actor === 'FIRE_TV'
                          ? 'bg-sky-100 text-sky-800'
                          : item.actor === 'ALEXA_AGENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {item.actor} • {item.action}
                    </span>
                    <span className="text-[10px] text-amazon-text_muted">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-amazon-text_main text-[11px] font-sans leading-tight">
                    {item.summary}
                  </p>

                  {item.details && (
                    <div className="mt-1 text-[10px] text-amazon-text_muted truncate">
                      {JSON.stringify(item.details)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Submission Documentation Modal */}
      <SubmissionDocsModal
        isOpen={showDocsModal}
        onClose={() => setShowDocsModal(false)}
      />
    </div>
  );
}
