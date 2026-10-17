import type { Character, StoryMemory } from '../types/roleplay';

export interface LearnedPreference {
  kind: 'like' | 'dislike';
  value: string;
  evidence: string;
}

/** Only explicit first-person statements from the fictional character count. */
export function extractExplicitPreferences(text: string): LearnedPreference[] {
  const results: LearnedPreference[] = [];
  const pattern = /\bI\s+(?:really\s+)?(like|love|enjoy|prefer|dislike|hate|can't stand)\s+([^,;.!?\n]{2,100})/gi;
  for (const match of text.matchAll(pattern)) {
    const verb = match[1].toLowerCase();
    const value = match[2].trim().replace(/["'”’]+$/g, '').trim();
    if (!value || /^(you|emmy|{{user}})\b/i.test(value)) continue;
    results.push({ kind: ['dislike', 'hate', "can't stand"].includes(verb) ? 'dislike' : 'like', value, evidence: match[0].trim() });
  }
  return results;
}

export function applyExplicitPreferences(character: Character, text: string): Character {
  const found = extractExplicitPreferences(text);
  if (!found.length) return character;
  const current = character.learnedPreferences || { likes: [], dislikes: [], evidence: [] };
  const likes = [...current.likes];
  const dislikes = [...current.dislikes];
  const evidence = [...current.evidence];
  for (const item of found) {
    const target = item.kind === 'like' ? likes : dislikes;
    if (!target.some((value) => value.toLocaleLowerCase() === item.value.toLocaleLowerCase())) target.push(item.value);
    if (!evidence.includes(item.evidence)) evidence.push(item.evidence);
  }
  return { ...character, learnedPreferences: { likes, dislikes, evidence: evidence.slice(-30) }, updatedAt: new Date().toISOString() };
}

export function makeStoryBibleEntry(chatId: string, userText: string, reply: string, now = new Date().toISOString()): StoryMemory | null {
  const user = userText.trim().slice(0, 450);
  const character = reply.trim().slice(0, 700);
  if (!user && !character) return null;
  return {
    id: `bible:${chatId}:${Date.parse(now) || Date.now()}`,
    chatId,
    title: `Story Bible · ${new Date(now).toLocaleString()}`,
    type: 'recap',
    content: [user ? `User-established event/context: ${user}` : '', character ? `Character reply: ${character}` : ''].filter(Boolean).join('\n'),
    createdAt: now,
  };
}
