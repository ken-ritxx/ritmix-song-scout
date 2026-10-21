import { Button } from "@/components/ui/button";
import { createFileRoute, Link, useHydrated, useRouter } from "@tanstack/react-router";
import { ChevronLeft, ListMusic, Play, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { TrackRow } from "@/components/TrackRow";
import { usePlayer } from "@/lib/player";

export const Route = createFileRoute("/playlist/$id")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Playlist — Ritxxx Plays" },
      { name: "description", content: "Your saved playlist, stored on your device." },
      { property: "og:title", content: "Playlist — Ritxxx Plays" },
      { property: "og:description", content: "Your saved playlist, stored on your device." },
    ],
  }),
  component: PlaylistPage,
});

function PlaylistPage() {
  const p = usePlayer();
  const router = useRouter();
  const hydrated = useHydrated();
  const { id } = Route.useParams();
  const pl = p.playlists.find((x) => x.id === id);
  const tracks = pl?.tracks ?? [];

  useEffect(() => {
    if (pl) localStorage.setItem("rp.lastPlaylist", pl.id);
  }, [pl]);

  const back = () => {
    if (window.history.length > 1) router.history.goBack();
    else router.navigate({ to: "/library" });
  };

  if (!hydrated || !pl)
    return (
      <div className="pt-6">
        <Button variant="ghost" onClick={back} aria-label="Back" className="mb-4 gap-1 text-muted-foreground">
          <ChevronLeft className="h-5 w-5" /> Back
        </Button>
        {hydrated && (
          <div className="glass-surface rounded-3xl p-6 text-center">
            <ListMusic className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-display text-lg font-bold">Playlist not found</p>
            <p className="mt-1 text-sm text-muted-foreground">It may have been deleted from this device.</p>
            <Link
              to="/library"
              className="mt-5 inline-flex rounded-full bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Back to library
            </Link>
          </div>
        )}
      </div>
    );

  return (
    <div>
      <Button variant="ghost" onClick={back} aria-label="Back" className="mb-3 gap-1 text-muted-foreground">
        <ChevronLeft className="h-5 w-5" /> Back
      </Button>

      <div className="glass-surface flex items-end gap-4 rounded-3xl p-5">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-glow">
          {tracks[0] ? (
            <img src={tracks[0].thumb} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-brand">
              <ListMusic className="h-8 w-8 text-primary-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-normal text-muted-foreground">Playlist</p>
          <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">{pl.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tracks.length} {tracks.length === 1 ? "song" : "songs"} · saved on this device
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        {tracks.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              const first = tracks[0];
              if (first) p.playTrack(first, tracks);
            }}
            aria-label="Play all"
            className="grid h-12 w-12 place-items-center rounded-full bg-gradient-brand text-primary-foreground shadow-glow"
          >
            <Play className="h-5 w-5 fill-current" />
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            p.deletePlaylist(pl.id);
            if (localStorage.getItem("rp.lastPlaylist") === pl.id) localStorage.removeItem("rp.lastPlaylist");
            router.navigate({ to: "/library" });
          }}
          className="gap-2 rounded-full border text-sm text-muted-foreground"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>

      <div className="mt-4 space-y-1">
        {tracks.length === 0 && <p className="text-muted-foreground">Nothing here yet — search and add songs.</p>}
        {tracks.map((t) => (
          <TrackRow key={t.id} t={t} list={tracks} onRemove={() => p.removeFromPlaylist(pl.id, t.id)} />
        ))}
      </div>
    </div>
  );
}
