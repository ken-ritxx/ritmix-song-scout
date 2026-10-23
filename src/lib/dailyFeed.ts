import { applyEvent, buildQueue, emptyTaste, scoreTrack, type PlayEvent, type Taste, type Track } from "./recommender";

export const MIXES = [
  { key: "for_you", title: "For you", query: "top hits songs" },
  { key: "discovery", title: "Discovery", query: "new indie songs" },
  { key: "energy", title: "Energy", query: "party workout songs" },
  { key: "chill", title: "Chill", query: "lofi chill songs" },
  { key: "late_night", title: "Late night", query: "sad acoustic songs" },
] as const;
export type DailyFeed = { date: string; mixes: { key: string; title: string; tracks: Track[] }[] };
export function calendarDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function longTermTaste(events: PlayEvent[], likedIds: string[], now = Date.now()): Taste {
  let taste = emptyTaste();
  for (const event of events.filter((e) => now - e.timestamp <= 90 * 864e5).sort((a, b) => a.timestamp - b.timestamp)) {
    const repetitions = now - event.timestamp <= 7 * 864e5 ? 3 : 1;
    // Recency boosts preference contributions, not the actual play count.
    const before = taste.plays[event.track.id] ?? 0;
    for (let i = 0; i < repetitions; i++) taste = applyEvent(taste, event.track, event.eventType, event.timestamp);
    if (event.eventType === "play" || event.eventType === "replay") taste.plays[event.track.id] = before + 1;
  }
  return { ...taste, likedIds };
}
export function generateDailyFeed(candidates: Track[], events: PlayEvent[], likedIds: string[], now = new Date(), random: () => number = Math.random): DailyFeed {
  const taste = longTermTaste(events, likedIds, now.getTime());
  return { date: calendarDate(now), mixes: MIXES.map((mix) => {
    const pool = candidates.filter((t) => mix.key === "discovery" ? !taste.plays[t.id]
      : mix.key === "energy" ? t.energy >= 0.7 : mix.key === "chill" ? t.energy <= 0.5
      : mix.key === "late_night" ? t.tempo <= 100 && t.valence <= 0.5 : true);
    const ranked = [...pool].sort((a, b) => scoreTrack(b, taste, now.getTime(), () => 0) - scoreTrack(a, taste, now.getTime(), () => 0));
    // Reserve 15% (3 of 20) for exploration outside the top ranking.
    const top = buildQueue(ranked.slice(0, 30), taste, 17, undefined, () => 1, now.getTime());
    const used = new Set(top.map((t) => t.id));
    const extras = pool.filter((t) => !used.has(t.id)).map((track) => ({ track, random: random() })).sort((a, b) => b.random - a.random).map((x) => x.track);
    const injection = buildQueue(extras, taste, 3, top.at(-1)?.artist, () => 1, now.getTime());
    return { key: mix.key, title: mix.title, tracks: [...top, ...injection] };
  }) };
}