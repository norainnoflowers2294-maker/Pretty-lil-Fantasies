import React, { useEffect, useState } from 'react';
import { Bot, Cake, ChevronRight, Compass, Sparkles, WandSparkles, UserRound, Contact, BookOpen, Feather } from 'lucide-react';
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
  onCreateCharacter: () => void;
  onCreatePersona: () => void;
  onCreateLorebook: () => void;
}
export function DailyPromptHub({ characters, personas, onPlay, onStartBot, onOpenCreator, onCreateCharacter, onCreatePersona, onCreateLorebook }: Props) {
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
    <section aria-label="Create something new" className="relative mx-4 sm:mx-6 overflow-hidden rounded-[26px] border border-white/90 bg-gradient-to-br from-white/85 via-[#ffe1ed]/90 to-[#f4d8ff]/80 p-4 text-[#1d1017] shadow-[0_10px_28px_rgba(115,44,74,.14)] backdrop-blur-xl">
      <span aria-hidden="true" className="pointer-events-none absolute -right-1 top-1 text-3xl text-[#e5a9c2]/45">✿</span>
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1 text-lg text-[#e5a9c2]/35">✿</span>
      <div className="relative z-[1] mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full border border-white/90 bg-gradient-to-br from-[#fffafd] to-[#ffd5e5] text-[#211019] shadow-[inset_0_1px_5px_white,0_3px_8px_rgba(115,44,74,.13)]"><Sparkles className="h-4 w-4" /></span>
        <div><h3 className="text-sm font-extrabold">Create Something New</h3><p className="text-[11px] text-[#543645]/80">Swipe to choose your next idea</p></div>
        <span aria-hidden="true" className="ml-auto text-[10px] font-semibold text-[#543645]/75">SWIPE →</span>
      </div>
      <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { label: 'Character', icon: <UserRound className="h-5 w-5" />, action: onCreateCharacter },
          { label: 'Persona', icon: <Contact className="h-5 w-5" />, action: onCreatePersona },
          { label: 'Lorebook', icon: <BookOpen className="h-5 w-5" />, action: onCreateLorebook },
          { label: 'New Story', icon: <Feather className="h-5 w-5" />, action: () => setOpen(true) },
        ].map((item) => <button key={item.label} type="button" onClick={item.action} className="group relative flex min-w-[112px] snap-start flex-col items-center gap-2 overflow-hidden rounded-2xl border border-white/95 bg-gradient-to-br from-[#fffafd] via-[#ffe6f0] to-[#eadfff] px-3 py-3 text-center text-[#211019] shadow-[inset_0_1px_5px_rgba(255,255,255,.95),0_5px_12px_rgba(115,44,74,.12)] transition hover:-translate-y-0.5 hover:shadow-[inset_0_1px_8px_white,0_8px_16px_rgba(200,75,140,.2)] active:scale-[.98]">
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/70 via-white/20 to-transparent" />
            <span className="relative grid h-10 w-10 place-items-center rounded-full border border-white bg-gradient-to-br from-white/90 to-[#ffd8ea] text-[#211019] shadow-[inset_0_1px_5px_white,0_3px_8px_rgba(115,44,74,.13)]">{item.icon}</span>
            <span className="relative text-xs font-bold">{item.label}</span>
          </button>)}
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
