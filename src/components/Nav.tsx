import { Link } from "@tanstack/react-router";
import { Home, Library, Search } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
] as const;

export function Nav() {
  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-sidebar/65 px-4 backdrop-blur-md md:hidden">
        <Link to="/" className="leading-tight">
          <span className="font-display text-lg font-extrabold tracking-normal">
            <span className="text-gradient-brand">Ritxxx</span> Plays
          </span>
          <span className="block text-[10px] uppercase tracking-normal text-muted-foreground">
            fck nudes, send me your playlist
          </span>
        </Link>
        <Link
          to="/search"
          aria-label="Search songs"
          className="flex h-9 w-9 items-center justify-center rounded-full border bg-surface-hover/60 text-muted-foreground transition hover:text-foreground"
        >
          <Search className="h-4 w-4" />
        </Link>
      </header>
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
