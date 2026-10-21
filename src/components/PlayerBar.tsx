import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Heart, ListMusic, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { fmt, usePlayer } from "@/lib/player";

export function PlayerBar() {
  const p = usePlayer();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"next" | "lyrics">("next");
  if (!p.current) return null;
  const t = p.current;
  const big = t.thumb.replace(/=w\d+-h\d+/, "=w800-h800");
  const pct = p.duration ? Math.min(100, (p.progress / p.duration) * 100) : 0;
  const PlayBtn = ({ size }: { size: string }) => (
    <Button variant="brand" onClick={p.toggle} aria-label={p.playing ? "Pause" : "Play"}
      className={`grid ${size} place-items-center rounded-full bg-gradient-brand text-primary-foreground shadow-glow`}>
      {p.playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
    </Button>
  );
  const seek = (
    <input type="range" min={0} max={p.duration || 1} value={p.progress}
      onChange={(e) => p.seek(Number(e.target.value))} className="range w-full" aria-label="Seek" />
  );

  if (open)
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <img src={big} alt="" className="h-full w-full scale-125 object-cover opacity-35 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
        </div>

        <div className="relative mx-auto flex min-h-full max-w-md flex-col px-6 pb-10 pt-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close Now Playing">
              <ChevronDown className="h-7 w-7" />
            </Button>
            <span className="text-[11px] uppercase tracking-normal text-muted-foreground">Now playing</span>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close" className="opacity-0" tabIndex={-1}>
              <ChevronDown className="h-7 w-7" />
            </Button>
          </div>

          <div className="mt-4 flex-1">
            <div className="relative mx-auto aspect-square w-full max-w-[min(20rem,72vw)] overflow-hidden rounded-[2rem] bg-muted shadow-glow ring-1 ring-border transition duration-500"
              style={{ transform: p.playing ? "scale(1)" : "scale(0.94)" }}>
              <img src={big} alt="" className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-2xl font-bold leading-tight">{t.title}</div>
              <div className="mt-1 truncate text-base text-muted-foreground">
                {t.artist}
                {t.album ? ` · ${t.album}` : ""}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => p.toggleLike(t)} aria-label={p.isLiked(t.id) ? "Remove from liked" : "Add to liked"} className="shrink-0">
              <Heart className={`h-6 w-6 transition ${p.isLiked(t.id) ? "fill-accent-glow text-accent-glow" : "text-muted-foreground"}`} />
            </Button>
          </div>

          <div className="mt-5">
            <div className="relative h-6">
              <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-surface-hover">
                <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${pct}%` }} />
              </div>
              <div className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow-glow"
                style={{ left: `${pct}%` }} />
              <input type="range" min={0} max={p.duration || 1} value={p.progress}
                onChange={(e) => p.seek(Number(e.target.value))}
                className="absolute inset-0 w-full cursor-pointer opacity-0" aria-label="Seek" />
            </div>
            <div className="mt-1 flex justify-between text-xs tabular-nums text-muted-foreground">
              <span>{fmt(p.progress)}</span>
              <span>-{fmt(Math.max(0, p.duration - p.progress))}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={p.toggleShuffle} aria-label="Shuffle" className={p.shuffle ? "text-accent-glow" : ""}>
              <Shuffle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={p.prev} aria-label="Previous">
              <SkipBack className="h-8 w-8 fill-current" />
            </Button>
            <PlayBtn size="h-18 w-18" />
            <Button variant="ghost" size="icon" onClick={p.next} aria-label="Next">
              <SkipForward className="h-8 w-8 fill-current" />
            </Button>
            <Button variant="ghost" size="icon" onClick={p.cycleRepeat} aria-label="Repeat" className={p.repeat !== "off" ? "text-accent-glow" : ""}>
              {p.repeat === "one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
            </Button>
          </div>

          <div className="mt-6 flex gap-2">
            {(["next", "lyrics"] as const).map((k) => (
              <Button key={k} variant="ghost" onClick={() => setTab(k)}
                className={`rounded-full px-5 ${tab === k ? "bg-foreground text-background hover:bg-foreground/90" : "bg-surface-hover"}`}>
                {k === "next" ? "Up next" : "Lyrics"}
              </Button>
            ))}
          </div>

          <div className="mt-3">
            {tab === "next" ? (
              <div>
                <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-normal text-muted-foreground">
                  <ListMusic className="h-3.5 w-3.5" /> Queue · {p.queue.length}
                </div>
                {p.queue.map((q) => (
                  <Button key={q.id} variant="ghost" onClick={() => p.playTrack(q)} className="h-auto w-full justify-start gap-3 overflow-hidden px-0 py-2 text-left">
                    <img src={q.thumb} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" onError={(e) => { e.currentTarget.src = `https://i.ytimg.com/vi/${q.id}/hqdefault.jpg`; }} />
                    <div className="min-w-0 flex-1">
                      <div className={`truncate ${q.id === t.id ? "text-accent-glow" : ""}`}>{q.title}</div>
                      <div className="truncate text-sm text-muted-foreground">{q.artist}{q.duration ? ` • ${q.duration}` : ""}</div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <Lyrics />
            )}
          </div>
        </div>
      </div>
    );

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 glass-surface rounded-t-3xl px-3 pb-3 pt-2 md:bottom-3 md:left-64 md:right-4 md:rounded-3xl md:px-5">
      {seek}
      <div className="flex items-center gap-3">
        <button onClick={() => setOpen(true)} aria-label="Open Now Playing" className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <img src={t.thumb} alt="" className="h-12 w-12 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{t.title}</div>
            <div className="truncate text-xs text-muted-foreground">{t.artist} · {fmt(p.progress)} / {fmt(p.duration)}</div>
          </div>
        </button>
        <Button variant="ghost" onClick={() => p.toggleLike(t)} aria-label="Like" size="icon" className="hidden shrink-0 sm:inline-flex">
          <Heart className={`h-5 w-5 ${p.isLiked(t.id) ? "fill-accent-glow text-accent-glow" : ""}`} />
        </Button>
        <Button variant="ghost" onClick={p.prev} aria-label="Previous" size="icon" className="shrink-0"><SkipBack className="h-5 w-5 fill-current" /></Button>
        <PlayBtn size="h-11 w-11" />
        <Button variant="ghost" onClick={p.next} aria-label="Next" size="icon" className="shrink-0"><SkipForward className="h-5 w-5 fill-current" /></Button>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" onClick={() => p.setVolume(p.volume ? 0 : 80)} aria-label="Mute">
            {p.volume ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <input type="range" min={0} max={100} value={p.volume} onChange={(e) => p.setVolume(Number(e.target.value))} className="range w-24" aria-label="Volume" />
        </div>
      </div>
    </div>
  );
}

