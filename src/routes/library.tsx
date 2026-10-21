import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Heart, ListMusic, Play, Plus, Trash2 } from "lucide-react";
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
  const [sel, setSel] = useState<string>("liked");
  const [name, setName] = useState("");
  const [spUrl, setSpUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState("");
  const pl = p.playlists.find((x) => x.id === sel);
  const tracks = sel === "liked" ? p.liked : (pl?.tracks ?? []);
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
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        <Chip active={sel === "liked"} onClick={() => setSel("liked")}>
          <Heart className="h-4 w-4" /> Liked ({p.liked.length})
        </Chip>
        {p.playlists.map((x) => (
          <Chip key={x.id} active={sel === x.id} onClick={() => setSel(x.id)}>
            <ListMusic className="h-4 w-4" /> {x.name} ({x.tracks.length})
          </Chip>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <h2 className="flex-1 font-display text-xl font-bold">{sel === "liked" ? "Liked songs" : pl?.name}</h2>
        {tracks.length > 0 && (
          <Button variant="ghost" onClick={() => { const first = tracks[0]; if (first) p.playTrack(first, tracks); }} className="grid h-11 w-11 place-items-center rounded-full bg-gradient-brand text-primary-foreground shadow-glow" aria-label="Play all">
            <Play className="h-5 w-5 fill-current" />
          </Button>
        )}
        {pl && (
          <Button variant="ghost" onClick={() => { p.deletePlaylist(pl.id); setSel("liked"); }} className="p-2 text-muted-foreground" aria-label="Delete playlist">
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>
      <div className="mt-3 space-y-1">
        {tracks.length === 0 && <p className="text-muted-foreground">Nothing here yet — search and add songs.</p>}
        {tracks.map((t) => (
          <TrackRow key={t.id} t={t} list={tracks} onRemove={pl ? () => p.removeFromPlaylist(pl.id, t.id) : undefined} />
        ))}
      </div>
    </div>
  );
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick} className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm ${active ? "border-transparent bg-gradient-brand text-primary-foreground" : "glass-surface"}`}>
      {children}
    </Button>
  );
}
