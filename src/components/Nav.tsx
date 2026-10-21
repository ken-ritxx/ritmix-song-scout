import { Link, useHydrated } from "@tanstack/react-router";
import { Home, Library, ListMusic, Search, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { usePlayer } from "@/lib/player";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
] as const;

export function Nav() {
  const p = usePlayer();
  const hydrated = useHydrated();
  const [lastPl, setLastPl] = useState("");
  useEffect(() => {
    if (hydrated) setLastPl(localStorage.getItem("rp.lastPlaylist") ?? "");
  }, [hydrated]);
  // The playlist the user last opened stays reachable from any screen.
  const openPl = hydrated ? p.playlists.find((x) => x.id === lastPl) : undefined;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-sidebar/65 px-4 backdrop-blur-md md:hidden">
        <Link to="/" className="min-w-0 leading-tight">
          <span className="font-display text-lg font-extrabold tracking-normal">
            <span className="text-gradient-brand">Ritxxx</span> Plays
          </span>
          <span className="block text-[10px] uppercase tracking-normal text-muted-foreground">
            fck nudes, send me your playlist
          </span>
        </Link>
        {openPl && (
          <Link
            to="/playlist/$id"
            params={{ id: openPl.id }}
            aria-label={`Open ${openPl.name}`}
            className="flex h-9 max-w-[45%] shrink-0 items-center gap-2 rounded-full border bg-surface-hover/60 px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ListMusic className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{openPl.name}</span>
          </Link>
        )}
        <Link to="/library" aria-label="Profile" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-brand text-primary-foreground shadow-glow">
          <UserRound className="h-5 w-5" />
        </Link>
      </header>
      <Link to="/library" aria-label="Profile" className="fixed right-5 top-4 z-30 hidden h-10 w-10 place-items-center rounded-full bg-gradient-brand text-primary-foreground shadow-glow md:grid">
        <UserRound className="h-5 w-5" />
      </Link>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col gap-2 border-r bg-sidebar/55 p-5 backdrop-blur-xl md:flex">
        <Link to="/" className="mb-4 font-display text-2xl font-extrabold tracking-normal">
          <span className="text-gradient-brand">Ritxxx</span> Plays
        </Link>
        <p className="mb-6 text-[11px] uppercase tracking-normal text-muted-foreground">
          fck nudes, send me your playlist
        </p>
        {items.map((i) => (
          <Link
            key={i.to}
            to={i.to}
            activeOptions={{ exact: true }}
            className="flex items-center gap-3 rounded-full px-4 py-3 text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "bg-secondary/80 !text-secondary-foreground" }}
          >
            <i.icon className="h-5 w-5" /> {i.label}
          </Link>
        ))}
        {p.playlists.length > 0 && (
          <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
            <p className="px-4 pb-2 text-[11px] uppercase tracking-normal text-muted-foreground">Playlists</p>
            {p.playlists.map((pl) => (
              <Link
                key={pl.id}
                to="/playlist/$id"
                params={{ id: pl.id }}
                className="flex items-center gap-3 rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
                activeProps={{ className: "bg-secondary/80 !text-secondary-foreground" }}
              >
                <ListMusic className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{pl.name}</span>
                <span className="text-xs text-muted-foreground/70">{pl.tracks.length}</span>
              </Link>
            ))}
          </div>
        )}
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t bg-sidebar/65 backdrop-blur-xl md:hidden">
        {items.map((i) => (
          <Link
            key={i.to}
            to={i.to}
            activeOptions={{ exact: true }}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-xs text-muted-foreground"
            activeProps={{ className: "!text-primary" }}
          >
            <i.icon className="h-5 w-5" />
            {i.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
