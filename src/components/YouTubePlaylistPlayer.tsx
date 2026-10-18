import React, { useEffect, useRef, useState } from 'react';
import { ListMusic, Maximize2, Minimize2, Music2, Pause, Play, Plus, SkipBack, SkipForward, Trash2, X } from 'lucide-react';

interface YouTubeTrack {
  videoId: string;
  title: string;
}

interface YouTubePlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  getPlayerState: () => number;
  getVideoData: () => { title?: string };
  setSize?: (width: number, height: number) => void;
  destroy: () => void;
}

interface YouTubePlayerOptions {
  videoId?: string;
  width: string;
  height: string;
  playerVars: Record<string, string | number>;
  events: {
    onReady: (event: { target: YouTubePlayerInstance }) => void;
    onStateChange: (event: { target: YouTubePlayerInstance; data: number }) => void;
  };
}

declare global {
  interface Window {
    YT?: { Player: new (element: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayerInstance };
  }
}

interface YouTubePlaylistPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'plf_youtube_playlist_v1';

function readPlaylist(): YouTubeTrack[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved)
      ? saved.filter((item): item is YouTubeTrack =>
          item && typeof item.videoId === 'string' && /^[\w-]{11}$/.test(item.videoId) && typeof item.title === 'string')
      : [];
  } catch {
    return [];
  }
}

