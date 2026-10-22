'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Tv,
  LayoutDashboard,
  Download,
  Shield,
  Layers,
  Sparkles,
  Cloud,
  CheckCircle2,
} from 'lucide-react';

export default function DiagramPresentationSlide() {
  return (
    <div className="min-h-screen bg-amazon-primary_ink text-white font-ember flex flex-col p-4 md:p-6 select-none">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-black text-white tracking-wide">SYNTRA</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-[#00F0FF] border border-cyan-800 tracking-wider">
              ATLAS-MCP
            </span>
          </div>
          <span className="text-gray-500 font-mono text-xs">|</span>
          <span className="text-xs text-[#00F0FF] font-bold font-mono">
            SYSTEM ARCHITECTURE &amp; DEMO FLOW SLIDE
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="/syntra-flowchart.svg"
            download="syntra-flowchart.svg"
            className="btn-amazon-white px-3 py-1.5 text-xs font-bold text-amazon-primary_ink flex items-center space-x-1 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download SVG Image</span>
          </a>

          <Link
            href="/"
            className="btn-amazon-secondary px-3 py-1.5 text-xs font-bold text-amazon-primary_ink flex items-center space-x-1"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/firetv"
            target="_blank"
            className="btn-amazon-primary px-3 py-1.5 text-xs font-bold text-amazon-primary_ink flex items-center space-x-1"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Fire TV</span>
          </Link>
        </div>
      </div>

      {/* 16:9 Presentation Canvas Container */}
      <div className="flex-1 w-full max-w-[1720px] mx-auto bg-[#070A11] border border-slate-800 rounded-[6px] overflow-hidden shadow-2xl flex flex-col items-center justify-center p-2">
        <img
          src="/syntra-flowchart.svg"
          alt="SYNTRA System Architecture and Intelligence Flowchart"
          className="w-full h-auto object-contain max-h-[82vh]"
        />
      </div>

      {/* Video Presentation Speaker Notes & Cue Card */}
      <div className="mt-3 p-3 bg-[#0F172A] border border-slate-800 rounded-[4px] text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="bg-cyan-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.5 rounded-[2px]">
            VIDEO CUE
          </span>
          <span className="text-gray-300">
            Use this slide between <strong>0:25–1:40</strong> to show judges how edge Ring events cross-reference Bee wearable notes via ATLAS-MCP before interrupting Fire TV!
          </span>
        </div>
        <span className="text-cyan-400 font-mono text-[11px]">Resolution: 1920 × 1080 (16:9 4K Vector)</span>
      </div>
    </div>
  );
}
