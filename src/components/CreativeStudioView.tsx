import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Download, ExternalLink, Heart, Search, Shuffle, Sparkles, Type, WandSparkles } from 'lucide-react';

type CreativeItem = {
  id: string;
  name: string;
  category: 'SVG' | 'Pattern' | 'Sticker';
  mood: string;
  colors: string[];
};

const fontDrops = [
  { id: 'cinzel-decorative', name: 'Cinzel Decorative', family: 'Cinzel Decorative', mood: 'Romantic display', sample: 'Make it dreamy' },
  { id: 'ballet', name: 'Ballet', family: 'Ballet', mood: 'Soft script', sample: 'Pretty little things' },
  { id: 'cormorant-garamond', name: 'Cormorant Garamond', family: 'Cormorant Garamond', mood: 'Editorial serif', sample: 'A story in bloom' },
  { id: 'rye', name: 'Rye', family: 'Rye', mood: 'Vintage western', sample: 'Wild hearts' },
  { id: 'unifrakturmaguntia', name: 'UnifrakturMaguntia', family: 'UnifrakturMaguntia', mood: 'Gothic blackletter', sample: 'Moonlit romance' },
  { id: 'abril-fatface', name: 'Abril Fatface', family: 'Abril Fatface', mood: 'Bold vintage', sample: 'The grand entrance' },
  { id: 'dancing-script', name: 'Dancing Script', family: 'Dancing Script', mood: 'Playful handwriting', sample: 'Love notes' },
  { id: 'special-elite', name: 'Special Elite', family: 'Special Elite', mood: 'Typewriter', sample: 'Secret letters' },
  { id: 'bodoni-moda', name: 'Bodoni Moda', family: 'Bodoni Moda', mood: 'High fashion', sample: 'After the roses' },
  { id: 'oleo-script', name: 'Oleo Script', family: 'Oleo Script', mood: 'Friendly lettering', sample: 'Made with love' },
  { id: 'great-vibes', name: 'Great Vibes', family: 'Great Vibes', mood: 'Elegant calligraphy', sample: 'Once upon a time' },
  { id: 'dm-serif-display', name: 'DM Serif Display', family: 'DM Serif Display', mood: 'Modern storybook', sample: 'A little fantasy' },
];

const artDrops: CreativeItem[] = [
  { id: 'pearl-daisy', name: 'Pearl Daisy', category: 'SVG', mood: 'Floral sticker', colors: ['#f7a9cd', '#c7b5f7', '#a9e6e8'] },
  { id: 'orbit-heart', name: 'Orbit Heart', category: 'SVG', mood: 'Romantic icon', colors: ['#ff8fc4', '#c7adff', '#9fe8eb'] },
  { id: 'ribbon-bow', name: 'Ribbon Bow', category: 'SVG', mood: 'Coquette accent', colors: ['#f58bbd', '#d5a9ff', '#fff2f8'] },
  { id: 'moon-sparkle', name: 'Moon Sparkle', category: 'SVG', mood: 'Celestial sticker', colors: ['#b6a0f6', '#9bdce7', '#ffb2d8'] },
  { id: 'flower-corner', name: 'Flower Corner', category: 'SVG', mood: 'Page decoration', colors: ['#ed92be', '#a9dfd7', '#c6b5f5'] },
  { id: 'storybook-label', name: 'Storybook Label', category: 'SVG', mood: 'Title frame', colors: ['#f8b6d4', '#d4c1ff', '#b7e8ef'] },
  { id: 'rainbow-haze', name: 'Rainbow Haze', category: 'Pattern', mood: 'Pastel digital paper', colors: ['#ffaed0', '#d4baff', '#9fe7ec'] },
  { id: 'pearl-dots', name: 'Pearl Scatter', category: 'Pattern', mood: 'Seamless dot paper', colors: ['#ffb7d8', '#c8bcff', '#b1e9e4'] },
  { id: 'tiny-bows', name: 'Tiny Bows', category: 'Pattern', mood: 'Seamless coquette paper', colors: ['#f398c4', '#d2b5fa', '#fff5fb'] },
  { id: 'sparkle-pack', name: 'Pearl Sparkles', category: 'Sticker', mood: 'Mini sticker sheet', colors: ['#fff4fa', '#f5acd3', '#b9b4f4'] },
  { id: 'flower-pack', name: 'Blush Blossoms', category: 'Sticker', mood: 'Mini sticker sheet', colors: ['#f28fbd', '#b5e5dc', '#d3b4f3'] },
  { id: 'bubble-pack', name: 'Iridescent Bubbles', category: 'Sticker', mood: 'Soap bubble accents', colors: ['#ffacd7', '#a8e7ed', '#c8b4f5'] },
];

