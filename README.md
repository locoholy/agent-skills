# agent-skills

Every agent skill I run, in one place: the ones I wrote, the third-party ones pinned to
an exact upstream revision, and links to the two that live in their own homes. Any agent
that speaks the Agent Skills format (Claude Code, Codex, Grok, Cursor, Gemini CLI, Cline,
OpenCode, Antigravity, …) can install from here.

## Skills

| Skill | Version | Source | What it does |
| --- | --- | --- | --- |
| `mind` | 1.1.0 | [locoholy/mind](https://github.com/locoholy/mind) — own repo | A way of thinking for agents: question, delete, simplify, accelerate, automate. Refactoring, architecture, brainstorms. |
| `occams-razor` | 1.0.0 | [tjboudreaux/cc-thinking-skills](https://github.com/tjboudreaux/cc-thinking-skills) `@a31e22d` (MIT) | Enumerate competing hypotheses on a bug, count the assumptions each needs, test the cheapest first. |
| `second-order-thinking` | 1.0.0 | [tjboudreaux/cc-thinking-skills](https://github.com/tjboudreaux/cc-thinking-skills) `@a31e22d` (MIT) | Run the "and then what?" chain before adding a service, cache, abstraction, or dependency. |
| `smart-web-read` | 1.7.1 | [locoholy/smart-web-kit](https://github.com/locoholy/smart-web-kit) — own repo | Read any web page as clean Markdown via the `swr` binary, escalating from plain HTTP to real Chrome to the page's own API JSON. |
| `impeccable` | 4.1.1 | [impeccable.style](https://impeccable.style) — third-party, own updater | Design and audit frontend interfaces. |

`occams-razor` and `second-order-thinking` are real skill directories here and install
through the [skills](https://skills.sh) CLI. The rest live in their own homes and are listed
so this repo is the one index of what is in use; install them from below.

## Install

```bash
# everything published in this repo, into every agent the CLI detects
npx skills add locoholy/agent-skills -g

# one skill, into one agent
npx skills add locoholy/agent-skills -g -s occams-razor -a claude-code
```

The CLI installs one real copy under `~/.agents/skills/<name>` and symlinks the agent
directories to it. Use `--copy` only for an agent that cannot follow symlinks.

The skills that live elsewhere:

```bash
# mind has its own repo
npx skills add locoholy/mind -g

# smart-web-read ships with the `swr` binary — the binary is the point of the kit
git clone https://github.com/locoholy/smart-web-kit && cd smart-web-kit && ./install.sh
swr init                     # deploy the skill into every agent root you already have

# impeccable carries its own installer and updater
npx impeccable update
```

## Update

```bash
npx skills update -g                        # the skills published here
node scripts/upstream.mjs check             # third-party skills: pinned text still matching? upstream moved?
node scripts/upstream.mjs update <name>     # take upstream's current body, keep our frontmatter, re-pin the commit
```

`scripts/upstream.mjs` reads `upstream.json`, which records every third-party skill's
repository, path, license, and pinned revision. See [UPSTREAM.md](UPSTREAM.md) for why
those two are pinned rather than tracking upstream.

## Editing

`skills/<name>/SKILL.md` is the source of truth. The global install `~/.agents/skills/<name>`
is a symlink back into this repository, and every agent directory (`~/.claude/skills`,
`~/.codex/skills`, `~/.grok/skills`, `~/.gemini/skills`, …) is a symlink to that, so editing
here takes effect immediately in every agent without reinstalling.

Versioning is deliberately minimal: the version lives in the skill's own frontmatter, and
each release is a git tag, so `git log`/`git diff` show what changed between releases.
