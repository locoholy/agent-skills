# Upstream sources

Not every skill in use was written here. This file records where the others come from,
under what license, and which revision is pinned. `upstream.json` is the machine-readable
form of the same table; `scripts/upstream.mjs` reads it.

| Skill | Source | Revision | License |
| --- | --- | --- | --- |
| `occams-razor` | [tjboudreaux/cc-thinking-skills](https://github.com/tjboudreaux/cc-thinking-skills) `skills/thinking-occams-razor/SKILL.md` | `a31e22d` | MIT, Copyright (c) 2025 TJ Boudreaux |
| `second-order-thinking` | [tjboudreaux/cc-thinking-skills](https://github.com/tjboudreaux/cc-thinking-skills) `skills/thinking-second-order/SKILL.md` | `a31e22d` | MIT, Copyright (c) 2025 TJ Boudreaux |
| `smart-web-read` | [locoholy/smart-web-kit](https://github.com/locoholy/smart-web-kit) — own repository | tracks that repo | MIT |
| `impeccable` | [impeccable.style](https://impeccable.style) — own updater, not vendored | 4.1.1 installed | third-party |

Both vendored skills are byte-for-byte the text of `a31e22d` (2026-02-05), the last
revision of those files before their catalog rework. Upstream then revised
`thinking-occams-razor` once more at `e0bb0d9` (trigger cards) and deleted it at `733353c`;
`thinking-second-order` was rewritten at `c2e4a73` as a leaner agent contract. The bodies
we run are deliberately the earlier revisions, so they are pinned rather than tracked.
Only the frontmatter differs from upstream: `name`, `license`, and a `metadata.upstream`
block recording the source and commit.

## Keeping the pinned copies current

```bash
node scripts/upstream.mjs check              # do our copies match the pinned text? has upstream moved?
node scripts/upstream.mjs update <name>      # replace the body with upstream's current text, re-pin the commit
node scripts/upstream.mjs update --all
```

`check` reads the pinned revision from GitHub, so it needs `gh` on PATH (authenticated) or
`GITHUB_TOKEN` in the environment. Per skill it reports:

- `match` / `DIFFERS` — whether the body we ship is byte-for-byte the body of the pinned commit.
- `current <sha> (same text as pinned)` — upstream's newest revision of that path is identical.
- `UPDATE AVAILABLE: <sha> differs from pinned` — upstream moved; the body is *not* taken
  automatically, because an upstream rewrite is exactly what happened to
  `second-order-thinking`. Review the diff first.
- `upstream deleted the file (last revision <sha>)` — the pinned text is final; nothing to pull.

`update` never touches our frontmatter: the local `name`, `description`, `license`, and
`metadata` survive, and only the body and the pinned commit change. It reports the new
commit and body size, and leaves the diff for review.

For `impeccable`, `check` only compares the installed version against
`https://impeccable.style/api/version`; run `npx impeccable update` to move it.