const fontUrl = 'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Ballet&family=Bodoni+Moda:opsz,wght@6..96,400;6..96,600&family=Cinzel+Decorative:wght@400;700&family=Cormorant+Garamond:wght@400;500;600&family=Dancing+Script:wght@400;600&family=DM+Serif+Display&family=Great+Vibes&family=Oleo+Script:wght@400;700&family=Rye&family=Special+Elite&family=UnifrakturMaguntia&display=swap';

const dayKey = () => new Date().toLocaleDateString('en-CA');

function makeSvg(id: string): string {
  const common = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"';
  const defs = '<defs><linearGradient id="plf-g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffacd3"/><stop offset=".5" stop-color="#cbb6fa"/><stop offset="1" stop-color="#9de4e8"/></linearGradient><radialGradient id="plf-pearl"><stop stop-color="#fff"/><stop offset=".58" stop-color="#f7d7ee"/><stop offset="1" stop-color="#bfe8ef"/></radialGradient></defs>';
  const paths: Record<string, string> = {
    'pearl-daisy': '<g fill="url(#plf-g)" stroke="#fff" stroke-width="3"><ellipse cx="120" cy="61" rx="22" ry="42"/><ellipse cx="120" cy="179" rx="22" ry="42"/><ellipse cx="61" cy="120" rx="42" ry="22"/><ellipse cx="179" cy="120" rx="42" ry="22"/><ellipse cx="78" cy="78" rx="22" ry="39" transform="rotate(-45 78 78)"/><ellipse cx="162" cy="78" rx="22" ry="39" transform="rotate(45 162 78)"/><ellipse cx="78" cy="162" rx="22" ry="39" transform="rotate(45 78 162)"/><ellipse cx="162" cy="162" rx="22" ry="39" transform="rotate(-45 162 162)"/></g><circle cx="120" cy="120" r="25" fill="url(#plf-pearl)" stroke="#fff" stroke-width="3"/>',
    'orbit-heart': '<path d="M120 190S38 142 52 89c11-42 58-43 68-8 12-35 59-34 69 8 14 53-69 101-69 101Z" fill="url(#plf-g)" stroke="#fff" stroke-width="5"/><ellipse cx="120" cy="120" rx="94" ry="44" fill="none" stroke="#fff" stroke-width="4" opacity=".8" transform="rotate(-24 120 120)"/><circle cx="44" cy="88" r="9" fill="url(#plf-pearl)"/><path d="m182 48 5 14 14 5-14 5-5 14-5-14-14-5 14-5Z" fill="#fff"/>',
    'ribbon-bow': '<path d="M118 113C80 48 38 55 43 92c4 28 45 40 75 36-30-4-70 8-75 36-6 37 38 44 75-19l2-4 2 4c37 63 81 56 75 19-5-28-45-40-75-36 30 4 71-8 75-36 5-37-37-44-75 21l-2 3Z" fill="url(#plf-g)" stroke="#fff" stroke-width="5"/><path d="M105 103h30v35h-30z" rx="10" fill="url(#plf-pearl)" stroke="#fff" stroke-width="4"/><path d="M120 65v24M120 153v25" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
    'moon-sparkle': '<path d="M148 34c-17 12-28 32-28 55 0 39 31 70 70 70 8 0 15-1 22-4-12 31-42 53-78 53-46 0-84-38-84-84 0-43 33-79 76-84Z" fill="url(#plf-g)" stroke="#fff" stroke-width="5"/><path d="m168 46 7 21 21 7-21 7-7 21-7-21-21-7 21-7ZM75 139l5 15 15 5-15 5-5 15-5-15-15-5 15-5Z" fill="#fff"/>',
    'flower-corner': '<path d="M38 201c46-3 65-38 72-71 7-33 26-54 71-83M46 192c15-29 18-55 6-83m61 21c-22-5-43-21-53-40m79-30c-4 20 4 42 22 55m-60 31c18 6 32 21 38 40" fill="none" stroke="url(#plf-g)" stroke-width="8" stroke-linecap="round"/><g fill="url(#plf-g)" stroke="#fff" stroke-width="3"><circle cx="126" cy="107" r="11"/><circle cx="112" cy="93" r="10"/><circle cx="140" cy="92" r="10"/><circle cx="142" cy="120" r="10"/><circle cx="112" cy="120" r="10"/></g><circle cx="126" cy="106" r="7" fill="url(#plf-pearl)"/>',
    'storybook-label': '<path d="M39 52q0-15 16-15h130q16 0 16 15v136q0 15-16 15H55q-16 0-16-15Z" fill="url(#plf-g)" stroke="#fff" stroke-width="6"/><path d="M54 68q0-10 12-10h108q12 0 12 10v103q0 10-12 10H66q-12 0-12-10Z" fill="none" stroke="#fff" stroke-width="3"/><path d="M77 119h86" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="m120 87 5 14 14 5-14 5-5 14-5-14-14-5 14-5Z" fill="#fff"/>',
    'rainbow-haze': '<rect width="240" height="240" rx="26" fill="#fff9fd"/><path d="M0 57c42-31 73-28 120 0s78 32 120 0v54c-42 31-73 28-120 0S42 79 0 111Z" fill="url(#plf-g)" opacity=".58"/><path d="M0 162c42-31 73-28 120 0s78 32 120 0v50c-42 31-73 28-120 0S42 181 0 212Z" fill="url(#plf-g)" opacity=".44"/>',
    'pearl-dots': '<rect width="240" height="240" rx="24" fill="#fff8fc"/><g fill="url(#plf-pearl)" stroke="#fff" stroke-width="3"><circle cx="40" cy="40" r="17"/><circle cx="120" cy="40" r="11"/><circle cx="200" cy="40" r="19"/><circle cx="80" cy="120" r="19"/><circle cx="160" cy="120" r="12"/><circle cx="40" cy="200" r="12"/><circle cx="120" cy="200" r="20"/><circle cx="200" cy="200" r="13"/></g>',
    'tiny-bows': '<rect width="240" height="240" rx="24" fill="#fff7fb"/><g fill="url(#plf-g)" stroke="#fff" stroke-width="3"><path d="M52 48q-30-37-31-5 0 20 36 16-34 1-33 22 2 28 34-16l2-3 2 3q32 44 34 16 1-21-33-22 36 4 36-16-1-32-31 5Z"/><path d="M174 164q-30-37-31-5 0 20 36 16-34 1-33 22 2 28 34-16l2-3 2 3q32 44 34 16 1-21-33-22 36 4 36-16-1-32-31 5Z"/></g>',
    'sparkle-pack': '<g fill="url(#plf-g)" stroke="#fff" stroke-width="3"><path d="m58 25 12 34 34 12-34 12-12 34-12-34-34-12 34-12Z"/><path d="m173 89 9 25 25 9-25 9-9 25-9-25-25-9 25-9Z"/><path d="m84 151 10 28 28 10-28 10-10 28-10-28-28-10 28-10Z"/><circle cx="196" cy="45" r="12" fill="url(#plf-pearl)"/><circle cx="35" cy="178" r="10" fill="url(#plf-pearl)"/></g>',
    'flower-pack': '<g fill="url(#plf-g)" stroke="#fff" stroke-width="3"><circle cx="66" cy="71" r="24"/><circle cx="103" cy="71" r="24"/><circle cx="84" cy="39" r="24"/><circle cx="84" cy="103" r="24"/><circle cx="84" cy="71" r="11" fill="url(#plf-pearl)"/><circle cx="165" cy="160" r="19"/><circle cx="194" cy="160" r="19"/><circle cx="180" cy="136" r="19"/><circle cx="180" cy="184" r="19"/><circle cx="180" cy="160" r="9" fill="url(#plf-pearl)"/></g>',
    'bubble-pack': '<g fill="url(#plf-pearl)" stroke="#fff" stroke-width="5"><circle cx="74" cy="82" r="50"/><circle cx="164" cy="149" r="58"/><circle cx="171" cy="47" r="24"/><circle cx="51" cy="180" r="19"/></g><g fill="none" stroke="url(#plf-g)" stroke-width="4"><circle cx="74" cy="82" r="43"/><circle cx="164" cy="149" r="51"/></g>',
  };
  return `<svg ${common} role="img" aria-label="${id} preview">${defs}${paths[id] || paths['pearl-daisy']}</svg>`;
}

