<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Music search uses YouTube Music innertube (WEB_REMIX) via a server function in src/lib/innertube.functions.ts; playback uses the hidden YouTube IFrame player in src/lib/player.tsx — no API keys, and direct stream URLs need deciphering that breaks often.
- Liked songs, playlists, history and volume live in localStorage (no login by design).

- Material-style surfaces use the shared glass-surface utility and semantic theme tokens; interactive controls use the shared Button variants to keep state and focus styling consistent.
