import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Heart, ListMusic, Play, Plus } from "lucide-react";
import { useState } from "react";
import { TrackRow } from "@/components/TrackRow";
import { usePlayer } from "@/lib/player";
import { importSpotifyPlaylist } from "@/lib/innertube.functions";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Your Library — Ritxxx Plays" },
      { name: "description", content: "Your liked songs and playlists, saved on your device." },
      { property: "og:title", content: "Your Library — Ritxxx Plays" },
      { property: "og:description", content: "Your liked songs and playlists, saved on your device." },
    ],
  }),
  component: Library,
});

function Library() {
  const p = usePlayer();
  const [name, setName] = useState("");
  const [spUrl, setSpUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState("");
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Your Library</h1>
      <form
        className="mt-4 glass-surface rounded-3xl p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!spUrl.trim() || importing) return;
          setImporting(true);
          setMsg("Importing… this can take up to a minute");
          try {
            const r = await importSpotifyPlaylist({ data: { url: spUrl.trim() } });
            p.createPlaylist(r.name, r.tracks);
            setMsg(`Added "${r.name}" with ${r.tracks.length} songs`);
            setSpUrl("");
          } catch (err) {
            setMsg(err instanceof Error ? err.message : "Import failed");
          } finally {
            setImporting(false);
          }
        }}
      >
        <p className="font-display font-semibold">Import from Spotify</p>
        <p className="text-sm text-muted-foreground">Paste a public Spotify playlist link (up to 100 songs).</p>
        <div className="mt-3 flex gap-2">
          <input value={spUrl} onChange={(e) => setSpUrl(e.target.value)} placeholder="https://open.spotify.com/playlist/…" aria-label="Spotify playlist link" className="min-w-0 flex-1 rounded-full glass-surface px-4 py-2 outline-none focus:border-primary" />
          <Button variant="brand" type="submit" disabled={importing} className="h-auto rounded-full bg-gradient-brand px-4 py-2 font-semibold text-primary-foreground">
            <Download className="h-4 w-4" /> {importing ? "…" : "Import"}
          </Button>
        </div>
        {msg && <p className="mt-2 text-sm text-muted-foreground">{msg}</p>}
      </form>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) p.createPlaylist(name.trim());
          setName("");
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New playlist name" aria-label="New playlist name" className="min-w-0 flex-1 rounded-full glass-surface px-4 py-2 outline-none focus:border-primary" />
        <Button variant="brand" type="submit" className="h-auto flex items-center gap-1 rounded-full bg-gradient-brand px-4 py-2 font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Create
        </Button>
      </form>

      {p.playlists.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl font-bold">Playlists</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {p.playlists.map((x) => (
              <Link
                key={x.id}
                to="/playlist/$id"
                params={{ id: x.id }}
                className="glass-surface group flex items-center gap-3 rounded-2xl p-3 transition hover:bg-surface-hover"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {x.tracks[0] ? (
                    <img src={x.tracks[0].thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-brand">
                      <ListMusic className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{x.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{x.tracks.length} songs</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 flex items-center gap-3">
        <h2 className="flex-1 font-display text-xl font-bold">Liked songs</h2>
        {p.liked.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              const first = p.liked[0];
              if (first) p.playTrack(first, p.liked);
            }}
            className="grid h-11 w-11 place-items-center rounded-full bg-gradient-brand text-primary-foreground shadow-glow"
            aria-label="Play all liked songs"
          >
            <Play className="h-5 w-5 fill-current" />
          </Button>
        )}
      </div>
      <div className="mt-3 space-y-1">
        {p.liked.length === 0 && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Heart className="h-4 w-4" /> No liked songs yet — search and tap the heart.
          </p>
        )}
        {p.liked.map((t) => (
          <TrackRow key={t.id} t={t} list={p.liked} />
        ))}
      </div>
    </div>
  );
}
