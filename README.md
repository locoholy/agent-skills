# agent-skills

Personal agent skills, versioned and shared through the [skills](https://skills.sh) CLI. Any agent that supports the Agent Skills format (Claude Code, Codex, Grok, Cursor, Gemini CLI, Cline, OpenCode, Antigravity, …) can install them.

## Skills

| Skill | Version | What it does |
| --- | --- | --- |
| `mind` | 1.1.0 | Delete-first refactoring and cleanup algorithm with measurable stop criteria. |
| `occams-razor` | 1.0.0 | Enumerate competing hypotheses on a bug, count the assumptions each needs, test the cheapest first. |
| `second-order-thinking` | 1.0.0 | Run the "and then what?" chain before adding a service, cache, abstraction, or dependency. |

## Install

```bash
# everything, into every agent the CLI detects
npx skills add locoholy/agent-skills -g

# one skill, into one agent
npx skills add locoholy/agent-skills -g -s mind -a claude-code
```

The CLI installs a real copy once under `~/.agents/skills/<name>` and symlinks the agent directories to it, so updates stay in one place. Use `--copy` only for an agent that cannot follow symlinks.

## Update

```bash
npx skills update -g
```

## Editing

`skills/<name>/SKILL.md` is the source of truth. The global install `~/.agents/skills/<name>` is a symlink back into this repository, and every agent directory (`~/.claude/skills`, `~/.codex/skills`, `~/.grok/skills`, `~/.gemini/skills`, …) is a symlink to that, so editing here takes effect immediately in every agent without reinstalling.

Versioning is deliberately minimal: the version lives in the skill's own frontmatter, and each release is a git tag, so `git log`/`git diff` show what changed between releases.
