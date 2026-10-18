import React, { useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3, GitBranch, Heart, Pencil, Plus, Rotate3D, Save, Search, Trash2, Users, X } from 'lucide-react';
import type { Character, Chat, StoryMemory, StoryMemoryCategory, StoryMemoryPerson } from '../types/roleplay';

interface Props {
  memories: StoryMemory[];
  characters: Character[];
  chats: Chat[];
  onSaveMemory: (memory: StoryMemory) => void;
  onDeleteMemory: (id: string) => void;
  onOpenChat: (chatId: string) => void;
  onBack: () => void;
}

type Contact = StoryMemoryPerson & { subtitle: string; avatar?: string };
const categoryOptions: Array<{ id: StoryMemoryCategory; label: string }> = [
  { id: 'memory', label: 'Memory' }, { id: 'friendship', label: 'Friendship' }, { id: 'family', label: 'Family' },
  { id: 'relationship', label: 'Relationship' }, { id: 'milestone', label: 'Milestone' }, { id: 'place', label: 'Place' },
];
const localDate = (value?: string) => {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const StoryMemoryMapView: React.FC<Props> = ({ memories, characters, chats, onSaveMemory, onDeleteMemory, onOpenChat, onBack }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | StoryMemoryCategory>('all');
  const [query, setQuery] = useState('');
  const [angle, setAngle] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [eventDate, setEventDate] = useState(localDate());
  const [category, setCategory] = useState<StoryMemoryCategory>('memory');
  const [chatId, setChatId] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<StoryMemoryPerson[]>([]);
  const [notice, setNotice] = useState('');

  const contacts = useMemo<Contact[]>(() => {
    const list: Contact[] = [];
    characters.forEach((character) => {
      const tags = (character.tags || []).join(' ').toLowerCase();
      const relationship: StoryMemoryPerson['relationship'] = /family|sister|brother|mother|father|cousin|uncle|aunt/.test(tags) ? 'family' : /friend/.test(tags) ? 'friend' : 'character';
      list.push({ id: `character:${character.id}`, characterId: character.id, name: character.name, relationship, subtitle: relationship === 'character' ? 'Character' : relationship, avatar: character.avatar });
      (character.familyMembers || []).forEach((member) => {
        list.push({ id: `family:${character.id}:${member.id}`, characterId: member.characterId || character.id, name: member.name, relationship: 'family', subtitle: `${member.relationship} · ${character.name}'s family` });
      });
    });
    return list;
  }, [characters]);

  const visibleMemories = useMemo(() => memories
    .filter((memory) => !memory.deletedAt)
    .filter((memory) => activeFilter === 'all' || (memory.category || 'memory') === activeFilter)
    .filter((memory) => `${memory.title} ${memory.content} ${(memory.people || []).map((person) => person.name).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => Date.parse(a.storyDate || a.createdAt) - Date.parse(b.storyDate || b.createdAt)), [memories, activeFilter, query]);
  const selectedMemory = memories.find((memory) => memory.id === selectedId && !memory.deletedAt) || null;
  const peopleInMemories = useMemo(() => {
    const linked = new Map<string, StoryMemoryPerson>();
    visibleMemories.forEach((memory) => (memory.people || []).forEach((person) => linked.set(person.id, person)));
    return contacts.filter((person) => linked.has(person.id)).map((person) => ({ ...person, ...linked.get(person.id) }));
  }, [visibleMemories, contacts]);

  const beginNew = () => {
    setSelectedId(null); setTitle(''); setContent(''); setEventDate(localDate()); setCategory('memory'); setChatId(''); setSelectedPeople([]); setEditing(true);
  };
  const beginEdit = (memory: StoryMemory) => {
    setSelectedId(memory.id); setTitle(memory.title); setContent(memory.content); setEventDate(localDate(memory.storyDate || memory.createdAt));
    setCategory(memory.category || 'memory'); setChatId(memory.chatId || ''); setSelectedPeople(memory.people || []); setEditing(true);
  };
  const save = () => {
    if (!title.trim() || !content.trim()) { setNotice('Add a title and memory details first.'); return; }
    const previous = memories.find((memory) => memory.id === selectedId);
    const now = new Date().toISOString();
    const saved: StoryMemory = {
      ...(previous || {} as StoryMemory),
      id: previous?.id || `memory_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(), content: content.trim(), type: previous?.type || 'note',
      storyDate: eventDate, category, people: selectedPeople, chatId: chatId || undefined,
      createdAt: previous?.createdAt || now, updatedAt: now,
    };
    onSaveMemory(saved); setSelectedId(saved.id); setEditing(false); setNotice('Memory saved to your timeline.');
  };
  const togglePerson = (person: Contact) => {
    setSelectedPeople((current) => current.some((item) => item.id === person.id)
      ? current.filter((item) => item.id !== person.id)
      : [...current, { id: person.id, name: person.name, relationship: person.relationship, characterId: person.characterId }]);
  };
  const formatDate = (value?: string) => {
    const date = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value || '');
    return Number.isNaN(date.getTime()) ? 'Date not set' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 pb-10 text-white">
      <header className="rounded-3xl border border-white/45 bg-[linear-gradient(145deg,rgba(255,255,255,.24),rgba(244,218,255,.13)_48%,rgba(255,221,244,.12)),rgba(30,15,42,.55)] p-5 shadow-[0_14px_45px_rgba(8,1,19,.28)] backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" />Back</button>
          <button type="button" onClick={beginNew} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500/85 to-violet-500/75 px-3.5 py-2.5 text-sm font-bold shadow-[0_0_20px_rgba(242,10,168,.24)]"><Plus className="h-4 w-4" />Add memory</button>
        </div>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="flex items-center gap-2"><Rotate3D className="h-6 w-6 text-pink-200" /><h1 className="text-2xl font-bold">3D Memory Timeline</h1></div><p className="mt-1 max-w-2xl text-sm text-white/70">Connect moments to the friends, family, and characters who were part of them.</p></div>
          <label className="flex min-w-56 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 py-2"><Search className="h-4 w-4 text-white/60" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search memories or people" className="w-full bg-transparent text-sm outline-none placeholder:text-white/50" /></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['all', ...categoryOptions.map((item) => item.id)] as Array<'all' | StoryMemoryCategory>).map((item) => <button key={item} type="button" onClick={() => setActiveFilter(item)} className={`rounded-full border px-3 py-1.5 text-xs capitalize ${activeFilter === item ? 'border-white/80 bg-pink-500/55 text-white' : 'border-white/25 bg-white/10 text-white/70'}`}>{item === 'all' ? 'All moments' : item}</button>)}
        </div>
      </header>

      <section className="rounded-3xl border border-white/35 bg-white/[0.08] p-4 shadow-[0_12px_40px_rgba(8,1,19,.2)] backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-pink-200" /><h2 className="text-sm font-bold">Story events</h2><span className="text-xs text-white/50">{visibleMemories.length} saved</span></div>
          <label className="flex items-center gap-2 text-[11px] text-white/65">3D angle <input type="range" min="-24" max="24" value={angle} onChange={(event) => setAngle(Number(event.target.value))} className="w-28 accent-pink-400" /></label>
        </div>
        {visibleMemories.length ? <div className="overflow-x-auto px-2 pb-5 pt-3 [perspective:1100px]">
          <div className="flex min-w-max items-stretch gap-4 transition-transform duration-300" style={{ transform: `rotateY(${angle}deg)`, transformStyle: 'preserve-3d' }}>
            {visibleMemories.map((memory, index) => {
              const selected = selectedId === memory.id;
              const people = memory.people || [];
              return <button key={memory.id} type="button" onClick={() => { setSelectedId(memory.id); setEditing(false); }} style={{ transform: `translateZ(${index % 2 ? 26 : 0}px) rotateX(${index % 2 ? -2 : 2}deg)`, transformStyle: 'preserve-3d' }}
                className={`relative w-64 shrink-0 rounded-2xl border p-4 text-left transition duration-300 hover:-translate-y-1 ${selected ? 'border-pink-200/80 bg-pink-400/20 shadow-[0_0_24px_rgba(242,10,168,.24)]' : 'border-white/30 bg-white/10 shadow-[0_10px_24px_rgba(8,1,19,.2)]'}`}>
                <span className="absolute -top-3 left-5 grid h-6 w-6 place-items-center rounded-full border border-white/70 bg-gradient-to-br from-pink-300 to-violet-400 text-[10px] font-bold text-white shadow-[0_0_16px_rgba(242,10,168,.5)]">{index + 1}</span>
                <span className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-pink-100/75"><CalendarDays className="h-3 w-3" />{formatDate(memory.storyDate || memory.createdAt)}</span>
                <span className="mt-2 block truncate text-sm font-bold">{memory.title}</span>
                <span className="mt-1 block h-10 overflow-hidden text-xs leading-relaxed text-white/65">{memory.content}</span>
                <span className="mt-3 flex flex-wrap gap-1">{people.slice(0, 3).map((person) => <span key={person.id} className="rounded-full border border-white/25 bg-white/10 px-2 py-1 text-[9px] text-white/75">{person.name}</span>)}{people.length > 3 && <span className="text-[9px] text-white/55">+{people.length - 3}</span>}</span>
                <span className="mt-3 block text-[10px] capitalize text-white/45">{memory.category || memory.type}</span>
              </button>;
            })}
          </div>
          <div className="mx-3 mt-2 h-1 rounded-full bg-gradient-to-r from-pink-300/80 via-violet-300/60 to-pink-300/80 shadow-[0_0_16px_rgba(242,10,168,.4)]" />
        </div> : <div className="rounded-2xl border border-dashed border-white/25 bg-white/5 p-8 text-center"><Clock3 className="mx-auto h-7 w-7 text-pink-200/70" /><p className="mt-2 text-sm font-semibold">Your timeline is ready</p><p className="mt-1 text-xs text-white/60">Add a memory and link the people who were there.</p></div>}

        {selectedMemory && !editing && <article className="mt-5 rounded-2xl border border-white/35 bg-white/10 p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-widest text-pink-100/70">{selectedMemory.category || selectedMemory.type} · {formatDate(selectedMemory.storyDate || selectedMemory.createdAt)}</p><h3 className="mt-1 text-lg font-bold">{selectedMemory.title}</h3></div><div className="flex gap-1"><button type="button" onClick={() => beginEdit(selectedMemory)} aria-label="Edit memory" className="rounded-lg border border-white/25 bg-white/10 p-2"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => { onDeleteMemory(selectedMemory.id); setSelectedId(null); }} aria-label="Delete memory" className="rounded-lg border border-white/25 bg-white/10 p-2 text-rose-200"><Trash2 className="h-4 w-4" /></button><button type="button" onClick={() => setSelectedId(null)} aria-label="Close memory details" className="rounded-lg border border-white/25 bg-white/10 p-2"><X className="h-4 w-4" /></button></div></div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/80">{selectedMemory.content}</p>
          {!!selectedMemory.people?.length && <div className="mt-4 flex flex-wrap gap-2"><Users className="h-4 w-4 text-pink-200" />{selectedMemory.people.map((person) => <span key={person.id} className="rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-xs">{person.name} <span className="text-white/55">· {person.relationship}</span></span>)}</div>}
          {selectedMemory.chatId && chats.some((chat) => chat.id === selectedMemory.chatId) && <button type="button" onClick={() => onOpenChat(selectedMemory.chatId!)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-xs"><GitBranch className="h-3.5 w-3.5" />Open linked chat</button>}
        </article>}

        {editing && <section className="mt-5 rounded-2xl border border-pink-200/45 bg-white/10 p-4">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">{selectedId ? 'Edit memory' : 'New timeline memory'}</h3><button type="button" onClick={() => setEditing(false)} aria-label="Close editor" className="rounded-lg p-1.5 text-white/60"><X className="h-4 w-4" /></button></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-white/70">Title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder="What happened?" className="mt-1 w-full rounded-xl border border-white/30 bg-black/15 px-3 py-2 text-sm text-white placeholder:text-white/45" /></label>
            <label className="text-xs text-white/70">Story date<input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="mt-1 w-full rounded-xl border border-white/30 bg-black/15 px-3 py-2 text-sm text-white" /></label>
            <label className="text-xs text-white/70">Kind of moment<select value={category} onChange={(event) => setCategory(event.target.value as StoryMemoryCategory)} className="mt-1 w-full rounded-xl border border-white/30 bg-[#21152e] px-3 py-2 text-sm text-white">{categoryOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label className="text-xs text-white/70">Link a chat (optional)<select value={chatId} onChange={(event) => setChatId(event.target.value)} className="mt-1 w-full rounded-xl border border-white/30 bg-[#21152e] px-3 py-2 text-sm text-white"><option value="">No linked chat</option>{chats.map((chat) => <option key={chat.id} value={chat.id}>{chat.title || 'Untitled chat'}</option>)}</select></label>
          </div>
          <label className="mt-3 block text-xs text-white/70">Memory details<textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={5000} rows={4} placeholder="Describe what happened and why it matters…" className="mt-1 w-full resize-y rounded-xl border border-white/30 bg-black/15 px-3 py-2 text-sm text-white placeholder:text-white/45" /></label>
          <div className="mt-4"><p className="mb-2 text-xs font-semibold text-white/75">Who was part of it?</p>{contacts.length ? <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">{contacts.map((person) => {
            const isOn = selectedPeople.some((item) => item.id === person.id);
            return <button type="button" key={person.id} onClick={() => togglePerson(person)} aria-pressed={isOn} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs ${isOn ? 'border-pink-200/80 bg-pink-500/40' : 'border-white/25 bg-white/10 text-white/70'}`}>{person.avatar && <img src={person.avatar} alt="" className="h-4 w-4 rounded-full object-cover" />}{person.name}<span className="text-[9px] opacity-70">{person.subtitle}</span></button>;
          })}</div> : <p className="text-xs text-white/55">Create a character or add relatives in a character profile first.</p>}
            {!!selectedPeople.length && <div className="mt-3 flex flex-wrap gap-2">{selectedPeople.map((person) => <label key={person.id} className="flex items-center gap-2 rounded-xl border border-white/25 bg-black/10 px-2.5 py-2 text-xs"><span>{person.name}</span><select aria-label={`${person.name} relationship`} value={person.relationship} onChange={(event) => setSelectedPeople((current) => current.map((item) => item.id === person.id ? { ...item, relationship: event.target.value as StoryMemoryPerson['relationship'] } : item))} className="rounded-lg bg-[#21152e] px-2 py-1 text-[10px] text-white"><option value="friend">Friend</option><option value="family">Family</option><option value="character">Character</option></select></label>)}</div>}
          </div>
          <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs">Cancel</button><button type="button" onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-pink-500/85 px-4 py-2 text-xs font-bold"><Save className="h-3.5 w-3.5" />Save memory</button></div>
          {notice && <p role="status" className="mt-3 text-xs text-pink-100">{notice}</p>}
        </section>}
      </section>

      <section className="rounded-3xl border border-white/30 bg-white/[0.07] p-4 backdrop-blur-xl sm:p-5">
        <div className="mb-3 flex items-center gap-2"><Heart className="h-4 w-4 text-pink-200" /><h2 className="text-sm font-bold">Friends &amp; family in this story</h2><span className="text-xs text-white/50">{peopleInMemories.length} connected</span></div>
        {peopleInMemories.length ? <div className="flex flex-wrap gap-2">{peopleInMemories.map((person) => <span key={person.id} className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-2 text-xs">{person.avatar && <img src={person.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />}{person.name}<span className="text-white/50">· {person.relationship}</span></span>)}</div> : <p className="text-xs text-white/55">Tag friends, family members, or characters in a memory to build this people map.</p>}
      </section>
      {notice && !editing && <p role="status" className="text-center text-xs text-pink-100">{notice}</p>}
    </main>
  );
};
