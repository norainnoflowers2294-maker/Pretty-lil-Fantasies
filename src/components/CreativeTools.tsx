import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Download, FolderOpen, Heart, ImagePlus, LockKeyhole, Palette, RefreshCw, Search, Trash2, UnlockKeyhole, Upload, WandSparkles } from 'lucide-react';
import { CreativeAsset, deleteCreativeAsset, listCreativeAssets, readCreativeFile, saveCreativeAsset } from '../lib/creativeAssets';

type SavedPalette = { id: string; name: string; colors: string[]; savedAt: number };
type PaletteMood = 'Soft pastels' | 'Romantic' | 'Jewel tones' | 'Earthy';

const paletteMoods: Record<PaletteMood, [number, number]> = {
  'Soft pastels': [58, 80],
  Romantic: [48, 82],
  'Jewel tones': [44, 46],
  Earthy: [34, 47],
};
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
function hslHex(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}
function randomPaletteColor(mood: PaletteMood) {
  const [saturation, lightness] = paletteMoods[mood];
  return hslHex(random(0, 359), random(saturation - 12, saturation) / 100, random(lightness - 8, lightness + 4) / 100);
}
const readSavedPalettes = (): SavedPalette[] => {
  try { return JSON.parse(localStorage.getItem('plf_saved_palettes_v1') || '[]'); } catch { return []; }
};

