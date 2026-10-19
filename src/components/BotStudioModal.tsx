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
      character: '{"name":"...","age":"...","description":"...","personality":"...","backstory":"...","scenario":"...","first_mes":"...","summary":"...","mes_example":"...","tags":["..."]}',
      lorebook: '{"name":"...","description":"...","entries":[{"keys":["..."],"content":"..."}]}',
      persona: '{"name":"...","display_name":"...","occupation":"...","description":"...","appearance":"...","backstory":"...","speaking_style":"...","traits":["..."]}',
    };
    setBusy(true); setError(''); setDraft(null);
    try {
      const result = await sendOpenRouterChatDetailed(config, [
        { role: 'system', content: 'You are a creative writing studio for a roleplay app. Return only valid JSON matching the requested schema. Make original, internally consistent content. Do not include markdown fences.' },
        { role: 'user', content: `Create one ${selectedTarget} for this idea: ${promptIdea}\nRequired JSON schema: ${schemas[selectedTarget]}\nKeep every value as a string except arrays. For a lorebook, entries must include keys and content.` },
      ]);
      setDraft(jsonFrom(result.content));
    } catch (e: any) { setError(e.message || 'Could not generate a draft. Check the OpenRouter setup and try again.'); }
    finally { setBusy(false); }
  };
  const save = () => {
    if (!draft) return;
    const now = new Date().toISOString(); const id = `studio_${Date.now()}`;
    if (target === 'character') onSaveCharacter({
      id, name: String(draft.name || 'New Character'), age: String(draft.age || ''), avatar: '/colorpop_hero.jpg',
      description: String(draft.description || ''), personality: String(draft.personality || ''), backstory: String(draft.backstory || ''),
      scenario: String(draft.scenario || idea), first_mes: String(draft.first_mes || ''), summary: String(draft.summary || ''),
      mes_example: String(draft.mes_example || ''), tags: Array.isArray(draft.tags) ? draft.tags.map(String) : ['AI Creator'],
      createdAt: now, updatedAt: now,
    });
    if (target === 'lorebook') onSaveLorebook({
      id, name: String(draft.name || 'New Lorebook'), description: String(draft.description || ''),
      scan_depth: 4, token_budget: 900, recursive_scanning: true,
      entries: Array.isArray(draft.entries) ? draft.entries.map((entry: any, index: number) => ({ id: `${id}_entry_${index}`, keys: Array.isArray(entry.keys) ? entry.keys.map(String) : [], content: String(entry.content || ''), constant: false, selective: false, insertion_order: index, position: 'before_char' as const, enabled: true })) : [],
      createdAt: now, updatedAt: now,
    });
    if (target === 'persona') onSavePersona({
      id, name: String(draft.name || 'New Persona'), display_name: String(draft.display_name || draft.name || 'New Persona'),
      occupation: String(draft.occupation || ''), avatar: '/colorpop_hero.jpg', description: String(draft.description || ''),
      appearance: String(draft.appearance || ''), backstory: String(draft.backstory || ''), speaking_style: String(draft.speaking_style || ''),
      traits: Array.isArray(draft.traits) ? draft.traits.map(String) : [], is_default: false, createdAt: now, updatedAt: now,
    });
    onClose(); onSaved(target); setIdea(''); setDraft(null);
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
      {draft && <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4"><h3 className="font-bold">{draft.name || 'Generated draft'}</h3><p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-white/70">{JSON.stringify(draft, null, 2)}</p><button type="button" onClick={save} className="mt-4 w-full rounded-xl bg-emerald-600 p-3 text-sm font-bold">Save to {target === 'lorebook' ? 'Lorebooks' : target === 'character' ? 'Characters' : 'Personas'}</button></div>}
    </section>
  </div>;
}