function dailyOffset(key: string, salt: number, length: number) {
  const value = key.split('').reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 2147483647, salt);
  return Math.abs(value) % length;
}

const CreativeStudioView: React.FC = () => {
  const [today] = useState(dayKey);
  const [shuffle, setShuffle] = useState(0);
  const [filter, setFilter] = useState<'All' | 'Fonts' | 'SVGs' | 'Patterns' | 'Stickers' | 'Favorites'>('All');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('plf_creative_favorites_v1') || '[]'); } catch { return []; }
  });
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (document.getElementById('plf-creative-fonts')) return;
    const link = document.createElement('link');
    link.id = 'plf-creative-fonts';
    link.rel = 'stylesheet';
    link.href = fontUrl;
    document.head.appendChild(link);
  }, []);

  const dailyFonts = useMemo(() => {
    const offset = dailyOffset(today, shuffle * 19 + 5, fontDrops.length);
    return [fontDrops[offset], fontDrops[(offset + 1 + shuffle) % fontDrops.length]];
  }, [today, shuffle]);
  const dailyArt = useMemo(() => {
    const offset = dailyOffset(today, shuffle * 23 + 11, artDrops.length);
    return [artDrops[offset], artDrops[(offset + 1 + shuffle) % artDrops.length], artDrops[(offset + 4 + shuffle) % artDrops.length]];
  }, [today, shuffle]);

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    setFavorites(next);
    try { localStorage.setItem('plf_creative_favorites_v1', JSON.stringify(next)); } catch { /* local favorites are optional */ }
  };
  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(''), 1600);
    } catch { setCopied(''); }
  };
  const downloadSvg = (item: CreativeItem) => {
    const blob = new Blob([makeSvg(item.id)], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PLF-${item.id}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const fontCard = (font: typeof fontDrops[number], daily = false) => (
    <article key={font.id} className="plf-creative-card group rounded-[24px] border border-white/80 bg-white/55 p-4 shadow-lg backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#925477]">Font of the day · {font.mood}</span>
          <h3 className="mt-1 text-lg font-bold text-[#32182a]">{font.name}</h3>
        </div>
        <button type="button" onClick={() => toggleFavorite(font.id)} aria-label={favorites.includes(font.id) ? 'Remove font from favorites' : 'Save font to favorites'} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/90 bg-white/65 text-[#71385a]">
          <Heart className={`h-4 w-4 ${favorites.includes(font.id) ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="my-4 flex min-h-24 items-center justify-center rounded-2xl border border-white/75 bg-gradient-to-br from-white/70 via-pink-100/55 to-violet-100/55 px-3 text-center text-2xl text-[#32182a]" style={{ fontFamily: `"${font.family}", serif` }}>
        {font.sample}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => copyText(font.id, font.family)} className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 py-2 text-xs font-semibold text-[#32182a]"><Copy className="h-3.5 w-3.5" />{copied === font.id ? 'Copied' : 'Copy font name'}</button>
        <a className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 py-2 text-xs font-semibold text-[#32182a]" href={`https://fonts.google.com/specimen/${encodeURIComponent(font.name.replace(/ /g, '+'))}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" />Get font</a>
      </div>
      {daily && <span className="mt-3 inline-flex rounded-full bg-white/65 px-2.5 py-1 text-[10px] font-semibold text-[#8e4d70]">Today’s pick</span>}
    </article>
  );

  const artCard = (item: CreativeItem, daily = false) => (
    <article key={item.id} className="plf-creative-card group rounded-[24px] border border-white/80 bg-white/55 p-4 shadow-lg backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#925477]">{item.category} · {item.mood}</span>
          <h3 className="mt-1 text-lg font-bold text-[#32182a]">{item.name}</h3>
        </div>
        <button type="button" onClick={() => toggleFavorite(item.id)} aria-label={favorites.includes(item.id) ? 'Remove from favorites' : 'Save to favorites'} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/90 bg-white/65 text-[#71385a]">
          <Heart className={`h-4 w-4 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="my-4 flex min-h-40 items-center justify-center overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-pink-100/50 via-violet-100/55 to-cyan-100/45 p-3">
        <div className="h-36 w-36" dangerouslySetInnerHTML={{ __html: makeSvg(item.id) }} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => downloadSvg(item)} className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 py-2 text-xs font-semibold text-[#32182a]"><Download className="h-3.5 w-3.5" />Download SVG</button>
        <button type="button" onClick={() => copyText(item.id, makeSvg(item.id))} className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 py-2 text-xs font-semibold text-[#32182a]"><Copy className="h-3.5 w-3.5" />{copied === item.id ? 'Copied' : 'Copy SVG'}</button>
      </div>
      {daily && <span className="mt-3 inline-flex rounded-full bg-white/65 px-2.5 py-1 text-[10px] font-semibold text-[#8e4d70]">Today’s pick</span>}
    </article>
  );

  const allItems = useMemo(() => [
    ...fontDrops.map((item) => ({ ...item, kind: 'font' as const })),
    ...artDrops.map((item) => ({ ...item, kind: 'art' as const })),
  ], []);
  const visible = allItems.filter((item) => {
    const matchesFilter =
      filter === 'All' ||
      (filter === 'Fonts' && item.kind === 'font') ||
      (filter === 'Favorites' && favorites.includes(item.id)) ||
      (item.kind === 'art' && (
        (filter === 'SVGs' && item.category === 'SVG') ||
        (filter === 'Patterns' && item.category === 'Pattern') ||
        (filter === 'Stickers' && item.category === 'Sticker')
      ));
    const matchesSearch = (item.name + ' ' + item.mood + (item.kind === 'font' ? ' ' + item.family : '')).toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <section className="plf-creative-studio mx-auto w-full max-w-6xl space-y-6 px-4 py-5 sm:px-6">
      <header className="rounded-[28px] border border-white/80 bg-gradient-to-br from-white/75 via-pink-100/55 to-violet-100/55 p-5 shadow-xl backdrop-blur-xl sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/65 px-3 py-1 text-xs font-bold uppercase tracking-[.16em] text-[#925477]"><WandSparkles className="h-4 w-4" />Daily creative drops</p>
            <h1 className="text-3xl font-black tracking-tight text-[#32182a] sm:text-4xl">Creative Studio</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#654552]">Fresh type, original SVG art, patterns, and sticker ideas for your stories and designs. New picks each day.</p>
          </div>
          <button type="button" onClick={() => setShuffle((value) => value + 1)} className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/75 px-4 py-3 text-sm font-bold text-[#32182a] shadow-md"><Shuffle className="h-4 w-4" />Shuffle today’s picks</button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#70445f]"><span className="rounded-full bg-white/65 px-3 py-1">Rotates daily · {today}</span><span className="rounded-full bg-white/65 px-3 py-1">SVG downloads are editable vectors</span></div>
      </header>

      <section className="space-y-3">
        <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#b94c8b]" /><h2 className="text-xl font-bold text-[#32182a]">Today’s inspiration</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dailyFonts.map((font) => fontCard(font, true))}
          {dailyArt.map((item) => artCard(item, true))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-xl font-bold text-[#32182a]">Browse the mini library</h2><p className="mt-1 text-sm text-[#654552]">Original, downloadable SVG resources plus font inspiration.</p></div>
          <label className="flex items-center gap-2 rounded-full border border-white/85 bg-white/70 px-3 py-2 text-sm text-[#32182a]"><Search className="h-4 w-4" /><input className="min-w-0 bg-transparent outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search creative picks" /></label>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['All', 'Fonts', 'SVGs', 'Patterns', 'Stickers', 'Favorites'] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setFilter(tab)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${filter === tab ? 'border-white bg-gradient-to-r from-pink-200/80 via-violet-200/70 to-cyan-100/80 text-[#32182a] shadow-md' : 'border-white/75 bg-white/55 text-[#654552]'}`}>{tab}</button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => item.kind === 'font' ? fontCard(item) : artCard(item))}
          {visible.length === 0 && <div className="rounded-[24px] border border-white/80 bg-white/60 p-8 text-center text-sm text-[#654552]">No picks match that search yet.</div>}
        </div>
      </section>

      <footer className="rounded-[24px] border border-white/75 bg-white/50 p-4 text-xs leading-relaxed text-[#654552] backdrop-blur-lg">
        <span className="inline-flex items-center gap-2 font-semibold text-[#654552]"><Type className="h-4 w-4" />Font previews load from Google Fonts. SVG artwork is generated inside PLF and can be edited in vector software.</span>
      </footer>
    </section>
  );
};

export default CreativeStudioView;
