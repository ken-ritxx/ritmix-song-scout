import type { Track as YouTubeTrack } from "./innertube.functions";

export type Track = YouTubeTrack & { tags: string[]; energy: number; tempo: number; valence: number };
export type EventType = "like" | "unlike" | "save" | "replay" | "complete" | "play" | "skip" | "quick_skip" | "pause" | "resume" | "seek" | "error";
export type Taste = {
  tagWeights: Record<string, number>;
  artistAffinity: Record<string, number>;
  avgEnergy: number;
  avgTempo: number;
  sessionEnergy: number;
  sessionTempo: number;
  likedIds: string[];
  plays: Record<string, number>;
  lastPlayed: Record<string, number>;
};
export type PlayEvent = {
  id: string; track: Track; eventType: EventType; timestamp: number;
  position_sec: number; duration_sec: number;
  context: { hour: number; dayofweek: number; source: string };
};
export const EVENT_WEIGHTS = { like: 1.2, save: 1.4, replay: 1, complete: 0.6, play: 0.2, skip: -0.6, quick_skip: -1 } as const;
export const emptyTaste = (): Taste => ({ tagWeights: {}, artistAffinity: {}, avgEnergy: 0.5, avgTempo: 110, sessionEnergy: 0.5, sessionTempo: 110, likedIds: [], plays: {}, lastPlayed: {} });

