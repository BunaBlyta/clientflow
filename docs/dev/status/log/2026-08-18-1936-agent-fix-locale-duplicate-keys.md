# 2026-08-18 19:36 — Fix duplicate locale keys

Removed duplicate `settings.packagesIntro` properties from the German and Albanian locale extension objects. The duplicate object keys were causing Vercel’s TypeScript phase to fail; the middleware message in the deploy log is only a deprecation warning.

No checks or commit run, per user instruction.
