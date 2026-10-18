import React, { useMemo, useState } from 'react';
import { Clock3, GitBranch, CloudSun, X, Plus, Minus, Sparkles } from 'lucide-react';
import type { Chat } from '../types/roleplay';

interface Props {
  chat: Chat;
  onSave: (chat: Chat) => void;
  onCreateBranch: (direction: string) => void;
  onClose: () => void;
}

const weatherTypes = ['Clear', 'Partly cloudy', 'Overcast', 'Rain', 'Thunderstorm', 'Snow', 'Fog', 'Windy'];
const parseHour = (value?: string) => {
  const match = value?.match(/(\d{1,2})(?::\d{2})?/);
  return match ? Math.max(0, Math.min(23, Number(match[1]))) : 20;
};
const formatTime = (hour: number) => new Date(2000, 0, 1, hour).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const timePhase = (hour: number) => hour >= 5 && hour < 11 ? 'Morning' : hour >= 11 && hour < 16 ? 'Daytime' : hour >= 16 && hour < 20 ? 'Evening' : 'Night';

export const StoryWorldPanel: React.FC<Props> = ({ chat, onSave, onCreateBranch, onClose }) => {
  const [hour, setHour] = useState(() => parseHour(chat.timeOfDay));
  const [weather, setWeather] = useState(() => {
    const existing = chat.weather || '';
    return weatherTypes.find((item) => existing.toLowerCase().includes(item.toLowerCase())) || 'Clear';
  });
  const [intensity, setIntensity] = useState(() => /heavy|intense|severe/i.test(chat.weather || '') ? 'Heavy' : /light|mild/i.test(chat.weather || '') ? 'Light' : 'Steady');
  const [direction, setDirection] = useState('');
  const [autoCycle, setAutoCycle] = useState(Boolean(chat.timeCycleEnabled));
  const [branching, setBranching] = useState(false);
  const weatherLabel = useMemo(() => weather === 'Clear' ? 'Clear skies' : `${intensity} ${weather.toLowerCase()}`, [weather, intensity]);

  const saveWorld = (nextHour = hour, nextWeather = weatherLabel) => {
    setHour(nextHour);
    onSave({ ...chat, timeOfDay: `${formatTime(nextHour)} · ${timePhase(nextHour)}`, weather: nextWeather, timeCycleEnabled: autoCycle, updatedAt: new Date().toISOString() });
  };
  const advance = (amount: number) => {
    const next = (hour + amount + 24) % 24;
    saveWorld(next);
  };

  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-[#100719]/65 p-3 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="story-world-title" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,.28),rgba(244,218,255,.16)_45%,rgba(255,221,244,.14)),rgba(30,15,42,.72)] p-5 text-white shadow-[0_20px_70px_rgba(8,1,19,.55),0_0_30px_rgba(240,10,168,.18)] backdrop-blur-3xl">
        <header className="mb-5 flex items-start justify-between">
          <div><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-pink-200" /><h2 id="story-world-title" className="text-lg font-bold">Story world</h2></div><p className="mt-1 text-xs text-white/70">Weather and time become part of the character's scene context.</p></div>
          <button type="button" onClick={onClose} aria-label="Close story world" className="rounded-xl border border-white/45 bg-white/15 p-2"><X className="h-4 w-4" /></button>
        </header>

        <div className="space-y-4">
          <section className="rounded-2xl border border-white/35 bg-white/10 p-4 shadow-inner shadow-white/10">
            <div className="mb-3 flex items-center gap-2"><CloudSun className="h-4 w-4 text-pink-200" /><h3 className="text-sm font-semibold">Interactive weather</h3></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-white/80">Conditions
                <select value={weather} onChange={(event) => { setWeather(event.target.value); saveWorld(hour, event.target.value === 'Clear' ? 'Clear skies' : `${intensity} ${event.target.value.toLowerCase()}`); }} className="mt-1 w-full rounded-xl border border-white/45 bg-white/15 px-3 py-2.5 text-sm text-white">
                  {weatherTypes.map((item) => <option key={item} value={item} className="bg-[#21152e]">{item}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-white/80">Intensity
                <select value={intensity} onChange={(event) => { setIntensity(event.target.value); saveWorld(hour, weather === 'Clear' ? 'Clear skies' : `${event.target.value} ${weather.toLowerCase()}`); }} className="mt-1 w-full rounded-xl border border-white/45 bg-white/15 px-3 py-2.5 text-sm text-white">
                  {['Light', 'Steady', 'Heavy'].map((item) => <option key={item} value={item} className="bg-[#21152e]">{item}</option>)}
                </select>
              </label>
            </div>
            <p className="mt-2 text-[11px] text-white/65">Current scene: {chat.weather || weatherLabel}</p>
          </section>

          <section className="rounded-2xl border border-white/35 bg-white/10 p-4">
            <div className="mb-3 flex items-center gap-2"><Clock3 className="h-4 w-4 text-pink-200" /><h3 className="text-sm font-semibold">Day and night cycle</h3></div>
            <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2"><span className="text-sm">{formatTime(hour)} <span className="text-white/60">· {timePhase(hour)}</span></span><span aria-label={timePhase(hour)} className="text-xl">{hour >= 6 && hour < 19 ? '☀️' : '🌙'}</span></div>
            <input aria-label="Set story time" type="range" min="0" max="23" value={hour} onChange={(event) => { const next = Number(event.target.value); setHour(next); saveWorld(next); }} className="mt-3 w-full accent-pink-400" />
            <div className="mt-2 flex justify-between text-[10px] text-white/55"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span></div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-white/25 bg-white/10 p-3 text-xs text-white/80">
              <input type="checkbox" checked={autoCycle} onChange={(event) => { const enabled = event.target.checked; setAutoCycle(enabled); onSave({ ...chat, timeCycleEnabled: enabled, updatedAt: new Date().toISOString() }); }} className="accent-pink-400" />
              Advance one hour after each AI reply
            </label>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => advance(-1)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-white/35 bg-white/10 px-3 py-2 text-xs hover:bg-white/20"><Minus className="h-3.5 w-3.5" />Back 1 hour</button>
              <button type="button" onClick={() => advance(1)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-white/35 bg-white/10 px-3 py-2 text-xs hover:bg-white/20"><Plus className="h-3.5 w-3.5" />Advance 1 hour</button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/35 bg-white/10 p-4">
            <div className="mb-3 flex items-center gap-2"><GitBranch className="h-4 w-4 text-pink-200" /><h3 className="text-sm font-semibold">Branch this storyline</h3></div>
            <p className="mb-2 text-xs text-white/65">Start a separate chat from the full conversation and give the new path a different direction.</p>
            {!branching ? <button type="button" onClick={() => setBranching(true)} className="w-full rounded-xl border border-white/45 bg-gradient-to-r from-pink-500/70 to-violet-500/60 px-3 py-2.5 text-sm font-semibold shadow-[0_0_18px_rgba(242,10,168,.25)]">Create a story branch</button> : (
              <div className="space-y-2">
                <textarea autoFocus value={direction} onChange={(event) => setDirection(event.target.value)} maxLength={500} placeholder="What changes in this version? (e.g. the storm knocks out the power)" className="min-h-20 w-full rounded-xl border border-white/45 bg-white/15 p-3 text-sm text-white placeholder:text-white/55" />
                <div className="flex justify-between gap-2"><button type="button" onClick={() => setBranching(false)} className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs">Cancel</button><button type="button" disabled={!direction.trim()} onClick={() => onCreateBranch(direction.trim())} className="rounded-xl bg-pink-500 px-4 py-2 text-xs font-bold disabled:opacity-40">Fork this story</button></div>
              </div>
            )}
          </section>

          <button type="button" onClick={onClose} className="w-full rounded-xl border border-white/40 bg-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/25">Done</button>
        </div>
      </section>
    </div>
  );
};
