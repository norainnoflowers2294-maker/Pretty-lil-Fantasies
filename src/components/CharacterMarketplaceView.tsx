import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, Search, ShoppingBag, Upload, UserPlus, Sparkles, Share2 } from 'lucide-react';
import type { Character } from '../types/roleplay';
import { parseCharacterFile, exportCharacterJson } from '../utils/pngParser';

const CATALOG_KEY = 'plf_character_marketplace_v1';
const readCatalog = (): Character[] => {
  try { const value = JSON.parse(localStorage.getItem(CATALOG_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
};

interface Props {
  characters: Character[];
  onInstall: (character: Character) => void;
  onBack: () => void;
}

export const CharacterMarketplaceView: React.FC<Props> = ({ characters, onInstall, onBack }) => {
  const [catalog, setCatalog] = useState<Character[]>(readCatalog);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const allListings = useMemo(() => {
    const byId = new Map<string, Character>();
    [...catalog, ...characters].forEach((character) => byId.set(character.id, character));
    return [...byId.values()].filter((character) => {
      const text = `${character.name} ${character.summary || ''} ${(character.tags || []).join(' ')} ${character.personality || ''}`.toLowerCase();
      return text.includes(query.trim().toLowerCase());
    });
  }, [catalog, characters, query]);

  const saveCatalog = (next: Character[]) => {
    setCatalog(next);
    try { localStorage.setItem(CATALOG_KEY, JSON.stringify(next)); } catch { setNotice('Could not save the local listing. Try a smaller character card.'); }
  };
  const listCharacter = (character: Character) => {
    if (catalog.some((item) => item.id === character.id)) { setNotice(`${character.name} is already listed on this device.`); return; }
    saveCatalog([character, ...catalog]);
    setNotice(`${character.name} is now in your marketplace catalog. Export the card to share it.`);
  };
  const importCard = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const parsed = await parseCharacterFile(file);
      const now = new Date().toISOString();
      const character = {
        ...parsed,
        id: crypto.randomUUID(),
        name: parsed.name || file.name.replace(/\.[^/.]+$/, ''),
        avatar: parsed.avatar || '',
        description: parsed.description || '',
        personality: parsed.personality || '',
        scenario: parsed.scenario || '',
        first_mes: parsed.first_mes || 'Hello!',
        summary: parsed.summary || '',
        mes_example: parsed.mes_example || '',
        tags: parsed.tags || [],
        createdAt: parsed.createdAt || now,
        updatedAt: now,
      } as Character;
      saveCatalog([character, ...catalog]);
      setNotice(`Imported ${character.name}. Add it to your character library when you’re ready.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not import that character card.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-10 text-white">
      <header className="mb-5 rounded-3xl border border-white/50 bg-[linear-gradient(145deg,rgba(255,255,255,.25),rgba(244,218,255,.13)_48%,rgba(255,221,244,.12)),rgba(30,15,42,.55)] p-5 shadow-[0_14px_45px_rgba(8,1,19,.28)] backdrop-blur-2xl">
        <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-2 text-xs text-white/75 hover:text-white"><ArrowLeft className="h-4 w-4" />Back</button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-pink-200" /><h1 className="text-2xl font-bold">Character Marketplace</h1></div><p className="mt-1 max-w-xl text-sm text-white/70">Browse saved cards, import community JSON or PNG cards, and export cards to share.</p></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/45 bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/25 disabled:opacity-50"><Upload className="h-4 w-4" />{busy ? 'Importing…' : 'Import card'}</button>

            <input ref={fileRef} type="file" accept=".json,.png,application/json,image/png" className="hidden" onChange={(event) => void importCard(event.target.files?.[0])} />
          </div>
        </div>
        <label className="mt-5 flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 py-2"><Search className="h-4 w-4 text-white/60" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, tags, and descriptions" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/55" /></label>
        {notice && <p role="status" className="mt-3 rounded-lg bg-pink-500/15 px-3 py-2 text-xs text-pink-100">{notice}</p>}
      </header>

      {allListings.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{allListings.map((character) => {
        const installed = characters.some((item) => item.id === character.id);
        const listed = catalog.some((item) => item.id === character.id);
        return (
          <article key={character.id} className="overflow-hidden rounded-2xl border border-white/35 bg-white/10 shadow-[0_10px_30px_rgba(8,1,19,.22)] backdrop-blur-xl">
            <div className="flex min-h-28 items-center gap-4 bg-gradient-to-r from-pink-400/15 to-violet-400/15 p-4">
              {character.avatar ? <img src={character.avatar} alt="" className="h-16 w-16 rounded-2xl border border-white/40 object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/40 bg-white/10"><Sparkles className="h-6 w-6 text-pink-200" /></div>}
              <div className="min-w-0"><h2 className="truncate text-lg font-bold">{character.name}</h2><p className="text-[11px] text-white/60">{character.age ? `Age ${character.age}` : 'Character card'}{character.ethnicity ? ` · ${character.ethnicity}` : ''}</p></div>
            </div>
            <div className="space-y-3 p-4">
              <p className="line-clamp-3 min-h-12 text-xs leading-relaxed text-white/75">{character.summary || character.personality || character.description || 'A character card ready to add to your library.'}</p>
              <div className="flex flex-wrap gap-1.5">{(character.tags || []).slice(0, 4).map((tag) => <span key={tag} className="rounded-full border border-white/25 bg-white/10 px-2 py-1 text-[10px] text-white/75">{tag}</span>)}</div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { onInstall(character); setNotice(`${character.name} added to your character library.`); }} disabled={installed} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-pink-500/80 px-3 py-2 text-xs font-bold disabled:bg-white/15 disabled:text-white/55"><UserPlus className="h-3.5 w-3.5" />{installed ? 'In your library' : 'Add to library'}</button>
            {characters.some((item) => item.id === character.id) && !listed && <button type="button" onClick={() => listCharacter(character)} className="rounded-xl border border-white/40 bg-white/10 px-3 py-2 text-xs font-semibold">List</button>}
                <button type="button" onClick={() => exportCharacterJson(character)} aria-label={`Export ${character.name} character card`} title="Export card to share" className="rounded-xl border border-white/40 bg-white/10 px-3 py-2"><Download className="h-4 w-4" /></button>
              </div>
              {listed && <p className="text-[10px] text-white/45">Saved in this device’s catalog · Export to share with others</p>}
            </div>
          </article>
        );
      })}</div> : <div className="rounded-3xl border border-dashed border-white/35 bg-white/5 p-10 text-center"><ShoppingBag className="mx-auto h-8 w-8 text-pink-200" /><h2 className="mt-3 font-semibold">No cards match yet</h2><p className="mt-1 text-sm text-white/65">Import a character JSON or PNG card, or add one from your character library.</p><button type="button" onClick={() => fileRef.current?.click()} className="mt-4 rounded-xl bg-pink-500/80 px-4 py-2 text-sm font-semibold">Import a card</button></div>}
    </section>
  );
};
