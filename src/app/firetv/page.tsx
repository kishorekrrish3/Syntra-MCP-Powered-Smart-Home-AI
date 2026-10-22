'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { SyntraGlobalState } from '@/types/syntra';
import {
  Film,
  Play,
  Pause,
  AlertTriangle,
  Volume2,
  Unlock,
  Sun,
  X,
  ArrowLeft,
  Tv,
  CheckCircle2,
} from 'lucide-react';

export default function FireTvLivingRoomPage() {
  const [state, setState] = useState<SyntraGlobalState | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [showVirtualRemote, setShowVirtualRemote] = useState(true);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

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
    const interval = setInterval(fetchState, 1200);
    return () => clearInterval(interval);
  }, [fetchState]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleAction = async (actionType: string) => {
    if (!state) return;

    try {
      if (actionType === 'HOLD_COURIER') {
        await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'HOLD_COURIER' }),
        });
        showToast('Two-way audio broadcast: "Please wait, resident is coming to the door."');
      } else if (actionType === 'UNLOCK_DOOR') {
        const res = await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'UNLOCK_DOOR', payload: { confirmed: true } }),
        });
        const data = await res.json();
        showToast(data.message || 'Front door unlocked for 60 seconds.');
      } else if (actionType === 'TOGGLE_FLOODLIGHT') {
        await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'TOGGLE_FLOODLIGHT' }),
        });
        showToast('Floodlight activated to HIGH 2000-lumen deterrence.');
      } else if (actionType === 'DISMISS') {
        await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'DISMISS_PIP' }),
        });
        showToast('Alert dismissed. Movie playback resumed.');
      } else if (actionType === 'TOGGLE_PLAYBACK') {
        await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'TOGGLE_PLAYBACK' }),
        });
      }
      fetchState();
    } catch (e) {
      console.error('Action failed:', e);
    }
  };

  // Keyboard / D-Pad Remote Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const pipActive = Boolean(state?.fireTv?.pipOverlay?.active);

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (pipActive ? (prev + 1) % 4 : 0));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (pipActive ? (prev - 1 + 4) % 4 : 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (pipActive) {
          if (focusedIndex === 0) handleAction('HOLD_COURIER');
          if (focusedIndex === 1) handleAction('UNLOCK_DOOR');
          if (focusedIndex === 2) handleAction('TOGGLE_FLOODLIGHT');
          if (focusedIndex === 3) handleAction('DISMISS');
        } else {
          handleAction('TOGGLE_PLAYBACK');
        }
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        if (pipActive) {
          handleAction('DISMISS');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, focusedIndex]);

  if (!state) {
    return (
      <div className="h-screen w-screen bg-amazon-primary_ink flex items-center justify-center text-white font-sans text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-amazon-orange animate-ping" />
          <span>Connecting to SYNTRA Fire TV Display...</span>
        </div>
      </div>
    );
  }

  const { fireTv } = state;
  const isPlaying = fireTv.playbackState === 'PLAYING';
  const pip = fireTv.pipOverlay;

  return (
    <div className="relative h-screen w-screen bg-amazon-primary_ink overflow-hidden font-ember select-none text-white">
      {/* 16:9 Cinematic Entertainment Canvas */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url(${fireTv.currentMedia.backdropUrl})`,
          filter: pip?.active ? 'brightness(0.35) blur(3px)' : 'brightness(0.85)',
          transform: pip?.active ? 'scale(1.02)' : 'scale(1)',
        }}
      />

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60" />

      {/* Top Media Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-amazon-primary_ink/90 px-3.5 py-1.5 rounded-[4px] border border-gray-700 shadow-amazon">
            <Film className="w-4 h-4 text-amazon-orange" />
            <span className="font-bold text-sm text-white">{fireTv.currentMedia.title}</span>
            <span className="text-gray-400 text-xs">({fireTv.currentMedia.runtime})</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-amazon-primary_ink/90 px-2.5 py-1.5 rounded-[4px] border border-gray-700 text-xs font-mono">
            <span className="text-amazon-accent_amber font-bold">FIRE TV 4K</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-300">PRIME VIDEO</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-amazon-primary_ink/90 px-3 py-1.5 rounded-[4px] border border-gray-700 text-xs font-mono">
            {isPlaying ? (
              <span className="flex items-center space-x-1.5 text-amazon-success_green font-bold">
                <Play className="w-3.5 h-3.5 fill-amazon-success_green" />
                <span>PLAYING</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-amazon-orange font-bold">
                <Pause className="w-3.5 h-3.5 fill-amazon-orange" />
                <span>PAUSED FOR SYNTRA EVENT</span>
              </span>
            )}
          </div>

          <Link
            href="/"
            className="flex items-center space-x-1 bg-amazon-secondary_ink hover:bg-gray-700 px-3 py-1.5 rounded-[4px] border border-gray-600 text-xs text-gray-200 transition font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Picture-in-Picture Contextual Notification Card */}
      {pip && pip.active ? (
        <div className="absolute bottom-10 right-10 max-w-lg w-full z-20 animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="bg-white text-amazon-text_main border-2 border-amazon-orange rounded-[4px] p-5 shadow-2xl">
            {/* PiP Header */}
            <div className="flex items-center justify-between mb-3 border-b border-amazon-border_subtle pb-2">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amazon-alert_red" />
                <span className="text-xs uppercase font-extrabold text-amazon-alert_red tracking-wide">
                  {pip.urgency} • SYNTRA GUARDIAN EVENT
                </span>
              </div>
              <span className="text-xs font-mono text-amazon-text_muted">
                {new Date(pip.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Event Title */}
            <h2 className="text-lg font-black text-amazon-text_main mb-1.5 leading-snug">
              {pip.title}
            </h2>

            {/* Summary */}
            <p className="text-xs text-amazon-text_muted leading-relaxed mb-3">
              {pip.summary}
            </p>

            {/* Evidence Tags */}
            {pip.evidence && pip.evidence.length > 0 && (
              <div className="mb-4 bg-amazon-background_light p-2.5 rounded-[4px] border border-amazon-border_subtle space-y-1">
                <div className="text-[11px] font-bold text-amazon-primary_ink flex items-center space-x-1">
                  <span>Context Correlation Evidence:</span>
                </div>
                {pip.evidence.map((ev, i) => (
                  <div key={i} className="text-xs text-amazon-text_main flex items-start space-x-1.5">
                    <span className="text-amazon-orange font-bold">•</span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Remote Navigation Actions */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => handleAction('HOLD_COURIER')}
                className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-[8px] text-xs font-bold transition shadow-xs ${
                  focusedIndex === 0
                    ? 'btn-amazon-primary remote-focused'
                    : 'btn-amazon-white text-amazon-text_main'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>Hold Courier</span>
              </button>

              <button
                onClick={() => handleAction('UNLOCK_DOOR')}
                className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-[8px] text-xs font-bold transition shadow-xs ${
                  focusedIndex === 1
                    ? 'btn-amazon-primary remote-focused'
                    : 'btn-amazon-white text-amazon-text_main'
                }`}
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Door</span>
              </button>

              <button
                onClick={() => handleAction('TOGGLE_FLOODLIGHT')}
                className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-[8px] text-xs font-bold transition shadow-xs ${
                  focusedIndex === 2
                    ? 'btn-amazon-primary remote-focused'
                    : 'btn-amazon-white text-amazon-text_main'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Floodlight</span>
              </button>

              <button
                onClick={() => handleAction('DISMISS')}
                className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-[8px] text-xs font-bold transition shadow-xs ${
                  focusedIndex === 3
                    ? 'btn-amazon-primary remote-focused'
                    : 'btn-amazon-white text-amazon-text_main'
                }`}
              >
                <X className="w-4 h-4" />
                <span>Dismiss & Resume</span>
              </button>
            </div>

            {/* D-Pad Remote Navigation Hint */}
            <div className="mt-2 text-center text-[10px] text-amazon-text_muted">
              Use <strong className="text-amazon-text_main">Arrow Keys</strong> to navigate •{' '}
              <strong className="text-amazon-text_main">[Enter]</strong> to select •{' '}
              <strong className="text-amazon-text_main">[Esc]</strong> to dismiss
            </div>
          </div>
        </div>
      ) : (
        /* Normal TV Playback Controls */
        <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3 bg-amazon-primary_ink/90 px-4 py-2 rounded-[4px] border border-gray-700">
            <button
              onClick={() => handleAction('TOGGLE_PLAYBACK')}
              className="p-1.5 rounded-[4px] bg-amazon-orange text-amazon-primary_ink font-bold hover:bg-amazon-orange_hover transition"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-amazon-primary_ink" /> : <Play className="w-4 h-4 fill-amazon-primary_ink" />}
            </button>
            <div className="w-80 bg-gray-700 h-1.5 rounded-[2px] overflow-hidden">
              <div
                className="bg-amazon-orange h-full rounded-[2px] transition-all duration-300"
                style={{ width: `${fireTv.currentMedia.progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono text-gray-300">
              {Math.floor((169 * fireTv.currentMedia.progressPercent) / 100)}m / 169m
            </span>
          </div>

          <div className="text-xs text-gray-300 bg-amazon-primary_ink/90 px-3 py-1.5 rounded-[4px] border border-gray-700">
            SYNTRA Edge Surveillance: <span className="text-amazon-success_green font-bold">ARMED & ACTIVE</span>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedbackToast && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-amazon-orange text-amazon-primary_ink px-4 py-2 rounded-[4px] font-bold text-xs shadow-xl flex items-center space-x-1.5 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Virtual Remote Control Toggle */}
      <div className="absolute bottom-6 left-6 z-30">
        {showVirtualRemote ? (
          <div className="bg-amazon-primary_ink text-white border border-gray-700 rounded-[4px] p-3 shadow-2xl flex flex-col items-center space-y-1.5">
            <div className="flex items-center justify-between w-full text-[10px] font-bold text-gray-300 mb-0.5 border-b border-gray-700 pb-1">
              <span>Fire TV Remote</span>
              <button
                onClick={() => setShowVirtualRemote(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* D-Pad Buttons */}
            <div className="flex flex-col items-center space-y-1">
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))}
                className="w-7 h-7 rounded-[4px] bg-amazon-secondary_ink hover:bg-gray-700 text-xs font-bold text-white transition flex items-center justify-center border border-gray-600"
              >
                ▲
              </button>
              <div className="flex space-x-1">
                <button
                  onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))}
                  className="w-7 h-7 rounded-[4px] bg-amazon-secondary_ink hover:bg-gray-700 text-xs font-bold text-white transition flex items-center justify-center border border-gray-600"
                >
                  ◀
                </button>
                <button
                  onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))}
                  className="w-7 h-7 rounded-[4px] bg-amazon-orange text-amazon-primary_ink font-bold text-xs transition flex items-center justify-center border border-amazon-orange_hover"
                >
                  OK
                </button>
                <button
                  onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))}
                  className="w-7 h-7 rounded-[4px] bg-amazon-secondary_ink hover:bg-gray-700 text-xs font-bold text-white transition flex items-center justify-center border border-gray-600"
                >
                  ▶
                </button>
              </div>
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))}
                className="w-7 h-7 rounded-[4px] bg-amazon-secondary_ink hover:bg-gray-700 text-xs font-bold text-white transition flex items-center justify-center border border-gray-600"
              >
                ▼
              </button>
            </div>

            <div className="flex space-x-1 pt-1 w-full">
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}
                className="flex-1 py-1 rounded-[4px] bg-amazon-secondary_ink hover:bg-gray-700 text-[10px] text-gray-300 border border-gray-600 transition"
              >
                Back (Esc)
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowVirtualRemote(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-[4px] bg-amazon-primary_ink/90 border border-gray-700 text-xs text-gray-300 hover:text-white transition shadow-md"
          >
            <Tv className="w-3 h-3 text-amazon-orange" />
            <span>Virtual Remote</span>
          </button>
        )}
      </div>
    </div>
  );
}
