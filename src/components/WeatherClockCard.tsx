import React, { useEffect, useState } from 'react';
import { CloudSun, MapPin, RefreshCw } from 'lucide-react';

type Weather = { temperature: number; code: number; apparent: number; city: string };
const labels: Record<number,string> = { 0:'Clear sky',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Icy fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',80:'Showers',81:'Showers',82:'Heavy showers',95:'Thunderstorm',96:'Thunderstorm',99:'Thunderstorm' };
export function WeatherClockCard() {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<Weather | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 30_000); return () => window.clearInterval(id); }, []);
  const load = () => {
    if (!navigator.geolocation) { setError('Location is not available in this browser.'); return; }
    setBusy(true); setError('');
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`);
        if (!response.ok) throw new Error('Weather service is unavailable.');
        const data = await response.json();
        let city = 'Your location';
        try { const place = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`); const placeData = await place.json(); city = placeData.results?.[0]?.name || city; } catch {}
        setWeather({ temperature: Math.round(data.current.temperature_2m), apparent: Math.round(data.current.apparent_temperature), code: data.current.weather_code, city });
      } catch (e: any) { setError(e.message || 'Could not get the weather.'); }
      finally { setBusy(false); }
    }, (e) => { setBusy(false); setError(e.code === 1 ? 'Allow location to show local weather.' : 'Could not read your location.'); }, { timeout: 10000, maximumAge: 600000 });
  };
  return <section className="rounded-xl border border-[#ff66b2]/30 bg-white/5 p-3">
    <div className="flex items-center justify-between"><h3 className="text-[10px] font-bold uppercase tracking-widest text-[#ff99cc]">Live time &amp; weather</h3><CloudSun className="h-4 w-4 text-sky-200" /></div>
    <p className="mt-2 text-xl font-bold text-white">{new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(now)}</p>
    <p className="text-[10px] text-white/55">{new Intl.DateTimeFormat(undefined,{weekday:'long',month:'short',day:'numeric',timeZoneName:'short'}).format(now)}</p>
    {weather ? <p className="mt-2 text-xs text-white/80">{weather.city} · {weather.temperature}°C · {labels[weather.code] || 'Current conditions'}<span className="block text-[10px] text-white/50">Feels like {weather.apparent}°C</span></p> : <p className="mt-2 text-[10px] text-white/55">Weather is optional and only loads when you ask.</p>}
    <button type="button" disabled={busy} onClick={load} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500/20 p-2 text-xs font-semibold text-sky-100 hover:bg-sky-500/30 disabled:opacity-50">{busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}{busy ? 'Loading local weather…' : weather ? 'Refresh weather' : 'Use my location'}</button>
    {error && <p role="status" className="mt-2 text-[10px] text-amber-200">{error}</p>}
  </section>;
}
