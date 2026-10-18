import type { Chat, LivingWorldEvent, LivingWorldState } from '../types/roleplay';

const DAY_MS = 24 * 60 * 60 * 1000;

export function getLivingWorldState(chat: Chat): LivingWorldState {
  return chat.livingWorld || {
    enabled: true,
    events: [],
    rumors: [],
    lore: [],
    lies: [],
    relationshipNotes: [],
  };
}

export function isDailyStoryDue(state: LivingWorldState, now = Date.now()): boolean {
  if (!state.enabled) return false;
  if (!state.lastDailyStoryAt) return true;
  const last = Date.parse(state.lastDailyStoryAt);
  return !Number.isFinite(last) || now - last >= DAY_MS;
}

const summarize = (text: string, max = 420) => text.trim().replace(/\s+/g, ' ').slice(0, max);

export function applyLivingWorldReply(chat: Chat, reply: string, responder?: { id: string; name: string }, now = new Date()): Chat {
  const current = getLivingWorldState(chat);
  if (!current.enabled) return chat;
  const timestamp = now.toISOString();
  const events: LivingWorldEvent[] = [...current.events];
  const due = isDailyStoryDue(current, now.getTime());
  if (due && reply.trim()) {
    events.push({
      id: `daily:${now.toISOString().slice(0, 10)}`,
      title: `Daily story · ${now.toLocaleDateString()}`,
      summary: summarize(reply),
      occurredAt: timestamp,
      kind: 'daily',
    });
  } else if (/\b(secret|reveals?|unmasked|betray|returns?|discovered|vanished|heir|prophecy|identity)\b/i.test(reply)) {
    events.push({
      id: `event:${Date.now()}`,
      title: 'Story turning point',
      summary: summarize(reply, 300),
      occurredAt: timestamp,
      kind: /\b(secret|reveals?|unmasked|betray|returns?|heir|prophecy|identity)\b/i.test(reply) ? 'twist' : 'discovery',
    });
  }

  const rumorMatches = [...reply.matchAll(/(?:rumou?rs?|whispers?|people say|word is)[: ,—-]+([^.!?\n]{12,180})/gi)]
    .map((match) => match[1].trim()).slice(0, 3);
  const newRumors = rumorMatches.map((text, index) => ({
    id: `rumor:${Date.now()}:${index}`,
    text,
    truth: 'unknown' as const,
    believers: [],
    createdAt: timestamp,
  }));
  const lieMatch = reply.match(/\b(?:lied|lie|false story|wasn't true|was not true)\b/i);
  const speaker = responder?.id || chat.characterIds[0] || 'unknown';
  const lieAlreadyTracked = current.lies.some((lie) => lie.characterId === speaker && !lie.discovered && lieMatch && lie.claim.toLowerCase().includes(lieMatch[0].toLowerCase()));
  const dailyLore = due && reply.trim() ? [{
    id: `lore:daily:${now.toISOString().slice(0, 10)}`,
    title: `Daily chronicle · ${now.toLocaleDateString()}`,
    category: 'history' as const,
    entry: summarize(reply),
    updatedAt: timestamp,
  }] : [];
  const relationshipNotes = [...current.relationshipNotes];
  if (/\bjealous|jealousy|possessive|territorial|competing for (?:your|her|his) attention\b/i.test(reply)) {
    const characterId = chat.characterIds[0] || 'unknown';
    const existing = relationshipNotes.findIndex((note) => note.characterId === characterId && note.toward === '{{user}}');
    if (existing >= 0) {
      relationshipNotes[existing] = { ...relationshipNotes[existing], jealousy: Math.min(100, relationshipNotes[existing].jealousy + 12), note: summarize(reply, 160) };
    } else {
      relationshipNotes.push({ characterId, characterName: responder?.name || characterId, toward: '{{user}}', affinity: chat.relationshipScore ?? 50, jealousy: 18, note: summarize(reply, 160) });
    }
  }
  const nextState: LivingWorldState = {
    ...current,
    lastDailyStoryAt: due ? timestamp : current.lastDailyStoryAt,
    events: events.slice(-120),
    rumors: [...current.rumors, ...newRumors].slice(-120),
    lore: [...current.lore, ...dailyLore].slice(-120),
    relationshipNotes: relationshipNotes.slice(-80),
  };
  if (lieMatch && !lieAlreadyTracked) {
    nextState.lies = [...current.lies, {
      characterId: speaker,
      characterName: responder?.name || speaker,
      claim: summarize(reply, 220),
      discovered: false,
      createdAt: timestamp,
    }].slice(-80);
  }
  return { ...chat, livingWorld: nextState, updatedAt: timestamp };
}
