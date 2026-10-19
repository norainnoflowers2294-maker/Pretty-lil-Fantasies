import React, { useEffect, useState } from 'react';
import { Bot, Cake, ChevronRight, Compass, Sparkles, WandSparkles } from 'lucide-react';
import type { Character, Persona } from '../types/roleplay';

const prompts = [
  { title: 'The Last Train Home', scene: 'A storm strands everyone at a nearly empty station after midnight. One character recognizes a name on your ticket that should have been forgotten.', mood: 'Slow-burn mystery' },
  { title: 'A Table for Two', scene: 'A reservation is made under your name at the city’s most exclusive restaurant. The person waiting there claims you invited them years ago.', mood: 'Romance · secrets' },
  { title: 'The Unclaimed Key', scene: 'A brass key appears in your coat pocket with a room number and tonight’s date. Someone in the group knows exactly where it leads.', mood: 'Suspense' },
  { title: 'The Family Weekend', scene: 'A surprise invitation brings everyone to a beautiful lakeside estate. A missing portrait and a tense dinner threaten to expose an old promise.', mood: 'Drama · family' },
  { title: 'After Hours', scene: 'The elevator stops between floors during a citywide power outage. A familiar voice comes through the emergency speaker with an unexpected confession.', mood: 'Intimate · dramatic' },
  { title: 'The Perfect Alibi', scene: 'A glamorous launch party is interrupted by a security alert. Each guest has a reason to leave, and one person asks you to cover for them.', mood: 'Ensemble mystery' },
  { title: 'The Sunday Detour', scene: 'A wrong turn leads to a tiny coastal town where a character is greeted like a local. Nobody will explain why they have been here before.', mood: 'Cozy · discovery' },
];
function dayIndex(date: Date) { const key = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()); return Math.floor(key / 86400000) % prompts.length; }