type Line = { t: number; text: string };

function Lyrics() {
  const p = usePlayer();
  const t = p.current!;
  const [state, setState] = useState<{ id: string; lines: Line[] | null; plain: string | null } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let off = false;
    setState(null);
    const clean = (s: string) => s.replace(/\s*[\(\[].*?(official|video|audio|lyric|ft\.|feat).*?[\)\]]/gi, "").trim();
    const artist = t.artist.split(/,|&| x /i)[0]!.trim();
    (async () => {
      let r: any = null;
      try {
        const u = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(clean(t.title))}${p.duration ? `&duration=${Math.round(p.duration)}` : ""}`;
        const res = await fetch(u);
        if (res.ok) r = await res.json();
      } catch {}
      if (!r?.syncedLyrics && !r?.plainLyrics) {
        try {
          const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(`${clean(t.title)} ${artist}`)}`);
          const arr = res.ok ? await res.json() : [];
          r = arr.find((x: any) => x.syncedLyrics) ?? arr[0] ?? null;
        } catch {}
      }
      if (off) return;
      const lines: Line[] | null = r?.syncedLyrics
        ? r.syncedLyrics.split("\n").flatMap((l: string) => {
            const m = l.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
            return m ? [{ t: Number(m[1]) * 60 + Number(m[2]), text: m[3]!.trim() || "♪" }] : [];
          })
        : null;
      setState({ id: t.id, lines, plain: r?.plainLyrics ?? null });
    })();
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.id]);

  const lines = state?.lines;
  let cur = -1;
  if (lines) for (let i = 0; i < lines.length; i++) if (lines[i]!.t <= p.progress + 0.3) cur = i;

  useEffect(() => {
    box.current?.querySelector(`[data-i="${cur}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [cur]);

  if (!state) return <div className="py-10 text-center text-muted-foreground">Finding lyrics…</div>;
  if (!lines && !state.plain) return <div className="py-10 text-center text-muted-foreground">No lyrics found for this song.</div>;
  if (!lines) return <div className="whitespace-pre-line text-lg leading-relaxed">{state.plain}</div>;
  return (
    <div ref={box} className="glass-surface max-h-[60vh] overflow-y-auto rounded-3xl p-5">
      {lines.map((l, i) => (
        <button key={i} data-i={i} onClick={() => p.seek(l.t)}
          className={`block w-full py-1.5 text-left font-display text-2xl font-bold transition ${i === cur ? "text-foreground" : "text-muted-foreground/50"}`}>
          {l.text}
        </button>
      ))}
    </div>
  );
}
