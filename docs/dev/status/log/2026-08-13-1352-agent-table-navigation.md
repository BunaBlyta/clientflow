# Staff table navigation and detail pages

Date: 2026-08-13 13:52
Lane: Web UI

## Completed

- Made project, client, standard request, and custom inquiry rows navigate to their detail pages while preserving keyboard access.
- Kept nested action controls isolated from row navigation.
- Added API-backed detail pages for clients, requests, and custom inquiries.
- Linked related projects to the existing project detail route.
- Displayed custom inquiry conversion context honestly as an email match supplied by the API.

## Verification

- Tests, typecheck, lint, webpack build, and diff check passed.
- `npm run verify` reached the normal Turbopack build after passing typecheck, lint, and tests; the build was blocked by the sandbox’s inability to fetch Google Fonts. `npx next build --webpack` passed.
