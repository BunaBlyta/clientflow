# 2026-08-28 — Claude Code — phone number validation on Edit profile

Added client-side phone validation to `mobile/app/(app)/account/edit-profile.tsx`. The field stays optional (blank is fine, matching `account.phoneOptional`), but a non-empty value is now checked against a loose format — optional leading `+`, digits/spaces/`()`/`-`/`.`, and 7-15 digits total — before Save proceeds. Failing validation shows a localized error (`account.invalidPhone`, added to en/sq/de) in the same spot as the existing name-required error, and blocks the save the same way.

Deliberately loose rather than a strict per-country format, since this app has no country/locale field to key formatting off of and the studio's clients are presumably international. The backend (`app/api/auth/me/route.ts`, API lane's file — not touched here) still accepts any trimmed string; this is purely a client-side guard against obvious garbage input.

## Files touched

- `mobile/app/(app)/account/edit-profile.tsx`
- `mobile/lib/i18n.ts` (new `account.invalidPhone` key, en/sq/de)

## Verification

- `npx tsc --noEmit` from `mobile/` passes.
- Not run on a device this session.
