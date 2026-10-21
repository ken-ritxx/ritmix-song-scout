import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Search as SearchIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { searchSongs } from "@/lib/innertube.functions";
import { TrackRow } from "@/components/TrackRow";
import { usePlayer } from "@/lib/player";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Search — Ritxxx Plays" },
      { name: "description", content: "Search songs by name, artist or album and play instantly." },
      { property: "og:title", content: "Search — Ritxxx Plays" },
      { property: "og:description", content: "Search songs by name, artist or album and play instantly." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { q?: string } => (typeof s['q'] === "string" && s['q'] ? { q: s['q'] } : {}),
  component: SearchPage,
});

function SearchPage() {
  const p = usePlayer();
  const { q: initial } = Route.useSearch();
  const [input, setInput] = useState(initial ?? "");
  const [q, setQ] = useState(initial ?? "");
  useEffect(() => {
    if (initial) {
      setInput(initial);
      setQ(initial);
    }
  }, [initial]);
  const { data, isFetching, error } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchSongs({ data: { q } }),
    enabled: !!q,
    staleTime: 6e5,
  });
  const run = (v: string) => {
    const s = v.trim();
    if (!s) return;
    setInput(s);
    setQ(s);
    p.addHistory(s);
  };
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
        }}
        className="sticky top-14 md:top-0 z-20 -mx-4 bg-background/65 px-4 py-3 backdrop-blur"
      >
        <div className="flex items-center gap-3 rounded-full glass-surface px-5 py-3 focus-within:border-primary">
          <SearchIcon className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Songs, artists, albums…"
            aria-label="Search songs, artists or albums" className="min-w-0 flex-1 bg-transparent outline-none"
          />
          {input && (
            <Button variant="ghost" type="button" onClick={() => setInput("")} aria-label="Clear">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {!q && p.history.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Recent searches</h2>
            <Button variant="ghost" onClick={p.clearHistory} className="text-sm text-muted-foreground">Clear</Button>
          </div>
          {p.history.map((h) => (
            <Button variant="ghost" key={h} onClick={() => run(h)} className="h-auto justify-start flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-surface-hover">
              <Clock className="h-4 w-4 text-muted-foreground" /> {h}
            </Button>
          ))}
        </div>
      )}

      {isFetching && <p className="mt-6 text-muted-foreground">Searching…</p>}
      {error && <p className="mt-6 text-destructive">Search failed. Try again.</p>}
      {data && !isFetching && (
        <div className="mt-4 space-y-1">
          {data.length === 0 && <p className="text-muted-foreground">No results.</p>}
          {data.map((t) => <TrackRow key={t.id} t={t} list={data} />)}
        </div>
      )}
    </div>
  );
}
