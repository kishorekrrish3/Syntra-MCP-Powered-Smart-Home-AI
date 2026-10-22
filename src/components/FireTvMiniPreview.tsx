'use client';

import React from 'react';
import Link from 'next/link';
import { FireTvState } from '@/types/syntra';
import {
  ExternalLink,
  Play,
  Pause,
  AlertCircle,
  Film,
} from 'lucide-react';

interface FireTvMiniPreviewProps {
  fireTv: FireTvState;
}

export const FireTvMiniPreview: React.FC<FireTvMiniPreviewProps> = ({ fireTv }) => {
  const isPlaying = fireTv.playbackState === 'PLAYING';
  const hasOverlay = Boolean(fireTv.pipOverlay && fireTv.pipOverlay.active);

  return (
    <div className="bg-amazon-surface_white border border-amazon-border_subtle rounded-[4px] shadow-amazon flex flex-col overflow-hidden">
      {/* Amazon Card Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-amazon-card_hover border-b border-amazon-border_subtle">
        <div className="flex items-center space-x-2">
          <span className="bg-amazon-secondary_ink text-amazon-accent_amber font-bold text-[10px] px-1.5 py-0.5 rounded-[2px] tracking-wide">
            FIRE TV
          </span>
          <span className="text-amazon-text_main font-bold text-xs tracking-tight">
            SYNTRA Fire TV Sync Mirror
          </span>
          <span className="text-amazon-text_muted font-mono text-[11px] hidden sm:inline">
            16:9 HDMI Sync
          </span>
        </div>

        <Link
          href="/firetv"
          target="_blank"
          className="btn-amazon-primary px-2.5 py-1 text-xs font-bold flex items-center space-x-1"
        >
          <span>Open Fire TV Screen</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Mini Screen Preview */}
      <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
        {/* Background Movie Backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50 filter blur-xs"
          style={{ backgroundImage: `url(${fireTv.currentMedia.backdropUrl})` }}
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        {/* Media Title Overlay */}
        <div className="absolute top-2 left-2 flex items-center space-x-1.5 bg-black/80 px-2 py-0.5 rounded-[2px] text-[11px] text-white border border-white/20">
          <Film className="w-3 h-3 text-amazon-accent_amber" />
          <span className="font-bold">{fireTv.currentMedia.title}</span>
          <span className="text-gray-400">({fireTv.currentMedia.runtime})</span>
        </div>

        {/* Playback State Indicator */}
        <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black/80 px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold border border-white/20">
          {isPlaying ? (
            <>
              <Play className="w-2.5 h-2.5 text-amazon-success_green fill-amazon-success_green" />
              <span className="text-amazon-success_green">PLAYING</span>
            </>
          ) : (
            <>
              <Pause className="w-2.5 h-2.5 text-amazon-orange fill-amazon-orange" />
              <span className="text-amazon-orange">PAUSED</span>
            </>
          )}
        </div>

        {/* PiP Alert Card Simulation */}
        {hasOverlay && fireTv.pipOverlay ? (
          <div className="relative z-10 max-w-[85%] bg-white/95 border-2 border-amazon-alert_red rounded-[4px] p-2.5 shadow-xl">
            <div className="flex items-center space-x-1.5 text-amazon-alert_red text-xs font-bold mb-0.5">
              <AlertCircle className="w-3.5 h-3.5 text-amazon-alert_red" />
              <span>{fireTv.pipOverlay.urgency} FRONT DOOR ALERT</span>
            </div>
            <div className="text-xs font-bold text-amazon-text_main mb-0.5">{fireTv.pipOverlay.title}</div>
            <div className="text-[11px] text-amazon-text_muted line-clamp-2 leading-tight">
              {fireTv.pipOverlay.summary}
            </div>
            <div className="mt-1.5">
              <span className="text-[10px] bg-amazon-alert_red text-white font-bold px-1.5 py-0.5 rounded-[2px] font-mono">
                Press [ENTER] on Fire TV Remote to Respond
              </span>
            </div>
          </div>
        ) : (
          <div className="relative z-10 text-center">
            <div className="text-xs font-bold text-gray-200">Entertainment Stream Active</div>
            <div className="text-[11px] text-gray-400">No active Picture-in-Picture interruption</div>
          </div>
        )}
      </div>
    </div>
  );
};
