'use client';

import React, { useState } from 'react';
import { SyntraGlobalState } from '@/types/syntra';
import {
  Send,
  Wrench,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface AlexaSimulatorPanelProps {
  state: SyntraGlobalState;
  onRefresh: () => void;
}

export const AlexaSimulatorPanel: React.FC<AlexaSimulatorPanelProps> = ({ state, onRefresh }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<{ action: string; prompt: string } | null>(null);

  const quickPrompts = [
    'What happened at the front door?',
    'Hold the courier',
    'Unlock the front door',
    'Turn on floodlights',
    'Is Uncle Dave here?',
    'Clear all alerts',
  ];

  const handleSend = async (queryText?: string, confirmed = false) => {
    const text = queryText || inputText;
    if (!text.trim()) return;

    if (text.toLowerCase().includes('unlock') && !confirmed) {
      setShowConfirmModal({
        action: 'unlock',
        prompt: 'Unlocking the front door allows physical entry. Confirm you want to proceed?',
      });
      return;
    }

    setIsLoading(true);
    setInputText('');

    try {
      await fetch('/api/alexa-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, confirmed }),
      });
      onRefresh();
    } catch (e) {
      console.error('Agent query failed:', e);
    } finally {
      setIsLoading(false);
      setShowConfirmModal(null);
    }
  };

  return (
    <div className="bg-amazon-surface_white border border-amazon-border_subtle rounded-[4px] shadow-amazon flex flex-col h-full overflow-hidden">
      {/* Amazon Card Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-amazon-card_hover border-b border-amazon-border_subtle">
        <div className="flex items-center space-x-2">
          <span className="bg-amazon-link_blue text-white font-bold text-[10px] px-1.5 py-0.5 rounded-[2px] tracking-wide">
            ALEXA+
          </span>
          <span className="text-amazon-text_main font-bold text-xs tracking-tight">
            SYNTRA Alexa+ Guardian Console
          </span>
        </div>

        <span className="bg-amazon-surface_white border border-amazon-border_subtle text-amazon-text_muted font-mono text-[10px] px-1.5 py-0.5 rounded-[2px] flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amazon-success_green" />
          <span>MCP ONLINE</span>
        </span>
      </div>

      {/* Conversation Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 min-h-[280px] max-h-[440px] bg-white">
        {state.agentConversation.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[90%] rounded-[4px] p-2.5 text-xs ${
                msg.sender === 'user'
                  ? 'bg-amazon-secondary_ink text-white'
                  : 'bg-amazon-card_hover text-amazon-text_main border border-amazon-border_subtle'
              }`}
            >
              <div className="flex items-center justify-between mb-1 opacity-75 text-[10px]">
                <span className="font-bold uppercase tracking-wider">
                  {msg.sender === 'user' ? 'Resident' : 'SYNTRA Alexa+ Guardian'}
                </span>
                <span className="font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="whitespace-pre-line leading-relaxed text-xs">{msg.text}</p>

              {/* Tool Execution Trace Badge */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-2 pt-2 border-t border-amazon-border_subtle space-y-1">
                  <div className="text-[10px] font-mono text-amazon-orange font-bold flex items-center space-x-1">
                    <Wrench className="w-3 h-3 text-amazon-orange" />
                    <span>MCP Tools Invoked ({msg.toolCalls.length})</span>
                  </div>
                  {msg.toolCalls.map((tc, idx) => (
                    <div
                      key={idx}
                      className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded-[2px] text-amazon-text_main border border-amazon-border_subtle flex items-center justify-between"
                    >
                      <span className="text-amazon-link_blue font-bold">{tc.toolName}</span>
                      <span className="text-amazon-text_muted">JSON-RPC 2.0</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-amazon-text_muted py-1">
            <div className="w-2 h-2 rounded-full bg-amazon-orange animate-ping" />
            <span>Alexa+ is analyzing context and executing MCP tools...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-2 bg-amazon-card_hover border-t border-amazon-border_subtle">
        <div className="text-[11px] text-amazon-text_muted mb-1.5 font-medium">Frequent Actions:</div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="btn-amazon-white px-2 py-0.5 text-[11px] text-amazon-text_main"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Natural Language Input Bar */}
      <div className="p-2.5 bg-amazon-card_hover border-t border-amazon-border_subtle flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Alexa+ about packages, front porch, or security..."
          className="flex-1 bg-white border border-amazon-border_subtle rounded-[4px] px-3 py-1.5 text-xs text-amazon-text_main placeholder-amazon-text_muted focus:outline-none focus:ring-1 focus:ring-amazon-orange focus:border-amazon-orange transition"
        />

        <button
          onClick={() => handleSend()}
          disabled={isLoading || !inputText.trim()}
          className="btn-amazon-primary px-3 py-1.5 text-xs font-bold disabled:opacity-50 flex items-center space-x-1"
          title="Send query"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </div>

      {/* Safety Confirmation Dialog */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-amazon-border_subtle rounded-[4px] max-w-sm w-full p-4 shadow-xl">
            <div className="flex items-center space-x-2 text-amazon-alert_red mb-2">
              <ShieldAlert className="w-5 h-5 text-amazon-alert_red" />
              <h4 className="font-bold text-sm text-amazon-text_main">Security Confirmation Required</h4>
            </div>
            <p className="text-xs text-amazon-text_main mb-4 leading-relaxed">{showConfirmModal.prompt}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="btn-amazon-white px-3 py-1 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSend('Unlock the front door', true)}
                className="btn-amazon-secondary px-3 py-1 text-xs font-bold"
              >
                Confirm Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
