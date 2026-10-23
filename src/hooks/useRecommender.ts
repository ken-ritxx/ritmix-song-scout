import { useCallback, useEffect, useRef, useState } from "react";
import type { Track as YouTubeTrack } from "@/lib/innertube.functions";
import { applyEvent, describeTrack, emptyTaste, sessionQueue, type EventType, type PlayEvent, type Taste, type Track } from "@/lib/recommender";

const STORAGE_KEY = "rp.recommendations.v1";
type Stored = { taste: Taste; events: PlayEvent[]; catalog: Track[]; onboarding: number };
const fresh = (): Stored => ({ taste: emptyTaste(), events: [], catalog: [], onboarding: 0 });

export function useRecommender(liked: YouTubeTrack[], recent: YouTubeTrack[], current: YouTubeTrack | null) {
  const [state, setState] = useState<Stored>(fresh);
  const [ready, setReady] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const stateRef = useRef(state);
  const currentRef = useRef(current);
  currentRef.current = current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const update = useCallback((value: Stored) => { stateRef.current = value; setState(value); }, []);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as Stored;
          if (stored.taste?.tagWeights && Array.isArray(stored.events) && Array.isArray(stored.catalog)) update(stored);
        }
      } catch { /* Keep listening even when browser storage is unavailable. */ }
    };
    load(); setReady(true);
    const sync = (event: StorageEvent) => { if (event.key === STORAGE_KEY) load(); };
    const flush = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current)); } catch {} };
    window.addEventListener("storage", sync);
    window.addEventListener("pagehide", flush);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("pagehide", flush); clearTimeout(timer.current); flush(); };
  }, [update]);

  useEffect(() => {
    if (!ready) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current)); } catch {} }, 3000);
  }, [state, ready]);

  const addCandidates = useCallback((tracks: YouTubeTrack[], hint = "") => {
    const previous = stateRef.current;
    const catalog = new Map(previous.catalog.map((t) => [t.id, t]));
    for (const track of tracks) {
      const described = describeTrack(track, hint);
      const existing = catalog.get(track.id);
      catalog.set(track.id, existing?.tags.length && !described.tags.length ? existing : described);
    }
    update({ ...previous, catalog: [...catalog.values()] });
  }, [update]);

  useEffect(() => {
    if (!ready) return;
    addCandidates([...liked, ...recent]);
    const value = stateRef.current;
    update({ ...value, taste: { ...value.taste, likedIds: liked.map((t) => t.id) } });
  }, [liked, recent, ready, addCandidates, update]);

  useEffect(() => {
    if (!ready) return;
    const track = current ? state.catalog.find((t) => t.id === current.id) ?? describeTrack(current) : null;
    // Songs already played in this session are penalized by lastPlayed, but may
    // return later for repeat/shuffle; only the current track is always excluded.
    const pool = track?.tags.length ? state.catalog.filter((t) => t.tags.some((tag) => track.tags.includes(tag))) : state.catalog;
    setQueue(sessionQueue(pool, state.taste, track));
  }, [state, current, ready]);

  const record = useCallback((track: YouTubeTrack, eventType: EventType, position_sec = 0, duration_sec = 0, source = "player") => {
    const value = stateRef.current;
    const described = value.catalog.find((t) => t.id === track.id) ?? describeTrack(track);
    const now = new Date();
    const event: PlayEvent = { id: crypto.randomUUID(), track: described, eventType, timestamp: now.getTime(), position_sec, duration_sec,
      context: { hour: now.getHours(), dayofweek: now.getDay(), source } };
    const catalog = [...new Map([...value.catalog, described].map((t) => [t.id, t])).values()];
    update({ ...value, catalog, taste: applyEvent(value.taste, described, eventType, event.timestamp), events: [...value.events, event] });
  }, [update]);

  const onboard = useCallback((track: YouTubeTrack, liked: boolean) => {
    record(track, liked ? "like" : "skip", 0, 0, "onboarding");
    const value = { ...stateRef.current, onboarding: stateRef.current.onboarding + 1 };
    update(value);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch {}
  }, [record, update]);

  return { ...state, ready, queue, record, addCandidates, onboard };
}