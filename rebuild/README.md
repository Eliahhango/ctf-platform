# CTF Platform Rebuild (Legal Clean-Room)

This scaffold is for rebuilding equivalent features without copying proprietary server code.

## Current Status
- SPA route fallbacks configured for static snapshot.
- API skeleton created with major route groups:
  - account
  - team
  - game
  - posts
  - tokens
  - admin
  - edit

## Next Implementation Steps
1. Add PostgreSQL schema (users, teams, games, challenges, submissions, posts).
2. Add JWT auth + role guard for admin routes.
3. Add challenge container lifecycle service.
4. Replace API TODO handlers with real services.
5. Build React admin/client pages on top of existing design system.

## Run
```bash
cd rebuild
npm install
npm run dev:api
npm run dev:web
```