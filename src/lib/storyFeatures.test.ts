import { describe, expect, it } from 'bun:test';
import { applyExplicitPreferences, extractExplicitPreferences, makeStoryBibleEntry } from './storyFeatures';
import type { Character } from '../types/roleplay';

const character: Character = {
  id: 'lucious', name: 'Lucious', avatar: '', description: '', personality: '', scenario: '', first_mes: '',
  summary: '', mes_example: '', tags: [], createdAt: '2026-01-01', updatedAt: '2026-01-01',
};

describe('story features', () => {
  it('learns only explicit first-person likes and dislikes with evidence', () => {
    expect(extractExplicitPreferences('“I love old jazz records, but I hate crowded clubs.”')).toEqual([
      { kind: 'like', value: 'old jazz records', evidence: 'I love old jazz records, but I hate crowded clubs' },
    ]);
  });

  it('ignores empty and user-directed preference claims', () => {
    expect(extractExplicitPreferences('I like you. I hate . I prefer Emmy to everyone.')).toEqual([]);
  });

  it('deduplicates learned likes and retains evidence', () => {
    const current = { ...character, learnedPreferences: { likes: ['jazz'], dislikes: [], evidence: ['I like jazz'] } };
    const updated = applyExplicitPreferences(current, 'I like jazz. I dislike loud clubs.');
    expect(updated.learnedPreferences?.likes).toEqual(['jazz']);
    expect(updated.learnedPreferences?.dislikes).toEqual(['loud clubs']);
    expect(updated.learnedPreferences?.evidence).toContain('I dislike loud clubs');
  });

  it('creates a Story Bible entry from visible conversation text only', () => {
    const entry = makeStoryBibleEntry('chat-1', 'We agreed to meet at the cafe.', 'I will be there at seven.', '2026-10-17T12:00:00.000Z');
    expect(entry?.chatId).toBe('chat-1');
    expect(entry?.content).toContain('We agreed to meet at the cafe.');
    expect(entry?.content).toContain('I will be there at seven.');
  });
});