function getVideoId(input: string): string | null {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    let id = '';
    if (host === 'youtu.be') {
      id = url.pathname.split('/').filter(Boolean)[0] || '';
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      id = url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] || '';
    }
    return /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const YouTubePlaylistPlayer: React.FC<YouTubePlaylistPlayerProps> = ({ isOpen, onClose }) => {
  const [playlist, setPlaylist] = useState<YouTubeTrack[]>(readPlaylist);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [videoInput, setVideoInput] = useState('');
  const [notice, setNotice] = useState('');
  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const playerReadyRef = useRef(false);
  const playlistRef = useRef(playlist);
  const currentIndexRef = useRef(currentIndex);
  const pendingVideoIdRef = useRef<string | null>(null);
  const pendingAutoPlayRef = useRef(false);
  const activeTrackRef = useRef<HTMLButtonElement | null>(null);

  playlistRef.current = playlist;
  currentIndexRef.current = currentIndex;

  const savePlaylist = (next: YouTubeTrack[]) => {
    playlistRef.current = next;
    setPlaylist(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setNotice('Could not save the playlist on this device.');
    }
  };

  const playTrack = (index: number) => {
    const track = playlistRef.current[index];
    if (!track) return;
    currentIndexRef.current = index;
    setCurrentIndex(index);
    pendingVideoIdRef.current = track.videoId;
    pendingAutoPlayRef.current = true;
    setIsPlaying(true);
    if (playerRef.current && playerReadyRef.current) {
      playerRef.current.loadVideoById(track.videoId);
      pendingVideoIdRef.current = null;
      pendingAutoPlayRef.current = false;
    }
  };

  const playNext = () => {
    const queue = playlistRef.current;
    if (!queue.length) return;
    if (queue.length === 1) {
      setIsPlaying(false);
      return;
    }
    playTrack((currentIndexRef.current + 1) % queue.length);
  };

  const updatePlayingTitle = (player: YouTubePlayerInstance) => {
    const title = player.getVideoData?.().title?.trim();
    const index = currentIndexRef.current;
    const queue = playlistRef.current;
    if (!title || !queue[index] || queue[index].title === title) return;
    const next = queue.map((track, trackIndex) => trackIndex === index ? { ...track, title } : track);
    savePlaylist(next);
  };

  useEffect(() => {
    activeTrackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let disposed = false;
    let pollId = 0;

    const createPlayer = () => {
      if (disposed || !window.YT?.Player || !playerHostRef.current || playerRef.current) return;
      const selected = playlistRef.current[currentIndexRef.current];
      playerReadyRef.current = false;
      playerRef.current = new window.YT.Player(playerHostRef.current, {
        videoId: selected?.videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            playerReadyRef.current = true;
            const pending = pendingVideoIdRef.current;
            if (pending) {
              event.target.loadVideoById(pending);
              pendingVideoIdRef.current = null;
              pendingAutoPlayRef.current = false;
            } else if (playlistRef.current[currentIndexRef.current]) {
              event.target.cueVideoById(playlistRef.current[currentIndexRef.current].videoId);
            }
            window.setTimeout(() => updatePlayingTitle(event.target), 700);
          },
          onStateChange: (event) => {
            setIsPlaying(event.data === 1);
            if (event.data === 1) {
              window.setTimeout(() => updatePlayingTitle(event.target), 600);
            }
            if (event.data === 0) playNext();
          },
        },
      });
    };

    if (!window.YT?.Player && !document.getElementById('plf-youtube-iframe-api')) {
      const script = document.createElement('script');
      script.id = 'plf-youtube-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }

    pollId = window.setInterval(() => {
      if (window.YT?.Player) {
        window.clearInterval(pollId);
        createPlayer();
      }
    }, 100);

    return () => {
      disposed = true;
      window.clearInterval(pollId);
      try { playerRef.current?.pauseVideo(); } catch {}
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
      playerReadyRef.current = false;
      setIsPlaying(false);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isCollapsed || !playerRef.current || !playerReadyRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      const host = playerHostRef.current;
      if (host) playerRef.current?.setSize?.(host.clientWidth, host.clientHeight);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isCollapsed, isOpen]);

  const addVideo = (event: React.FormEvent) => {
    event.preventDefault();
    const videoId = getVideoId(videoInput);
    if (!videoId) {
      setNotice('Paste a YouTube video link or an 11-character video ID.');
      return;
    }
    const next = [...playlistRef.current, { videoId, title: 'Loading video title…' }];
    savePlaylist(next);
    setVideoInput('');
    setNotice('Added to your playlist.');
    if (next.length === 1 || !isPlaying) playTrack(next.length - 1);
  };

  const removeTrack = (index: number) => {
    const next = playlistRef.current.filter((_, itemIndex) => itemIndex !== index);
    const wasCurrent = index === currentIndexRef.current;
    const nextIndex = Math.max(0, Math.min(currentIndexRef.current - (index < currentIndexRef.current ? 1 : 0), next.length - 1));
    savePlaylist(next);
    if (!next.length) {
      currentIndexRef.current = 0;
      setCurrentIndex(0);
      playerRef.current?.pauseVideo();
      setIsPlaying(false);
      return;
    }
    if (wasCurrent) playTrack(nextIndex);
    else {
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
    }
  };

  const currentTrack = playlist[currentIndex] || null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none" aria-label="YouTube playlist player">
      <style>{'@keyframes plf-track-marquee { 0%, 12% { transform: translateX(0); } 88%, 100% { transform: translateX(-48%); } } .plf-track-marquee { display:inline-block; min-width:max-content; animation:plf-track-marquee 12s linear infinite alternate; } .plf-track-row::-webkit-scrollbar { height:5px; width:5px; } .plf-track-row::-webkit-scrollbar-thumb { background:#ef22b7; border-radius:999px; }'}</style>
      <section className={isCollapsed
        ? 'pointer-events-auto absolute bottom-24 right-3 w-[230px] rounded-2xl border border-white/60 bg-[#25152f]/90 p-2 text-white shadow-[0_0_30px_rgba(233,28,177,0.5)] backdrop-blur-2xl'
        : 'pointer-events-auto absolute right-3 top-3 flex max-h-[88dvh] w-[min(94vw,390px)] flex-col overflow-hidden rounded-3xl border border-white/60 bg-[#25152f]/90 p-3 text-white shadow-[0_0_40px_rgba(233,28,177,0.55)] backdrop-blur-2xl'}
        role="dialog" aria-modal="false" aria-label="YouTube scrolling playlist">
        <header className="mb-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/60 bg-white/20 shadow-inner">
              <Music2 className="h-4 w-4 text-pink-100" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-[.2em] text-pink-100">Aether Radio</div>
              {!isCollapsed && <div className="text-[10px] text-white/70">YouTube scrolling playlist</div>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => setIsCollapsed((value) => !value)} className="rounded-full border border-white/40 bg-white/15 p-1.5 text-white hover:bg-pink-500/40" aria-label={isCollapsed ? 'Expand player' : 'Minimize player'} title={isCollapsed ? 'Expand player' : 'Minimize player'}>
              {isCollapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => { playerRef.current?.pauseVideo(); onClose(); }} className="rounded-full border border-white/40 bg-white/15 p-1.5 text-white hover:bg-pink-500/40" aria-label="Close and stop player" title="Close and stop player">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {!isCollapsed && (
          <form onSubmit={addVideo} className="mb-2 flex gap-2">
            <input
              value={videoInput}
              onChange={(event) => setVideoInput(event.target.value)}
              placeholder="Paste a YouTube video link"
              aria-label="YouTube video link"
              className="min-w-0 flex-1 rounded-xl border border-white/40 bg-white/15 px-3 py-2 text-xs text-white outline-none placeholder:text-white/60 focus:border-pink-200"
            />
            <button type="submit" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-[#d90091] to-[#ff27b9] text-white shadow-lg" aria-label="Add video to playlist" title="Add video">
              <Plus className="h-4 w-4" />
            </button>
          </form>
        )}

        <div className={isCollapsed ? 'mb-2 overflow-hidden rounded-xl border border-white/40 bg-black/25' : 'mb-2 overflow-hidden rounded-2xl border border-white/50 bg-black/30'}>
          <div ref={playerHostRef} className={isCollapsed ? 'h-[200px] w-full' : 'aspect-video min-h-[200px] w-full'} />
        </div>

        {currentTrack && (
          <div className="mb-2 overflow-hidden rounded-xl border border-white/25 bg-white/10 px-3 py-2">
            <div className="mb-1 text-[9px] font-bold uppercase tracking-[.2em] text-pink-100">Now playing</div>
            <div className="overflow-hidden whitespace-nowrap text-sm font-semibold">
              <span className="plf-track-marquee">
                {playlist.length ? (currentTrack.title || 'YouTube video') + '　✦　' + (currentTrack.title || 'YouTube video') : 'YouTube playlist'}
              </span>
            </div>
          </div>
        )}

        <div className="mb-2 flex items-center justify-center gap-3">
          <button type="button" disabled={!playlist.length} onClick={() => playTrack((currentIndex - 1 + playlist.length) % playlist.length)} className="rounded-full border border-white/40 bg-white/15 p-2 text-white disabled:opacity-40" aria-label="Previous video" title="Previous video">
            <SkipBack className="h-4 w-4" />
          </button>
          <button type="button" disabled={!currentTrack} onClick={() => {
            if (!currentTrack) return;
            if (isPlaying) { playerRef.current?.pauseVideo(); setIsPlaying(false); }
            else { playerRef.current?.playVideo(); setIsPlaying(true); }
          }} className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-gradient-to-r from-[#d90091] to-[#ff27b9] text-white shadow-[0_0_18px_rgba(255,20,180,0.55)] disabled:opacity-40" aria-label={isPlaying ? 'Pause video' : 'Play video'} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
          </button>
          <button type="button" disabled={!playlist.length} onClick={playNext} className="rounded-full border border-white/40 bg-white/15 p-2 text-white disabled:opacity-40" aria-label="Next video" title="Next video">
            <SkipForward className="h-4 w-4" />
          </button>
          <button type="button" disabled={!playlist.length} onClick={() => {
            const confirmed = window.confirm('Clear every video from this playlist?');
            if (!confirmed) return;
            savePlaylist([]);
            currentIndexRef.current = 0;
            setCurrentIndex(0);
            playerRef.current?.pauseVideo();
            setIsPlaying(false);
            setNotice('Playlist cleared.');
          }} className="rounded-full border border-white/40 bg-white/15 p-2 text-white disabled:opacity-40" aria-label="Clear playlist" title="Clear playlist">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {!isCollapsed && (
          <>
            <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.18em] text-white/70">
              <span><ListMusic className="mr-1 inline h-3 w-3" /> Playlist</span>
              <span>{playlist.length} {playlist.length === 1 ? 'video' : 'videos'}</span>
            </div>
            <div className="plf-track-row max-h-36 overflow-y-auto rounded-xl border border-white/25 bg-black/20 p-1">
              {playlist.length ? playlist.map((track, index) => (
                <div key={track.videoId + '-' + index} className={'flex items-center gap-1 rounded-lg px-1 ' + (index === currentIndex ? 'bg-pink-500/35' : 'hover:bg-white/10')}>
                  <button
                    ref={index === currentIndex ? activeTrackRef : null}
                    type="button"
                    onClick={() => playTrack(index)}
                    className="min-w-0 flex-1 overflow-hidden py-2 text-left text-xs text-white"
                    title={track.title}
                  >
                    <span className="mr-2 inline-block w-5 text-center text-pink-100">{index === currentIndex && isPlaying ? '♫' : String(index + 1).padStart(2, '0')}</span>
                    <span className={index === currentIndex ? 'plf-track-marquee' : 'inline-block max-w-[80%] truncate align-bottom'}>{track.title}</span>
                  </button>
                  <button type="button" onClick={() => removeTrack(index)} className="rounded-full p-1.5 text-white/70 hover:bg-pink-500/40 hover:text-white" aria-label={'Remove ' + track.title}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )) : <div className="px-2 py-4 text-center text-xs text-white/60">Add videos to start your mix.</div>}
            </div>
          </>
        )}

        {notice && !isCollapsed && <p role="status" className="mt-1 text-[10px] text-pink-100">{notice}</p>}
        {!isCollapsed && <p className="mt-2 text-[9px] leading-relaxed text-white/55">Video audio plays from the visible YouTube player. Playback may need a tap on YouTube’s play control in Safari.</p>}
      </section>
    </div>
  );
};
