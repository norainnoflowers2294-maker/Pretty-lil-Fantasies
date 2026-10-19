import React, { useEffect, useState } from 'react';
import { Bot, Cake, ChevronRight, Compass, Sparkles, WandSparkles, UserRound, Contact, BookOpen, Feather, Pencil, MessageCircle, Shuffle } from 'lucide-react';
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
  recentChatTitle?: string;
  onOpenRecentChat: () => void;
  onOpenRandomCharacter: (character: Character) => void;
}
export function DailyPromptHub({ characters, personas, onPlay, onStartBot, onOpenCreator, onCreateCharacter, onCreatePersona, onCreateLorebook, recentChatTitle, onOpenRecentChat, onOpenRandomCharacter }: Props) {
  const [todayDate, setTodayDate] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setTodayDate(new Date()), 60_000); return () => window.clearInterval(timer); }, []);
  const dailyPrompt = prompts[dayIndex(todayDate)];
  const [customPrompt, setCustomPrompt] = useState<{ title: string; scene: string; mood: string } | null>(() => {
    try { const stored = localStorage.getItem('plf_dashboard_custom_prompt'); return stored ? JSON.parse(stored) : null; } catch { return null; }
  });
  const prompt = customPrompt || dailyPrompt;
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState(prompt);
  const [randomCharacterId, setRandomCharacterId] = useState<string | null>(() => {
    try { return sessionStorage.getItem('plf_random_character_id'); } catch { return null; }
  });
  const randomCharacter = characters.find(c => c.id === randomCharacterId) || characters[0];
  const shuffleCharacter = () => {
    if (!characters.length) return;
    const candidates = characters.filter(c => c.id !== randomCharacter?.id);
    const pool = candidates.length ? candidates : characters;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    setRandomCharacterId(chosen.id);
    try { sessionStorage.setItem('plf_random_character_id', chosen.id); } catch {}
  };
  const savePrompt = () => {
    const next = { title: draftPrompt.title.trim() || 'My prompt', scene: draftPrompt.scene.trim(), mood: draftPrompt.mood.trim() || 'Custom scene' };
    if (!next.scene) return;
    setCustomPrompt(next);
    try { localStorage.setItem('plf_dashboard_custom_prompt', JSON.stringify(next)); } catch {}
    setIsEditingPrompt(false);
  };
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
      <div className="flex items-center justify-between px-5 pt-4">
        <div><p className="text-sm font-bold">Your story carousel</p><p className="text-xs text-[#654552]">Swipe the cards to explore</p></div>
        <span className="text-xs text-[#654552]">Swipe →</span>
      </div>
      <div aria-label="Dashboard swipeable cards" className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain gap-3 p-4 sm:p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
        <article className="relative flex min-w-[85%] sm:min-w-[360px] max-w-[480px] snap-center flex-col justify-between rounded-[24px] border border-white bg-gradient-to-br from-white/85 via-[#ffe0f0] to-[#f9bfdf] p-5 shadow-md">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold text-[#654552]"><MessageCircle className="h-4 w-4" /> Most recent chat</p>
            <h2 className="mt-3 text-2xl font-bold">{recentChatTitle || 'Your next conversation'}</h2>
            <p className="mt-2 text-sm text-[#543645]">{recentChatTitle ? 'Pick up right where your story left off.' : 'Start a story and it will appear here.'}</p>
          </div>
          <button type="button" onClick={onOpenRecentChat} disabled={!recentChatTitle} className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#ff1493] px-5 font-bold text-white disabled:opacity-40">Continue chat <ChevronRight className="h-4 w-4" /></button>
        </article>
        <article className="relative flex min-w-[85%] sm:min-w-[360px] max-w-[480px] snap-center flex-col justify-between rounded-[24px] border border-white bg-gradient-to-br from-[#fffafd] via-[#ffe1ed] to-[#e4d7ff] p-5 shadow-md">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold text-[#654552]"><Pencil className="h-4 w-4" /> Edit your prompt</p>
            <h2 className="mt-3 text-2xl font-bold">{prompt.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm text-[#543645]">{prompt.scene}</p>
          </div>
          <div className="mt-5 flex gap-2">
            <button type="button" onClick={() => { setDraftPrompt({ ...prompt }); setIsEditingPrompt(true); }} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#ff1493] px-4 font-bold text-white"><Pencil className="h-4 w-4" /> Edit prompt</button>
            <button type="button" onClick={() => setOpen(true)} className="min-h-11 rounded-full border border-[#ff1493]/40 bg-white/80 px-4 font-bold">Play</button>
          </div>
        </article>
        <article className="relative flex min-w-[85%] sm:min-w-[360px] max-w-[480px] snap-center flex-col justify-between rounded-[24px] border border-white bg-gradient-to-br from-[#fffafd] via-[#ffd9eb] to-[#d7f2ee] p-5 shadow-md">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold text-[#654552]"><Shuffle className="h-4 w-4" /> Random character</p>
            <div className="mt-3 flex items-center gap-3">{randomCharacter?.avatar && <img src={randomCharacter.avatar} alt="" className="h-16 w-16 rounded-full border-2 border-white object-cover shadow" />}<h2 className="text-2xl font-bold">{randomCharacter?.name || 'Find a character'}</h2></div>
            <p className="mt-2 text-sm text-[#543645]">Discover someone from your character library.</p>
          </div>
          <div className="mt-5 flex gap-2">
            <button type="button" onClick={shuffleCharacter} disabled={!characters.length} className="min-h-11 rounded-full border border-[#ff1493]/40 bg-white/80 px-4 font-bold disabled:opacity-40"><Shuffle className="inline h-4 w-4" /> Shuffle</button>
            <button type="button" onClick={() => randomCharacter && onOpenRandomCharacter(randomCharacter)} disabled={!randomCharacter} className="min-h-11 flex-1 rounded-full bg-[#ff1493] px-4 font-bold text-white disabled:opacity-40">Chat now</button>
          </div>
        </article>
      </div>
    </section>
    {isEditingPrompt && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <section role="dialog" aria-modal="true" aria-label="Edit your prompt" className="w-full max-w-lg rounded-3xl border border-[#ff1493]/40 bg-[#fff6fa] p-5 text-[#211019] shadow-2xl">
        <h2 className="text-xl font-bold">Edit your prompt</h2>
        <label className="mt-4 block text-sm font-semibold">Title<input value={draftPrompt.title} onChange={e => setDraftPrompt({ ...draftPrompt, title: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e89aba] bg-white p-3 text-black" /></label>
        <label className="mt-3 block text-sm font-semibold">Story prompt<textarea rows={6} value={draftPrompt.scene} onChange={e => setDraftPrompt({ ...draftPrompt, scene: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e89aba] bg-white p-3 text-black" /></label>
        <label className="mt-3 block text-sm font-semibold">Mood<input value={draftPrompt.mood} onChange={e => setDraftPrompt({ ...draftPrompt, mood: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e89aba] bg-white p-3 text-black" /></label>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => setIsEditingPrompt(false)} className="rounded-full border border-[#e89aba] px-5 py-3 font-semibold">Cancel</button>
          <button type="button" onClick={() => { setCustomPrompt(null); try { localStorage.removeItem('plf_dashboard_custom_prompt'); } catch {} setIsEditingPrompt(false); }} className="rounded-full border border-[#e89aba] px-5 py-3 font-semibold">Daily default</button>
          <button type="button" disabled={!draftPrompt.scene.trim()} onClick={savePrompt} className="ml-auto rounded-full bg-[#ff1493] px-5 py-3 font-bold text-white disabled:opacity-40">Save prompt</button>
        </div>
      </section>
    </div>}
    <section aria-label="Create something new" className="plf-create-something relative mx-4 sm:mx-6 overflow-hidden rounded-[26px] border border-white/90 p-4 text-[#130810] shadow-[0_10px_28px_rgba(115,44,74,.18)] backdrop-blur-xl">
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
        ].map((item) => <button key={item.label} type="button" onClick={item.action} className="plf-create-shortcut group relative flex min-w-[112px] snap-start flex-col items-center gap-2 overflow-hidden rounded-2xl border border-white/95 px-3 py-3 text-center text-[#130810] shadow-[inset_0_1px_5px_rgba(255,255,255,.95),0_5px_12px_rgba(115,44,74,.15)] transition hover:-translate-y-0.5 hover:shadow-[inset_0_1px_8px_white,0_8px_16px_rgba(200,75,140,.23)] active:scale-[.98]">
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