// YouTube search has no measured audio features. These are conservative text-based
// estimates, not acoustic analysis; unknown songs retain neutral values.
const MOODS: { tag: string; pattern: RegExp; energy: number; tempo: number; valence: number; query: string }[] = [
  { tag: "sad", pattern: /sad|dard|judai|tanha|alone|lonely|cry|heartbreak|bewafa|udaas|gham|tears|goodbye/i, energy: 0.3, tempo: 85, valence: 0.2, query: "sad songs" },
  { tag: "romance", pattern: /love|pyaar|pyar|ishq|mohabbat|romantic|sanam|jaan|valentine/i, energy: 0.45, tempo: 95, valence: 0.65, query: "romantic love songs" },
  { tag: "party", pattern: /party|dance|club|dj|remix|edm|bounce|nach/i, energy: 0.85, tempo: 128, valence: 0.8, query: "party dance hits" },
  { tag: "chill", pattern: /lofi|lo-fi|chill|relax|calm|sleep|neend|rain|acoustic|unplugged/i, energy: 0.25, tempo: 80, valence: 0.45, query: "lofi chill songs" },
  { tag: "workout", pattern: /gym|workout|pump|beast|power|motivat/i, energy: 0.9, tempo: 135, valence: 0.7, query: "gym workout songs" },
  { tag: "phonk", pattern: /phonk|drift/i, energy: 0.85, tempo: 130, valence: 0.4, query: "phonk songs" },
  { tag: "hip-hop", pattern: /rap|hip.?hop|trap|desi hip/i, energy: 0.7, tempo: 115, valence: 0.5, query: "hip hop rap songs" },
  { tag: "sufi", pattern: /sufi|qawwali|devotional|bhajan|spiritual/i, energy: 0.4, tempo: 90, valence: 0.5, query: "sufi songs" },
  { tag: "rock", pattern: /rock|metal|anthem/i, energy: 0.8, tempo: 125, valence: 0.6, query: "rock songs" },
  { tag: "bollywood", pattern: /bollywood|hindi|filmi/i, energy: 0.5, tempo: 110, valence: 0.5, query: "bollywood songs" },
  { tag: "punjabi", pattern: /punjabi|bhangra/i, energy: 0.75, tempo: 120, valence: 0.7, query: "punjabi hits" },
];
export function describeTrack(track: YouTubeTrack, hint = ""): Track {
  const text = `${track.title} ${track.artist} ${track.album ?? ""}`;
  const matched = MOODS.filter((m) => m.pattern.test(text));
  const moods = matched.length ? matched : MOODS.filter((m) => m.pattern.test(hint));
  const main = moods[0];
  return { ...track, tags: moods.map((m) => m.tag), energy: main?.energy ?? 0.5, tempo: main?.tempo ?? 110, valence: main?.valence ?? 0.5 };
}
export function relatedQuery(track: Track) {
  const mood = MOODS.find((m) => track.tags.includes(m.tag));
  const artist = track.artist.split(/,|&/)[0]?.trim() || track.artist;
  return { artist: `${artist} ${mood?.query ?? `${track.title} radio`}`, mood: mood?.query ?? `songs like ${artist}` };
}
const clamp = (n: number) => Math.max(0, Math.min(1, n));
export function scoreTrack(track: Track, taste: Taste, now = Date.now(), random: () => number = Math.random): number {
  const last = taste.lastPlayed[track.id];
  const hours = last === undefined ? Infinity : (now - last) / 36e5;
  return track.tags.reduce((sum, tag) => sum + (taste.tagWeights[tag] ?? 0) * 1.4, 0)
    + (taste.artistAffinity[track.artist] ?? 0) * 2.2
    + (1 - Math.abs(taste.avgEnergy - track.energy)) * 2
    + (1 - clamp(Math.abs(taste.avgTempo - track.tempo) / 80)) * 1.2
    + (taste.likedIds.includes(track.id) ? 1 : 0)
    + (!taste.plays[track.id] ? 0.8 : 0)
    - Math.max(0, 3 - hours / 24) * 1.5 + random() * 0.6;
}
export function buildQueue(candidates: Track[], taste: Taste, n: number, previousArtist?: string, random: () => number = Math.random, now = Date.now()): Track[] {
  const unique = [...new Map(candidates.map((t) => [t.id, t])).values()];
  let ranked = unique.map((track) => ({ track, score: scoreTrack(track, taste, now, random) })).sort((a, b) => b.score - a.score);
  const selected: Track[] = [];
  let artist = previousArtist;
  while (selected.length < n && ranked.length) {
    const eligible = ranked.filter((t) => t.track.artist.toLowerCase() !== artist?.toLowerCase());
    if (!eligible.length) break; // Never violate diversity to pad the queue.
    const chosen = eligible[random() < 0.18 && eligible.length >= 4 ? 3 : 0];
    if (!chosen) break;
    selected.push(chosen.track);
    artist = chosen.track.artist;
    ranked = ranked.filter((t) => t.track.id !== chosen.track.id);
  }
  return selected;
}
export function applyEvent(taste: Taste, track: Track, type: EventType, now = Date.now()): Taste {
  const next: Taste = { ...taste, tagWeights: { ...taste.tagWeights }, artistAffinity: { ...taste.artistAffinity }, plays: { ...taste.plays }, lastPlayed: { ...taste.lastPlayed }, likedIds: [...taste.likedIds] };
  const weight = type in EVENT_WEIGHTS ? EVENT_WEIGHTS[type as keyof typeof EVENT_WEIGHTS] : 0;
  if (weight) {
    for (const tag of track.tags) next.tagWeights[tag] = (next.tagWeights[tag] ?? 0) + weight;
    const skip = type === "skip" || type === "quick_skip";
    next.artistAffinity[track.artist] = (next.artistAffinity[track.artist] ?? 0) + (skip ? -0.5 : 0.35);
    const rate = skip ? 0.35 : 0.5;
    next.avgEnergy += (track.energy - next.avgEnergy) * rate;
    next.avgTempo += (track.tempo - next.avgTempo) * rate;
    next.sessionEnergy += (track.energy - next.sessionEnergy) * 0.25;
    next.sessionTempo += (track.tempo - next.sessionTempo) * 0.25;
  }
  if (type === "like") next.likedIds = [...new Set([...next.likedIds, track.id])];
  if (type === "unlike") next.likedIds = next.likedIds.filter((id) => id !== track.id);
  if (type === "play" || type === "replay") {
    next.plays[track.id] = (next.plays[track.id] ?? 0) + 1;
    next.lastPlayed[track.id] = now;
  }
  return next;
}
export function finishEvent(position: number, duration: number): EventType {
  if (duration > 0 && position / duration >= 0.8) return "complete";
  if (position < 15) return "quick_skip";
  return "skip";
}
export function sessionQueue(candidates: Track[], taste: Taste, current: Track | null, random: () => number = Math.random): Track[] {
  const sessionTaste = { ...taste, avgEnergy: taste.sessionEnergy, avgTempo: taste.sessionTempo };
  return buildQueue(candidates.filter((t) => t.id !== current?.id), sessionTaste, 10, current?.artist, random);
}