interface Props {
  characters: Character[];
  personas: Persona[];
  onPlay: (characterIds: string[], personaId: string, prompt: string, title: string) => void;
  onStartBot: (kind: 'horoscope' | 'chatgpt') => void;
  onOpenCreator: () => void;
}
export function DailyPromptHub({ characters, personas, onPlay, onStartBot, onOpenCreator }: Props) {
  const [todayDate, setTodayDate] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setTodayDate(new Date()), 60_000); return () => window.clearInterval(timer); }, []);
  const prompt = prompts[dayIndex(todayDate)];
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(characters[0] ? [characters[0].id] : []);
  const [personaId, setPersonaId] = useState(personas.find((p) => p.is_default)?.id || personas[0]?.id || '');
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(todayDate);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const start = () => { if (!selected.length || !personaId) return; setOpen(false); onPlay(selected, personaId, prompt.scene, prompt.title); };

  const bots = [
    { id: 'horoscope', name: 'Horoscope Guide', desc: 'Daily signs & story vibes', icon: <Cake className="h-5 w-5" />, color: 'from-pink-100 to-rose-200' },
    { id: 'chatgpt', name: 'ChatGPT', desc: 'Ask, plan, brainstorm', icon: <Bot className="h-5 w-5" />, color: 'from-pink-100 to-rose-200' },
    { id: 'creator', name: 'Story Creator', desc: 'Make lore, characters & personas', icon: <WandSparkles className="h-5 w-5" />, color: 'from-pink-100 to-rose-200' },
  ];
  return <>
    <section className="mx-4 sm:mx-6 overflow-hidden rounded-3xl border border-white/90 bg-gradient-to-br from-[#fff7fa] via-[#ffe1ed] to-[#fff6fa] text-[#211019] shadow-[0_10px_28px_rgba(115,44,74,.14)]">
      <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-[#654552]"><Sparkles className="h-4 w-4" /> Daily prompt <span className="text-[#654552]/70">· {today}</span></p>
          <h2 className="mt-2 text-2xl font-black text-[#211019] sm:text-3xl">{prompt.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#33212a]">{prompt.scene}</p>
          <span className="mt-3 inline-flex rounded-full border border-[#d68eaa]/35 bg-white/75 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#211019]">{prompt.mood}</span>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/90 bg-gradient-to-r from-[#ffd5e5] via-[#f4aec9] to-[#ffe8f0] px-6 py-3 font-bold text-[#211019] shadow-[0_6px_16px_rgba(115,44,74,.14)] transition hover:brightness-105"><Compass className="h-4 w-4" />Play now<ChevronRight className="h-4 w-4" /></button>
      </div>
    </section>
    <section className="cp-dedicated-bots mx-4 sm:mx-6">
      <div className="mb-3 flex items-end justify-between"><div><h3 className="text-lg font-bold text-[#211019]">Your dedicated bots</h3><p className="text-xs text-[#543645]/85">Swipe to explore your story companions</p></div><span className="text-[10px] text-[#543645]/75">SCROLL →</span></div>
      <div className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {bots.map((bot) => <button type="button" key={bot.id} onClick={() => bot.id === 'creator' ? onOpenCreator() : onStartBot(bot.id as 'horoscope' | 'chatgpt')} className={`min-w-[245px] snap-start rounded-2xl border border-white/90 bg-gradient-to-br from-[#fffafd] via-[#ffe2ee] to-[#f7c8dc] p-4 text-left text-[#211019] shadow-[0_8px_20px_rgba(115,44,74,.13)] transition hover:-translate-y-0.5 hover:border-[#ff99cc]/60`}>
          <span className="mb-3 inline-flex rounded-xl border border-white/90 bg-white/80 p-2 text-[#211019]">{bot.icon}</span><span className="block font-bold">{bot.name}</span><span className="mt-1 block text-xs text-[#543645]/85">{bot.desc}</span>
        </button>)}
      </div>
    </section>
    {open && <div className="fixed inset-0 z-[90] grid place-items-center bg-[#4b2337]/25 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-label="Choose characters for today's prompt" className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/90 bg-gradient-to-br from-[#fffafd] to-[#ffe3ef] p-5 text-[#211019] shadow-2xl">
        <div className="mb-4 flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[#ff99cc]">Daily scene</p><h2 className="mt-1 text-xl font-bold">{prompt.title}</h2></div><button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-white/10 px-3 py-1 text-sm">Close</button></div>
        <p className="mb-4 text-sm leading-relaxed text-white/75">{prompt.scene}</p>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#ffd6eb]/70">Choose characters</label>
        <div className="max-h-48 space-y-2 overflow-y-auto">{characters.map((character) => <label key={character.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#d68eaa]/35 bg-white/75 p-3"><input type="checkbox" checked={selected.includes(character.id)} onChange={() => toggle(character.id)} className="accent-pink-500" /><img src={character.avatar || '/colorpop_hero.jpg'} alt="" className="h-9 w-9 rounded-full object-cover" /><span className="text-sm font-semibold">{character.name}</span></label>)}</div>
        {!characters.length && <p className="rounded-xl bg-white/75 p-3 text-sm text-[#543645]">Create a character first, then return to start today’s scene.</p>}
        <label className="mb-2 mt-4 block text-xs font-bold uppercase tracking-wider text-[#ffd6eb]/70">Play as persona</label>
        <select value={personaId} onChange={(e) => setPersonaId(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#1e0818] p-3 text-sm text-white">{personas.map((persona) => <option key={persona.id} value={persona.id}>{persona.display_name || persona.name}</option>)}</select>
        <button type="button" disabled={!selected.length || !personaId} onClick={start} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff007f] to-[#b12fa7] p-3 font-bold disabled:opacity-40"><Sparkles className="h-4 w-4" />Start this scene</button>
      </section>
    </div>}
    {selectedBot && <div className="fixed inset-0 z-[90] grid place-items-center bg-[#4b2337]/25 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedBot(null); }}>
      <section role="dialog" aria-modal="true" aria-label={selectedBot === 'horoscope' ? 'Daily horoscope' : 'Start ChatGPT bot'} className="w-full max-w-md rounded-3xl border border-white/90 bg-gradient-to-br from-[#fffafd] to-[#ffe3ef] p-5 text-[#211019] shadow-2xl">
        <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[#ff99cc]">Dedicated bot</p><h2 className="mt-1 text-xl font-bold">{selectedBot === 'horoscope' ? 'Horoscope Guide' : 'ChatGPT'}</h2></div><button type="button" onClick={() => setSelectedBot(null)} className="rounded-lg bg-white/10 px-3 py-1 text-sm">Close</button></div>
        {selectedBot === 'horoscope' ? <><p className="mt-4 text-sm leading-relaxed text-white/75">Ask for a sign-specific daily reading, relationship insight, or a horoscope-inspired story prompt. This guide treats astrology as reflection and entertainment.</p><button type="button" onClick={() => { setSelectedBot(null); onStartBot('horoscope'); }} className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#ffd5e5] to-[#f4aec9] p-3 text-sm font-bold text-[#211019]">Chat with Horoscope Guide</button></> : <><p className="mt-4 text-sm text-white/75">Open a dedicated assistant chat for planning, brainstorming, and questions.</p><button type="button" onClick={() => { setSelectedBot(null); onStartBot('chatgpt'); }} className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#ffd5e5] to-[#f4aec9] p-3 text-sm font-bold text-[#211019]">Start ChatGPT chat</button></>}
      </section>
    </div>}
  </>;
}
