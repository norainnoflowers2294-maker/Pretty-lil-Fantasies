import React, { useState } from 'react';
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import type { Chat, Character, Persona } from '../types/roleplay';

interface Props {
  chat: Chat;
  characters: Character[];
  personas: Persona[];
  onSave: (chat: Chat) => void;
  onClearContext: () => void;
  onClose: () => void;
}

const fieldClass = 'mt-1 w-full rounded-xl border border-[#c979a2]/50 bg-white/90 px-3 py-2.5 text-sm text-[#211019] outline-none focus:border-[#d94691] focus:ring-2 focus:ring-[#e99bc3]/30';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-[#533346]';

export const ChatSettingsPanel: React.FC<Props> = ({ chat, characters, personas, onSave, onClearContext, onClose }) => {
  const [draft, setDraft] = useState<Chat>({ ...chat, characterIds: [...chat.characterIds] });
  const characterProfiles = (() => {
    const normalized = characters.map((character) => ({
      character,
      tokens: character.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean),
    }));
    const fullNameKeysByFirst = new Map<string, Set<string>>();
    normalized.filter(({ tokens }) => tokens.length > 1).forEach(({ tokens }) => {
      const key = `name:${tokens[0]}:${tokens[tokens.length - 1]}`;
      if (!fullNameKeysByFirst.has(tokens[0])) fullNameKeysByFirst.set(tokens[0], new Set());
      fullNameKeysByFirst.get(tokens[0])!.add(key);
    });
    const groups = new Map<string, { character: Character; ids: string[] }>();
    normalized.forEach(({ character, tokens }) => {
      if (!tokens.length) return;
      let key = tokens.length > 1 ? `name:${tokens[0]}:${tokens[tokens.length - 1]}` : `single:${tokens[0]}`;
      const matchingNames = fullNameKeysByFirst.get(tokens[0]);
      if (tokens.length === 1 && matchingNames?.size === 1) key = Array.from(matchingNames)[0];
      const group = groups.get(key);
      if (group) group.ids.push(character.id);
      else groups.set(key, { character, ids: [character.id] });
    });
    return Array.from(groups.values());
  })();
  const toggleCharacters = (primaryId: string, ids: string[]) => setDraft((current) => {
    const isSelected = ids.some((id) => current.characterIds.includes(id));
    return {
      ...current,
      characterIds: isSelected
        ? current.characterIds.filter((characterId) => !ids.includes(characterId))
        : Array.from(new Set([...current.characterIds, primaryId])),
    };
  });

  const selectClass = fieldClass;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="chat-settings-title" className="plf-chat-settings-panel max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-[1.6rem] border border-white/90 bg-[linear-gradient(145deg,rgba(255,250,253,.98),rgba(255,220,236,.96),rgba(225,238,248,.95))] p-5 text-[#211019] shadow-[0_18px_52px_rgba(65,23,49,.3)]">
        <header className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-pink-300" /><h2 id="chat-settings-title" className="text-lg font-bold">Chat settings</h2></div>
          <button type="button" onClick={onClose} aria-label="Close chat settings" className="rounded-full border border-[#d987a7]/35 bg-white/80 p-2 text-[#392338] hover:bg-[#ffe0ed]"><X className="h-4 w-4" /></button>
        </header>

        <div className="space-y-5"><p className="text-xs text-[#604652]">These settings override app defaults for this chat only. The required rule against writing for {'{{user}}'} stays on.</p>
          <fieldset>
            <legend className={labelClass}>Character profiles</legend>
            <p className="mb-2 mt-1 text-xs text-[#604652]">Selected profiles are sent to the AI with their saved details and instructions.</p>
            {characterProfiles.length ? <div className="grid gap-2 sm:grid-cols-2">{characterProfiles.map(({ character, ids }) => (
              <label key={character.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#d987a7]/30 bg-white/80 p-2.5 text-sm hover:border-pink-500/60">
                <input type="checkbox" checked={ids.some((id) => draft.characterIds.includes(id))} onChange={() => toggleCharacters(character.id, ids)} className="accent-pink-500" />
                <span className="truncate">{character.name}</span>
              </label>
            ))}</div> : <p className="text-sm text-amber-200">Create a character profile to use one in this chat.</p>}
            {characters.length > 0 && draft.characterIds.length === 0 && <p role="alert" className="mt-2 text-xs text-amber-200">Choose at least one character profile.</p>}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>User persona
              <select className={selectClass} value={draft.personaId || personas[0]?.id || ''} onChange={(event) => setDraft({ ...draft, personaId: event.target.value })}>
                {personas.map((persona) => <option key={persona.id} value={persona.id}>{persona.display_name || persona.name}</option>)}
                {!personas.length && <option value="">No personas created</option>}
              </select>
            </label>
            <label className={labelClass}>Reply style
              <select className={selectClass} value={draft.replyStyle || 'immersive'} onChange={(event) => setDraft({ ...draft, replyStyle: event.target.value as Chat['replyStyle'] })}>
                <option value="immersive">Immersive prose</option><option value="balanced">Balanced</option><option value="dialogue">Dialogue-forward</option><option value="screenplay">Screenplay</option>
              </select>
            </label>
            <label className={labelClass}>Mock model voice
              <select className={selectClass} value={draft.mockStyle || 'chatgpt'} onChange={(event) => setDraft({ ...draft, mockStyle: event.target.value as NonNullable<Chat['mockStyle']> })}>
                <option value="chatgpt">Mock ChatGPT</option><option value="gemini">Mock Gemini</option><option value="deepseek">Mock DeepSeek</option><option value="grok">Mock Grok</option>
              </select>
              <span className="mt-1 block text-[10px] font-normal normal-case text-[#73576a]">Changes the reply tone, not the connected model.</span>
            </label>
            <label className={labelClass}>Assistant helper
              <select className={selectClass} value={draft.helperMode || 'roleplay'} onChange={(event) => setDraft({ ...draft, helperMode: event.target.value as NonNullable<Chat['helperMode']> })}>
                <option value="roleplay">Roleplay</option><option value="internet">Internet research</option><option value="coder">Coder</option><option value="ideas">Idea creator</option><option value="story">Story writer</option>
              </select>
            </label>
            <label className={labelClass}>Reply length
              <select className={selectClass} value={draft.replyLength || 'medium'} onChange={(event) => setDraft({ ...draft, replyLength: event.target.value as Chat['replyLength'] })}>
                <option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option><option value="custom">Custom prose target</option>
              </select>
            </label>
            {draft.replyLength === 'custom' && <label className={labelClass}>Custom prose target (words)
              <input className={fieldClass} type="number" min="40" max="1500" step="20" value={draft.customResponseWords ?? 180} onChange={(event) => setDraft({ ...draft, customResponseWords: Math.max(40, Math.min(1500, Number(event.target.value) || 40)) })} />
              <span className="mt-1 block text-[10px] font-normal normal-case text-[#73576a]">This guides prose length; model output tokens remain a separate safety limit.</span>
            </label>}
            <label className={labelClass}>Dialogue versus description <span className="normal-case text-[#604652]">{draft.dialogueBalance ?? 50}% description</span>
              <input className="mt-3 w-full accent-pink-500" type="range" min="0" max="100" step="5" value={draft.dialogueBalance ?? 50} onChange={(event) => setDraft({ ...draft, dialogueBalance: Number(event.target.value) })} />
              <span className="mt-1 flex justify-between text-[10px] font-normal normal-case text-[#73576a]"><span>Mostly dialogue</span><span>Mostly description</span></span>
            </label>
            <label className={labelClass}>Scene pacing
              <select className={selectClass} value={draft.scenePacing || 'balanced'} onChange={(event) => setDraft({ ...draft, scenePacing: event.target.value as NonNullable<Chat['scenePacing']> })}><option value="slow_burn">Slow-burn</option><option value="balanced">Balanced</option><option value="fast">Fast progression</option></select>
            </label>
            <label className={labelClass}>NPC activity
              <select className={selectClass} value={draft.npcActivity || 'balanced'} onChange={(event) => setDraft({ ...draft, npcActivity: event.target.value as NonNullable<Chat['npcActivity']> })}><option value="low">Low</option><option value="balanced">Balanced</option><option value="high">High</option></select>
            </label>
            <label className="flex items-center gap-2 text-xs text-[#392338]"><input type="checkbox" checked={draft.knowledgeBoundaries ?? true} onChange={(event) => setDraft({ ...draft, knowledgeBoundaries: event.target.checked })} className="accent-pink-500" />Respect character knowledge boundaries</label>
            <label className="flex items-center gap-2 text-xs text-[#392338]"><input type="checkbox" checked={draft.relationshipContinuity ?? true} onChange={(event) => setDraft({ ...draft, relationshipContinuity: event.target.checked })} className="accent-pink-500" />Preserve relationship changes</label>
            <label className="flex items-center gap-2 text-xs text-[#392338]"><input type="checkbox" checked={draft.naturalSpeech ?? true} onChange={(event) => setDraft({ ...draft, naturalSpeech: event.target.checked })} className="accent-pink-500" />Natural character-specific speech</label>
            <label className="flex items-center gap-2 text-xs text-[#392338]"><input type="checkbox" checked={draft.reduceRepetition ?? true} onChange={(event) => setDraft({ ...draft, reduceRepetition: event.target.checked })} className="accent-pink-500" />Reduce repeated phrasing and beats</label>
            <label className="flex items-center gap-2 text-xs text-[#392338]"><input type="checkbox" checked={draft.realisticReactions ?? true} onChange={(event) => setDraft({ ...draft, realisticReactions: event.target.checked })} className="accent-pink-500" />Keep reactions realistic and in-character</label>
            <label className={labelClass}>Point of view
              <select className={selectClass} value={draft.replyPointOfView || 'character'} onChange={(event) => setDraft({ ...draft, replyPointOfView: event.target.value as Chat['replyPointOfView'] })}>
                <option value="character">Follow character profile</option><option value="first_person">First person</option><option value="third_person">Third person</option>
              </select>
            </label>
            <label className={labelClass}>Scene mood
              <select className={selectClass} value={draft.replyMood || 'story'} onChange={(event) => setDraft({ ...draft, replyMood: event.target.value as Chat['replyMood'] })}>
                <option value="story">Follow the story</option><option value="playful">Playful</option><option value="romantic">Romantic</option><option value="dramatic">Dramatic</option><option value="cozy">Cozy</option><option value="suspenseful">Suspenseful</option><option value="comedic">Comedic</option>
              </select>
            </label>
            <label className={labelClass}>Creativity <span className="normal-case text-[#604652]">{(draft.creativity ?? 0.85).toFixed(1)}</span>
              <input className="mt-3 w-full accent-pink-500" type="range" min="0" max="2" step="0.1" value={draft.creativity ?? 0.85} onChange={(event) => setDraft({ ...draft, creativity: Number(event.target.value) })} />
              <span className="mt-1 flex justify-between text-[10px] font-normal normal-case text-[#73576a]"><span>Focused</span><span>Surprising</span></span>
            </label>
          </div>

          <label className={labelClass}>Extra prompt for this chat
            <textarea className={`${fieldClass} min-h-28 resize-y`} value={draft.promptInstructions || ''} maxLength={3000} placeholder="Example: Keep the pacing slow, use more banter, and let the mystery unfold gradually…" onChange={(event) => setDraft({ ...draft, promptInstructions: event.target.value })} />
            <span className="mt-1 block text-right text-[10px] font-normal normal-case text-[#73576a]">{(draft.promptInstructions || '').length}/3000</span>
          </label>
        </div>

        <section className="rounded-xl border border-pink-300/20 bg-white/70 p-3">
          <h3 className="text-sm font-semibold text-[#392338]">AI context</h3>
          <p className="mt-1 text-xs text-[#604652]">Start fresh context for the bot. Your existing messages stay visible, but won’t be included in future prompts. Character cards, chat settings, and saved story notes remain.</p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear this chat’s AI context? Earlier messages will stay visible but will no longer be sent to the AI.')) onClearContext();
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-900/60"
          >
            <RotateCcw className="h-4 w-4" /> Clear AI context
          </button>
        </section>

        <footer className="mt-6 flex justify-end gap-2 border-t border-[#d987a7]/30 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-[#604652] hover:bg-white/10">Cancel</button>
          <button type="button" disabled={characters.length > 0 && draft.characterIds.length === 0} onClick={() => onSave({ ...draft, characterIds: characterProfiles.filter((profile) => profile.ids.some((id) => draft.characterIds.includes(id))).map((profile) => profile.character.id), updatedAt: new Date().toISOString() })} className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-40">Save chat settings</button>
        </footer>
      </section>
    </div>
  );
};
