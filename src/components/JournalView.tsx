import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, Cloud, FilePlus2, Flower2, ImagePlus, LoaderCircle, NotebookPen, Palette, Plus, Sparkles, Trash2, Type, X } from 'lucide-react';
import type { JournalPage, JournalPaper, JournalSection } from '../types/journal';
import { signInWithGoogleDrive } from '../lib/firebase';
import { saveJournalToGoogleDrive } from '../utils/googleDriveBackup';

interface JournalViewProps {
  pages: JournalPage[];
  onChangePages: (pages: JournalPage[]) => void;
}

const sections: Array<{ id: JournalSection; label: string; icon: React.ReactNode; helper: string }> = [
  { id: 'prompts', label: 'Prompts', icon: <Sparkles className="h-4 w-4" />, helper: 'Save prompts and jump back in whenever inspiration hits.' },
  { id: 'ideas', label: 'Ideas', icon: <Flower2 className="h-4 w-4" />, helper: 'Collect scenes, characters, details, and little sparks.' },
  { id: 'diary', label: 'Diary', icon: <NotebookPen className="h-4 w-4" />, helper: 'A private place to write about your day.' },
];
const papers: Array<{ id: JournalPaper; label: string }> = [
  { id: 'graph', label: 'Graph paper' },
  { id: 'floral', label: 'Floral paper' },
  { id: 'lined', label: 'Lined paper' },
  { id: 'plain', label: 'Plain paper' },
];
const stickerChoices = ['💗', '🖤', '✨', '🌸', '🦋', '🎀', '🕯️', '🍒', '💌', '📎'];

