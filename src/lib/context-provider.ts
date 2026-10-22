/**
 * @file context-provider.ts
 * @description Ingestion and retrieval engine for personal context memories (Bee Wearable, Alexa Notes, Fixtures).
 */

import { ContextMemory } from '@/types/omniguard';

export const DEFAULT_CONTEXT_MEMORIES: ContextMemory[] = [
  {
    id: 'mem-bee-001',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    source: 'bee_wearable',
    category: 'medical',
    content:
      'Bee Voice Note: Dr. Patel confirmed my temperature-controlled rapid-acting insulin pens were shipped via BioPharma Express. Arriving this afternoon between 2-4 PM. Needs immediate refrigeration—cannot sit in sunlight.',
    tags: ['medical', 'insulin', 'temperature', 'urgent', 'delivery', 'biopharma'],
    relevanceScore: 1.0,
  },
  {
    id: 'mem-alexa-002',
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    source: 'alexa_notes',
    category: 'visitor',
    content:
      'Alexa Voice Memo: Uncle Dave called to say he will stop by around 3:30 PM to drop off spare car keys for the weekend road trip. He has authorized access.',
    tags: ['visitor', 'family', 'keys', 'uncle dave', 'access'],
    relevanceScore: 1.0,
  },
  {
    id: 'mem-bee-003',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    source: 'bee_wearable',
    category: 'security',
    content:
      'Bee Transcribed Meeting: Neighborhood watch alert posted yesterday regarding suspicious nighttime loitering and package scouting on Elm & Maple streets.',
    tags: ['security', 'neighborhood', 'loitering', 'theft', 'suspicious'],
    relevanceScore: 1.0,
  },
];

export class ContextProvider {
  private static memories: ContextMemory[] = [...DEFAULT_CONTEXT_MEMORIES];

  public static getMemories(): ContextMemory[] {
    return [...this.memories];
  }

  public static addMemory(memory: Omit<ContextMemory, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): ContextMemory {
    const newMem: ContextMemory = {
      id: memory.id || `mem-custom-${Date.now()}`,
      timestamp: memory.timestamp || new Date().toISOString(),
      source: memory.source || 'manual',
      category: memory.category || 'general',
      content: memory.content,
      tags: memory.tags || [],
      relevanceScore: memory.relevanceScore ?? 1.0,
    };
    this.memories.unshift(newMem);
    return newMem;
  }

  public static searchMemories(query: string): ContextMemory[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getMemories();

    const terms = q.split(/\s+/);

    return this.memories
      .map(mem => {
        let score = 0;
        const text = `${mem.content} ${mem.tags.join(' ')} ${mem.category}`.toLowerCase();
        for (const t of terms) {
          if (text.includes(t)) {
            score += 1;
          }
        }
        return { mem, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => ({ ...item.mem, relevanceScore: item.score }));
  }

  public static resetToDefaults(): void {
    this.memories = [...DEFAULT_CONTEXT_MEMORIES];
  }
}
