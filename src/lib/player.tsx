import type React from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { searchSongs, type Track } from "./innertube.functions";

export type Playlist = { id: string; name: string; tracks: Track[] };

type Ctx = {
  current: Track | null;
  queue: Track[];
  playing: boolean;
  volume: number;
  progress: number;
  duration: number;
  playTrack: (t: Track, queue?: Track[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (s: number) => void;
  setVolume: (v: number) => void;
  liked: Track[];
  toggleLike: (t: Track) => void;
  isLiked: (id: string) => boolean;
  playlists: Playlist[];
  createPlaylist: (name: string, tracks?: Track[]) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (pid: string, t: Track) => void;
  removeFromPlaylist: (pid: string, tid: string) => void;
  history: string[];
  addHistory: (q: string) => void;
  clearHistory: () => void;
  recent: Track[];
  clearRecent: () => void;
  shuffle: boolean;
  toggleShuffle: () => void;
  repeat: "off" | "all" | "one";
  cycleRepeat: () => void;
};

// Keep one context instance across hot reloads so provider and hooks always match.
const g = globalThis as unknown as { __rpPlayerCtx?: React.Context<Ctx | null> };
const PlayerCtx = (g.__rpPlayerCtx ??= createContext<Ctx | null>(null));
export const usePlayer = () => {
  const c = useContext(PlayerCtx);
  if (!c) throw new Error("PlayerProvider missing");
  return c;
};

function useStored<T>(key: string, init: T) {
  const [v, setV] = useState<T>(init);
  const loaded = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setV(JSON.parse(raw));
    } catch {}
    loaded.current = true;
  }, [key]);
  useEffect(() => {
    if (loaded.current) localStorage.setItem(key, JSON.stringify(v));
  }, [key, v]);
  return [v, setV] as const;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const ytRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVol] = useStored("rp.volume", 80);
  const [liked, setLiked] = useStored<Track[]>("rp.liked", []);
  const [playlists, setPlaylists] = useStored<Playlist[]>("rp.playlists", []);
  const [history, setHistory] = useStored<string[]>("rp.history", []);
  const [recent, setRecent] = useStored<Track[]>("rp.recent", []);
  const [shuffle, setShuffle] = useStored("rp.shuffle", false);
  const [repeat, setRepeat] = useStored<"off" | "all" | "one">("rp.repeat", "off");
  const nextRef = useRef<() => void>(() => {});
  // Tracks whether the user intends music to play, so we can fight
  // the browser auto-pausing the player when the screen is off / tab hidden.
  const wantPlay = useRef(false);
  // Silent looping <audio> keeps Android browsers/WebViews treating the page as
  // an active media session, so the tab isn't frozen when the screen is off.
  const keepAlive = useRef<HTMLAudioElement | null>(null);
  const keep = (on: boolean) => {
    if (typeof window === "undefined") return;
    if (!keepAlive.current) {
      const n = 8000, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
      const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
      w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVEfmt "); v.setUint32(16, 16, true);
      v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true);
      v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, "data"); v.setUint32(40, n, true);
      for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
      const a = new Audio(URL.createObjectURL(new Blob([buf], { type: "audio/wav" })));
      a.loop = true;
      a.setAttribute("playsinline", "");
      keepAlive.current = a;
    }
    if (on) keepAlive.current.play().catch(() => {});
    else keepAlive.current.pause();
  };


  useEffect(() => {
    const resume = () => {
      if (wantPlay.current) ytRef.current?.playVideo?.();
    };
    const onVis = () => {
      if (document.hidden) {
        setTimeout(resume, 50);
        setTimeout(resume, 400);
        setTimeout(resume, 1200);
      } else resume();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", resume);
    window.addEventListener("blur", () => setTimeout(resume, 300));
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", resume);
    };
  }, []);

  useEffect(() => {
    const init = () => {
      ytRef.current = new window.YT.Player("yt-hidden-player", {
        height: "1",
        width: "1",
        playerVars: { playsinline: 1, controls: 0 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e: any) => {
            if (e.data === 1) setPlaying(true);
            if (e.data === 2) {
              // Paused by the browser in background, not by the user → resume
              if (wantPlay.current && document.hidden) {
                setTimeout(() => ytRef.current?.playVideo?.(), 100);
                return;
              }
              setPlaying(false);
            }
            if (e.data === 0) nextRef.current();
            if ("mediaSession" in navigator) {
              navigator.mediaSession.playbackState = e.data === 1 ? "playing" : e.data === 2 ? "paused" : navigator.mediaSession.playbackState;
            }
          },
          onError: () => nextRef.current(),
        },
      });
    };
    if (window.YT?.Player) init();
    else {
      window.onYouTubeIframeAPIReady = init;
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(s);
    }
    const iv = setInterval(() => {
      const p = ytRef.current;
      if (p?.getCurrentTime) {
        setProgress(p.getCurrentTime() || 0);
        setDuration(p.getDuration() || 0);
      }
    }, 500);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (ready) ytRef.current?.setVolume(volume);
  }, [ready, volume]);

  const playTrack = useCallback(
    (t: Track, q?: Track[]) => {
      setCurrent(t);
      setRecent((r) => [t, ...r.filter((x) => x.id !== t.id)].slice(0, 20));
      if (q) setQueue(q);
      else setQueue((old) => (old.some((o) => o.id === t.id) ? old : [...old, t]));
      wantPlay.current = true;
      ytRef.current?.loadVideoById?.(t.id);
      setPlaying(true);
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: t.title,
          artist: t.artist,
          album: t.album ?? "",
          artwork: [{ src: t.thumb, sizes: "400x400" }],
        });
      }
    },
    [],
  );

  // Auto-fill "Up next" with similar songs when the queue is about to run out.
  const filling = useRef("");
  useEffect(() => {
    if (!current) return;
    const i = queue.findIndex((q) => q.id === current.id);
    if (queue.length - 1 - i >= 5 || filling.current === current.id) return;
    filling.current = current.id;
    const artist = current.artist.split(/,|&/)[0]!.trim();
    Promise.all([
      searchSongs({ data: { q: `${current.title} ${artist} radio` } }).catch(() => []),
      searchSongs({ data: { q: `songs like ${artist}` } }).catch(() => []),
    ]).then(([a, b]) => {
      const found = ([...(a as Track[]), ...(b as Track[])]);
      setQueue((old) => {
        const seen = new Set(old.map((o) => o.id));
        const add = found.filter((f) => !seen.has(f.id) && (seen.add(f.id), true)).slice(0, 15);
        return [...old, ...add];
      });
    });
  }, [current, queue]);

  const step = (dir: 1 | -1) => {
    if (!current || !queue.length) return;
    const i = queue.findIndex((q) => q.id === current.id);
    if (dir === 1 && !shuffle && repeat === "off" && i === queue.length - 1) return;
    const idx = shuffle && queue.length > 1 ? (i + 1 + Math.floor(Math.random() * (queue.length - 1))) % queue.length : (i + dir + queue.length) % queue.length;
    const n = queue[idx];
    if (n) playTrack(n);
  };
  const next = () => step(1);
  const prev = () => {
    if (progress > 4) ytRef.current?.seekTo(0, true);
    else step(-1);
  };
  nextRef.current = () => {
    if (repeat === "one") {
      ytRef.current?.seekTo(0, true);
      ytRef.current?.playVideo?.();
    } else next();
  };

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("nexttrack", () => nextRef.current());
    navigator.mediaSession.setActionHandler("previoustrack", prev);
    navigator.mediaSession.setActionHandler("play", () => {
      wantPlay.current = true;
      ytRef.current?.playVideo?.();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      wantPlay.current = false;
      ytRef.current?.pauseVideo?.();
      setPlaying(false);
    });
  });

  const toggle = () => {
    const p = ytRef.current;
    if (!p || !current) return;
    if (playing) {
      wantPlay.current = false;
      p.pauseVideo();
    } else {
      wantPlay.current = true;
      p.playVideo();
    }
    setPlaying(!playing);
  };

  const value: Ctx = {
    current,
    queue,
    playing,
    volume,
    progress,
    duration,
    playTrack,
    toggle,
    next,
    prev,
    seek: (s) => ytRef.current?.seekTo(s, true),
    setVolume: setVol,
    liked,
    isLiked: (id) => liked.some((l) => l.id === id),
    toggleLike: (t) => setLiked((l) => (l.some((x) => x.id === t.id) ? l.filter((x) => x.id !== t.id) : [t, ...l])),
    playlists,
    createPlaylist: (name, tracks = []) => setPlaylists((p) => [...p, { id: crypto.randomUUID(), name, tracks }]),
    deletePlaylist: (id) => setPlaylists((p) => p.filter((x) => x.id !== id)),
    addToPlaylist: (pid, t) =>
      setPlaylists((p) =>
        p.map((x) => (x.id === pid && !x.tracks.some((y) => y.id === t.id) ? { ...x, tracks: [...x.tracks, t] } : x)),
      ),
    removeFromPlaylist: (pid, tid) =>
      setPlaylists((p) => p.map((x) => (x.id === pid ? { ...x, tracks: x.tracks.filter((y) => y.id !== tid) } : x))),
    history,
    addHistory: (q) => setHistory((h) => [q, ...h.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 15)),
    clearHistory: () => setHistory([]),
    recent,
    clearRecent: () => setRecent([]),
    shuffle,
    toggleShuffle: () => setShuffle((s) => !s),
    repeat,
    cycleRepeat: () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
  };

  return (
    <PlayerCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px overflow-hidden" aria-hidden>
        <div id="yt-hidden-player" />
      </div>
    </PlayerCtx.Provider>
  );
}

export const fmt = (s: number) => {
  if (!s || !isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};
