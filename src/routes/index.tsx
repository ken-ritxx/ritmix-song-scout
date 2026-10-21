import { Button } from "@/components/ui/button";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ArrowUpRight, Music2 } from "lucide-react";
import { searchSongs } from "@/lib/innertube.functions";
import { TrackCard } from "@/components/TrackRow";
import { usePlayer } from "@/lib/player";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Ritxxx Plays — Free Music Streaming" },
      { name: "description", content: "Stream any song free. Search millions of real tracks, like songs and build playlists." },
      { property: "og:title", content: "Ritxxx Plays — Free Music Streaming" },
      { property: "og:description", content: "Stream any song free. Search real tracks, like songs and build playlists." },
    ],
  }),
  component: Home,
});

const POOL = [
  { title: "Trending now", q: "top hits 2026" },
  { title: "New releases", q: "new songs this week" },
  { title: "Bollywood hits", q: "latest bollywood songs" },
  { title: "Chill & lo-fi", q: "lofi chill beats" },
  { title: "Hip-hop heat", q: "hip hop hits" },
  { title: "Punjabi bangers", q: "punjabi hits" },
  { title: "Late night R&B", q: "late night rnb" },
  { title: "Indie gems", q: "indie alternative songs" },
  { title: "Workout energy", q: "gym workout songs" },
  { title: "Heartbreak hours", q: "sad songs" },
  { title: "Party mode", q: "party dance hits" },
  { title: "Retro classics", q: "90s hits" },
  { title: "Desi hip-hop", q: "desi hip hop" },
  { title: "Phonk & drift", q: "phonk songs" },
  { title: "Romantic vibes", q: "romantic hindi songs" },
  { title: "Global pop", q: "global pop hits" },
  { title: "Synthwave nights", q: "synthwave" },
  { title: "Rock anthems", q: "rock anthems" },
];

const MOODS = ["Chill", "Happy", "Sad", "Focus", "Party", "Romance", "Sleep", "Gym", "Road trip", "K-pop", "Anime", "Sufi"];

// Changes every day: rotate which shelves appear, plus a daily twist on each query.
function todaysShelves() {
  const day = Math.floor(Date.now() / 864e5);
  const picks = [...POOL].sort((a, b) => ((a.q.length * 31 + day * 17) % 97) - ((b.q.length * 31 + day * 17) % 97) || a.q.localeCompare(b.q));
  const start = (day * 5) % POOL.length;
  const rotated = [...POOL.slice(start), ...POOL.slice(0, start)];
  const twists = ["", " 2026", " playlist", " mix", " best"];
  return (picks.length ? rotated : picks).slice(0, 5).map((s, i) => ({ ...s, q: s.q + twists[(day + i) % twists.length] }));
}

function Shelf({ title, q }: { title: string; q: string }) {
  const { data, isLoading } = useQuery({ queryKey: ["search", q], queryFn: () => searchSongs({ data: { q } }), staleTime: 6e5 });
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-xl font-bold">{title}</h2>
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square w-36 shrink-0 animate-pulse rounded-2xl bg-muted sm:w-44" />)}
        {data?.slice(0, 12).map((t) => <TrackCard key={t.id} t={t} list={data} />)}
      </div>
    </section>
  );
}

const ARTISTS = ["The Weeknd", "Arctic Monkeys", "Frank Ocean", "Daft Punk", "Billie Eilish", "Kendrick Lamar", "Tame Impala", "Lana Del Rey", "Arijit Singh"];

function Home() {
  const { liked, recent, clearRecent } = usePlayer();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <div>
      <div className="py-5 sm:py-8">
        <h1 className="font-display text-3xl font-bold sm:text-5xl">
          Welcome, <span className="text-gradient-brand">Rithik</span> 👾
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">Fck nudes, send me your playlist.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) navigate({ to: "/search", search: { q: q.trim() } });
          }}
          className="mt-6 flex max-w-xl items-center gap-2 rounded-full glass-surface py-1.5 pl-5 pr-1.5 backdrop-blur"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search songs, artists, music…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          <Button variant="brand" type="submit" className="rounded-full bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground">Search</Button>
        </form>
        <h2 className="mt-8 mb-3 font-display text-lg font-bold">Jump in</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ARTISTS.map((a) => (
            <Link key={a} to="/search" search={{ q: a }} className="glass-surface group flex min-h-16 items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition hover:border-primary/60 hover:bg-surface-hover sm:px-4">
              <Music2 className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 break-words">{a}</span>
              <ArrowUpRight className="hidden h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary sm:block" />
            </Link>
          ))}
        </div>
      </div>
      {recent.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Recently played</h2>
            <Button variant="ghost" size="sm" onClick={clearRecent} className="text-muted-foreground">Clear</Button>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {recent.map((t) => <TrackCard key={t.id} t={t} list={recent} />)}
          </div>
        </section>
      )}
      {recent[0] && <Shelf title={`Made for you · because you played ${recent[0].artist}`} q={`${recent[0].artist} similar songs`} />}
      {liked.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl font-bold">Your liked songs</h2>
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {liked.slice(0, 12).map((t) => <TrackCard key={t.id} t={t} list={liked} />)}
          </div>
        </section>
      )}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-bold">Discover by mood</h2>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <Link key={m} to="/search" search={{ q: `${m} songs` }} className="glass-surface rounded-full px-4 py-2 text-sm transition hover:bg-surface-hover">{m}</Link>
          ))}
        </div>
      </section>
      {todaysShelves().map((s) => <Shelf key={s.q} {...s} />)}
    </div>
  );
}
