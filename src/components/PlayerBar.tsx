import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Heart, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { fmt, usePlayer } from "@/lib/player";

export function PlayerBar() {
  const p = usePlayer();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"next" | "lyrics">("next");
  if (!p.current) return null;
  const t = p.current;
  const big = t.thumb.replace(/=w\d+-h\d+/, "=w800-h800");
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
        <div className="relative mx-auto max-w-md">
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <img src={big} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close"><ChevronDown className="h-7 w-7" /></Button>
              <Button variant="ghost" size="icon" onClick={() => p.toggleLike(t)} aria-label="Like">
                <Heart className={`h-6 w-6 ${p.isLiked(t.id) ? "fill-accent-glow text-accent-glow" : ""}`} />
              </Button>
            </div>
            <div className="absolute inset-x-0 bottom-0 px-6 pb-2">
              <div className="truncate font-display text-3xl font-bold">{t.title}</div>
              <div className="truncate text-lg text-muted-foreground">{t.artist}</div>
            </div>
          </div>
          <div className="flex flex-col gap-4 px-6 pb-10 pt-3">
            <div>
              {seek}
              <div className="flex justify-between text-xs text-muted-foreground"><span>{fmt(p.progress)}</span><span>{fmt(p.duration)}</span></div>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={p.toggleShuffle} aria-label="Shuffle" className={p.shuffle ? "text-accent-glow" : ""}><Shuffle className="h-6 w-6" /></Button>
              <Button variant="ghost" size="icon" onClick={p.prev} aria-label="Previous"><SkipBack className="h-8 w-8 fill-current" /></Button>
              <Button onClick={p.toggle} aria-label={p.playing ? "Pause" : "Play"} className="grid h-20 w-20 place-items-center rounded-full bg-foreground text-background hover:bg-foreground/90">
                {p.playing ? <Pause className="h-9 w-9 fill-current" /> : <Play className="h-9 w-9 fill-current" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={p.next} aria-label="Next"><SkipForward className="h-8 w-8 fill-current" /></Button>
              <Button variant="ghost" size="icon" onClick={p.cycleRepeat} aria-label="Repeat" className={p.repeat !== "off" ? "text-accent-glow" : ""}>
                {p.repeat === "one" ? <Repeat1 className="h-6 w-6" /> : <Repeat className="h-6 w-6" />}
              </Button>
            </div>
            <div className="flex gap-2">
              {(["next", "lyrics"] as const).map((k) => (
                <Button key={k} variant="ghost" onClick={() => setTab(k)}
                  className={`rounded-full px-5 ${tab === k ? "bg-foreground text-background hover:bg-foreground/90" : "bg-surface-hover"}`}>
                  {k === "next" ? "Up next" : "Lyrics"}
                </Button>
              ))}
            </div>
            {tab === "next" ? (
              <div>
                {p.queue.map((q) => (
                  <Button key={q.id} variant="ghost" onClick={() => p.playTrack(q)} className="h-auto w-full justify-start gap-3 overflow-hidden px-0 py-2 text-left">
                    <img src={q.thumb} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
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