function makePage(section: JournalSection, paper: JournalPaper = 'lined'): JournalPage {
  const labels: Record<JournalSection, string> = { prompts: 'Untitled prompt', ideas: 'New idea', diary: 'A page from today' };
  return { id: `journal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, section, title: labels[section], paper, body: '', stickers: [], images: [], updatedAt: new Date().toISOString() };
}

const sectionLabel = (section: JournalSection) => sections.find((item) => item.id === section)?.label || 'Journal';

export const JournalView: React.FC<JournalViewProps> = ({ pages, onChangePages }) => {
  const [section, setSection] = useState<JournalSection>('prompts');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<JournalPage | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveStatus, setDriveStatus] = useState<'off' | 'connecting' | 'saving' | 'saved' | 'error'>('off');
  const [driveMessage, setDriveMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [fontSize, setFontSize] = useState(17);
  const [inkColor, setInkColor] = useState('#47152d');
  const fileRef = useRef<HTMLInputElement>(null);
  const skipDriveEffect = useRef(true);

  const sectionPages = useMemo(() => pages.filter((page) => page.section === section).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [pages, section]);
  const selected = sectionPages.find((page) => page.id === selectedId) || sectionPages[0] || null;
  const currentSection = sections.find((item) => item.id === section)!;

  useEffect(() => {
    if (selected) {
      setSelectedId(selected.id);
      setDraft(selected);
    } else {
      const fresh = makePage(section);
      setSelectedId(fresh.id);
      setDraft(fresh);
      onChangePages([...pages, fresh]);
    }
    // Create a starter page when a section is first opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  useEffect(() => {
    if (!selected) return;
    setDraft((current) => current?.id === selected.id ? current : selected);
  }, [selected?.id]);

  useEffect(() => {
    if (!draft) return;
    const timer = window.setTimeout(() => {
      const updated = { ...draft, updatedAt: new Date().toISOString() };
      onChangePages(pages.some((page) => page.id === updated.id)
        ? pages.map((page) => page.id === updated.id ? updated : page)
        : [updated, ...pages]);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    if (!driveToken || !draft || skipDriveEffect.current) return;
    const timer = window.setTimeout(async () => {
      setDriveStatus('saving');
      try {
        const journal = pages.map((page) => page.id === draft.id ? draft : page);
        const file = await saveJournalToGoogleDrive(journal, driveToken);
        setDriveStatus('saved');
        setDriveMessage(file.webViewLink ? 'Saved to your Google Drive journal file.' : 'Journal backup saved to Google Drive.');
      } catch (error) {
        setDriveStatus('error');
        setDriveMessage(error instanceof Error ? error.message : 'Google Drive could not save your journal.');
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [pages, draft, driveToken]);

  const addPage = (nextSection: JournalSection = section) => {
    const fresh = makePage(nextSection);
    onChangePages([fresh, ...pages]);
    setSection(nextSection);
    setSelectedId(fresh.id);
    setDraft(fresh);
  };

  const updateDraft = (patch: Partial<JournalPage>) => setDraft((current) => current ? { ...current, ...patch } : current);
  const selectSection = (next: JournalSection) => {
    setSection(next);
    setSelectedId(pages.find((page) => page.section === next)?.id || null);
  };
  const selectPage = (page: JournalPage) => { setSelectedId(page.id); setDraft(page); };
  const changePaper = (paper: JournalPaper) => updateDraft({ paper });

  const connectDrive = async () => {
    setDriveStatus('connecting');
    setDriveMessage('Choose the Google account where you want your journal saved.');
    try {
      const { accessToken } = await signInWithGoogleDrive();
      setDriveToken(accessToken);
      setDriveStatus('saving');
      const file = await saveJournalToGoogleDrive(pages, accessToken);
      setDriveStatus('saved');
      setDriveMessage(file.webViewLink ? 'Connected. Your journal is saved in Google Drive.' : 'Connected. Your journal is saved in the PLF Backups folder.');
      skipDriveEffect.current = false;
    } catch (error) {
      setDriveStatus('error');
      setDriveMessage(error instanceof Error ? error.message : 'Google Drive could not connect.');
    }
  };

  const deletePage = () => {
    if (!draft || !window.confirm('Delete this journal page? This cannot be undone.')) return;
    const remaining = pages.filter((page) => page.id !== draft.id);
    onChangePages(remaining);
    setDraft(null);
    setSelectedId(null);
    const next = remaining.find((page) => page.section === section);
    if (next) selectPage(next);
    else addPage(section);
  };

  const addFiles = (files: FileList | null) => {
    if (!files || !draft) return;
    const accepted = Array.from(files).filter((file) => file.type.startsWith('image/') || /\.svg$/i.test(file.name));
    Promise.all(accepted.map((file) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read image.'));
      reader.onerror = () => reject(reader.error || new Error('Could not read image.'));
      reader.readAsDataURL(file);
    }))).then((images) => updateDraft({ images: [...(draft.images || []), ...images] })).catch((error) => setDriveMessage(error.message));
  };

  const addSticker = (sticker: string) => {
    if (!draft) return;
    updateDraft({ stickers: [...(draft.stickers || []), sticker] });
    setShowStickers(false);
  };

  const driveLabel = driveStatus === 'connecting' ? 'Connecting…' : driveStatus === 'saving' ? 'Saving…' : driveStatus === 'saved' ? 'Drive saved' : driveStatus === 'error' ? 'Reconnect Drive' : 'Connect Google Drive';

  return (
    <div className="mx-auto w-full max-w-7xl px-3 pb-8 pt-4 sm:px-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#ff65a9]/35 bg-[#1a0713]/85 p-4 shadow-[0_12px_42px_rgba(255,0,127,.12)] backdrop-blur-xl sm:p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#ff6eae]/50 bg-[#ff1493]/15 text-[#ff79b9]"><BookOpen className="h-6 w-6" /></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#ff85bd]">Pretty Little Fantasies</p><h1 className="text-2xl font-black tracking-tight text-[#ffe4f0] sm:text-3xl">Digital Junk Journal</h1><p className="mt-1 text-sm text-[#f8cade]/65">Your prompts, ideas, and everyday pages — your way.</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={connectDrive} disabled={driveStatus === 'connecting' || driveStatus === 'saving'} className="inline-flex items-center gap-2 rounded-xl border border-[#ff68ae]/50 bg-[#ff1493]/15 px-3 py-2 text-xs font-bold text-[#ffd9eb] transition hover:bg-[#ff1493]/25 disabled:opacity-60">
            {driveStatus === 'connecting' || driveStatus === 'saving' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : driveStatus === 'saved' ? <Check className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}{driveLabel}
          </button>
          <button type="button" onClick={() => addPage()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1493] to-[#ff62ad] px-3.5 py-2 text-xs font-extrabold text-white shadow-[0_0_20px_rgba(255,20,147,.28)]"><Plus className="h-4 w-4" />New page</button>
        </div>
      </header>

      {driveMessage && <p role="status" className={`mb-3 rounded-xl border px-3 py-2 text-xs ${driveStatus === 'error' ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-[#ff65a9]/25 bg-[#ff1493]/10 text-[#ffd7e9]'}`}>{driveMessage}</p>}

      <div className="mb-4 flex gap-2 overflow-x-auto rounded-2xl border border-[#ff65a9]/25 bg-[#160710]/75 p-2">
        {sections.map((item) => <button key={item.id} type="button" onClick={() => selectSection(item.id)} aria-pressed={section === item.id} className={`inline-flex min-w-max items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${section === item.id ? 'bg-[#ff1493] text-white shadow-[0_0_18px_rgba(255,20,147,.3)]' : 'text-[#ffc9e0]/75 hover:bg-white/5'}`}>{item.icon}{item.label}</button>)}
      </div>

      <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#ff65a9]/25 bg-[#160710]/75 p-3">
          <div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-extrabold text-white">{sectionLabel(section)}</h2><p className="text-[11px] text-[#ffc9e0]/55">{sectionPages.length} saved {sectionPages.length === 1 ? 'page' : 'pages'}</p></div><button type="button" onClick={() => addPage()} aria-label="Add page" className="rounded-lg border border-[#ff65a9]/35 p-2 text-[#ff91c3] hover:bg-[#ff1493]/15"><FilePlus2 className="h-4 w-4" /></button></div>
          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {sectionPages.map((page) => <button key={page.id} type="button" onClick={() => selectPage(page)} className={`w-full rounded-xl border p-3 text-left transition ${draft?.id === page.id ? 'border-[#ff67ae]/70 bg-[#ff1493]/15 shadow-[0_0_14px_rgba(255,20,147,.12)]' : 'border-white/10 bg-black/15 hover:bg-white/5'}`}><span className="block truncate text-sm font-bold text-[#ffe8f2]">{page.title || 'Untitled page'}</span><span className="mt-1 block text-[10px] text-[#ffc9e0]/55">{new Date(page.updatedAt).toLocaleDateString()} · {papers.find((paper) => paper.id === page.paper)?.label || 'Lined paper'}</span></button>)}
          </div>
          <p className="mt-4 rounded-xl bg-[#ff1493]/8 p-3 text-xs leading-relaxed text-[#ffc9e0]/65">{currentSection.helper}</p>
        </aside>

        <section className="min-w-0 rounded-2xl border border-[#ff65a9]/25 bg-[#160710]/75 p-3 sm:p-4">
          {draft && <div className="mx-auto max-w-4xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <input aria-label="Page title" value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} className="min-w-[180px] flex-1 rounded-xl border border-[#ff65a9]/25 bg-[#0e050b] px-3 py-2 text-sm font-bold text-white outline-none focus:border-[#ff65a9]/70" placeholder="Give this page a title" />
              <div className="flex flex-wrap items-center gap-1.5">
                <label className="inline-flex items-center gap-1 rounded-lg border border-[#ff65a9]/25 bg-black/20 px-2 py-2 text-[11px] text-[#ffd5e8]"><Palette className="h-3.5 w-3.5" /><select value={draft.paper} onChange={(event) => changePaper(event.target.value as JournalPaper)} aria-label="Paper style" className="bg-transparent text-[#ffd5e8] outline-none">{papers.map((paper) => <option key={paper.id} value={paper.id} className="bg-[#1a0713]">{paper.label}</option>)}</select></label>
                <label className="inline-flex items-center gap-1 rounded-lg border border-[#ff65a9]/25 bg-black/20 px-2 py-2 text-[11px] text-[#ffd5e8]"><Type className="h-3.5 w-3.5" /><select value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} aria-label="Writing size" className="bg-transparent text-[#ffd5e8] outline-none"><option className="bg-[#1a0713]" value={15}>Small</option><option className="bg-[#1a0713]" value={17}>Medium</option><option className="bg-[#1a0713]" value={20}>Large</option><option className="bg-[#1a0713]" value={24}>Extra large</option></select></label>
                <input type="color" value={inkColor} onChange={(event) => setInkColor(event.target.value)} aria-label="Ink color" title="Ink color" className="h-9 w-10 rounded-lg border border-[#ff65a9]/25 bg-transparent p-1" />
                <button type="button" onClick={() => setShowStickers(!showStickers)} aria-expanded={showStickers} className="rounded-lg border border-[#ff65a9]/25 bg-black/20 px-2 py-2 text-xs text-[#ffd5e8] hover:bg-[#ff1493]/15"><Sparkles className="inline h-3.5 w-3.5" /> Decorate</button>
                <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-[#ff65a9]/25 bg-black/20 px-2 py-2 text-xs text-[#ffd5e8] hover:bg-[#ff1493]/15"><ImagePlus className="inline h-3.5 w-3.5" /> Picture</button>
                <button type="button" onClick={deletePage} aria-label="Delete page" className="rounded-lg border border-red-300/20 bg-red-500/10 p-2 text-red-200 hover:bg-red-500/20"><Trash2 className="h-4 w-4" /></button>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,.svg" multiple className="hidden" onChange={(event) => { addFiles(event.target.files); event.currentTarget.value = ''; }} />
              </div>
            </div>

            {showStickers && <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#ff65a9]/25 bg-[#220b19] p-3"><span className="mr-1 text-xs font-bold text-[#ffd5e8]">Add a sticker</span>{stickerChoices.map((sticker) => <button key={sticker} type="button" onClick={() => addSticker(sticker)} className="rounded-lg bg-white/5 px-2 py-1 text-xl hover:bg-[#ff1493]/20">{sticker}</button>)}<button type="button" onClick={() => setShowStickers(false)} className="ml-auto rounded-lg p-1 text-white/60"><X className="h-4 w-4" /></button></div>}

            <article className={`journal-paper journal-paper--${draft.paper} min-h-[65vh] overflow-hidden rounded-xl border border-[#ff5ba5]/35 p-5 shadow-[0_14px_40px_rgba(0,0,0,.3)] sm:p-8`}>
              <textarea value={draft.body} onChange={(event) => updateDraft({ body: event.target.value })} placeholder={section === 'prompts' ? 'Paste or write a prompt here…' : section === 'ideas' ? 'Catch that idea before it gets away…' : 'Write about your day…'} aria-label={`${sectionLabel(section)} page writing area`} spellCheck className="journal-writing min-h-[45vh] w-full resize-y bg-transparent outline-none placeholder:text-[#a95980]/60" style={{ color: inkColor, fontSize }} />
              {draft.stickers.length > 0 && <div className="mt-3 flex flex-wrap gap-2 border-t border-[#ed6aa6]/25 pt-3">{draft.stickers.map((sticker, index) => <button key={`${draft.id}-sticker-${index}`} type="button" onClick={() => updateDraft({ stickers: draft.stickers.filter((_, itemIndex) => itemIndex !== index) })} title="Tap a sticker to remove it" className="rounded-lg bg-[#fff7fb]/70 p-1 text-2xl shadow-sm">{sticker}</button>)}</div>}
              {draft.images.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{draft.images.map((image, index) => <figure key={`${draft.id}-image-${index}`} className="group relative rotate-[-1deg] rounded-lg border-4 border-white bg-white p-1 shadow-lg"><img src={image} alt="Journal decoration" className="max-h-56 w-full rounded object-cover" /><button type="button" onClick={() => updateDraft({ images: draft.images.filter((_, itemIndex) => itemIndex !== index) })} aria-label="Remove image" className="absolute -right-2 -top-2 rounded-full bg-[#a20c55] p-1 text-white opacity-0 transition group-hover:opacity-100"><X className="h-3 w-3" /></button></figure>)}</div>}
            </article>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#ffc9e0]/60"><span>Autosaves in this app as you write{driveToken ? ' and syncs your latest pages to Google Drive.' : '.'}</span><span>{draft.body.length.toLocaleString()} characters · Updated {new Date(draft.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></div>
          </div>}
        </section>
      </div>

      <style>{`
        .journal-paper { background-color: #fff6fa; color: #47152d; }
        .journal-paper--plain { background-image: linear-gradient(135deg, rgba(255,20,147,.05), transparent 48%, rgba(255,20,147,.05)); }
        .journal-paper--lined { background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(222,66,139,.28) 32px, transparent 33px); background-size:100% 33px; }
        .journal-paper--graph { background-image: linear-gradient(rgba(235,84,151,.20) 1px, transparent 1px), linear-gradient(90deg, rgba(235,84,151,.20) 1px, transparent 1px); background-size:22px 22px; }
        .journal-paper--floral { background-color:#fff5fa; background-image: radial-gradient(circle at 14px 14px, rgba(255,20,147,.22) 2px, transparent 3px), radial-gradient(circle at 8px 8px, rgba(255,119,180,.22) 1.5px, transparent 3px), linear-gradient(135deg, rgba(255,219,235,.8), rgba(255,246,250,.95)); background-size:44px 44px, 44px 44px, auto; }
        .journal-writing { line-height: 33px; font-family: Georgia, 'Times New Roman', serif; }
        .journal-writing::selection { background:rgba(255,20,147,.28); }
      `}</style>
    </div>
  );
};
