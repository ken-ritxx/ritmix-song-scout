import { Button } from "@/components/ui/button";
import { Heart, ListPlus, Play, X } from "lucide-react";
import { useState } from "react";
import type { Track } from "@/lib/innertube.functions";
import { usePlayer } from "@/lib/player";

export function TrackRow({ t, list, onRemove }: { t: Track; list: Track[]; onRemove?: (() => void) | undefined }) {
  const p = usePlayer();
  const [menu, setMenu] = useState(false);
  const active = p.current?.id === t.id;
  return (
    <div className={`group relative flex items-center gap-3 rounded-2xl p-2 transition hover:bg-surface-hover ${active ? "bg-surface-hover" : ""}`}>
      <Button variant="ghost" onClick={() => p.playTrack(t, list)} className="p-0 relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
        <img src={t.thumb} alt="" className="h-full w-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.src = `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`; }} />
        <span className="absolute inset-0 grid place-items-center bg-background/60 opacity-0 transition group-hover:opacity-100">
          <Play className="h-5 w-5 fill-current" />
        </span>
      </Button>
      <Button variant="ghost" onClick={() => p.playTrack(t, list)} className="h-auto min-w-0 flex-1 flex-col items-start gap-0 overflow-hidden p-0 text-left hover:bg-transparent">
        <div className={`w-full truncate font-medium ${active ? "text-accent-glow" : ""}`}>{t.title}</div>
        <div className="w-full truncate text-sm text-muted-foreground">
          {t.artist}
          {t.album ? ` • ${t.album}` : ""}
        </div>
      </Button>
      <span className="hidden text-sm text-muted-foreground sm:block">{t.duration}</span>
      <Button variant="ghost" onClick={() => p.toggleLike(t)} aria-label="Like" size="icon" className="shrink-0">
        <Heart className={`h-5 w-5 ${p.isLiked(t.id) ? "fill-accent-glow text-accent-glow" : "text-muted-foreground"}`} />
      </Button>
      {onRemove ? (
        <Button variant="ghost" onClick={onRemove} aria-label="Remove" size="icon" className="shrink-0 text-muted-foreground">
          <X className="h-5 w-5" />
        </Button>
      ) : (
        <Button variant="ghost" onClick={() => setMenu(!menu)} aria-label="Add to playlist" size="icon" className="shrink-0 text-muted-foreground">
          <ListPlus className="h-5 w-5" />
        </Button>
      )}
      {menu && (
        <div className="absolute right-2 top-14 z-30 w-52 rounded-2xl border bg-popover/95 p-2 backdrop-blur-xl shadow-glow">
          {p.playlists.length === 0 && <div className="p-2 text-sm text-muted-foreground">Create a playlist in Library first</div>}
          {p.playlists.map((pl) => (
            <Button variant="ghost"
              key={pl.id}
              onClick={() => {
                p.addToPlaylist(pl.id, t);
                setMenu(false);
              }}
              className="justify-start w-full truncate rounded-lg p-2 text-left text-sm hover:bg-surface-hover"
            >
              {pl.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TrackCard({ t, list }: { t: Track; list: Track[] }) {
  const p = usePlayer();
  return (
    <Button variant="ghost" onClick={() => p.playTrack(t, list)} className="group h-auto w-36 shrink-0 flex-col items-start gap-0 p-0 text-left hover:bg-transparent sm:w-44">
      <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-muted">
        <img src={t.thumb} alt="" loading="lazy" onError={(e) => { e.currentTarget.src = `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`; }} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute bottom-2 right-2 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-gradient-brand text-primary-foreground opacity-0 shadow-glow transition group-hover:translate-y-0 group-hover:opacity-100">
          <Play className="h-4 w-4 fill-current" />
        </span>
      </div>
      <div className="mt-3 w-full truncate text-sm font-semibold">{t.title}</div>
      <div className="w-full truncate text-xs text-muted-foreground">{t.artist}</div>
    </Button>
  );
}
