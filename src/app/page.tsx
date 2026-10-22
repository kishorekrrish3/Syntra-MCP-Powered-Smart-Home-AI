'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { SyntraGlobalState } from '@/types/syntra';
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
  const [state, setState] = useState<SyntraGlobalState | null>(null);
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
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center font-sans text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#00F0FF] animate-ping" />
          <span>Connecting to SYNTRA Mission Control (Powered by ATLAS-MCP)...</span>
        </div>
      </div>
    );
  }

  const { hardware, currentEvent, fireTv, memories, aws, protocolLogs, timeline, activeScenario } = state;

  return (
    <div className="min-h-screen bg-amazon-background_light text-amazon-text_main flex flex-col font-ember antialiased">
      {/* 1. SYNTRA Primary Navigation Bar (#0B0F19 & #131921) */}
      <header className="bg-[#0B0F19] border-b border-slate-800 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
        {/* SYNTRA Brand & ATLAS-MCP Signature */}
        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-black tracking-wider text-white leading-none">
                SYNTRA
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-[#00F0FF] border border-cyan-800 tracking-wider uppercase">
                ATLAS-MCP
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
              Your Home. One Intelligent Network.
            </span>
          </div>

          {/* Deliver to Home / Front Porch Hub */}
          <div className="hidden md:flex items-center space-x-1 pl-3 text-left border-l border-slate-700">
            <MapPin className="w-3.5 h-3.5 text-[#00F0FF]" />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] text-slate-400">Connected Hub</span>
              <span className="font-bold text-[11px] text-white">Front Porch & Living Room</span>
            </div>
          </div>
        </div>

        {/* Global Search Bar (Alexa+ Natural Language Query) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-2 hidden sm:flex">
          <div className="flex w-full rounded-[4px] overflow-hidden focus-within:ring-2 focus-within:ring-[#00F0FF] border border-slate-700">
            <div className="bg-[#1E293B] text-slate-200 px-2.5 py-1.5 text-xs font-medium border-r border-slate-700 flex items-center cursor-pointer select-none">
              All Devices
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search front-door events, ask Alexa+, or type a command..."
              className="flex-1 px-3 py-1.5 text-xs text-white bg-[#0F172A] focus:outline-none placeholder-slate-400"
            />
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 text-white transition flex items-center justify-center font-bold"
              title="Query Alexa+ via ATLAS-MCP"
            >
              <Search className="w-4 h-4 font-bold" />
            </button>
          </div>
        </form>

        {/* Right Navigation Links & Status */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex flex-col text-right leading-tight">
            <span className="text-[10px] text-slate-400">MCP Protocol</span>
            <span className="font-bold text-[11px] text-[#00F0FF]">Streamable HTTP</span>
          </div>

          <div className="hidden lg:flex flex-col text-right leading-tight">
            <span className="text-[10px] text-slate-400">Cloud Engine</span>
            <span className="font-bold text-[11px] text-emerald-400">
              {aws.mode === 'REAL_BEDROCK_S3' ? 'AWS Bedrock' : 'Simulated Bedrock'}
            </span>
          </div>

          <Link
            href="/diagram"
            target="_blank"
            className="btn-amazon-white px-2.5 py-1 text-xs font-bold text-amazon-text_main flex items-center space-x-1"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Architecture Slide</span>
          </Link>

          <button
            onClick={() => setShowDocsModal(true)}
            className="btn-amazon-white px-2.5 py-1 text-xs font-bold text-amazon-text_main flex items-center space-x-1"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Docs & Rubric</span>
          </button>

          <Link
            href="/firetv"
            target="_blank"
            className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white px-3 py-1 text-xs font-bold rounded-[4px] flex items-center space-x-1 transition shadow-sm"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Fire TV</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* 2. Sub-Navigation Bar (#0F172A) */}
      <nav className="bg-[#0F172A] text-slate-300 px-4 py-1.5 flex items-center justify-between text-xs font-medium border-b border-slate-800">
        <div className="flex items-center space-x-4 overflow-x-auto">
          <span className="flex items-center space-x-1 font-bold text-[#00F0FF] cursor-pointer">
            <Menu className="w-4 h-4" />
            <span>All Scenarios</span>
          </span>
          <span className="hover:text-white cursor-pointer">Ring Doorbell Pro 2</span>
          <span className="hover:text-white cursor-pointer">Bee Wearable Notes</span>
          <span className="hover:text-white cursor-pointer">Alexa+ Agent</span>
          <span className="hover:text-white cursor-pointer">AWS Bedrock & S3</span>
          <span className="text-cyan-400 font-mono hover:underline cursor-pointer">@atlas/mcp-iot-bridge (MIT)</span>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono text-cyan-400">
          <span>SYNTRA — POWERED BY ATLAS-MCP</span>
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