export function PaletteCreator() {
  const [mood, setMood] = useState<PaletteMood>('Soft pastels');
  const [colors, setColors] = useState(() => Array.from({ length: 5 }, () => randomPaletteColor('Soft pastels')));
  const [locked, setLocked] = useState<boolean[]>([false, false, false, false, false]);
  const [name, setName] = useState('New palette');
  const [saved, setSaved] = useState<SavedPalette[]>(readSavedPalettes);
  const [notice, setNotice] = useState('');
  const generate = () => setColors((current) => current.map((color, index) => locked[index] ? color : randomPaletteColor(mood)));
  const updateColor = (index: number, value: string) => setColors((current) => current.map((color, colorIndex) => colorIndex === index ? value.toUpperCase() : color));
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setNotice(`${value} copied`); window.setTimeout(() => setNotice(''), 1800); }
    catch { setNotice('Clipboard is unavailable in this browser.'); window.setTimeout(() => setNotice(''), 2200); }
  };
  const savePalette = () => {
    const palette = { id: crypto.randomUUID?.() || String(Date.now()), name: name.trim() || 'Untitled palette', colors: [...colors], savedAt: Date.now() };
    const next = [palette, ...saved];
    setSaved(next);
    try { localStorage.setItem('plf_saved_palettes_v1', JSON.stringify(next)); setNotice('Palette saved to your collection.'); }
    catch { setNotice('Could not save this palette in browser storage.'); }
    window.setTimeout(() => setNotice(''), 2200);
  };
  const exportCss = () => {
    const css = `:root {\n${colors.map((color, index) => `  --palette-${index + 1}: ${color};`).join('\n')}\n}`;
    void copy(css);
  };
  const loadPalette = (palette: SavedPalette) => {
    setName(palette.name);
    setColors(palette.colors);
    setLocked([false, false, false, false, false]);
  };

  return <section className="space-y-5" aria-label="Palette creator">
    <header className="rounded-[28px] border border-white/85 bg-gradient-to-br from-white/80 via-pink-100/65 to-violet-100/70 p-5 shadow-xl backdrop-blur-xl sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-[.15em] text-[#925477]"><Palette className="h-4 w-4" />Color studio</p><h1 className="text-3xl font-black tracking-tight text-[#32182a] sm:text-4xl">Palette Creator</h1><p className="mt-2 max-w-xl text-sm text-[#654552]">Spin up a color story, lock the shades you love, and save palettes for your next design.</p></div>
        <button type="button" onClick={generate} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/90 bg-white/80 px-4 py-2 text-sm font-bold text-[#48263a] shadow-md"><RefreshCw className="h-4 w-4" />Generate palette</button>
      </div>
    </header>

    <div className="rounded-[28px] border border-white/85 bg-white/65 p-4 shadow-xl backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-[#48263a]">Palette mood<select value={mood} onChange={(event) => setMood(event.target.value as PaletteMood)} className="rounded-full border border-[#dba9c2] bg-white/85 px-3 py-2 text-sm text-[#48263a]">{Object.keys(paletteMoods).map((item) => <option key={item}>{item}</option>)}</select></label>
        <div className="flex gap-2"><input aria-label="Palette name" value={name} onChange={(event) => setName(event.target.value)} className="w-36 rounded-full border border-[#e3bfd0] bg-white/85 px-3 py-2 text-sm text-[#48263a] sm:w-48" /><button type="button" onClick={savePalette} className="rounded-full bg-[#b45b85] px-4 py-2 text-sm font-bold text-white">Save</button></div>
      </div>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {colors.map((color, index) => <article key={`${index}-${color}`} className="overflow-hidden rounded-2xl border border-white/90 bg-white shadow-sm">
          <label className="group relative block aspect-[.72] cursor-pointer sm:aspect-[.8]" style={{ backgroundColor: color }} title={`Change color ${index + 1}`}>
            <input aria-label={`Change color ${index + 1}`} type="color" value={color} onChange={(event) => updateColor(index, event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            <span className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[10px] font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,.8)] opacity-0 transition-opacity group-hover:opacity-100">Edit shade</span>
          </label>
          <div className="flex items-center justify-between gap-1 px-1.5 py-2 sm:px-2"><button type="button" onClick={() => void copy(color)} className="truncate text-[10px] font-bold text-[#48263a] sm:text-xs">{color}</button><button type="button" aria-label={locked[index] ? `Unlock ${color}` : `Lock ${color}`} title={locked[index] ? 'Unlock color' : 'Lock color'} onClick={() => setLocked((current) => current.map((item, itemIndex) => itemIndex === index ? !item : item))} className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${locked[index] ? 'bg-[#f4d8e5] text-[#923e68]' : 'bg-[#fff2f7] text-[#805267]'}`}>{locked[index] ? <LockKeyhole className="h-3.5 w-3.5" /> : <UnlockKeyhole className="h-3.5 w-3.5" />}</button></div>
        </article>)}
      </div>
      <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={generate} className="inline-flex items-center gap-2 rounded-full border border-[#ddb4c8] bg-[#fff1f7] px-4 py-2.5 text-sm font-bold text-[#48263a]"><WandSparkles className="h-4 w-4" />Generate unlocked shades</button><button type="button" onClick={exportCss} className="inline-flex items-center gap-2 rounded-full border border-[#ddb4c8] bg-white/80 px-4 py-2.5 text-sm font-bold text-[#48263a]"><Copy className="h-4 w-4" />Copy CSS variables</button></div>
      {notice && <p role="status" className="mt-3 text-sm font-semibold text-[#895272]">{notice}</p>}
    </div>

    <section className="rounded-[26px] border border-white/80 bg-white/55 p-4 shadow-lg backdrop-blur-xl sm:p-5"><div className="mb-3 flex items-center gap-2 text-[#48263a]"><Heart className="h-4 w-4 text-[#bd5f8b]" /><h2 className="font-bold">Saved palettes</h2></div>{saved.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{saved.map((palette) => <button key={palette.id} type="button" onClick={() => loadPalette(palette)} className="rounded-2xl border border-white/90 bg-white/75 p-3 text-left shadow-sm"><span className="block truncate text-sm font-bold text-[#48263a]">{palette.name}</span><span className="mt-2 flex h-8 overflow-hidden rounded-full">{palette.colors.map((color, index) => <i key={`${color}-${index}`} style={{ background: color }} className="flex-1" />)}</span></button>)}</div> : <p className="text-sm text-[#76576a]">Your saved palettes will show up here.</p>}</section>
  </section>;
}

function formatSize(size: number) {
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function AssetGallery() {
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<'All files' | 'SVG' | 'PNG' | 'Wallpapers'>('All files');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { void listCreativeAssets().then(setAssets).catch((error: Error) => setNotice(error.message)); }, []);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setNotice('');
    try {
      const allowed = /\.(svg|png|jpe?g|webp)$/i;
      const next: CreativeAsset[] = [];
      for (const file of Array.from(files)) {
        if (!allowed.test(file.name)) throw new Error(`${file.name} is not supported. Choose SVG, PNG, JPG, or WebP files.`);
        if (file.size > 30 * 1024 * 1024) throw new Error(`${file.name} is over the 30 MB per-file limit.`);
        const dataUrl = await readCreativeFile(file);
        next.push({ id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, name: file.name, type: file.type || (file.name.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : 'image/png'), size: file.size, dataUrl, addedAt: Date.now() });
      }
      for (const asset of next) await saveCreativeAsset(asset);
      const all = await listCreativeAssets();
      setAssets(all);
      setNotice(`${next.length} ${next.length === 1 ? 'file' : 'files'} added to your library.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not add these files.'); }
    finally { setBusy(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };
  const removeAsset = async (id: string) => {
    try { await deleteCreativeAsset(id); setAssets((current) => current.filter((asset) => asset.id !== id)); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Could not remove this file.'); }
  };
  const filtered = useMemo(() => assets.filter((asset) => {
    const fileType = asset.name.split('.').pop()?.toLowerCase() || '';
    const typeOk = kind === 'All files' || (kind === 'Wallpapers' ? ['png', 'jpg', 'jpeg', 'webp'].includes(fileType) : fileType === kind.toLowerCase());
    return typeOk && asset.name.toLowerCase().includes(search.toLowerCase());
  }), [assets, kind, search]);
  const downloadAsset = (asset: CreativeAsset) => { const link = document.createElement('a'); link.href = asset.dataUrl; link.download = asset.name; link.click(); };

  return <section className="space-y-5" aria-label="Digital asset gallery">
    <header className="rounded-[28px] border border-white/85 bg-gradient-to-br from-white/80 via-violet-100/60 to-pink-100/70 p-5 shadow-xl backdrop-blur-xl sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-[.15em] text-[#76528e]"><FolderOpen className="h-4 w-4" />Your design library</p><h1 className="text-3xl font-black tracking-tight text-[#32182a] sm:text-4xl">Digital Asset Gallery</h1><p className="mt-2 max-w-xl text-sm text-[#654552]">A personal shelf for SVGs, PNGs, and wallpaper art. Your files stay in this browser’s private library.</p></div><button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/90 bg-white/85 px-4 py-2 text-sm font-bold text-[#48263a] shadow-md disabled:opacity-50"><Upload className="h-4 w-4" />{busy ? 'Adding files…' : 'Add files'}</button><input ref={fileInputRef} type="file" accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp" multiple hidden onChange={(event) => void uploadFiles(event.target.files)} /></div></header>
    <div className="rounded-[26px] border border-white/80 bg-white/60 p-4 shadow-lg backdrop-blur-xl sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2 overflow-x-auto pb-1">{(['All files', 'SVG', 'PNG', 'Wallpapers'] as const).map((tab) => <button key={tab} type="button" onClick={() => setKind(tab)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${kind === tab ? 'border-[#cf8fb0] bg-[#ffe7f1] text-[#48263a] shadow-sm' : 'border-white/80 bg-white/65 text-[#76576a]'}`}>{tab}</button>)}</div><label className="flex min-w-48 items-center gap-2 rounded-full border border-[#e2bfd0] bg-white/80 px-3 py-2 text-sm text-[#48263a]"><Search className="h-4 w-4" /><input aria-label="Search files" value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search your files" /></label></div>
      {notice && <p role="status" className="mt-3 text-sm font-semibold text-[#895272]">{notice}</p>}
      {filtered.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{filtered.map((asset) => <article key={asset.id} className="overflow-hidden rounded-[20px] border border-white/90 bg-white/75 shadow-sm"><div className="relative grid aspect-square place-items-center overflow-hidden bg-gradient-to-br from-pink-100/60 via-violet-100/60 to-cyan-100/60 p-3"><img src={asset.dataUrl} alt={asset.name} className="max-h-full max-w-full object-contain" /><span className="absolute left-2 top-2 rounded-full border border-white/80 bg-white/80 px-2 py-1 text-[9px] font-bold uppercase text-[#654552]">{asset.name.split('.').pop()}</span></div><div className="p-3"><h3 className="truncate text-xs font-bold text-[#48263a]" title={asset.name}>{asset.name}</h3><p className="mt-1 text-[10px] text-[#76576a]">{formatSize(asset.size)} · {new Date(asset.addedAt).toLocaleDateString()}</p><div className="mt-2 flex justify-between gap-1"><button type="button" onClick={() => downloadAsset(asset)} aria-label={`Download ${asset.name}`} className="inline-flex items-center gap-1 rounded-full border border-[#e1bdd0] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#48263a]"><Download className="h-3 w-3" />Download</button><button type="button" onClick={() => void removeAsset(asset.id)} aria-label={`Remove ${asset.name}`} className="grid h-7 w-7 place-items-center rounded-full bg-[#fff0f5] text-[#a04d72]"><Trash2 className="h-3.5 w-3.5" /></button></div></div></article>)}</div> : <div className="mt-4 rounded-[22px] border border-dashed border-[#d6a9bf] bg-white/45 px-5 py-12 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/80 text-[#a05e7d]"><ImagePlus className="h-6 w-6" /></span><h2 className="mt-3 font-bold text-[#48263a]">{assets.length ? 'No files match this filter' : 'Your shelf is ready'}</h2><p className="mx-auto mt-1 max-w-sm text-sm text-[#76576a]">Add SVG, PNG, JPG, or WebP artwork to build a browsable, downloadable creative library.</p><button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 rounded-full bg-[#b45b85] px-4 py-2.5 text-sm font-bold text-white">Choose files</button></div>}
    </div>
    <p className="text-xs leading-relaxed text-[#76576a]">Files are kept in IndexedDB on this browser and can be downloaded or removed here. SVG, PNG, JPG, and WebP files up to 30 MB each are supported.</p>
  </section>;
}
