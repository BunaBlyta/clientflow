# STATUS.md

The shared memory between sessions and between agents. Every agent (Claude Code, Codex CLI) reads this before starting and appends to it before stopping. Newest entry on top. Don't delete old entries — this is the log of *why* things are the way they are, not just *what*.

---

## Template for each entry

```
### [YYYY-MM-DD HH:MM] — [agent: Claude Code / Codex] — [task name]
Changed:
- ...
Tried and abandoned (what didn't work, and why):
- ...
Left for next session:
- ...
Assumptions made (flag if wrong):
- ...
Blockers:
- ...
```

Write every entry in plain language a non-engineer could follow — see AGENTS.md section 7. "Tried and abandoned" matters as much as "Changed": if an approach got tried and dropped, say so and say why, so nobody re-tries the same dead end later, and so there's an honest record of the problem-solving that happened, not just the polished result.

---

### [example — delete once real entries exist]
### 2026-08-10 10:00 — Claude Code — initial scaffold
Changed:
- Set up repo structure, AGENTS.md, CLAUDE.md
Left for next session:
- Nothing built yet — waiting on SPEC.md to be filled in
Assumptions made:
- None yet
Blockers:
- None
