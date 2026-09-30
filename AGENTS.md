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

- Keep homepage discovery in dedicated presentation components that consume the existing Supabase-hydrated catalogue; this preserves ordering, auth, and vendor visibility rules.
- Render homepage partner banners from advertised_vendors_public and use neutral editorial fallback slides when no ads are active; this avoids inventing paid offers.
- Fetch all approved vendors' posts separately for business profiles while keeping the shared marketplace catalogue available-only, so hidden and sold-out listings never enter discovery rails.
