# Setup guide: Claude Desktop + Claude Code + Codex CLI on one repo

## 1. Repo structure

```
/your-app
  AGENTS.md          <- single source of truth. Codex CLI reads natively, Claude Code via import.
  CLAUDE.md           <- one line: "@AGENTS.md". Never add instructions here directly.
  STATUS.md           <- running session log both agents read/write. This is the memory.
  /docs
    SPEC.md           <- feature list + definition of done per feature. What to build.
    ARCHITECTURE.md    <- system map + decisions log. Why it's built that way.
  /src ...
```

Create the folder, drop the files from this batch in (`AGENTS.md`, `CLAUDE.md`, `STATUS.md` at root; `docs_SPEC.md` → `/docs/SPEC.md`, `docs_ARCHITECTURE.md` → `/docs/ARCHITECTURE.md`), then connect that folder to your Claude Desktop project before doing anything else — Claude can't see or edit files it isn't explicitly pointed at. Fill in the placeholders by running `KICKOFF_PROMPT.md` as your first message there, rather than hand-filling them yourself.

## 2. The Claude Desktop project description

Keep it short. Its job is to frame the role, not duplicate content that already lives in the files (duplication is how the two drift and start contradicting each other). Something like:

> You're the planning/architecture layer for [app name]. Heavy implementation happens in the connected repo via Claude Code and Codex CLI sessions. Before answering anything about the project, read AGENTS.md and STATUS.md at the repo root — they're the current source of truth, not your memory of earlier conversations. When asked to plan a feature, write the spec into /docs/SPEC.md rather than just answering in chat, so the coding agents can pick it up.

Attach the repo folder as project knowledge (or connect it directly, since you're on Cowork). Don't paste the file contents into the description field itself — link to them, so there's one copy.

## 3. Running Claude Code and Codex CLI in parallel without them stepping on each other

The failure mode to design around: two agents editing the same files on the same checkout causes stashing, branch-switch interruptions, and merge conflicts. The fix is **git worktrees** — each agent gets its own directory and branch off the same repo, so they never touch each other's working state.

```bash
git worktree add ../your-app-feature-x -b feature-x
git worktree add ../your-app-feature-y -b feature-y
```

Run Claude Code in one worktree, Codex CLI in the other. Two patterns for splitting work:

- **Parallel, separated scope** — give each agent a task that touches a different part of the codebase (e.g. Claude on the API, Codex on the UI). Fastest, but only works once the interface between the two is nailed down in `ARCHITECTURE.md` first — otherwise they'll build against assumptions that don't match.
- **Sequential, cross-review** — one agent implements, the other reviews the diff before it merges to `main`. Slower per-task but catches more bugs, because the two models have different blind spots. Good default for anything demo-critical, since you said this needs to show quality, not just speed.

Either way: merges to `main` go through a PR you (or the other agent) actually look at — never both agents pushing straight to `main`.

## 4. What "fast without sacrificing quality" actually looks like here

The order that avoids rework:

1. Fill in `SPEC.md` and `ARCHITECTURE.md` *before* either agent writes code. Vague specs are the single biggest source of agents building the wrong thing fast, which is slower than building the right thing slowly.
2. Scaffold with one agent first (project structure, core data model, one thin end-to-end slice working).
3. Parallelize remaining features across worktrees once the architecture is stable enough that the agents aren't guessing at each other's interfaces.
4. Tests are non-negotiable gates, not nice-to-haves — put "tests pass" in the definition of done in `AGENTS.md` so agents can't mark something finished without it. This is what lets you go fast without it becoming sloppy.
5. You review PRs, not raw diffs from every session — batch your attention at merge points instead of babysitting every tool call.

## 5. Common failure modes to watch for

- **Context loss between sessions** → fixed by `STATUS.md` being mandatory reading/writing every session.
- **Scope creep from vague asks** → fixed by `SPEC.md` having explicit definition-of-done per feature, and an explicit "out of scope" list.
- **Two agents clobbering the same files** → fixed by worktrees + assigning non-overlapping scope.
- **Silent regressions** → fixed by making tests part of "done," not optional.
- **Architecture drift** (docs say one thing, code does another) → fixed by requiring `ARCHITECTURE.md` updates in the same session as structural changes.

Run `KICKOFF_PROMPT.md` to surface which of these (or others) are actually biting *you* specifically, rather than guessing generically.
