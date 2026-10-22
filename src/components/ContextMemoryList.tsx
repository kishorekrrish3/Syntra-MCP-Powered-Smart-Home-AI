'use client';

import React, { useState } from 'react';
import { ContextMemory } from '@/types/syntra';
import {
  Plus,
  Clock,
  Sparkles,
  Radio,
  FileText,
} from 'lucide-react';

interface ContextMemoryListProps {
  memories: ContextMemory[];
  onRefresh: () => void;
}

export const ContextMemoryList: React.FC<ContextMemoryListProps> = ({
  memories,
  onRefresh,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'medical' | 'visitor' | 'security' | 'delivery' | 'general'>('medical');
  const [newSource, setNewSource] = useState<'bee_wearable' | 'alexa_notes' | 'manual'>('bee_wearable');
  const [newTags, setNewTags] = useState('prescription, urgent');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_MEMORY',
          payload: {
            content: newContent,
            category: newCategory,
            source: newSource,
            tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
          },
        }),
      });
      setShowAddModal(false);
      setNewContent('');
      onRefresh();
    } catch (err) {
      console.error('Failed to add memory:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'bee_wearable':
        return (
          <span className="bg-amazon-secondary_ink text-amazon-accent_amber text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] flex items-center space-x-1">
            <Radio className="w-2.5 h-2.5" />
            <span>BEE WEARABLE</span>
          </span>
        );
      case 'alexa_notes':
        return (
          <span className="bg-amazon-link_blue text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>ALEXA NOTE</span>
          </span>
        );
      default:
        return (
          <span className="bg-amazon-text_muted text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] flex items-center space-x-1">
            <FileText className="w-2.5 h-2.5" />
            <span>MANUAL NOTE</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-amazon-surface_white border border-amazon-border_subtle rounded-[4px] shadow-amazon flex flex-col h-full overflow-hidden">
      {/* Amazon Card Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-amazon-card_hover border-b border-amazon-border_subtle">
        <div>
          <span className="text-amazon-text_main font-bold text-xs tracking-tight">
            SYNTRA Context Store
          </span>
          <span className="text-amazon-text_muted text-[11px] ml-1.5">
            ({memories.length} Active Notes)
          </span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-amazon-primary px-2 py-1 text-[11px] font-bold flex items-center space-x-1"
        >
          <Plus className="w-3 h-3" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Memory Items List */}
      <div className="flex-1 p-2.5 overflow-y-auto space-y-2 max-h-[440px] bg-white">
        {memories.map((mem) => (
          <div
            key={mem.id}
            className="p-2.5 bg-white rounded-[4px] border border-amazon-border_subtle hover:bg-amazon-card_hover transition text-xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              {getSourceBadge(mem.source)}
              <span className="text-[10px] text-amazon-text_muted font-mono flex items-center space-x-1">
                <Clock className="w-2.5 h-2.5" />
                <span>{new Date(mem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </div>

            <p className="text-amazon-text_main leading-relaxed mb-2 text-xs">{mem.content}</p>

            <div className="flex flex-wrap gap-1">
              <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold uppercase bg-amazon-background_light text-amazon-text_main border border-amazon-border_subtle">
                {mem.category}
              </span>
              {mem.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono text-amazon-link_blue bg-white border border-amazon-border_subtle"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-amazon-border_subtle rounded-[4px] max-w-md w-full p-4 shadow-xl">
            <h4 className="text-sm font-bold text-amazon-text_main mb-1">
              Add Personal Context Note
            </h4>
            <p className="text-xs text-amazon-text_muted mb-3">
              Add a personal note to test dynamic context correlation with edge events.
            </p>

            <form onSubmit={handleAddMemory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-amazon-text_main mb-1">
                  Note / Transcript Content:
                </label>
                <textarea
                  required
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="e.g. Expecting fragile camera lens package today from UPS..."
                  className="w-full bg-white border border-amazon-border_subtle rounded-[4px] p-2 text-xs text-amazon-text_main focus:outline-none focus:ring-1 focus:ring-amazon-orange focus:border-amazon-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-xs font-bold text-amazon-text_main mb-1">Source:</label>
                  <select
                    value={newSource}
                    onChange={(e: any) => setNewSource(e.target.value)}
                    className="w-full bg-white border border-amazon-border_subtle rounded-[4px] p-1.5 text-xs text-amazon-text_main focus:outline-none"
                  >
                    <option value="bee_wearable">Bee Wearable (Voice)</option>
                    <option value="alexa_notes">Alexa Voice Memo</option>
                    <option value="manual">Manual Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amazon-text_main mb-1">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full bg-white border border-amazon-border_subtle rounded-[4px] p-1.5 text-xs text-amazon-text_main focus:outline-none"
                  >
                    <option value="medical">Medical / Prescription</option>
                    <option value="delivery">Package / Delivery</option>
                    <option value="visitor">Visitor / Access</option>
                    <option value="security">Security / Alert</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amazon-text_main mb-1">
                  Tags (comma-separated):
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-white border border-amazon-border_subtle rounded-[4px] p-1.5 text-xs text-amazon-text_main focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-amazon-border_subtle">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-amazon-white px-3 py-1 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-amazon-primary px-4 py-1 text-xs font-bold"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
