import React, { useState } from 'react';
import { Loader2, WandSparkles, X } from 'lucide-react';
import { sendOpenRouterChatDetailed } from '../lib/openrouter';
import type { Character, Lorebook, OpenRouterConfig, Persona } from '../types/roleplay';

type Target = 'character' | 'lorebook' | 'persona';
interface Props { isOpen: boolean; config: OpenRouterConfig; onClose: () => void; onSaved: (target: Target) => void; onSaveCharacter: (item: Character) => void; onSaveLorebook: (item: Lorebook) => void; onSavePersona: (item: Persona) => void; }
function jsonFrom(text: string): any {
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/,'').trim();
  const start = cleaned.indexOf('{'); const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('The creator returned an unreadable draft. Please try again.');
  return JSON.parse(cleaned.slice(start, end + 1));
}
export function BotStudioModal({ isOpen, config, onClose, onSaved, onSaveCharacter, onSaveLorebook, onSavePersona }: Props) {
  const [target, setTarget] = useState<Target>('character');
  const [idea, setIdea] = useState('');
  const [draft, setDraft] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!isOpen) return null;
  const generate = async () => {
    if (!idea.trim() || busy) return;
    const command = idea.trim().match(/^@(character|lorebook|persona)\b\s*/i);
    const selectedTarget = (command?.[1]?.toLowerCase() as Target | undefined) || target;
    const promptIdea = idea.trim().replace(/^@(character|lorebook|persona)\b\s*/i, '').trim();
    if (!promptIdea) {
      setError('Add your idea after @character, @persona, or @lorebook.');
      return;
    }
    setTarget(selectedTarget);
    const schemas: Record<Target,string> = {
      character: '{"spec":"chara_card_v2","spec_version":"2.0","data":{"name":"...","age":"...","description":"...","personality":"...","backstory":"...","scenario":"...","first_mes":"...","summary":"...","mes_example":"...","creator_notes":"Created with Pretty Little Fantasies","system_prompt":"","post_history_instructions":"","tags":["..."],"alternate_greetings":[],"extensions":{"height":"...","ethnicity":"...","appearance":"...","voiceDescription":"..."}}}',
      lorebook: '{"name":"...","description":"...","scan_depth":4,"token_budget":1500,"recursive_scanning":true,"entries":{"0":{"uid":0,"key":["..."],"keysecondary":[],"comment":"...","content":"...","constant":false,"selective":false,"insertion_order":100,"position":0,"enabled":true}}}',
      persona: '{"spec":"plf_persona_v1","name":"...","display_name":"...","occupation":"...","persona_description":"...","appearance":"...","backstory":"...","speaking_style":"...","traits":["..."]}',
    };
    setBusy(true); setError(''); setDraft(null);
    try {
      const result = await sendOpenRouterChatDetailed(config, [
        { role: 'system', content: 'You are a relaxed, practical creative partner for a roleplay app. Return only valid JSON matching the requested schema. Make original, internally consistent content with natural dialogue and specific details. When the idea is broad, add a few useful story hooks or distinctive options inside appropriate fields. Do not include markdown fences or commentary.' },
        { role: 'user', content: `Create one ${selectedTarget} for this idea: ${promptIdea}\nRequired JSON schema: ${schemas[selectedTarget]}\nFor characters, return a complete SillyTavern chara_card_v2 JSON wrapper with all roleplay fields inside data. For lorebooks, return SillyTavern World Info format with entries as an object keyed by entry id, with key arrays and content. For personas, return the PLF persona JSON object. Use strings for prose and arrays for lists. Include 3-6 useful specific ideas in creator_notes or appropriate fields when they fit.` },
      ]);
      setDraft(jsonFrom(result.content));
    } catch (e: any) { setError(e.message || 'Could not generate a draft. Check the OpenRouter setup and try again.'); }
    finally { setBusy(false); }
  };
  const save = () => {
    if (!draft) return;
    const body = draft.data && typeof draft.data === 'object' ? draft.data : draft;
    const now = new Date().toISOString();
    const id = `studio_${Date.now()}`;
    if (target === 'character') onSaveCharacter({
      ...body,
      id,
      name: String(body.name || 'New Character'),
      age: String(body.age || ''),
      avatar: String(body.avatar || '/colorpop_hero.jpg'),
      description: String(body.description || ''),
      personality: String(body.personality || ''),
      backstory: String(body.backstory || ''),
      scenario: String(body.scenario || idea),
      first_mes: String(body.first_mes || body.first_message || ''),
      summary: String(body.summary || body.short_description || ''),
      mes_example: String(body.mes_example || body.example_dialogue || ''),
      tags: Array.isArray(body.tags) ? body.tags.map(String) : ['AI Creator'],
      alternate_greetings: Array.isArray(body.alternate_greetings) ? body.alternate_greetings.map(String) : [],
      createdAt: now,
      updatedAt: now,
    });
    if (target === 'lorebook') {
      const rawEntries = body.entries || {};
      const entryList = Array.isArray(rawEntries) ? rawEntries : Object.values(rawEntries);
      onSaveLorebook({
        id,
        name: String(body.name || 'New Lorebook'),
        description: String(body.description || ''),
        scan_depth: Number(body.scan_depth || body.scanDepth || 4),
        token_budget: Number(body.token_budget || body.tokenBudget || 1500),
        recursive_scanning: Boolean(body.recursive_scanning ?? body.recursiveScanning ?? true),
        entries: entryList.map((entry: any, index: number) => ({
          id: String(entry.uid ?? entry.id ?? `${id}_entry_${index}`),
          keys: Array.isArray(entry.keys) ? entry.keys.map(String) : Array.isArray(entry.key) ? entry.key.map(String) : String(entry.key || '').split(',').map((key: string) => key.trim()).filter(Boolean),
          secondary_keys: Array.isArray(entry.secondary_keys) ? entry.secondary_keys.map(String) : Array.isArray(entry.keysecondary) ? entry.keysecondary.map(String) : [],
          comment: String(entry.comment || ''),
          content: String(entry.content || ''),
          constant: Boolean(entry.constant),
          selective: Boolean(entry.selective),
          insertion_order: Number(entry.insertion_order ?? entry.order ?? index),
          position: entry.position === 1 || entry.position === '1' || entry.position === 'after_char' ? 'after_char' as const : 'before_char' as const,
          enabled: entry.enabled !== false,
        })),
        createdAt: now,
        updatedAt: now,
      });
    }
    if (target === 'persona') onSavePersona({
      id,
      name: String(body.name || body.display_name || 'New Persona'),
      display_name: String(body.display_name || body.name || 'New Persona'),
      occupation: String(body.occupation || ''),
      avatar: String(body.avatar || '/colorpop_hero.jpg'),
      description: String(body.persona_description || body.description || ''),
      appearance: String(body.appearance || ''),
      backstory: String(body.backstory || ''),
      speaking_style: String(body.speaking_style || ''),
      traits: Array.isArray(body.traits) ? body.traits.map(String) : [],
      is_default: false,
      createdAt: now,
      updatedAt: now,
    });
    onClose();
    onSaved(target);
    setIdea('');
    setDraft(null);
  };
  const downloadJson = () => {
    if (!draft) return;
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `plf_${target}_${String(draft.data?.name || draft.name || 'draft').toLowerCase().replace(/[^a-z0-9]+/g, '_')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return <div className="fixed inset-0 z-[95] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-label="Story creator bot" className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#ff66b2]/50 bg-[#140410] p-5 text-white shadow-2xl">
      <header className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[#ff99cc]">Dedicated bot · Story Creator</p><h2 className="mt-1 text-xl font-bold">Create and save to your library</h2></div><button type="button" aria-label="Close creator" onClick={onClose} className="rounded-xl bg-white/10 p-2"><X className="h-4 w-4" /></button></header>
      <label className="mb-1 block text-xs font-semibold text-white/70">What should it create?</label>
      <select value={target} onChange={(e) => { setTarget(e.target.value as Target); setDraft(null); }} className="mb-3 w-full rounded-xl border border-white/15 bg-[#1e0818] p-3 text-sm text-white"><option value="character">Character</option><option value="lorebook">Lore / world guide</option><option value="persona">Persona</option></select>
      <label className="mb-1 block text-xs font-semibold text-white/70">Your idea</label>
      <p className="mb-2 text-[11px] text-white/55">Start with @character, @persona, or @lorebook to route it to that library.</p>
      <textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={3} placeholder="@character A guarded detective with a secret…" className="w-full rounded-xl border border-white/15 bg-[#1e0818] p-3 text-sm text-white placeholder:text-white/35" />
      <button type="button" disabled={!idea.trim() || busy} onClick={generate} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff007f] to-[#b12fa7] p-3 text-sm font-bold disabled:opacity-45">{busy ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</> : <><WandSparkles className="h-4 w-4" />Generate draft</>}</button>
      {error && <p role="alert" className="mt-3 rounded-xl bg-rose-950/70 p-3 text-sm text-rose-200">{error}</p>}
      {draft && <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4"><h3 className="font-bold">{draft.data?.name || draft.name || 'Generated draft'}</h3><p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-white/70">{JSON.stringify(draft, null, 2)}</p><div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2"><button type="button" onClick={downloadJson} className="rounded-xl border border-white/20 bg-white/10 p-3 text-sm font-bold">Download JSON file</button><button type="button" onClick={save} className="rounded-xl bg-emerald-600 p-3 text-sm font-bold">Save to {target === 'lorebook' ? 'Lorebooks' : target === 'character' ? 'Characters' : 'Personas'}</button></div></div>}
    </section>
  </div>;
}
