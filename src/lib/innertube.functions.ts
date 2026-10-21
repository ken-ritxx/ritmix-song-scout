import { createServerFn } from "@tanstack/react-start";

export type Track = {
  id: string;
  title: string;
  artist: string;
  album?: string | undefined;
  duration?: string | undefined;
  thumb: string;
};

const SONGS_PARAM = "EgWKAQIIAWoKEAMQBBAJEAoQBQ%3D%3D";

function runsText(col: any): string[] {
  return (col?.musicResponsiveListItemFlexColumnRenderer?.text?.runs ?? []).map((r: any) => r.text);
}

function parseItem(it: any): Track | null {
  const id =
    it?.playlistItemData?.videoId ??
    it?.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint
      ?.watchEndpoint?.videoId;
  if (!id) return null;
  const cols = it.flexColumns ?? [];
  const title = runsText(cols[0]).join("");
  const sub = runsText(cols[1]).join("").split(" • ").map((x) => x.trim()).filter(Boolean);
  const thumbs = it.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ?? [];
  let thumb: string = thumbs[thumbs.length - 1]?.url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  thumb = thumb.replace(/=w\d+-h\d+[^&]*$/, "=w400-h400-l90-rj");
  const duration = sub.find((s) => /^\d+:\d{2}(:\d{2})?$/.test(s));
  const rest = sub.filter((s) => s !== duration && !/^(Song|Video)$/.test(s) && !/views|plays/i.test(s));
  return { id, title, artist: rest[0] ?? "Unknown", album: rest[1], duration, thumb };
}

async function ytSearch(q: string): Promise<Track[]> {
  if (!q.trim()) return [];
  const res = await fetch("https://music.youtube.com/youtubei/v1/search?prettyPrint=false", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://music.youtube.com",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    },
    body: JSON.stringify({
      context: { client: { clientName: "WEB_REMIX", clientVersion: "1.20241023.01.00", hl: "en" } },
      query: q,
      params: SONGS_PARAM,
    }),
  });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const json: any = await res.json();
  const tabs = json?.contents?.tabbedSearchResultsRenderer?.tabs ?? [];
  const sections = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents ?? [];
  const out: Track[] = [];
  for (const s of sections) {
    for (const c of s?.musicShelfRenderer?.contents ?? []) {
      const t = parseItem(c?.musicResponsiveListItemRenderer);
      if (t && !out.some((o) => o.id === t.id)) out.push(t);
    }
  }
  return out;
}

export const searchSongs = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) => ({ q: String(d.q ?? "").slice(0, 200) }))
  .handler(async ({ data }): Promise<Track[]> => ytSearch(data.q));

// Reads a public Spotify playlist via its embed page, then matches each song on YouTube Music.
export const importSpotifyPlaylist = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) => ({ url: String(d.url ?? "").slice(0, 300) }))
  .handler(async ({ data }): Promise<{ name: string; tracks: Track[] }> => {
    const m = data.url.match(/(playlist|album)[/:]([A-Za-z0-9]{10,})/);
    if (!m) throw new Error("Paste a Spotify playlist link");
    const res = await fetch(`https://open.spotify.com/embed/${m[1]}/${m[2]}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36" },
    });
    if (!res.ok) throw new Error("Playlist not found or private");
    const html = await res.text();
    const nd = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!nd?.[1]) throw new Error("Could not read playlist");
    const entity: any = JSON.parse(nd[1])?.props?.pageProps?.state?.data?.entity;
    const list: { title: string; subtitle: string }[] = (entity?.trackList ?? []).slice(0, 100);
    const name: string = entity?.name ?? entity?.title ?? "Spotify playlist";
    const tracks: Track[] = new Array(list.length);
    let i = 0;
    const worker = async () => {
      while (i < list.length) {
        const k = i++;
        const it = list[k]!;
        try {
          const r = await ytSearch(`${it.title} ${it.subtitle}`);
          if (r[0]) tracks[k] = r[0];
        } catch {}
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    return { name, tracks: tracks.filter(Boolean) };
  });
